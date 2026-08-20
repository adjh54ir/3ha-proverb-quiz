import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import ConfettiCannon from 'react-native-confetti-cannon';
import { scaledSize, scaleHeight, scaleWidth, screenWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { playComplete } from '@/utils/SoundUtils';

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
	const scaleAnim = useRef(new Animated.Value(0.95)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;
	/** 마스코트 pop-in (0 → 1.05 → 1) */
	const mascotAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			scaleAnim.setValue(0.95);
			opacityAnim.setValue(0);
			mascotAnim.setValue(0);
			return;
		}
		playComplete(); // 🎖️ 레벨업 사운드
		scaleAnim.setValue(0.95);
		opacityAnim.setValue(0);
		mascotAnim.setValue(0);
		const anim = Animated.parallel([
			Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.sequence([
				Animated.delay(150),
				Animated.spring(mascotAnim, { toValue: 1.05, friction: 5, tension: 120, useNativeDriver: true }),
				Animated.spring(mascotAnim, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }),
			]),
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
					<ModalCloseButton onPress={onClose} />

					<View style={styles.ribbon}>
						<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(16)} color={COLORS.textWhite} />
						<Text style={styles.ribbonText}>LEVEL UP</Text>
						<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(16)} color={COLORS.textWhite} />
					</View>

					<Animated.View style={{ transform: [{ scale: mascotAnim }] }}>
						<View style={styles.mascotWrap}>
							<FastImage source={level.mascot} style={styles.mascot} resizeMode={FastImage.resizeMode.contain} />
						</View>
					</Animated.View>

					<Text style={styles.congrats}>새로운 등급 달성!</Text>
					<Text style={styles.gradeLabel}>{level.label}</Text>
					<Text style={styles.encourage}>{level.encouragement}</Text>

					{bonus > 0 && (
						<View style={styles.bonusChip}>
							<IconComponent type="materialIcons" name="card-giftcard" size={scaledSize(16)} color={COLORS.primaryDeep} />
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

const styles = themedStyles(() => StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	confetti: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
	card: {
		width: '100%',
		maxWidth: scaleWidth(340),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
		alignItems: 'center',
	},
	ribbon: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		backgroundColor: COLORS.primary,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		marginBottom: SPACING_H.lg,
	},
	ribbonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '700',
		letterSpacing: 1,
	},
	mascotWrap: {
		width: scaleWidth(130),
		height: scaleWidth(130),
		borderRadius: scaleWidth(130) / 2,
		backgroundColor: COLORS.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	mascot: { width: scaleWidth(104), height: scaleWidth(104) },
	congrats: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xs,
	},
	gradeLabel: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.sm,
	},
	encourage: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		textAlign: 'center',
		lineHeight: scaledSize(20),
		marginBottom: SPACING_H.md,
	},
	bonusChip: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		backgroundColor: COLORS.primaryBg,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		marginBottom: SPACING_H.lg,
	},
	bonusText: {
		color: COLORS.primaryDeep,
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '700',
	},
	confirmBtn: {
		alignSelf: 'stretch',
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	confirmText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},
}));
