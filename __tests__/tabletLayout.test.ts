/**
 * 태블릿 반응형 회귀 테스트
 *
 * 이 작업의 전제는 하나다 — **폰 레이아웃은 한 픽셀도 바뀌지 않는다.**
 * 배율 상한(MAX_SCALE)이나 기둥 폭을 손볼 때 그 전제가 깨지기 쉬우므로 숫자로 못박는다.
 *
 * 실기기 크기(pt/dp, 세로 기준)
 *  - iPhone SE 375x667 / iPhone 16 393x852 / iPhone 16 Pro Max 440x956
 *  - 최소 태블릿 600x960 / iPad mini 744x1133 / iPad 11" 820x1180 / iPad 13" 1024x1366
 */
import {
	computeContentMaxWidth,
	computeModalMaxWidth,
	computeScaleRatios,
	designHeight,
	designWidth,
	isTabletSize,
	MAX_SCALE,
	TABLET_MAX_SCALE,
	TABLET_MIN_SHORT_SIDE,
} from '@/utils/DementionUtils';

const PHONES: Array<[string, number, number]> = [
	['iPhone SE', 375, 667],
	['iPhone 16', 393, 852],
	['iPhone 16 Pro Max', 440, 956],
];

const TABLETS: Array<[string, number, number]> = [
	['최소 태블릿(sw600dp)', 600, 960],
	['iPad mini', 744, 1133],
	['iPad 11"', 820, 1180],
	['iPad 13"', 1024, 1366],
];

describe('태블릿 판정', () => {
	test.each(PHONES)('%s 는 폰으로 판정한다', (_name, w, h) => {
		expect(isTabletSize(w, h)).toBe(false);
	});

	test.each(TABLETS)('%s 는 태블릿으로 판정한다', (_name, w, h) => {
		expect(isTabletSize(w, h)).toBe(true);
	});

	test('짧은 변 기준이라 세로/가로가 바뀌어도 결과가 같다', () => {
		expect(isTabletSize(820, 1180)).toBe(isTabletSize(1180, 820));
		expect(isTabletSize(393, 852)).toBe(isTabletSize(852, 393));
	});

	test('기준선은 안드로이드 sw600dp 와 같은 값이다', () => {
		expect(TABLET_MIN_SHORT_SIDE).toBe(600);
		expect(isTabletSize(599, 2000)).toBe(false);
		expect(isTabletSize(600, 2000)).toBe(true);
	});
});

describe('폰 배율은 상한에 닿지 않는다 (= 폰 레이아웃 불변)', () => {
	test.each(PHONES)('%s 의 가로·세로 배율이 상한 미만이다', (_name, w, h) => {
		const { widthRatio, heightRatio } = computeScaleRatios(w, h);
		// 상한에 걸리지 않았다 = 화면 비율이 그대로 쓰인다 = 기존 동작과 동일하다.
		expect(widthRatio).toBeLessThan(MAX_SCALE);
		expect(heightRatio).toBeLessThan(MAX_SCALE);
		expect(widthRatio).toBeCloseTo(w / designWidth);
		expect(heightRatio).toBeCloseTo(h / designHeight);
	});
});

describe('태블릿 배율은 상한으로 묶인다', () => {
	test.each(TABLETS)('%s 의 가로 배율이 태블릿 상한을 넘지 않는다', (_name, w, h) => {
		const { widthRatio, heightRatio } = computeScaleRatios(w, h, TABLET_MAX_SCALE);
		expect(widthRatio).toBeLessThanOrEqual(TABLET_MAX_SCALE);
		expect(heightRatio).toBeLessThanOrEqual(TABLET_MAX_SCALE);
	});

	test('상한이 없으면 아이패드에서 2배 이상 커진다 (상한이 필요한 이유)', () => {
		expect(1024 / designWidth).toBeGreaterThan(2);
	});

	test('태블릿 상한은 폰 상한보다 크다 (넓어진 기둥과 균형)', () => {
		expect(TABLET_MAX_SCALE).toBeGreaterThan(MAX_SCALE);
	});

	test('작은 태블릿의 세로 배율은 상한이 아니라 실제 비율을 쓴다', () => {
		// 960/812 = 1.18 < 1.35 — 상한값을 그대로 박으면 세로로 짠 화면이 넘친다.
		const { heightRatio } = computeScaleRatios(600, 960, TABLET_MAX_SCALE);
		expect(heightRatio).toBeCloseTo(960 / designHeight);
		expect(heightRatio).toBeLessThan(TABLET_MAX_SCALE);
	});
});

