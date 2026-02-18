// @/const/ConstDropdownData.tsx
import React from 'react';
import { scaledSize } from '@/utils/DementionUtils';
import IconComponent from '@/screens/common/atomic/IconComponent';

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

/*
 * 790개 × 10점 = 7,900점 기준
 * 레벨 구간 재분배 (6단계)
 * 초심자:  0     ~ 1,580
 * 입문자:  1,580 ~ 3,160
 * 숙련자:  3,160 ~ 4,740
 * 고수:    4,740 ~ 6,320
 * 마스터:  6,320 ~ 7,900
 * 전설:    7,900 ~
 */
export const LEVEL_DATA = [
	{
		score: 7000,
		next: Infinity,
		label: '속담 전설',
		icon: 'crown',
		encouragement: '🌌 전설이 되셨습니다!\n속담의 모든 지혜를 완전히 정복한 유일무이한 존재예요!',
		description: '790개 속담을 모두 정복하고,\n그 깊은 지혜를 삶 속에 온전히 녹여낸 최고의 경지예요.\n당신의 이름은 속담의 역사에 새겨질 것입니다.',
		mascot: require('@/assets/images/level6_mascote.png'),
	},
	{
		score: 5000,
		next: 7000,
		label: '속담 마스터',
		icon: 'trophy',
		encouragement: '👑 속담의 왕좌에 올랐습니다!\n당신은 이제 속담의 진정한 달인입니다!',
		description: '속담을 자유자재로 구사하며,\n누구에게나 귀감이 되는 지혜의 경지에 올랐습니다.\n속담의 참뜻을 깨닫고 삶에 녹여내는 최상위 단계예요.',
		mascot: require('@/assets/images/level5_mascote2.png'),
	},
	{
		score: 3000,
		next: 5000,
		label: '속담 고수',
		icon: 'chess-knight',
		encouragement: '⚔️ 속담의 전장에서 승리하고 있어요!\n어떤 도전도 당당히 맞설 수 있네요!',
		description: '속담을 무기처럼 활용하며,\n어려운 문제도 당당히 맞설 수 있는 단계예요.\n탄탄한 자신감으로 진정한 실력을 보여줍니다.',
		mascot: require('@/assets/images/level4_mascote.png'),
	},
	{
		score: 2000,
		next: 3000,
		label: '속담 숙련자',
		icon: 'tree',
		encouragement: '🌳 지식이 뿌리내려 점점 자라고 있어요!\n이제 훨씬 더 능숙해졌네요!',
		description: '속담의 의미와 쓰임새를 제대로 이해하고,\n실전에서도 능숙하게 활용할 수 있는 단계예요.\n기초를 넘어 한층 성숙한 실력을 갖췄습니다.',
		mascot: require('@/assets/images/level3_mascote.png'),
	},
	{
		score: 1000,
		next: 2000,
		label: '속담 입문자',
		icon: 'leaf',
		encouragement: '🍃 좋은 출발이에요!\n조금씩 자신감이 붙고 있어요!',
		description: '기초 속담에 차츰 익숙해지고,\n다양한 표현을 접하며 감을 쌓아가는 단계예요.\n이제 막 본격적인 성장의 길에 들어섰습니다.',
		mascot: require('@/assets/images/level2_mascote.png'),
	},
	{
		score: 0,
		next: 1000,
		label: '속담 초심자',
		icon: 'seedling',
		encouragement: '🌱 첫걸음을 내디뎠어요!\n앞으로가 더욱 기대돼요!',
		description: '속담 학습의 출발선에 선 단계로,\n새싹처럼 작은 배움부터 차근차근 키워가는 시기예요.\n앞으로의 성장이 더욱 기대됩니다.',
		mascot: require('@/assets/images/level1_mascote.png'),
	},
];

export const PET_REWARDS = [
	{ day: 7, image: require('@/assets/images/pet_level1_org.png') },
	{ day: 14, image: require('@/assets/images/pet_level2_org.png') },
	{ day: 21, image: require('@/assets/images/pet_level3_org.png') },
	{ day: 28, image: require('@/assets/images/pet_level4_org.png') },
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
		iconColor: '#9b59b6',
		icon: () => <IconComponent type="FontAwesome6" name="cube" size={16} color="#9b59b6" />,
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
	'사물/현상': '#9b59b6',
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
