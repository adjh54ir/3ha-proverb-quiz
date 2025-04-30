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
    ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';

const { width: screenWidth } = Dimensions.get('window');

interface SelectGroupProps {
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
    getColor: (val: string) => string;
    compact?: boolean; // 💡 추가
}

interface ProverbQuizScreenProps {
    mode: 'meaning' | 'proverb' | 'fill-blank'; // 추가!
}
const ProverbCommonFrameScreen = ({ mode }: ProverbQuizScreenProps) => {
    const navigation = useNavigation();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    useBlockBackHandler(true);      // 뒤로가기 모션 막기 

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
    const [selectedLevel, setSelectedLevel] = useState<string>('전체'); // 기본값 '전체'
    const [selectedCategory, setSelectedCategory] = useState<string>('전체'); // 기본값 '전체'
    const [levelOptions, setLevelOptions] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
    const [modeStep, setModeStep] = useState(0); // 0 = 난이도, 1 = 카테고리

    const getLevelColor = (key: string): string => {
        switch (key) {
            case '아주 쉬움':
                return '#85C1E9'; // Level 1
            case '쉬움':
                return '#F4D03F'; // Level 2
            case '보통':
                return '#EB984E'; // Level 3
            case '어려움':
                return '#E74C3C'; // Level 4
            default:
                return '#0A84FF'; // 전체나 기타
        }
    };

    const CATEGORY_BACKGROUND_COLORS: { [key: string]: string } = {
        '전체': '#f7f9f9',
        '속담': '#f9e79f',
        '격언': '#f5b041',
        '명언': '#eb984e',
    };


    useFocusEffect(
        useCallback(() => {
            const data = ProverbServices.selectProverbList();
            setProverbs(data);
            return () => timerRef.current && clearInterval(timerRef.current);
        }, [])
    );
    // 퀴즈 시작 전 데이터 불러오기
    useEffect(() => {
        const levels = ProverbServices.selectLevelNameList();
        const categories = ProverbServices.selectCategoryList();
        setLevelOptions(['전체', ...levels]);
        setCategoryOptions(['전체', ...categories]);
    }, []);

    useEffect(() => {
        if (!showStartModal) {
            loadQuestion();
        }
    }, [showStartModal]);


    const loadQuestion = () => {
        const filteredProverbs = proverbs.filter((p) => {
            const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
            const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
            return levelMatch && categoryMatch;
        });
        const shuffled = [...filteredProverbs].sort(() => Math.random() - 0.5);
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
        setRemainingTime(20);

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



    const SelectGroup = ({ title, options, selected, onSelect, getColor, compact = false }: SelectGroupProps) => {
        return (
            <View style={styles.selectSectionWrapper}>
                <Text style={styles.selectLabel}>{title}</Text>
                <View style={styles.selectSection}>
                    {options.map((option, idx) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.selectButton,
                                idx === 0
                                    ? {
                                        width: '100%',
                                        aspectRatio: 6,
                                        backgroundColor: getColor(option),
                                        height: compact ? 40 : 60, // 👈 compact 적용
                                    }
                                    : {
                                        width: '48%',
                                        backgroundColor: getColor(option),
                                        height: compact ? 40 : 60, // 👈 compact 적용
                                    },
                                selected === option && styles.selectButtonActive,
                            ]}
                            onPress={() => onSelect(option)}
                        >
                            <Text
                                style={[
                                    styles.selectButtonText,
                                    selected === option && styles.selectButtonTextActive,
                                    compact && { fontSize: 15 }, // 👈 compact 글자도 약간 축소
                                ]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
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
                                <View style={styles.selectModal}>
                                    <Text style={styles.selectTitle}>🧠 퀴즈 시작 전</Text>
                                    <Text style={styles.selectSub}>난이도와 카테고리를 골라주세요!</Text>

                                    <View style={[
                                        styles.selectSection,
                                        { marginBottom: modeStep === 1 ? 30 : 0 }
                                    ]}>
                                        {modeStep === 0 ? (
                                            <SelectGroup
                                                title="난이도 선택"
                                                options={levelOptions}
                                                selected={selectedLevel}
                                                onSelect={setSelectedLevel}
                                                getColor={getLevelColor}
                                            />
                                        ) : (
                                            <ScrollView>
                                                <TouchableOpacity style={styles.backButton} onPress={() => setModeStep(0)}>
                                                    <Text style={styles.backButtonText}>← 난이도 선택으로 돌아가기</Text>
                                                </TouchableOpacity>
                                                <SelectGroup
                                                    title="카테고리 선택"
                                                    compact={true}
                                                    options={categoryOptions}
                                                    selected={selectedCategory}
                                                    onSelect={setSelectedCategory}
                                                    getColor={(cat) => CATEGORY_BACKGROUND_COLORS[cat] || '#f7f9f9'}
                                                />
                                            </ScrollView>
                                        )}
                                    </View>

                                    {/* 시작 버튼 */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                                        {modeStep === 1 && (
                                            <TouchableOpacity onPress={() => setModeStep(0)} style={styles.backButtonInline}>
                                                <Text style={styles.backButtonText}>← 이전</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[
                                                styles.modalButton,
                                                {
                                                    backgroundColor:
                                                        (modeStep === 0 && selectedLevel) || (modeStep === 1 && selectedCategory) ? '#3498db' : '#ccc',
                                                },
                                            ]}
                                            disabled={modeStep === 0 ? !selectedLevel : !selectedCategory}
                                            onPress={() => {
                                                if (modeStep === 0) {
                                                    setModeStep(1); // 난이도 선택 완료 → 카테고리로 넘어가기
                                                } else {
                                                    setShowStartModal(false); // 카테고리까지 선택 완료 → 퀴즈 시작
                                                    console.log('선택된 난이도:', selectedLevel);
                                                    console.log('선택된 카테고리:', selectedCategory);
                                                }
                                            }}
                                        >
                                            <Text style={styles.modalButtonText}>{modeStep === 0 ? '다음' : '퀴즈 시작'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    ) : (
                        <>
                            <View style={styles.quizBox}>
                                <AnimatedCircularProgress
                                    size={80}
                                    width={6}
                                    fill={(20 - remainingTime) * 5}
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
                                    {options.map((option, index) => {
                                        const labels = ['A.', 'B.', 'C.', 'D.'];
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.optionButton,
                                                    selected === option && (isCorrect ? styles.correct : styles.wrong)
                                                ]}
                                                onPress={() => handleSelect(option)}
                                                disabled={!!selected}
                                            >
                                                <Text style={styles.optionText}>
                                                    {labels[index]} {option}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
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
                    <Modal visible={showStartModal} transparent animationType="fade">

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
    optionButton: { backgroundColor: '#ecf0f1', padding: 16, borderRadius: 12, marginBottom: 12 },
    optionText: { fontSize: 16, fontWeight: '600', color: '#34495e' },
    correct: { backgroundColor: '#2ecc71' },
    wrong: { backgroundColor: '#e74c3c' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    resultModal: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', width: '80%' },
    resultTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
    resultMessage: { fontSize: 16, color: '#34495e', marginBottom: 20, textAlign: 'center' },
    modalButton: {
        backgroundColor: '#3498db',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 20, // 추가
    },
    modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    bottomExitWrapper: { width: '100%', paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    exitButton: { backgroundColor: '#7f8c8d', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30 },
    exitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    selectModal: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        width: '90%',
    },
    selectTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    selectSub: {
        fontSize: 16,
        color: '#34495e',
        marginBottom: 20,
        textAlign: 'center',
    },
    selectSection: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center', // ⬅️ 가운데 정렬로 변경
        columnGap: 12,
        rowGap: 16,
        marginTop: 24, // 여유 공간
    },
    selectLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    selectButton: {
        width: '48%',
        height: 60, // ✅ 고정 높이
        aspectRatio: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    selectButtonActive: {
        borderColor: '#2c3e50', // 진한 테두리 표시
        borderWidth: 1,
    },
    selectButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#34495e',
        textAlign: 'center',
        lineHeight: 24,
    },
    selectButtonTextActive: {
        color: '#fff',
    },
    selectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    backButtonText: {
        fontSize: 14,
        color: '#3498db',
        fontWeight: '600',
    },
    backButtonInline: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    selectSectionWrapper: {
        width: '100%',
    },
});