describe('본문 기둥 폭', () => {
	test.each(PHONES)('%s 에서는 화면 폭보다 넓어 걸리지 않는다', (_name, w, h) => {
		expect(computeContentMaxWidth(w, h)).toBeGreaterThan(w);
	});

	test.each(TABLETS)('%s 에서는 좌우 여백이 남는다', (_name, w, h) => {
		expect(computeContentMaxWidth(w, h)).toBeLessThan(w);
	});

	test('큰 태블릿일수록 기둥이 넓어진다 (고정값이면 여백만 늘어난다)', () => {
		const widths = TABLETS.map(([, w, h]) => computeContentMaxWidth(w, h));
		const sorted = [...widths].sort((a, b) => a - b);
		expect(widths).toEqual(sorted);
	});

	test('기둥이 무한히 넓어지지는 않는다', () => {
		expect(computeContentMaxWidth(2000, 3000)).toBeLessThanOrEqual(700);
	});
});

describe('모달 카드 폭', () => {
	test.each(TABLETS)('%s 에서 카드는 기둥보다 좁다 (딤이 보여야 대화상자로 읽힌다)', (_name, w, h) => {
		expect(computeModalMaxWidth(w, h)).toBeLessThan(computeContentMaxWidth(w, h));
	});

	test.each(PHONES)('%s 에서는 화면 폭보다 넓어 걸리지 않는다', (_name, w, h) => {
		expect(computeModalMaxWidth(w, h)).toBeGreaterThan(w);
	});
});

/**
 * 네이티브 설정은 JS 에서 못 잡는다 — 태블릿을 켜고 세로를 고정하는 네 가지 스위치를 소스로 확인한다.
 * 하나라도 빠지면 아이패드에서 앱이 아예 안 보이거나(iPhone 전용) 가로로 돌아가 레이아웃이 깨진다.
 */
describe('네이티브 태블릿 설정', () => {
	const fs = require('fs') as typeof import('fs');
	const path = require('path') as typeof import('path');
	const read = (relative: string) => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');

	test('iOS 타깃이 iPhone + iPad 다', () => {
		const project = read('ios/ProverbQuiz.xcodeproj/project.pbxproj');
		expect(project).toMatch(/TARGETED_DEVICE_FAMILY = "1,2";/);
		// 1 만 남은 설정이 하나도 없어야 한다(Debug/Release 둘 다 바꿔야 한다).
		expect(project).not.toMatch(/TARGETED_DEVICE_FAMILY = 1;/);
	});

	test('아이패드도 세로 고정이다', () => {
		const plist = read('ios/ProverbQuiz/Info.plist');
		// 멀티태스킹을 지원하면 애플이 네 방향 회전을 모두 요구한다 → 전체화면 전용으로 선언한다.
		expect(plist).toMatch(/<key>UIRequiresFullScreen<\/key>\s*<true\/>/);
		const ipad = /<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(plist);
		expect(ipad).not.toBeNull();
		expect(ipad?.[1]).toMatch(/UIInterfaceOrientationPortrait/);
		expect(ipad?.[1]).not.toMatch(/Landscape/);
	});

	test('안드로이드 태블릿도 세로 고정이다', () => {
		const manifest = read('android/app/src/main/AndroidManifest.xml');
		expect(manifest).toMatch(/android:screenOrientation="portrait"/);
		// targetSdk 36 부터는 sw600dp 이상에서 screenOrientation 이 무시된다 → 이 속성으로 유지한다.
		expect(manifest).toMatch(/PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY/);
	});
});
