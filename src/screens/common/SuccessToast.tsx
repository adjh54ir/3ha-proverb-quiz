import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';

interface Props {
	visible: boolean;
	message?: string;
	subMessage?: string;
	bottom?: number;
	onHide: () => void;
}

const SuccessToast = ({ visible, message = '완료되었습니다!', subMessage, bottom = scaleHeight(30), onHide }: Props) => {
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
			backgroundColor: '#3B82F6',
			paddingVertical: scaleHeight(14),
			paddingHorizontal: scaleWidth(22),
			borderRadius: scaleWidth(16),
			flexDirection: 'row',
			alignItems: 'center',
			gap: scaleWidth(10),
			shadowColor: '#000',
			shadowOpacity: 0.18,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 3 },
			zIndex: 999999,
			maxWidth: '90%',
		},
		icon: { width: scaleWidth(34), height: scaleHeight(34), borderRadius: scaleWidth(10) },
		textWrapper: { flexDirection: 'column', flexShrink: 1 },
		text: { fontSize: scaledSize(14), fontWeight: '700', color: '#fff', flexWrap: 'wrap' },
		subText: { marginTop: scaleHeight(3), fontSize: scaledSize(12), fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
	});

	if (!visible) {
		return null;
	}

	return (
		<Animated.View pointerEvents="none" style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
			<Image source={require('@/assets/images/favorite.jpg')} style={styles.icon} resizeMode="contain" />
			<View style={styles.textWrapper}>
				<Text style={styles.text}>{message}</Text>
				{!!subMessage && <Text style={styles.subText}>{subMessage}</Text>}
			</View>
		</Animated.View>
	);
};

export default SuccessToast;
