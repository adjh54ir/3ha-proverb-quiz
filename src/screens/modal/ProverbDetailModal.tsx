// ProverbDetailModal.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { getCategoryColor, getLevelColorByNumber } from '@/screens/common/CommonProverbModule';

/** 레벨 번호 → 난이도 이름 (공통 난이도 램프 조회용) */
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import SuccessToast from '../SuccessToast';
import { useModalEnter } from '@/hooks/useModalEnter';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';

type Props = {
	visible: boolean;
	proverb: MainDataType.Proverb | null;
	onClose: () => void;
	onFavoriteChange?: () => void; // ✅ 즐겨찾기 변경 알림 콜백 추가
};

const ProverbDetailModal = ({ visible, proverb, onClose, onFavoriteChange }: Props) => {
	// AppModal 이 시스템 바까지 덮으므로 오버레이가 직접 안전 여백을 준다.
	const safePadding = useModalSafePadding();
	const [showToast, setShowToast] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastSubMessage, setToastSubMessage] = useState('');
	// 모달 공통 진입 애니메이션 (fade + scale)
	const enterStyle = useModalEnter(visible);

	// ✅ 즐겨찾기 상태 로드 (early return 위에서 선언해야 아래 useEffect 가 안전하게 참조한다)
	const loadFavoriteStatus = useCallback(async () => {
		if (!proverb) {
			return;
		}
		const favorites = await getFavorites();
		setIsFavorite(favorites.includes(proverb.id));
	}, [proverb]);

	// ✅ useEffect를 early return 위로 올림
	useEffect(() => {
		if (visible && proverb) {
			loadFavoriteStatus();
		}
	}, [visible, proverb, loadFavoriteStatus]);

	// ✅ early return은 모든 Hook 선언 이후에
	if (!proverb) {
		return null;
	}

	// 카테고리/난이도 색 — 공통 팔레트(CommonProverbModule) 단일 소스 사용
	const getFieldColor = (field: string) => getCategoryColor(field);
	const getLevelColor = getLevelColorByNumber;

	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 2:
				return <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 3:
				return <IconComponent type="FontAwesome6" name="tree" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 4:
				return <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(14)} color={COLORS.textWhite} />;
			default:
				return null;
		}
	};

	const getFieldIcon = (field: string) => {
		switch (field) {
			case '운/우연':
				return <IconComponent type="FontAwesome6" name="dice" size={scaledSize(12)} color={COLORS.textWhite} />;
			case '인간관계':
				return <IconComponent type="FontAwesome6" name="users" size={scaledSize(12)} color={COLORS.textWhite} />;
			case '세상 이치':
				return <IconComponent type="fontawesome5" name="globe" size={scaledSize(12)} color={COLORS.textWhite} />;
			case '근면/검소':
				return <IconComponent type="fontawesome5" name="hammer" size={scaledSize(12)} color={COLORS.textWhite} />;
			case '노력/성공':
				return <IconComponent type="fontawesome5" name="medal" size={scaledSize(12)} color={COLORS.textWhite} />;
			case '경계/조심':
				return <IconComponent type="fontawesome5" name="exclamation-triangle" size={scaledSize(12)} color={COLORS.textWhite} />;
			case '욕심/탐욕':
				return <IconComponent type="fontawesome5" name="hand-holding-usd" size={scaledSize(12)} color={COLORS.textWhite} />;
			case '배신/불신':
				return <IconComponent type="fontawesome5" name="user-slash" size={scaledSize(12)} color={COLORS.textWhite} />;
			default:
				return <IconComponent type="FontAwesome6" name="tag" size={scaledSize(12)} color={COLORS.textWhite} />;
		}
	};
	const handleToggleFavorite = async () => {
		if (!proverb) {
			return;
		}
		const isNowFavorite = await toggleFavorite(proverb.id);

		// 즐겨찾기 상태 즉시 업데이트
		setIsFavorite(isNowFavorite);

		// ✅ 부모에게 즐겨찾기 변경 알림
		onFavoriteChange?.();

		// 추가/해제 양쪽 모두 토스트로 알린다.
		setToastMessage(isNowFavorite ? '즐겨찾기 추가' : '즐겨찾기 해제');
		setToastSubMessage(isNowFavorite ? '속담 사전에서 확인 할 수 있습니다.' : '즐겨찾기 목록에서 제거되었습니다.');
		setShowToast(true);
	};

	return (
		<Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
			<View style={[styles.modalOverlay, safePadding]}>
				<Animated.View style={[styles.modalContainer, enterStyle]}>
					{/* ───────────── 헤더 ───────────── */}
					<View style={styles.modalHeader}>
						<Text style={styles.modalHeaderTitle}>속담 상세</Text>
						<ModalCloseButton onPress={onClose} color={COLORS.textSecondary} />
					</View>

					<ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
						{/* 배지 영역 */}
						<View style={styles.badgeRow}>
							<View style={[styles.badge, { backgroundColor: getLevelColor(proverb.level) }]}>
								{getLevelIcon(proverb.level)}
								<Text style={styles.badgeText}>
									{{ 1: '초급', 2: '중급', 3: '고급', 4: '특급' }[proverb.level] || '알 수 없음'}
								</Text>
							</View>
							<View style={[styles.badge, { backgroundColor: getFieldColor(proverb.category) }]}>
								{getFieldIcon(proverb.category)}
								<Text style={styles.badgeText}>{proverb.category || '미지정'}</Text>
							</View>
						</View>

						{/* 속담 본문 강조 박스 */}
						<Text style={styles.modalProverbText}>{proverb.proverb}</Text>

						<TouchableOpacity
							style={styles.favoriteIconButton}
							onPress={handleToggleFavorite}
							activeOpacity={0.7}
							hitSlop={HIT_SLOP}>
							<Icon name="star" solid={isFavorite} size={scaledSize(20)} color={isFavorite ? COLORS.gold : COLORS.borderDark} />
						</TouchableOpacity>

						{/* 의미 */}
						{Boolean(proverb.longMeaning) && (
							<View style={styles.meaningHighlight}>
								<View style={styles.meaningQuoteBox}>
									<Icon name="quote-left" size={scaledSize(28)} color={COLORS.primary} style={styles.meaningQuoteIcon} />
									<Text style={styles.meaningQuoteText}>{proverb.longMeaning}</Text>
								</View>
							</View>
						)}

						{/* 예시 */}
						{Array.isArray(proverb.example) && proverb.example.length > 0 && (
							<View style={styles.sectionBox}>
								<Text style={styles.sectionTitle}>✍️ 예시</Text>
								{proverb.example.map((ex, idx) => (
									<View key={idx} style={styles.sameProverbBox}>
										<Text key={idx} style={styles.exampleText}>
											• {ex}
										</Text>
									</View>
								))}
							</View>
						)}

						{Array.isArray(proverb.sameProverb) && proverb.sameProverb.filter((p) => p.trim()).length > 0 && (
							<View style={styles.sectionBox}>
								<Text style={styles.sectionTitle}>💬 동의 속담</Text>
								{proverb.sameProverb.map((p, idx) => (
									<View key={idx} style={styles.sameProverbBox}>
										<Text style={styles.sameProverbText}>• {p}</Text>
									</View>
								))}
							</View>
						)}
					</ScrollView>

					{/* 닫기 버튼 */}
					<View style={styles.modalFooter}>
						<TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.85}>
							<Text style={styles.modalCloseButtonText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>
				{/* 토스트는 Modal 안 + overflow:hidden 카드 밖에 둔다. 카드 안이면 잘리고, Modal 밖이면 모달에 가려진다. */}
				<SuccessToast visible={showToast} message={toastMessage} subMessage={toastSubMessage} onHide={() => setShowToast(false)} />
			</View>
		</Modal>
	);
};

