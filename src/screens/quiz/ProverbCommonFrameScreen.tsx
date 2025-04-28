import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Dimensions,
    Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: screenWidth } = Dimensions.get('window');


interface ProverbQuizScreenProps {
    mode: 'meaning' | 'proverb' | 'fill-blank'; // 추가!
}
const ProverbCommonFrameScreen = ({ mode }: ProverbQuizScreenProps) => {
    const navigation = useNavigation();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
    const [question, setQuestion] = useState<MainDataType.Proverb | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [remainingTime, setRemainingTime] = useState(10);
    const [showStartModal, setShowStartModal] = useState(true);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultTitle, setResultTitle] = useState('');
    const [resultMessage, setResultMessage] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [confettiKey, setConfettiKey] = useState(0);
    const [blankWord, setBlankWord] = useState('');
    const [questionText, setQuestionText] = useState('');

    useFocusEffect(
        useCallback(() => {
            const data = ProverbServices.selectProverbList();
            setProverbs(data);
            return () => timerRef.current && clearInterval(timerRef.current);
        }, [])
    );

    useEffect(() => {
        if (!showStartModal) {
            loadQuestion();
        }
    }, [showStartModal]);

    const loadQuestion = () => {
        const shuffled = [...proverbs].sort(() => Math.random() - 0.5);
        const newQuestion = shuffled[0];
        const distractors = shuffled.slice(1, 4);

        let allOptions: string[] = [];
        let displayText: string = '';

        if (mode === 'meaning') {
            // 뜻 맞추기
            allOptions = [...distractors.map((item) => item.meaning), newQuestion.meaning];
            displayText = newQuestion.proverb;
        } else if (mode === 'proverb') {
            // 속담 맞추기
            allOptions = [...distractors.map((item) => item.proverb), newQuestion.proverb];
            displayText = newQuestion.meaning;
        } else if (mode === 'fill-blank') {
            // 빈칸 채우기
            const blank = pickBlankWord(newQuestion.proverb);
            displayText = newQuestion.proverb.replace(blank, '(____)');
            allOptions = [...distractors.map((item) => pickBlankWord(item.proverb)), blank];
            setBlankWord(blank); // 따로 기억해둬야 함
        }

        setQuestion(newQuestion);
        setOptions(allOptions.sort(() => Math.random() - 0.5));
        setQuestionText(displayText); // 문제 텍스트 따로 저장
        setSelected(null);
        setIsCorrect(null);
        setRemainingTime(10);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleSelect(''); // 타임아웃 처리
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSelect = (answer: string) => {
        if (!question) return;
        if (timerRef.current) clearInterval(timerRef.current);

        let correctAnswer = '';

        if (mode === 'meaning') {
            correctAnswer = question.meaning;
        } else if (mode === 'proverb') {
            correctAnswer = question.proverb;
        } else if (mode === 'fill-blank') {
            correctAnswer = blankWord;
        }

        const correct = answer === correctAnswer;
        setSelected(answer);
        setIsCorrect(correct);

        setResultTitle(correct ? '정답입니다!' : '오답입니다');
        setResultMessage(correct ? '잘했어요! 🎯' : `정답: ${correctAnswer}`);
        setShowResultModal(true);
    };

    const pickBlankWord = (text: string) => {
        const words = text.split(' ').filter((w) => w.length > 1);
        const randomWord = words[Math.floor(Math.random() * words.length)];
        return randomWord;
    };

    const handleNext = () => {
        setShowResultModal(false);
        loadQuestion();
    };

    const handleExit = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    {showStartModal ? (
                        <Modal visible={showStartModal} transparent animationType="fade">
                            <View style={styles.modalOverlay}>
                                <View style={styles.resultModal}>
                                    <Text style={styles.resultTitle}>🧠 속담 퀴즈</Text>
                                    <Text style={styles.resultMessage}>
                                        {mode === 'meaning' ? '속담의 뜻을 맞혀보세요!' : '뜻에 맞는 속담을 찾으세요!'}
                                    </Text>
                                    <TouchableOpacity style={styles.modalButton} onPress={() => setShowStartModal(false)}>
                                        <Text style={styles.modalButtonText}>시작하기</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    ) : (
                        <>
                            <View style={styles.quizBox}>
                                <AnimatedCircularProgress
                                    size={80}
                                    width={6}
                                    fill={(10 - remainingTime) * 10}
                                    tintColor="#3498db"
                                    backgroundColor="#ecf0f1">
                                    {() => <Text style={styles.timerText}>{remainingTime}s</Text>}
                                </AnimatedCircularProgress>

                                <Text style={styles.questionText}>
                                    {mode === 'fill-blank'
                                        ? questionText || '문제 준비중...'
                                        : mode === 'meaning'
                                            ? question?.proverb
                                            : question?.meaning || '문제 준비중...'}
                                </Text>

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

                            <View style={styles.bottomExitWrapper}>
                                <TouchableOpacity style={styles.exitButton} onPress={() => setShowCloseModal(true)}>
                                    <Text style={styles.exitButtonText}>퀴즈 종료</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    <Modal visible={showResultModal} transparent animationType="fade">
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
                    <Modal visible={showCloseModal} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.resultModal}>
                                <Text style={styles.resultTitle}>퀴즈 종료</Text>
                                <Text style={styles.resultMessage}>정말 종료하시겠어요?</Text>
                                <View style={{ flexDirection: 'row', marginTop: 20 }}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: '#7f8c8d', marginRight: 8 }]}
                                        onPress={() => setShowCloseModal(false)}>
                                        <Text style={styles.modalButtonText}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalButton}
                                        onPress={handleExit}>
                                        <Text style={styles.modalButtonText}>종료하기</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {confettiKey > 0 && (
                        <ConfettiCannon
                            key={confettiKey}
                            count={100}
                            origin={{ x: screenWidth / 2, y: 0 }}
                            fadeOut
                            autoStart
                        />
                    )}
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default ProverbCommonFrameScreen;

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
    bottomExitWrapper: { width: '100%', paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    exitButton: { backgroundColor: '#7f8c8d', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30 },
    exitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});