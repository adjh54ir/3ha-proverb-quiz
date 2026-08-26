/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import ConfettiCannon from 'react-native-confetti-cannon';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';
import { BADGE_RARITY_META } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { getBadgeProgress, BadgeProgress } from '@/utils/BadgeProgressUtils';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';


interface Props {
	visible: boolean;
	badge: MainDataType.UserBadge | null;
	isEarned: boolean;
	onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = { study: '학습 뱃지', quiz: '퀴즈 뱃지', attendance: '출석 뱃지' };

const BadgeDetailPopup = ({ visible, badge, isEarned, onClose }: Props) => {
	// AppModal 이 시스템 바까지 덮으므로 오버레이가 직접 안전 여백을 준다.
	const safePadding = useModalSafePadding();
	// 회전/폴더블 대응: 화면 크기가 바뀌면 컴포넌트가 다시 렌더된다.
	const { width: screenWidth } = useWindowDimensions();
	const backdrop = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(0.6)).current;
	const translateY = useRef(new Animated.Value(40)).current;
	const spin = useRef(new Animated.Value(0)).current;
	const glow = useRef(new Animated.Value(0)).current;
	const confettiRef = useRef<any>(null);
	const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [progress, setProgress] = useState<BadgeProgress | null>(null);

	// 아직 못 얻은 뱃지만 진행도를 읽는다 — 이미 얻은 뱃지는 막대가 항상 100%라 알려 주는 게 없다
	useEffect(() => {
		if (!visible || !badge || isEarned) {
			setProgress(null);
			return;
		}
		let alive = true;
		getBadgeProgress(badge.id).then((p) => {
			if (alive) {
				setProgress(p);
			}
		});
		return () => {
			alive = false;
		};
	}, [visible, badge, isEarned]);

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			backdrop.setValue(0);
			scale.setValue(0.6);
			translateY.setValue(40);
			spin.setValue(0);
			glow.setValue(0);
			return;
		}
		backdrop.setValue(0);
		scale.setValue(0.6);
		translateY.setValue(40);
		spin.setValue(0);
		glow.setValue(0);

		// 진입: 딤은 페이드, 카드는 아래에서 튀어 오르듯 스프링
		const enter = Animated.parallel([
			Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
			Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
			Animated.spring(translateY, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
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
	}, [visible, isEarned, backdrop, scale, translateY, spin, glow]);

	if (!badge) {return null;}

	const meta = BADGE_RARITY_META[badge.rarity] ?? BADGE_RARITY_META.common;
	const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
	const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] });
	const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

	return (
		<Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
			<Animated.View style={[styles.backdrop, safePadding, { opacity: backdrop }]}>
				<TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

				<Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }]}>
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
												style={[styles.ray, { transform: [{ rotate: `${i * 45}deg` }, { translateY: -scaleWidth(46) }] }]}
											/>
										))}
									</Animated.View>
								)}
								<View style={[styles.iconCircle, !isEarned && styles.iconCircleLocked]}>
									<IconComponent
										type={badge.iconType}
										name={isEarned ? badge.icon : 'lock'}
										size={scaledSize(40)}
										color={isEarned ? meta.color : COLORS.textLight}
									/>
								</View>
							</View>

							<Text style={styles.badgeName} numberOfLines={2} ellipsizeMode="tail">
								{badge.name}
							</Text>
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

						{!!progress && progress.goal > 0 && (
							<View style={[styles.progressBlock, styles.sectionCard]}>
								<View style={styles.progressHead}>
									<Text style={styles.infoLabel}>획득 진행도</Text>
									<Text style={[styles.progressValue, { color: meta.color }]}>
										{Math.min(progress.current, progress.goal).toLocaleString()} / {progress.goal.toLocaleString()}
									</Text>
								</View>
								<View style={styles.progressTrack}>
									<View
										style={[
											styles.progressFill,
											{
												backgroundColor: meta.color,
												width: `${Math.min(100, Math.round((progress.current / progress.goal) * 100))}%`,
											},
										]}
									/>
								</View>
								<Text style={styles.progressLeft}>
									{progress.current >= progress.goal
										? '조건을 채웠습니다! 곧 지급됩니다.'
										: `${(progress.goal - progress.current).toLocaleString()}${progress.unit} 더 하면 획득!`}
								</Text>
							</View>
						)}

						<View style={[styles.statusBanner, isEarned ? { backgroundColor: meta.soft } : styles.statusBannerLocked]}>
							<IconComponent
								type="materialIcons"
								name={isEarned ? 'verified' : 'lock'}
								size={scaledSize(16)}
								color={isEarned ? meta.color : COLORS.textLight}
							/>
							<Text style={[styles.statusText, { color: isEarned ? meta.color : COLORS.textLight }]}>
								{isEarned ? '획득 완료한 뱃지입니다!' : '아직 획득하지 못했습니다'}
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
						origin={{ x: screenWidth / 2, y: 0 }}
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

const styles = themedStyles(() => StyleSheet.create({
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
		maxHeight: '100%', // 카드가 시스템 바를 넘지 않도록(모달 레이아웃 규칙 2)
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
		width: scaleWidth(120),
		height: scaleWidth(120),
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: SPACING_H.xs,
	},
	glowCircle: {
		position: 'absolute',
		top: scaleWidth(5),
		left: scaleWidth(5),
		width: scaleWidth(110),
		height: scaleWidth(110),
		borderRadius: scaleWidth(110) / 2,
	},
	spinRing: {
		position: 'absolute',
		top: scaleWidth(5),
		left: scaleWidth(5),
		width: scaleWidth(110),
		height: scaleWidth(110),
		alignItems: 'center',
		justifyContent: 'center',
	},
	ray: {
		position: 'absolute',
		top: scaleWidth(55) - scaleWidth(7),
		left: scaleWidth(55) - scaleWidth(2),
		width: scaleWidth(4),
		height: scaleWidth(14),
		borderRadius: scaleWidth(2),
		backgroundColor: 'rgba(255,255,255,0.85)',
	},
	iconCircle: {
		width: scaleWidth(82),
		height: scaleWidth(82),
		borderRadius: scaleWidth(82) / 2,
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
	progressBlock: { rowGap: SPACING_H.sm },
	progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	progressValue: { fontSize: FONT_SIZES.smPlus, fontWeight: '700' },
	progressTrack: {
		height: scaleHeight(8),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
		overflow: 'hidden',
	},
	progressFill: { height: '100%', borderRadius: RADIUS.round },
	progressLeft: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
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
}));
