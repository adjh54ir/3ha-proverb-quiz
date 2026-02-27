/* eslint-disable react-native/no-inline-styles */
// ProverbDetailModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import SuccessToast from '../SuccessToast';

type Props = {
	visible: boolean;
	proverb: MainDataType.Proverb | null;
	onClose: () => void;
	onFavoriteChange?: () => void; // ✅ 즐겨찾기 변경 알림 콜백 추가
};

const ProverbDetailModal = ({ visible, proverb, onClose, onFavoriteChange }: Props) => {
	const [showToast, setShowToast] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);
	const [toastMessage, setToastMessage] = useState('');

	// ✅ useEffect를 early return 위로 올림
	useEffect(() => {
		if (visible && proverb) {
			loadFavoriteStatus();
		}
	}, [visible, proverb]);

	// ✅ early return은 모든 Hook 선언 이후에
	if (!proverb) {
		return null;
	}
	// ✅ 즐겨찾기 상태 로드
	const loadFavoriteStatus = async () => {
		if (!proverb) {
			return;
		}
		const favorites = await getFavorites();
		setIsFavorite(favorites.includes(proverb.id));
	};

	const getFieldColor = (field: string) => {
		const categoryColorMap: Record<string, string> = {
			'운/우연': '#00cec9', // 청록
			인간관계: '#6c5ce7', // 보라
			'세상 이치': '#fdcb6e', // 연노랑
			'근면/검소': '#e17055', // 주황
			'노력/성공': '#00b894', // 짙은 청록
			'경계/조심': '#d63031', // 빨강
			'욕심/탐욕': '#e84393', // 핫핑크
			'배신/불신': '#2d3436', // 짙은 회색
		};

		return categoryColorMap[field] || '#b2bec3'; // 기본 회색
	};
	const getLevelColor = (levelName: number) => {
		const levelColorMap: Record<string, string> = {
			1: '#2ecc71',
			2: '#F4D03F',
			3: '#EB984E',
			4: '#E74C3C',
		};

		return levelColorMap[levelName] || '#b2bec3'; // 기본 회색
	};

	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type="FontAwesome6" name="seedling" size={14} color="#fff" />;
			case 2:
				return <IconComponent type="FontAwesome6" name="leaf" size={14} color="#fff" />;
			case 3:
				return <IconComponent type="FontAwesome6" name="tree" size={14} color="#fff" />;
			case 4:
				return <IconComponent type="FontAwesome6" name="trophy" size={14} color="#fff" />;
			default:
				return null;
		}
	};

	const getFieldIcon = (field: string) => {
		switch (field) {
			case '운/우연':
				return <IconComponent type="FontAwesome6" name="dice" size={12} color="#fff" />;
			case '인간관계':
				return <IconComponent type="FontAwesome6" name="users" size={12} color="#fff" />;
			case '세상 이치':
				return <IconComponent type="fontawesome5" name="globe" size={12} color="#fff" />;
			case '근면/검소':
				return <IconComponent type="fontawesome5" name="hammer" size={12} color="#fff" />;
			case '노력/성공':
				return <IconComponent type="fontawesome5" name="medal" size={12} color="#fff" />;
			case '경계/조심':
				return <IconComponent type="fontawesome5" name="exclamation-triangle" size={12} color="#fff" />;
			case '욕심/탐욕':
				return <IconComponent type="fontawesome5" name="hand-holding-usd" size={12} color="#fff" />;
			case '배신/불신':
				return <IconComponent type="fontawesome5" name="user-slash" size={12} color="#fff" />;
			default:
				return <IconComponent type="FontAwesome6" name="tag" size={12} color="#fff" />;
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

		if (isNowFavorite) {
			setToastMessage('즐겨찾기 추가!');
			setShowToast(true);
		}
	};

	return (
		<>
			<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<SuccessToast visible={showToast} message={toastMessage} onHide={() => setShowToast(false)} />
						{/* ───────────── 헤더 (그대로 유지) ───────────── */}
						<View style={styles.modalHeader}>
							<Text style={styles.modalHeaderTitle}>속담 상세</Text>
							<TouchableOpacity style={styles.modalCloseIcon} onPress={onClose}>
								<Icon name="xmark" size={20} color="#0984e3" />
							</TouchableOpacity>
						</View>

						<ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
							{/* 배지 영역 */}
							<View style={styles.badgeRow}>
								<View
									style={[
										styles.badge,
										{
											backgroundColor: getLevelColor(proverb.level),
											flexDirection: 'row',
											alignItems: 'center',
											paddingHorizontal: scaleWidth(8),
											paddingVertical: scaleHeight(4),
										},
									]}>
									{getLevelIcon(proverb.level)}
									<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>
										{{ 1: '아주 쉬움', 2: '쉬움', 3: '보통', 4: '어려움' }[proverb.level] || '알 수 없음'}
									</Text>
								</View>
								<View
									style={[
										styles.badge2,
										{
											backgroundColor: getFieldColor(proverb.category),
											flexDirection: 'row',
											alignItems: 'center',
											paddingHorizontal: scaleWidth(8),
										},
									]}>
									{getFieldIcon(proverb.category)}
									<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>{proverb.category || '미지정'}</Text>
								</View>
							</View>

							{/* 속담 본문 강조 박스 */}
							<Text style={styles.modalProverbText}>{proverb.proverb}</Text>

							<TouchableOpacity style={styles.favoriteIconButton} onPress={handleToggleFavorite} activeOpacity={0.7}>
								<Icon
									name={isFavorite ? 'star' : 'star'}
									solid={isFavorite}
									size={20} // 28 → 20
									color={isFavorite ? '#FFD700' : '#ccc'}
								/>
							</TouchableOpacity>

							{/* 의미 */}
							{Boolean(proverb.longMeaning) && (
								<View style={styles.meaningHighlight}>
									<View style={styles.meaningQuoteBox}>
										<Icon name="quote-left" size={28} color="#58D68D" style={{ marginBottom: scaleHeight(8) }} />
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

							{/* 비슷한 속담 */}
							{Array.isArray(proverb.sameProverb) && proverb.sameProverb.filter((p) => p.trim()).length > 0 && (
								<View style={styles.sectionBox}>
									<Text style={styles.sectionTitle}>🔗 비슷한 속담</Text>
									{proverb.sameProverb.map((p, idx) => (
										<View key={idx} style={styles.sameProverbBox}>
											<Text style={styles.sameProverbText}>• {p}</Text>
										</View>
									))}
								</View>
							)}
						</ScrollView>

						{/* 닫기 버튼 */}
						<TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
							<Text style={styles.modalCloseButtonText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			<SuccessToast visible={showToast} message={toastMessage} onHide={() => setShowToast(false)} />
		</>
	);
};

export default ProverbDetailModal;

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		width: '90%',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		overflow: 'hidden',
		maxHeight: '85%',
	},

	/* ✅ 헤더는 기존 스타일 유지 */
	modalHeader: {
		backgroundColor: '#fff',
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	modalHeaderTitle: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		color: '#2d3436',
		textAlign: 'center',
	},
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(16),
		right: scaleWidth(16),
		padding: scaleWidth(4),
		zIndex: 10,
	},

	/* ✅ 본문 스타일 개선 */
	modalBody: {
		paddingHorizontal: scaleWidth(16),
		paddingTop: scaleHeight(8),
		paddingBottom: scaleHeight(20),
	},

	badgeRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: scaleWidth(8),
		justifyContent: 'center',
		marginBottom: scaleHeight(16),
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(14),
	},
	badgeText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: '600',
	},

	highlightSection: {
		borderWidth: 1.5,
		borderColor: '#A5D8FF',
		backgroundColor: '#EAF4FF',
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(14),
		borderRadius: scaleWidth(14),
		marginBottom: scaleHeight(16),
		alignItems: 'center',
	},
	modalProverbText: {
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#1E6BB8', // 파란색 강조
		textAlign: 'center',
		lineHeight: scaleHeight(28),
		marginBottom: scaleHeight(16), // 아래 요소와 간격만 추가
	},

	sectionBox: {
		borderWidth: 1,
		borderColor: '#E6EEF5',
		backgroundColor: '#FDFEFE',
		padding: scaleWidth(12),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	sectionTitle: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},
	sectionText: {
		fontSize: scaledSize(14),
		color: '#444',
		lineHeight: scaleHeight(20),
	},
	exampleText: {
		fontSize: scaledSize(13),
		color: '#555',
		lineHeight: 20,
		backgroundColor: '#FAFAFA',
		padding: scaleWidth(6),
		borderRadius: scaleWidth(8),
	},

	/* ✅ 닫기 버튼 */
	modalCloseButton: {
		backgroundColor: '#0984e3',
		paddingVertical: scaleHeight(14),
		alignItems: 'center',
		borderBottomLeftRadius: scaleWidth(20),
		borderBottomRightRadius: scaleWidth(20),
	},
	modalCloseButtonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	meaningHighlight: {
		borderWidth: 1.5,
		borderColor: '#A5D8FF',
		backgroundColor: '#EAF4FF',
		padding: scaleWidth(14),
		borderRadius: scaleWidth(14),
		marginBottom: scaleHeight(16),
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	meaningQuoteBox: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	meaningQuoteText: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		textAlign: 'center',
	},
	badge2: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		backgroundColor: '#f1f2f6',
	},
	sameProverbBox: {
		backgroundColor: '#FAFAFA',
		borderWidth: 1,
		borderColor: '#E6EEF5',
		padding: scaleWidth(8),
		borderRadius: scaleWidth(8),
		marginBottom: scaleHeight(6),
	},
	sameProverbText: {
		fontSize: scaledSize(13),
		padding: scaleWidth(6),
		color: '#444',
		lineHeight: scaleHeight(20),
	},
	favoriteIconButton: {
		alignSelf: 'center',
		padding: scaleWidth(10), // 12 → 10
		marginBottom: scaleHeight(8),
		borderRadius: scaleWidth(50),
		backgroundColor: '#f8f9fa',
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
});
