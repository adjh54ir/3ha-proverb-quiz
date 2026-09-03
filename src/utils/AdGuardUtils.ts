import DateUtils from '@/utils/DateUtils';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { read, update } from '@/services/StorageService';

/**
 * 광고 클릭 가드 (무효 트래픽 방지)
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────
 * 한 기기에서 하루에 광고를 여러 번 클릭하면 AdMob 은 이를 **무효 트래픽(invalid traffic)** 으로
 * 본다. 자동 클릭이든 사용자가 실수로 반복해서 눌렀든 판정은 같고, 누적되면 수익 차감을 넘어
 * 계정 정지까지 간다. 사용자를 의심해서가 아니라 계정을 지키기 위한 안전장치다.
 *
 * 그래서 하루 클릭이 한도(5회)에 닿으면 그날은 **전면 광고를 띄우지 않는다.**
 * 전면 광고는 화면을 가득 덮어 오클릭이 가장 잘 나는 형식이라 여기부터 끊는다.
 * 배너는 계속 노출한다 — 화면 한 줄이라 실수로 눌릴 확률이 낮고, 전부 끄면 수익이 0 이 된다.
 *
 * ── 하루의 기준 ────────────────────────────────────────────────
 * 기기 타임존 기준 로컬 날짜다(`DateUtils.getLocalDateString`). UTC 로 세면 KST 사용자는
 * 오전 9시에 카운터가 리셋돼 하루가 두 번 시작한다.
 */

/** 하루 허용 광고 클릭 수. 이 수에 닿으면 그날은 전면 광고를 띄우지 않는다. */
export const DAILY_AD_CLICK_LIMIT = 5;

interface AdClickRecord {
	/** 'YYYY-MM-DD' (기기 로컬 날짜) */
	date: string;
	count: number;
}

const EMPTY: AdClickRecord = { date: '', count: 0 };

/** 오늘 기록이 아니면 0 부터 시작한 것으로 본다(날짜가 바뀌면 자동 리셋). */
const todayCount = (record: AdClickRecord, today: string): number => (record.date === today ? record.count : 0);

/**
 * 광고 클릭을 1회 기록한다.
 *
 * 배너/전면/리워드 어디서 눌렸든 같은 카운터에 쌓는다 — AdMob 도 형식을 나눠서 보지 않는다.
 * 읽기-수정-쓰기는 StorageService.update 가 키 단위로 줄 세워 주므로, 광고 두 개가 거의 동시에
 * 클릭돼도 카운트가 하나로 뭉개지지 않는다.
 *
 * @returns 기록 후 오늘의 누적 클릭 수
 */
export const recordAdClick = async (): Promise<number> => {
	const today = DateUtils.getLocalDateString();
	const next = await update<AdClickRecord>(MainStorageKeyType.AD_CLICK_GUARD, EMPTY, (current) => ({
		date: today,
		count: todayCount(current, today) + 1,
	}));
	return next.count;
};

/** 오늘 누적 광고 클릭 수 */
export const getTodayAdClickCount = async (): Promise<number> => {
	const today = DateUtils.getLocalDateString();
	const current = await read<AdClickRecord>(MainStorageKeyType.AD_CLICK_GUARD, EMPTY);
	return todayCount(current, today);
};

/**
 * 오늘은 전면 광고를 띄우면 안 되는가.
 * 저장소를 읽지 못하면 `false`(= 광고 허용)를 돌려준다. 읽기 실패로 수익이 0 이 되는 것보다는
 * 한 번 더 노출되는 쪽이 낫고, StorageService.read 는 실패 시 기본값을 주므로 여기까지 오지 않는다.
 */
export const isInterstitialBlocked = async (): Promise<boolean> => (await getTodayAdClickCount()) >= DAILY_AD_CLICK_LIMIT;
