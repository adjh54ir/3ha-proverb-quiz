import { scaledSize, scaleWidth, scaleHeight } from '@/utils/DementionUtils';

/**
 * 앱 전체 디자인 토큰 (단일 소스, Single Source of Truth)
 * - 색상/폰트/여백/라운드는 반드시 이 파일의 토큰을 사용한다.
 * - Primary: 그린 / Text: 슬레이트 (라이트/다크 두 팔레트가 같은 키를 공유)
 *
 * ── 다크모드 동작 방식 ─────────────────────────────────────────────
 * `COLORS` 는 일반 객체가 아니라 **현재 모드의 팔레트를 그때그때 읽어오는 Proxy** 다.
 * 덕분에 화면 코드는 기존처럼 `COLORS.text` 만 써도 모드에 따라 값이 달라진다.
 *
 * 단, `StyleSheet.create({...})` 는 모듈 로드 시 한 번만 평가되므로 색이 그 시점 값으로
 * 굳어버린다. 그래서 스타일시트는 `themedStyles(() => StyleSheet.create({...}))` 로 감싸
 * 모드별로 지연 생성 + 캐싱한다.
 *
 * 시스템(OS) 다크모드는 따르지 않는다. 항상 라이트로 시작하고,
 * 설정 화면에서 사용자가 고른 값만 반영한다. (`useThemeMode` 훅 참고)
 */

/** 타워/챌린지 화면 전용 다크 톤 — 라이트/다크 공통으로 같은 값을 쓴다. */
const FIXED_DARK_SCREEN = {
	darkBg: '#1a1a2e',
	darkBgAlt: '#16213e',
	darkSurface: '#0f3460',
	darkGradient: ['#2B2D3A', '#21222C', '#191A21'] as [string, string, string],
	darkText: '#F1F5F9',
	darkTextSecondary: '#CBD5E1',
	darkAccent: '#60A5FA',
	towerVictoryBg: '#064E3B',
	towerDefeatBg: '#7F1D1D',
};

/** 라이트(기본) 팔레트 */
const LIGHT_COLORS = {
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
	textWhite: '#FFFFFF', // 컬러 배경 위 텍스트 (모드 무관 고정)

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
	...FIXED_DARK_SCREEN,

	// ===== Dim =====
	dim: 'rgba(0, 0, 0, 0.5)',
	dimLight: 'rgba(0, 0, 0, 0.3)',
};

/** 팔레트 타입 — 다크 팔레트는 라이트와 완전히 같은 키를 가져야 한다. */
export type AppColors = typeof LIGHT_COLORS;

/**
 * 다크 팔레트
 * - 배경은 슬레이트 900/800, 텍스트는 슬레이트 100 계열로 뒤집는다.
 * - 액센트(그린/블루/오렌지…)는 어두운 배경에서 묻히지 않게 한 단계 밝은 톤으로 올린다.
 * - `~Bg` / `~Soft` 처럼 "옅은 틴트 배경"용 토큰은 어두운 틴트로 반전시키고,
 *   그 위에 올라가는 `~Deep` / `~Text` 토큰은 반대로 밝게 뒤집어 대비를 유지한다.
 * - `textWhite` 는 컬러 버튼 위 글자색이라 두 모드 모두 흰색을 유지한다.
 */
