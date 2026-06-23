/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';
import SuccessToast from '../SuccessToast';

type ResultType = 'correct' | 'wrong' | 'timeout' | 'done' | '';

type Props = {
	visible: boolean;
	resultType: ResultType;
	resultTitle: string;
	resultMessage: string;
	question: MainDataType.Proverb | null;
	quizMode: 'meaning' | 'proverb' | 'blank' | 'example';
	favoriteIds: number[];
	onToggleFavorite: () => Promise<void>;
	blankWord?: string;
	onNext: () => void;
};

const QuizResultModal = ({
	visible,
	resultType,
	resultTitle,
	resultMessage,
	question,
	quizMode,
	blankWord = '',
	favoriteIds,
	onToggleFavorite,
	onNext,
}: Props) => {
	// ✅ Toast 상태
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const toastTimer = useRef<NodeJS.Timeout | null>(null);

	// ✅ 정답 카드 / 해설 카드 등장 애니메이션
	const answerAnim = useRef(new Animated.Value(0)).current;
	const explainAnim = useRef(new Animated.Value(0)).current;

	const themeColor = resultType === 'correct' ? '#22C55E' : resultType === 'wrong' ? '#EF4444' : '#F59E0B';
	const cardBg = resultType === 'correct' ? '#F0FDF4' : resultType === 'wrong' ? '#FEF2F2' : '#FFFBEB';
	const cardBorder = resultType === 'correct' ? '#86EFAC' : resultType === 'wrong' ? '#FECACA' : '#FDE68A';
	const subTextColor = resultType === 'correct' ? '#15803D' : resultType === 'wrong' ? '#DC2626' : '#D97706';

	const mascotSource =
		resultType === 'correct'
			? require('@/assets/images/correct_mascote.png')
			: require('@/assets/images/wrong_mascote.png');

	useEffect(() => {
		if (visible) {
			// ✅ 정답 카드 먼저, 해설은 약간의 딜레이 후 슬라이드 업 + 페이드 인
			answerAnim.setValue(0);
			explainAnim.setValue(0);
			Animated.sequence([
				Animated.timing(answerAnim, {
					toValue: 1,
					duration: 350,
					easing: Easing.out(Easing.back(1.2)),
					useNativeDriver: true,
				}),
				Animated.timing(explainAnim, {
					toValue: 1,
					duration: 400,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true,
				}),
			]).start();
		} else {
			setToastVisible(false);
			if (toastTimer.current) {
				clearTimeout(toastTimer.current);
			}
		}
	}, [visible]);

	// ✅ 즐겨찾기 토글 + Toast (타이머로 자동 숨김)
	const handleToggleFavoriteWithToast = async () => {
		const wasFavorited = question?.id !== undefined && favoriteIds.includes(question.id);
		await onToggleFavorite();

		const msg = wasFavorited ? '즐겨찾기 제거' : '즐겨찾기 추가';
		setToastMessage(msg);
		setToastVisible(true);

		if (toastTimer.current) {
			clearTimeout(toastTimer.current);
		}
		toastTimer.current = setTimeout(() => {
			setToastVisible(false);
		}, 2000);
	};

	const isFavorited = question?.id !== undefined && favoriteIds.includes(question.id);

	const sameProverbs = Array.isArray(question?.sameProverb)
		? question!.sameProverb!.filter((p) => p.trim())
		: [];
	const examples = Array.isArray(question?.example) ? question!.example!.filter((e) => e.trim()) : [];

	if (!visible) {
		return null;
	}

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.overlay}>
				<View style={styles.modal}>
					{/* 상단 결과 영역 */}
					<View style={[styles.resultHeader, { backgroundColor: cardBg }]}>
						<FastImage source={mascotSource} style={styles.mascot} resizeMode={FastImage.resizeMode.contain} />
						<View style={styles.resultHeaderTextBox}>
							<Text style={[styles.title, { color: themeColor }]}>{resultTitle}</Text>
							<Text style={styles.messageBig}>{resultMessage}</Text>
						</View>

						{/* ✅ 즐겨찾기 버튼 */}
						{question && (
							<TouchableOpacity
								style={[styles.favoriteButton, isFavorited && styles.favoriteButtonActive]}
								onPress={handleToggleFavoriteWithToast}>
								<IconComponent
									type="MaterialIcons"
									name={isFavorited ? 'star' : 'star-border'}
									size={scaledSize(22)}
									color={isFavorited ? '#F59E0B' : '#64748B'}
								/>
							</TouchableOpacity>
						)}
					</View>

					<ScrollView
						style={styles.scroll}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}>
						{/* ✅ 정답 카드: 해설 위에 정답이 깔끔하게 표시 */}
						<Animated.View
							style={[
								styles.answerCard,
								{
									backgroundColor: cardBg,
									borderColor: cardBorder,
									opacity: answerAnim,
									transform: [
										{
											translateY: answerAnim.interpolate({
												inputRange: [0, 1],
												outputRange: [scaleHeight(14), 0],
											}),
										},
										{
											scale: answerAnim.interpolate({
												inputRange: [0, 1],
												outputRange: [0.96, 1],
											}),
										},
									],
								},
							]}>
							<View style={[styles.answerBadge, { backgroundColor: themeColor }]}>
								<IconComponent type="MaterialIcons" name="check-circle" size={scaledSize(14)} color="#fff" />
								<Text style={styles.answerBadgeText}>정답</Text>
							</View>

							<Text style={styles.answerMain}>{question?.proverb}</Text>

							{quizMode === 'blank' && !!blankWord && (
								<Text style={styles.answerBlankText}>
									빈칸 정답: <Text style={[styles.answerBlankHighlight, { color: subTextColor }]}>{blankWord}</Text>
								</Text>
							)}
						</Animated.View>

						{/* ✅ 해설 카드: 정답 아래에 애니메이션으로 등장 */}
						<Animated.View
							style={[
								styles.explainCard,
								{
									opacity: explainAnim,
									transform: [
										{
											translateY: explainAnim.interpolate({
												inputRange: [0, 1],
												outputRange: [scaleHeight(18), 0],
											}),
										},
									],
								},
							]}>
							<View style={styles.explainHeader}>
								<View style={[styles.explainHeaderIcon, { backgroundColor: themeColor }]}>
									<IconComponent type="MaterialIcons" name="menu-book" size={scaledSize(14)} color="#fff" />
								</View>
								<Text style={styles.explainTitle}>속담 해설</Text>
							</View>

							{!!question?.longMeaning && (
								<View style={styles.meaningBlock}>
									<Text style={styles.explainLabel}>의미</Text>
									<Text style={styles.explainText}>{question.longMeaning}</Text>
								</View>
							)}

							{examples.length > 0 && (
								<View style={styles.exampleBlock}>
									<Text style={[styles.explainLabel, { color: '#1D4ED8' }]}>예제</Text>
									{examples.map((ex, idx) => (
										<Text key={idx} style={styles.explainExampleText}>
											• {ex}
										</Text>
									))}
								</View>
							)}

							{sameProverbs.length > 0 && (
								<View style={styles.sameBlock}>
									<Text style={[styles.explainLabel, { color: '#9333EA' }]}>동의 속담</Text>
									{sameProverbs.map((p, idx) => (
										<Text key={idx} style={styles.sameText}>
											• {p}
										</Text>
									))}
								</View>
							)}
						</Animated.View>
					</ScrollView>

					<TouchableOpacity
						style={[styles.nextButton, { backgroundColor: themeColor, shadowColor: themeColor }]}
						onPress={onNext}>
						<Text style={styles.nextButtonText}>다음 퀴즈</Text>
					</TouchableOpacity>
					<SuccessToast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
				</View>
			</View>
		</Modal>
	);
};

