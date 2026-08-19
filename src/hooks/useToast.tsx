import React, { useCallback, useState } from 'react';
import { scaleHeight } from '@/utils/DementionUtils';
import FavoriteToast from '@/screens/common/FavoriteToast';

interface ToastState {
	visible: boolean;
	message: string;
	subMessage?: string;
}

/**
 * 주요 CRUD(생성/수정/삭제/초기화) 피드백용 공통 토스트.
 *
 * 화면마다 toast state + FavoriteToast 렌더를 복붙하던 것을 한 곳으로 모은다.
 * Alert 대신 쓰는 이유: 확인 버튼을 누르게 만들지 않고 결과만 알려주면 되는 상황이 대부분이다.
 * (되돌릴 수 없는 작업의 '확인'은 여전히 Alert/모달을 쓴다 — 토스트는 '완료 통보' 전용)
 *
 * @param bottom 토스트가 뜰 하단 여백. 하단 고정 버튼이 있는 화면은 값을 키운다.
 *
 * @example
 * const { showToast, ToastView } = useToast();
 * ...
 * showToast('속담집 삭제', '선택한 속담집을 삭제했습니다.');
 * return (<>...<ToastView /></>);
 */
export const useToast = (bottom: number = scaleHeight(30)) => {
	const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

	const showToast = useCallback((message: string, subMessage?: string) => {
		// 이전 토스트가 떠 있으면 새 메시지로 즉시 갈아끼운다(대기열 없이 최신 것만 보여준다)
		setToast({ visible: true, message, subMessage });
	}, []);

	const hideToast = useCallback(() => setToast((prev) => ({ ...prev, visible: false })), []);

	/** 화면 최상위(형제 마지막)에 한 번만 렌더한다. */
	const ToastView = useCallback(
		() => <FavoriteToast visible={toast.visible} message={toast.message} subMessage={toast.subMessage} bottom={bottom} onHide={hideToast} />,
		[toast.visible, toast.message, toast.subMessage, bottom, hideToast],
	);

	return { showToast, hideToast, ToastView };
};

export default useToast;
