import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import useReducedMotion from '@/hooks/useReducedMotion';

interface FadeInViewProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	/** 애니메이션 지속 시간(ms) */
	duration?: number;
	/** 시작 지연(ms) — 리스트 아이템 스태거에 사용 */
	delay?: number;
	/** 아래에서 위로 떠오르는 거리(px). 0이면 페이드만 적용 */
	offsetY?: number;
}

/**
 * 화면/섹션 진입 시 페이드 + 슬라이드업 애니메이션 래퍼
 * - useNativeDriver 사용으로 JS 스레드 부하 없음
 * - 언마운트 시 진행 중인 애니메이션을 정지하여 메모리 누수 방지
 */
const FadeInView = ({ children, style, duration = 350, delay = 0, offsetY = 12 }: FadeInViewProps) => {
	const reducedMotion = useReducedMotion();
	const opacity = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(offsetY)).current;

	useEffect(() => {
		const resolvedDuration = reducedMotion ? 0 : duration;
		const resolvedDelay = reducedMotion ? 0 : delay;
		const animation = Animated.parallel([
			Animated.timing(opacity, {
				toValue: 1,
				duration: resolvedDuration,
				delay: resolvedDelay,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: 0,
				duration: resolvedDuration,
				delay: resolvedDelay,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
		]);
		animation.start();

		// ✅ 종료 처리: 언마운트 시 애니메이션 정지 (메모리 정리)
		return () => {
			animation.stop();
			opacity.stopAnimation();
			translateY.stopAnimation();
		};
	}, [delay, duration, opacity, reducedMotion, translateY]);

	return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
};

export default FadeInView;

/**
 * 리스트 진입 stagger 지연(ms).
 * 처음 몇 개만 순차로 띄우고 이후는 즉시 표시한다(길게 스크롤할 때 성능 보호).
 */
export const staggerDelay = (index: number, max = 6, step = 40): number => (index < max ? index * step : 0);

/**
 * 리스트 아이템 진입 애니메이션 (fade + slide-up).
 * 화면 4곳에 똑같은 컴포넌트가 복사돼 있어 하나로 모았다.
 */
export const AnimatedListItem = React.memo(({ children, index, offsetY }: { children: React.ReactNode; index: number; offsetY?: number }) => (
	<FadeInView delay={staggerDelay(index)} duration={250} offsetY={offsetY}>
		{children}
	</FadeInView>
));
