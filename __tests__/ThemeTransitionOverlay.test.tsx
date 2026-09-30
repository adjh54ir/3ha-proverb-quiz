import React from 'react';
import { Animated } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';

import ThemeTransitionOverlay from '@/components/animation/ThemeTransitionOverlay';
import { PALETTES, setThemeMode } from '@/const/common/Theme';

/**
 * 테마 전환 페이드 회귀 테스트.
 * 모드가 바뀐 순간 '이전 모드 배경색' 막이 불투명하게 서고, 터치를 막지 않아야 한다.
 */
afterEach(() => {
	act(() => setThemeMode('light'));
});

const overlayOf = (tree: ReactTestRenderer) => tree.root.findByType(Animated.View);

test('다크로 바꾸면 라이트 배경색 막이 덮였다가 걷힌다', async () => {
	jest.useFakeTimers();
	let tree!: ReactTestRenderer;
	await act(async () => {
		tree = create(<ThemeTransitionOverlay />);
	});

	act(() => setThemeMode('dark'));
	const style = [overlayOf(tree).props.style].flat(Infinity).reduce((acc, s) => ({ ...acc, ...s }), {});
	expect(style.backgroundColor).toBe(PALETTES.light.background);
	expect(overlayOf(tree).props.pointerEvents).toBe('none');

	act(() => {
		jest.runAllTimers();
	});
	jest.useRealTimers();
});

test('처음 마운트할 때는 막을 세우지 않는다 (앱 시작 시 번쩍임 없음)', async () => {
	let tree!: ReactTestRenderer;
	await act(async () => {
		tree = create(<ThemeTransitionOverlay />);
	});
	const opacity = [overlayOf(tree).props.style].flat(Infinity).find((s: any) => s && 'opacity' in s)?.opacity;
	expect(opacity?.__getValue?.() ?? opacity).toBe(0);
});
