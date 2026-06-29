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
		color: '#16a085',
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
// LEVEL_DATA(점수별 캐릭터)는 단일 소스 @/const/common/CommonCharacterData 로 이관됨.
// (중복 정의 제거 — 필요 시 ConstInfoData 또는 CommonCharacterData 에서 import)

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
		iconColor: '#76d7c4',
		icon: () => <IconComponent type="FontAwesome6" name="users" size={16} color="#76d7c4" />,
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
];
