/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
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
	quizMode: 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank';
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

	// ✅ 모달 공통 진입 애니메이션 (fade + scale 0.95 → 1)
	const cardFade = useRef(new Animated.Value(0)).current;
	const cardScale = useRef(new Animated.Value(0.95)).current;

	// ✅ 정답 카드 / 해설 카드 등장 애니메이션
	const answerAnim = useRef(new Animated.Value(0)).current;
	const explainAnim = useRef(new Animated.Value(0)).current;

	// ✅ 정답/오답 색상은 시맨틱 토큰으로 통일
	const themeColor = resultType === 'correct' ? COLORS.success : resultType === 'wrong' ? COLORS.danger : COLORS.warning;
	const cardBg = resultType === 'correct' ? COLORS.successBg : resultType === 'wrong' ? COLORS.dangerBg : COLORS.warningBg;
	const cardBorder = resultType === 'correct' ? '#86EFAC' : resultType === 'wrong' ? '#FECACA' : '#FDE68A';
	const subTextColor = resultType === 'correct' ? COLORS.primaryDeep : resultType === 'wrong' ? COLORS.dangerDark : COLORS.warningDark;

	const mascotSource =
		resultType === 'correct'
			? require('@/assets/images/correct_mascote.png')
			: require('@/assets/images/wrong_mascote.png');

	useEffect(() => {
		if (!visible) {
			setToastVisible(false);
			if (toastTimer.current) {
				clearTimeout(toastTimer.current);
			}
			// 닫힐 때 초기화해야 다음 문제에서 열릴 때 첫 프레임이 opacity 0 으로 그려진다(이전 문제 잔상 방지)
			cardFade.setValue(0);
			cardScale.setValue(0.95);
			answerAnim.setValue(0);
			explainAnim.setValue(0);
			return;
		}

		cardFade.setValue(0);
		cardScale.setValue(0.95);
		answerAnim.setValue(0);
		explainAnim.setValue(0);

		// ✅ 카드 진입 → 정답 카드 → 해설 카드 순서로 등장
		const enterAnim = Animated.parallel([
			Animated.timing(cardFade, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(cardScale, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		const contentAnim = Animated.sequence([
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
		]);
		enterAnim.start();
		contentAnim.start();

		// ✅ 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
		return () => {
			enterAnim.stop();
			contentAnim.stop();
		};
	}, [visible, cardFade, cardScale, answerAnim, explainAnim]);

	// ✅ 타이머 정리 (언마운트 시)
	useEffect(() => {
		return () => {
			if (toastTimer.current) {
				clearTimeout(toastTimer.current);
			}
		};
	}, []);

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
	const answerText =
		quizMode === 'meaning'
			? question?.longMeaning
			: quizMode === 'blank'
				? blankWord
				: question?.proverb;

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
				<Animated.View style={[styles.card, { opacity: cardFade, transform: [{ scale: cardScale }] }]}>
					{/* 상단 결과 영역 */}
					<View style={[styles.resultHeader, { backgroundColor: cardBg, borderColor: cardBorder }]}>
						<FastImage source={mascotSource} style={styles.mascot} resizeMode={FastImage.resizeMode.contain} />
						<View style={styles.resultHeaderTextBox}>
							<Text style={[styles.title, { color: themeColor }]}>{resultTitle}</Text>
							<Text style={styles.messageBig}>{resultMessage}</Text>
						</View>

						{/* ✅ 즐겨찾기 버튼 */}
						{question && (
							<TouchableOpacity
								style={[styles.favoriteButton, isFavorited && styles.favoriteButtonActive]}
								activeOpacity={0.8}
								hitSlop={{ top: scaleHeight(6), bottom: scaleHeight(6), left: scaleWidth(6), right: scaleWidth(6) }}
								onPress={handleToggleFavoriteWithToast}>
								<IconComponent
									type="MaterialIcons"
									name={isFavorited ? 'star' : 'star-border'}
									size={scaledSize(22)}
									color={isFavorited ? COLORS.warning : COLORS.textSecondary}
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
								<IconComponent type="MaterialIcons" name="check-circle" size={scaledSize(14)} color={COLORS.textWhite} />
								<Text style={styles.answerBadgeText}>정답</Text>
							</View>

							<Text style={styles.answerMain}>{answerText}</Text>

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
									<IconComponent type="MaterialIcons" name="menu-book" size={scaledSize(14)} color={COLORS.textWhite} />
								</View>
								<Text style={styles.explainTitle}>속담 해설</Text>
							</View>

							{!!question?.longMeaning && (
								<View style={styles.meaningBlock}>
									<Text style={styles.explainLabel}>속담</Text>
									<Text style={styles.proverbInExplain}>{question.proverb}</Text>
									<Text style={styles.explainLabel}>의미</Text>
									<Text style={styles.explainText}>{question.longMeaning}</Text>
								</View>
							)}

							{examples.length > 0 && (
								<View style={styles.exampleBlock}>
									<Text style={[styles.explainLabel, { color: COLORS.secondaryDark }]}>예제</Text>
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

					{/* 하단 버튼 */}
					<TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.8}>
						<Text style={styles.primaryButtonText}>다음 퀴즈</Text>
					</TouchableOpacity>
					<SuccessToast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
				</Animated.View>
			</View>
		</Modal>
	);
};

export default QuizResultModal;

const styles = StyleSheet.create({
	// ===== 모달 공통 껍데기 =====
	overlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(340),
		maxHeight: '86%',
		borderRadius: RADIUS.xl,
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	// ===== 결과 헤더 =====
	resultHeader: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.md,
	},
	resultHeaderTextBox: {
		flex: 1,
		marginLeft: SPACING_W.md,
	},
	title: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		marginBottom: SPACING_H.xs,
	},
	messageBig: {
		fontSize: FONT_SIZES.md,
		fontWeight: '500',
		color: COLORS.text,
		lineHeight: scaledSize(19),
	},
	mascot: {
		width: scaleWidth(56),
		height: scaleWidth(56),
	},
	scroll: {
		width: '100%',
		flexShrink: 1,
	},
	scrollContent: {
		paddingBottom: SPACING_H.xs,
	},
	// ✅ 정답 카드
	answerCard: {
		width: '100%',
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		alignItems: 'center',
	},
	answerBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		borderRadius: RADIUS.round,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.sm,
	},
	answerBadgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
	answerMain: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		color: COLORS.textStrong,
		textAlign: 'center',
		lineHeight: scaledSize(28),
	},
	answerBlankText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		fontWeight: '500',
		marginTop: SPACING_H.sm,
	},
	answerBlankHighlight: {
		fontWeight: '700',
		fontSize: FONT_SIZES.md,
	},
	// ✅ 해설 카드
	explainCard: {
		width: '100%',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginTop: SPACING_H.md,
	},
	explainHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		marginBottom: SPACING_H.md,
	},
	explainHeaderIcon: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: RADIUS.sm,
		alignItems: 'center',
		justifyContent: 'center',
	},
	explainTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	meaningBlock: {
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	explainLabel: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xs,
	},
	proverbInExplain: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textStrong,
		lineHeight: scaledSize(22),
		marginBottom: SPACING_H.sm,
	},
	explainText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		fontWeight: '500',
		lineHeight: scaledSize(21),
	},
	exampleBlock: {
		backgroundColor: COLORS.secondaryBg,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		marginTop: SPACING_H.md,
		borderWidth: 1,
		borderColor: '#BFDBFE',
	},
	explainExampleText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		fontWeight: '400',
		lineHeight: scaledSize(21),
		fontStyle: 'italic',
		marginTop: SPACING_H.xs,
	},
	sameBlock: {
		backgroundColor: '#FAF5FF',
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		marginTop: SPACING_H.md,
		borderWidth: 1,
		borderColor: '#E9D5FF',
	},
	sameText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		fontWeight: '400',
		lineHeight: scaledSize(21),
		marginTop: SPACING_H.xs,
	},
	// ===== 하단 버튼 =====
	primaryButton: {
		width: '100%',
		height: scaleHeight(48),
		marginTop: SPACING_H.xl,
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	primaryButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},
	favoriteButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: scaleWidth(38),
		height: scaleWidth(38),
		borderRadius: scaleWidth(38) / 2,
		borderWidth: 1,
		borderColor: COLORS.borderDark,
		backgroundColor: COLORS.surface,
	},
	favoriteButtonActive: {
		borderColor: COLORS.warning,
		backgroundColor: COLORS.warningBg,
	},
});
