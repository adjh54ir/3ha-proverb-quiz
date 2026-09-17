/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import mobileAds from 'react-native-google-mobile-ads';
import App from '../src/App';

/** jest.setup.js 의 목이 기록해 둔 AdMob 호출 순서 */
const adCalls = (): string[] => (mobileAds as unknown as { __calls: string[] }).__calls;

const mountApp = async (): Promise<ReactTestRenderer.ReactTestRenderer> => {
	let tree!: ReactTestRenderer.ReactTestRenderer;
	await ReactTestRenderer.act(() => {
		tree = ReactTestRenderer.create(<App />);
	});
	return tree;
};

/**
 * 마운트만 확인하는 스모크 테스트라도 반드시 정리한다.
 * 홈에서 자동으로 뜨는 화면 안내(CharacterGuide)가 28ms 타이핑 타이머를 돌리는데,
 * 언마운트하지 않으면 그 타이머가 테스트가 끝난 뒤에도 살아남아
 * "Jest environment has been torn down" 오류로 다른 스위트를 흔든다.
 */
const unmount = async (tree: ReactTestRenderer.ReactTestRenderer): Promise<void> => {
	await ReactTestRenderer.act(() => {
		tree.unmount();
	});
};

test('renders correctly', async () => {
	const tree = await mountApp();
	await unmount(tree);
});

/**
 * 광고 음소거는 반드시 initialize() 가 끝난 **뒤에** 걸어야 한다.
 *
 * 안드로이드는 초기화 전에 setAppMuted/setAppVolume 을 부르면 네이티브에서
 * IllegalStateException 이 나면서 앱이 그대로 죽는다. @ReactMethod 안에서 던져지므로
 * JS try/catch 로도 못 잡는다 — 순서가 곧 크래시 여부다.
 */
test('AdMob 음소거는 initialize() 이후에 건다 (안드로이드 네이티브 크래시 방지)', async () => {
	adCalls().length = 0;

	const tree = await mountApp();
	// initialize() 프로미스의 then 이 소화될 때까지 한 틱 더 돌린다
	await ReactTestRenderer.act(async () => {
		await Promise.resolve();
	});

	const calls = adCalls();
	expect(calls).toContain('initialize');
	expect(calls).toContain('setAppMuted');
	expect(calls.indexOf('initialize')).toBeLessThan(calls.indexOf('setAppMuted'));
	expect(calls.indexOf('initialize')).toBeLessThan(calls.indexOf('setAppVolume'));

	await unmount(tree);
});

/**
 * Google Play 가족 정책: 광고 콘텐츠가 앱 등급(전체이용가)을 넘으면 반려된다.
 * 등급 제한은 initialize() 전에 걸어야 SDK 가 미리 받아 두는 광고부터 적용된다.
 */
test('AdMob 광고 등급을 G 로 제한하고 initialize() 전에 건다 (가족 정책)', async () => {
	adCalls().length = 0;
	const instance = (mobileAds as unknown as { __instance: { setRequestConfiguration: jest.Mock } }).__instance;

	const tree = await mountApp();
	await ReactTestRenderer.act(async () => {
		await Promise.resolve();
	});

	expect(instance.setRequestConfiguration).toHaveBeenCalledWith({
		maxAdContentRating: 'G',
		tagForChildDirectedTreatment: true,
		tagForUnderAgeOfConsent: true,
	});
	const calls = adCalls();
	expect(calls).toContain('setRequestConfiguration');
	expect(calls.indexOf('setRequestConfiguration')).toBeLessThan(calls.indexOf('initialize'));

	await unmount(tree);
});
