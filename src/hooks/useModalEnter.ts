import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/** 모달 카드 등장 모션 기본값 — 앱 전체가 같은 리듬으로 열리도록 여기 한 곳에서만 조정한다. */
const ENTER_DURATION = 250;
const ENTER_FROM_SCALE = 0.95;
/** 퇴장은 등장보다 짧게 — 확인을 누른 뒤 기다리는 느낌이 없도록. */
const EXIT_DURATION = 200;

/**
 * 모달 카드의 공통 등장 애니메이션 (fade + scale).
 *
 * 같은 코드가 모달마다 복사되어 있었고, 그 과정에서 duration 이 240/250/260 으로 갈라지거나
 * 아예 빠진 모달이 생겼다. 이 훅으로 모아 두면 모든 팝업이 같은 속도로 열린다.
 *
 * 닫힐 때 값을 되돌려 두어야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지).
 *
 * ```tsx
 * const enterStyle = useModalEnter(visible);
 * <Animated.View style={[styles.card, enterStyle]} />
 * ```
 *
 * @param visible 모달 노출 여부
 * @returns Animated.View 에 그대로 펼쳐 넣는 스타일 객체
 */
export const useModalEnter = (visible: boolean) => {
	const opacity = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(ENTER_FROM_SCALE)).current;

	useEffect(() => {
		opacity.setValue(0);
		scale.setValue(ENTER_FROM_SCALE);
		if (!visible) {
			return;
		}
		const enter = Animated.parallel([
			Animated.timing(opacity, { toValue: 1, duration: ENTER_DURATION, useNativeDriver: true }),
			Animated.timing(scale, { toValue: 1, duration: ENTER_DURATION, useNativeDriver: true }),
		]);
		enter.start();
		// 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
		return () => enter.stop();
	}, [visible, opacity, scale]);

	return { opacity, transform: [{ scale }] };
};

/**
 * 등장 애니메이션 + 닫을 때 되감는 퇴장 애니메이션.
 * "카드가 사라진 뒤에 부모에게 알려야" 하는 모달에서만 쓴다(예: 뱃지 획득 확인).
 *
 * ```tsx
 * const { style, runExit } = useModalEnterExit(visible);
 * <Animated.View style={[styles.card, style]} />
 * <Button onPress={() => runExit(onConfirm)} />
 * ```
 */
export const useModalEnterExit = (visible: boolean) => {
	const style = useModalEnter(visible);
	const opacity = style.opacity;
	const scale = style.transform[0].scale;

	/** 카드를 되감은 뒤 콜백을 호출한다. 중간에 끊기면 콜백을 부르지 않는다. */
	const runExit = (onDone: () => void) => {
		Animated.parallel([
			Animated.timing(opacity, { toValue: 0, duration: EXIT_DURATION, useNativeDriver: true }),
			Animated.timing(scale, { toValue: ENTER_FROM_SCALE, duration: EXIT_DURATION, useNativeDriver: true }),
		]).start(({ finished }) => {
			// stop() 으로 중단된 경우에도 콜백이 호출되므로 완료된 경우에만 부모에 알린다
			if (finished) {
				onDone();
			}
		});
	};

	return { style, runExit };
};

export default useModalEnter;

/** 카드 등장이 끝나는 시각 — 등장 후에 이어 붙이는 모션의 delay 로 쓴다. */
export const MODAL_ENTER_DURATION = ENTER_DURATION;
