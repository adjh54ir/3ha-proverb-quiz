import { MainDataType } from '@/types/MainDataType';

/**
 * 퀴즈 히스토리를 바탕으로 조건을 충족한 새로운 뱃지 목록을 반환합니다.
 */
export const BadgeInterceptor = (history: MainDataType.UserQuizHistory, allProverbs: MainDataType.Proverb[]): string[] => {
	const newBadges: string[] = [];
	const correctSet = new Set(history.correctProverbId);
	const currentBadges = new Set(history.badges);

	const isEligible = (id: string, condition: boolean) => {
		if (!currentBadges.has(id) && condition) newBadges.push(id);
	};

	// 1. 누적 정답 수 기준 뱃지
	const correctCount = history.correctProverbId.length;
	isEligible('quiz_1', correctCount >= 1);
	isEligible('quiz_10', correctCount >= 10);
	isEligible('quiz_50', correctCount >= 50);
	isEligible('quiz_100', correctCount >= 100);
	isEligible('quiz_150', correctCount >= 150);
	isEligible('quiz_200', correctCount >= 200);
	isEligible('quiz_300', correctCount >= 300);
	isEligible('quiz_400', correctCount >= 400);
	isEligible('quiz_500', correctCount >= 500);
	isEligible('quiz_600', correctCount >= 600);
	isEligible('quiz_700', correctCount >= 700);

	// 2. 점수 기반 마스터
	const score = history.totalScore ?? 0;
	const scoreBadges = [
		{ id: 'score_1000', threshold: 1000 },
		{ id: 'score_2000', threshold: 2000 },
		{ id: 'score_3000', threshold: 3000 },
		{ id: 'score_5000', threshold: 5000 },
		{ id: 'score_7000', threshold: 7000 },
		{ id: 'score_7900', threshold: 7900 },
	];
	scoreBadges.forEach(({ id, threshold }) => {
		isEligible(id, score >= threshold);
	});

	// 3. 콤보 기반
	const combo = history.bestCombo ?? 0;
	const comboBadges = [
		{ id: 'combo_3', combo: 3 },
		{ id: 'combo_5', combo: 5 },
		{ id: 'combo_10', combo: 10 },
		{ id: 'combo_15', combo: 15 },
		{ id: 'combo_20', combo: 20 },
	];
	comboBadges.forEach(({ id, combo: c }) => {
		isEligible(id, combo >= c);
	});

	// 4. 난이도 마스터
	const levelMap = new Map<number, string>([
		[1, 'level_easy_1'],
		[2, 'level_easy_2'],
		[3, 'level_medium'],
		[4, 'level_hard'],
	]);
	for (const [level, badgeId] of levelMap.entries()) {
		const filtered = allProverbs.filter((p) => p.level === level);
		const allCleared = filtered.length > 0 && filtered.every((p) => correctSet.has(p.id));
		isEligible(badgeId, allCleared);
	}

	// 5. 카테고리 마스터
	const categoryMap: { [key: string]: string } = {
		'운/우연': 'category_luck',
		인간관계: 'category_relation',
		'세상 이치': 'category_life',
		'근면/검소': 'category_diligence',
		'노력/성공': 'category_effort',
		'경계/조심': 'category_caution',
		'욕심/탐욕': 'category_greed',
		'배신/불신': 'category_betrayal',
	};
	for (const [category, badgeId] of Object.entries(categoryMap)) {
		const filtered = allProverbs.filter((p) => p.category === category);
		const allCleared = filtered.length > 0 && filtered.every((p) => correctSet.has(p.id));
		isEligible(badgeId, allCleared);
	}

	// 6. 전체 마스터
	isEligible('quiz_all', allProverbs.length > 0 && allProverbs.every((p) => correctSet.has(p.id)));

	return newBadges;
};
