import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';

interface Props {
	visible: boolean;
	message?: string;
	subMessage?: string;
	showScrollHint?: boolean;
	bottom?: number;
	onHide: () => void;
}

const SLIDE_DISTANCE = scaleHeight(30);

/**
 * 즐겨찾기 추가/제거 알림 토스트 (공용)
 */
const FavoriteToast = ({ visible, message = '즐겨찾기 추가', subMessage = '즐겨찾기 목록에 추가 되었습니다!', bottom = scaleHeight(30), onHide }: Props) => {
	const opacity = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(SLIDE_DISTANCE)).current;
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!visible) {
			return;
		}

		const inAnim = Animated.parallel([
			Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
			Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
		]);
		inAnim.start();

		let outAnim: Animated.CompositeAnimation | undefined;
		hideTimerRef.current = setTimeout(() => {
			outAnim = Animated.parallel([
				Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
				Animated.timing(translateY, { toValue: SLIDE_DISTANCE, duration: 200, useNativeDriver: true }),
			]);
			// 중단(stop)되면 finished:false 로도 콜백이 오므로, 정상 종료일 때만 부모에 알린다.
			outAnim.start(({ finished }) => {
				if (finished) {
					onHide();
				}
			});
		}, 1500);

		return () => {
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
				hideTimerRef.current = null;
			}
			inAnim.stop();
			outAnim?.stop();
		};
	}, [visible, onHide, opacity, translateY]);

	if (!visible) {
		return null;
	}

	return (
		<Animated.View pointerEvents="none" style={[styles.toast, { bottom, opacity, transform: [{ translateY }] }]}>
			<Image source={require('@/assets/images/home-actions/action-favorite.png')} style={styles.icon} resizeMode="contain" />
			<View style={styles.textWrapper}>
				<Text style={styles.text}>{message}</Text>
				<Text style={styles.subText}>{subMessage}</Text>
			</View>
		</Animated.View>
	);
};

export default FavoriteToast;

const styles = themedStyles(() => StyleSheet.create({
	toast: {
		position: 'absolute',
		alignSelf: 'center',
		backgroundColor: COLORS.gold,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.xl,
		borderRadius: RADIUS.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.md,
		zIndex: 999999,
	},
	icon: {
		width: scaleWidth(40),
		height: scaleWidth(40),
	},
	textWrapper: {
		flexDirection: 'column',
		flexShrink: 1,
	},
	text: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.textStrong,
		flexWrap: 'wrap',
	},
	subText: {
		marginTop: SPACING_H.xs,
		fontSize: FONT_SIZES.sm,
		fontWeight: '500',
		color: COLORS.text,
	},
}));
