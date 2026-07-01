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
	textWhite: '#FFFFFF',

	// ===== Background / Surface =====
	background: '#F8FAFC', // 화면 기본 배경
	surface: '#FFFFFF', // 카드/모달 표면
	surfaceAlt: '#F1F5F9', // 옅은 회색 표면

	// ===== Border / Divider =====
	border: '#E2E8F0',
	borderLight: '#E2E8F0',
	borderDark: '#CBD5E1',

	// ===== Semantic =====
	success: '#22C55E',
	successBg: '#F0FDF4',
	successSoft: '#DCFCE7',
	info: '#3B82F6',
	infoDark: '#2563EB',
	infoBg: '#EFF6FF',
	warning: '#F59E0B',
	warningDark: '#D97706',
	warningBg: '#FEF3C7',
	danger: '#EF4444',
	dangerDark: '#DC2626',
	dangerBg: '#FEE2E2',
	gold: '#FACC15',
	goldLight: '#FDE047',

	// ===== Dark (타워/챌린지 다크 화면 전용) =====
	darkBg: '#1a1a2e',
	darkBgAlt: '#16213e',
	darkSurface: '#0f3460',

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
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	xxxl: 32,
} as const;

/** 좌우(수평) 간격 — scaleWidth 적용 완료 값 */
export const SPACING_W = {
	xs: scaleWidth(SPACING.xs),
	sm: scaleWidth(SPACING.sm),
	md: scaleWidth(SPACING.md),
	lg: scaleWidth(SPACING.lg),
	xl: scaleWidth(SPACING.xl),
	xxl: scaleWidth(SPACING.xxl),
} as const;

/** 위아래(수직) 간격 — scaleHeight 적용 완료 값 */
export const SPACING_H = {
	xs: scaleHeight(SPACING.xs),
	sm: scaleHeight(SPACING.sm),
	md: scaleHeight(SPACING.md),
	lg: scaleHeight(SPACING.lg),
	xl: scaleHeight(SPACING.xl),
	xxl: scaleHeight(SPACING.xxl),
} as const;
