// @/const/ConstDropdownData.tsx
import React from 'react';
import { scaledSize } from '@/utils/DementionUtils';
import IconComponent from '@/screens/common/atomic/IconComponent';
import { LEVEL_DATA } from '@/const/common/CommonCharacterData';

export const GREETING_MESSAGES = [
	'🎯 반가워요! 우리말의 결을 느껴볼까요?',
	'🌱 잊혀가는 우리말, 숨은 보석을 찾아봐요!',
	'📚 알쏭달쏭 순우리말 퀴즈! 지금 시작합니다!',
	'📝 입에 착 붙는 고운 우리말을 익혀보세요!',
	'✨ 곱고 예쁜 우리말의 세계로 한 걸음 더!',
	'💡 뜻을 알면 더 사랑스러운 우리말!',
	'👀 우리말 속에 담긴 정겨운 뜻을 풀어볼까요?',
	'🔍 낯설지만 반가운 순우리말을 만나는 시간!',
	'🧩 재미있게 배우는 우리말 조각 모음!',
	'🐥 하루 한 단어! 우리말이 더 풍성해져요!',
];

export const PRAISE_MESSAGES = [
	'고운 우리말이 마음속에 차곡차곡 쌓이고 있어요! 🌸',
	'우리말의 숨은 결을 찾아내셨네요! ✨',
	'지혜의 아름이 벌어지고 있어요! 🌰',
	'아름다운 우리말 달인이 되어가고 있어요! 🇰🇷',
	'성실한 배움이 시나브로 빛을 발하고 있네요! 🕯️',
	'글자마다 담긴 따뜻한 온기를 느끼셨군요! 🌡️',
	'어제보다 한층 너른 말씨를 갖게 되셨어요! ⏫',
	'우리말 한 자, 한 줄이 모여 보배가 됩니다! 💎',
	'깊은 우리말의 맛을 제대로 꿰뚫으셨어요! 🔍',
	'우리 문화의 뿌리를 단단히 다지는 중이에요! 🌱',
];

export const REVIEW_PRAISE_MESSAGES = [
	'다시 보며 우리말의 결을 더 깊게 새겨요! 🔁',
	'복습으로 기억을 더 단단하게 다져보세요! 🧱',
	'잊히지 않게 다독이는 모습이 참 멋져요! 👍',
	'한 번 더 마주하니 우리말이 더 친숙해지네요! 🤝',
	'꾸준한 갈고닦음이 완벽을 만듭니다! 🏆',
];

export const QUIZ_PRAISE_MESSAGE = [
	'정답이에요! 순우리말의 고수네요! 🎉\n우리말의 아름다움을 정확히 이해하고 있어요!',
	'대단해요! 완벽한 정답이에요! 🏆\n순우리말 마스터까지 얼마 남지 않았어요!',
	'잘했어요! 멋져요! 💯\n지금까지의 학습이 제대로 빛을 발하고 있네요!',
	'정확한 해석력! 🤓✨\n우리말 실력이 날로 늘고 있어요!',
	'순우리말을 쏙쏙 맞히네요! 🌟\n꾸준한 학습의 결과예요!',
	'👏 대단해요!\n이 실력이면 어려운 순우리말도 문제없어요!',
	'정말 똑똑하군요! 📚\n우리말의 깊은 뜻까지 꿰뚫는 눈을 가졌네요!',
	'정확히 알고 있네요! 🧠\n이제 진정한 우리말 지킴이에 가까워지고 있어요!',
];

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
	{ day: 1, label: '1일 출석', name: '멍뭉 견습생', image: require('@/assets/images/pet_level0.jpg') },
	{ day: 7, label: '7일 출석', name: '멍뭉 훈련생', image: require('@/assets/images/pet_level1.png') },
	{ day: 14, label: '14일 출석', name: '멍뭉 수련생', image: require('@/assets/images/pet_level2.png') },
	{ day: 21, label: '21일 출석', name: '멍뭉 졸업생', image: require('@/assets/images/pet_level3.png') },
	{ day: 28, label: '28일 출석', name: '멍뭉 마스터', image: require('@/assets/images/pet_level4.png') },
];

/**
 * 공통 '전체' 옵션
 */
export const COMMON_ALL_OPTION = {
	label: '전체',
	value: 0,
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={16} color="#555" />,
	labelStyle: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
	},
};

/**
 * 난이도(레벨) 드롭다운 아이템
 */
export const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '초급',
		value: 1,
		icon: () => <IconComponent type="FontAwesome6" name="seedling" size={16} color="#2ecc71" />,
	},
	{
		label: '중급',
		value: 2,
		icon: () => <IconComponent type="FontAwesome6" name="leaf" size={16} color="#F4D03F" />,
	},
	{
		label: '고급',
		value: 3,
		icon: () => <IconComponent type="FontAwesome6" name="tree" size={16} color="#EB984E" />,
	},
	{
		label: '특급',
		value: 4,
		icon: () => <IconComponent type="FontAwesome6" name="trophy" size={16} color="#E74C3C" />,
	},
];

/**
 * 카테고리(분야) 드롭다운 아이템
 */