export default ProverbDetailModal;

const styles = themedStyles(() => StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	modalContainer: {
		width: '100%',
		maxWidth: scaleWidth(340),
		maxHeight: '85%',
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		overflow: 'hidden',
	},

	modalHeader: {
		backgroundColor: COLORS.surface,
		paddingTop: SPACING_H.xl,
		paddingBottom: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	modalHeaderTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		textAlign: 'center',
	},

	/* ✅ 본문 스타일 개선 */
	modalBody: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.sm,
		paddingBottom: SPACING_H.xl,
	},

	badgeRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		columnGap: SPACING_W.sm,
		rowGap: SPACING_H.sm,
		justifyContent: 'center',
		marginBottom: SPACING_H.lg,
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	badgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
	},

	modalProverbText: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		color: COLORS.secondaryDark, // 파란색 강조
		textAlign: 'center',
		lineHeight: scaledSize(28),
		marginBottom: SPACING_H.md,
	},

	sectionBox: {
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.md,
	},
	sectionTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.md,
	},
	exampleText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(20),
	},

	/* ✅ 닫기 버튼 */
	modalFooter: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.sm,
		paddingBottom: SPACING_H.xl,
	},
	modalCloseButton: {
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalCloseButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},
	meaningHighlight: {
		borderWidth: 1.5,
		borderColor: COLORS.secondarySoft,
		backgroundColor: COLORS.secondaryBg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.lg,
	},
	meaningQuoteBox: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	meaningQuoteIcon: {
		marginBottom: SPACING_H.sm,
	},
	meaningQuoteText: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '600',
		color: COLORS.textStrong,
		lineHeight: scaledSize(22),
		textAlign: 'center',
	},
	sameProverbBox: {
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.sm,
		marginBottom: SPACING_H.sm,
	},
	sameProverbText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(20),
	},
	favoriteIconButton: {
		alignSelf: 'center',
		width: scaleWidth(44),
		height: scaleWidth(44),
		borderRadius: scaleWidth(44) / 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.lg,
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
}));
