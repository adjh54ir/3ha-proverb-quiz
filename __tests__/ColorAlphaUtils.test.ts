import { withAlpha, ALPHA, inkOnFill, readableTextOn } from '@/utils/ColorAlphaUtils';
import { COLORS, PALETTES, setThemeMode } from '@/const/common/Theme';

describe('withAlpha', () => {
	afterEach(() => setThemeMode('light'));

	it('6자리 hex 를 rgba 로 바꾼다', () => {
		setThemeMode('light');
		expect(withAlpha('#22C55E', 0.5)).toBe('rgba(34, 197, 94, 0.5)');
	});

	it('3자리 hex 도 지원한다 (문자열 이어붙이기로는 깨지던 케이스)', () => {
		setThemeMode('light');
		expect(withAlpha('#0F0', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
	});

	it('hex 가 아니면 원본을 그대로 돌려준다', () => {
		setThemeMode('light');
		expect(withAlpha('rgba(0,0,0,0.5)', 0.5)).toBe('rgba(0,0,0,0.5)');
		expect(withAlpha('', 0.5)).toBe('');
	});

	it('다크모드에서는 틴트를 진하게 올려 배경에 묻히지 않게 한다', () => {
		setThemeMode('light');
		const light = withAlpha('#22C55E', ALPHA.soft);
		setThemeMode('dark');
		const dark = withAlpha('#22C55E', ALPHA.soft);

		const alphaOf = (rgba: string) => Number(rgba.split(',').pop()!.replace(')', ''));
		expect(alphaOf(dark)).toBeGreaterThan(alphaOf(light));
	});

	it('보정을 해도 0.9 를 넘지 않는다', () => {
		setThemeMode('dark');
		const alphaOf = (rgba: string) => Number(rgba.split(',').pop()!.replace(')', ''));
		expect(alphaOf(withAlpha('#22C55E', 1))).toBeLessThanOrEqual(0.9);
	});
});

describe('readableTextOn', () => {
	it('어두운 배경에는 흰 글자', () => {
		expect(readableTextOn('#1E293B')).toBe('#FFFFFF');
		expect(readableTextOn('#DC2626')).toBe('#FFFFFF');
	});

	it('밝은 배경에는 진한 글자 (흰 아이콘이 안 보이던 케이스)', () => {
		expect(readableTextOn('#FCD34D')).toBe('#1E293B'); // 연노랑
		expect(readableTextOn('#FBBF24')).toBe('#1E293B'); // 앰버
	});

	it('hex 가 아니면 기존 동작대로 흰 글자', () => {
		expect(readableTextOn('rgba(0,0,0,1)')).toBe('#FFFFFF');
		expect(readableTextOn('')).toBe('#FFFFFF');
	});
});

describe('inkOnFill', () => {
	afterEach(() => setThemeMode('light'));

	it('라이트의 쪽빛·물빛 채움은 흰 글자를 유지한다 (브랜드 버튼 톤 불변)', () => {
		setThemeMode('light');
		expect(inkOnFill(COLORS.primary)).toBe('#FFFFFF');
		expect(inkOnFill(COLORS.secondary)).toBe('#FFFFFF');
	});

	it('다크의 쪽빛·물빛 채움은 진한 글자로 뒤집는다', () => {
		setThemeMode('dark');
		expect(inkOnFill(COLORS.primary)).toBe(PALETTES.dark.textOnVivid);
		expect(inkOnFill(COLORS.secondary)).toBe(PALETTES.dark.textOnVivid);
	});

	it('밝은 데이터 색(초급 #34D399)은 모드와 무관하게 밝기로 고른다', () => {
		expect(inkOnFill('#34D399')).toBe(readableTextOn('#34D399'));
		expect(inkOnFill('#B91C1C')).toBe('#FFFFFF');
	});
});
