/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';
import { BADGE_RARITY_META } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
import ModalCloseButton from '../common/atomic/ModalCloseButton';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
	visible: boolean;
	badge: MainDataType.UserBadge | null;
	isEarned: boolean;
	onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = { study: '학습 뱃지', quiz: '퀴즈 뱃지', attendance: '출석 뱃지' };

const BadgeDetailPopup = ({ visible, badge, isEarned, onClose }: Props) => {
	const backdrop = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(0.95)).current;
	const spin = useRef(new Animated.Value(0)).current;
	const glow = useRef(new Animated.Value(0)).current;
	const confettiRef = useRef<any>(null);
	const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			backdrop.setValue(0);
			scale.setValue(0.95);
			spin.setValue(0);
			glow.setValue(0);
			return;
		}
		backdrop.setValue(0);
		scale.setValue(0.95);
		spin.setValue(0);
		glow.setValue(0);

		// 진입: fade + scale
		const enter = Animated.parallel([
			Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		const spinLoop = Animated.loop(
			Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
		);
		const glowLoop = Animated.loop(
			Animated.sequence([
				Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
				Animated.timing(glow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
			]),
		);
		enter.start();
		spinLoop.start();
		glowLoop.start();

		if (isEarned) {
			confettiTimer.current = setTimeout(() => confettiRef.current?.start?.(), 250);
		}
		return () => {
			enter.stop();
			spinLoop.stop();
			glowLoop.stop();
			if (confettiTimer.current) {
				clearTimeout(confettiTimer.current);
				confettiTimer.current = null;
			}
		};
	}, [visible, isEarned, backdrop, scale, spin, glow]);

	if (!badge) {return null;}

	const meta = BADGE_RARITY_META[badge.rarity] ?? BADGE_RARITY_META.common;
	const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
	const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] });
	const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

	return (
		<Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
			<Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
				<TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

				<Animated.View style={[styles.card, { transform: [{ scale }] }]}>
					{/* 헤더 - 단색 + 우하단 어두운 오버레이로 그라데이션 대체 */}
					<View style={[styles.headerGrad, { backgroundColor: meta.color }]}>
						<View style={[StyleSheet.absoluteFill, styles.headerOverlay]} />
						<ModalCloseButton onPress={onClose} color={COLORS.textWhite} />
						<View style={styles.headerContent}>
							<View style={styles.rarityPill}>
								{Array.from({ length: meta.stars }).map((_, i) => (
									<IconComponent key={i} type="materialIcons" name="star" size={scaledSize(11)} color={COLORS.textWhite} />
								))}
								<Text style={styles.rarityPillText}>{meta.label}</Text>
							</View>

							<View style={styles.iconStage}>
								{isEarned && (
									<Animated.View
										style={[
											styles.glowCircle,
											{ backgroundColor: COLORS.textWhite, opacity: glowOpacity, transform: [{ scale: glowScale }] },
										]}
									/>
								)}
								{isEarned && (
									<Animated.View style={[styles.spinRing, { transform: [{ rotate }] }]}>
										{Array.from({ length: 8 }).map((_, i) => (
											<View
												key={i}
												style={[styles.ray, { transform: [{ rotate: `${i * 45}deg` }, { translateY: -scaleWidth(36) }] }]}
											/>
										))}
									</Animated.View>
								)}
								<View style={[styles.iconCircle, !isEarned && styles.iconCircleLocked]}>
									<IconComponent
										type={badge.iconType}
										name={isEarned ? badge.icon : 'lock'}
										size={scaledSize(34)}
										color={isEarned ? meta.color : COLORS.textLight}
									/>
								</View>
							</View>

							<Text style={styles.badgeName}>{badge.name}</Text>
							<View style={styles.typeChip}>
								<Text style={styles.typeChipText}>{TYPE_LABEL[badge.type] ?? '뱃지'}</Text>
							</View>
						</View>
					</View>

					{/* 본문 */}
					<View style={styles.body}>
						<InfoRow icon="format-quote" label="뱃지 설명" value={badge.description} tint={meta.color} />
						<InfoRow icon="flag" label="획득 조건" value={badge.condition} tint={meta.color} />

						<View style={[styles.infoRow, styles.sectionCard]}>
							<View style={[styles.infoIcon, { backgroundColor: meta.soft }]}>
								<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(15)} color={meta.color} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.infoLabel}>희귀도</Text>
								<View style={styles.rarityValueRow}>
									<View style={[styles.rarityTag, { backgroundColor: meta.soft }]}>
										<Text style={[styles.rarityTagText, { color: meta.color }]}>{meta.label}</Text>
									</View>
									<View style={{ flexDirection: 'row', gap: SPACING_W.xxs }}>
										{Array.from({ length: 4 }).map((_, i) => (
											<IconComponent
												key={i}
												type="materialIcons"
												name="star"
												size={scaledSize(14)}
												color={i < meta.stars ? meta.color : COLORS.border}
											/>
										))}
									</View>
								</View>
							</View>
						</View>

						<View style={[styles.statusBanner, isEarned ? { backgroundColor: meta.soft } : styles.statusBannerLocked]}>
							<IconComponent
								type="materialIcons"
								name={isEarned ? 'verified' : 'lock'}
								size={scaledSize(16)}
								color={isEarned ? meta.color : COLORS.textLight}
							/>
							<Text style={[styles.statusText, { color: isEarned ? meta.color : COLORS.textLight }]}>
								{isEarned ? '획득 완료한 뱃지예요!' : '아직 획득하지 못했어요'}
							</Text>
						</View>

						<TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
							<Text style={styles.closeBtnText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>

				{isEarned && (
					<ConfettiCannon
						ref={confettiRef}
						count={80}
						origin={{ x: SCREEN_W / 2, y: 0 }}
						autoStart={false}
						fadeOut
						fallSpeed={2600}
						explosionSpeed={350}
					/>
				)}
			</Animated.View>
		</Modal>
	);
};

