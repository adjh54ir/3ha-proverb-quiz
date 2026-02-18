/* eslint-disable react/no-unstable-nested-components */
import { Paths } from '@/navigation/conf/Paths';
import { MainDataType } from '@/types/MainDataType';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import * as Animatable from 'react-native-animatable';

// ✅ QuizResultModal.tsx
interface QuizResultModalProps {
	visible: boolean;
	resultType: 'correct' | 'wrong' | 'timeout' | 'done' | '';
	resultTitle: string;
	resultMessage: string;
	quizMode: 'meaning' | 'proverb' | 'blank';
	question: MainDataType.Proverb | null;
	onNext: () => void;
}

const QuizResultModal = ({ visible, resultType, resultTitle, resultMessage, quizMode, question, onNext }: QuizResultModalProps) => {
	const navigation = useNavigation();

	const [shouldAnimate, setShouldAnimate] = useState(false);
	const [closing, setClosing] = useState(false);

	const hasAnimated = useRef(false);

	useEffect(() => {
		if (visible && !hasAnimated.current) {
			setShouldAnimate(true);
			hasAnimated.current = true;
		}
	}, [visible]);

	useEffect(() => {
		if (!visible) {
			hasAnimated.current = false;
			setShouldAnimate(false);
			setClosing(false);
		}
	}, [visible]);

	const ProverbInfoCard = ({
		question,
		highlightColor = '#27ae60',
		backgroundColor = '#eafaf1',
	}: {
		question: MainDataType.Proverb | null;
		highlightColor?: string;
		backgroundColor?: string;
	}) => {
		if (!question) {
			return null;
		}

		return (
			<View style={[styles.infoCard, { backgroundColor, borderColor: highlightColor }]}>
				<Text style={[styles.infoSectionTitle, { color: highlightColor }]}>📖 속담 해설</Text>

				{quizMode === 'proverb' || quizMode === 'blank' ? (
					shouldAnimate && !closing ? (
						<Animatable.View animation="fadeInUp" duration={800} delay={300} onAnimationEnd={() => setShouldAnimate(false)}>
							<Text style={styles.modalProverbText}>{question.proverb}</Text>
						</Animatable.View>
					) : (
						<Text style={styles.modalProverbText}>{question.proverb}</Text>
					)
				) : (
					<Text style={styles.modalProverbText}>{question.proverb}</Text>
				)}

				{Boolean(question.longMeaning) && (
					<View style={styles.meaningHighlight}>
						{quizMode === 'meaning' && shouldAnimate && !closing ? (
							<Animatable.View
								animation="fadeInUp"
								duration={800}
								delay={300}
								onAnimationEnd={() => {
									setShouldAnimate(false);
									setClosing(true);
									setTimeout(() => setClosing(false), 100);
								}}>
								<View style={styles.meaningQuoteBox}>
									<Icon name="quote-left" size={28} color="#58D68D" style={{ marginBottom: scaleHeight(8) }} />
									<Text style={styles.meaningQuoteText}>{question.longMeaning}</Text>
								</View>
							</Animatable.View>
						) : (
							<View style={styles.meaningQuoteBox}>
								<Icon name="quote-left" size={28} color="#58D68D" style={{ marginBottom: scaleHeight(8) }} />
								<Text style={styles.meaningQuoteText}>{question.longMeaning}</Text>
							</View>
						)}
					</View>
				)}

				{Array.isArray(question.example) && question.example.length > 0 && (
					<View style={styles.sectionBox}>
						<Text style={styles.sectionTitle}>✍️ 예시</Text>
						{question.example.map((ex, idx) => (
							<View key={idx} style={styles.sameProverbBox}>
								<Text key={idx} style={styles.exampleText}>
									• {ex}
								</Text>
							</View>
						))}
					</View>
				)}

				{Array.isArray(question.sameProverb) && question.sameProverb.filter((p) => p.trim()).length > 0 && (
					<View style={styles.sectionBox}>
						<Text style={styles.sectionTitle}>🔗 비슷한 속담</Text>
						{question.sameProverb.map((p, idx) => (
							<View key={idx} style={styles.sameProverbBox}>
								<Text style={styles.sameProverbText}>• {p}</Text>
							</View>
						))}
					</View>
				)}
			</View>
		);
	};

	if (!visible) {
		return null;
	}

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.resultModal,
						resultType === 'correct' && { backgroundColor: '#f0fdf4', borderColor: '#2ecc71', borderWidth: 1 },
						resultType === 'wrong' && { backgroundColor: '#fff1f2', borderColor: '#e74c3c', borderWidth: 1 },
						resultType === 'timeout' && { backgroundColor: '#fffaf0', borderColor: '#f39c12', borderWidth: 1 },
						resultType === 'done' && styles.resultModalDone,
					]}>
					{/* ✅ done일 때는 상단 title, 마스코트 숨김 */}
					{resultType !== 'done' && (
						<Text
							style={[
								styles.resultTitle,
								resultType === 'correct' && { color: '#2ecc71' },
								resultType === 'wrong' && { color: '#e74c3c' },
								resultType === 'timeout' && { color: '#f39c12' },
							]}>
							{resultTitle}
						</Text>
					)}

					{resultType !== 'done' && (
						<FastImage
							source={resultType === 'correct' ? require('@/assets/images/correct_mascote.png') : require('@/assets/images/wrong_mascote.png')}
							style={styles.resultMascot}
							resizeMode={FastImage.resizeMode.contain}
						/>
					)}

					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={{
							paddingBottom: scaleHeight(10),
							alignItems: resultType === 'done' ? 'center' : undefined,
						}}
						showsVerticalScrollIndicator={resultType !== 'done'}>
						{resultType === 'done' ? (
							<>
								<FastImage
									source={require('@/assets/images/mascote_done.png')}
									style={{ width: scaleWidth(150), height: scaleWidth(150) }}
									resizeMode={FastImage.resizeMode.contain}
								/>
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
							</>
						) : resultType === 'correct' ? (
							<>
								<Text style={[styles.resultMessageBig, { marginBottom: scaleHeight(12) }]}>{resultMessage}</Text>
								<ProverbInfoCard question={question} highlightColor="#27ae60" backgroundColor="#eafaf1" />
							</>
						) : (
							<>
								<Text style={[styles.resultMessageBig, { color: '#e67e22' }]}>{resultMessage}</Text>
								<Text style={{ fontSize: scaledSize(15), fontWeight: '600', textAlign: 'center', padding: scaleWidth(20) }}>
									정답은 <Text style={{ color: '#27ae60' }}>"{question?.proverb}"</Text>였어요!
								</Text>
								<ProverbInfoCard question={question} highlightColor="#e67e22" backgroundColor="#fffdf7" />
							</>
						)}
					</ScrollView>

					{resultType !== 'done' && (
						<TouchableOpacity style={styles.modalConfirmButton} onPress={onNext}>
							<Text style={styles.modalConfirmText}>다음 퀴즈</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		</Modal>
	);
};

