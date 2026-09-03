import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { scaleHeight } from '@/utils/DementionUtils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { COLORS, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';

/**
 * 로딩 자리표시자(스켈레톤).
 *
 * 스피너만 돌리면 화면이 비어 있다가 내용이 툭 튀어나온다. 들어올 내용의 형태를 미리
 * 깔아 두면 체감 대기 시간이 줄고, 로딩이 끝날 때 레이아웃이 덜 흔들린다.
 *
 * 밝기를 오가는 루프 애니메이션을 쓰므로 언마운트 시 반드시 정리한다.
 * OS 의 '애니메이션 줄이기'를 켜면 깜빡임 없이 은은한 정적 톤으로 고정한다 —
 * 목록 하나에 스켈레톤이 여러 개 깔리므로 화면 전체가 함께 맥박치면 특히 부담스럽다.
 */
interface SkeletonProps {
	width?: DimensionValue;
	height?: number;
	radius?: number;
	style?: StyleProp<ViewStyle>;
}

const Skeleton = ({ width = '100%', height = scaleHeight(16), radius = RADIUS.sm, style }: SkeletonProps) => {
	const reducedMotion = useReducedMotion();
	const pulse = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (reducedMotion) {
			// 중간 밝기로 세워 둔다 — 자리표시자로는 보이되 움직이지 않는다.
			pulse.setValue(0.5);
			return;
		}
		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
				Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
			]),
		);
		animation.start();
		// 루프는 스스로 끝나지 않는다 — 화면을 벗어나면 반드시 멈춘다.
		return () => animation.stop();
	}, [pulse, reducedMotion]);

	return (
		<Animated.View
			// 자리표시자는 스크린리더가 읽을 내용이 없다.
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[
				styles.block,
				{ width, height, borderRadius: radius, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) },
				style,
			]}
		/>
	);
};

export default Skeleton;

/**
 * 카드 목록용 자리표시자. 속담 목록·오답 목록처럼 "카드가 세로로 쌓이는" 화면에 쓴다.
 * @param count 깔아 둘 카드 수
 */
export const SkeletonCardList = ({ count = 4 }: { count?: number }) => (
	<View style={styles.list}>
		{Array.from({ length: count }).map((_, index) => (
			<View key={index} style={styles.card}>
				<Skeleton width="55%" height={scaleHeight(18)} />
				<Skeleton width="90%" height={scaleHeight(13)} style={styles.gap} />
				<Skeleton width="70%" height={scaleHeight(13)} style={styles.gapSmall} />
			</View>
		))}
	</View>
);

const styles = themedStyles(() =>
	StyleSheet.create({
		block: {
			backgroundColor: COLORS.surfaceAlt,
		},
		list: {
			paddingHorizontal: SPACING_W.lg,
			paddingTop: SPACING_H.md,
			rowGap: SPACING_H.md,
		},
		card: {
			backgroundColor: COLORS.surface,
			borderWidth: 1,
			borderColor: COLORS.border,
			borderRadius: RADIUS.lg,
			paddingHorizontal: SPACING_W.lg,
			paddingVertical: SPACING_H.lg,
		},
		gap: {
			marginTop: SPACING_H.md,
		},
		gapSmall: {
			marginTop: SPACING_H.sm,
		},
	}),
);
