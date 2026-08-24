import React from 'react';
import { Modal, ModalProps } from 'react-native';

/**
 * 앱 공용 모달
 * -------------------------------------------------
 * react-native 의 Modal 을 그대로 쓰면 안드로이드에서 모달 창이 상태바·내비게이션바를
 * **비켜서** 열린다. 그러면 `flex: 1` 로 깔아 둔 딤(dim) 이 화면 위아래 끝까지 닿지 못해
 * 배경이 잘린 띠처럼 보이고, 하단 시트는 내비게이션 버튼과 겹친다.
 *
 * 두 속성을 항상 켜서 모달을 화면 전체에 깔고, 시스템 바에 가리면 안 되는 내용은
 * 각 모달이 `useSafeAreaInsets()` 로 여백을 준다.
 *
 * navigationBarTranslucent 는 statusBarTranslucent 가 함께 켜져 있어야 동작한다(RN 문서).
 */
const AppModal = ({ children, ...props }: ModalProps) => (
	<Modal statusBarTranslucent navigationBarTranslucent {...props}>
		{children}
	</Modal>
);

export default AppModal;