const InfoRow = ({ icon, label, value, tint }: { icon: string; label: string; value: string; tint: string }) => (
	<View style={[styles.infoRow, styles.sectionCard]}>
		<View style={[styles.infoIcon, { backgroundColor: `${tint}1A` }]}>
			<IconComponent type="materialIcons" name={icon} size={scaledSize(15)} color={tint} />
		</View>
		<View style={{ flex: 1 }}>
			<Text style={styles.infoLabel}>{label}</Text>
			<Text style={styles.infoValue}>{value}</Text>
		</View>
	</View>
);

export default BadgeDetailPopup;

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: COLORS.dim,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(340),
		borderRadius: RADIUS.xl,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		overflow: 'hidden',
	},
	headerGrad: {
		width: '100%',
		paddingTop: SPACING_H.lg,
		paddingBottom: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
	},
	// 우하단 방향 어두운 오버레이 → 그라데이션 대체
	headerOverlay: {
		backgroundColor: 'rgba(0,0,0,0.18)',
	},
	headerContent: {
		alignItems: 'center',
	},
	rarityPill: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		backgroundColor: 'rgba(255,255,255,0.22)',
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
	},
	rarityPillText: { color: COLORS.textWhite, fontSize: FONT_SIZES.sm, fontWeight: '700', marginLeft: SPACING_W.xs },
	iconStage: {
		width: scaleWidth(98),
		height: scaleWidth(98),
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: SPACING_H.xs,
	},
	glowCircle: {
		position: 'absolute',
		top: scaleWidth(4),
		left: scaleWidth(4),
		width: scaleWidth(90),
		height: scaleWidth(90),
		borderRadius: scaleWidth(90) / 2,
	},
	spinRing: {
		position: 'absolute',
		top: scaleWidth(4),
		left: scaleWidth(4),
		width: scaleWidth(90),
		height: scaleWidth(90),
		alignItems: 'center',
		justifyContent: 'center',
	},
	ray: {
		position: 'absolute',
		top: scaleWidth(45) - scaleWidth(7),
		left: scaleWidth(45) - scaleWidth(2),
		width: scaleWidth(4),
		height: scaleWidth(13),
		borderRadius: scaleWidth(2),
		backgroundColor: 'rgba(255,255,255,0.85)',
	},
	iconCircle: {
		width: scaleWidth(68),
		height: scaleWidth(68),
		borderRadius: scaleWidth(68) / 2,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconCircleLocked: { backgroundColor: COLORS.surfaceAlt },
	badgeName: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		marginTop: SPACING_H.xs,
		textAlign: 'center',
	},
	typeChip: {
		marginTop: SPACING_H.sm,
		backgroundColor: 'rgba(255,255,255,0.22)',
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
	},
	typeChipText: { color: COLORS.textWhite, fontSize: FONT_SIZES.xs, fontWeight: '600' },

	body: {
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
		rowGap: SPACING_H.md,
	},
	infoRow: { flexDirection: 'row', alignItems: 'flex-start', columnGap: SPACING_W.md },
	// ✅ 설명 / 획득조건 / 희귀도 각 영역을 border로 구분
	sectionCard: {
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.md,
		backgroundColor: COLORS.surface,
	},
	infoIcon: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: RADIUS.sm,
		alignItems: 'center',
		justifyContent: 'center',
	},
	infoLabel: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xs,
	},
	infoValue: { fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: scaledSize(20) },
	rarityValueRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm },
	rarityTag: { borderRadius: RADIUS.round, paddingHorizontal: SPACING_W.sm, paddingVertical: SPACING_H.xs },
	rarityTagText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
	statusBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.md,
	},
	statusBannerLocked: { backgroundColor: COLORS.surfaceAlt },
	statusText: { fontSize: FONT_SIZES.md, fontWeight: '600' },
	closeBtn: {
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: SPACING_H.xs,
	},
	closeBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.lg, fontWeight: '700' },
});
