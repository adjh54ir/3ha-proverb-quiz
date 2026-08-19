import { scaledSize, scaleWidth, scaleHeight } from '@/utils/DementionUtils';

/**
 * 앱 전체 디자인 토큰 (단일 소스, Single Source of Truth)
 * - 색상/폰트/여백/라운드는 반드시 이 파일의 토큰을 사용한다.
 * - Primary: 그린(#22C55E) / Text: 슬레이트(#334155)
 * - 모던 slate/green 팔레트로 통일 (구 팔레트 대비 채도·명도 정리).
 */
export const COLORS = {
	// ===== Primary (Green) — 메인 액션/활성/정답 강조 =====
	primary: '#22C55E', // 메인 액센트
	primaryLight: '#4ADE80', // 밝은 그린 (활성/포인트)
	primaryDark: '#16A34A', // 진한 그린 (눌림/강조)
	primaryDeep: '#15803D', // 가장 진한 강조
	primaryBg: '#F0FDF4', // 그린 배경 틴트
	primarySoft: '#DCFCE7', // 배지/칩 배경
	primaryBorder: '#DCFCE7', // 그린 보더 틴트

	// ===== Secondary (Blue) — 보조 강조/링크/정보 =====
	secondary: '#3B82F6',
	secondaryLight: '#93C5FD',
	secondaryDark: '#2563EB',
	secondarySoft: '#DBEAFE',
	secondaryBg: '#EFF6FF',

	// ===== Text (Slate) =====
	text: '#334155', // 본문/타이틀
	textStrong: '#1E293B', // 강한 제목
	textSecondary: '#64748B', // 보조 텍스트
	textLight: '#94A3B8', // 비활성/캡션
	textMuted: '#475569', // 본문보다 한 톤 진한 보조 텍스트
	textDeep: '#0F172A', // 가장 진한 텍스트
	textWhite: '#FFFFFF',

	// ===== Background / Surface =====
	background: '#F8FAFC', // 화면 기본 배경
	surface: '#FFFFFF', // 카드/모달 표면
	surfaceAlt: '#F1F5F9', // 옅은 회색 표면

	// ===== Border / Divider =====
	border: '#E2E8F0',
	borderLight: '#E2E8F0',
	borderDark: '#CBD5E1',
	secondaryBorder: '#BFDBFE', // 블루 보더

	// ===== Accent (Orange/Amber) — 히어로 배너·연속 출석·선택 강조 =====
	accentOrange: '#EA580C', // 강한 주황 (텍스트/포인트)
	accentOrangeDark: '#D97706', // 상단 강조 보더
	accentOrangeDeep: '#7C2D12', // 주황 배경 위 제목
	accentOrangeText: '#9A3412', // 주황 배경 위 본문
	accentOrangeBg: '#FFF7ED', // 주황 배경 틴트
	accentOrangeBorder: '#FDBA74', // 주황 보더
	accentFlame: '#F97316', // 불꽃/연속 도전 포인트 (밝은 주황)
	accentOrangeLight: '#FB923C', // 옅은 주황 (3위/보조 포인트)
	accentOrangeSoft: '#FFEDD5', // 주황 칩 배경
	accentTeal: '#14B8A6', // 틸 포인트 (오늘의 퀴즈)
	accentTealBg: '#CCFBF1', // 틸 칩 배경
	accentSky: '#0EA5E9', // 스카이 포인트 (정복 섹션)
	accentSkyBg: '#E0F2FE', // 스카이 칩 배경
	accentTealDeep: '#115E59', // 틸 배경 위 진한 텍스트
	accentPink: '#EC4899', // 보기 라벨/카테고리 구분용 핑크 포인트

	// ===== Semantic =====
	success: '#22C55E',
	successBg: '#F0FDF4',
	successSoft: '#DCFCE7',
	successBorder: '#BBF7D0', // 그린 보더
	info: '#3B82F6',
	infoDark: '#2563EB',
	infoBg: '#EFF6FF',
	warning: '#F59E0B',
	warningDark: '#D97706',
	warningBg: '#FEF3C7',
	warningSoft: '#FFFBEB', // 옅은 앰버 틴트 (선택된 카드/힌트 버튼 배경)
	warningDeep: '#B45309', // 앰버 배경 위 진한 텍스트
	warningBorder: '#FDE68A', // 옅은 앰버 보더
	danger: '#EF4444',
	dangerLight: '#F87171', // 옅은 레드 (패배/오답 강조 배경 위 텍스트)
	dangerSoftBg: '#FEF2F2', // 가장 옅은 레드 배경 (오답 카드)
	dangerBorder: '#FCA5A5', // 레드 보더
	dangerBorderSoft: '#FECACA', // 옅은 레드 보더
	dangerDark: '#DC2626',
	dangerDeep: '#B91C1C', // 가장 진한 레드 (특급/실패 강조)
	dangerBg: '#FEE2E2',
	gold: '#FACC15',
	goldLight: '#FDE047',

	// ===== Dark (타워/챌린지 다크 화면 전용) =====
	darkBg: '#1a1a2e',
	darkBgAlt: '#16213e',
	darkSurface: '#0f3460',
	// 타워 화면 그라디언트/텍스트 (다크 배경 위)
	darkGradient: ['#2B2D3A', '#21222C', '#191A21'] as [string, string, string],
	darkText: '#F1F5F9',
	darkTextSecondary: '#CBD5E1',
	darkAccent: '#60A5FA',
	towerVictoryBg: '#064E3B', // 타워 승리 결과 배경
	towerDefeatBg: '#7F1D1D', // 타워 패배 결과 배경

	// ===== Dim =====
	dim: 'rgba(0, 0, 0, 0.5)',
	dimLight: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * 폰트 사이즈 체계 (scaledSize 적용 완료 값)
 * 화면에서는 FONT_SIZES.md 처럼 바로 사용한다.
 */
export const FONT_SIZES = {
	xxs: scaledSize(10), // 캡션/뱃지
	xs: scaledSize(11), // 탭 라벨
	sm: scaledSize(12), // 보조 텍스트
	smPlus: scaledSize(13), // 보조 본문
	md: scaledSize(14), // 본문
	mdPlus: scaledSize(15), // 본문 강조
	lg: scaledSize(16), // 강조 본문/버튼
	xl: scaledSize(18), // 섹션 타이틀/헤더
	xxl: scaledSize(20), // 화면 타이틀
	heading: scaledSize(22), // 모달 타이틀
	title: scaledSize(24), // 큰 타이틀
	display: scaledSize(28), // 결과/점수 강조
} as const;

/**
 * 화면 상단 히어로 배너 전용 톤 (앰버/오렌지 계열로 통일)
 * - 화면마다 제각각이던 배경/보더/텍스트 색 리터럴을 이 토큰 하나로 수렴시킨다.
 */
export const HERO = {
	bg: COLORS.accentOrangeBg, // 히어로 배경 틴트
	accent: COLORS.accentOrangeDark, // 상단 강조 보더
	title: COLORS.accentOrangeDeep, // 히어로 타이틀
	description: COLORS.accentOrangeText, // 히어로 설명
} as const;

/** 공통 radius 토큰 */
export const RADIUS = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	round: 999,
} as const;

