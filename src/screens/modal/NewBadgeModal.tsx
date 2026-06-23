import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MainDataType } from '@/types/MainDataType';
import { BADGE_RARITY_META } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth, screenWidth } from '@/utils/DementionUtils';
import IconComponent from '../common/atomic/IconComponent';

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
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(0)).current;
	const confettiKey = useRef(0);

	useEffect(() => {
		if (!visible) {
			return;
		}
		confettiKey.current += 1;
		scaleAnim.setValue(0);
		Animated.spring(scaleAnim, {
			toValue: 1,
			friction: 6,
			tension: 60,
			useNativeDriver: true,
		}).start();

		// 주목 유도: 헤더 아이콘 글로우 펄스 루프
		pulseAnim.setValue(0);
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
				Animated.timing(pulseAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
			]),
		);
		pulse.start();
		return () => {
			pulse.stop();
			pulseAnim.stopAnimation();
		};
	}, [visible, scaleAnim, pulseAnim]);

	const glowScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] });
	const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

	const handleConfirm = () => {
		Animated.timing(scaleAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
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

				<Animated.View style={[styles.badgeModal, { transform: [{ scale: scaleAnim }] }]}>
					<View style={styles.headerIconStage}>
						<Animated.View style={[styles.headerIconGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
						<View style={styles.headerIconCircle}>
							<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(28)} color="#F59E0B" />
						</View>
					</View>
					<Text style={styles.badgeModalTitle}>새로운 뱃지 획득!</Text>
					<ScrollView
						style={{ maxHeight: scaleHeight(380), width: '100%' }}
						contentContainerStyle={{ paddingHorizontal: scaleHeight(4), paddingTop: scaleHeight(4) }}
						showsVerticalScrollIndicator={false}>
						{badges.map((badge, index) => {
							const rarity = BADGE_RARITY_META[badge.rarity] ?? BADGE_RARITY_META.common;
							return (
								<View key={index} style={[styles.badgeCard, { borderColor: rarity.color }]}>
									<View style={styles.badgeCardTop}>
										{badge.mascotImage ? (
											<FastImage
												source={badge.mascotImage}
												style={[styles.badgeThumb, { borderColor: rarity.color }]}
												resizeMode={FastImage.resizeMode.contain}
											/>
										) : (
											<View style={[styles.badgeThumb, styles.badgeThumbIcon, { backgroundColor: rarity.soft, borderColor: rarity.color }]}>
												<IconComponent type={badge.iconType} name={badge.icon} size={scaledSize(26)} color={rarity.color} />
											</View>
										)}
										<View style={{ flex: 1, minWidth: 0 }}>
											<Text style={[styles.badgeName, { color: rarity.color }]} numberOfLines={1}>
												{badge.name}
											</Text>
											<View style={styles.badgeMetaRow}>
												<View style={[styles.rarityChip, { backgroundColor: rarity.soft }]}>
													<Text style={[styles.rarityChipText, { color: rarity.color }]}>{rarity.label}</Text>
												</View>
												<View style={styles.starRow}>
													{Array.from({ length: 4 }).map((_, i) => (
														<IconComponent
															key={i}
															type="materialIcons"
															name="star"
															size={scaledSize(12)}
															color={i < rarity.stars ? rarity.color : '#E2E8F0'}
														/>
													))}
												</View>
											</View>
											<Text style={styles.badgeDescription}>{badge.description}</Text>
										</View>
									</View>
									{!!badge.condition && (
										<View style={[styles.conditionRow, { backgroundColor: rarity.soft }]}>
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
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: scaleHeight(40),
	},
	badgeModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(20),
		width: '85%',
		maxHeight: '80%',
		alignItems: 'center',
	},
	headerIconStage: {
		width: scaleWidth(56),
		height: scaleWidth(56),
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	headerIconGlow: {
		position: 'absolute',
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(28),
		backgroundColor: '#F59E0B',
	},
	headerIconCircle: {
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(28),
		backgroundColor: '#FEF3C7',
		justifyContent: 'center',
		alignItems: 'center',
	},
	badgeModalTitle: {
		fontSize: scaledSize(19),
		fontWeight: '800',
		color: '#1E293B',
		marginBottom: scaleHeight(4),
		textAlign: 'center',
	},
	badgeModalSubtitle: {
		fontSize: scaledSize(13),
		color: '#64748B',
		marginBottom: scaleHeight(16),
		textAlign: 'center',
	},
	badgeNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		marginBottom: scaleHeight(3),
	},
	rarityChip: {
		borderRadius: scaleWidth(7),
		paddingHorizontal: scaleWidth(7),
		paddingVertical: scaleHeight(2),
	},
	rarityChipText: { fontSize: scaledSize(10), fontWeight: '800' },
	badgeCard: {
		backgroundColor: '#fff',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(14),
		marginBottom: scaleHeight(10),
		borderWidth: 1.5,
		borderColor: '#E2E8F0',
		width: '100%',
	},
	badgeCardTop: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(12),
		marginBottom: scaleHeight(10),
	},
	badgeThumb: {
		width: scaleWidth(50),
		height: scaleWidth(50),
		borderRadius: scaleWidth(25),
		borderWidth: 2,
		backgroundColor: '#fff',
	},
	badgeThumbIcon: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	badgeMetaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
		marginTop: scaleHeight(4),
	},
	starRow: { flexDirection: 'row', gap: scaleWidth(1) },
	conditionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		borderRadius: scaleWidth(10),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(7),
	},
	conditionText: { flex: 1, fontSize: scaledSize(12), fontWeight: '700' },
	badgeCardActive: {
		borderColor: '#22C55E',
		backgroundColor: '#EFF6FF',
	},
	iconBox: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: '#E2E8F0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(12),
	},
	iconBoxActive: {
		backgroundColor: '#DBEAFE',
	},
	badgeTextWrap: {
		flexShrink: 1,
		flexGrow: 1,
		minWidth: 0,
		maxWidth: '85%',
	},
	badgeName: {
		flexShrink: 1,
		fontSize: scaledSize(15),
		fontWeight: '800',
		color: '#22C55E',
	},
	badgeTitleActive: {
		color: '#22C55E',
	},
	badgeDescription: {
		fontSize: scaledSize(13),
		color: '#475569',
		lineHeight: scaleHeight(19),
		marginTop: scaleHeight(6),
	},
	badgeDescActive: {
		color: '#22C55E',
	},
	mascotImageWrapper: {
		width: '100%',
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	mascotImageImproved: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		borderRadius: scaleWidth(40),
		backgroundColor: '#fff',
		borderWidth: 2,
		borderColor: '#22C55E',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	badgeTextCenteredWrap: {
		alignItems: 'center',
		marginTop: scaleHeight(4),
		paddingHorizontal: scaleWidth(8),
	},
	badgeNameCentered: {
		fontSize: scaledSize(17),
		fontWeight: 'bold',
		color: '#22C55E',
		textAlign: 'center',
		marginBottom: scaleHeight(4),
	},
	badgeDescriptionCentered: {
		fontSize: scaledSize(14),
		color: '#22C55E',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	modalConfirmButton: {
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(24),
		borderRadius: scaleWidth(30),
		marginTop: scaleHeight(8),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	modalConfirmText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
});
