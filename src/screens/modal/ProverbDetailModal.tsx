/* eslint-disable react-native/no-inline-styles */
// ProverbDetailModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import { getCategoryColor, getLevelColor } from '../common/CommonProverbModule';
import FavoriteToast from '../common/FavoriteToast';

type Props = {
	visible: boolean;
	proverb: MainDataType.Proverb | null;
	onClose: () => void;
	onFavoriteChange?: () => void;
};

const LEVEL_NAME_MAP: Record<number, string> = { 1: '아주 쉬움', 2: '쉬움', 3: '보통', 4: '어려움' };
const LEVEL_ICON_MAP: Record<number, string> = { 1: 'seedling', 2: 'leaf', 3: 'tree', 4: 'trophy' };

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

const ProverbDetailModal = ({ visible, proverb, onClose, onFavoriteChange }: Props) => {
	const [showToast, setShowToast] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);
	const [toastMessage, setToastMessage] = useState('');

	useEffect(() => {
		if (visible && proverb) {
			loadFavoriteStatus();
		}
	}, [visible, proverb]);

	if (!proverb) {
		return null;
	}

	const loadFavoriteStatus = async () => {
		if (!proverb) {
			return;
		}
		const favorites = await getFavorites();
		setIsFavorite(favorites.includes(proverb.id));
	};

	const getLevelIcon = (level: number) => {
		const name = LEVEL_ICON_MAP[level];
		return name ? <IconComponent type="FontAwesome6" name={name} size={14} color="#fff" /> : null;
	};

	const handleToggleFavorite = async () => {
		if (!proverb) {
			return;
		}
		const isNowFavorite = await toggleFavorite(proverb.id);
		setIsFavorite(isNowFavorite);
		onFavoriteChange?.();
		if (isNowFavorite) {
			setToastMessage('즐겨찾기 추가!');
			setShowToast(true);
		}
	};

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContainer}>
					{/* 블루 헤더 밴드 */}
					<View style={styles.modalHeader}>
						<TouchableOpacity style={styles.headerFavoriteButton} onPress={handleToggleFavorite} activeOpacity={0.7}>
							<Icon name="star" solid={isFavorite} size={scaledSize(18)} color={isFavorite ? '#FBBF24' : 'rgba(255,255,255,0.55)'} />
						</TouchableOpacity>
						<View style={styles.headerTitleWrap}>
							<Text style={styles.headerTitle} numberOfLines={2}>
								{proverb.proverb}
							</Text>
						</View>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={onClose}>
							<Icon name="xmark" size={scaledSize(20)} color="#fff" />
						</TouchableOpacity>
					</View>

					<ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
						{/* 배지 영역 */}
						<View style={styles.badgeRow}>
							<View style={[styles.levelBadge, { backgroundColor: getLevelColor(proverb.level) }]}>
								{getLevelIcon(proverb.level)}
								<Text style={styles.levelBadgeText}>{LEVEL_NAME_MAP[proverb.level] ?? proverb.levelName}</Text>
							</View>
							<View style={[styles.badge2, { backgroundColor: getCategoryColor(proverb.category) }]}>
								{getFieldIcon(proverb.category)}
								<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>{proverb.category || '미지정'}</Text>
							</View>
						</View>

						{/* 의미 */}
						{Boolean(proverb.longMeaning) && (
							<View style={[styles.modalSection, styles.modalSectionPrimary]}>
								<View style={styles.sectionLabelRow}>
									<View style={[styles.sectionAccent, { backgroundColor: '#3B82F6' }]} />
									<Text style={styles.modalLabel}>의미</Text>
								</View>
								<Text style={styles.modalTextStrong}>{proverb.longMeaning}</Text>
							</View>
						)}

						{/* 예시 */}
						{Array.isArray(proverb.example) && proverb.example.length > 0 && (
							<View style={styles.modalSection}>
								<View style={styles.sectionLabelRow}>
									<View style={[styles.sectionAccent, { backgroundColor: '#22C55E' }]} />
									<Text style={styles.modalLabel}>예시</Text>
								</View>
								{proverb.example.map((ex, idx) => (
									<Text key={idx} style={[styles.modalText2, idx > 0 && { marginTop: scaleHeight(6) }]}>
										• {ex}
									</Text>
								))}
							</View>
						)}

						{/* 유래 */}
						{Boolean(proverb.origin) && (
							<View style={styles.modalSection}>
								<View style={styles.sectionLabelRow}>
									<View style={[styles.sectionAccent, { backgroundColor: '#F59E0B' }]} />
									<Text style={styles.modalLabel}>유래</Text>
								</View>
								<Text style={styles.modalText2}>{proverb.origin}</Text>
							</View>
						)}

						{/* 활용 팁 */}
						{Boolean(proverb.usageTip) && (
							<View style={styles.modalSection}>
								<View style={styles.sectionLabelRow}>
									<View style={[styles.sectionAccent, { backgroundColor: '#14B8A6' }]} />
									<Text style={styles.modalLabel}>활용 팁</Text>
								</View>
								<Text style={styles.modalText2}>{proverb.usageTip}</Text>
							</View>
						)}

						{/* 동의 속담 */}
						{Array.isArray(proverb.sameProverb) && proverb.sameProverb.filter((p) => p.trim()).length > 0 && (
							<View style={styles.modalSection}>
								<View style={styles.sectionLabelRow}>
									<View style={[styles.sectionAccent, { backgroundColor: '#8B5CF6' }]} />
									<Text style={styles.modalLabel}>동의 속담</Text>
								</View>
								<View style={styles.tagsWrapper}>
									{proverb.sameProverb
										.filter((p) => p.trim())
										.map((p, idx) => (
											<View key={idx} style={styles.tagItem}>
												<Text style={styles.tagText}>{p}</Text>
											</View>
										))}
								</View>
							</View>
						)}
					</ScrollView>

					<TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.85}>
						<Text style={styles.modalCloseButtonText}>닫기</Text>
					</TouchableOpacity>
				</View>
				<FavoriteToast visible={showToast} message={toastMessage} onHide={() => setShowToast(false)} bottom={60} />
			</View>
		</Modal>
	);
};

