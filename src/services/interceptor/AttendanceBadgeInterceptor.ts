/**
 * 출석 기반 뱃지 인터셉터
 * - 누적 출석일 수(checkInCount)를 기준으로 신규 획득 뱃지 id 목록을 반환합니다.
 * - 이미 보유한 뱃지(existingBadges)는 제외합니다.
 */
export const AttendanceBadgeInterceptor = (checkInCount: number, existingBadges: string[] = []): string[] => {
	const newBadges: string[] = [];
	const existing = new Set(existingBadges);

	// CONST_BADGES 의 attend_* 와 동일한 임계값
	const thresholds = [1, 5, 10, 20, 30, 50, 100, 150, 200, 300];

	thresholds.forEach((n) => {
		const id = `attend_${n}`;
		if (!existing.has(id) && checkInCount >= n) {
			newBadges.push(id);
		}
	});

	return newBadges;
};

export default AttendanceBadgeInterceptor;
