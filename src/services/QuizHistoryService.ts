import { MainDataType } from '@/types/MainDataType';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { read, update, write } from './StorageService';

const KEY = MainStorageKeyType.USER_QUIZ_HISTORY;

/** 기록이 아직 없을 때의 기본값 — 화면에서 옵셔널 체이닝을 반복하지 않도록 빈 값을 채워 둔다. */
const emptyHistory = (): MainDataType.UserQuizHistory => ({
	correctProverbId: [],
	wrongProverbId: [],
	lastAnsweredAt: new Date(0),
	quizCounts: {},
	badges: [],
	totalScore: 0,
	bestCombo: 0,
});

/**
 * 퀴즈 기록(점수·뱃지·오답) 도메인 서비스.
 *
 * 홈(출석 뱃지), 퀴즈 화면(점수/오답), 일일 미션(보너스 점수)이 같은 키를 쓴다.
 * 부분 수정은 반드시 `patch()` 를 거쳐야 서로의 변경을 덮어쓰지 않는다.
 */
class QuizHistoryService {
	/** 퀴즈 기록 저장 (전체 교체) */
	saveQuizHistory = async (data: MainDataType.UserQuizHistory): Promise<void> => {
		await write(KEY, data);
	};

	/** 퀴즈 기록 불러오기 — 없으면 null */
	getQuizHistory = async (): Promise<MainDataType.UserQuizHistory | null> => {
		const stored = await read<MainDataType.UserQuizHistory | null>(KEY, null);
		return stored;
	};

	/** 퀴즈 기록 불러오기 — 없으면 빈 기록 (필드가 항상 존재한다) */
	getQuizHistoryOrEmpty = async (): Promise<MainDataType.UserQuizHistory> => read(KEY, emptyHistory());

	/**
	 * 기록을 읽고 → 바꾸고 → 저장한다. 같은 키의 다른 수정과 겹치지 않는다.
	 *
	 * ```ts
	 * await QuizHistoryService.patch((history) => ({ totalScore: history.totalScore + 10 }));
	 * ```
	 */
	patch = async (
		mutate: (history: MainDataType.UserQuizHistory) => Partial<MainDataType.UserQuizHistory>,
	): Promise<MainDataType.UserQuizHistory> =>
		update(KEY, emptyHistory(), (current) => ({ ...current, ...mutate(current) }));

	/**
	 * 뱃지를 추가한다(중복 제거).
	 * @returns 이번에 새로 추가된 뱃지 id 목록
	 */
	addBadges = async (badgeIds: string[]): Promise<string[]> => {
		if (badgeIds.length === 0) {
			return [];
		}
		let added: string[] = [];
		await this.patch((history) => {
			const existing = history.badges ?? [];
			added = badgeIds.filter((id) => !existing.includes(id));
			return added.length > 0 ? { badges: [...existing, ...added] } : {};
		});
		return added;
	};

	/** 점수를 더한다 */
	addScore = async (delta: number): Promise<number> => {
		const next = await this.patch((history) => ({ totalScore: (history.totalScore ?? 0) + delta }));
		return next.totalScore;
	};

	/** 오답 속담 ID 배열 반환 */
	getWrongProverbIds = async (): Promise<number[]> => (await this.getQuizHistoryOrEmpty()).wrongProverbId ?? [];

	/** 정답 속담 ID 배열 반환 */
	getCorrectProverbIds = async (): Promise<number[]> => (await this.getQuizHistoryOrEmpty()).correctProverbId ?? [];

	/** 총 점수 반환 */
	getTotalScore = async (): Promise<number> => (await this.getQuizHistoryOrEmpty()).totalScore ?? 0;

	/** 마지막 퀴즈일 반환 */
	getLastAnsweredAt = async (): Promise<Date | null> => {
		const history = await this.getQuizHistory();
		return history?.lastAnsweredAt ? new Date(history.lastAnsweredAt) : null;
	};

	/** 베스트 콤보 반환 */
	getBestCombo = async (): Promise<number> => (await this.getQuizHistoryOrEmpty()).bestCombo ?? 0;

	/** 퀴즈 횟수 통계 반환 */
	getQuizCountMap = async (): Promise<{ [id: number]: number }> => (await this.getQuizHistoryOrEmpty()).quizCounts ?? {};

	/** 뱃지 목록 반환 */
	getBadgeList = async (): Promise<string[]> => (await this.getQuizHistoryOrEmpty()).badges ?? [];
}

export default new QuizHistoryService();
