import { MainDataType } from '@/types/MainDataType';

export interface UserQuizHistory {
	correctProverbId: number[];
	wrongProverbId: number[];
	lastAnsweredAt: Date | string;
	quizCounts: { [id: number]: number };
	badges: string[];
	totalScore: number;
	bestCombo?: number;
}

/**
 * 레벨별 마스터 뱃지 매핑.
 * 뱃지 상세의 진행도 표시도 이 값을 그대로 읽는다 — 지급 기준과 표시 기준이 갈라지지 않게 한 곳에 둔다.
 */
export const BADGE_LEVEL_META = [
	{ level: '초급', badgeId: 'level_easy_1' },
	{ level: '중급', badgeId: 'level_easy_2' },
	{ level: '고급', badgeId: 'level_medium' },
	{ level: '특급', badgeId: 'level_hard' },
];

/** 카테고리별 마스터 뱃지 매핑 (BADGE_LEVEL_META 와 같은 이유로 밖으로 뺀다) */
export const BADGE_CATEGORY_META = [
	{ category: '운/우연', badgeId: 'category_luck' },
	{ category: '인간관계', badgeId: 'category_relation' },
	{ category: '세상 이치', badgeId: 'category_life' },
	{ category: '근면/검소', badgeId: 'category_diligence' },
	{ category: '노력/성공', badgeId: 'category_effort' },
	{ category: '경계/조심', badgeId: 'category_caution' },
	{ category: '욕심/탐욕', badgeId: 'category_greed' },
	{ category: '배신/불신', badgeId: 'category_betrayal' },
];

export const QuizBadgeInterceptor = (history: MainDataType.UserQuizHistory, allProverbs: MainDataType.Proverb[]): string[] => {
	const newBadges: string[] = [];
	const correctSet = new Set(history.correctProverbId);
	const solvedSet = new Set([...(history.correctProverbId ?? []), ...(history.wrongProverbId ?? [])]);

	// 레벨별 마스터 조건 (난이도별 속담 정복 여부)
	BADGE_LEVEL_META.forEach(({ level, badgeId }) => {
		const levelList = allProverbs.filter((p) => p.levelName === level);
		const allSolved = levelList.length > 0 && levelList.every((p) => solvedSet.has(p.id));
		if (!history.badges.includes(badgeId) && allSolved) {
			newBadges.push(badgeId);
		}
	});

	// 카테고리별 마스터 뱃지 (정복한 주제)
	BADGE_CATEGORY_META.forEach(({ category, badgeId }) => {
		const categoryList = allProverbs.filter((p) => p.category === category);
		const allSolved = categoryList.length > 0 && categoryList.every((p) => solvedSet.has(p.id));
		if (!history.badges.includes(badgeId) && allSolved) {
			newBadges.push(badgeId);
		}
	});

	// 퀴즈 누적 횟수 뱃지
	const totalSolved = (history.correctProverbId?.length ?? 0) + (history.wrongProverbId?.length ?? 0);
	const quizThresholds = [1, 10, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 2500, 3000];
	quizThresholds.forEach((n) => {
		const id = `quiz_${n}`;
		if (!history.badges.includes(id) && totalSolved >= n) newBadges.push(id);
	});

	// 콤보 뱃지
	const comboThresholds = [3, 5, 10, 15, 20];
	comboThresholds.forEach((n) => {
		const id = `combo_${n}`;
		if (!history.badges.includes(id) && (history.bestCombo ?? 0) >= n) newBadges.push(id);
	});

	// 캐릭터 획득 milestone과 동일: 100/200/500/1,000/2,000문제
	const scoreThresholds = [1000, 2000, 5000, 10000, 20000];
	scoreThresholds.forEach((score) => {
		const id = `score_${score}`;
		if (!history.badges.includes(id) && (history.totalScore ?? 0) >= score) newBadges.push(id);
	});

	// 전체 퀴즈 정복
	if (!history.badges.includes('quiz_all') && allProverbs.every((p) => solvedSet.has(p.id))) {
		newBadges.push('quiz_all');
	}

	return newBadges;
};
