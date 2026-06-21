/**
 * 앱 전역 디자인 토큰 (단일 기준점)
 * --------------------------------------------------
 * 모든 화면/모달은 색상·폰트·간격·반경·그림자를 이 파일에서 가져다 씁니다.
 * - 숫자 토큰(FONT/SPACING/RADIUS)은 "원시 값"이며, 사용처에서
 *   기존 방식대로 scaledSize / scaleWidth / scaleHeight 로 감싸서 사용합니다.
 * - 색상은 그대로 사용합니다.
 */

/* =========================================================
 * 1) COLORS
 * ======================================================= */
export const COLORS = {
	/* 브랜드 주조색 (Blue) */
	primary: '#3498db',
	primaryDark: '#2980b9',
	primaryLight: '#5dade2',
	primarySoft: '#eaf2fb', // 선택/하이라이트 배경 틴트
	primarySofter: '#f0f7ff',

	/* 보조/시맨틱 */
	success: '#2ecc71',
	successDark: '#27ae60',
	successSoft: '#eafaf1',
	danger: '#e74c3c',
	dangerSoft: '#fdecea',
	warning: '#f39c12',
	warningSoft: '#fff8e1',
	accent: '#e67e22',

	/* 텍스트 */
	textStrong: '#1a1a2e',
	text: '#2c3e50',
	textSub: '#34495e',
	textMuted: '#7f8c8d',
	textDisabled: '#95a5a6',

	/* 배경/표면 */
	bg: '#ffffff',
	bgSoft: '#f9f9f9',
	bgCard: '#f8f9fa',
	bgMuted: '#ecf0f1',

	/* 보더/구분선 */
	border: '#e5e7eb',
	borderStrong: '#dddddd',
	divider: '#f0f0f5',

	white: '#ffffff',
	black: '#000000',
	overlay: 'rgba(0,0,0,0.45)',
} as const;

/* =========================================================
 * 2) FONT SIZES (원시 값 → scaledSize() 로 감싸 사용)
 * ======================================================= */
export const FONT = {
	xs: 11, // 캡션/뱃지
	sm: 13, // 보조 텍스트
	base: 15, // 본문
	md: 16, // 강조 본문/버튼
	lg: 18, // 소제목
	xl: 20, // 화면 제목
	xxl: 24, // 큰 타이틀
	display: 28, // 히어로
} as const;

export const FONT_WEIGHT = {
	regular: '400',
	medium: '500',
	semibold: '600',
	bold: '700',
	heavy: '800',
} as const;

/* =========================================================
 * 3) SPACING (원시 값 → scaleWidth()/scaleHeight() 로 감싸 사용)
 * ======================================================= */
export const SPACING = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	xxxl: 32,
} as const;

/* =========================================================
 * 4) RADIUS
 * ======================================================= */
export const RADIUS = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	pill: 30,
} as const;

/* =========================================================
 * 5) SHADOW (그대로 spread 하여 사용)
 * ======================================================= */
export const SHADOW = {
	card: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	elevated: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 8,
		elevation: 5,
	},
} as const;

/* =========================================================
 * 6) 카테고리 / 레벨 색상·아이콘 맵 (기존 분산 정의 통합)
 * ======================================================= */
export const CATEGORY_COLORS: Record<string, string> = {
	'운/우연': '#00cec9',
	인간관계: '#6c5ce7',
	'세상 이치': '#f6a623',
	'근면/검소': '#e17055',
	'노력/성공': '#00b894',
	'경계/조심': '#d63031',
	'욕심/탐욕': '#e84393',
	'배신/불신': '#2d3436',
	'자연/계절': '#2ecc71',
	'시간/때': '#3498db',
	'감정/마음': '#e74c3c',
	'사람/성격': '#f1c40f',
	'사물/현상': '#9b59b6',
	'행동/태도': '#e67e22',
	'모양/소리': '#1abc9c',
	기타: '#95a5a6',
};

export const LEVEL_COLORS: Record<number, string> = {
	1: '#2ecc71',
	2: '#f4d03f',
	3: '#eb984e',
	4: '#e74c3c',
};

export const getCategoryColor = (category?: string) => (category && CATEGORY_COLORS[category]) || COLORS.textDisabled;
export const getLevelColor = (level?: number) => (level && LEVEL_COLORS[level]) || COLORS.textDisabled;

const theme = { COLORS, FONT, FONT_WEIGHT, SPACING, RADIUS, SHADOW, CATEGORY_COLORS, LEVEL_COLORS };
export default theme;
