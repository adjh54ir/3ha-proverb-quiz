import IconComponent from '@/screens/common/atomic/IconComponent';
import { scaledSize, scaleWidth } from '@/utils/DementionUtils';
import React, { JSX } from 'react';
// 공통 타입 정의
export interface CategoryItem {
	label: string;
	icon: () => JSX.Element;
}

export interface WeightCategoryItem extends CategoryItem {
	range: string;
}

export interface ContinentItem extends CategoryItem {
	key: string;
}

export const LEVEL_DATA = [
	{
		score: 3320,
		next: 4130, // 413문제 = 전체 달성
		label: '속담 마스터',
		icon: 'trophy',
		encouragement: '🏆 속담 마스터에 도달했어요! 정말 대단해요!',
		description: '속담에 대한 깊은 이해와 활용 능력을 갖춘 최상위 단계로,\n누구에게나 모범이 될 수 있는 수준이에요.',
		mascot: require('@/assets/images/level5_mascote2.png'),
	},
	{
		score: 2490,
		next: 3320, // 332문제
		label: '속담 전사',
		icon: 'helmet-battle',
		encouragement: '🪖 속담 전사로 거듭났어요!\n지식을 무기로 도전을 헤쳐나가고 있어요!',
		description: '속담을 무기 삼아 자신 있게 문제를 정복하는 단계로,\n진정한 전사로서 강한 자신감을 보여주는 시기예요.',
		mascot: require('@/assets/images/level4_mascote.png'),
	},
	{
		score: 1660,
		next: 2490, // 249문제
		label: '속담 숙련자',
		icon: 'tree',
		encouragement: '🌳 멋져요! 속담 실력이 부쩍 늘었어요!',
		description: '속담의 뜻과 쓰임새를 잘 이해하고 있으며,\n실전 문제에도 능숙하게 대응할 수 있는 단계예요.',
		mascot: require('@/assets/images/level3_mascote.png'),
	},
	{
		score: 830,
		next: 1660, // 166문제
		label: '속담 입문자',
		icon: 'leaf',
		encouragement: '🍃 차근차근 익혀가는 중이에요!\n조금씩 자신감이 붙고 있어요!',
		description: '기초 속담에 익숙해지고,\n다양한 표현을 접하며 감을 잡아가는 단계예요.',
		mascot: require('@/assets/images/level2_mascote.png'),
	},
	{
		score: 0,
		next: 830, // 83문제
		label: '속담 초보자',
		icon: 'seedling',
		encouragement: '🌱 첫걸음을 뗐어요! 이제 속담의 세계로!',
		description: '속담 학습의 출발선에 선 단계로,\n기초적인 표현부터 차근히 익히는 시기예요.',
		mascot: require('@/assets/images/level1_mascote.png'),
	},
];


