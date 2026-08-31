import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * OS의 '애니메이션 줄이기' 설정.
 *
 * 값이 OS 전역이라 컴포넌트마다 구독할 이유가 없다.
 * 리스트 행(AnimatedListItem → FadeInView)까지 이 훅을 쓰기 때문에 훅 인스턴스마다
 * 네이티브 조회 + 리스너를 걸면 3,000행 스크롤 한 번에 수백 번의 브리지 호출이 된다.
 * 모듈 스코프에 구독 하나만 두고 캐시한 값을 나눠 쓴다.
 */
let reducedMotion = false;
let subscription: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const setReducedMotion = (enabled: boolean) => {
	if (reducedMotion === enabled) return;
	reducedMotion = enabled;
	emit();
};

const subscribe = (onStoreChange: () => void) => {
	listeners.add(onStoreChange);
	if (!subscription) {
		AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
		subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
	}
	return () => {
		listeners.delete(onStoreChange);
		// 마지막 구독자가 사라져도 리스너는 유지한다. 화면 전환마다 붙였다 떼는 비용이 더 크고,
		// 캐시된 값이 남아 있어야 다음 모달이 첫 프레임부터 올바른 값으로 그려진다.
	};
};

const getSnapshot = () => reducedMotion;

export const useReducedMotion = (): boolean => useSyncExternalStore(subscribe, getSnapshot);

export default useReducedMotion;
