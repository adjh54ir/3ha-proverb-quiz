import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import IconComponent from '../common/atomic/IconComponent';
import { CONST_BADGES, BADGE_RARITY_META } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { useModalEnter } from '@/hooks/useModalEnter';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';

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
	// AppModal 이 시스템 바까지 덮으므로 오버레이가 직접 안전 여백을 준다.
	const safePadding = useModalSafePadding();
	// 모달 공통 진입 애니메이션 (fade + scale)
	const enterStyle = useModalEnter(visible);


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
			<View style={[styles.modalOverlay, safePadding]}>
				<Animated.View style={[styles.badgeModalContent, enterStyle]}>
					{/* 헤더 */}
					<View style={styles.badgeModalHeader}>
						<ModalCloseButton onPress={onClose} color={COLORS.textSecondary} />
						<View style={styles.badgeModalHeaderIcon}>
							<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(30)} color={COLORS.textWhite} />
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
						contentContainerStyle={styles.badgeListContent}
						style={styles.badgeList}
						showsVerticalScrollIndicator={false}>
						{sorted.length === 0 && (
							<View style={styles.badgeEmptyBox}>
								<IconComponent type="materialIcons" name="inbox" size={scaledSize(34)} color={COLORS.borderDark} />
								<Text style={styles.badgeEmptyText}>
									{filter === 'earned' ? '아직 획득한 뱃지가 없습니다.' : '해당하는 뱃지가 없습니다.'}
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
									<View style={[styles.iconBox, { backgroundColor: isEarned ? rarity.soft : COLORS.surfaceAlt }]}>
										<IconComponent
											name={isEarned ? badge.icon : 'lock'}
											type={isEarned ? badge.iconType : 'materialIcons'}
											size={scaledSize(20)}
											color={isEarned ? rarity.color : COLORS.textLight}
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
											<IconComponent type="materialIcons" name="flag" size={scaledSize(11)} color={COLORS.textLight} />
											<Text style={styles.badgeCondText} numberOfLines={1}>
												{badge.condition}
											</Text>
											<View style={[styles.badgeStatusPill, isEarned ? styles.badgeStatusPillEarned : styles.badgeStatusPillLocked]}>
												<Text style={[styles.badgeStatusPillText, { color: isEarned ? COLORS.primaryDark : COLORS.textLight }]}>
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

const styles = themedStyles(() => StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	badgeModalContent: {
		width: '100%',
		maxWidth: scaleWidth(340),
		maxHeight: '86%',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		alignItems: 'center',
		overflow: 'hidden',
		paddingBottom: SPACING_H.xl,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	badgeModalHeader: {
		width: '100%',
		backgroundColor: COLORS.surfaceAlt,
		paddingTop: SPACING_H.xl,
		paddingBottom: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	badgeModalHeaderIcon: {
		width: scaleWidth(58),
		height: scaleWidth(58),
		borderRadius: scaleWidth(58) / 2,
		backgroundColor: COLORS.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	badgeModalTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.xs,
	},
	badgeModalSubtitle: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		marginBottom: SPACING_H.md,
		fontWeight: '500',
	},
	badgeModalProgressTrack: {
		width: '100%',
		height: scaleHeight(8),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.border,
		overflow: 'hidden',
	},
	badgeModalProgressFill: {
		height: '100%',
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.primary,
	},
	badgeModalPercent: {
		marginTop: SPACING_H.sm,
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		fontWeight: '600',
	},
	badgeFilterRow: {
		flexDirection: 'row',
		columnGap: SPACING_W.sm,
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.lg,
	},
	badgeFilterChip: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		height: scaleHeight(36),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	badgeFilterChipActive: {
		backgroundColor: COLORS.primary,
		borderColor: COLORS.primary,
	},
	badgeFilterChipText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
		color: COLORS.textSecondary,
	},
	badgeFilterChipTextActive: {
		color: COLORS.textWhite,
	},
	badgeList: {
		// scaleHeight(440) 은 상수가 아니라 '화면 높이의 54%' 라 큰 기기에서 목록이 같이 커져
		// 헤더·필터와 합쳐 카드 maxHeight 를 넘었다. 카드가 남겨 준 높이만 쓰게 둔다.
		width: '100%',
		marginTop: SPACING_H.xs,
	},
	badgeListContent: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.lg,
		paddingBottom: SPACING_H.xl,
	},
	badgeEmptyBox: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: SPACING_H.xxxxl,
		rowGap: SPACING_H.md,
	},
	badgeEmptyText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		fontWeight: '500',
	},
	badgeCard: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
	},
	badgeCardActive: {
		backgroundColor: COLORS.primaryBg,
		borderColor: COLORS.primarySoft,
		borderWidth: 1.5,
	},
	iconBox: {
		width: scaleWidth(44),
		height: scaleWidth(44),
		borderRadius: scaleWidth(44) / 2,
		backgroundColor: COLORS.surfaceAlt,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: SPACING_W.md,
	},
	textBox: { flex: 1 },
	badgeRowTop: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm },
	badgeTitle: {
		flexShrink: 1,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.text,
	},
	badgeTitleActive: {
		color: COLORS.textStrong,
	},
	badgeRarityChip: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xxs,
	},
	badgeRarityChipText: { fontSize: FONT_SIZES.xxs, fontWeight: '700' },
	badgeDesc: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.xs,
	},
	badgeDescActive: {
		color: COLORS.text,
	},
	badgeCondRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.xs, marginTop: SPACING_H.sm },
	badgeCondText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.textLight },
	badgeStatusPill: {
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xxs,
	},
	badgeStatusPillEarned: { backgroundColor: COLORS.primarySoft },
	badgeStatusPillLocked: { backgroundColor: COLORS.surfaceAlt },
	badgeStatusPillText: { fontSize: FONT_SIZES.xxs, fontWeight: '700' },
	badgeModalDoneBtn: {
		alignSelf: 'stretch',
		marginHorizontal: SPACING_W.lg,
		marginTop: SPACING_H.md,
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
	badgeModalDoneText: {
		color: COLORS.textWhite,
		fontWeight: '700',
		fontSize: FONT_SIZES.lg,
	},
}));