/**
 * 공통 간격(spacing) 토큰 — raw 값.
 * 좌우 간격에는 scaleWidth(SPACING.md), 위아래 간격에는 scaleHeight(SPACING.md) 처럼 사용한다.
 */
export const SPACING = {
	xxs: 2,
	xs: 4,
	xsPlus: 6, // 4↔8 중간값 (아이콘-라벨 사이 등 촘촘한 간격)
	sm: 8,
	smPlus: 10,
	md: 12,
	mdPlus: 14,
	lg: 16,
	lgPlus: 18,
	xl: 20,
	xxl: 24,
	xxxl: 32,
	xxxxl: 40, // 스크롤 하단 여백 등 큰 클리어런스
} as const;

/** 좌우(수평) 간격 — scaleWidth 적용 완료 값 */
export const SPACING_W = {
	xxs: scaleWidth(SPACING.xxs),
	xs: scaleWidth(SPACING.xs),
	xsPlus: scaleWidth(SPACING.xsPlus),
	sm: scaleWidth(SPACING.sm),
	smPlus: scaleWidth(SPACING.smPlus),
	md: scaleWidth(SPACING.md),
	mdPlus: scaleWidth(SPACING.mdPlus),
	lg: scaleWidth(SPACING.lg),
	lgPlus: scaleWidth(SPACING.lgPlus),
	xl: scaleWidth(SPACING.xl),
	xxl: scaleWidth(SPACING.xxl),
	xxxl: scaleWidth(SPACING.xxxl),
	xxxxl: scaleWidth(SPACING.xxxxl),
} as const;

/** 위아래(수직) 간격 — scaleHeight 적용 완료 값 */
export const SPACING_H = {
	xxs: scaleHeight(SPACING.xxs),
	xs: scaleHeight(SPACING.xs),
	xsPlus: scaleHeight(SPACING.xsPlus),
	sm: scaleHeight(SPACING.sm),
	smPlus: scaleHeight(SPACING.smPlus),
	md: scaleHeight(SPACING.md),
	mdPlus: scaleHeight(SPACING.mdPlus),
	lg: scaleHeight(SPACING.lg),
	lgPlus: scaleHeight(SPACING.lgPlus),
	xl: scaleHeight(SPACING.xl),
	xxl: scaleHeight(SPACING.xxl),
	xxxl: scaleHeight(SPACING.xxxl),
	xxxxl: scaleHeight(SPACING.xxxxl),
} as const;