const DARK_COLORS: AppColors = {
	// ===== Primary (Green) =====
	primary: '#34D399',
	primaryLight: '#6EE7B7',
	primaryDark: '#22C55E',
	primaryDeep: '#16A34A',
	primaryBg: '#10281C',
	primarySoft: '#14532D',
	primaryBorder: '#166534',

	// ===== Secondary (Blue) =====
	secondary: '#60A5FA',
	secondaryLight: '#93C5FD',
	secondaryDark: '#3B82F6',
	secondarySoft: '#1E3A5F',
	secondaryBg: '#0F2438',

	// ===== Text =====
	text: '#E2E8F0',
	textStrong: '#F8FAFC',
	textSecondary: '#A3AEBF',
	textLight: '#7C8799',
	textMuted: '#B6C0CE',
	textDeep: '#FFFFFF',
	textWhite: '#FFFFFF',

	// ===== Background / Surface =====
	background: '#0F172A',
	surface: '#1B2536',
	surfaceAlt: '#243044',

	// ===== Border / Divider =====
	border: '#334155',
	borderLight: '#2C3A4F',
	borderDark: '#475569',
	secondaryBorder: '#2C4A6E',

	// ===== Accent (Orange/Amber) =====
	accentOrange: '#FB923C',
	accentOrangeDark: '#F59E0B',
	accentOrangeDeep: '#FDBA74',
	accentOrangeText: '#FCD9B6',
	accentOrangeBg: '#2A1C0F',
	accentOrangeBorder: '#7C4A15',
	accentFlame: '#FB923C',
	accentOrangeLight: '#FDBA74',
	accentOrangeSoft: '#3A2612',
	accentTeal: '#2DD4BF',
	accentTealBg: '#0F3A36',
	accentSky: '#38BDF8',
	accentSkyBg: '#0C2E44',
	accentTealDeep: '#99F6E4',
	accentPink: '#F472B6',

	// ===== Semantic =====
	success: '#34D399',
	successBg: '#10281C',
	successSoft: '#14532D',
	successBorder: '#166534',
	info: '#60A5FA',
	infoDark: '#3B82F6',
	infoBg: '#0F2438',
	warning: '#FBBF24',
	warningDark: '#F59E0B',
	warningBg: '#3A2C0A',
	warningSoft: '#2A2210',
	warningDeep: '#FCD34D',
	warningBorder: '#7C5A12',
	danger: '#F87171',
	dangerLight: '#FCA5A5',
	dangerSoftBg: '#2A1416',
	dangerBorder: '#7F2A2A',
	dangerBorderSoft: '#5C1F22',
	dangerDark: '#EF4444',
	dangerDeep: '#FCA5A5',
	dangerBg: '#3A1A1C',
	gold: '#FDE047',
	goldLight: '#FEF08A',

	// ===== Dark (타워/챌린지 화면은 두 모드 동일) =====
	...FIXED_DARK_SCREEN,

	// ===== Dim =====
	dim: 'rgba(0, 0, 0, 0.65)',
	dimLight: 'rgba(0, 0, 0, 0.5)',
};

export type ThemeMode = 'light' | 'dark';

export const PALETTES: Record<ThemeMode, AppColors> = {
	light: LIGHT_COLORS,
	dark: DARK_COLORS,
};

/** 상태바 아이콘 색 — 다크 배경에서는 밝은 아이콘이어야 보인다. */
export const STATUS_BAR_STYLE: Record<ThemeMode, 'dark-content' | 'light-content'> = {
	light: 'dark-content',
	dark: 'light-content',
};

// ─────────────────────────────────────────────────────────────
// 활성 모드 저장소 (Context 대신 모듈 스코프 — StyleSheet 도 읽어야 하므로)
// ─────────────────────────────────────────────────────────────
let activeMode: ThemeMode = 'light';
const listeners = new Set<() => void>();

export const getThemeMode = (): ThemeMode => activeMode;

/** 모드 변경 구독 (useSyncExternalStore 용). 반환값은 해지 함수. */
export const subscribeThemeMode = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** 모드 전환. 구독한 컴포넌트가 리렌더되며 COLORS/스타일이 새 팔레트로 바뀐다. */
export const setThemeMode = (mode: ThemeMode): void => {
	if (mode === activeMode) {
		return;
	}
	activeMode = mode;
	listeners.forEach((listener) => listener());
};

// ─────────────────────────────────────────────────────────────
// 글자 크기 모드 (접근성)
// ─────────────────────────────────────────────────────────────
/** 'default' = 기본, 'large' = 글자 크게 */
export type TextSizeMode = 'default' | 'large';

/** FONT_SIZES 토큰에 곱해지는 배율. OS 글꼴 설정과 무관하게 앱 안에서 적용된다. */
const TEXT_SIZE_FACTOR: Record<TextSizeMode, number> = {
	default: 1,
	large: 1.15,
};

