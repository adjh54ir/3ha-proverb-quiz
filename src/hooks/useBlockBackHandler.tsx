import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useCallback, useRef } from 'react';

/**
 * 안드로이드 하드웨어 뒤로가기를 가로채는 훅.
 *
 * `onBack` 을 주지 않으면 그냥 삼킨다(아무 일도 일어나지 않음). 퀴즈처럼 진행 중인
 * 내용이 날아가면 안 되는 화면에서 쓰던 방식인데, 이 경우 사용자는 뒤로가기를 눌러도
 * 반응이 없어 앱이 멈춘 것처럼 느낀다. 화면에 종료 버튼이 따로 있다면 **그 버튼과 같은
 * 동작**을 `onBack` 으로 넘겨서, 뒤로가기가 종료 확인 팝업을 띄우게 하는 편이 낫다.
 *
 * ```ts
 * useBlockBackHandler(true, () => setShowExitModal(true));
 * ```
 *
 * @param condition true 일 때만 가로챈다
 * @param onBack    가로챈 뒤 실행할 동작 (없으면 아무 일도 하지 않고 막기만 한다)
 */
export const useBlockBackHandler = (condition: boolean = true, onBack?: () => void) => {
	// 콜백이 매 렌더 새로 만들어져도 리스너를 다시 붙이지 않도록 ref 로 들고 있는다.
	const onBackRef = useRef(onBack);
	onBackRef.current = onBack;

	useFocusEffect(
		useCallback(() => {
			if (!condition) {
				return;
			}

			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				onBackRef.current?.();
				return true; // 기본 동작(화면 pop / 앱 종료) 차단
			});

			return () => subscription.remove();
		}, [condition]),
	);
};

export default useBlockBackHandler;
