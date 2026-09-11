/**
 * '맨 위로' 공통 훅(useScrollTop) 회귀 테스트.
 *
 * 화면마다 제각각이던 세 가지 호출 방법을 훅 하나가 분기로 흡수한다.
 *  - FlatList(VirtualizedList) : scrollToOffset
 *  - ScrollView               : scrollTo
 *  - SectionList              : getScrollResponder().scrollTo
 * 분기가 틀어지면 버튼만 보이고 목록이 움직이지 않는 조용한 버그가 되므로 세 갈래를 모두 누른다.
 * 임계값 비교(표시 여부)도 함께 확인한다.
 */
import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { useScrollTop } from '@/hooks/useScrollTop';
import { SCROLL_TOP_THRESHOLD } from '@/screens/common/atomic/ScrollTopButton';

type Hook = ReturnType<typeof useScrollTop>;

/**
 * 훅 반환값을 꺼내 쓰기 위한 최소 컴포넌트.
 * 훅이 구독·타이머를 걸지 않으므로 언마운트하지 않는다 — act() 안에서 unmount 하면
 * 병렬 워커가 제때 종료되지 않고 "worker process has failed to exit gracefully" 경고가 난다.
 */
const renderHook = async () => {
	const captured: { current: Hook | null } = { current: null };
	const Probe = () => {
		captured.current = useScrollTop<any>();
		return <Text>probe</Text>;
	};
	await act(async () => {
		create(<Probe />);
	});
	return captured as { current: Hook };
};

const scrollEvent = (y: number) => ({ nativeEvent: { contentOffset: { y } } }) as any;

describe('useScrollTop', () => {
	it('임계값을 넘기면 버튼이 보이고, 되돌아오면 숨는다', async () => {
		const hook = await renderHook();

		expect(hook.current.showScrollTop).toBe(false);

		await act(async () => hook.current.onScroll(scrollEvent(SCROLL_TOP_THRESHOLD + 1)));
		expect(hook.current.showScrollTop).toBe(true);

		await act(async () => hook.current.onScroll(scrollEvent(0)));
		expect(hook.current.showScrollTop).toBe(false);
	});

	it('FlatList 는 scrollToOffset 으로 최상단으로 간다', async () => {
		const hook = await renderHook();
		const node = { scrollToOffset: jest.fn() };
		(hook.current.scrollRef as any).current = node;

		hook.current.scrollToTop();
		expect(node.scrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: true });
	});

	it('ScrollView 는 scrollTo 로 간다 (animated=false 도 전달된다)', async () => {
		const hook = await renderHook();
		const node = { scrollTo: jest.fn() };
		(hook.current.scrollRef as any).current = node;

		hook.current.scrollToTop(false);
		expect(node.scrollTo).toHaveBeenCalledWith({ x: 0, y: 0, animated: false });
	});

	it('SectionList 는 getScrollResponder() 를 거쳐 간다', async () => {
		const hook = await renderHook();
		const responder = { scrollTo: jest.fn() };
		const node = { getScrollResponder: jest.fn(() => responder) };
		(hook.current.scrollRef as any).current = node;

		hook.current.scrollToTop();
		expect(responder.scrollTo).toHaveBeenCalledWith({ x: 0, y: 0, animated: true });
	});

	it('ref 가 비어 있으면 아무 일도 하지 않는다', async () => {
		const hook = await renderHook();
		expect(() => hook.current.scrollToTop()).not.toThrow();
	});
});
