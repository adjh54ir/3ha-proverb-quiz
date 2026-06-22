import React from 'react';
import IconComponent from './atomic/IconComponent';
import { scaledSize } from '@/utils';

/** 카테고리 색상 (속담 8종) */
export const getCategoryColor = (category: string): string => {
	const map: Record<string, string> = {
		'운/우연': '#00cec9',
		인간관계: '#6c5ce7',
		'세상 이치': '#fdcb6e',
		'근면/검소': '#e17055',
		'노력/성공': '#00b894',
		'경계/조심': '#d63031',
		'욕심/탐욕': '#e84393',
		'배신/불신': '#2d3436',
	};
	return map[category] || '#b2bec3';
};

/** 난이도 색상 (level 1~4) */
export const getLevelColor = (level: number | string): string => {
	const map: Record<string, string> = {
		1: '#2ecc71',
		2: '#F4D03F',
		3: '#EB984E',
		4: '#E74C3C',
		'아주 쉬움': '#2ecc71',
		쉬움: '#F4D03F',
		보통: '#EB984E',
		어려움: '#E74C3C',
	};
	return map[String(level)] || '#b2bec3';
};

/** 카테고리 아이콘 */
export const getFieldIcon = (category: string): React.ReactNode => {
	switch (category) {
		case '운/우연':
			return <IconComponent type="FontAwesome6" name="dice" size={scaledSize(12)} color="#fff" />;
		case '인간관계':
			return <IconComponent type="FontAwesome6" name="users" size={scaledSize(12)} color="#fff" />;
		case '세상 이치':
			return <IconComponent type="fontawesome5" name="globe" size={scaledSize(12)} color="#fff" />;
		case '근면/검소':
			return <IconComponent type="fontawesome5" name="hammer" size={scaledSize(12)} color="#fff" />;
		case '노력/성공':
			return <IconComponent type="fontawesome5" name="medal" size={scaledSize(12)} color="#fff" />;
		case '경계/조심':
			return <IconComponent type="fontawesome5" name="exclamation-triangle" size={scaledSize(12)} color="#fff" />;
		case '욕심/탐욕':
			return <IconComponent type="fontawesome5" name="hand-holding-usd" size={scaledSize(12)} color="#fff" />;
		case '배신/불신':
			return <IconComponent type="fontawesome5" name="user-slash" size={scaledSize(12)} color="#fff" />;
		default:
			return <IconComponent type="FontAwesome6" name="tag" size={scaledSize(12)} color="#fff" />;
	}
};

/** 퀴즈 모드 (속담) */
export const QUIZ_MODE = [
	{
		mode: 'meaning' as const,
		key: 'meaning',
		label: '뜻 맞추기',
		icon: 'lightbulb',
		type: 'fontAwesome6',
		color: '#93C5FD',
		desc: '속담을 보고 올바른 뜻을 고르세요',
	},
	{
		mode: 'proverb' as const,
		key: 'proverb',
		label: '속담 찾기',
		icon: 'quote-left',
		type: 'fontAwesome6',
		color: '#22C55E',
		desc: '뜻을 보고 올바른 속담을 고르세요',
	},
	{
		mode: 'blank' as const,
		key: 'blank',
		label: '빈 칸 채우기',
		icon: 'pen',
		type: 'fontAwesome6',
		desc: '속담의 빠진 부분을 맞혀보세요',
		color: '#FBBF24',
	},
	{
		mode: 'example' as const,
		key: 'example',
		label: '예문 빈칸',
		icon: 'align-left',
		type: 'fontAwesome6',
		color: '#14B8A6',
		desc: '예문 속 빈칸에 들어갈 속담을 고르세요',
	},
	{
		mode: 'etc' as const,
		key: 'comingsoon',
		label: '새로운 퀴즈\nComing Soon...',
		icon: 'hourglass-half',
		type: 'fontAwesome6',
		color: '#E2E8F0',
		desc: '새로운 퀴즈가 준비중입니다.',
	},
] as const;

export type QuizMode = 'meaning' | 'proverb' | 'blank' | 'example' | 'etc';

/** 속담집 색상 팔레트 */
export const BOOK_COLORS = [
	'#22C55E',
	'#16A34A',
	'#14B8A6',
	'#06B6D4',
	'#0EA5E9',
	'#60A5FA',
	'#3B82F6',
	'#2563EB',
	'#FCD34D',
	'#FBBF24',
	'#F59E0B',
	'#FB923C',
	'#F97316',
	'#EA580C',
	'#F87171',
	'#EF4444',
	'#DC2626',
	'#EC4899',
	'#F472B6',
	'#0F766E',
	'#B45309',
	'#64748B',
	'#475569',
	'#94A3B8',
];

/** 속담집 아이콘 목록 (MaterialIcons) */
export const BOOK_ICONS = [
	'menu-book',
	'auto-stories',
	'bookmark',
	'star',
	'favorite',
	'emoji-events',
	'school',
	'lightbulb',
	'psychology',
	'local-fire-department',
	'bolt',
	'diamond',
	'rocket-launch',
	'flag',
	'explore',
	'public',
	'spa',
	'nature',
	'forest',
	'eco',
	'wb-sunny',
	'nights-stay',
	'cloud',
	'ac-unit',
	'music-note',
	'sports-soccer',
	'palette',
	'camera-alt',
	'sports-esports',
	'fitness-center',
	'restaurant',
	'flight',
];
