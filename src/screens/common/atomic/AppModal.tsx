import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, ModalProps, NativeSyntheticEvent, View } from 'react-native';
import useModalReapply from '@/hooks/useModalReapply';

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
 * ── 처음 여는 한 번만 딤이 잘리던 문제 ─────────────────────────────
 * 원인이 두 겹이라 둘 다 막아야 첫 프레임부터 딤이 화면을 덮는다.
 *
 * (1) 레이아웃 — 모달 컨테이너의 크기는 창이 뜬 뒤 `onSizeChanged → updateNodeSize` 로 JS 에
 *     전달된다. 그 전 프레임의 컨테이너는 화면보다 작다.
 *     → 안쪽을 화면(screen) 실측 크기로 **고정**한 View 로 감싼다. RN 의 ReactViewGroup 은
 *       setClipChildren(false) 라 부모가 아직 작아도 이 View 는 화면 전체로 그려진다.
 *
 * (2) 창 — edge-to-edge 설정이 첫 표시에는 적용되지 않아 content 뷰가 시스템 바만큼 잘린다.
 *     → `useModalReapply` 로 창이 뜬 뒤 네이티브 프롭을 한 번 더 흘려보낸다(자세한 내용은 훅 주석).
 *
 * translucent 두 속성은 `{...props}` **뒤에** 둔다 — 호출부가 실수로 꺼도 딤이 잘리지 않게.
 */
const AppModal = ({ children, onShow, ...props }: ModalProps) => {
	// 회전·폴더블 접기처럼 화면 크기가 바뀌면 따라가야 한다(고정값이면 딤이 다시 잘린다).
	const [screen, setScreen] = useState(() => Dimensions.get('screen'));
	const { supportedOrientations, markShown } = useModalReapply();

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
			markShown();
			onShow?.(event);
		},
		[markShown, onShow],
	);

	return (
		<Modal
			{...props}
			statusBarTranslucent
			navigationBarTranslucent
			supportedOrientations={supportedOrientations ?? props.supportedOrientations}
			onShow={handleShow}>
			<View style={{ width: screen.width, height: screen.height }}>{children}</View>
		</Modal>
	);
};

export default AppModal;
