import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import AppModal from '@/screens/common/atomic/AppModal';
import { dispatchHardwareKey, HardwareKey, optionIndexOf, useHardwareKeys } from '@/utils/HardwareKeys';

/**
 * 외장 키보드 단축키 — 맨 위 등록 하나만 받고, 열린 모달은 뒤 화면을 막는다.
 */
const Screen = ({ onKey }: { onKey: (key: HardwareKey) => void }) => {
	useHardwareKeys(onKey);
	return <Text>화면</Text>;
};

const ModalWithKeys = ({ visible, onKey }: { visible: boolean; onKey: (key: HardwareKey) => void }) => {
	useHardwareKeys(onKey, visible);
	return (
		<AppModal visible={visible} transparent>
			<Text>모달</Text>
		</AppModal>
	);
};

describe('외장 키보드 단축키', () => {
	it('숫자 키를 보기 인덱스로 바꾼다', () => {
		expect(optionIndexOf('1')).toBe(0);
		expect(optionIndexOf('4')).toBe(3);
		expect(optionIndexOf('enter')).toBeNull();
	});

	it('화면이 키를 받고, 모달이 열리면 뒤 화면 대신 모달이 받는다', () => {
		const screenKey = jest.fn();
		const modalKey = jest.fn();
		let tree!: ReturnType<typeof create>;
		act(() => {
			tree = create(
				<>
					<Screen onKey={screenKey} />
					<ModalWithKeys visible={false} onKey={modalKey} />
				</>,
			);
		});

		dispatchHardwareKey('2');
		expect(screenKey).toHaveBeenCalledWith('2');

		act(() => {
			tree.update(
				<>
					<Screen onKey={screenKey} />
					<ModalWithKeys visible onKey={modalKey} />
				</>,
			);
		});
		dispatchHardwareKey('enter');
		expect(modalKey).toHaveBeenCalledWith('enter');
		expect(screenKey).toHaveBeenCalledTimes(1);

		act(() => tree.unmount());
	});

	it('키를 받지 않는 모달은 뒤 화면을 막기만 한다', () => {
		const screenKey = jest.fn();
		let tree!: ReturnType<typeof create>;
		act(() => {
			tree = create(
				<>
					<Screen onKey={screenKey} />
					<AppModal visible transparent>
						<Text>모달</Text>
					</AppModal>
				</>,
			);
		});

		dispatchHardwareKey('1');
		expect(screenKey).not.toHaveBeenCalled();

		act(() => tree.unmount());
	});
});
