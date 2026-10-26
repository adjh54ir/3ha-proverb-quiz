import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, Text, TextStyle } from 'react-native';

interface AnimatedCounterProps {
	/** 목표 값 */
	value: number;
	/** 애니메이션 시간(ms) */
	duration?: number;
	/** 접미사 (예: '%', '점') */
	suffix?: string;
	/** 천단위 콤마 */
	useComma?: boolean;
	style?: StyleProp<TextStyle>;
}

/**
 * 숫자가 0 → value 까지 카운트업되는 텍스트 컴포넌트.
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 900, suffix = '', useComma = false, style }) => {
	const anim = useRef(new Animated.Value(0)).current;
	const [display, setDisplay] = useState(0);

	useEffect(() => {
		anim.setValue(0);
		const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
		const animation = Animated.timing(anim, {
			toValue: value,
			duration,
			useNativeDriver: false,
		});
		animation.start();
		// JS 드라이버라 언마운트 뒤에도 끝날 때까지 매 프레임 돈다 — 리스너와 함께 멈춘다 (DonutChart 와 같은 이유)
		return () => {
			animation.stop();
			anim.removeListener(id);
		};
	}, [value, duration, anim]);

	const text = useComma ? display.toLocaleString() : String(display);
	return <Text style={style}>{text}{suffix}</Text>;
};

export default AnimatedCounter;
