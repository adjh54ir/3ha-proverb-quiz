import IconComponent from '@/screens/common/atomic/IconComponent';
import { scaledSize, scaleWidth } from '@/utils/DementionUtils';
import React, { JSX } from 'react';
import { COLORS, FONT_SIZES, SPACING_W } from '@/const/common/Theme';
import { getCategoryColor, getLevelColor } from '@/screens/common/CommonProverbModule';
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
		color: '#34D399', // 초급 - 밝은 민트
		desc: '',
	},
	{
		key: 'intermediate',
		label: '중급 문제',
		icon: 'leaf',
		type: 'FontAwesome6',
		color: '#F59E0B', // 중급 - 앰버
		desc: '',
	},
	{
		key: 'advanced',
		label: '고급 문제',
		icon: 'tree',
		type: 'FontAwesome6',
		color: '#EA580C', // 고급 - 진한 주황
		desc: '',
	},
	{
		key: 'expert',
		label: '특급 문제',
		icon: 'trophy',
		type: 'FontAwesome6',
		color: '#B91C1C', // 특급 - 가장 어두운 빨강(난이도 강조)
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
	iconColor: COLORS.textSecondary,
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color={COLORS.textSecondary} />,
	labelStyle: {
		marginLeft: SPACING_W.xsPlus,
		fontSize: FONT_SIZES.md,
	},
};

export const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '초급',
		value: '초급',
		icon: () => <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(16)} color={getLevelColor('초급')} />,
	},
	{
		label: '중급',
		value: '중급',
		icon: () => <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(16)} color={getLevelColor('중급')} />,
	},
	{
		label: '고급',
		value: '고급',
		icon: () => <IconComponent type="FontAwesome6" name="tree" size={scaledSize(16)} color={getLevelColor('고급')} />,
	},
	{
		label: '특급',
		value: '특급',
		icon: () => <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(16)} color={getLevelColor('특급')} />,
	},
];

/** 카테고리 드롭다운 — 색상은 공통 팔레트(getCategoryColor) 단일 소스를 사용한다. */
const FIELD_ITEMS: { label: string; badgeId: string; iconType: string; iconName: string }[] = [
	{ label: '운/우연', badgeId: 'category_luck', iconType: 'FontAwesome6', iconName: 'dice' },
	{ label: '인간관계', badgeId: 'category_relation', iconType: 'FontAwesome6', iconName: 'users' },
	{ label: '세상 이치', badgeId: 'category_life', iconType: 'FontAwesome5', iconName: 'globe' },
	{ label: '근면/검소', badgeId: 'category_diligence', iconType: 'FontAwesome5', iconName: 'hammer' },
	{ label: '노력/성공', badgeId: 'category_effort', iconType: 'FontAwesome5', iconName: 'medal' },
	{ label: '경계/조심', badgeId: 'category_caution', iconType: 'FontAwesome5', iconName: 'exclamation-triangle' },
	{ label: '욕심/탐욕', badgeId: 'category_greed', iconType: 'FontAwesome5', iconName: 'hand-holding-usd' },
	{ label: '배신/불신', badgeId: 'category_betrayal', iconType: 'FontAwesome5', iconName: 'user-slash' },
];

export const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	...FIELD_ITEMS.map((item) => ({
		label: item.label,
		value: item.label,
		badgeId: item.badgeId,
		iconType: item.iconType,
		iconName: item.iconName,
		iconColor: getCategoryColor(item.label),
		icon: () => <IconComponent type={item.iconType} name={item.iconName} size={scaledSize(16)} color={getCategoryColor(item.label)} />,
	})),
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
