/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import FastImage from 'react-native-fast-image';
import ConfettiCannon from 'react-native-confetti-cannon';
import { scaledSize, scaleHeight, scaleWidth, screenWidth } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';
import Colors from '@/const/ConstColors';

export interface LevelUpInfo {
	label: string;
	mascot: any;
	encouragement: string;
	description: string;
	score: number;
}

interface LevelUpModalProps {
	visible: boolean;
	onClose: () => void;
	level: LevelUpInfo | null;
	/** 레벨업 보상 점수 (있으면 표시) */
	bonus?: number;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ visible, onClose, level, bonus = 0 }) => {
	const scaleAnim = useRef(new Animated.Value(0.8)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;
	const mascotAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!visible) {
			return;
		}
		scaleAnim.setValue(0.8);
		opacityAnim.setValue(0);
		mascotAnim.setValue(0);
		const anim = Animated.parallel([
			Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
			Animated.timing(opacityAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
			Animated.spring(mascotAnim, { toValue: 1, friction: 4, tension: 80, delay: 150, useNativeDriver: true }),
		]);
		anim.start();
		// ✅ 정리
		return () => anim.stop();
	}, [visible, scaleAnim, opacityAnim, mascotAnim]);

	if (!level) {
		return null;
	}

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				{visible && (
					<View style={styles.confetti} pointerEvents="none">
						<ConfettiCannon count={80} origin={{ x: screenWidth / 2, y: 0 }} fadeOut explosionSpeed={450} fallSpeed={2600} />
					</View>
				)}
				<Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
					<View style={styles.ribbon}>
						<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(16)} color="#fff" />
						<Text style={styles.ribbonText}>LEVEL UP</Text>
						<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(16)} color="#fff" />
					</View>

					<Animated.View
						style={{
							transform: [
								{ scale: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
								{ translateY: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(20), 0] }) },
							],
						}}>
						<View style={styles.mascotWrap}>
							<FastImage source={level.mascot} style={styles.mascot} resizeMode={FastImage.resizeMode.contain} />
						</View>
					</Animated.View>

					<Text style={styles.congrats}>새로운 등급 달성!</Text>
					<Text style={styles.gradeLabel}>{level.label}</Text>
					<Text style={styles.encourage}>{level.encouragement}</Text>

					{bonus > 0 && (
						<View style={styles.bonusChip}>
							<IconComponent type="materialIcons" name="card-giftcard" size={scaledSize(16)} color={Colors.primaryDeep} />
							<Text style={styles.bonusText}>레벨업 보너스 +{bonus}점</Text>
						</View>
					)}

					<TouchableOpacity style={styles.confirmBtn} onPress={onClose} activeOpacity={0.85}>
						<Text style={styles.confirmText}>계속하기</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default LevelUpModal;

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
	confetti: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
	card: {
		width: '82%',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(22),
		paddingTop: scaleHeight(26),
		paddingBottom: scaleHeight(20),
		paddingHorizontal: scaleWidth(20),
		alignItems: 'center',
	},
	ribbon: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		backgroundColor: Colors.primary,
		paddingHorizontal: scaleWidth(16),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(999),
		marginBottom: scaleHeight(16),
	},
	ribbonText: { color: '#fff', fontSize: scaledSize(13), fontWeight: '800', letterSpacing: 1 },
	mascotWrap: {
		width: scaleWidth(130),
		height: scaleWidth(130),
		borderRadius: scaleWidth(65),
		backgroundColor: Colors.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(14),
	},
	mascot: { width: scaleWidth(104), height: scaleWidth(104) },
	congrats: { fontSize: scaledSize(13), fontWeight: '700', color: '#64748B', marginBottom: scaleHeight(2) },
	gradeLabel: { fontSize: scaledSize(24), fontWeight: '800', color: '#1E293B', marginBottom: scaleHeight(8) },
	encourage: {
		fontSize: scaledSize(13.5),
		color: '#475569',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
		marginBottom: scaleHeight(14),
		paddingHorizontal: scaleWidth(6),
	},
	bonusChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		backgroundColor: Colors.primaryBg,
		borderRadius: scaleWidth(999),
		paddingHorizontal: scaleWidth(14),
		paddingVertical: scaleHeight(7),
		marginBottom: scaleHeight(16),
	},
	bonusText: { color: Colors.primaryDeep, fontSize: scaledSize(13), fontWeight: '800' },
	confirmBtn: {
		backgroundColor: Colors.primary,
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(13),
		paddingHorizontal: scaleWidth(40),
		alignSelf: 'stretch',
		alignItems: 'center',
	},
	confirmText: { color: '#fff', fontSize: scaledSize(15), fontWeight: '800' },
});
