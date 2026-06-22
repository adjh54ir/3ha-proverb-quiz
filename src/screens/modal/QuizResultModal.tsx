/* eslint-disable react-native/no-inline-styles */
import { MainDataType } from '@/types/MainDataType';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import IconComponent from '../common/atomic/IconComponent';
import FavoriteToast from '../common/FavoriteToast';

interface QuizResultModalProps {
	visible: boolean;
	resultType: 'correct' | 'wrong' | 'timeout' | 'done' | '';
	resultTitle: string;
	resultMessage: string;
	quizMode: 'meaning' | 'proverb' | 'blank' | 'example';
	question: MainDataType.Proverb | null;
	favoriteIds: number[];
	onToggleFavorite: () => Promise<void>;
	onNext: () => void;
}

const QuizResultModal = ({ visible, resultType, resultTitle, resultMessage, quizMode, favoriteIds, onToggleFavorite, question, onNext }: QuizResultModalProps) => {
	const navigation = useNavigation();

	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const toastTimer = useRef<NodeJS.Timeout | null>(null);

	// 정답 카드 / 해설 카드 등장 애니메이션
	const answerAnim = useRef(new Animated.Value(0)).current;
	const explainAnim = useRef(new Animated.Value(0)).current;

	const isResult = resultType === 'correct' || resultType === 'wrong' || resultType === 'timeout';
	const themeColor = resultType === 'correct' ? '#22C55E' : resultType === 'wrong' ? '#EF4444' : '#F59E0B';
	const cardBg = resultType === 'correct' ? '#F0FDF4' : resultType === 'wrong' ? '#FEF2F2' : '#FFFBEB';
	const cardBorder = resultType === 'correct' ? '#86EFAC' : resultType === 'wrong' ? '#FECACA' : '#FDE68A';
	const subTextColor = resultType === 'correct' ? '#15803D' : resultType === 'wrong' ? '#DC2626' : '#D97706';

	const mascotSource =
		resultType === 'correct'
			? require('@/assets/images/correct_mascote.png')
			: require('@/assets/images/wrong_mascote.png');

	useEffect(() => {
		if (visible && isResult) {
			answerAnim.setValue(0);
			explainAnim.setValue(0);
			Animated.sequence([
				Animated.timing(answerAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
				Animated.timing(explainAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
			]).start();
		} else if (!visible) {
			setToastVisible(false);
			if (toastTimer.current) {
				clearTimeout(toastTimer.current);
			}
		}
	}, [visible, resultType]);

	const handleToggleFavoriteWithToast = async () => {
		const wasFavorited = question?.id !== undefined && favoriteIds.includes(question.id);
		await onToggleFavorite();
		setToastMessage(wasFavorited ? '즐겨찾기 제거' : '즐겨찾기 추가');
		setToastVisible(true);
		if (toastTimer.current) {
			clearTimeout(toastTimer.current);
		}
		toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
	};

	if (!visible) {
		return null;
	}

	const isFavorited = question?.id !== undefined && favoriteIds.includes(question.id);

	// ── 완료(done) 화면: 기존 구조 유지 ──
	if (resultType === 'done') {
		return (
			<Modal visible transparent animationType="fade">
				<View style={styles.overlay}>
					<View style={[styles.modal, styles.resultModalDone]}>
						<FastImage source={require('@/assets/images/mascote_done.png')} style={{ width: scaleWidth(150), height: scaleWidth(150) }} resizeMode={FastImage.resizeMode.contain} />
						<Text style={styles.doneTitle}>모든 퀴즈 완료!</Text>
						<Text style={styles.doneSubtitle}>수고했어요 👏</Text>
						<View style={styles.doneStatsCard}>
							<Text style={styles.doneStatsLabel}>이번 세션</Text>
							<Text style={styles.doneStatsValue}>{resultMessage}</Text>
						</View>
						<Text style={styles.doneMessage}>완벽한 속담 퀴즈 마스터!{'\n'}정말 대단해요 🌟</Text>
						<TouchableOpacity style={styles.donePrimaryButton} onPress={() => navigation.goBack()}>
							<Text style={styles.donePrimaryButtonText}>홈으로 가기</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={onNext} style={styles.doneSecondaryTouch}>
							<Text style={styles.doneSecondaryText}>다시 풀기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		);
	}

	return (
		<Modal visible transparent animationType="fade">
			<View style={styles.overlay}>
				<View style={styles.modal}>
					{/* 상단 결과 헤더 밴드: 마스코트 + 제목/메시지 + 즐겨찾기 */}
					<View style={[styles.resultHeader, { backgroundColor: cardBg }]}>
						<FastImage source={mascotSource} style={styles.mascot} resizeMode={FastImage.resizeMode.contain} />
						<View style={styles.resultHeaderTextBox}>
							<Text style={[styles.title, { color: themeColor }]}>{resultTitle}</Text>
							<Text style={styles.messageBig}>{resultMessage}</Text>
						</View>
						{question && (
							<TouchableOpacity style={[styles.favoriteButton, isFavorited && styles.favoriteButtonActive]} onPress={handleToggleFavoriteWithToast}>
								<IconComponent type="MaterialIcons" name={isFavorited ? 'star' : 'star-border'} size={scaledSize(22)} color={isFavorited ? '#F59E0B' : '#64748B'} />
							</TouchableOpacity>
						)}
					</View>

					<ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
						{/* 정답 카드 */}
						<Animated.View
							style={[
								styles.answerCard,
								{
									backgroundColor: cardBg,
									borderColor: cardBorder,
									opacity: answerAnim,
									transform: [
										{ translateY: answerAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(14), 0] }) },
										{ scale: answerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
									],
								},
							]}>
							<View style={[styles.answerBadge, { backgroundColor: themeColor }]}>
								<IconComponent type="MaterialIcons" name="check-circle" size={scaledSize(14)} color="#fff" />
								<Text style={styles.answerBadgeText}>정답</Text>
							</View>

							{quizMode === 'meaning' ? (
								<>
									<Text style={[styles.answerSub, { color: subTextColor }]}>{question?.proverb}</Text>
									<Text style={styles.answerMain}>{question?.longMeaning}</Text>
								</>
							) : (
								<Text style={styles.answerMain}>{question?.proverb}</Text>
							)}
						</Animated.View>

						{/* 해설 카드 */}
						<Animated.View
							style={[
								styles.explainCard,
								{
									opacity: explainAnim,
									transform: [{ translateY: explainAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(18), 0] }) }],
								},
							]}>
							<View style={styles.explainHeader}>
								<View style={[styles.explainHeaderIcon, { backgroundColor: themeColor }]}>
									<IconComponent type="MaterialIcons" name="menu-book" size={scaledSize(14)} color="#fff" />
								</View>
								<Text style={styles.explainTitle}>속담 해설</Text>
							</View>

							{Boolean(question?.longMeaning) && (
								<View style={styles.meaningBlock}>
									<Text style={styles.explainLabel}>의미</Text>
									<Text style={styles.explainText}>{question?.longMeaning}</Text>
								</View>
							)}

							{Array.isArray(question?.example) && (question?.example.length ?? 0) > 0 && (
								<View style={styles.exampleBlock}>
									<Text style={[styles.explainLabel, { color: '#1D4ED8' }]}>예제</Text>
									{question!.example.map((ex, idx) => (
										<Text key={idx} style={[styles.explainExampleText, idx > 0 && { marginTop: scaleHeight(6) }]}>
											{ex}
										</Text>
									))}
								</View>
							)}

							{Array.isArray(question?.sameProverb) && (question?.sameProverb?.filter((p) => p.trim()).length ?? 0) > 0 && (
								<View style={styles.sameBlock}>
									<Text style={[styles.explainLabel, { color: '#B45309' }]}>동의 속담</Text>
									<View style={styles.tagsWrapper}>
										{question!.sameProverb!
											.filter((p) => p.trim())
											.map((p, idx) => (
												<View key={idx} style={styles.tagItem}>
													<Text style={styles.tagText}>{p}</Text>
												</View>
											))}
									</View>
								</View>
							)}
						</Animated.View>
					</ScrollView>

					<TouchableOpacity style={[styles.nextButton, { backgroundColor: themeColor, shadowColor: themeColor }]} onPress={onNext} activeOpacity={0.85}>
						<Text style={styles.nextButtonText}>다음 퀴즈</Text>
					</TouchableOpacity>
					<FavoriteToast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} bottom={60} />
				</View>
			</View>
		</Modal>
	);
};

