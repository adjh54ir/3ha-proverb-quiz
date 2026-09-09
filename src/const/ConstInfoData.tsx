// @/const/ConstDropdownData.tsx
import React from 'react';
import { scaledSize } from '@/utils/DementionUtils';
import IconComponent from '@/screens/common/atomic/IconComponent';
import { LEVEL_DATA } from '@/const/common/CommonCharacterData';

/**
 * 점수별 캐릭터(등급) 데이터.
 * 단일 소스인 @/const/common/CommonCharacterData 에서 재수출한다.
 * (임계 점수는 전체 속담 수 × 문제당 점수를 만점으로 비율 자동 산정)
 */
export {
	LEVEL_DATA,
	SCORE_PER_QUESTION,
	getLevelByScore,
	getNextLevel,
	getProgressPercent,
	getQuestionsToNext,
	getCurrentLevelIndex,
	getMaxScore,
	getTotalProverbCount,
} from '@/const/common/CommonCharacterData';
export type { CharacterLevel, ScoredCharacterLevel } from '@/const/common/CommonCharacterData';

export const PET_REWARDS = [
	{ day: 1, label: '1일 출석', name: '지혜의 알', image: require('@/assets/images/pet_level0.png') },
	{ day: 7, label: '7일 출석', name: '아기 까치', image: require('@/assets/images/pet_level1.png') },
	{ day: 14, label: '14일 출석', name: '속담 탐험가', image: require('@/assets/images/pet_level2.png') },
	{ day: 21, label: '21일 출석', name: '속담 선비', image: require('@/assets/images/pet_level3.png') },
	{ day: 28, label: '28일 출석', name: '속담 도사', image: require('@/assets/images/pet_level4.png') },
];

// QUIZ_MODES 는 '@/const/common/CommonMainData' 단일 소스를 쓴다.
