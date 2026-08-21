/**
 * 다크모드 토큰 회귀 테스트
 * - COLORS 는 현재 모드를 따라가는 라이브 객체여야 한다.
 * - themedStyles 로 감싼 스타일시트는 모드별로 다시 만들어져야 한다.
 * - 다크 팔레트는 라이트와 같은 키를 하나도 빠짐없이 가져야 한다(누락 시 undefined 색상 발생).
 */
import { StyleSheet } from 'react-native';
import {
	COLORS,
	FONT_SIZES,
	HERO,
	PALETTES,
	TEXT_SIZE_MAX_MULTIPLIER,
	getPickerTheme,
	getTextSizeMode,
	getThemeMode,
	setTextSizeMode,
	setThemeMode,
	themedStyles,
	themedValue,
} from '../src/const/common/Theme';

afterEach(() => {
	setThemeMode('light');
	setTextSizeMode('default');
});

test('기본 모드는 라이트다 (시스템 설정을 따르지 않는다)', () => {
	expect(getThemeMode()).toBe('light');
	expect(COLORS.background).toBe(PALETTES.light.background);
});

test('다크/라이트 팔레트의 키가 완전히 일치한다', () => {
	expect(Object.keys(PALETTES.dark).sort()).toEqual(Object.keys(PALETTES.light).sort());
	Object.values(PALETTES.dark).forEach((value) => expect(value).toBeDefined());
});

test('모드를 바꾸면 COLORS/HERO 가 다크 팔레트를 가리킨다', () => {
	setThemeMode('dark');
	expect(COLORS.background).toBe(PALETTES.dark.background);
	expect(COLORS.text).toBe(PALETTES.dark.text);
	expect(HERO.bg).toBe(PALETTES.dark.accentOrangeBg);
});

test('themedStyles 는 모드별로 스타일을 다시 만든다', () => {
	const styles = themedStyles(() => StyleSheet.create({ box: { backgroundColor: COLORS.surface } }));

	expect(styles.box.backgroundColor).toBe(PALETTES.light.surface);
	setThemeMode('dark');
	expect(styles.box.backgroundColor).toBe(PALETTES.dark.surface);
	setThemeMode('light');
	expect(styles.box.backgroundColor).toBe(PALETTES.light.surface);
});

test('모드 변경 시 구독자에게 알린다', () => {
	const listener = jest.fn();
	const unsubscribe = require('../src/const/common/Theme').subscribeThemeMode(listener);

	setThemeMode('dark');
	expect(listener).toHaveBeenCalledTimes(1);

	setThemeMode('dark'); // 같은 값이면 알리지 않는다
	expect(listener).toHaveBeenCalledTimes(1);

	unsubscribe();
	setThemeMode('light');
	expect(listener).toHaveBeenCalledTimes(1);
});

test('themedValue 결과를 style 배열에 넣어도 flatten 이 정상 동작한다 (TextDefaults 경로)', () => {
	// 전역 기본 텍스트 스타일이 Proxy 라서, RN 의 style 평탄화가 깨지지 않는지 확인한다.
	const defaultTextStyle = themedValue(() => ({ fontSize: 14, color: COLORS.text }));

	expect(StyleSheet.flatten([defaultTextStyle, { fontWeight: '700' }])).toEqual({
		fontSize: 14,
		color: PALETTES.light.text,
		fontWeight: '700',
	});
	expect({ ...defaultTextStyle }).toEqual({ fontSize: 14, color: PALETTES.light.text });

	setThemeMode('dark');
	expect(StyleSheet.flatten([defaultTextStyle]).color).toBe(PALETTES.dark.text);
});

test('themedValue 는 배열도 감쌀 수 있다 (map/스프레드 유지)', () => {
	const labels = themedValue(() => [COLORS.primary, COLORS.secondary]);

	expect(Array.isArray(labels)).toBe(true);
	expect([...labels]).toEqual([PALETTES.light.primary, PALETTES.light.secondary]);
	expect(labels.map((c) => c)).toEqual([PALETTES.light.primary, PALETTES.light.secondary]);

	setThemeMode('dark');
	expect(labels[0]).toBe(PALETTES.dark.primary);
});

test('드롭다운 라이브러리 테마도 모드를 따라간다', () => {
	expect(getPickerTheme()).toBe('LIGHT');
	setThemeMode('dark');
	expect(getPickerTheme()).toBe('DARK');
});

test("글자 크게 모드는 FONT_SIZES 를 키우고 OS 확대 상한도 함께 푼다", () => {
	const base = FONT_SIZES.md;

	setTextSizeMode('large');
	expect(getTextSizeMode()).toBe('large');
	expect(FONT_SIZES.md).toBeGreaterThan(base);
	expect(TEXT_SIZE_MAX_MULTIPLIER.large).toBeGreaterThan(TEXT_SIZE_MAX_MULTIPLIER.default);

	setTextSizeMode('default');
	expect(FONT_SIZES.md).toBe(base);
});

test('themedStyles 는 글자 크기 모드가 바뀌어도 다시 만들어진다', () => {
	const styles = themedStyles(() => StyleSheet.create({ label: { fontSize: FONT_SIZES.md } }));
	const base = styles.label.fontSize;

	setTextSizeMode('large');
	expect(styles.label.fontSize).toBeGreaterThan(base);
	setTextSizeMode('default');
	expect(styles.label.fontSize).toBe(base);
});

test('스타일 객체를 Object.freeze 해도 값이 계속 모드를 따라간다 (RN 개발 모드 회귀)', () => {
	// RN 은 __DEV__ 에서 StyleSheet 의 스타일 객체를 Object.freeze 한다.
	// 예전엔 이 값들이 Proxy 라서 얼리는 순간 불변식이 깨지며
	// "trap result is configurable but target property is non-configurable" 로 <Text> 렌더가 죽었다.
	const defaultTextStyle = themedValue(() => ({ fontSize: FONT_SIZES.md, color: COLORS.text }));

	expect(() => Object.freeze(defaultTextStyle)).not.toThrow();
	expect(() => Object.keys(defaultTextStyle)).not.toThrow();
	expect(StyleSheet.flatten([defaultTextStyle]).color).toBe(PALETTES.light.text);

	setThemeMode('dark');
	expect(StyleSheet.flatten([defaultTextStyle]).color).toBe(PALETTES.dark.text);

	expect(() => Object.freeze(COLORS)).not.toThrow();
	expect(COLORS.text).toBe(PALETTES.dark.text);
});
