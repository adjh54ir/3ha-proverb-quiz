import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';

interface Props {
	visible: boolean;
	message?: string;
	subMessage?: string;
	showScrollHint?: boolean;
	bottom?: number;
	onHide: () => void;
}

/**
 * 즐겨찾기 추가/제거 알림 토스트 (공용)
 */
const FavoriteToast = ({ visible, message = '즐겨찾기 추가', subMessage = '즐겨찾기 목록에 추가 되었습니다!', bottom = scaleHeight(30), onHide }: Props) => {
	const opacity = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(30)).current;

	useEffect(() => {
		if (!visible) {
			return;
		}

		Animated.parallel([
			Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
			Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
		]).start();

		const timer = setTimeout(() => {
			Animated.parallel([
				Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
				Animated.timing(translateY, { toValue: 30, duration: 200, useNativeDriver: true }),
			]).start(onHide);
		}, 1500);

		return () => clearTimeout(timer);
	}, [visible, onHide]);

	const styles = StyleSheet.create({
		toast: {
			position: 'absolute',
			bottom,
			alignSelf: 'center',
			backgroundColor: '#FBBF24',
			paddingVertical: scaleHeight(16),
			paddingHorizontal: scaleWidth(24),
			borderRadius: scaleWidth(16),
			flexDirection: 'row',
			alignItems: 'center',
			gap: scaleWidth(10),
			shadowColor: '#000',
			shadowOpacity: 0.18,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 3 },
			zIndex: 999999,
		},
		icon: {
			width: scaleWidth(40),
			height: scaleHeight(40),
			borderRadius: scaleWidth(12),
		},
		textWrapper: {
			flexDirection: 'column',
			flexShrink: 1,
		},
		text: {
			fontSize: scaledSize(14),
			fontWeight: '700',
			color: '#334155',
			flexWrap: 'wrap',
		},
		subText: {
			marginTop: scaleHeight(3),
			fontSize: scaledSize(12),
			fontWeight: '500',
			color: 'rgba(74,74,74,0.75)',
		},
	});

	if (!visible) {
		return null;
	}

	return (
		<Animated.View pointerEvents="none" style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
			<Image source={require('@/assets/images/favorite.jpg')} style={styles.icon} resizeMode="contain" />
			<View style={styles.textWrapper}>
				<Text style={styles.text}>{message}</Text>
				<Text style={styles.subText}>{subMessage}</Text>
			</View>
		</Animated.View>
	);
};

export default FavoriteToast;
