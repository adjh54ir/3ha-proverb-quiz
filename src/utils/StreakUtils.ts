/**
 * 연속 출석(스트릭) 계산 유틸
 * - 출석한 날짜 문자열('YYYY-MM-DD') 목록으로 현재/최고 연속일과 총 출석일을 파생 계산합니다.
 * - 별도 저장 없이 출석 데이터만으로 매번 계산합니다.
 */

export interface StreakInfo {
	/** 오늘(또는 어제까지 이어진) 기준 현재 연속 출석일 */
	current: number;
	/** 역대 최고 연속 출석일 */
	best: number;
	/** 총 출석일 수 */
	total: number;
	/** 오늘 출석 완료 여부 */
	checkedToday: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = (s: string): Date => {
	const [y, m, d] = s.split('-').map(Number);
	return new Date(y, m - 1, d);
};
const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);

/**
 * 연속 출석 정보 계산
 * @param dateStrings 출석 완료된 날짜('YYYY-MM-DD') 배열 (중복/정렬 무관)
 * @param todayStr 오늘 날짜('YYYY-MM-DD')
 */
export const calcStreak = (dateStrings: string[], todayStr: string): StreakInfo => {
	const uniq = Array.from(new Set(dateStrings.filter(Boolean))).sort();
	const total = uniq.length;
	const checkedToday = uniq.includes(todayStr);

	if (total === 0) {
		return { current: 0, best: 0, total: 0, checkedToday: false };
	}

	// 최고 연속일
	let best = 1;
	let run = 1;
	for (let i = 1; i < uniq.length; i++) {
		const diff = dayDiff(toDate(uniq[i]), toDate(uniq[i - 1]));
		if (diff === 1) {
			run += 1;
			best = Math.max(best, run);
		} else if (diff !== 0) {
			run = 1;
		}
	}

	// 현재 연속일: 오늘 출석했으면 오늘부터, 아니면 어제부터 역방향으로 카운트
	const set = new Set(uniq);
	const today = toDate(todayStr);
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	let anchor: Date | null = null;
	if (set.has(fmt(today))) {
		anchor = today;
	} else if (set.has(fmt(yesterday))) {
		anchor = yesterday;
	}

	let current = 0;
	if (anchor) {
		const cur = new Date(anchor);
		while (set.has(fmt(cur))) {
			current += 1;
			cur.setDate(cur.getDate() - 1);
		}
	}

	return { current, best: Math.max(best, current), total, checkedToday };
};

export default calcStreak;
