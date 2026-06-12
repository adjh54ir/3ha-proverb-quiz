import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

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
	const opacity = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(offsetY)).current;

	useEffect(() => {
		const animation = Animated.parallel([
			Animated.timing(opacity, {
				toValue: 1,
				duration,
				delay,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: 0,
				duration,
				delay,
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
};

export default FadeInView;
