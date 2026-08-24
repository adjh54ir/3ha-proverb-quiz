/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { LEVEL_DATA } from '@/const/ConstInfoData';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { useModalEnter } from '@/hooks/useModalEnter';

interface LevelModalProps {
	visible: boolean;
	totalScore: number;
	onClose: () => void;
}

const LevelModal: React.FC<LevelModalProps> = ({ visible, totalScore, onClose }) => {
	const levelScrollRef = useRef<ScrollView>(null);
	const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 모달 공통 진입 애니메이션 (fade + scale)
	const enterStyle = useModalEnter(visible);

	// 역순 정렬된 데이터
	const reversedLevelData = useMemo(() => [...LEVEL_DATA].reverse(), []);


	/**
	 * 위치에 맞게 스크롤 이동
	 */
	useEffect(() => {
		if (visible && levelScrollRef.current) {
			const currentLevelIndex = reversedLevelData.findIndex((item) => totalScore >= item.score && totalScore < item.next);

			if (currentLevelIndex !== -1) {
				// ✅ 더 긴 딜레이와 정확한 높이 계산
				scrollTimerRef.current = setTimeout(() => {
					// 각 카드의 높이: 마스코트(160) + 패딩 + 텍스트 영역 + 마진
					// 현재 등급 카드는 배지가 있어서 더 높음
					const estimatedCardHeight = scaleHeight(280); // 예상 카드 높이
					const scrollY = currentLevelIndex * estimatedCardHeight;

					levelScrollRef.current?.scrollTo({
						y: scrollY,
						animated: true,
					});
				}, 300); // ✅ 딜레이를 300ms로 증가
			}
		}
		// ✅ 정리: 언마운트/재실행 시 타이머 제거
		return () => {
			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
				scrollTimerRef.current = null;
			}
		};
	}, [visible, totalScore, reversedLevelData]);

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<Animated.View
					style={[styles.levelModal, { maxHeight: scaleHeight(600), ...enterStyle }]}>
					<ModalCloseButton onPress={onClose} />

					<Text style={styles.levelModalTitle}>등급 안내</Text>

					<ScrollView
						ref={levelScrollRef}
						style={{ width: '100%' }}
						contentContainerStyle={styles.levelScrollContent}
						showsVerticalScrollIndicator={false}>
						{reversedLevelData.map((item) => {
							const isCurrent = totalScore >= item.score && totalScore < item.next;
							return (
								<View key={item.label} style={[styles.levelCardBox, isCurrent && styles.levelCardBoxActive]}>
									{isCurrent && (
										<View style={styles.levelBadge}>
											<IconComponent type="fontAwesome6" name="trophy" size={scaledSize(11)} color={COLORS.textWhite} />
											<Text style={styles.levelBadgeText}>현재 등급</Text>
										</View>
									)}
									<FastImage source={item.mascot} style={styles.levelMascot} resizeMode={FastImage.resizeMode.contain} />
									<View style={styles.levelLabelRow}>
										<IconComponent name={item.icon} type="fontAwesome6" size={scaledSize(16)} color={COLORS.primary} />
										<Text style={styles.levelLabel} numberOfLines={1} ellipsizeMode="tail">
											{item.label}
										</Text>
									</View>
									<Text style={styles.levelScore}>{item.score === 0 ? '기본 등급' : `${item.score.toLocaleString()}점 이상`}</Text>
									{isCurrent && <Text style={styles.levelEncourage}>{item.encouragement}</Text>}
									<Text style={styles.levelDetailDescription}>{item.description}</Text>
								</View>
							);
						})}
					</ScrollView>

					<TouchableOpacity onPress={onClose} style={styles.modalConfirmButton} activeOpacity={0.85}>
						<Text style={styles.modalConfirmText}>닫기</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default LevelModal;

const styles = themedStyles(() => StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	levelModal: {
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
	levelModalTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.md,
	},
	levelScrollContent: {
		paddingBottom: SPACING_H.md,
	},
	levelCardBox: {
		width: '100%',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		alignItems: 'center',
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	levelCardBoxActive: {
		backgroundColor: COLORS.primaryBg,
		borderColor: COLORS.primary,
	},
	levelBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		backgroundColor: COLORS.primary,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		marginBottom: SPACING_H.sm,
	},
	levelBadgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
	levelMascot: {
		width: scaleWidth(100),
		height: scaleWidth(100),
		borderRadius: scaleWidth(100) / 2,
		marginBottom: SPACING_H.sm,
	},
	levelLabelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		marginBottom: SPACING_H.xs,
	},
	levelLabel: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	levelScore: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
	},
	levelEncourage: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.primaryDark,
		marginTop: SPACING_H.xs,
		textAlign: 'center',
		lineHeight: scaledSize(20),
	},
	levelDetailDescription: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		textAlign: 'center',
		marginTop: SPACING_H.xs,
		lineHeight: scaledSize(18),
	},
	modalConfirmButton: {
		alignSelf: 'stretch',
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: SPACING_H.lg,
	},
	modalConfirmText: {
		color: COLORS.textWhite,
		fontWeight: '700',
		fontSize: FONT_SIZES.lg,
		textAlign: 'center',
	},
}));