export const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '자연/계절',
		value: '자연/계절',
		iconType: 'FontAwesome6',
		iconName: 'mountain-sun',
		iconColor: '#2ecc71',
		icon: () => <IconComponent type="FontAwesome6" name="mountain-sun" size={16} color="#2ecc71" />,
	},
	{
		label: '시간/때',
		value: '시간/때',
		iconType: 'FontAwesome6',
		iconName: 'clock',
		iconColor: '#3498db',
		icon: () => <IconComponent type="FontAwesome6" name="clock" size={16} color="#3498db" />,
	},
	{
		label: '감정/마음',
		value: '감정/마음',
		iconType: 'FontAwesome6',
		iconName: 'heart',
		iconColor: '#e74c3c',
		icon: () => <IconComponent type="FontAwesome6" name="heart" size={16} color="#e74c3c" />,
	},
	{
		label: '사람/성격',
		value: '사람/성격',
		iconType: 'FontAwesome6',
		iconName: 'user-gear',
		iconColor: '#f1c40f',
		icon: () => <IconComponent type="FontAwesome6" name="user-gear" size={16} color="#f1c40f" />,
	},
	{
		label: '사물/현상',
		value: '사물/현상',
		iconType: 'FontAwesome6',
		iconName: 'cube',
		iconColor: '#16a085',
		icon: () => <IconComponent type="FontAwesome6" name="cube" size={16} color="#16a085" />,
	},
	{
		label: '행동/태도',
		value: '행동/태도',
		iconType: 'FontAwesome6',
		iconName: 'person-walking',
		iconColor: '#e67e22',
		icon: () => <IconComponent type="FontAwesome6" name="person-walking" size={16} color="#e67e22" />,
	},
	{
		label: '모양/소리',
		value: '모양/소리',
		iconType: 'FontAwesome6',
		iconName: 'wave-square',
		iconColor: '#1abc9c',
		icon: () => <IconComponent type="FontAwesome6" name="wave-square" size={16} color="#1abc9c" />,
	},
	{
		label: '기타',
		value: '기타',
		iconType: 'FontAwesome6',
		iconName: 'ellipsis',
		iconColor: '#95a5a6',
		icon: () => <IconComponent type="FontAwesome6" name="ellipsis" size={16} color="#95a5a6" />,
	},
];
export const QUIZ_MODES = [
	{
		key: 'meaning',
		label: '속담 뜻 퀴즈',
		icon: 'lightbulb',
		type: 'fontAwesome6',
		color: '#5DADE2',
	},
	{
		key: 'proverb',
		label: '속담 찾기 퀴즈',
		icon: 'quote-left',
		type: 'fontAwesome6',
		color: '#58D68D',
	},
	{
		key: 'blank',
		label: '빈칸 채우기 퀴즈',
		icon: 'pen',
		type: 'fontAwesome6',
		color: '#F5B041',
	},
	{
		key: 'comingsoon', // 오타(commingsoon) 수정
		label: '새로운 퀴즈\nComing Soon...',
		icon: 'hourglass-half',
		type: 'fontAwesome6',
		color: '#dfe6e9',
	},
];

/**
 * 카테고리별 아이콘 매핑
 */
export const CATEGORY_ICON_MAP: Record<string, string> = {
	'자연/계절': 'mountain-sun',
	'시간/때': 'clock',
	'감정/마음': 'heart',
	'사람/성격': 'user-gear',
	'사물/현상': 'cube',
	'행동/태도': 'person-walking',
	'모양/소리': 'wave-square',
	기타: 'ellipsis',
};

/**
 * 카테고리별 색상 매핑
 */
export const CATEGORY_COLOR_MAP: Record<string, string> = {
	'자연/계절': '#2ecc71',
	'시간/때': '#3498db',
	'감정/마음': '#e74c3c',
	'사람/성격': '#f1c40f',
	'사물/현상': '#16a085',
	'행동/태도': '#e67e22',
	'모양/소리': '#1abc9c',
	기타: '#95a5a6',
};

/**
 * 레벨별 아이콘 매핑
 */
export const LEVEL_ICON_MAP: Record<number, string> = {
	1: 'seedling',
	2: 'leaf',
	3: 'tree',
	4: 'trophy',
};

/**
 * 레벨별 색상 매핑
 */
export const LEVEL_COLOR_MAP: Record<number, string> = {
	1: '#2ecc71', // 초급 - 녹색
	2: '#F4D03F', // 중급 - 노랑
	3: '#EB984E', // 고급 - 주황
	4: '#E74C3C', // 특급 - 빨강
};

/**
 * 레벨별 텍스트 매핑
 */
export const LEVEL_TEXT_MAP: Record<number, string> = {
	1: '초급',
	2: '중급',
	3: '고급',
	4: '특급',
};

export const SCORE_TITLES = LEVEL_DATA.filter((level) => level.score > 0).map((level) => ({
	threshold: level.score,
	id: `score_${level.score}`,
	name: `${level.label} 획득!`,
	description: `${level.score}점 달성! ${level.encouragement}`,
	icon: level.icon,
	mascotImage: level.mascot,
}));
