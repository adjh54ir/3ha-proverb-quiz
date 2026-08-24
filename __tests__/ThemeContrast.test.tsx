/**
 * 라이트/다크 대비(contrast) 회귀 테스트.
 *
 * 이 앱에서 실제로 터졌던 버그는 전부 같은 종류였다 —
 * "모드에 따라 뒤집히는 텍스트 토큰이, 모드와 무관하게 밝은 배경 위에 올라가 있다".
 * (골드 토스트의 흰 글자, 앰버 버튼의 흰 글자, 고정 다크 화면의 회색 글자 …)
 *
 * 눈으로 두 모드를 다 열어 보는 대신, 실제로 화면에서 쓰는 배경/글자 토큰 조합의
 * 명암비를 두 팔레트 모두에서 계산해 기준선을 지킨다.
 */
import { PALETTES } from '@/const/common/Theme';

/** WCAG 상대 휘도 */
const luminance = (hex: string): number => {
	const value = hex.replace('#', '');
	const channel = (offset: number) => {
		const c = parseInt(value.slice(offset, offset + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
};

const contrast = (bg: string, ink: string): number => {
	const [light, dark] = [luminance(bg), luminance(ink)].sort((a, b) => b - a);
	return (light + 0.05) / (dark + 0.05);
};

const ratios = (bg: keyof typeof PALETTES.light, ink: keyof typeof PALETTES.light) => ({
	light: contrast(PALETTES.light[bg] as string, PALETTES.light[ink] as string),
	dark: contrast(PALETTES.dark[bg] as string, PALETTES.dark[ink] as string),
});

/**
 * 화면에서 실제로 붙어 있는 (배경, 글자) 토큰 쌍.
 * 큰 글자/UI 요소 기준선인 3.0 을 두 모드 모두에서 넘겨야 한다.
 */
const PAIRS: Array<[keyof typeof PALETTES.light, keyof typeof PALETTES.light]> = [
	['surface', 'text'],
	['surface', 'textStrong'],
	['surface', 'textSecondary'],
	['background', 'text'],
	['surfaceAlt', 'textSecondary'],
	// 밝은 액센트 위에는 뒤집히지 않는 고정 잉크를 써야 한다 (골드 토스트/앰버 버튼 회귀)
	['warning', 'textOnAccent'],
	['gold', 'textOnAccent'],
	// 옅은 틴트 배경 + 그 위 진한 글자
	['primaryBg', 'primaryDeep'],
	['warningBg', 'warningDeep'],
	['dangerBg', 'dangerDeep'],
	['accentOrangeBg', 'accentOrangeText'],
	['accentTealBg', 'accentTealDeep'],
	// 타워/챌린지 고정 다크 화면 (두 모드 값이 같아야 한다)
	['darkBg', 'textWhite'],
	['darkSurface', 'darkTextSecondary'],
	['darkMuted', 'textWhite'],
	['towerVictoryBg', 'textWhite'],
	['towerDefeatBg', 'textWhite'],
];

test.each(PAIRS)('%s 배경 위의 %s 는 두 모드 모두 대비 3.0 이상이다', (bg, ink) => {
	const { light, dark } = ratios(bg, ink);
	expect(light).toBeGreaterThanOrEqual(3);
	expect(dark).toBeGreaterThanOrEqual(3);
});

/**
 * 아직 기준선을 못 넘는 조합 — 브랜드 색을 바꿔야 해서 보류 중이다.
 * (solid 버튼 채움색 + 흰 글자. primary 는 두 모드 모두 3.0 미만)
 * 여기서는 "지금보다 더 나빠지지 않는 것" 만 지킨다. 고치면 이 표에서 빼고 위 PAIRS 로 옮긴다.
 */
const KNOWN_GAPS: Array<[keyof typeof PALETTES.light, keyof typeof PALETTES.light, number, number]> = [
	['primary', 'textWhite', 2.28, 1.92],
	['secondary', 'textWhite', 3.68, 2.54],
	['danger', 'textWhite', 3.76, 2.77],
];

test.each(KNOWN_GAPS)('%s / %s 대비가 현재보다 더 나빠지지 않는다', (bg, ink, minLight, minDark) => {
	const { light, dark } = ratios(bg, ink);
	expect(light).toBeGreaterThanOrEqual(minLight - 0.01);
	expect(dark).toBeGreaterThanOrEqual(minDark - 0.01);
});

test('고정 토큰은 두 팔레트에서 값이 같다', () => {
	(['textOnAccent', 'darkMuted', 'darkBg', 'towerVictoryBg', 'towerDefeatBg'] as const).forEach((key) => {
		expect(PALETTES.dark[key]).toBe(PALETTES.light[key]);
	});
});
