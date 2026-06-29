// @/const/common/CommonCharacterData.tsx
//
// ─────────────────────────────────────────────────────────────
// 점수별 캐릭터(등급) 시스템 — 단일 소스(Single Source of Truth)
// ─────────────────────────────────────────────────────────────
// - 앱 전역에서 사용하는 "점수별 캐릭터(마스코트)" 데이터를 이 파일에서만 정의한다.
// - 등급 임계 점수는 고정값이 아니라 "전체 속담 수 × 문제당 점수"를 만점으로 보고
//   비율(ratio)로 자동 산정한다. → 속담 데이터가 늘어나도 코드 수정 없이 자동 반영.
// - 각 화면/모달은 이 파일의 LEVEL_DATA 와 헬퍼 함수만 사용한다.

import ProverbServices from '@/services/ProverbServices';

/** 정답 1문제당 획득 점수 */
export const SCORE_PER_QUESTION = 10;

/** 점수별 캐릭터(등급) 단일 항목 타입 */
export interface CharacterLevel {
	/** 등급 순번 (1: 최하위 ~ 6: 최상위) */
	id: number;
	/** 등급 명칭 */
	label: string;
	/** FontAwesome 아이콘 이름 */
	icon: string;
	/** 등급 대표 색상 */
	color: string;
	/** 만점 대비 시작 임계 비율(0~1) — 임계 점수 자동 산정 기준 */
	ratio: number;
	/** 등급 마스코트 이미지 */
	mascot: any;
	/** 짧은 격려 문구 */
	encouragement: string;
	/** 등급 상세 설명 */
	description: string;
}

/** 등급 산정에 사용할 점수가 매겨진 캐릭터 항목 (LEVEL_DATA 요소 타입) */
export interface ScoredCharacterLevel extends CharacterLevel {
	/** 해당 등급 시작 점수(이상) */
	score: number;
	/** 다음 등급 시작 점수(미만). 최상위 등급은 Infinity */
	next: number;
}

// ─────────────────────────────────────────────────────────────
// 등급 기본 정의 (비율 오름차순: 초심자 → 전설)
// ─────────────────────────────────────────────────────────────
const BASE_LEVELS: CharacterLevel[] = [
	{
		id: 1,
		label: '속담 초심자',
		icon: 'seedling',
		color: '#58D68D',
		ratio: 0.0,
		mascot: require('@/assets/images/level1_mascote.png'),
		encouragement: '🌱 첫걸음을 내디뎠어요!\n앞으로가 더욱 기대돼요!',
		description: '속담 학습의 출발선에 선 단계로,\n새싹처럼 작은 배움부터 차근차근 키워가는 시기예요.\n앞으로의 성장이 더욱 기대됩니다.',
	},
	{
		id: 2,
		label: '속담 입문자',
		icon: 'leaf',
		color: '#52BE80',
		ratio: 0.1,
		mascot: require('@/assets/images/level2_mascote.png'),
		encouragement: '🍃 좋은 출발이에요!\n조금씩 자신감이 붙고 있어요!',
		description: '기초 속담에 차츰 익숙해지고,\n다양한 표현을 접하며 감을 쌓아가는 단계예요.\n이제 막 본격적인 성장의 길에 들어섰습니다.',
	},
	{
		id: 3,
		label: '속담 숙련자',
		icon: 'tree',
		color: '#45B39D',
		ratio: 0.25,
		mascot: require('@/assets/images/level3_mascote.png'),
		encouragement: '🌳 지식이 뿌리내려 점점 자라고 있어요!\n이제 훨씬 더 능숙해졌네요!',
		description: '속담의 의미와 쓰임새를 제대로 이해하고,\n실전에서도 능숙하게 활용할 수 있는 단계예요.\n기초를 넘어 한층 성숙한 실력을 갖췄습니다.',
	},
	{
		id: 4,
		label: '속담 고수',
		icon: 'chess-knight',
		color: '#5DADE2',
		ratio: 0.45,
		mascot: require('@/assets/images/level4_mascote.png'),
		encouragement: '⚔️ 속담의 전장에서 승리하고 있어요!\n어떤 도전도 당당히 맞설 수 있네요!',
		description: '속담을 무기처럼 활용하며,\n어려운 문제도 당당히 맞설 수 있는 단계예요.\n탄탄한 자신감으로 진정한 실력을 보여줍니다.',
	},
	{
		id: 5,
		label: '속담 마스터',
		icon: 'trophy',
		color: '#F5B041',
		ratio: 0.7,
		mascot: require('@/assets/images/level5_mascote2.png'),
		encouragement: '👑 속담의 왕좌에 올랐습니다!\n당신은 이제 속담의 진정한 달인입니다!',
		description: '속담을 자유자재로 구사하며,\n누구에게나 귀감이 되는 지혜의 경지에 올랐습니다.\n속담의 참뜻을 깨닫고 삶에 녹여내는 최상위 단계예요.',
	},
	{
		id: 6,
		label: '속담 전설',
		icon: 'crown',
		color: '#E59866',
		ratio: 0.92,
		mascot: require('@/assets/images/level6_mascote.png'),
		encouragement: '🌌 전설이 되셨습니다!\n속담의 모든 지혜를 완전히 정복한 유일무이한 존재예요!',
		description: '거의 모든 속담을 정복하고,\n그 깊은 지혜를 삶 속에 온전히 녹여낸 최고의 경지예요.\n당신의 이름은 속담의 역사에 새겨질 것입니다.',
	},
];

