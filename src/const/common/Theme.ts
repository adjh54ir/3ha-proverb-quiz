import { scaledSize } from '@/utils/DementionUtils';

/**
 * 앱 전체 디자인 토큰 (그린 기반 통일 테마)
 * - 색상/폰트 사이즈는 반드시 이 파일의 토큰을 사용한다.
 * - Primary: 그린(#27ae60) / Text: 다크네이비(#2c3e50)
 */
export const COLORS = {
	// ===== Primary (Green) =====
	primary: '#27ae60', // 메인 액센트
	primaryLight: '#2ecc71', // 밝은 그린 (활성/포인트)
	primaryDark: '#1e8449', // 진한 그린 (눌림/강조)
	primaryBg: '#eafaf1', // 그린 배경 틴트
	primaryBorder: '#d0f0dc', // 그린 보더 틴트

	// ===== Secondary (Teal) — 보조 액센트 =====
	secondary: '#16a085',
	secondaryLight: '#76d7c4',

	// ===== Text =====
	text: '#2c3e50', // 본문/타이틀
	textSecondary: '#7f8c8d', // 보조 텍스트
	textLight: '#95a5a6', // 비활성/캡션
	textWhite: '#ffffff',

	// ===== Background / Surface =====
	background: '#f8f9fa', // 화면 기본 배경
	surface: '#ffffff', // 카드/모달 표면
	surfaceAlt: '#ecf0f1', // 옅은 회색 표면

	// ===== Border / Divider =====
	border: '#e0e0e0',
	borderLight: '#ecf0f1',
	borderDark: '#bdc3c7',

	// ===== Semantic =====
	success: '#27ae60',
	successBg: '#eafaf1',
	info: '#3498db',
	infoDark: '#2980b9',
	infoBg: '#eaf4ff',
	warning: '#f39c12',
	warningDark: '#e67e22',
	warningBg: '#fef9e7',
	danger: '#e74c3c',
	dangerDark: '#c0392b',
	dangerBg: '#fdecea',
	gold: '#f1c40f',
	goldLight: '#f4d03f',

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

/** 공통 radius/spacing 토큰 */
export const RADIUS = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	round: 999,
} as const;