/**
 * OS 글꼴 확대 상한.
 * 기본 모드는 레이아웃이 깨질 만큼의 과확대만 막고(1.25),
 * '글자 크게' 모드에서는 시각 약자를 위해 상한을 더 풀어준다.
 */
export const TEXT_SIZE_MAX_MULTIPLIER: Record<TextSizeMode, number> = {
	default: 1.25,
	large: 1.5,
};

let activeTextSize: TextSizeMode = 'default';

export const getTextSizeMode = (): TextSizeMode => activeTextSize;

/** 글자 크기 모드 변경 구독 — 테마와 같은 리스너를 쓰므로 화면이 함께 리렌더된다. */
export const subscribeTextSizeMode = subscribeThemeMode;

/** 글자 크기 전환. FONT_SIZES 와 themedStyles 캐시가 새 배율로 다시 만들어진다. */
export const setTextSizeMode = (mode: TextSizeMode): void => {
	if (mode === activeTextSize) {
		return;
	}
	activeTextSize = mode;
	listeners.forEach((listener) => listener());
};

/**
 * react-native-dropdown-picker 용 테마 값.
 * 라이브러리 내부 기본 색(리스트 라벨/배경)이 라이트 고정이라 다크에서 글자가 묻힌다.
 */
export const getPickerTheme = (): 'LIGHT' | 'DARK' => (activeMode === 'dark' ? 'DARK' : 'LIGHT');

/** 현재 모드의 팔레트를 매 접근마다 읽어오는 Proxy 를 만든다. */
const createLivePalette = <T extends object>(read: (palette: AppColors) => T): T =>
	new Proxy({} as T, {
		get: (_target, key) => (read(PALETTES[activeMode]) as any)[key],
		has: (_target, key) => key in read(PALETTES[activeMode]),
		ownKeys: () => Reflect.ownKeys(read(PALETTES[activeMode])),
		getOwnPropertyDescriptor: (_target, key) => {
			const source = read(PALETTES[activeMode]) as any;
			if (!(key in source)) {
				return undefined;
			}
			return { value: source[key], enumerable: true, configurable: true, writable: false };
		},
	});

/**
 * 색상 토큰. 현재 모드의 값을 읽어오는 Proxy 이므로 렌더 중 접근하면 항상 최신값이다.
 * (모듈 스코프 상수에 담아두면 값이 굳으니 렌더 시점에 읽어야 한다)
 */
export const COLORS: AppColors = createLivePalette((palette) => palette);

/**
 * 화면 상단 히어로 배너 전용 톤 (앰버/오렌지 계열로 통일)
 * - 화면마다 제각각이던 배경/보더/텍스트 색 리터럴을 이 토큰 하나로 수렴시킨다.
 */
export const HERO = createLivePalette((palette) => ({
	bg: palette.accentOrangeBg, // 히어로 배경 틴트
	accent: palette.accentOrangeDark, // 상단 강조 보더
	title: palette.accentOrangeDeep, // 히어로 타이틀
	description: palette.accentOrangeText, // 히어로 설명
}));

/**
 * 모드별 지연 생성 값 (객체/배열).
 *
 * 모듈 스코프에서 `COLORS.x` 를 담아 두면 로드 시점의 팔레트로 값이 굳어 다크모드에서
 * 반영되지 않는다. 이 함수로 감싸면 접근 시점의 모드로 만들어 모드별로 캐싱한다.
 *
 * ```ts
 * const SECTIONS = themedValue(() => [{ iconColor: COLORS.primaryDark }]);
 * ```
 */
