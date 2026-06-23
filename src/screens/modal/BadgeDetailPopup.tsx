/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';
import { BADGE_RARITY_META } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import Colors from '@/const/ConstColors';

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
	const scale = useRef(new Animated.Value(0.6)).current;
	const translateY = useRef(new Animated.Value(40)).current;
	const spin = useRef(new Animated.Value(0)).current;
	const glow = useRef(new Animated.Value(0)).current;
	const confettiRef = useRef<any>(null);

	useEffect(() => {
		if (visible) {
			backdrop.setValue(0);
			scale.setValue(0.6);
			translateY.setValue(40);
			Animated.parallel([
				Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
				Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
				Animated.spring(translateY, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
			]).start();

			spin.setValue(0);
			Animated.loop(
				Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
			).start();

			Animated.loop(
				Animated.sequence([
					Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
					Animated.timing(glow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
				]),
			).start();

			if (isEarned) {
				setTimeout(() => confettiRef.current?.start?.(), 250);
			}
		}
	}, [visible, isEarned, backdrop, scale, translateY, spin, glow]);

	if (!badge) {return null;}

	const meta = BADGE_RARITY_META[badge.rarity] ?? BADGE_RARITY_META.common;
	const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
	const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] });
	const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

	return (
		<Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
			<Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
				<TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

				<Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }]}>
					{/* 헤더 - 단색 + 우하단 어두운 오버레이로 그라데이션 대체 */}
					<View style={[styles.headerGrad, { backgroundColor: meta.color }]}>
						<View style={[StyleSheet.absoluteFill, styles.headerOverlay]} />
						<View style={styles.headerContent}>
							<View style={styles.rarityPill}>
								{Array.from({ length: meta.stars }).map((_, i) => (
									<IconComponent key={i} type="materialIcons" name="star" size={scaledSize(11)} color={Colors.textInverse} />
								))}
								<Text style={styles.rarityPillText}>{meta.label}</Text>
							</View>

							<View style={styles.iconStage}>
								{isEarned && (
									<Animated.View
										style={[
											styles.glowCircle,
											{ backgroundColor: Colors.textInverse, opacity: glowOpacity, transform: [{ scale: glowScale }] },
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
										color={isEarned ? meta.color : Colors.textMuted}
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

						<View style={styles.infoRow}>
							<View style={[styles.infoIcon, { backgroundColor: meta.soft }]}>
								<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(15)} color={meta.color} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.infoLabel}>희귀도</Text>
								<View style={styles.rarityValueRow}>
									<View style={[styles.rarityTag, { backgroundColor: meta.soft }]}>
										<Text style={[styles.rarityTagText, { color: meta.color }]}>{meta.label}</Text>
									</View>
									<View style={{ flexDirection: 'row', gap: scaleWidth(2) }}>
										{Array.from({ length: 4 }).map((_, i) => (
											<IconComponent
												key={i}
												type="materialIcons"
												name="star"
												size={scaledSize(14)}
												color={i < meta.stars ? meta.color : Colors.border}
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
								color={isEarned ? meta.color : Colors.textMuted}
							/>
							<Text style={[styles.statusText, { color: isEarned ? meta.color : Colors.textMuted }]}>
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
	<View style={styles.infoRow}>
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
		backgroundColor: 'rgba(15,23,42,0.55)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: scaleWidth(24),
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(360),
		borderRadius: scaleWidth(24),
		backgroundColor: Colors.surface,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.25,
		shadowRadius: 24,
		elevation: 12,
	},
	headerGrad: {
		width: '100%',
		paddingTop: scaleHeight(18),
		paddingBottom: scaleHeight(22),
		paddingHorizontal: scaleWidth(20),
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
		gap: scaleWidth(3),
		backgroundColor: 'rgba(255,255,255,0.22)',
		borderRadius: scaleWidth(20),
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(5),
	},
	rarityPillText: { color: Colors.textInverse, fontSize: scaledSize(12), fontWeight: '800', marginLeft: scaleWidth(3) },
	iconStage: {
		width: scaleWidth(120),
		height: scaleWidth(120),
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: scaleHeight(10),
	},
	glowCircle: {
		position: 'absolute',
		top: scaleWidth(5),
		left: scaleWidth(5),
		width: scaleWidth(110),
		height: scaleWidth(110),
		borderRadius: scaleWidth(55),
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
		borderRadius: scaleWidth(41),
		backgroundColor: Colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 5,
	},
	iconCircleLocked: { backgroundColor: Colors.surfaceAlt },
	badgeName: {
		color: Colors.textInverse,
		fontSize: scaledSize(20),
		fontWeight: '900',
		marginTop: scaleHeight(4),
		textAlign: 'center',
	},
	typeChip: {
		marginTop: scaleHeight(8),
		backgroundColor: 'rgba(255,255,255,0.22)',
		borderRadius: scaleWidth(8),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(3),
	},
	typeChipText: { color: Colors.textInverse, fontSize: scaledSize(11), fontWeight: '700' },

	body: { padding: scaleWidth(18), gap: scaleHeight(12) },
	infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: scaleWidth(11) },
	infoIcon: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(9),
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: scaleHeight(1),
	},
	infoLabel: {
		fontSize: scaledSize(11.5),
		fontWeight: '700',
		color: Colors.textSecondary,
		marginBottom: scaleHeight(3),
	},
	infoValue: { fontSize: scaledSize(13.5), color: Colors.text, lineHeight: scaleHeight(19) },
	rarityValueRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) },
	rarityTag: { borderRadius: scaleWidth(7), paddingHorizontal: scaleWidth(9), paddingVertical: scaleHeight(3) },
	rarityTagText: { fontSize: scaledSize(12.5), fontWeight: '800' },
	statusBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(6),
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(11),
		marginTop: scaleHeight(2),
	},
	statusBannerLocked: { backgroundColor: Colors.surfaceAlt },
	statusText: { fontSize: scaledSize(13), fontWeight: '800' },
	closeBtn: {
		backgroundColor: Colors.textStrong,
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(14),
		alignItems: 'center',
		marginTop: scaleHeight(2),
	},
	closeBtnText: { color: Colors.textInverse, fontSize: scaledSize(15), fontWeight: '800' },
});