export const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	doneTitle: {
		fontSize: scaledSize(24),
		fontWeight: '800',
		color: '#1f2937',
		marginTop: scaleHeight(8),
		marginBottom: scaleHeight(4),
	},
	doneSubtitle: {
		fontSize: scaledSize(16),
		color: '#6b7280',
		marginBottom: scaleHeight(16),
	},
	doneStatsCard: {
		backgroundColor: 'rgba(255,255,255,0.8)',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(20),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: 'rgba(245,158,11,0.3)',
		alignItems: 'center' as const,
		minWidth: '70%',
	},
	doneStatsLabel: {
		fontSize: scaledSize(12),
		color: '#9ca3af',
		marginBottom: scaleHeight(4),
		fontWeight: '600',
	},
	doneStatsValue: {
		fontSize: scaledSize(16),
		fontWeight: '800',
		color: '#1f2937',
		textAlign: 'center' as const,
	},
	doneMessage: {
		fontSize: scaledSize(15),
		color: '#4b5563',
		textAlign: 'center' as const,
		lineHeight: scaleHeight(24),
		marginBottom: scaleHeight(20),
	},
	donePrimaryButton: {
		backgroundColor: '#f59e0b',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(32),
		borderRadius: scaleWidth(28),
		width: '100%',
		alignItems: 'center' as const,
		shadowColor: '#f59e0b',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 6,
	},
	donePrimaryButtonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '700' as const,
	},
	doneSecondaryTouch: {
		marginTop: scaleHeight(14),
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(16),
	},
	doneSecondaryText: {
		fontSize: scaledSize(14),
		color: '#6b7280',
		fontWeight: '600',
		textDecorationLine: 'underline' as const,
	},
	resultModalDone: {
		backgroundColor: '#fffbeb',
		borderWidth: 2,
		borderColor: '#f59e0b',
		paddingVertical: scaleHeight(28),
		paddingHorizontal: scaleWidth(28),
		shadowColor: '#f59e0b',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.2,
		shadowRadius: 12,
	},
	resultModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(15),
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		width: '90%',
		maxHeight: '85%',
	},
	resultTitle: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},
	resultMascot: {
		width: scaleWidth(120),
		height: scaleHeight(120),
		borderRadius: 60,
	},
	resultMessageContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: scaleHeight(90),
	},
	resultMessageBig: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2ecc71',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
	},
	correctInfoCard: {
		width: '100%',
		backgroundColor: '#eafaf1',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginTop: scaleHeight(10),
		borderWidth: 1.2,
		borderColor: '#27ae60',
	},
	correctInfoLabel: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#27ae60',
		marginBottom: scaleHeight(4),
	},
	correctInfoText: {
		fontSize: scaledSize(15),
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		fontWeight: '500',
		width: '100%',
		flexWrap: 'wrap',
		flexShrink: 1,
	},
	resultSubText: {
		fontSize: scaledSize(15),
		color: '#34495e',
		marginTop: scaleHeight(6),
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	proverbText: {
		fontWeight: '700',
		color: '#2c3e50',
		fontSize: scaledSize(16),
	},
	meaningText: {
		fontWeight: '700',
		color: '#2980b9',
		fontSize: scaledSize(16),
	},
	modalConfirmButton: {
		backgroundColor: '#2980b9',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(36),
		borderRadius: scaleWidth(30),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.2,
		shadowRadius: scaleWidth(4),
		marginTop: scaleHeight(16),
	},
	modalConfirmText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
	correctInfoSubLabel: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		fontWeight: '500',
		marginBottom: scaleHeight(6),
		textAlign: 'left',
	},
	correctInfoSubLabelInCard: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#34495e',
		marginBottom: scaleHeight(10),
		textAlign: 'center',
	},
	resultMessage: {
		fontSize: scaledSize(16),
		color: '#34495e',
		textAlign: 'center',
		marginBottom: scaleHeight(12),
	},
	replayText: {
		fontSize: scaledSize(14),
		fontWeight: '500',
		color: '#2980b9',
		textAlign: 'center',
		textDecorationLine: 'underline',
	},
	fixedMeaningHeight: {
		minHeight: scaleHeight(66),
		maxHeight: scaleHeight(120),
	},
	scrollView: { maxHeight: scaleHeight(500), width: '100%' },
	infoCard: {
		width: '100%',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		borderWidth: 1.2,
	},
	infoSectionTitle: {
		fontSize: scaledSize(16),
		fontWeight: '700',
		marginBottom: scaleHeight(12),
		textAlign: 'center',
	},
	infoLabel: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		marginBottom: scaleHeight(6),
	},
	infoText: {
		fontSize: scaledSize(15),
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		fontWeight: '500',
	},
	infoSection: {
		marginVertical: scaleHeight(12),
		borderBottomWidth: 0.8,
		borderBottomColor: '#ecf0f1',
		paddingBottom: scaleHeight(10),
	},
	exampleBox: {
		backgroundColor: '#f9f9f9',
		borderRadius: scaleWidth(10),
		padding: scaleWidth(12),
		marginTop: scaleHeight(8),
		borderWidth: 1,
		borderColor: '#eee',
	},
	modalProverbText: {
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#1E6BB8',
		textAlign: 'center',
		lineHeight: scaleHeight(28),
		marginBottom: scaleHeight(16),
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
		padding: scaleWidth(8),
		borderRadius: scaleWidth(8),
	},
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
		color: '#444',
		lineHeight: scaleHeight(20),
	},
});

export default QuizResultModal;
