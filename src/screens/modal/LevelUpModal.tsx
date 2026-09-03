import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import FastImage from 'react-native-fast-image';
import ConfettiCannon from 'react-native-confetti-cannon';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { useModalEnter } from '@/hooks/useModalEnter';
import { playComplete } from '@/utils/SoundUtils';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';
import useReducedMotion from '@/hooks/useReducedMotion';

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
	const { width: windowWidth } = useWindowDimensions();
	const reducedMotion = useReducedMotion();
	// AppModal 이 시스템 바까지 덮으므로 오버레이가 직접 안전 여백을 준다.
	const safePadding = useModalSafePadding();
	// 모달 공통 진입 애니메이션 (fade + scale)
	const enterStyle = useModalEnter(visible);
	/** 마스코트 pop-in (0 → 1.05 → 1) */
	const mascotAnim = useRef(new Animated.Value(0)).current;

	// 사운드는 visible 에만 반응해야 한다.
	// 모션 이펙트에 같이 두면 reducedMotion 이 뒤늦게 확정될 때 이펙트가 다시 돌아 소리가 두 번 난다.
	useEffect(() => {
		if (visible) {
			playComplete(); // 🎖️ 레벨업 사운드
		}
	}, [visible]);

	useEffect(() => {
		mascotAnim.setValue(0);
		if (!visible) {
			return;
		}
		if (reducedMotion) {
			mascotAnim.setValue(1);
			return;
		}
		// 카드가 뜬 뒤(150ms) 마스코트가 통통 튀어나온다
		const anim = Animated.sequence([
			Animated.delay(150),
			Animated.spring(mascotAnim, { toValue: 1.05, friction: 5, tension: 120, useNativeDriver: true }),
			Animated.spring(mascotAnim, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }),
		]);
		anim.start();
		// ✅ 정리
		return () => anim.stop();
	}, [visible, mascotAnim, reducedMotion]);

	// visible 을 함께 봐야 한다 — 닫힌 채로 남아 있으면 다음에 열릴 때 이전 등급이 한 프레임 스친다
	if (!visible || !level) {
		return null;
	}

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={[styles.overlay, safePadding]}>
				{visible && !reducedMotion && (
					<View style={styles.confetti} pointerEvents="none">
						<ConfettiCannon count={80} origin={{ x: windowWidth / 2, y: 0 }} fadeOut explosionSpeed={450} fallSpeed={2600} />
					</View>
				)}
				<Animated.View style={[styles.card, enterStyle]}>
					<ModalCloseButton onPress={onClose} />

					{/* 카드가 안전 영역에 맞춰 줄어들면(작은 기기) 내용은 잘리지 않고 스크롤된다 — 버튼은 항상 하단 고정 */}
					<ScrollView
						style={styles.contentScroll}
						contentContainerStyle={styles.contentScrollInner}
						showsVerticalScrollIndicator={false}>
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
					</ScrollView>

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
		maxHeight: '100%', // 카드가 시스템 바를 넘지 않도록(모달 레이아웃 규칙 2)
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
		alignItems: 'center',
	},
	// 카드 maxHeight 안에서 남는 높이만 쓴다(높이를 직접 주면 큰 기기에서 같이 커진다)
	contentScroll: {
		width: '100%',
	},
	contentScrollInner: {
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
