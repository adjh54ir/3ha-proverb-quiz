import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';

interface Props {
	visible: boolean;
	message?: string;
	showScrollHint?: boolean;
	onHide: () => void;
}

const SuccessToast = ({ visible, message = '계산이 완료되었습니다!', showScrollHint = false, onHide }: Props) => {
	const opacity = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(30)).current;

	useEffect(() => {
		if (!visible) {
			return;
		}

		Animated.parallel([
			Animated.timing(opacity, {
				toValue: 1,
				duration: 220,
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: 0,
				duration: 220,
				useNativeDriver: true,
			}),
		]).start();

		const timer = setTimeout(() => {
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(translateY, {
					toValue: 30,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start(onHide);
		}, 1500);

		return () => clearTimeout(timer);
	}, [visible, onHide]);

	if (!visible) {
		return null;
	}

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.toast,
				{
					opacity,
					transform: [{ translateY }],
				},
			]}>
			<Image source={require('@/assets/images/favorite.jpg')} style={styles.icon} resizeMode="contain" />
			<View style={styles.textWrapper}>
				<Text style={styles.text}>즐겨찾기 추가</Text>
				<Text style={styles.subText}>속담 사전에서 확인 할 수 있습니다.</Text>
			</View>
		</Animated.View>
	);
};

export default SuccessToast;

const styles = StyleSheet.create({
	toast: {
		position: 'absolute',
		bottom: scaleHeight(30),
		alignSelf: 'center',
		backgroundColor: '#FFD700',
		paddingVertical: scaleHeight(16), // ✅ 패딩 줄임
		paddingHorizontal: scaleWidth(24), // ✅ 패딩 줄임
		borderRadius: scaleWidth(16), // ✅ 더 둥글게
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(10), // ✅ 간격 줄임
		shadowColor: '#000',
		shadowOpacity: 0.18,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 3 },
		zIndex: 999999,
	},
	icon: {
		width: scaleWidth(40), // ✅ 크기 증가
		height: scaleHeight(40), // ✅ 크기 증가
		borderRadius: scaleWidth(12),
	},
	textWrapper: {
		flexDirection: 'column',
		flexShrink: 1,
	},
	text: {
		fontSize: scaledSize(14),
		fontWeight: '700',
		color: '#4A4A4A', // ✅ 진한 회색으로 변경 (덜 튀게)
		flexWrap: 'wrap',
	},
	subText: {
		marginTop: scaleHeight(3),
		fontSize: scaledSize(12),
		fontWeight: '500',
		color: 'rgba(74,74,74,0.75)', // ✅ 부드러운 회색으로 변경
	},
});
