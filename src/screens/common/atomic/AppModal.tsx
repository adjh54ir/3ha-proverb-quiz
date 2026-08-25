import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, ModalProps, NativeSyntheticEvent, View } from 'react-native';

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
 * 측정돼서(두 번째부터는 캐시된 크기라 정상) 딤이 화면을 다 덮지 못한다. 그래서
 *
 *  1. 안쪽을 화면(screen) 실측 크기로 **고정**한 View 로 감싼다.
 *     RN 의 ReactViewGroup 은 setClipChildren(false) 라 부모(모달 컨테이너)가 아직 0 이어도
 *     이 View 는 화면 전체로 그려진다 — 구 아키텍처에서 컨테이너 크기가 네이티브 → JS 왕복
 *     뒤에야 채워지는 첫 프레임을 이 고정 크기가 메운다.
 *  2. 창이 실제로 뜬 뒤(onShow) 화면 크기를 한 번 더 실측한다
 *     (부팅 직후 첫 모달은 Dimensions 가 시스템 바를 뺀 값을 들고 있을 수 있다).
 *  3. translucent 두 속성은 `{...props}` **뒤에** 둔다 — 호출부가 실수로 꺼도 딤이 잘리지 않게.
 */
const AppModal = ({ children, onShow, ...props }: ModalProps) => {
	// 회전·폴더블 접기처럼 화면 크기가 바뀌면 따라가야 한다(고정값이면 딤이 다시 잘린다).
	const [screen, setScreen] = useState(() => Dimensions.get('screen'));
	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ screen: next }) => setScreen(next));
		return () => subscription.remove();
	}, []);

	const handleShow = useCallback(
		(event: NativeSyntheticEvent<unknown>) => {
			// 창이 뜬 뒤의 값이 진짜 화면 크기다 — 달라졌으면 그때 다시 그린다.
			setScreen((prev) => {
				const next = Dimensions.get('screen');
				return prev.width === next.width && prev.height === next.height ? prev : next;
			});
			onShow?.(event);
		},
		[onShow],
	);

	return (
		<Modal {...props} statusBarTranslucent navigationBarTranslucent onShow={handleShow}>
			<View style={{ width: screen.width, height: screen.height }}>{children}</View>
		</Modal>
	);
};

export default AppModal;
