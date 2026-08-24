import { MainDataType } from '@/types/MainDataType';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import { sampleSize } from '@/utils/ArrayUtils';
import DateUtils from '@/utils/DateUtils';
import { read, update } from './StorageService';

/**
 * '오늘의 퀴즈' 목록 도메인 서비스.
 *
 * 홈 / 오늘의 퀴즈 화면 / 일일 미션 팝업이 모두 같은 키를 읽고 쓰기 때문에,
 * 화면에서 직접 저장소를 만지면 서로의 변경을 덮어쓴다.
 * 쓰기는 전부 `update()` 를 거쳐 키 단위로 직렬화된다.
 */

const KEY = MainStorageKeyType.TODAY_QUIZ_LIST;
const EMPTY: MainDataType.TodayQuizList[] = [];

/** 하루에 출제되는 문제 수 */
export const TODAY_QUIZ_COUNT = 5;

/** 오늘 항목의 기본값 */
const createTodayItem = (dateKey: string): MainDataType.TodayQuizList => ({
	quizDate: dateKey,
	isCheckedIn: false,
	// sort(() => Math.random() - 0.5) 는 균등 셔플이 아니라 편향된다 → 부분 Fisher-Yates 사용
	todayQuizIdArr: sampleSize(CONST_MAIN_DATA.PROVERB, TODAY_QUIZ_COUNT).map((item) => item.id),
	correctQuizIdArr: [],
	worngQuizIdArr: [],
	answerResults: {},
	selectedAnswers: {},
});

/** 전체 목록 읽기 */
export const getAll = (): Promise<MainDataType.TodayQuizList[]> => read(KEY, EMPTY);

/** 지정한 날짜(기본: 오늘)의 항목 찾기 */
export const findByDate = (list: MainDataType.TodayQuizList[], dateKey: string): MainDataType.TodayQuizList | null =>
	list.find((item) => DateUtils.toLocalDateKey(item.quizDate) === dateKey) ?? null;

/** 오늘 항목 읽기 (없으면 null) */
export const getToday = async (): Promise<MainDataType.TodayQuizList | null> =>
	findByDate(await getAll(), DateUtils.getLocalDateString());

/**
 * 오늘 항목이 없으면 새로 만든다. 이미 있으면 그대로 둔다.
 * @returns 오늘 항목
 */
export const ensureToday = async (): Promise<MainDataType.TodayQuizList> => {
	const today = DateUtils.getLocalDateString();
	const list = await update(KEY, EMPTY, (current) => {
		if (findByDate(current, today)) {
			return undefined; // 이미 있으면 저장을 건너뛴다
		}
		return [...current, createTodayItem(today)];
	});
	// update 는 저장을 건너뛰면 읽은 값을 그대로 돌려주므로 항상 오늘 항목이 들어 있다.
	return findByDate(list, today) ?? createTodayItem(today);
};

/**
 * 오늘 항목을 부분 수정한다. 항목이 없으면 만들어서 수정한다.
 * @param patch 현재 오늘 항목을 받아 바꿀 필드만 돌려준다
 */
export const patchToday = async (
	patch: (today: MainDataType.TodayQuizList) => Partial<MainDataType.TodayQuizList>,
): Promise<MainDataType.TodayQuizList> => {
	const todayKey = DateUtils.getLocalDateString();
	const list = await update(KEY, EMPTY, (current) => {
		const existing = findByDate(current, todayKey) ?? createTodayItem(todayKey);
		const next = { ...existing, ...patch(existing) };
		const index = current.findIndex((item) => DateUtils.toLocalDateKey(item.quizDate) === todayKey);
		if (index === -1) {
			return [...current, next];
		}
		const copy = [...current];
		copy[index] = next;
		return copy;
	});
	return findByDate(list, todayKey)!;
};

/** 오늘 출석 처리 */
export const checkInToday = (): Promise<MainDataType.TodayQuizList> => patchToday(() => ({ isCheckedIn: true }));

/** 출석한 날짜 키 목록 */
export const getCheckedInDates = async (): Promise<string[]> =>
	(await getAll()).filter((item) => item.isCheckedIn).map((item) => DateUtils.toLocalDateKey(item.quizDate));
