import { Paths } from '@/navigation/conf/Paths';
import { MainDataType } from '@/types/MainDataType';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

// ✅ QuizResultModal.tsx
interface QuizResultModalProps {
	visible: boolean;
	resultType: 'correct' | 'wrong' | 'timeout' | 'done' | '';
	resultTitle: string;
	resultMessage: string;
	question: MainDataType.Proverb | null;
	onNext: () => void;
}

const QuizResultModal = ({ visible, resultType, resultTitle, resultMessage, question, onNext }: QuizResultModalProps) => {

	const navigation = useNavigation();


	// ✅ QuizResultModal.tsx 내부
	const ProverbInfoCard = ({
		question,
		highlightColor = '#27ae60',
		backgroundColor = '#eafaf1',
	}: {
		question: MainDataType.Proverb | null;
		highlightColor?: string;
		backgroundColor?: string;
	}) => {
		if (!question) return null;

		return (
			<View style={[styles.infoCard, { backgroundColor, borderColor: highlightColor }]}>
				<Text style={[styles.infoSectionTitle, { color: highlightColor }]}>📖 속담 해설</Text>

				<View style={styles.infoSection}>
					<Text style={[styles.infoLabel, { color: highlightColor }]}>📌 속담</Text>
					<Text style={styles.infoText}>{question.proverb}</Text>
				</View>

				<View style={styles.infoSection}>
					<Text style={[styles.infoLabel, { color: highlightColor }]}>💡 의미</Text>
					<Text style={styles.infoText}>- {question.longMeaning}</Text>
				</View>

				{question.example && question.example.length > 0 && (
					<View style={styles.infoSection}>
						<Text style={[styles.infoLabel, { color: highlightColor }]}>💡 예시</Text>
						{question.example.map((ex, idx) => (
							<Text key={idx} style={styles.exampleText}>
								- {ex}
							</Text>
						))}
					</View>
				)}
			</View>
		);
	};


	if (!visible) return null;

	return (
		<Modal visible={visible} transparent animationType='fade'>
			<View style={styles.modalOverlay}>
				<View
					style={[
						styles.resultModal,
						resultType === 'correct' && { backgroundColor: '#f0fdf4', borderColor: '#2ecc71', borderWidth: 1 },
						resultType === 'wrong' && { backgroundColor: '#fff1f2', borderColor: '#e74c3c', borderWidth: 1 },
						resultType === 'timeout' && { backgroundColor: '#fffaf0', borderColor: '#f39c12', borderWidth: 1 },
					]}>
					<Text
						style={[
							styles.resultTitle,
							resultType === 'correct' && { color: '#2ecc71' },
							resultType === 'wrong' && { color: '#e74c3c' },
							resultType === 'timeout' && { color: '#f39c12' },
							resultType === 'done' && { color: '#2c3e50' },
						]}>
						{resultTitle}
					</Text>

					<FastImage
						source={
							resultType === 'correct'
								? require('@/assets/images/correct_mascote.png')
								: resultType === 'wrong' || resultType === 'timeout'
									? require('@/assets/images/wrong_mascote.png')
									: require('@/assets/images/mascote_done.png')
						}
						style={styles.resultMascot}
						resizeMode={FastImage.resizeMode.contain}
					/>

					<ScrollView
						style={styles.scrollView} // 🔽 모달 높이 제한
						contentContainerStyle={{ paddingBottom: scaleHeight(10) }}
						showsVerticalScrollIndicator={true}
					>
						{resultType === 'done' ? (
							<>
								<Text style={styles.resultMessage}>{resultMessage}</Text>
								<TouchableOpacity onPress={onNext}>
									<Text style={styles.replayText}>👉 처음부터 다시 시작하려면 여기를 눌러주세요!</Text>
								</TouchableOpacity>
							</>
						) : resultType === 'correct' ? (
							<>
								<Text style={styles.resultMessageBig}>{resultMessage}</Text>
								<ProverbInfoCard
									question={question}
									highlightColor="#27ae60"
									backgroundColor="#eafaf1"
								/>
							</>
						) : (
							<>
								<Text style={[styles.resultMessageBig, { color: '#e67e22' }]}>{resultMessage}</Text>
								<Text style={{ fontSize: scaledSize(15), fontWeight: '600', textAlign: 'center', padding: scaleWidth(20) }}>
									정답은 <Text style={{ color: '#27ae60' }}>"{question?.proverb}"</Text>였어요!
								</Text>
								<ProverbInfoCard
									question={question}
									highlightColor="#e67e22"
									backgroundColor="#fffdf7"
								/>
							</>
						)}
					</ScrollView>

					<TouchableOpacity style={styles.modalConfirmButton} onPress={() => {
						if (resultType === 'done') {
							navigation.goBack(); // ✅ 뒤로 가기 수행
						} else {
							onNext(); // ✅ 다음 문제 로직 실행
						}
					}}>
						<Text style={styles.modalConfirmText}>{resultType === 'done' ? '뒤로 가기' : '다음 퀴즈'}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal >
	);
};

export const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
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
		width: scaleWidth(100),
		height: scaleWidth(100),
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
		marginBottom: scaleHeight(16),
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
	scrollView: { maxHeight: scaleHeight(500), width: '100%' }
	,
	// ✅ styles.tsx 추가
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
	infoSection: {
		marginVertical: scaleHeight(16),
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
	exampleBox: {
		backgroundColor: '#f9f9f9',
		borderRadius: scaleWidth(10),
		padding: scaleWidth(12),
		marginTop: scaleHeight(14),
		borderWidth: 1,
		borderColor: '#eee',
	},
	exampleTitle: {
		fontSize: scaledSize(14),
		fontWeight: '700',
		color: '#34495e',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},
	exampleText: {
		fontSize: scaledSize(14),
		color: '#34495e',
		lineHeight: scaleHeight(20),
		marginBottom: scaleHeight(6),
	},
});

export default QuizResultModal;
