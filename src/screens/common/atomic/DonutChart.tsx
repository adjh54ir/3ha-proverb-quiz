/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { isTablet, scaleWidth } from '@/utils';
import { COLORS } from '@/const/common/Theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DonutChartProps {
	/** 차트 지름(px, scaleWidth 적용 전 값) */
	size?: number;
	/** 링 두께 */
	strokeWidth?: number;
	/** 0~100 진행률 */
	percent: number;
	/** 진행 링 색상 */
	color?: string;
	/** 트랙(배경 링) 색상 */
	trackColor?: string;
	/** 중앙 컨텐츠 */
	children?: React.ReactNode;
}

/**
 * react-native-svg 기반 도넛(원형 진행률) 차트.
 * 마운트 시 0 → percent 까지 부드럽게 채워지는 애니메이션을 제공합니다.
 */
const DonutChart: React.FC<DonutChartProps> = ({
	size = 110,
	strokeWidth = 12,
	percent,
	color = COLORS.primary,
	trackColor = COLORS.border,
	children,
}) => {
	// 호출부가 이미 scaledSize() 로 넘긴 값이라 여기서 또 곱하면 배율이 두 번 걸린다.
	// 폰은 배율이 1 근처(1.05² ≈ 1.1)라 티가 안 났지만 태블릿은 1.35² = 1.8배로 벌어져
	// 도넛이 카드를 넘친다. 폰 화면을 건드리지 않으려고 태블릿에서만 이중 적용을 끊는다.
	const dimension = isTablet ? size : scaleWidth(size);
	const stroke = isTablet ? strokeWidth : scaleWidth(strokeWidth);
	const radius = (dimension - stroke) / 2;
	const circumference = 2 * Math.PI * radius;

	const progress = useRef(new Animated.Value(0)).current;
	const clamped = Math.min(Math.max(percent, 0), 100);

	useEffect(() => {
		const animation = Animated.timing(progress, {
			toValue: clamped,
			duration: 900,
			useNativeDriver: false, // SVG strokeDashoffset 애니메이션은 네이티브 드라이버 미지원
		});
		animation.start();
		// useNativeDriver:false 라 매 프레임 JS 에서 값을 밀어 넣는다. 차트가 사라진 뒤에도
		// 900ms 동안 계속 돌지 않도록 언마운트/값 변경 시 반드시 멈춘다.
		return () => animation.stop();
	}, [clamped, progress]);

	const strokeDashoffset = progress.interpolate({
		inputRange: [0, 100],
		outputRange: [circumference, 0],
	});

	return (
		<View style={{ width: dimension, height: dimension, alignItems: 'center', justifyContent: 'center' }}>
			<Svg width={dimension} height={dimension} style={{ position: 'absolute' }}>
				<G rotation="-90" origin={`${dimension / 2}, ${dimension / 2}`}>
					<Circle
						cx={dimension / 2}
						cy={dimension / 2}
						r={radius}
						stroke={trackColor}
						strokeWidth={stroke}
						fill="transparent"
					/>
					<AnimatedCircle
						cx={dimension / 2}
						cy={dimension / 2}
						r={radius}
						stroke={color}
						strokeWidth={stroke}
						fill="transparent"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
					/>
				</G>
			</Svg>
			<View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
		</View>
	);
};

export default DonutChart;
