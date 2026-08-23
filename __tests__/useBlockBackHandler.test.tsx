/**
 * 안드로이드 뒤로가기 처리 회귀 테스트.
 *
 * 예전에는 뒤로가기를 그냥 삼켜서(true 만 반환) 퀴즈 화면에서 뒤로가기를 눌러도
 * 아무 반응이 없었다. 지금은 화면의 종료 버튼과 같은 확인 팝업을 띄운다.
 *
 * 검증 대상은 "가로챈 뒤 무엇을 하는가" 이지 react-navigation 의 포커스 추적이 아니다.
 * 실제 내비게이터를 세우는 대신 useFocusEffect 를 useEffect 로 갈아끼운다.
 */
import React from 'react';
import { BackHandler, Text } from 'react-native';
import { act, create } from 'react-test-renderer';

jest.mock('@react-navigation/native', () => {
	// 팩토리 안에서는 외부 변수를 못 쓴다 — require 로 가져온다.
	const { useEffect } = require('react');
	return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});

import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';

/** 훅이 등록한 hardwareBackPress 핸들러를 붙잡아 직접 눌러 본다. */
const captureHandlers = () => {
	const handlers: Array<() => boolean> = [];
	const remove = jest.fn();
	jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((_event: string, handler: () => boolean) => {
		handlers.push(handler);
		return { remove };
	}) as never);
	return { handlers, remove };
};

const renderWithHook = async (condition: boolean, onBack?: () => void) => {
	const Screen = () => {
		useBlockBackHandler(condition, onBack);
		return <Text>화면</Text>;
	};
	let tree!: ReturnType<typeof create>;
	await act(async () => {
		tree = create(<Screen />);
	});
	return tree;
};

afterEach(() => jest.restoreAllMocks());

test('뒤로가기를 누르면 넘겨준 동작이 실행되고 기본 동작은 막힌다', async () => {
	const { handlers } = captureHandlers();
	const onBack = jest.fn();

	await renderWithHook(true, onBack);
	expect(handlers).toHaveLength(1);

	const blocked = handlers[0]();

	expect(onBack).toHaveBeenCalledTimes(1);
	expect(blocked).toBe(true); // 화면 pop / 앱 종료를 막는다
});

test('동작을 안 넘기면 막기만 한다 (기존 화면 호환)', async () => {
	const { handlers } = captureHandlers();

	await renderWithHook(true);

	expect(handlers[0]()).toBe(true);
});

test('condition 이 false 면 아예 가로채지 않는다', async () => {
	const { handlers } = captureHandlers();

	await renderWithHook(false, jest.fn());

	expect(handlers).toHaveLength(0);
});

test('화면을 벗어나면 리스너를 해제한다', async () => {
	const { remove } = captureHandlers();

	const tree = await renderWithHook(true, jest.fn());
	await act(async () => {
		tree.unmount();
	});

	expect(remove).toHaveBeenCalled();
});
