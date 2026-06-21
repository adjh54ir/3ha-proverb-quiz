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

interface QuizLevel {
	key: QuizLevelKey;
	label: string;
	icon: string;
	type: string;
	color: string;
	desc: string;
}

export type QuizLevelKey = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const LEVELS: QuizLevel[] = [
	{
		key: 'beginner',
		label: '초급 문제',
		icon: 'seedling',
		type: 'FontAwesome6',
		color: '#58D68D',
		desc: '',
	},
	{
		key: 'intermediate',
		label: '중급 문제',
		icon: 'leaf',
		type: 'FontAwesome6',
		color: '#F5B041',
		desc: '',
	},
	{
		key: 'advanced',
		label: '고급 문제',
		icon: 'tree',
		type: 'FontAwesome6',
		color: '#E67E22',
		desc: '',
	},
	{
		key: 'expert',
		label: '특급 문제',
		icon: 'trophy',
		type: 'FontAwesome6',
		color: '#AF7AC5',
		desc: '',
	},
	{
		key: 'all',
		label: '전체 문제',
		icon: 'clipboard-list',
		type: 'fontAwesome5',
		color: '#5DADE2',
		desc: '',
	},
	{
		//@ts-ignore
		key: 'comingsoon',
		label: '새로운 문제',
		icon: 'hourglass-half',
		type: 'fontAwesome6',
		color: '#dfe6e9',
		desc: '',
	},
];
export const LEVEL_DATA = [
	{
		score: 3320,
		next: 5000, // 413문제 = 전체 달성
		label: '속담 마스터',
		icon: 'trophy',
		encouragement: '👑 속담의 왕좌에 올랐습니다!\n당신은 이제 속담의 진정한 달인입니다!',
		description: '속담을 자유자재로 구사하며,\n누구에게나 귀감이 되는 지혜의 경지에 올랐습니다.\n속담의 참뜻을 깨닫고 삶에 녹여내는 최상위 단계예요.',
		mascot: require('@/assets/images/level5_mascote2.png'),
	},
	{
		score: 2490,
		next: 3320, // 332문제
		label: '속담 고수',
		icon: 'chess-knight',
		encouragement: '⚔️ 속담의 전장에서 승리하고 있어요!\n어떤 도전도 당당히 맞설 수 있네요!',
		description: '속담을 무기처럼 활용하며,\n어려운 문제도 당당히 맞설 수 있는 단계예요.\n탄탄한 자신감으로 진정한 실력을 보여줍니다.',
		mascot: require('@/assets/images/level4_mascote.png'),
	},
	{
		score: 1660,
		next: 2490, // 249문제
		label: '속담 숙련자',
		icon: 'tree',
		encouragement: '🌳 지식이 뿌리내려 점점 자라고 있어요!\n이제 훨씬 더 능숙해졌네요!',
		description: '속담의 의미와 쓰임새를 제대로 이해하고,\n실전에서도 능숙하게 활용할 수 있는 단계예요.\n기초를 넘어 한층 성숙한 실력을 갖췄습니다.',
		mascot: require('@/assets/images/level3_mascote.png'),
	},
	{
		score: 830,
		next: 1660, // 166문제
		label: '속담 입문자',
		icon: 'leaf',
		encouragement: '🍃 좋은 출발이에요!\n조금씩 자신감이 붙고 있어요!',
		description: '기초 속담에 차츰 익숙해지고,\n다양한 표현을 접하며 감을 쌓아가는 단계예요.\n이제 막 본격적인 성장의 길에 들어섰습니다.',
		mascot: require('@/assets/images/level2_mascote.png'),
	},
	{
		score: 0,
		next: 830, // 83문제
		label: '속담 초심자',
		icon: 'seedling',
		encouragement: '🌱 첫걸음을 내디뎠어요!\n앞으로가 더욱 기대돼요!',
		description: '속담 학습의 출발선에 선 단계로,\n새싹처럼 작은 배움부터 차근차근 키워가는 시기예요.\n앞으로의 성장이 더욱 기대됩니다.',
		mascot: require('@/assets/images/level1_mascote.png'),
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
		label: '운/우연',
		value: '운/우연',
		badgeId: 'category_luck',
		iconType: 'FontAwesome6',
		iconName: 'dice',
		iconColor: '#81ecec',
		icon: () => <IconComponent type="FontAwesome6" name="dice" size={16} color="#81ecec" />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		badgeId: 'category_relationship',
		iconType: 'FontAwesome6',
		iconName: 'users',
		iconColor: '#a29bfe',
		icon: () => <IconComponent type="FontAwesome6" name="users" size={16} color="#a29bfe" />,
	},
	{
		label: '세상 이치',
		value: '세상 이치',
		badgeId: 'category_world',
		iconType: 'FontAwesome5',
		iconName: 'globe',
		iconColor: '#fdcb6e',
		icon: () => <IconComponent type="FontAwesome5" name="globe" size={16} color="#fdcb6e" />,
	},
	{
		label: '근면/검소',
		value: '근면/검소',
		badgeId: 'category_diligence',
		iconType: 'FontAwesome5',
		iconName: 'hammer',
		iconColor: '#fab1a0',
		icon: () => <IconComponent type="FontAwesome5" name="hammer" size={16} color="#fab1a0" />,
	},
	{
		label: '노력/성공',
		value: '노력/성공',
		badgeId: 'category_success',
		iconType: 'FontAwesome5',
		iconName: 'medal',
		iconColor: '#55efc4',
		icon: () => <IconComponent type="FontAwesome5" name="medal" size={16} color="#55efc4" />,
	},
	{
		label: '경계/조심',
		value: '경계/조심',
		badgeId: 'category_caution',
		iconType: 'FontAwesome5',
		iconName: 'exclamation-triangle',
		iconColor: '#ff7675',
		icon: () => <IconComponent type="FontAwesome5" name="exclamation-triangle" size={16} color="#ff7675" />,
	},
	{
		label: '욕심/탐욕',
		value: '욕심/탐욕',
		badgeId: 'category_greed',
		iconType: 'FontAwesome5',
		iconName: 'hand-holding-usd',
		iconColor: '#fd79a8',
		icon: () => <IconComponent type="FontAwesome5" name="hand-holding-usd" size={16} color="#fd79a8" />,
	},
	{
		label: '배신/불신',
		value: '배신/불신',
		badgeId: 'category_betrayal',
		iconType: 'FontAwesome5',
		iconName: 'user-slash',
		iconColor: '#b2bec3',
		icon: () => <IconComponent type="FontAwesome5" name="user-slash" size={16} color="#b2bec3" />,
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
		key: 'example',
		label: '예시로 풀기 퀴즈',
		icon: 'comment-dots',
		type: 'fontAwesome6',
		color: '#EC7063',
	},
];
