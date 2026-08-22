import IconComponent from '@/screens/common/atomic/IconComponent';
import { scaledSize, scaleWidth } from '@/utils/DementionUtils';
import React, { JSX } from 'react';
import { COLORS, FONT_SIZES, SPACING_W, themedValue } from '@/const/common/Theme';
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

/** 'comingsoon' 은 실제로 카드가 렌더링되므로(비활성 안내) 타입에 포함한다. */
export type QuizLevelKey = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'comingsoon';

/**
 * 난이도별 문제 선택 카드.
 * 색은 공통 난이도 램프(getLevelColor)와 팔레트 토큰만 쓴다 —
 * 예전에는 여기에만 램프 색이 복사돼 있고 '전체/새로운 문제' 는 앱 컨셉 밖의
 * 플랫 UI 색(#5DADE2 / #dfe6e9)이라 다크모드에서 그대로 떠 있었다.
 */
export const LEVELS: QuizLevel[] = themedValue(() => [
	{ key: 'beginner', label: '초급 문제', icon: 'seedling', type: 'FontAwesome6', color: getLevelColor('초급'), desc: '' },
	{ key: 'intermediate', label: '중급 문제', icon: 'leaf', type: 'FontAwesome6', color: getLevelColor('중급'), desc: '' },
	{ key: 'advanced', label: '고급 문제', icon: 'tree', type: 'FontAwesome6', color: getLevelColor('고급'), desc: '' },
	{ key: 'expert', label: '특급 문제', icon: 'trophy', type: 'FontAwesome6', color: getLevelColor('특급'), desc: '' },
	{ key: 'all', label: '전체 문제', icon: 'clipboard-list', type: 'fontAwesome5', color: COLORS.secondary, desc: '' },
	{ key: 'comingsoon', label: '새로운 문제', icon: 'hourglass-half', type: 'fontAwesome6', color: COLORS.borderDark, desc: '' },
]);
// LEVEL_DATA(점수별 캐릭터)는 단일 소스 @/const/common/CommonCharacterData 로 이관됨.
// (중복 정의 제거 — 필요 시 ConstInfoData 또는 CommonCharacterData 에서 import)

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	iconType: 'FontAwesome6',
	badgeId: '',
	iconName: 'clipboard-list',
	// getter 로 둬야 모듈 로드 시점의 팔레트로 굳지 않고 다크모드 전환을 따라간다.
	get iconColor() {
		return COLORS.textSecondary;
	},
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

/**
 * 퀴즈 모드 카드 (앱 전체 단일 소스)
 * - 색은 팔레트 토큰만 쓴다. 예전에는 화면마다 사본이 있었고 색도 앱 컨셉 밖의
 *   플랫 UI 팔레트(#5DADE2/#58D68D/#F5B041)라 다크모드에서도 그대로 떠 있었다.
 * - themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않는다.
 */
export const QUIZ_MODES = themedValue(() => [
	{ key: 'meaning', label: '속담 뜻 퀴즈', icon: 'lightbulb', type: 'fontAwesome6', color: COLORS.secondary },
	{ key: 'proverb', label: '속담 찾기 퀴즈', icon: 'quote-left', type: 'fontAwesome6', color: COLORS.primary },
	{ key: 'blank', label: '빈칸 채우기 퀴즈', icon: 'pen', type: 'fontAwesome6', color: COLORS.warning },
	{ key: 'comingsoon', label: '새로운 퀴즈\nComing Soon...', icon: 'hourglass-half', type: 'fontAwesome6', color: COLORS.borderDark },
]);
