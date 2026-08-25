import React from 'react';
import { Dimensions, Modal as RNModal, StyleSheet, Text, View } from 'react-native';
import { act, create } from 'react-test-renderer';

import AppModal from '@/screens/common/atomic/AppModal';

/**
 * 모달을 처음 열 때 딤(배경)이 화면을 다 덮지 못하던 문제의 회귀 방지.
 * AppModal 은 자식을 '화면(screen) 크기로 고정된 View' 로 감싸야 한다.
 */
describe('AppModal', () => {
	const renderModal = () => {
		let tree!: ReturnType<typeof create>;
		act(() => {
			tree = create(
				<AppModal visible transparent>
					<Text>내용</Text>
				</AppModal>,
			);
		});
		return tree;
	};

	it('자식을 화면 크기 View 로 감싼다', () => {
		const screen = Dimensions.get('screen');
		const wrapper = renderModal().root.findAllByType(View)[0];

		expect(StyleSheet.flatten(wrapper.props.style)).toMatchObject({ width: screen.width, height: screen.height });
	});

	it('시스템 바 위까지 덮도록 translucent 옵션을 켠다', () => {
		const rnModal = renderModal().root.findByType(RNModal);

		expect(rnModal.props.statusBarTranslucent).toBe(true);
		expect(rnModal.props.navigationBarTranslucent).toBe(true);
	});

	it('호출부가 translucent 를 꺼도 무시한다 — 딤이 잘리면 안 된다', () => {
		let tree!: ReturnType<typeof create>;
		act(() => {
			tree = create(
				<AppModal visible transparent statusBarTranslucent={false}>
					<Text>내용</Text>
				</AppModal>,
			);
		});

		expect(tree.root.findByType(RNModal).props.statusBarTranslucent).toBe(true);
	});
});
