import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';

import AppAlert, { AppAlertHost } from '@/screens/common/modal/AppAlert';

/**
 * 공용 알림창 회귀 테스트.
 *
 * OS Alert 을 걷어내고 앱 테마 팝업으로 바꿨기 때문에, 화면에서 그냥 호출만 해도
 * (state 없이) 실제로 떠야 하고 버튼 콜백이 그대로 살아 있어야 한다.
 */
const textsOf = (tree: ReactTestRenderer): string[] =>
	tree.root.findAllByType(Text).flatMap((node) => {
		const collect = (child: unknown): string[] =>
			typeof child === 'string' ? [child] : Array.isArray(child) ? child.flatMap(collect) : [];
		return collect(node.props.children);
	});

const renderHost = async (): Promise<ReactTestRenderer> => {
	let tree!: ReactTestRenderer;
	await act(async () => {
		tree = create(<AppAlertHost />);
	});
	return tree;
};

afterEach(() => {
	act(() => {
		AppAlert.dismiss();
	});
});

test('호출하면 host 가 제목/본문을 그린다 (화면에 state 를 두지 않아도 된다)', async () => {
	const tree = await renderHost();
	expect(tree.toJSON()).toBeNull(); // 닫혀 있을 땐 아무것도 그리지 않는다

	await act(async () => {
		AppAlert.alert('알림', '이미 완료한 레벨입니다');
	});

	const texts = textsOf(tree);
	expect(texts).toContain('알림');
	expect(texts).toContain('이미 완료한 레벨입니다');
	// 버튼을 안 주면 '확인' 하나가 기본으로 붙는다
	expect(texts).toContain('확인');
});

test('버튼을 누르면 콜백이 실행되고 팝업이 닫힌다', async () => {
	const tree = await renderHost();
	const onPress = jest.fn();

	await act(async () => {
		AppAlert.alert('퀴즈 종료', '정말 종료할까요?', [
			{ text: '취소', style: 'cancel' },
			{ text: '종료', style: 'destructive', onPress },
		]);
	});

	const buttons = tree.root.findAllByType(TouchableOpacity);
	expect(buttons).toHaveLength(2);

	await act(async () => {
		buttons[1].props.onPress();
	});

	expect(onPress).toHaveBeenCalledTimes(1);
	expect(tree.toJSON()).toBeNull();
});
