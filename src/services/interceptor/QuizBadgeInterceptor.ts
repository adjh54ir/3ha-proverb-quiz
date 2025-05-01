import { CountryType } from '@/types/CountryType';
import { MainDataType } from '@/types/MainDataType';

/**
 * 퀴즈 기반 뱃지 인터셉터
 */
export const QuizBadgeInterceptor = (
	history: MainDataType.UserQuizHistory,
	allCountries: CountryType.CountryInfo[],
): string[] => {
	const newBadges: string[] = [];
	const correctSet = new Set(history.correctProverbId);

	const byRegion = (region: string) => allCountries.filter((c) => c.region === region);
	const byPopulation = (min: number, max?: number) =>
		allCountries.filter((c) => c.population >= min && (max ? c.population < max : true));
	const allCorrect = (list: CountryType.CountryInfo[]) =>
		list.length > 0 && list.every((c) => !!c.capital && correctSet.has(c.cca3)); // 수도가 있어야만 true

	// 지역별 마스터
	const regionBadges = [
		{ id: 'europe_master', region: 'Europe' },
		{ id: 'asia_master', region: 'Asia' },
		{ id: 'americas_master', region: 'Americas' },
		{ id: 'africa_master', region: 'Africa' },
		{ id: 'oceania_master', region: 'Oceania' },
		{ id: 'antarctica_master', region: 'Antarctic' },
	];
	// 유저가 푼 문제 집합 생성 (정답 + 오답)
	const solvedSet = new Set([...(history.correctProverbId ?? []), ...(history.wrongProverbId ?? [])]);

	// 대륙별 마스터 조건 변경: 해당 대륙 국가의 문제를 모두 풀었는지만 체크
	regionBadges.forEach(({ id, region }) => {
		const regionList = byRegion(region).filter((c) => !!c.capital); // 수도 있는 국가만
		const allSolved = regionList.length > 0 && regionList.every((c) => solvedSet.has(c.cca3));

		if (!history.badges.includes(id) && allSolved) {
			newBadges.push(id);
		}
	});

	// 인구 레벨별 마스터
	const levelBadges = [
		{ id: 'level1_master', min: 50_000_000 },
		{ id: 'level2_master', min: 10_000_000, max: 50_000_000 },
		{ id: 'level3_master', min: 1_000_000, max: 10_000_000 },
		{ id: 'level4_master', min: 0, max: 1_000_000 },
	];

	// 레벨별 마스터 조건 변경: 해당 레벨의 국가의 문제를 모두 풀었는지만 체크
	levelBadges.forEach(({ id, min, max }) => {
		const levelList = byPopulation(min, max).filter((c) => !!c.capital); // 수도 있는 국가만
		const allSolved = levelList.length > 0 && levelList.every((c) => solvedSet.has(c.cca3));

		if (!history.badges.includes(id) && allSolved) {
			newBadges.push(id);
		}
	});

	// 누적 정답 뱃지
	const totalSolvedCount = (history.correctProverbId?.length ?? 0) + (history.wrongProverbId?.length ?? 0);

	if (!history.badges.includes('quiz_1') && totalSolvedCount >= 1) newBadges.push('quiz_1');
	if (!history.badges.includes('quiz_10') && totalSolvedCount >= 10) newBadges.push('quiz_10');
	if (!history.badges.includes('quiz_50') && totalSolvedCount >= 50) newBadges.push('quiz_50');
	if (!history.badges.includes('quiz_100') && totalSolvedCount >= 100) newBadges.push('quiz_100');
	if (!history.badges.includes('quiz_200') && totalSolvedCount >= 200) newBadges.push('quiz_200');

	// 콤보 뱃지
	const bestCombo = history.bestCombo ?? 0;
	if (!history.badges.includes('combo_3') && bestCombo >= 3) newBadges.push('combo_3');
	if (!history.badges.includes('combo_5') && bestCombo >= 5) newBadges.push('combo_5');
	if (!history.badges.includes('combo_10') && bestCombo >= 10) newBadges.push('combo_10');
	if (!history.badges.includes('combo_15') && bestCombo >= 15) newBadges.push('combo_15');
	if (!history.badges.includes('combo_20') && bestCombo >= 20) newBadges.push('combo_20');

	// 총점 기준 뱃지
	const totalScore = history.totalScore ?? 0;
	if (!history.badges.includes('score_traveler') && totalScore >= 600) {
		newBadges.push('score_traveler');
	}
	if (!history.badges.includes('score_conqueror') && totalScore >= 1200) {
		newBadges.push('score_conqueror');
	}
	if (!history.badges.includes('score_explorer') && totalScore >= 1800) {
		newBadges.push('score_explorer');
	}
	if (!history.badges.includes('score_master') && totalScore >= 2460) {
		newBadges.push('score_master');
	}
	// 세계수도 마스터
	if (
		!history.badges.includes('world_master') &&
		allCountries.length > 200 &&
		allCountries.every((c) => correctSet.has(c.cca3))
	) {
		newBadges.push('world_master');
	}

	return newBadges;
};
