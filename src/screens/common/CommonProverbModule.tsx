import React from 'react';
import IconComponent from './atomic/IconComponent';

/**
 * 속담 공통 표시 헬퍼 (카테고리 색/아이콘, 난이도 색)
 * - 사전/학습/퀴즈 등에서 공통 사용합니다.
 */

/** 카테고리별 색상 */
export const getCategoryColor = (category: string): string => {
	const map: Record<string, string> = {
		'운/우연': '#8B5CF6',
		인간관계: '#3B82F6',
		'세상 이치': '#14B8A6',
		'근면/검소': '#22C55E',
		'노력/성공': '#F59E0B',
		'경계/조심': '#EF4444',
		'욕심/탐욕': '#EC4899',
		'배신/불신': '#64748B',
	};
	return map[category] || '#94A3B8';
};

/** 난이도(levelName)별 색상 — 쉬움→어려움으로 갈수록 진해지는 램프 */
export const getLevelColor = (level: string): string => {
	const map: Record<string, string> = {
		'아주 쉬움': '#22C55E',
		'매우 쉬움': '#22C55E',
		쉬움: '#84CC16',
		보통: '#F59E0B',
		어려움: '#EF4444',
	};
	return map[level] || '#94A3B8';
};

/** 카테고리별 아이콘 이름 (materialIcons) */
export const getFieldIconName = (category: string): string => {
	const iconMap: Record<string, string> = {
		'운/우연': 'casino',
		인간관계: 'groups',
		'세상 이치': 'language',
		'근면/검소': 'cleaning-services',
		'노력/성공': 'trending-up',
		'경계/조심': 'report-problem',
		'욕심/탐욕': 'paid',
		'배신/불신': 'handshake',
	};
	return iconMap[category] || 'category';
};

/** 카테고리별 아이콘 (배경 위 흰색 표시용) */
export const getFieldIcon = (category: string): React.ReactNode => {
	return <IconComponent type="materialIcons" name={getFieldIconName(category)} size={14} color="#ffffff" />;
};

/** 난이도(levelName)별 아이콘 이름 (FontAwesome6) — 속담 목록 레벨 배지와 동일 */
export const getLevelIconName = (level: string): string => {
	const iconMap: Record<string, string> = {
		'아주 쉬움': 'seedling',
		'매우 쉬움': 'seedling',
		쉬움: 'leaf',
		보통: 'tree',
		어려움: 'trophy',
	};
	return iconMap[level] || 'seedling';
};

// ── 속담집 색상/아이콘 팔레트
export const BOOK_COLORS = [
	'#22C55E', '#16A34A', '#14B8A6', '#06B6D4', '#0EA5E9', '#60A5FA',
	'#3B82F6', '#2563EB', '#FCD34D', '#FBBF24', '#F59E0B', '#FB923C',
	'#F97316', '#EA580C', '#F87171', '#EF4444', '#DC2626', '#EC4899',
	'#F472B6', '#0F766E', '#B45309', '#64748B', '#475569', '#94A3B8',
];

export const BOOK_ICONS = [
	'menu-book', 'auto-stories', 'bookmark', 'star', 'favorite', 'emoji-events',
	'school', 'lightbulb', 'psychology', 'local-fire-department', 'bolt', 'diamond',
	'rocket-launch', 'flag', 'explore', 'public', 'spa', 'nature', 'forest', 'eco',
	'wb-sunny', 'nights-stay', 'cloud', 'ac-unit', 'music-note', 'sports-soccer',
	'palette', 'camera-alt', 'sports-esports', 'fitness-center', 'restaurant', 'flight',
];