export const themedValue = <T extends object>(factory: () => T): T => {
	// 캐시 키 = 팔레트 모드 + 글자 크기 모드. 둘 중 하나만 바뀌어도 다시 만들어야 한다.
	const cacheKey = (): string => `${activeMode}|${activeTextSize}`;
	const cache = new Map<string, T>();
	const seed = factory();
	cache.set(cacheKey(), seed);

	const resolve = (): any => {
		let value = cache.get(cacheKey());
		if (!value) {
			value = factory();
			cache.set(cacheKey(), value);
		}
		return value;
	};

	// 배열이면 배열 타깃이어야 Array.prototype 메서드/스프레드가 정상 동작한다.
	const target: any = Array.isArray(seed) ? [] : {};

	return new Proxy(target, {
		get: (_target, key) => resolve()[key],
		has: (_target, key) => key in resolve(),
		ownKeys: () => Reflect.ownKeys(resolve()),
		// 실제 값의 디스크립터를 그대로 넘겨야 배열 length 같은 non-configurable 속성에서 안전하다.
		getOwnPropertyDescriptor: (_target, key) => Reflect.getOwnPropertyDescriptor(resolve(), key),
	});
};

/**
 * 모드별 지연 생성 스타일시트.
 *
 * ```ts
 * const styles = themedStyles(() => StyleSheet.create({ box: { backgroundColor: COLORS.surface } }));
 * ```
 * `styles.box` 를 읽는 시점의 모드로 스타일시트를 만들어 캐싱한다.
 * 모드가 바뀌어도 컴포넌트가 리렌더되면 새 팔레트 스타일이 적용된다.
 */
export const themedStyles = themedValue;

/**
 * 폰트 사이즈 체계 (scaledSize 적용 완료 값)
 * 화면에서는 FONT_SIZES.md 처럼 바로 사용한다.
 *
 * ── 타이틀 사용 규칙 (통일 기준) ──────────────────────────────
 * - `xl`      : 바텀시트 헤더. 시트는 화면을 거의 채우므로 다이얼로그보다 한 단계 낮춘다.
 *               (예: AddProverbModal / FavoriteAddModal 의 headerTitle)
 * - `heading` : 가운데 뜨는 다이얼로그형 모달의 타이틀 기본값.
 *               (예: QuizStartModal, CheckInModal, DailyMissionModal …)
 * - `xxl`     : 화면(Screen) 타이틀. 모달에는 쓰지 않는다.
 * 새 모달을 만들 때 이 규칙을 벗어나면 화면 간 위계가 흔들리므로 반드시 둘 중 하나를 고른다.
 */
const BASE_FONT_SIZES = {
	xxs: 10, // 캡션/뱃지
	xs: 11, // 탭 라벨
	sm: 12, // 보조 텍스트
	smPlus: 13, // 보조 본문
	md: 14, // 본문
	mdPlus: 15, // 본문 강조
	lg: 16, // 강조 본문/버튼
	xl: 18, // 섹션 타이틀/헤더
	xxl: 20, // 화면 타이틀
	heading: 22, // 모달 타이틀
	title: 24, // 큰 타이틀
	display: 28, // 결과/점수 강조
} as const;

/**
 * 글자 크기 모드가 반영된 폰트 토큰.
 * COLORS 와 같은 방식의 Proxy 라 렌더 시점 배율로 읽힌다(모듈 상수에 담아두면 굳는다).
 */
export const FONT_SIZES: Record<keyof typeof BASE_FONT_SIZES, number> = new Proxy({} as any, {
	get: (_t, key: string) => scaledSize((BASE_FONT_SIZES as any)[key] * TEXT_SIZE_FACTOR[activeTextSize]),
	has: (_t, key) => key in BASE_FONT_SIZES,
	ownKeys: () => Reflect.ownKeys(BASE_FONT_SIZES),
	getOwnPropertyDescriptor: (_t, key: string) =>
		key in BASE_FONT_SIZES
			? { value: scaledSize((BASE_FONT_SIZES as any)[key] * TEXT_SIZE_FACTOR[activeTextSize]), enumerable: true, configurable: true, writable: false }
			: undefined,
});

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

/**
 * 공통 터치 확장 영역(hitSlop) — 아이콘 버튼처럼 시각 크기가 작은 요소의 터치 반경을 넓힌다.
 * 화면 배율이 아니라 손가락 크기에 맞추는 값이라 scale 을 적용하지 않는다.
 */
export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