export default QuizResultModal;

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scaleWidth(20), paddingTop: scaleHeight(40) },
	modal: {
		width: '100%',
		maxWidth: scaleWidth(380),
		borderRadius: scaleWidth(20),
		backgroundColor: '#fff',
		padding: scaleWidth(16),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	resultHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', borderRadius: scaleWidth(14), paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(12), marginBottom: scaleHeight(12) },
	resultHeaderTextBox: { flex: 1, marginLeft: scaleWidth(10) },
	title: { fontSize: scaledSize(18), fontWeight: 'bold', marginBottom: scaleHeight(2) },
	mascot: { width: scaleWidth(56), height: scaleWidth(56) },
	messageBig: { fontSize: scaledSize(13), fontWeight: '600', color: '#475569', lineHeight: scaleHeight(19) },
	scroll: { width: '100%', maxHeight: scaleHeight(460) },
	scrollContent: { paddingBottom: scaleHeight(4) },
	answerCard: { width: '100%', borderRadius: scaleWidth(14), borderWidth: 1.2, paddingVertical: scaleHeight(16), paddingHorizontal: scaleWidth(14), alignItems: 'center' },
	answerBadge: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4), borderRadius: scaleWidth(20), paddingVertical: scaleHeight(4), paddingHorizontal: scaleWidth(12), marginBottom: scaleHeight(10) },
	answerBadgeText: { color: '#fff', fontSize: scaledSize(12), fontWeight: '700' },
	answerMain: { fontSize: scaledSize(20), fontWeight: 'bold', color: '#0F172A', textAlign: 'center', lineHeight: scaleHeight(28) },
	answerSub: { fontSize: scaledSize(14), fontWeight: '600', textAlign: 'center', marginBottom: scaleHeight(6) },
	explainCard: {
		width: '100%',
		backgroundColor: '#FFFFFF',
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		padding: scaleWidth(16),
		paddingVertical: scaleHeight(18),
		marginTop: scaleHeight(12),
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 6,
		elevation: 2,
	},
	explainHeader: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8), marginBottom: scaleHeight(12) },
	explainHeaderIcon: { width: scaleWidth(24), height: scaleWidth(24), borderRadius: scaleWidth(8), alignItems: 'center', justifyContent: 'center' },
	explainTitle: { fontSize: scaledSize(14), fontWeight: '800', color: '#1E293B' },
	meaningBlock: { backgroundColor: '#F0FDF4', borderRadius: scaleWidth(12), paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(12) },
	explainLabel: { fontSize: scaledSize(12), fontWeight: '800', color: '#15803D', marginBottom: scaleHeight(4) },
	explainText: { fontSize: scaledSize(14), color: '#334155', fontWeight: '600', lineHeight: scaleHeight(21) },
	exampleBlock: { backgroundColor: '#EFF6FF', borderRadius: scaleWidth(12), paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(12), marginTop: scaleHeight(10) },
	explainExampleText: { fontSize: scaledSize(14), color: '#334155', fontWeight: '500', lineHeight: scaleHeight(21), fontStyle: 'italic' },
	sameBlock: { backgroundColor: '#FFFBEB', borderRadius: scaleWidth(12), paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(12), marginTop: scaleHeight(10) },
	tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(8), marginTop: scaleHeight(2) },
	tagItem: { paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(5), borderRadius: scaleWidth(14), backgroundColor: '#FEF3C7' },
	tagText: { color: '#B45309', fontSize: scaledSize(12), fontWeight: '700' },
	nextButton: { marginTop: scaleHeight(14), width: '100%', paddingVertical: scaleHeight(13), borderRadius: scaleWidth(14), alignItems: 'center', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
	nextButtonText: { color: '#fff', fontSize: scaledSize(15), fontWeight: '700' },
	favoriteButton: { alignItems: 'center', justifyContent: 'center', width: scaleWidth(38), height: scaleWidth(38), borderRadius: scaleWidth(19), borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#fff' },
	favoriteButtonActive: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
	// ── 완료(done) 화면 ──
	resultModalDone: { backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#f59e0b', paddingVertical: scaleHeight(28), paddingHorizontal: scaleWidth(28) },
	doneTitle: { fontSize: scaledSize(24), fontWeight: '800', color: '#1f2937', marginTop: scaleHeight(8), marginBottom: scaleHeight(4) },
	doneSubtitle: { fontSize: scaledSize(16), color: '#6b7280', marginBottom: scaleHeight(16) },
	doneStatsCard: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: scaleWidth(12), paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(20), marginBottom: scaleHeight(16), borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', alignItems: 'center', minWidth: '70%' },
	doneStatsLabel: { fontSize: scaledSize(12), color: '#9ca3af', marginBottom: scaleHeight(4), fontWeight: '600' },
	doneStatsValue: { fontSize: scaledSize(16), fontWeight: '800', color: '#1f2937', textAlign: 'center' },
	doneMessage: { fontSize: scaledSize(15), color: '#4b5563', textAlign: 'center', lineHeight: scaleHeight(24), marginBottom: scaleHeight(20) },
	donePrimaryButton: { backgroundColor: '#f59e0b', paddingVertical: scaleHeight(14), paddingHorizontal: scaleWidth(32), borderRadius: scaleWidth(28), width: '100%', alignItems: 'center', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6 },
	donePrimaryButtonText: { color: '#fff', fontSize: scaledSize(16), fontWeight: '700' },
	doneSecondaryTouch: { marginTop: scaleHeight(14), paddingVertical: scaleHeight(8), paddingHorizontal: scaleWidth(16) },
	doneSecondaryText: { fontSize: scaledSize(14), color: '#6b7280', fontWeight: '600', textDecorationLine: 'underline' },
});
