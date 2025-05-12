import { MainDataType } from '@/types/MainDataType';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
	if (!visible || resultType === '') return null;

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

					<View style={styles.resultMessageContainer}>
						{resultType === 'correct' && (
							<>
								<Text style={styles.resultMessageBig}>{resultMessage}</Text>

								<View style={styles.correctInfoCard}>
									<Text style={styles.correctInfoSubLabelInCard}>📖 속담 해설</Text>
									<Text style={styles.correctInfoLabel}>📌 속담</Text>
									<Text style={styles.correctInfoText}>- {question?.proverb}</Text>
									<Text style={[styles.correctInfoLabel, { marginTop: 12 }]}>💡 의미</Text>
									<Text style={styles.correctInfoText}>- {question?.longMeaning}</Text>
								</View>
							</>
						)}
						{(resultType === 'wrong' || resultType === 'timeout') && (
							<>
								<Text style={[styles.resultMessageBig, { color: '#e67e22' }]}>{resultMessage}</Text>

								{/* ✅ 정답 강조 구간 추가 */}
								<Text style={{ fontSize: 15, fontWeight: '600', textAlign: 'center', padding: 20 }}>
									정답은 <Text style={{ color: '#27ae60' }}>"{question?.proverb}"</Text>였어요!
								</Text>

								<View style={[styles.correctInfoCard, { backgroundColor: '#fffdf7' }]}>
									<Text style={styles.correctInfoSubLabelInCard}>📖 속담 해설</Text>

									<Text style={[styles.correctInfoLabel, { color: '#e67e22' }]}>📌 속담</Text>
									<Text style={styles.correctInfoText}>- {question?.proverb}</Text>
									<Text style={[styles.correctInfoLabel, { marginTop: 12, color: '#e67e22' }]}>💡 의미</Text>
									<Text style={styles.correctInfoText}>- {question?.longMeaning}</Text>
								</View>
							</>
						)}
					</View>

					<TouchableOpacity style={styles.modalConfirmButton} onPress={onNext}>
						<Text style={styles.modalConfirmText}>{resultType === 'done' ? '뒤로 가기' : '다음 퀴즈'}</Text>
					</TouchableOpacity>
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
	resultModal: {
		backgroundColor: '#fff',
		padding: 15,
		borderRadius: 16,
		alignItems: 'center',
		width: '80%',
	},
	resultTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 12,
	},
	resultMascot: {
		width: 150,
		height: 150,
	},
	resultMessageContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 90,
	},
	resultMessageBig: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2ecc71',
		textAlign: 'center',
		lineHeight: 24,
		marginBottom: 16,
	},
	correctInfoCard: {
		width: '100%',
		backgroundColor: '#eafaf1',
		borderRadius: 12,
		padding: 16,
		marginTop: 10,
		borderWidth: 1.2, // 추가
		borderColor: '#27ae60', // 추가 (초록색 계열)
	},
	correctInfoLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#27ae60',
		marginBottom: 4,
	},
	correctInfoText: {
		fontSize: 15,
		color: '#2c3e50',
		lineHeight: 22,
		fontWeight: '500',
	},
	resultSubText: {
		fontSize: 15,
		color: '#34495e',
		marginTop: 6,
		textAlign: 'center',
		lineHeight: 22,
	},
	proverbText: {
		fontWeight: '700',
		color: '#2c3e50',
		fontSize: 16,
	},
	meaningText: {
		fontWeight: '700',
		color: '#2980b9',
		fontSize: 16,
	},
	modalConfirmButton: {
		backgroundColor: '#2980b9',
		paddingVertical: 14,
		paddingHorizontal: 36,
		borderRadius: 30,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		marginTop: 16,
	},
	modalConfirmText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	correctInfoSubLabel: {
		fontSize: 13,
		color: '#7f8c8d',
		fontWeight: '500',
		marginBottom: 6,
		textAlign: "left",
	},
	correctInfoSubLabelInCard: {
		fontSize: 15,
		fontWeight: '700',
		color: '#34495e',
		marginBottom: 10,
		textAlign: 'center',
	},

});

export default QuizResultModal;
