import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, ModalProps, View } from 'react-native';

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
 *
 * 그런데 두 속성을 켜도 **처음 여는 한 번**은 모달 컨테이너가 시스템 바를 뺀 크기로 먼저
 * 측정돼서(두 번째부터는 캐시된 크기라 정상) 딤이 화면을 다 덮지 못한다.
 * 그래서 안쪽을 화면(screen) 실측 크기로 고정한 View 로 감싸 첫 프레임부터 꽉 차게 한다.
 */
const AppModal = ({ children, ...props }: ModalProps) => {
	// 회전·폴더블 접기처럼 화면 크기가 바뀌면 따라가야 한다(고정값이면 딤이 다시 잘린다).
	const [screen, setScreen] = useState(() => Dimensions.get('screen'));
	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ screen: next }) => setScreen(next));
		return () => subscription.remove();
	}, []);

	return (
		<Modal statusBarTranslucent navigationBarTranslucent {...props}>
			{/* eslint-disable-next-line react-native/no-inline-styles */}
			<View style={{ width: screen.width, height: screen.height }}>{children}</View>
		</Modal>
	);
};

export default AppModal;