export default ProverbDetailModal;

const styles = StyleSheet.create({
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	modalContainer: { width: '90%', backgroundColor: '#fff', borderRadius: scaleWidth(20), overflow: 'hidden', maxHeight: '85%' },
	modalHeader: { backgroundColor: '#3B82F6', paddingTop: scaleHeight(18), paddingBottom: scaleHeight(16), paddingHorizontal: scaleWidth(16), flexDirection: 'row', alignItems: 'center' },
	headerFavoriteButton: { width: scaleWidth(34), height: scaleWidth(34), borderRadius: scaleWidth(17), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
	headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: scaleWidth(6) },
	headerTitle: { fontSize: scaledSize(18), fontWeight: 'bold', color: '#fff', textAlign: 'center', lineHeight: scaleHeight(24) },
	modalCloseIcon: { width: scaleWidth(34), height: scaleWidth(34), borderRadius: scaleWidth(17), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
	modalBody: { paddingHorizontal: scaleWidth(18), paddingTop: scaleHeight(16), paddingBottom: scaleHeight(18) },
	badgeRow: { flexDirection: 'row', gap: scaleWidth(8), justifyContent: 'center', alignItems: 'center', marginBottom: scaleHeight(16) },
	levelBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: scaleWidth(16), paddingVertical: scaleHeight(5), paddingHorizontal: scaleWidth(12) },
	levelBadgeText: { fontSize: scaledSize(13), color: '#fff', fontWeight: '700', marginLeft: scaleWidth(6) },
	badge2: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(5), borderRadius: scaleWidth(16) },
	badgeText: { color: '#fff', fontSize: scaledSize(12), fontWeight: '700' },
	modalSection: { marginBottom: scaleHeight(12), backgroundColor: '#F8FAFC', paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(14), borderRadius: scaleWidth(14), borderWidth: 1, borderColor: '#EEF2F7' },
	modalSectionPrimary: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
	sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(8) },
	sectionAccent: { width: scaleWidth(4), height: scaledSize(16), borderRadius: scaleWidth(2), marginRight: scaleWidth(8) },
	modalLabel: { fontSize: scaledSize(15), fontWeight: '800', color: '#1E293B' },
	modalTextStrong: { fontSize: scaledSize(16), color: '#1E293B', fontWeight: '700', lineHeight: scaleHeight(25) },
	modalText2: { fontSize: scaledSize(14), color: '#475569', lineHeight: scaleHeight(23) },
	tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(8), marginTop: scaleHeight(2) },
	tagItem: { paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(5), borderRadius: scaleWidth(14), backgroundColor: '#FEF3C7' },
	tagText: { color: '#B45309', fontSize: scaledSize(12), fontWeight: '700' },
	modalCloseButton: { backgroundColor: '#3B82F6', paddingVertical: scaleHeight(15), alignItems: 'center' },
	modalCloseButtonText: { color: '#fff', fontSize: scaledSize(16), fontWeight: 'bold' },
});