export const IDIOM_SYMBOLS = [
	{
		icon: '🧠',
		title: '머리',
		meaning: '지혜·생각·판단의 상징',
		examples: [
			{ idiom: '머리가 좋다', meaning: '영리하다' },
			{ idiom: '머리를 굴리다', meaning: '꾀를 내다' },
			{ idiom: '머리를 숙이다', meaning: '복종하다, 존경하다' },
		],
	},
	{
		icon: '👀',
		title: '눈',
		meaning: '지각·판단·감정의 상징',
		examples: [
			{ idiom: '눈이 높다', meaning: '안목이 높다' },
			{ idiom: '눈 밖에 나다', meaning: '미움을 사다' },
			{ idiom: '눈이 어둡다', meaning: '욕심에 사로잡히다' },
		],
	},
	{
		icon: '👂',
		title: '귀',
		meaning: '소문·수용·이해의 상징',
		examples: [
			{ idiom: '귀가 얇다', meaning: '남의 말에 쉽게 휘둘린다' },
			{ idiom: '귀에 못이 박히다', meaning: '같은 말을 너무 많이 듣다' },
			{ idiom: '귀가 솔깃하다', meaning: '혹하다, 관심이 생기다' },
		],
	},
	{
		icon: '👃',
		title: '코',
		meaning: '자존심·체면의 상징',
		examples: [
			{ idiom: '코가 높다', meaning: '잘난 체하다' },
			{ idiom: '코가 납작해지다', meaning: '체면이 구겨지다' },
			{ idiom: '코앞에 닥치다', meaning: '임박하다' },
		],
	},
	{
		icon: '👄',
		title: '입/혀',
		meaning: '말·표현·욕망의 상징',
		examples: [
			{ idiom: '입이 무겁다', meaning: '비밀을 잘 지킨다' },
			{ idiom: '입이 가볍다', meaning: '쉽게 떠벌린다' },
			{ idiom: '혀가 길다', meaning: '말이 많다, 잘 지껄인다' },
		],
	},
	{
		icon: '💖',
		title: '가슴/심장',
		meaning: '감정·마음·용기의 상징',
		examples: [
			{ idiom: '가슴이 벅차다', meaning: '감격스럽다' },
			{ idiom: '가슴이 철렁하다', meaning: '불안·놀람' },
			{ idiom: '심장이 크다', meaning: '대담하다, 용감하다' },
		],
	},
	{
		icon: '✋',
		title: '손',
		meaning: '행동·능력·관계의 상징',
		examples: [
			{ idiom: '손이 크다', meaning: '씀씀이가 후하다' },
			{ idiom: '손발이 맞다', meaning: '협력이 잘 된다' },
			{ idiom: '손을 잡다', meaning: '협력하다' },
		],
	},
	{
		icon: '🦶',
		title: '발',
		meaning: '움직임·관계망의 상징',
		examples: [
			{ idiom: '발이 넓다', meaning: '인맥이 넓다' },
			{ idiom: '발 벗고 나서다', meaning: '적극적으로 나서다' },
			{ idiom: '발 디딜 틈이 없다', meaning: '매우 혼잡하다' },
		],
	},
	{
		icon: '🩸',
		title: '피/간/쓸개 등 내부 기관',
		meaning: '정신적·육체적 본질, 고통, 희생의 상징',
		examples: [
			{ idiom: '간이 크다', meaning: '담력이 세다' },
			{ idiom: '간이 콩알만 해지다', meaning: '겁에 질리다' },
			{ idiom: '쓸개까지 다 내주다', meaning: '진심으로 헌신하다' },
			{ idiom: '피땀 흘리다', meaning: '고생하다' },
		],
	},
];

// 체중 분류 데이터
export const WEIGHT_CATEGORIES = [
	{
		label: '전체',
		key: 'all',
		icon: () => <IconComponent type="FontAwesome6" name="list" size={16} color="#555" />,
		iconColor: '#555',
	},
	{
		label: '소형 (≤ 4kg)',
		key: 'Small',
		range: [0, 4],
		icon: () => <IconComponent type="FontAwesome6" name="cat" size={16} color="#27ae60" />,
		iconColor: '#27ae60',
	},
	{
		label: '중형 (4~6kg)',
		key: 'Medium',
		range: [4, 6],
		icon: () => <IconComponent type="FontAwesome6" name="cat" size={16} color="#2980b9" />,
		iconColor: '#2980b9',
	},
	{
		label: '대형 (6~8kg)',
		key: 'Large',
		range: [6, 8],
		icon: () => <IconComponent type="FontAwesome6" name="cat" size={16} color="#e67e22" />,
		iconColor: '#e67e22',
	},
	{
		label: '초대형 (8kg 이상)',
		key: 'Giant',
		range: [8, 99],
		icon: () => <IconComponent type="FontAwesome6" name="cat" size={16} color="#c0392b" />,
		iconColor: '#8e44ad',
	},
];

// 대륙 분류 데이터
export const CONTINENTS = [
	{
		key: 'all',
		value: 'all',
		label: '전체',
		color: '#7f8c8d',
		iconType: 'public',
		type: 'materialIcons',
		icon: () => <IconComponent type="materialIcons" name="public" size={16} color="#7f8c8d" />,
	},
	{
		key: 'Asia',
		value: 'Asia',
		label: '아시아',
		color: '#27ae60',
		iconType: 'account-balance',
		type: 'materialIcons',
		icon: () => <IconComponent type="materialIcons" name="account-balance" size={18} color="#27ae60" />,
	},
	{
		key: 'Europe',
		value: 'Europe',
		label: '유럽',
		color: '#3498db',
		iconType: 'landmark-dome',
		type: 'fontAwesome6',
		icon: () => <IconComponent type="fontAwesome6" name="landmark-dome" size={18} color="#3498db" />,
	},
	{
		key: 'Americas',
		value: 'Americas',
		label: '아메리카',
		color: '#e67e22',
		iconType: 'public',
		type: 'materialIcons',
		icon: () => <IconComponent type="materialIcons" name="public" size={18} color="#e67e22" />,
	},
	{
		key: 'Africa',
		value: 'Africa',
		label: '아프리카',
		color: '#8e44ad',
		iconType: 'elephant',
		type: 'materialCommunityIcons',
		icon: () => <IconComponent type="materialCommunityIcons" name="elephant" size={18} color="#8e44ad" />,
	},
	{
		key: 'Oceania',
		value: 'Oceania',
		label: '오세아니아',
		color: '#00bcd4',
		iconType: 'waves',
		type: 'materialIcons',
		icon: () => <IconComponent type="materialIcons" name="waves" size={18} color="#00bcd4" />,
	},
	{
		key: 'Antarctica',
		value: 'Antarctica',
		label: '남극',
		color: '#95a5a6',
		iconType: 'ac-unit',
		type: 'materialIcons',
		icon: () => <IconComponent type="materialIcons" name="ac-unit" size={18} color="#95a5a6" />,
	},
];

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	iconType: 'FontAwesome6',
	badgeId: '',
	iconName: 'clipboard-list',
	iconColor: '#3498db',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={16} color="#555" />,
	labelStyle: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
	},
};

