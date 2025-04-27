import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	Keyboard,
	ScrollView,
	Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const { width: screenWidth } = Dimensions.get('window');

const ProverbMeaningQuizScreen = () => {
	const navigation = useNavigation();
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
	const [question, setQuestion] = useState<MainDataType.Proverb | null>(null);
	const [options, setOptions] = useState<string[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [remainingTime, setRemainingTime] = useState(10);
	const [showResultModal, setShowResultModal] = useState(false);
	const [resultTitle, setResultTitle] = useState('');
	const [resultMessage, setResultMessage] = useState('');

	useFocusEffect(
		useCallback(() => {
			const data = ProverbServices.selectProverbList();
			setProverbs(data);
			loadQuestion(data);
			return () => timerRef.current && clearInterval(timerRef.current);
		}, []),
	);

	const loadQuestion = (data: MainDataType.Proverb[]) => {
		const shuffled = [...data].sort(() => Math.random() - 0.5);
		const newQuestion = shuffled[0];
		const distractors = shuffled.slice(1, 4).map((item) => item.meaning);
		const allOptions = [...distractors, newQuestion.meaning].sort(() => Math.random() - 0.5);

		setQuestion(newQuestion);
		setOptions(allOptions);
		setSelected(null);
		setIsCorrect(null);
		setRemainingTime(10);

		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					clearInterval(timerRef.current!);
					handleSelect('');
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const handleSelect = (answer: string) => {
		if (!question) return;
		if (timerRef.current) clearInterval(timerRef.current);

		const correct = answer === question.meaning;
		setSelected(answer);
		setIsCorrect(correct);

		setResultTitle(correct ? '정답입니다!' : '오답입니다');
		setResultMessage(correct ? '잘했어요! 🎯' : `정답: ${question.meaning}`);
		setShowResultModal(true);
	};

	const handleNext = () => {
		setShowResultModal(false);
		loadQuestion(proverbs);
	};

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={styles.container}>
					<View style={styles.quizBox}>
						<AnimatedCircularProgress
							size={80}
							width={6}
							fill={(10 - remainingTime) * 10}
							tintColor='#3498db'
							backgroundColor='#ecf0f1'>
							{() => <Text style={styles.timerText}>{remainingTime}s</Text>}
						</AnimatedCircularProgress>

						<Text style={styles.questionText}>{question?.proverb || '문제 준비중...'}</Text>

						<View style={styles.optionsContainer}>
							{options.map((option, index) => (
								<TouchableOpacity
									key={index}
									style={[styles.optionButton, selected === option && (isCorrect ? styles.correct : styles.wrong)]}
									onPress={() => handleSelect(option)}
									disabled={!!selected}>
									<Text style={styles.optionText}>{option}</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					<Modal visible={showResultModal} transparent animationType='fade'>
						<View style={styles.modalOverlay}>
							<View style={styles.resultModal}>
								<Text style={styles.resultTitle}>{resultTitle}</Text>
								<Text style={styles.resultMessage}>{resultMessage}</Text>
								<TouchableOpacity style={styles.modalButton} onPress={handleNext}>
									<Text style={styles.modalButtonText}>다음 문제</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
};

export default ProverbMeaningQuizScreen;

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
	quizBox: { width: '100%', maxWidth: 500, alignItems: 'center' },
	timerText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 8 },
	questionText: { fontSize: 20, fontWeight: 'bold', marginVertical: 20, textAlign: 'center', color: '#2c3e50' },
	optionsContainer: { width: '100%' },
	optionButton: { backgroundColor: '#ecf0f1', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
	optionText: { fontSize: 16, fontWeight: '600', color: '#34495e' },
	correct: { backgroundColor: '#2ecc71' },
	wrong: { backgroundColor: '#e74c3c' },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
	resultModal: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', width: '80%' },
	resultTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
	resultMessage: { fontSize: 16, color: '#34495e', marginBottom: 20, textAlign: 'center' },
	modalButton: { backgroundColor: '#3498db', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 30 },
	modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