export default QuizResultModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(15,23,42,0.55)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(40),
	},
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
	resultHeader: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(12),
	},
	resultHeaderTextBox: {
		flex: 1,
		marginLeft: scaleWidth(10),
	},
	title: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginBottom: scaleHeight(2),
	},
	mascot: {
		width: scaleWidth(56),
		height: scaleWidth(56),
	},
	scroll: {
		width: '100%',
		maxHeight: scaleHeight(460),
	},
	scrollContent: {
		paddingBottom: scaleHeight(4),
	},
	messageBig: {
		fontSize: scaledSize(13),
		fontWeight: '600',
		color: '#475569',
		lineHeight: scaleHeight(19),
	},
	// ✅ 정답 카드
	answerCard: {
		width: '100%',
		borderRadius: scaleWidth(14),
		borderWidth: 1.2,
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(14),
		alignItems: 'center',
	},
	answerBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
		borderRadius: scaleWidth(20),
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(10),
	},
	answerBadgeText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: '700',
	},
	answerMain: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#0F172A',
		textAlign: 'center',
		lineHeight: scaleHeight(28),
	},
	answerBlankText: {
		fontSize: scaledSize(13),
		color: '#475569',
		fontWeight: '600',
		marginTop: scaleHeight(8),
	},
	answerBlankHighlight: {
		fontWeight: 'bold',
		fontSize: scaledSize(14),
	},
	// ✅ 해설 카드
	explainCard: {
		width: '100%',
		backgroundColor: '#FFFFFF',
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		padding: scaleWidth(16),
		paddingVertical: scaleHeight(18),
		marginTop: scaleHeight(12),
		minHeight: scaleHeight(120),
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 6,
		elevation: 2,
	},
	explainHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
		marginBottom: scaleHeight(12),
	},
	explainHeaderIcon: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
		justifyContent: 'center',
	},
	explainTitle: {
		fontSize: scaledSize(14),
		fontWeight: '800',
		color: '#1E293B',
	},
	meaningBlock: {
		backgroundColor: '#F0FDF4',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
	},
	explainLabel: {
		fontSize: scaledSize(12),
		fontWeight: '800',
		color: '#15803D',
		marginBottom: scaleHeight(4),
	},
	explainText: {
		fontSize: scaledSize(14),
		color: '#334155',
		fontWeight: '600',
		lineHeight: scaleHeight(21),
	},
	exampleBlock: {
		backgroundColor: '#EFF6FF',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		marginTop: scaleHeight(10),
	},
	explainExampleText: {
		fontSize: scaledSize(14),
		color: '#334155',
		fontWeight: '500',
		lineHeight: scaleHeight(21),
		fontStyle: 'italic',
		marginTop: scaleHeight(2),
	},
	sameBlock: {
		backgroundColor: '#FAF5FF',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		marginTop: scaleHeight(10),
	},
	sameText: {
		fontSize: scaledSize(14),
		color: '#334155',
		fontWeight: '500',
		lineHeight: scaleHeight(21),
		marginTop: scaleHeight(2),
	},
	nextButton: {
		marginTop: scaleHeight(14),
		width: '100%',
		paddingVertical: scaleHeight(13),
		borderRadius: scaleWidth(14),
		alignItems: 'center',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.25,
		shadowRadius: 6,
		elevation: 4,
	},
	nextButtonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '700',
	},
	favoriteButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: scaleWidth(38),
		height: scaleWidth(38),
		borderRadius: scaleWidth(19),
		borderWidth: 1,
		borderColor: '#CBD5E1',
		backgroundColor: '#fff',
	},
	favoriteButtonActive: {
		borderColor: '#F59E0B',
		backgroundColor: '#FFFBEB',
	},
});