const COMMON_ALL_OPTION2 = {
	label: '전체',
	value: '전체',
	iconType: 'FontAwesome6',
	iconName: 'clipboard-list',
	iconColor: '#555',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={16} color="#555" />,
	labelStyle: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
	},
};

export const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION2,
	{
		label: '초급',
		value: '초급',
		icon: () => <IconComponent type="FontAwesome6" name="seedling" size={16} color="#2ecc71" />,
	},
	{
		label: '중급',
		value: '중급',
		icon: () => <IconComponent type="FontAwesome6" name="leaf" size={16} color="#F4D03F" />,
	},
	{
		label: '고급',
		value: '고급',
		icon: () => <IconComponent type="FontAwesome6" name="tree" size={16} color="#EB984E" />,
	},
	{
		label: '특급',
		value: '특급',
		icon: () => <IconComponent type="FontAwesome6" name="trophy" size={16} color="#E74C3C" />,
	},
];
export const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '신체',
		value: '신체',
		badgeId: 'category_body',
		iconType: 'FontAwesome6',
		iconName: 'person',
		iconColor: '#ff7675',
		icon: () => <IconComponent type="FontAwesome6" name="person" size={16} color="#ff7675" />,
	},
	{
		label: '음식',
		value: '음식',
		badgeId: 'category_food',
		iconType: 'FontAwesome6',
		iconName: 'utensils',
		iconColor: '#fdcb6e',
		icon: () => <IconComponent type="FontAwesome6" name="utensils" size={16} color="#fdcb6e" />,
	},
	{
		label: '동물',
		value: '동물',
		badgeId: 'category_animal',
		iconType: 'FontAwesome6',
		iconName: 'paw',
		iconColor: '#55efc4',
		icon: () => <IconComponent type="FontAwesome6" name="paw" size={16} color="#55efc4" />,
	},
	{
		label: '언어/표현',
		value: '언어/표현',
		badgeId: 'category_expression',
		iconType: 'FontAwesome6',
		iconName: 'comment-dots',
		iconColor: '#74b9ff',
		icon: () => <IconComponent type="FontAwesome6" name="comment-dots" size={16} color="#74b9ff" />,
	},
	{
		label: '감정/분위기',
		value: '감정/분위기',
		badgeId: 'category_mood',
		iconType: 'FontAwesome6',
		iconName: 'heart',
		iconColor: '#e17055',
		icon: () => <IconComponent type="FontAwesome6" name="heart" size={16} color="#e17055" />,
	},
	{
		label: '행동/태도',
		value: '행동/태도',
		badgeId: 'category_behavior',
		iconType: 'FontAwesome6',
		iconName: 'person-running', // ✅ FontAwesome6에서 지원되는 이름
		iconColor: '#00cec9',
		icon: () => <IconComponent type="FontAwesome6" name="person-running" size={16} color="#00cec9" />,
	},
	{
		label: '재물/비유',
		value: '재물/비유',
		badgeId: 'category_wealth',
		iconType: 'FontAwesome6',
		iconName: 'coins',
		iconColor: '#fab1a0',
		icon: () => <IconComponent type="FontAwesome6" name="coins" size={16} color="#fab1a0" />,
	},
	{
		label: '기타',
		value: '기타',
		badgeId: 'category_etc',
		iconType: 'FontAwesome6',
		iconName: 'question-circle', // ✅ 올바른 이름
		iconColor: '#b2bec3',
		icon: () => <IconComponent type="FontAwesome6" name="question-circle" size={16} color="#b2bec3" />,
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

export const PET_REWARDS = [
	{ day: 7, image: require('@/assets/images/pet_level1_org.png') },
	{ day: 14, image: require('@/assets/images/pet_level2_org.png') },
	{ day: 21, image: require('@/assets/images/pet_level3_org.png') },
];
