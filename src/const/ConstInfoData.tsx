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
	{
		day: 1,
		label: '1일 출석',
		name: '포근한 해치알',
		message: '알이 포근해졌어요',
		image: require('@/assets/images/pet_hatch_stage1_v3.png'),
	},
	{
		day: 7,
		label: '7일 출석',
		name: '톡톡 해치알',
		message: '톡톡… 안에서 소리가 나요!',
		image: require('@/assets/images/pet_hatch_stage2_v3.png'),
	},
	{
		day: 14,
		label: '14일 출석',
		name: '아기 말빛 해치',
		message: '속담을 먹고 쑥쑥 자랄래요!',
		image: require('@/assets/images/pet_hatch_stage3_v3.png'),
	},
	{
		day: 21,
		label: '21일 출석',
		name: '배움 말빛 해치',
		message: '오늘의 지혜도 모아 볼까요?',
		image: require('@/assets/images/pet_hatch_stage4_v3.png'),
	},
	{
		day: 28,
		label: '28일 출석',
		name: '속담 수호 해치',
		message: '옛말의 지혜는 제가 지킬게요!',
		image: require('@/assets/images/pet_hatch_stage5_v3.png'),
	},
];

// QUIZ_MODES 는 '@/const/common/CommonMainData' 단일 소스를 쓴다.
