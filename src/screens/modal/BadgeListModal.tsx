/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated } from 'react-native';
import IconComponent from '../common/atomic/IconComponent';
import { CONST_BADGES, BADGE_RARITY_META } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import Colors from '@/const/ConstColors';

const BadgeListModal = ({
	visible,
	badges,
	earnedIds,
	onClose,
	onSelectBadge,
}: {
	visible: boolean;
	badges: typeof CONST_BADGES;
	earnedIds: string[];
	onClose: () => void;
	onSelectBadge?: (badge: (typeof CONST_BADGES)[number]) => void;
}) => {
	const scale = useRef(new Animated.Value(0.85)).current;
	const opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			scale.setValue(0.85);
			opacity.setValue(0);
			Animated.parallel([
				Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
				Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
			]).start();
		}
	}, [visible, opacity, scale]);

	const total = badges.length;
	const earnedCount = earnedIds.length;
	const percent = total ? Math.round((earnedCount / total) * 100) : 0;

	// 필터: 전체 / 획득 / 미획득
	const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
	const FILTERS: { key: 'all' | 'earned' | 'locked'; label: string }[] = [
		{ key: 'all', label: `전체 ${total}` },
		{ key: 'earned', label: `획득 ${earnedCount}` },
		{ key: 'locked', label: `미획득 ${total - earnedCount}` },
	];

	const sorted = [...badges]
		.filter((b) => {
			if (filter === 'earned') {
				return earnedIds.includes(b.id);
			}
			if (filter === 'locked') {
				return !earnedIds.includes(b.id);
			}
			return true;
		})
		.sort((a, b) => {
			const aEarned = earnedIds.includes(a.id) ? 0 : 1;
			const bEarned = earnedIds.includes(b.id) ? 0 : 1;
			return aEarned - bEarned;
		});

	return (
		<Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<Animated.View style={[styles.badgeModalContent, { opacity, transform: [{ scale }] }]}>
					{/* 헤더 */}
					<View style={styles.badgeModalHeader}>
						<TouchableOpacity style={styles.badgeModalClose} onPress={onClose}>
							<IconComponent type="materialIcons" name="close" size={scaledSize(22)} color="#FFF7ED" />
						</TouchableOpacity>
						<View style={styles.badgeModalHeaderIcon}>
							<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(30)} color="#fff" />
						</View>
						<Text style={styles.badgeModalTitle}>획득 가능한 뱃지</Text>
						<Text style={styles.badgeModalSubtitle}>
							총 {total}개 중 {earnedCount}개 획득
						</Text>
						<View style={styles.badgeModalProgressTrack}>
							<View style={[styles.badgeModalProgressFill, { width: `${percent}%` }]} />
						</View>
						<Text style={styles.badgeModalPercent}>{percent}% 달성</Text>
					</View>

					{/* 필터 탭 */}
					<View style={styles.badgeFilterRow}>
						{FILTERS.map((f) => {
							const active = filter === f.key;
							return (
								<TouchableOpacity
									key={f.key}
									activeOpacity={0.8}
									onPress={() => setFilter(f.key)}
									style={[styles.badgeFilterChip, active && styles.badgeFilterChipActive]}>
									<Text style={[styles.badgeFilterChipText, active && styles.badgeFilterChipTextActive]}>{f.label}</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					{/* 목록 */}
					<ScrollView
						contentContainerStyle={{ padding: scaleWidth(16) }}
						style={{ height: scaleHeight(380), width: '100%' }}
						showsVerticalScrollIndicator={false}>
						{sorted.length === 0 && (
							<View style={styles.badgeEmptyBox}>
								<IconComponent type="materialIcons" name="inbox" size={scaledSize(34)} color="#CBD5E1" />
								<Text style={styles.badgeEmptyText}>
									{filter === 'earned' ? '아직 획득한 뱃지가 없어요.' : '해당하는 뱃지가 없어요.'}
								</Text>
							</View>
						)}
						{sorted.map((badge) => {
							const isEarned = earnedIds.includes(badge.id);
							const rarity = BADGE_RARITY_META[badge.rarity] ?? BADGE_RARITY_META.common;
							return (
								<TouchableOpacity
									key={badge.id}
									activeOpacity={0.8}
									onPress={() => onSelectBadge?.(badge)}
									style={[styles.badgeCard, isEarned && styles.badgeCardActive]}>
									<View style={[styles.iconBox, { backgroundColor: isEarned ? rarity.soft : '#F1F5F9' }]}>
										<IconComponent
											name={isEarned ? badge.icon : 'lock'}
											type={isEarned ? badge.iconType : 'materialIcons'}
											size={scaledSize(20)}
											color={isEarned ? rarity.color : '#94A3B8'}
										/>
									</View>
									<View style={styles.textBox}>
										<View style={styles.badgeRowTop}>
											<Text style={[styles.badgeTitle, isEarned && styles.badgeTitleActive]} numberOfLines={1}>
												{badge.name}
											</Text>
											<View style={[styles.badgeRarityChip, { backgroundColor: rarity.soft }]}>
												<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(9)} color={rarity.color} />
												<Text style={[styles.badgeRarityChipText, { color: rarity.color }]}>{rarity.label}</Text>
											</View>
										</View>
										<Text style={[styles.badgeDesc, isEarned && styles.badgeDescActive]} numberOfLines={2}>
											{badge.description}
										</Text>
										<View style={styles.badgeCondRow}>
											<IconComponent type="materialIcons" name="flag" size={scaledSize(11)} color="#94A3B8" />
											<Text style={styles.badgeCondText} numberOfLines={1}>
												{badge.condition}
											</Text>
											<View style={[styles.badgeStatusPill, isEarned ? styles.badgeStatusPillEarned : styles.badgeStatusPillLocked]}>
												<Text style={[styles.badgeStatusPillText, { color: isEarned ? '#16A34A' : '#94A3B8' }]}>
													{isEarned ? '획득' : '미획득'}
												</Text>
											</View>
										</View>
									</View>
								</TouchableOpacity>
							);
						})}
					</ScrollView>

					<TouchableOpacity style={styles.badgeModalDoneBtn} onPress={onClose} activeOpacity={0.85}>
						<Text style={styles.badgeModalDoneText}>닫기</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default BadgeListModal;

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	badgeModalContent: {
		width: '90%',
		backgroundColor: Colors.surface,
		borderRadius: scaleWidth(20),
		alignItems: 'center',
		overflow: 'hidden',
		paddingBottom: scaleHeight(18),
		shadowColor: '#000',
		shadowOpacity: 0.18,
		shadowOffset: { width: 0, height: 8 },
		shadowRadius: 16,
		elevation: 8,
	},
	badgeModalHeader: {
		width: '100%',
		backgroundColor: Colors.accentAmber,
		paddingTop: scaleHeight(22),
		paddingBottom: scaleHeight(18),
		paddingHorizontal: scaleWidth(20),
		alignItems: 'center',
	},
	badgeModalClose: {
		position: 'absolute',
		top: scaleHeight(12),
		right: scaleWidth(12),
		zIndex: 2,
		padding: scaleWidth(4),
	},
	badgeModalHeaderIcon: {
		width: scaleWidth(58),
		height: scaleWidth(58),
		borderRadius: scaleWidth(29),
		backgroundColor: 'rgba(255,255,255,0.18)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	badgeModalTitle: {
		fontSize: scaledSize(18),
		fontWeight: '800',
		color: Colors.textInverse,
		marginBottom: scaleHeight(4),
	},
	badgeModalSubtitle: {
		fontSize: scaledSize(12.5),
		color: '#FFF7ED',
		marginBottom: scaleHeight(12),
		fontWeight: '600',
	},
	badgeModalProgressTrack: {
		width: '100%',
		height: scaleHeight(8),
		borderRadius: scaleHeight(4),
		backgroundColor: 'rgba(255,255,255,0.25)',
		overflow: 'hidden',
	},
	badgeModalProgressFill: {
		height: '100%',
		borderRadius: scaleHeight(4),
		backgroundColor: '#FFFFFF',
	},
	badgeModalPercent: {
		marginTop: scaleHeight(6),
		fontSize: scaledSize(11),
		color: '#FFFBEB',
		fontWeight: '700',
	},
	badgeFilterRow: {
		flexDirection: 'row',
		gap: scaleWidth(8),
		paddingHorizontal: scaleWidth(16),
		paddingTop: scaleHeight(14),
	},
	badgeFilterChip: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: scaleHeight(8),
		borderRadius: scaleWidth(10),
		backgroundColor: Colors.surfaceAlt,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	badgeFilterChipActive: {
		backgroundColor: Colors.accentAmber,
		borderColor: Colors.accentAmber,
	},
	badgeFilterChipText: {
		fontSize: scaledSize(12.5),
		fontWeight: '700',
		color: Colors.textSecondary,
	},
	badgeFilterChipTextActive: {
		color: '#fff',
	},
	badgeEmptyBox: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: scaleHeight(40),
		gap: scaleHeight(10),
	},
	badgeEmptyText: {
		fontSize: scaledSize(13),
		color: Colors.textMuted,
		fontWeight: '600',
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(12),
		width: '100%',
		borderWidth: 1,
		borderColor: '#E2E8F0',
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 3,
	},
	badgeCardActive: {
		backgroundColor: '#FFFBEB',
		borderColor: '#FCD34D',
		borderWidth: 1.5,
		shadowColor: '#F59E0B',
		shadowOpacity: 0.2,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 3,
	},
	iconBox: {
		width: scaleWidth(44),
		height: scaleWidth(44),
		borderRadius: scaleWidth(22),
		backgroundColor: '#F1F5F9',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(14),
	},
	textBox: { flex: 1 },
	badgeRowTop: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6) },
	badgeTitle: {
		flexShrink: 1,
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#334155',
	},
	badgeTitleActive: {
		color: '#B45309',
	},
	badgeRarityChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(3),
		borderRadius: scaleWidth(7),
		paddingHorizontal: scaleWidth(7),
		paddingVertical: scaleHeight(2),
	},
	badgeRarityChipText: { fontSize: scaledSize(10), fontWeight: '800' },
	badgeDesc: {
		fontSize: scaledSize(13),
		color: '#64748B',
		marginTop: scaleHeight(4),
	},
	badgeDescActive: {
		color: '#B45309',
	},
	badgeCondRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4), marginTop: scaleHeight(6) },
	badgeCondText: { flex: 1, fontSize: scaledSize(11), color: '#94A3B8' },
	badgeStatusPill: {
		borderRadius: scaleWidth(8),
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(2),
	},
	badgeStatusPillEarned: { backgroundColor: '#DCFCE7' },
	badgeStatusPillLocked: { backgroundColor: '#F1F5F9' },
	badgeStatusPillText: { fontSize: scaledSize(10), fontWeight: '800' },
	badgeModalDoneBtn: {
		marginTop: scaleHeight(6),
		backgroundColor: '#F59E0B',
		paddingVertical: scaleHeight(12),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
		width: '88%',
	},
	badgeModalDoneText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: scaledSize(15),
	},
});
