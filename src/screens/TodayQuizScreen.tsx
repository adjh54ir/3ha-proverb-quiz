/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    StyleSheet,
    Switch,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee, { TimestampTrigger, TriggerType, AndroidImportance, RepeatFrequency } from '@notifee/react-native';
import DatePicker from 'react-native-date-picker';
import { scaledSize, scaleHeight, scaleWidth, screenHeight } from '@/utils';
import { useFocusEffect } from '@react-navigation/native';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import IconComponent from './common/atomic/IconComponent';
import { Paths } from '@/navigation/conf/Paths';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import DateUtils from '@/utils/DateUtils';

const NOTIFICATION_ID = 'daily-quiz-reminder';

type GroupedPrevQuiz = {
    date: string;
    formattedDate: string;
    quizList: MainDataType.Proverb[];
    answerResults: { [quizId: number]: boolean }; // ✅ 추가
};

const TodayQuizScreen = () => {
    const STORAGE_KEY = MainStorageKeyType.TODAY_QUIZ_LIST;
    const SETTING_KEY = MainStorageKeyType.SETTING_INFO;

    const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
    const [alarmTime, setAlarmTime] = useState(new Date(new Date().setHours(15, 0, 0, 0)));
    const [showPicker, setShowPicker] = useState(false);
    const [quizList, setQuizList] = useState<MainDataType.Proverb[]>([]);
    const [answerResults, setAnswerResults] = useState<{ [id: number]: boolean | null }>({});
    const [selectedAnswers, setSelectedAnswers] = useState<{
        [id: number]: { value: string; index: number };
    }>({});
    const [quizOptionsMap, setQuizOptionsMap] = useState<{ [id: number]: string[] }>({});
    const [currentIndex, setCurrentIndex] = useState(0); // 현재 문제 번호
    const [progressPercent, setProgressPercent] = useState(
        quizList.length > 0 ? (currentIndex / quizList.length) * 100 : 0,
    );

    const [showAlarmModal, setShowAlarmModal] = useState(false);

    const [tempIsAlarmEnabled, setTempIsAlarmEnabled] = useState(false);
    const [tempAlarmTime, setTempAlarmTime] = useState(new Date());

    const [showPrevQuizModal, setShowPrevQuizModal] = useState(false);

    const [groupedPrevQuizzes, setGroupedPrevQuizzes] = useState<GroupedPrevQuiz[]>([]);
    const [highlightAnswerId, setHighlightAnswerId] = useState<number | null>(null);

    const [showTodayReview, setShowTodayReview] = useState(false);
    const [todayDate, setTodayDate] = useState(new Date());

    const [tempSelectedHour, setTempSelectedHour] = useState(tempAlarmTime.getHours());

    const total = quizList.length;
    const solved = Object.keys(answerResults).length;
    const correct = Object.values(answerResults).filter((v) => v === true).length;

    const isQuizCompleted = Object.keys(answerResults).length === quizList.length;

    const { getLocalDateString, getLocalParamDateToString } = DateUtils
    const scrollRef = useRef<ScrollView>(null);

    useBlockBackHandler(true); // 뒤로가기 모션 막기

    useFocusEffect(
        useCallback(() => {
            loadSetting(); // AsyncStorage 설정 정보 세팅
            getScheduledAlarmTime(); // 알람 스케줄링 확인
            // ✅ todayDate를 복사해서 오늘 날짜로 대체
            const testDate = new Date();
            testDate.setDate(testDate.getDate()); // 어제로 설정
            setTodayDate(testDate);
        }, []),
    );

    useEffect(() => {
        initQuiz();
    }, [todayDate]);

    useEffect(() => {
        if (quizList.length > 0) {
            setProgressPercent((solved / quizList.length) * 100);
        } else {
            setProgressPercent(0);
        }
    }, [solved, quizList.length]);

    const loadSetting = async () => {
        try {
            const json = await AsyncStorage.getItem(SETTING_KEY);

            if (json !== null) {
                const parseJson = JSON.parse(json);
                setIsAlarmEnabled(parseJson.isUseAlarm); // ✅ 수정
                setAlarmTime(new Date(parseJson.alarmTime));
            }
        } catch (e) {
            console.error('알림 설정 로딩 실패:', e);
            return null;
        }
    };

    const getTodayQuiz = (excludeIds: number[] = []) => {
        const allProverbs = ProverbServices.selectProverbList();

        const filtered = allProverbs.filter((p) => !excludeIds.includes(p.id)); // ✅ 이전 문제 제외
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5);
    };
    const saveSettingInfo = async (setting: MainDataType.SettingInfo) => {
        try {
            console.log('setting : ', setting);

            await AsyncStorage.setItem(SETTING_KEY, JSON.stringify(setting));
            console.log('알림 설정 저장 완료');
        } catch (e) {
            console.error('알림 설정 저장 실패:', e);
        }
    };

    const saveTodayQuizToStorage = async (newData: MainDataType.TodayQuizList) => {
        try {
            const existingJson = await AsyncStorage.getItem(STORAGE_KEY);
            const existing: MainDataType.TodayQuizList[] = existingJson ? JSON.parse(existingJson) : [];

            // 같은 날짜가 있는 경우 제외하고 새로 저장
            const todayStr = getLocalDateString(); // ✅ 이렇게 바꿔야 함
            const updated = [...existing.filter((q) => getLocalParamDateToString(q.quizDate) !== getLocalParamDateToString(todayDate)), newData];

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            console.log('퀴즈 저장 완료');
        } catch (error) {
            console.error('퀴즈 저장 실패:', error);
        }
    };

    const formatQuizDate = (isoDate: string) => {
        const date = new Date(isoDate);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = dayNames[date.getDay()];
        return {
            formattedDate: `${month}월 ${day}일`,
            dayOfWeek,
        };
    };


    /**
     * 지난 문제 리스트
     */
    const loadLastTodayQuizList = async () => {
        const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
        const stored: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];

        console.log('stored :: ', stored);

        const sorted = [...stored].sort((a, b) => new Date(b.quizDate).getTime() - new Date(a.quizDate).getTime());

        const todayStr = getLocalParamDateToString(todayDate);
        const pastQuizzes = sorted.filter((q) => getLocalParamDateToString(q.quizDate) !== todayStr);

        const grouped: GroupedPrevQuiz[] = pastQuizzes.map((entry) => {
            const formatted = formatQuizDate(entry.quizDate);
            const quizList = ProverbServices.selectProverbByIds(entry.todayQuizIdArr);
            return {
                date: entry.quizDate.slice(0, 10),
                formattedDate: `${formatted.formattedDate}(${formatted.dayOfWeek})`,
                quizList,
                answerResults: entry.answerResults, // ✅ 추가
            };
        });

        setGroupedPrevQuizzes(grouped);
        setShowPrevQuizModal(true);
    };

    const sendInstantPush = async () => {
        await notifee.displayNotification({
            title: '✨ 오늘의 퀴즈가 도착했어요!',
            body: '속담 퀴즈 풀고 보상도 받아보세요!',
            android: {
                channelId: await createAndroidChannel(),
                pressAction: {
                    id: 'default', // 필수
                },
            },
            data: {
                moveToScreen: Paths.TODAY_QUIZ, // ✅ 목적지 명시
            },
        });
    };
    const seedDummyWeeklyQuizzes = async () => {
        const allProverbs = ProverbServices.selectProverbList();
        const baseDate = new Date();

        const existingJson = await AsyncStorage.getItem(STORAGE_KEY);
        const existing: MainDataType.TodayQuizList[] = existingJson ? JSON.parse(existingJson) : [];
        const existingDateStrs = existing.map((q) => q.quizDate.slice(0, 10));

        const dummyList: MainDataType.TodayQuizList[] = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() - i);

            const quizDate = date.toISOString();
            const dateStr = quizDate.slice(0, 10);

            if (existingDateStrs.includes(dateStr)) {
                continue;
            } // ❌ 이미 존재하면 skip

            const shuffled = [...allProverbs].sort(() => Math.random() - 0.5).slice(0, 5);

            const answerResults2: { [id: number]: boolean } = {};
            const selectedAnswers2: MainDataType.TodayQuizList['selectedAnswers'] = {};

            shuffled.forEach((item, idx) => {
                const isCorrect = idx % 2 === 0;
                answerResults2[item.id] = isCorrect;
                selectedAnswers2[item.id] = {
                    value: isCorrect ? item.longMeaning : '틀린 보기',
                    index: isCorrect ? 1 : 2,
                };
            });

            dummyList.push({
                quizDate,
                isCheckedIn: true,
                todayQuizIdArr: shuffled.map((q) => q.id),
                correctQuizIdArr: Object.entries(answerResults2)
                    .filter(([_, v]) => v)
                    .map(([id]) => Number(id)),
                worngQuizIdArr: Object.entries(answerResults2)
                    .filter(([_, v]) => !v)
                    .map(([id]) => Number(id)),
                answerResults: answerResults2,
                selectedAnswers: selectedAnswers2,
            });
        }

        const combined = [...existing, ...dummyList];
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
            console.log(`✅ ${dummyList.length}개 저장됨`);
            Alert.alert('더미 데이터 저장 완료', `${dummyList.length}개 저장됨`);
        } catch (err) {
            console.error('❌ 저장 실패:', err);
            Alert.alert('저장 실패', '콘솔 확인 요망');
        }
    };

    const initQuiz = async () => {
        const todayISO = getLocalDateString();

        if (showTodayReview) setShowTodayReview(false); // 👈 이 줄 추가

        const settings = await notifee.getNotificationSettings();
        const hasPermission = settings.authorizationStatus === 1;

        if (hasPermission) {
            const todayStr = getLocalDateString();
            const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
            const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];
            // 여기서 KST 기준 비교로 todayData 찾기
            const todayData = storedArr.find((q) => getLocalParamDateToString(q.quizDate) === todayStr); // ✅ 중요

            const shouldGenerateNewQuiz =
                !todayData ||
                todayData.todayQuizIdArr.length < 5 ||
                getLocalParamDateToString(todayData.quizDate) !== getLocalParamDateToString(todayDate);

            if (shouldGenerateNewQuiz) {
                // 새로운 퀴즈 생성
                const finalQuizList = getTodayQuiz(todayData?.todayQuizIdArr ?? []);
                const newQuizData: MainDataType.TodayQuizList = {
                    quizDate: todayISO, // ✅ 이건 todayDate.toISOString() 기반으로 변경 가능
                    isCheckedIn: false,
                    todayQuizIdArr: finalQuizList.map((q) => q.id),
                    correctQuizIdArr: [],
                    worngQuizIdArr: [],
                    answerResults: {},
                    selectedAnswers: {},
                    prevQuizIdArr: storedArr.length > 0 ? storedArr[storedArr.length - 1].todayQuizIdArr : []
                };
                await saveTodayQuizToStorage(newQuizData);
                setQuizList(finalQuizList);
                generateQuizOptions(finalQuizList);

            } else {
                // 기존 퀴즈 복원
                const finalQuizList = ProverbServices.selectProverbByIds(todayData.todayQuizIdArr);
                setAnswerResults(todayData.answerResults ?? {});
                setSelectedAnswers(todayData.selectedAnswers ?? {});
                setQuizList(finalQuizList);
                generateQuizOptions(finalQuizList);
            }
        }
    };

    const generateQuizOptions = (quizListParam: MainDataType.Proverb[]) => {
        const optionsMap: { [id: number]: string[] } = {};
        quizListParam.forEach((item) => {
            const wrongMeanings = ProverbServices.selectProverbList()
                .filter((p) => p.id !== item.id && !!p.longMeaning)
                .map((p) => p.longMeaning);
            const shuffledWrong = wrongMeanings.sort(() => Math.random() - 0.5).slice(0, 3);

            while (shuffledWrong.length < 3) {
                shuffledWrong.push('모름');
            }

            const options = [...shuffledWrong, item.longMeaning].sort(() => Math.random() - 0.5);
            optionsMap[item.id] = options;
        });
        setQuizOptionsMap(optionsMap);
    };

    /**
     * 알림 지정 확인
     */
    const getScheduledAlarmTime = async () => {
        const notifications = await notifee.getTriggerNotifications();
        const scheduled = notifications.find((n) => n.notification.id === NOTIFICATION_ID);

        if (scheduled && scheduled.trigger.type === TriggerType.TIMESTAMP) {
            const timestamp = (scheduled.trigger as TimestampTrigger).timestamp;
            const date = new Date(timestamp);
            console.log('📌 예약된 알림 시간:', date.toLocaleString());
        } else {
            console.log('🚫 예약된 알림이 없습니다.');
        }
    };

    const scheduleDailyQuizNotification = async (time: Date) => {
        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: getNextTriggerTime(time),
            repeatFrequency: RepeatFrequency.DAILY,
        };

        await notifee.createTriggerNotification(
            {
                id: NOTIFICATION_ID,
                title: '속담 퀴즈가 도착했습니다. 🍀',
                body: '출석 체크도 하고 문제도 풀어서 속담 지식을 넓혀보아요!',
                android: {
                    channelId: await createAndroidChannel(),
                    pressAction: { id: 'default' },
                },
                data: {
                    moveToScreen: Paths.TODAY_QUIZ, // ✅ 목적지 명시
                },
            },
            trigger,
        );
    };

    const cancelScheduledNotification = async () => {
        await notifee.cancelNotification(NOTIFICATION_ID);
    };

    const createAndroidChannel = async () => {
        return await notifee.createChannel({
            id: 'quiz-reminder',
            name: '퀴즈 알림',
            importance: AndroidImportance.HIGH,
        });
    };

    const requestPermission = async () => {
        const settings = await notifee.requestPermission();

        console.log('settings :: ', settings);
        return settings.authorizationStatus === 1;
    };

    const getNextTriggerTime = (baseTime?: Date) => {
        const now = new Date();
        const next = new Date(baseTime ?? alarmTime); // ✅ baseTime 우선 사용
        next.setSeconds(0);
        next.setMilliseconds(0);
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
        return next.getTime();
    };

    /**
     * 알림 설정
     * @param value
     */
    const handleToggleAlarm = async (value: boolean) => {
        console.log(value);

        setIsAlarmEnabled(value);
        if (value) {
            const granted = await requestPermission();
            if (granted) {
                const todayStr = getLocalDateString();
                const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
                const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];



                const newAlarmTime = new Date();
                newAlarmTime.setHours(tempSelectedHour, 0, 0, 0);
                const todayData = storedArr.find((q) => q.quizDate.slice(0, 10) === todayStr);

                // KST 보정 후 저장 (UTC 기준에서 9시간 빼기)
                const offsetFixedISO = new Date(newAlarmTime.getTime() - 9 * 60 * 60 * 1000).toISOString();

                await saveSettingInfo({
                    isUseAlarm: true,
                    alarmTime: offsetFixedISO,
                });

                if (todayData) {
                    const isAlreadySolved = todayData.answerResults && Object.keys(todayData.answerResults).length === 5;

                    const todayProverbs = ProverbServices.selectProverbByIds(todayData.todayQuizIdArr);
                    setQuizList(todayProverbs);
                    setAnswerResults(todayData.answerResults ?? {});
                    setSelectedAnswers(todayData.selectedAnswers ?? {});

                    console.log(isAlreadySolved ? '✅ 이미 푼 오늘 퀴즈 복원 완료' : '🔁 아직 푸는 중인 퀴즈 복원 완료');
                } else {
                    // 새로운 퀴즈 생성
                    const newQuiz = getTodayQuiz();
                    setQuizList(newQuiz);

                    const todayQuizData: MainDataType.TodayQuizList = {
                        quizDate: getLocalDateString(),
                        isCheckedIn: false,
                        todayQuizIdArr: newQuiz.map((q) => q.id),
                        correctQuizIdArr: [],
                        worngQuizIdArr: [],
                        answerResults: {},
                        selectedAnswers: {},
                    };

                    await saveTodayQuizToStorage(todayQuizData);
                    console.log('🆕 새로운 오늘 퀴즈 생성 및 저장 완료');
                }

                await scheduleDailyQuizNotification(tempAlarmTime);
                setIsAlarmEnabled(true);
                await getScheduledAlarmTime();

                // ✅ 알림 설정 완료 팝업 추가
                const hour = alarmTime.getHours().toString().padStart(2, '0');
                Alert.alert(
                    '⏰ 알림 설정 완료!',
                    `매일 ${hour}시에 오늘의 퀴즈가 찾아갈게요!\n놓치지 말고 꼭 참여해보세요 😊`
                );
            } else {
                Alert.alert('알림 권한 필요', '설정에서 알림 권한을 허용해주세요.');
                Linking.openSettings();
            }
        } else {
            await cancelScheduledNotification();

            // 🔁 알림 시간 기본값으로 초기화 (15:00)
            const defaultTime = new Date();
            // 🔁 알림 시간 기본값으로 초기화 (15:00)
            defaultTime.setHours(15, 0, 0, 0);

            setAlarmTime(defaultTime);
            setTempAlarmTime(defaultTime); // ✅ DatePicker용 값도 초기화
            setShowTodayReview(false); // ✅ 문제 다시 보기 닫기
            setTempSelectedHour(15); // ✅ 텍스트용 시간도 15시로 설정

            setIsAlarmEnabled(false);
            // ✅ 끈 상태도 저장
            await saveSettingInfo({
                isUseAlarm: false,
                alarmTime: defaultTime.toISOString(),
            });

            await getScheduledAlarmTime();
        }
    };

    const handleAnswer = async (quizId: number, selected: string, correct: string) => {
        if (answerResults[quizId] !== undefined) {
            return;
        } // 중복 처리 방지

        const options = quizOptionsMap[quizId] || [];
        const selectedIndex = options.findIndex((opt) => opt === selected);

        const isCorrect = selected === correct;

        const newAnswerResults = {
            ...answerResults,
            [quizId]: isCorrect,
        };

        const newSelectedAnswers = {
            ...selectedAnswers,
            [quizId]: {
                value: selected,
                index: selectedIndex,
            },
        };

        setAnswerResults(newAnswerResults);
        setSelectedAnswers(newSelectedAnswers);

        if (!isCorrect) {
            setHighlightAnswerId(quizId);
            setTimeout(() => setHighlightAnswerId(null), 2000); // ✅ 1.5초 후 해제
        }

        // 저장
        const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
        const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];

        const todayStr = getLocalParamDateToString(todayDate);
        const todayIndex = storedArr.findIndex((q) => getLocalParamDateToString(q.quizDate) === todayStr);

        if (todayIndex !== -1) {
            const updatedToday = {
                ...storedArr[todayIndex],
                answerResults: newAnswerResults,
                selectedAnswers: newSelectedAnswers,
                correctQuizIdArr: Object.entries(newAnswerResults)
                    .filter(([_, v]) => v)
                    .map(([k]) => Number(k)),
                worngQuizIdArr: Object.entries(newAnswerResults)
                    .filter(([_, v]) => !v)
                    .map(([k]) => Number(k)),
            };
            //@ts-ignore
            storedArr[todayIndex] = updatedToday;

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(storedArr));
        }

        // ✅ 정답/오답 관계없이 자동 이동 (단, 마지막 문제는 제외)
        if (currentIndex < quizList.length - 1) {
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
            }, 2000);
        }
    };

    const handleResetTodayQuiz = async () => {
        const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
        const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];
        const todayStr = getLocalParamDateToString(todayDate);

        const todayData = storedArr.find((q) => getLocalParamDateToString(q.quizDate) === todayStr);
        const filteredArr = storedArr.filter((q) => getLocalParamDateToString(q.quizDate) !== todayStr);

        // 출석 정보 유지
        const preservedIsCheckedIn = todayData?.isCheckedIn ?? false;

        // 새로운 퀴즈 생성
        const newQuizList = getTodayQuiz();
        const newTodayData: MainDataType.TodayQuizList = {
            quizDate: getLocalDateString(),
            isCheckedIn: preservedIsCheckedIn, // ✅ 출석 정보 유지
            todayQuizIdArr: newQuizList.map((q) => q.id),
            correctQuizIdArr: [],
            worngQuizIdArr: [],
            answerResults: {},
            selectedAnswers: {},
            prevQuizIdArr: todayData?.todayQuizIdArr ?? [],
        };

        const updatedArr = [...filteredArr, newTodayData];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArr));

        // 상태 초기화
        setAnswerResults({});
        setSelectedAnswers({});
        setProgressPercent(0);
        setQuizList(newQuizList);
        setQuizOptionsMap({});
        setCurrentIndex(0);
        generateQuizOptions(newQuizList);

        // 새로운 오늘 퀴즈 다시 생성
        initQuiz();
    };

    const getFormattedDate = () => {
        const date = todayDate;
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = dayNames[date.getDay()];
        return `${month}월 ${day}일(${dayOfWeek})`;
    };

    const renderItem = ({ item }: { item: MainDataType.Proverb }) => {
        const options = quizOptionsMap[item.id] || [];
        const result = answerResults[item.id];
        const selected = selectedAnswers[item.id];
        const getChoiceLabel = (index: number) => String.fromCharCode(65 + index);

        return (
            <View style={styles.quizBox}>
                {/* 문제 + 정답/오답 결과 표시 */}
                <View
                    style={styles.quizSubContainer}>
                    <Text style={styles.questionCombined}>
                        <Text style={styles.questionMain}>{item.proverb}</Text>
                        {!isQuizCompleted && <Text style={styles.questionSub}> 의미는?</Text>}
                    </Text>
                    {result !== undefined && (
                        <Text style={result ? styles.correct : styles.wrong}>{result ? '⭕ 정답!' : '❌ 오답'}</Text>
                    )}
                </View>

                {/* 정답만 보여주는 조건 */}
                {result !== undefined && isQuizCompleted ? (
                    <View style={styles.explanationBox}>
                        <Text style={styles.correctMeaning}>
                            ➤ 정답: <Text style={styles.correctMeaningHighlight}>{item.longMeaning}</Text>
                        </Text>
                        <Text style={styles.exampleSentence}>- 예문: {item.example}</Text>
                    </View>
                ) : (
                    // 아직 안 풀었으면 보기 보여주기
                    options.map((option, idx) => {
                        const isAnswered = result !== undefined;
                        const isCorrect = option === item.longMeaning;
                        const isUserSelected = selected?.value === option;
                        const shouldHighlight = highlightAnswerId === item.id && isCorrect;

                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => handleAnswer(item.id, option, item.longMeaning)}
                                disabled={isAnswered}
                                style={[
                                    styles.option,
                                    isUserSelected && (isCorrect ? styles.correctOption : styles.wrongOption),
                                    shouldHighlight && styles.highlightCorrectBorder, // ✅ 정답 강조 스타일
                                ]}>
                                <Text style={[styles.optionText, isUserSelected && (isCorrect ? styles.correctText : styles.wrongText)]}>
                                    {getChoiceLabel(idx)}. {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.main} edges={['top', 'bottom']}>
            <AdmobBannerAd paramMarginTop={5} paramMarginBottom={4} />
            {/* {__DEV__ && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.resetButton} onPress={seedDummyWeeklyQuizzes}>
                        <Text style={{ fontSize: scaledSize(13), color: '#007AFF', fontWeight: 'bold' }}>
                            🧪 더미 데이터 생성 (1주일)
                        </Text>
                    </TouchableOpacity>
                </View>
            )} */}

            {isAlarmEnabled && (
                <View style={styles.buttonRow}>
                    <View style={styles.leftButtonWrapper}>
                        <TouchableOpacity onPress={handleResetTodayQuiz}>
                            <View style={[styles.buttonContent, { marginLeft: scaleWidth(12) }]}>
                                <IconComponent name="rotate-left" type="FontAwesome" size={13} color="#888" style={styles.iconSpacing} />
                                <Text style={styles.buttonText}>오늘 문제 다시 풀기</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.rightButtonWrapper}>
                        <TouchableOpacity onPress={loadLastTodayQuizList}>
                            <View style={[styles.buttonContent, { marginRight: scaleWidth(12) }]}>
                                <IconComponent name="book" type="FontAwesome" size={13} color="#888" style={styles.iconSpacing} />
                                <Text style={styles.buttonText}>지난 오늘의 퀴즈</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.rightAlignedRow} />

            {__DEV__ && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={sendInstantPush}
                    >
                        <Text style={{ fontSize: scaledSize(13), color: '#007AFF', fontWeight: 'bold' }}>
                            🔔 푸시 테스트 발송
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            {!isAlarmEnabled && (
                <View style={styles.content}>
                    <Text style={styles.title}>🍀 매일 '오늘의 퀴즈'가 도착해요! 🍀</Text>

                    <View style={{ alignSelf: 'flex-start', marginTop: scaleHeight(6) }}>
                        <View style={styles.bulletRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>매일 5개의 속담 퀴즈가 도착해요.</Text>
                        </View>
                        <View style={styles.bulletRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>원하는 시간에 푸시 알림을 받을 수 있어요.</Text>
                        </View>
                        <View style={styles.bulletRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>문제를 모두 풀면 자세한 해설을 볼 수 있어요.</Text>
                        </View>
                    </View>

                    <View style={styles.alarmRow}>
                        <View style={{ flexDirection: 'column', marginTop: scaleHeight(8) }}>
                            <View style={styles.alarmRow}>
                                <Text style={styles.switchLabel}>알림 설정/시간</Text>
                                <Text style={styles.selectedHourText}>
                                    {tempSelectedHour.toString().padStart(2, '0')}시
                                </Text>
                                <Switch
                                    value={isAlarmEnabled}
                                    onValueChange={handleToggleAlarm}
                                    thumbColor={isAlarmEnabled ? '#ffffff' : '#f4f3f4'}
                                    trackColor={{ false: '#ccc', true: '#f4f3f4' }}
                                />
                            </View>

                            <ScrollView
                                ref={scrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.hourScrollContainer}>
                                {Array.from({ length: 24 }).map((_, hour) => {
                                    const isSelected = tempSelectedHour === hour;
                                    return (
                                        <TouchableOpacity
                                            key={hour}
                                            onPress={() => {
                                                setTempSelectedHour(hour);
                                                const newDate = new Date(tempAlarmTime);
                                                newDate.setHours(hour, 0, 0, 0);
                                                setTempAlarmTime(newDate);
                                            }}
                                            style={[
                                                styles.hourButton,
                                                isSelected && styles.hourButtonSelected,
                                            ]}>
                                            <Text
                                                style={[
                                                    styles.hourText,
                                                    isSelected && styles.hourTextSelected,
                                                ]}>
                                                {hour.toString().padStart(2, '0')}시
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            )}

            {isAlarmEnabled && (
                <View style={styles.scoreBox}>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreText}>{getFormattedDate()} 오늘의 퀴즈 🎉</Text>

                        <View style={styles.scoreRightGroup}>
                            <TouchableOpacity
                                onPress={() => {
                                    setTempIsAlarmEnabled(isAlarmEnabled);
                                    setTempAlarmTime(alarmTime);
                                    setShowAlarmModal(true);
                                }}
                                style={{ marginLeft: scaleWidth(0) }}>
                                <View style={styles.bellWrapper}>
                                    <IconComponent name="bell" type="FontAwesome" size={16} color="#FFC107" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                            {solved} / {total}{' '}
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.container}>
                {isAlarmEnabled && quizList.length > 0 && Object.keys(quizOptionsMap).length > 0 && (
                    <View style={styles.quizContainer2}>
                        {!isQuizCompleted ? (
                            renderItem({ item: quizList[currentIndex] })
                        ) : (
                            <>
                                <View style={styles.completedTextWrapper}>
                                    <Text style={styles.completedTitle}>🎉 오늘의 문제 끝! 내일 또 만나요!! 👋</Text>
                                    <Text style={styles.completedScore}>
                                        ✅ 오늘은 <Text style={styles.underline}>{correct}문제를 맞췄어요!</Text> 잘했어요!
                                    </Text>
                                </View>

                                <TouchableOpacity onPress={() => setShowTodayReview((prev) => !prev)} style={styles.reviewToggleButton}>
                                    <IconComponent
                                        name={showTodayReview ? 'chevron-up' : 'chevron-down'}
                                        type="FontAwesome"
                                        size={16}
                                        color="#333"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.acodianTxt}>{showTodayReview ? '오늘의 퀴즈 접기' : '오늘의 퀴즈 다시 보기'}</Text>
                                </TouchableOpacity>

                                {showTodayReview && (
                                    <View style={styles.todayReviewBox}>
                                        <FlatList
                                            style={styles.reviewList}
                                            data={quizList}
                                            keyExtractor={(item) => item.id.toString()}
                                            renderItem={renderItem}
                                            showsVerticalScrollIndicator={false}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}
            </View>

            <Modal visible={showAlarmModal} transparent animationType="fade" onRequestClose={() => setShowAlarmModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.alarmModalCard}>
                        <Text style={styles.modalTitle2}>🔔 오늘의 퀴즈 알림 설정</Text>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>알림 사용</Text>
                            <Switch
                                value={tempIsAlarmEnabled}
                                onValueChange={setTempIsAlarmEnabled}
                                thumbColor={tempIsAlarmEnabled ? '#ffffff' : '#f4f3f4'}
                                trackColor={{ false: '#ccc', true: '#f4f3f4' }}
                            />
                        </View>

                        {/* 알림 시간은 스위치가 켜졌을 때만 보이게 */}
                        {tempIsAlarmEnabled && (
                            <View style={styles.modalRow}>
                                <View style={{ width: '100%', marginTop: scaleHeight(12) }}>
                                    <View style={styles.timePickerRow}>
                                        <Text style={styles.modalLabel}>알림 시간</Text>
                                        <Text style={styles.selectedHourText}>
                                            {tempSelectedHour.toString().padStart(2, '0')}시
                                        </Text>
                                    </View>

                                    <ScrollView
                                        ref={scrollRef}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{
                                            paddingVertical: scaleHeight(8),
                                            paddingHorizontal: scaleWidth(4),
                                        }}>
                                        {Array.from({ length: 24 }).map((_, hour) => {
                                            const isSelected = tempSelectedHour === hour;
                                            return (
                                                <TouchableOpacity
                                                    key={hour}
                                                    onPress={() => {
                                                        setTempSelectedHour(hour);
                                                        const newDate = new Date(tempAlarmTime);
                                                        newDate.setHours(hour, 0, 0, 0);
                                                        setTempAlarmTime(newDate);
                                                    }}
                                                    style={[
                                                        styles.hourButton,
                                                        isSelected && styles.hourButtonSelected,
                                                    ]}>
                                                    <Text
                                                        style={[
                                                            styles.hourText,
                                                            isSelected && styles.hourTextSelected,
                                                        ]}>
                                                        {hour.toString().padStart(2, '0')}시
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowAlarmModal(false);
                                    setTempIsAlarmEnabled(isAlarmEnabled);
                                    setTempSelectedHour(alarmTime.getHours());
                                    // ✅ 임시값 초기화
                                    setTempAlarmTime(alarmTime);
                                }}>
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={async () => {
                                    setShowAlarmModal(false);

                                    let finalAlarmTime = tempAlarmTime;

                                    if (!tempIsAlarmEnabled) {
                                        // 알림 끈 경우 15:00으로 고정
                                        finalAlarmTime = new Date();
                                        finalAlarmTime.setHours(15, 0, 0, 0);
                                        setTempSelectedHour(15); // ✅ 여기 추가
                                    }

                                    await saveSettingInfo({
                                        isUseAlarm: tempIsAlarmEnabled,
                                        alarmTime: finalAlarmTime.toISOString(),
                                    });

                                    if (tempIsAlarmEnabled) {
                                        await cancelScheduledNotification();
                                        await scheduleDailyQuizNotification(finalAlarmTime);
                                    } else {
                                        await cancelScheduledNotification();
                                    }

                                    setAlarmTime(finalAlarmTime); // ✅ 여기서 반영
                                    setTempAlarmTime(finalAlarmTime); // ✅ 임시 값도 갱신
                                    setIsAlarmEnabled(tempIsAlarmEnabled);
                                    setShowTodayReview(false);

                                    await getScheduledAlarmTime();
                                }}>
                                <Text style={styles.saveButtonText}>저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 시간 선택 다이얼로그 */}
                <DatePicker
                    modal
                    mode="time"
                    open={showPicker}
                    date={tempAlarmTime}
                    onConfirm={(date) => {
                        setShowPicker(false);
                        setTempAlarmTime(date);
                    }}
                    onCancel={() => setShowPicker(false)}
                />
            </Modal>

            <Modal
                visible={showPrevQuizModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPrevQuizModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.alarmModalCard}>
                        {/* 닫기 아이콘 */}
                        <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowPrevQuizModal(false)}>
                            <IconComponent name="close" type="AntDesign" size={20} color="#333" />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(12) }}>
                            <IconComponent name="book" type="FontAwesome" size={20} color="#888" style={{ marginRight: scaleWidth(7) }} />
                            <Text style={styles.modalTitle}>지난 오늘의 퀴즈</Text>
                        </View>

                        <Text style={styles.modalNotice}>※ 오늘 날짜는 제외되며, 전날 퀴즈만 표시됩니다.</Text>

                        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                            {groupedPrevQuizzes.length === 0 ? (
                                <View style={styles.emptyView}>
                                    <Text style={styles.emptyText}>오늘의 퀴즈를 아직 풀지 않았어요.</Text>
                                </View>
                            ) : (
                                groupedPrevQuizzes.map((group) => {
                                    const { formattedDate, dayOfWeek } = formatQuizDate(group.date);
                                    return (
                                        <View key={group.date} style={styles.quizGroup}>
                                            <View style={styles.quizSectionHeader}>
                                                <Text style={styles.quizSectionHeaderText}>
                                                    📅 {formattedDate}(<Text style={styles.dayOfWeekText}>{dayOfWeek}</Text>) 퀴즈
                                                </Text>
                                            </View>
                                            {group.quizList.map((item) => {
                                                const isCorrect = group.answerResults?.[item.id] === true;
                                                const isWrong = group.answerResults?.[item.id] === false;

                                                return (
                                                    <View key={item.id} style={styles.quizCard}>
                                                        <View style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            minHeight: scaleHeight(28), // 정중앙 정렬을 위해 높이 고정 (조정 가능)
                                                        }}>
                                                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                                                <Text style={styles.quizTitle}>{item.proverb}</Text>
                                                            </View>
                                                            <View style={{ justifyContent: 'center', alignItems: 'flex-end', minWidth: scaleWidth(60), marginBottom: scaleHeight(13) }}>
                                                                {isCorrect && <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>⭕ 정답</Text>}
                                                                {isWrong && <Text style={{ color: '#F44336', fontWeight: 'bold' }}>❌ 오답</Text>}
                                                            </View>
                                                        </View>
                                                        <Text style={styles.quizMeaning}>➤ 의미: {item.longMeaning}</Text>
                                                        <Text style={styles.quizExample}>✦ 예문: {item.example}</Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>

                        <TouchableOpacity style={styles.modalFooterButton} onPress={() => setShowPrevQuizModal(false)}>
                            <Text style={styles.modalFooterButtonText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default TodayQuizScreen;

const styles = StyleSheet.create({
    main: {
        flex: 1,
        backgroundColor: '#f5f5f5', // ✅ 회색 배경
    },
    content: {
        marginTop: scaleHeight(12),
        marginHorizontal: scaleWidth(24),
        padding: scaleHeight(24),
        borderRadius: scaledSize(12),
        backgroundColor: '#ffffff',
        justifyContent: 'center', // ✅ 수직 가운데 정렬
        alignItems: 'center', // ✅ 수평 가운데 정렬
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(2) },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        marginBottom: scaleHeight(12),
        color: '#222',
    },
    description: {
        fontSize: scaledSize(14),
        color: '#555',
        lineHeight: 22,
        textAlign: 'left',
        marginBottom: scaleHeight(12),
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scaleWidth(6),
    },
    switchLabel: {
        fontSize: scaledSize(14),
        color: '#333',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scaleWidth(6),
    },
    timeText: {
        fontSize: scaledSize(14),
        color: '#007AFF',
        paddingVertical: scaleHeight(4),
        paddingHorizontal: scaleWidth(10),
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: scaledSize(6),
        minWidth: scaleWidth(70),
        textAlign: 'center',
    },
    container: {
        padding: scaleHeight(8),
    },
    quizBox: {
        marginBottom: scaleHeight(12),
        padding: scaleHeight(16),
        borderRadius: scaledSize(8),
        backgroundColor: '#fff',
    },
    quizSubContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: scaleHeight(20),
    },

    question: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        marginBottom: scaleHeight(12),
    },
    option: {
        padding: scaleHeight(10),
        borderRadius: scaledSize(6),
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: scaleHeight(8),
    },
    correct: {
        color: 'green',
        fontWeight: 'bold',
    },
    wrong: {
        color: 'red',
        fontWeight: 'bold',
    },
    alarmRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: scaleHeight(4),
        marginBottom: scaleHeight(6),
    },
    selectedOption: {
        backgroundColor: '#e0f7fa', // 연한 하늘색
        borderColor: '#00796b', // 진한 민트 계열
        borderWidth: 2,
    },
    correctOption: {
        backgroundColor: '#4CAF50', // 초록색 배경
        borderColor: '#388E3C',
        borderWidth: 2,
    },
    wrongOption: {
        backgroundColor: '#F44336', // 빨간색 배경
        borderColor: '#D32F2F',
        borderWidth: 2,
    },
    correctText: {
        color: '#fff', // 흰색 글자
        fontWeight: 'bold',
    },
    wrongText: {
        color: '#fff', // 흰색 글자
        fontWeight: 'bold',
    },
    scoreBox: {
        marginTop: scaleHeight(8),
        marginHorizontal: scaleWidth(24),
        padding: scaleHeight(16),
        borderRadius: scaledSize(10),
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(2) },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scoreText: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    feedbackText: {
        marginTop: scaleHeight(4),
        fontSize: scaledSize(16),
        color: '#555',
    },
    questionGuideCombined: {
        fontSize: scaledSize(16),
        color: '#333',
        fontWeight: 'bold',
    },
    questionCombined: {
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    questionMain: {
        fontSize: scaledSize(22),
        fontWeight: 'bold',
        color: '#222',
    },
    questionSub: {
        fontSize: scaledSize(15),
        color: '#777',
    },

    characterGridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // 또는 'center'
        flexWrap: 'wrap',
        backgroundColor: '#f1f2f6',
        borderRadius: scaleWidth(12),
        paddingVertical: scaleHeight(12),
        marginBottom: scaleHeight(12),
    },

    characterColumn: {
        alignItems: 'center',
        width: scaleWidth(50),
    },

    charText: {
        fontSize: scaledSize(22),
        fontWeight: 'bold',
        color: '#222',
    },

    hangulText: {
        fontSize: scaledSize(16),
        color: '#444',
        marginTop: scaleHeight(2),
    },

    meaningText: {
        fontSize: scaledSize(12),
        color: '#666',
        marginTop: scaleHeight(2),
        textAlign: 'center',
    },

    radicalText: {
        fontSize: scaledSize(12),
        color: '#999',
        marginTop: scaleHeight(2),
    },

    quizContainer: {
        marginHorizontal: scaleWidth(16),
        marginTop: scaleHeight(12),
        backgroundColor: '#fff',
        borderRadius: scaledSize(12),
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(1) },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },

    quizContainer2: {
        marginHorizontal: scaleWidth(16),
        backgroundColor: '#fff',
        borderRadius: scaledSize(12),
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(1) },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },

    header: {
        paddingTop: scaleHeight(16),
        paddingBottom: scaleHeight(12),
        paddingHorizontal: scaleWidth(20),
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },

    headerTitle: {
        fontSize: scaledSize(20),
        fontWeight: 'bold',
        color: '#222',
        textAlign: 'center',
    },

    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: scaleWidth(12),
        marginBottom: scaleHeight(6),
    },

    scoreValue: {
        fontSize: scaledSize(16),
        fontWeight: 'bold',
        color: '#4CAF50',
    },

    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: scaleWidth(8),
        marginTop: scaleHeight(6),
    },

    progressBarBackground: {
        flex: 1,
        height: scaleHeight(10),
        backgroundColor: '#eee',
        borderRadius: scaledSize(5),
        overflow: 'hidden',
        marginRight: scaleWidth(12),
    },

    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },

    progressText: {
        fontSize: scaledSize(13),
        color: '#444',
        fontWeight: '500',
    },

    explanationBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: scaledSize(10),
        padding: scaleHeight(12),
        backgroundColor: '#fafafa',
    },

    correctMeaning: {
        fontSize: scaledSize(16),
        color: '#333',
        marginTop: scaleHeight(8),
    },

    correctMeaningHighlight: {
        fontWeight: 'bold',
        color: '#2e7d32',
    },

    exampleSentence: {
        fontSize: scaledSize(14),
        fontStyle: 'italic',
        color: '#666',
        marginTop: scaleHeight(6),
    },

    bellButton: {
        position: 'absolute',
        right: scaleWidth(20),
        top: scaleHeight(16),
        padding: scaleHeight(4),
    },

    alarmRowExpanded: {
        marginHorizontal: scaleWidth(20),
        marginTop: scaleHeight(12),
        padding: scaleHeight(16),
        borderRadius: scaledSize(12),
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(1) },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: scaledSize(12),
        padding: scaleHeight(24),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(2) },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    modalTitle: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        color: '#333',
    },
    modalTitle2: {
        fontSize: scaledSize(18),
        marginBottom: scaleHeight(18),
        fontWeight: 'bold',
        color: '#333',
    },

    modalCloseButton: {
        marginTop: scaleHeight(24),
        backgroundColor: '#eee',
        paddingHorizontal: scaleWidth(16),
        paddingVertical: scaleHeight(8),
        borderRadius: scaledSize(8),
    },

    modalCloseText: {
        fontSize: scaledSize(14),
        color: '#333',
    },

    scoreRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    alarmModalCard: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: scaledSize(16),
        padding: scaleHeight(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(2) },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        alignItems: 'center',
    },

    modalRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: scaleHeight(6),
    },

    modalLabel: {
        fontSize: scaledSize(18),
        color: '#333',
        fontWeight: '500',
        marginBottom: scaleHeight(10),
    },

    timeSelector: {
        paddingVertical: scaleHeight(6),
        paddingHorizontal: scaleWidth(14),
        borderRadius: scaledSize(6),
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#f5f5f5',
    },

    timeSelectorText: {
        fontSize: scaledSize(15),
        color: '#007AFF',
    },

    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: scaleHeight(24),
        width: '100%',
    },

    cancelButton: {
        flex: 1,
        padding: scaleHeight(10),
        borderRadius: scaledSize(8),
        borderWidth: 1,
        borderColor: '#ccc',
        marginRight: scaleWidth(8),
        alignItems: 'center',
    },

    saveButton: {
        flex: 1,
        padding: scaleHeight(10),
        borderRadius: scaledSize(8),
        backgroundColor: '#4CAF50',
        alignItems: 'center',
    },

    cancelButtonText: {
        color: '#555',
        fontSize: scaledSize(15),
    },

    saveButtonText: {
        color: '#fff',
        fontSize: scaledSize(15),
        fontWeight: 'bold',
    },

    prevQuizButton: {
        marginTop: scaleHeight(10),
        paddingVertical: scaleHeight(6),
        paddingHorizontal: scaleWidth(14),
        backgroundColor: '#f0f0f0',
        borderRadius: scaledSize(8),
        borderWidth: 1,
        borderColor: '#ccc',
    },

    prevQuizButtonText: {
        fontSize: scaledSize(14),
        color: '#333',
        textAlign: 'center',
    },

    prevQuizFloatingButton: {
        padding: scaleHeight(4),
    },

    prevQuizFloatingText: {
        fontSize: scaledSize(12),
        color: '#888',
        textDecorationLine: 'underline',
    },

    modalCloseIcon: {
        position: 'absolute',
        top: scaleHeight(18),
        right: scaleWidth(18),
        padding: scaleHeight(4),
        zIndex: 10,
    },

    modalFooterButton: {
        marginTop: scaleHeight(16),
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fafafa',
        paddingVertical: scaleHeight(10),
        paddingHorizontal: scaleWidth(20),
        borderRadius: scaledSize(8),
    },

    modalFooterButtonText: {
        fontSize: scaledSize(15),
        fontWeight: 'bold',
        color: '#333',
    },

    highlightCorrectBorder: {
        borderColor: '#4CAF50',
        borderWidth: 3,
    },

    quizSectionHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: scaleHeight(6),
        marginBottom: scaleHeight(12),
    },

    quizSectionHeaderText: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        color: '#2a2a2a',
    },

    quizCard: {
        backgroundColor: '#fdfdfd',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: scaledSize(10),
        padding: scaleHeight(12),
        marginBottom: scaleHeight(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(1) },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },

    quizTitle: {
        fontSize: scaledSize(16),
        fontWeight: '600',
        marginBottom: scaleHeight(12),
        color: '#333',
    },

    quizMeaning: {
        fontSize: scaledSize(14),
        color: '#444',
        marginBottom: scaleHeight(2),
    },

    quizExample: {
        fontSize: scaledSize(13),
        color: '#666',
        fontStyle: 'italic',
    },

    optionText: {
        fontSize: scaledSize(14), // 기존보다 약간 크게 (기본 13~14 예상)
        color: '#333',
    },

    calendarContainer: {
        borderRadius: scaledSize(10),
        borderWidth: 1,
        borderColor: '#ccc',
        padding: scaleHeight(8),
        marginBottom: scaleHeight(16),
        backgroundColor: '#fff',
    },

    buttonContainer: {
        alignItems: 'flex-end',
        marginHorizontal: scaleWidth(16),
        marginTop: scaleHeight(3),
    },

    resetButton: {
        backgroundColor: '#eee',
        paddingVertical: scaleHeight(4),
        paddingHorizontal: scaleWidth(10),
        borderRadius: scaledSize(6),
        borderWidth: 1,
        borderColor: '#ccc',
    },

    iconSpacing: {
        marginRight: scaleWidth(4),
    },

    rightAlignedRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginHorizontal: scaleWidth(16),
    },

    completedTextWrapper: {
        alignItems: 'center',
        marginTop: scaleHeight(24),
    },

    completedTitle: {
        fontSize: scaledSize(16),
        color: '#444',
        fontWeight: '600',
        marginBottom: scaleHeight(6),
        textAlign: 'center',
    },

    completedScore: {
        marginTop: scaleHeight(8),
        fontSize: scaledSize(15),
        color: '#2e7d32',
        fontWeight: 'bold',
        marginBottom: scaleHeight(6),
        textAlign: 'center',
    },

    underline: {
        textDecorationLine: 'underline',
    },

    reviewToggleButton: {
        marginTop: scaleHeight(10),
        marginBottom: scaleHeight(10),
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: scaleHeight(10),
        paddingHorizontal: scaleWidth(16),
        borderRadius: scaledSize(20),
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleHeight(1) },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    acodianTxt: { fontSize: 14, fontWeight: '600', color: '#333' },

    reviewList: {
        marginTop: scaleHeight(12),
        maxHeight: screenHeight * 0.42,
    },

    modalNotice: {
        fontSize: scaledSize(13),
        color: '#999',
        marginTop: scaleHeight(4),
        marginBottom: scaleHeight(15),
        textAlign: 'center',
    },

    quizGroup: {
        marginBottom: scaleHeight(24),
    },

    dayOfWeekText: {
        color: '#007AFF',
    },

    scrollView: {
        maxHeight: scaleHeight(540),
        width: '100%',
    },

    scrollContent: {
        paddingBottom: scaleHeight(20),
    },

    emptyView: {
        paddingVertical: scaleHeight(40),
        alignItems: 'center',
    },

    emptyText: {
        fontSize: scaledSize(15),
        color: '#999',
    },
    bellWrapper: {
        width: scaleWidth(28),
        height: scaleWidth(28),
        borderRadius: scaleWidth(14),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DAA520', // 골드 테두리 (GoldenRod)
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: scaleHeight(6),
    },
    bullet: {
        fontSize: scaledSize(14),
        color: '#4CAF50',
        marginRight: scaleWidth(8),
        lineHeight: scaledSize(20),
    },
    bulletText: {
        fontSize: scaledSize(14),
        color: '#555',
        flexShrink: 1,
        lineHeight: scaledSize(20),
    },
    alarmRow2: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedHourText: {
        marginLeft: scaleWidth(20),
        fontSize: scaledSize(14),
        color: '#007AFF',
        fontWeight: 'bold',
    },
    hourScrollContainer: {
        paddingVertical: scaleHeight(8),
    },
    hourButton: {
        paddingVertical: scaleHeight(10),
        paddingHorizontal: scaleWidth(16),
        marginRight: scaleWidth(8),
        borderRadius: scaledSize(20),
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#f0f0f0',
    },
    hourButtonSelected: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    hourText: {
        fontSize: scaledSize(14),
        fontWeight: 'bold',
        color: '#333',
    },
    hourTextSelected: {
        color: '#fff',
    },

    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: scaleWidth(16),
        marginTop: scaleHeight(4),
    },

    leftButton: {
        padding: scaleHeight(4),
    },

    rightButton: {
        padding: scaleHeight(4),
    },
    leftButtonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    rightButtonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    buttonText: {
        fontSize: scaledSize(12),
        color: '#888',
        textDecorationLine: 'underline',
    },

    todayReviewBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: scaleWidth(12),
        padding: scaleHeight(12),
        marginHorizontal: scaleWidth(16),
        backgroundColor: '#fff',
    },

});
