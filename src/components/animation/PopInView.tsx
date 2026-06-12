import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface PopInViewProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	/** true가 되는 순간 팝 애니메이션 재생 (모달 visible과 연동) */
	visible?: boolean;
}

/**
 * 모달 카드 등장용 스케일 팝 애니메이션 래퍼
 * - spring 기반으로 가볍게 튀어나오는 느낌
 * - 언마운트/숨김 시 애니메이션 정지로 메모리 정리
 */
const PopInView = ({ children, style, visible = true }: PopInViewProps) => {
	const scale = useRef(new Animated.Value(0.92)).current;
	const opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		let animation: Animated.CompositeAnimation | undefined;
		if (visible) {
			scale.setValue(0.92);
			opacity.setValue(0);
			animation = Animated.parallel([
				Animated.spring(scale, {
					toValue: 1,
					friction: 7,
					tension: 90,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: 180,
					useNativeDriver: true,
				}),
			]);
			animation.start();
		}

		// ✅ 종료 처리: 진행 중 애니메이션 정지 (메모리 정리)
		return () => {
			animation?.stop();
			scale.stopAnimation();
			opacity.stopAnimation();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible]);

	return <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>;
};

export default PopInView;
