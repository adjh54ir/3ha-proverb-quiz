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
import IconComponent from '../common/atomic/IconComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

interface SelectGroupProps {
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
    getColor: (val: string) => string;
    compact?: boolean;
    getIcon?: (val: string) => { type: string; name: string } | null; // ✅ 추가
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

    const [levelStats, setLevelStats] = useState<Record<string, { total: number; studied: number }>>({});
    const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; studied: number }>>({});

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
    const getLevelIcon = (key: string): { type: string; name: string } | null => {
        switch (key) {
            case '아주 쉬움':
                return { type: 'fontAwesome5', name: 'seedling' };
            case '쉬움':
                return { type: 'fontAwesome5', name: 'leaf' };
            case '보통':
                return { type: 'fontAwesome5', name: 'tree' };
            case '어려움':
                return { type: 'fontAwesome5', name: 'trophy' };
            default:
                return null;
        }
    };

    const getFieldColor = (field: string): string => {
        const categoryColorMap: Record<string, string> = {
            '운/우연': '#81ecec',       // 밝은 민트
            '인간관계': '#a29bfe',     // 선명한 연보라
            '세상 이치': '#ffeaa7',    // 연노랑
            '근면/검소': '#fab1a0',    // 연코랄
            '노력/성공': '#55efc4',    // 밝은 청록
            '경계/조심': '#ff7675',    // 연한 레드핑크
            '욕심/탐욕': '#fd79a8',    // 핑크
            '배신/불신': '#b2bec3',    // 회색
        };
        return categoryColorMap[field] || '#dfe6e9'; // 기본 연회색
    };
    const getFieldIcon = (field: string): { type: string; name: string } | null => {
        const iconMap: Record<string, { type: string; name: string }> = {
            '운/우연': { type: 'fontAwesome5', name: 'dice' },
            '인간관계': { type: 'fontAwesome5', name: 'users' },
            '세상 이치': { type: 'fontAwesome5', name: 'globe' },
            '근면/검소': { type: 'fontAwesome5', name: 'hammer' },
            '노력/성공': { type: 'fontAwesome5', name: 'medal' },
            '경계/조심': { type: 'fontAwesome5', name: 'exclamation-triangle' },
            '욕심/탐욕': { type: 'fontAwesome5', name: 'money-bill-wave' },
            '배신/불신': { type: 'fontAwesome5', name: 'user-slash' },
        };

        return iconMap[field] || null;
    };


    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const raw = await AsyncStorage.getItem('UserStudyHistory');
                const parsed = raw ? JSON.parse(raw) : { studiedIds: [] };
                loadLevelStats(parsed.studiedIds ?? []);
                loadStats(parsed.studiedIds ?? []);
            };
            load();
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

    const loadLevelStats = (studiedIds: number[]) => {
        const allProverbs = ProverbServices.selectProverbList();
        const levelMap: Record<string, { total: number; studied: number }> = {
            '전체': { total: 0, studied: 0 }
        };

        allProverbs.forEach((item) => {
            const level = item.levelName;

            if (!levelMap[level]) levelMap[level] = { total: 0, studied: 0 };
            levelMap[level].total += 1;
            if (studiedIds.includes(item.id)) levelMap[level].studied += 1;

            // 전체 누적
            levelMap['전체'].total += 1;
            if (studiedIds.includes(item.id)) levelMap['전체'].studied += 1;
        });

        setLevelStats(levelMap);
    };

    const loadStats = (studiedIds: number[]) => {
        const allProverbs = ProverbServices.selectProverbList();
        const categoryMap: Record<string, { total: number; studied: number }> = {
            '전체': { total: 0, studied: 0 } // ✅ 전체 기본값 추가
        };

        allProverbs.forEach((item) => {
            const category = item.category;
            // 개별 카테고리 누적
            if (!categoryMap[category]) categoryMap[category] = { total: 0, studied: 0 };
            categoryMap[category].total += 1;
            if (studiedIds.includes(item.id)) categoryMap[category].studied += 1;

            // 전체 카운트 누적
            categoryMap['전체'].total += 1;
            if (studiedIds.includes(item.id)) categoryMap['전체'].studied += 1;
        });

        setCategoryStats(categoryMap);
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



    const SelectGroup = ({ title, options, selected, onSelect, getColor, compact = false, getIcon }: SelectGroupProps) => {
        return (
            <View style={styles.selectGroupWrapper}>
                <View style={styles.selectTitleBox}>
                    <Text style={styles.selectTitleEmoji}>🎯</Text>
                    <Text style={styles.selectTitleText}>{title}</Text>
                </View>
                <View style={styles.selectSection}>
                    {options.map((option, idx) => {

                        const iconData = getIcon?.(option);
                        const isAll = option === '전체';
                        const isSelected = selected === option;
                        const stats = title.includes('카테고리') ? categoryStats[option] : levelStats[option];


                        if (isAll) {
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        isAll ? styles.fullWidthButton : styles.halfWidthButton,
                                        { backgroundColor: isAll ? '#5DADE2' : getColor(option) },
                                        isSelected && styles.selectButtonActive,
                                    ]}
                                    onPress={() => onSelect(option)}
                                >
                                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                        {isAll ? (
                                            <IconComponent
                                                type="fontAwesome5"
                                                name="clipboard-list"
                                                size={20}
                                                color={isSelected ? '#ffffff' : '#eeeeee'}
                                                style={{ marginBottom: 6 }}
                                            />
                                        ) : iconData ? (
                                            <IconComponent
                                                type={iconData.type}
                                                name={iconData.name}
                                                size={18}
                                                color={isSelected ? '#ffffff' : '#eeeeee'}
                                                style={{ marginBottom: 6 }}
                                            />
                                        ) : null}
                                        <Text
                                            style={[
                                                styles.selectButtonText,
                                                isSelected && styles.selectButtonTextActive,
                                                { textAlign: 'center' },
                                            ]}
                                        >
                                            {`${option}${stats ? `\n(${stats.studied} / ${stats.total})` : ''}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }


                        return (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    isAll ? styles.fullWidthButton : styles.halfWidthButton,
                                    { backgroundColor: isAll ? '#5DADE2' : getColor(option) },
                                    isSelected && styles.selectButtonActive,
                                ]}
                                onPress={() => onSelect(option)}
                            >
                                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                    {iconData && (
                                        <IconComponent
                                            type={iconData.type}
                                            name={iconData.name}
                                            size={18}
                                            color={isSelected ? '#ffffff' : '#eeeeee'}
                                            style={{ marginBottom: 6 }}
                                        />
                                    )}
                                    <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive]}>
                                        {option}
                                        {option !== '전체' && stats
                                            ? `\n(${stats.studied} / ${stats.total})`
                                            : ''}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
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
                                    {/* ❌ 닫기 버튼 */}
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => {
                                            if (timerRef.current) clearInterval(timerRef.current);
                                            navigation.goBack(); // 뒤로가기
                                        }}
                                    >
                                        <IconComponent
                                            type="materialIcons" // 또는 'fontAwesome'
                                            name="close"
                                            size={24}
                                            color="#7f8c8d"
                                        />
                                    </TouchableOpacity>
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
                                                getIcon={getLevelIcon} // ← 이거 빠짐!
                                            />
                                        ) : (
                                            <ScrollView>
                                                <SelectGroup
                                                    title="카테고리 선택"
                                                    compact={true}
                                                    options={categoryOptions}
                                                    selected={selectedCategory}
                                                    onSelect={setSelectedCategory}
                                                    getColor={getFieldColor}
                                                    getIcon={getFieldIcon} // ✅ 추가
                                                />
                                            </ScrollView>
                                        )}
                                    </View>

                                    {/* 시작 버튼 */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                                        {modeStep === 1 && (
                                            <TouchableOpacity
                                                onPress={() => setModeStep(0)}
                                                style={[styles.modalButton, styles.backButtonInline]}>
                                                <IconComponent type="fontAwesome5" name="arrow-left" size={16} color="#3498db" />
                                                <Text style={styles.backButtonText}>이전</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[
                                                styles.modalButton,
                                                {
                                                    flex: 1,
                                                    backgroundColor:
                                                        (modeStep === 0 && selectedLevel) || (modeStep === 1 && selectedCategory)
                                                            ? '#27ae60'
                                                            : '#ccc',
                                                },
                                            ]}
                                            disabled={modeStep === 0 ? !selectedLevel : !selectedCategory}
                                            onPress={() => {
                                                if (modeStep === 0) {
                                                    setModeStep(1); // 난이도 → 카테고리
                                                } else {
                                                    setShowStartModal(false); // 퀴즈 시작
                                                    console.log('선택된 난이도:', selectedLevel);
                                                    console.log('선택된 카테고리:', selectedCategory);
                                                }
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={styles.modalButtonText}>
                                                    {modeStep === 0 ? '다음' : '퀴즈 시작'}
                                                </Text>
                                                {modeStep === 0 && (
                                                    <IconComponent
                                                        type="fontAwesome5"
                                                        name="arrow-right"
                                                        size={16}
                                                        color="#fff"
                                                        style={{ marginLeft: 8 }}
                                                    />
                                                )}
                                            </View>
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
        marginTop: 20,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomExitWrapper: { width: '100%', paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    exitButton: { backgroundColor: '#7f8c8d', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30 },
    exitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    selectModal: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 48,
        borderRadius: 16,
        alignItems: 'center',
        width: '90%',
        position: 'relative',
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
    selectLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    selectButton: {
        width: '48%',
        minHeight: 70,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    selectButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 20,
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
    backButtonInline: {
        flex: 1, // ✅ 퀴즈 시작과 동일 너비
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 0, // 안쪽 여백 최소화
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#3498db',
    },
    backButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#3498db',
    },
    selectSectionWrapper: {
        width: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        padding: 4,
    },
    closeButtonText: {
        fontSize: 22,
        color: '#7f8c8d',
        fontWeight: 'bold',
    },
    selectGroupWrapper: {
        backgroundColor: '#f2f4f5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: '#dfe6e9',
    },
    selectSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },

    halfWidthButton: {
        width: '46%', // 두 개씩
        minHeight: 70,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },

    fullWidthButton: {
        width: '100%',
        minHeight: 70,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
        marginBottom: 12,
    },
    selectButtonActive: {
        borderWidth: 2,
        borderColor: '#2c3e50',
    },

    selectTitleEmoji: {
        fontSize: 22,
    },

    selectTitleText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
    },
    selectTitleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 6,
    },
});