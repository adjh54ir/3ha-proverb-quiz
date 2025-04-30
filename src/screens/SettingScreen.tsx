import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    SafeAreaView,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import ProverbServices from '@/services/ProverbServices';
import { CONST_BADGES } from '@/const/ConstBadges';

const STORAGE_KEYS = {
    study: 'UserStudyHistory',
    quiz: 'UserQuizHistory',
};

const SettingScreen = () => {
    const isFocused = useIsFocused();
    const scrollRef = useRef<ScrollView>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [resetType, setResetType] = useState<'study' | 'quiz' | 'all' | null>(null);
    const [summary, setSummary] = useState<string>('');
    // 상태
    const ALARM_TIME_KEY = 'AlarmTime';
    const [alarmTime, setAlarmTime] = useState<Date>(new Date());

    useEffect(() => {
        if (isFocused) {
            handleScrollToTop();
        }
    }, [isFocused]);

    useEffect(() => {
        AsyncStorage.getItem(ALARM_TIME_KEY).then((time) => {
            if (time) setAlarmTime(new Date(time));
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(ALARM_TIME_KEY, alarmTime.toISOString());
    }, [alarmTime]);

    const handleScrollToTop = () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const getSummaryMessage = (type: 'study' | 'quiz' | 'all') => {
        let msg = '';
        if (type === 'study') {
            msg = '학습 데이터를 초기화하면 해당 정보는 복구할 수 없습니다.';
        } else if (type === 'quiz') {
            msg = '퀴즈 데이터를 초기화하면 해당 정보는 복구할 수 없습니다.';
        } else if (type === 'all') {
            msg = '모든 데이터를 초기화하면 모든 기록이 사라지며 복구할 수 없습니다.';
        }
        setSummary(msg);
    };
    // 모달 타이틀을 타입에 따라 변경
    const getModalTitle = () => {
        switch (resetType) {
            case 'study':
                return '학습 데이터를 초기화할까요?';
            case 'quiz':
                return '퀴즈 내용을 초기화할까요?';
            case 'all':
                return '모든 데이터를 초기화할까요?';
            default:
                return '정말 초기화할까요?';
        }
    };

    const confirmReset = async (type: 'study' | 'quiz' | 'all') => {
        setResetType(type);
        getSummaryMessage(type);
        setModalVisible(true);
    };

    // handleConfirmDelete 내부 수정
    const handleConfirmDelete = async () => {
        if (!resetType) return;

        try {
            if (resetType === 'study') {
                await AsyncStorage.removeItem(STORAGE_KEYS.study);
                // ✅ 학습 상태 초기화 메시지 → 필요 시 context 또는 이벤트 활용 가능
                Alert.alert('완료', '학습 데이터가 초기화되었습니다');
            } else if (resetType === 'quiz') {
                await AsyncStorage.removeItem(STORAGE_KEYS.quiz);
                Alert.alert('완료', '퀴즈 데이터가 초기화되었습니다');
            } else {
                await AsyncStorage.multiRemove([STORAGE_KEYS.study, STORAGE_KEYS.quiz]);
                Alert.alert('완료', '모든 데이터가 초기화되었습니다');
            }

            setModalVisible(false);
            setResetType(null);
            handleScrollToTop();

            // ✅ 예시: 리셋 후 홈으로 이동
            // navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME });
        } catch (err) {
            Alert.alert('오류', '초기화 중 오류가 발생했습니다');
        }
    };

    const handleCompleteAllQuiz = async () => {
        const allProverbs = ProverbServices.selectProverbList();
        console.log(allProverbs.map((p) => p.id))
        const parsed = {
            badges: CONST_BADGES.filter(b => b.type === 'quiz').map(b => b.id),
            correctProverbId: allProverbs.map((p) => p.id),
            wrongProverbId: [],
            totalScore: 2460,
            bestCombo: 20,
            lastAnsweredAt: new Date().toISOString(),
            quizCounts: {}, // 원하면 여기서도 id별로 count 넣을 수 있음
        };
        await AsyncStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify(parsed));
        Alert.alert('처리됨', '모든 퀴즈 완료 + 뱃지 지급!');
    };

    const handleCompleteAllStudy = async () => {
        const allProverbs = ProverbServices.selectProverbList();
        const parsed = {
            badges: CONST_BADGES.filter(b => b.type === 'study').map(b => b.id),
            studyProverbes: allProverbs.map((p) => p.id),
            lastStudyAt: new Date().toISOString(),
            studyCounts: {}, // 원하면 각 속담 id별 학습 횟수 설정 가능
        };
        await AsyncStorage.setItem(STORAGE_KEYS.study, JSON.stringify(parsed));
        Alert.alert('처리됨', '모든 학습 완료 + 뱃지 지급!');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView
                ref={scrollRef}
                style={styles.container}
                refreshControl={<RefreshControl refreshing={false} onRefresh={() => { }} />}>
                <View>
                    <AdmobBannerAd />
                </View>
                <View style={styles.section}>
                    <Text style={styles.title}>학습/퀴즈 다시 풀기 </Text>
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity style={[styles.button, styles.resetStudy]} onPress={() => confirmReset('study')}>
                            <IconComponent type='materialCommunityIcons' name='refresh' size={18} color='#fff' style={styles.iconLeft} />
                            <Text style={styles.buttonText}>학습 다시 하기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.resetQuiz]} onPress={() => confirmReset('quiz')}>
                            <IconComponent type='materialCommunityIcons' name='refresh' size={18} color='#fff' style={styles.iconLeft} />
                            <Text style={styles.buttonText}>퀴즈 다시 풀기</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.resetAll]} onPress={() => confirmReset('all')}>
                            <IconComponent type='materialCommunityIcons' name='delete' size={18} color='#fff' style={styles.iconLeft} />
                            <Text style={styles.buttonText}>모두 다시 풀기</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 기존 설정 UI */}
                <View style={styles.section}>
                    <Text style={styles.title}>📌 관리자 패널</Text>
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#6a1b9a' }]} onPress={handleCompleteAllQuiz}>
                            <IconComponent type='materialIcons' name='check-circle' size={18} color='#fff' style={styles.iconLeft} />
                            <Text style={styles.buttonText}>모든 퀴즈 완료로 설정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#0d47a1' }]} onPress={handleCompleteAllStudy}>
                            <IconComponent type='materialIcons' name='school' size={18} color='#fff' style={styles.iconLeft} />
                            <Text style={styles.buttonText}>모든 학습 완료로 설정</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType='fade' onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                        <Text style={styles.modalSummary}>{summary}</Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.modalDelete]} onPress={handleConfirmDelete}>
                                <Text style={styles.modalButtonText}>삭제</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default SettingScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    section: {
        margin: 20,
        backgroundColor: '#f8f9fa',
        padding: 25,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buttonGroup: {
        gap: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    resetStudy: {
        backgroundColor: '#1E88E5',
    },
    resetQuiz: {
        backgroundColor: '#43A047',
    },
    resetAll: {
        backgroundColor: '#E53935',
    },
    // Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalSummary: {
        fontSize: 14,
        color: '#333',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalCancel: {
        backgroundColor: '#9E9E9E',
    },
    modalDelete: {
        backgroundColor: '#D32F2F',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        color: '#2c3e50',
    },
    timeButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#ecf0f1',
        borderRadius: 8,
        marginBottom: 8,
    },
    timeText: {
        fontSize: 16,
        color: '#34495e',
    },
    addButton: {
        marginTop: 10,
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    iconLeft: {
        marginRight: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
});