// ─────────────────────────────────────────────────────────────
// 만점(전체 속담 수 × 문제당 점수) 기반 임계 점수 자동 산정
// ─────────────────────────────────────────────────────────────

/** 전체 속담 개수 (데이터 증가 시 자동 반영) */
export const getTotalProverbCount = (): number => {
	try {
		return ProverbServices.selectProverbList().length;
	} catch {
		return 0;
	}
};

/** 전체 속담을 모두 맞혔을 때의 만점 */
export const getMaxScore = (): number => getTotalProverbCount() * SCORE_PER_QUESTION;

/** 비율 → 점수(문제당 점수 단위로 반올림) */
const ratioToScore = (ratio: number, maxScore: number): number => {
	if (ratio <= 0) {
		return 0;
	}
	return Math.round((ratio * maxScore) / SCORE_PER_QUESTION) * SCORE_PER_QUESTION;
};

/**
 * 현재 속담 수 기준으로 임계 점수가 채워진 LEVEL_DATA를 생성한다.
 * 반환 순서는 기존 코드 호환을 위해 "내림차순(최상위 → 최하위)".
 */
export const buildLevelData = (): ScoredCharacterLevel[] => {
	const maxScore = getMaxScore();

	// 비율 오름차순으로 점수 산정
	const ascending = BASE_LEVELS.map((lv) => ({
		...lv,
		score: ratioToScore(lv.ratio, maxScore),
	}));

	// 다음 등급 시작 점수(next) 연결 — 최상위는 Infinity
	const withNext: ScoredCharacterLevel[] = ascending.map((lv, idx) => ({
		...lv,
		next: idx < ascending.length - 1 ? ascending[idx + 1].score : Infinity,
	}));

	// 내림차순(최상위 먼저)으로 반환
	return withNext.slice().reverse();
};

/**
 * 점수별 캐릭터(등급) 데이터 — 단일 소스.
 * 내림차순(최상위 → 최하위) 정렬.
 * 데이터 로드 시점의 전체 속담 수를 기준으로 임계 점수가 산정된다.
 */
export const LEVEL_DATA: ScoredCharacterLevel[] = buildLevelData();

// ─────────────────────────────────────────────────────────────
// 공통 헬퍼 — 모든 화면/모달이 동일 로직을 사용하도록 중앙화
// ─────────────────────────────────────────────────────────────

/** 임계 점수 오름차순 정렬본 (내부 계산용) */
const ascendingLevels = (): ScoredCharacterLevel[] => [...LEVEL_DATA].sort((a, b) => a.score - b.score);

/** 점수에 해당하는 현재 등급을 반환 (LEVEL_DATA 정렬 순서 무관) */
export const getLevelByScore = (score: number): ScoredCharacterLevel => {
	const asc = ascendingLevels();
	return asc.reduce((acc, lv) => (score >= lv.score ? lv : acc), asc[0]);
};

/** 다음 등급을 반환. 이미 최상위면 null */
export const getNextLevel = (score: number): ScoredCharacterLevel | null => {
	const asc = ascendingLevels();
	return asc.find((lv) => score < lv.score) ?? null;
};

/** 현재 등급의 다음 등급까지 진행도(0~100%) */
export const getProgressPercent = (score: number): number => {
	const current = getLevelByScore(score);
	if (!Number.isFinite(current.next)) {
		return 100; // 최상위 등급
	}
	const progress = ((score - current.score) / (current.next - current.score)) * 100;
	return Math.min(Math.max(progress, 0), 100);
};

/** 다음 등급까지 남은 문제 수 */
export const getQuestionsToNext = (score: number): number => {
	const next = getNextLevel(score);
	if (!next) {
		return 0;
	}
	return Math.max(Math.ceil((next.score - score) / SCORE_PER_QUESTION), 0);
};

/** LEVEL_DATA(내림차순) 기준 현재 등급의 인덱스 */
export const getCurrentLevelIndex = (score: number): number =>
	LEVEL_DATA.findIndex((lv) => score >= lv.score && score < lv.next);
