import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * 이전 모달의 닫힘 애니메이션 길이.
 * RN <Modal> 은 네이티브 창(iOS: presented VC, Android: Dialog)이라 두 개를 동시에 다루면
 * 새 모달이 뜨는 동안 이전 모달이 한 프레임 다시 보였다가 사라진다.
 */
export const MODAL_HANDOFF_DELAY = Platform.OS === 'ios' ? 350 : 250;

/**
 * 모달 → 모달 전환 헬퍼.
 *
 * `handoff(닫기, 열기)` 로 쓰면 이전 모달을 먼저 닫고, 닫힘 애니메이션이 끝난 뒤 다음 모달을 연다.
 * 같은 틱에 둘을 함께 호출하면 "이전 모달이 잠깐 나왔다 사라지는" 깜빡임이 생긴다.
 *
 * 타이머는 훅이 들고 있다가 언마운트 시 정리하므로 화면이 사라진 뒤 열리는 일이 없다.
 *
 * @example
 * const handoff = useModalHandoff();
 * onPress={() => handoff(() => setActionSheet(null), () => setFormTarget(book))}
 */
export const useModalHandoff = () => {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		},
		[],
	);

	return useCallback((close: () => void, open: () => void) => {
		close();
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}
		timerRef.current = setTimeout(open, MODAL_HANDOFF_DELAY);
	}, []);
};
