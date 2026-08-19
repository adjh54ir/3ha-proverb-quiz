import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MainDataType } from '@/types/MainDataType';
import { BADGE_RARITY_META } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth, screenWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { playComplete } from '@/utils/SoundUtils';

interface Props {
	visible: boolean;
	badges: MainDataType.UserBadge[];
	onConfirm: () => void;
}

/**
 * 신규 뱃지 획득 공통 모달
 * - 여러 화면(퀴즈/오늘의 퀴즈 등)에서 동일한 스타일로 재사용합니다.
 */
const NewBadgeModal = ({ visible, badges, onConfirm }: Props) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;
	const iconPopAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(0)).current;
	const confettiKey = useRef(0);

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			fadeAnim.setValue(0);
			scaleAnim.setValue(0.95);
			iconPopAnim.setValue(0);
			pulseAnim.setValue(0);
			return;
		}
		confettiKey.current += 1;
		playComplete(); // 🏅 뱃지 획득 사운드
		fadeAnim.setValue(0);
		scaleAnim.setValue(0.95);
		iconPopAnim.setValue(0);
		pulseAnim.setValue(0);

		// 진입: fade + scale
		const enter = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		// 축하 포인트: 뱃지 아이콘 spring pop-in (0 → 1.05 → 1)
		const iconPop = Animated.spring(iconPopAnim, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true });
		// 주목 유도: 헤더 아이콘 글로우 펄스 루프
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
				Animated.timing(pulseAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
			]),
		);
		enter.start();
		iconPop.start();
		pulse.start();
		return () => {
			enter.stop();
			iconPop.stop();
			pulse.stop();
			pulseAnim.stopAnimation();
		};
	}, [visible, fadeAnim, scaleAnim, iconPopAnim, pulseAnim]);

	const glowScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] });
	const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

	const handleConfirm = () => {
		Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
		]).start(({ finished }) => {
			// stop() 으로 중단된 경우에도 콜백이 호출되므로 완료된 경우에만 부모에 알린다
			if (!finished) {
				return;
			}
			onConfirm();
		});
	};

	if (!visible) {
		return null;
	}

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<ConfettiCannon
					key={confettiKey.current}
					count={100}
					origin={{ x: screenWidth / 2, y: 0 }}
					fadeOut
					autoStart
					explosionSpeed={350}
				/>

				<Animated.View style={[styles.badgeModal, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
					<ModalCloseButton onPress={handleConfirm} color={COLORS.textSecondary} />
					<View style={styles.headerIconStage}>
						<Animated.View style={[styles.headerIconGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
						<Animated.View style={[styles.headerIconCircle, { transform: [{ scale: iconPopAnim }] }]}>
							<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(28)} color={COLORS.warning} />
						</Animated.View>
					</View>
					<Text style={styles.badgeModalTitle}>🎉 새로운 뱃지 획득!</Text>
					<Text style={styles.badgeModalSubtitle}>{badges.length}개의 새로운 뱃지를 손에 넣었어요!</Text>
					<ScrollView
						style={styles.badgeScroll}
						contentContainerStyle={styles.badgeScrollContent}
						showsVerticalScrollIndicator={false}>
						{badges.map((badge, index) => {
							const rarity = BADGE_RARITY_META[badge.rarity] ?? BADGE_RARITY_META.common;
							return (
								<View key={index} style={[styles.badgeCard, { backgroundColor: rarity.soft, borderColor: rarity.color }]}>
									{/* 희귀도 리본 (등급 + 별점) */}
									<View style={[styles.rarityRibbon, { backgroundColor: rarity.color }]}>
										<IconComponent type="materialIcons" name="military-tech" size={scaledSize(13)} color="#fff" />
										<Text style={styles.rarityRibbonText}>{rarity.label}</Text>
										<View style={styles.ribbonStarRow}>
											{Array.from({ length: 4 }).map((_, i) => (
												<IconComponent
													key={i}
													type="materialIcons"
													name="star"
													size={scaledSize(11)}
													color={i < rarity.stars ? COLORS.textWhite : 'rgba(255,255,255,0.4)'}
												/>
											))}
										</View>
									</View>

									{/* 엠블럼 (마스코트 또는 아이콘) */}
									<View style={styles.emblemStage}>
										<View style={[styles.emblemRing, { borderColor: rarity.color }]}>
											{badge.mascotImage ? (
												<FastImage source={badge.mascotImage} style={styles.emblemImage} resizeMode={FastImage.resizeMode.contain} />
											) : (
												<View style={styles.emblemIconBg}>
													<IconComponent type={badge.iconType} name={badge.icon} size={scaledSize(34)} color={rarity.color} />
												</View>
											)}
										</View>
									</View>

									{/* 이름 + 설명 */}
									<Text style={[styles.badgeName, { color: rarity.color }]} numberOfLines={1}>
										{badge.name}
									</Text>
									<Text style={styles.badgeDescription} numberOfLines={3}>
										{badge.description}
									</Text>

									{/* 획득 조건 */}
									{!!badge.condition && (
										<View style={[styles.conditionRow, { borderColor: rarity.color }]}>
											<IconComponent type="materialIcons" name="flag" size={scaledSize(13)} color={rarity.color} />
											<Text style={[styles.conditionText, { color: rarity.color }]} numberOfLines={2}>
												{badge.condition}
											</Text>
										</View>
									)}
								</View>
							);
						})}
					</ScrollView>
					<TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirm} activeOpacity={0.85}>
						<Text style={styles.modalConfirmText}>확인</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default NewBadgeModal;

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	badgeModal: {
		width: '100%',
		maxWidth: scaleWidth(340),
		maxHeight: '80%',
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
		alignItems: 'center',
	},
	headerIconStage: {
		width: scaleWidth(56),
		height: scaleWidth(56),
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	headerIconGlow: {
		position: 'absolute',
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(56) / 2,
		backgroundColor: COLORS.warning,
	},
	headerIconCircle: {
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(56) / 2,
		backgroundColor: COLORS.warningBg,
		justifyContent: 'center',
		alignItems: 'center',
	},
	badgeModalTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.xs,
		textAlign: 'center',
	},
	badgeModalSubtitle: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		marginBottom: SPACING_H.lg,
		textAlign: 'center',
	},
	badgeScroll: {
		width: '100%',
		maxHeight: scaleHeight(380),
	},
	badgeScrollContent: {
		paddingHorizontal: SPACING_W.xs,
		paddingTop: SPACING_H.sm,
		paddingBottom: SPACING_H.xs,
	},
	badgeCard: {
		width: '100%',
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginTop: SPACING_H.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1.5,
		borderColor: COLORS.border,
		alignItems: 'center',
	},
	rarityRibbon: {
		position: 'absolute',
		top: scaleHeight(-12),
		alignSelf: 'center',
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	rarityRibbonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		marginRight: SPACING_W.xxs,
	},
	ribbonStarRow: { flexDirection: 'row', columnGap: scaleWidth(1) },
	emblemStage: {
		marginTop: SPACING_H.sm,
		marginBottom: SPACING_H.sm,
	},
	emblemRing: {
		width: scaleWidth(78),
		height: scaleWidth(78),
		borderRadius: scaleWidth(78) / 2,
		borderWidth: 3,
		backgroundColor: COLORS.surface,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emblemImage: { width: scaleWidth(60), height: scaleWidth(60) },
	emblemIconBg: { justifyContent: 'center', alignItems: 'center' },
	conditionRow: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.xs,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		marginTop: SPACING_H.md,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
	},
	conditionText: { fontSize: FONT_SIZES.sm, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
	badgeName: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.primary,
		textAlign: 'center',
		marginBottom: SPACING_H.xs,
	},
	badgeDescription: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(20),
		textAlign: 'center',
		paddingHorizontal: SPACING_W.xs,
	},
	modalConfirmButton: {
		width: '100%',
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: SPACING_H.lg,
	},
	modalConfirmText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},
});
