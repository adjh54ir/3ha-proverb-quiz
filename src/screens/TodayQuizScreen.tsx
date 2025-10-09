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
	ScrollView,
	Modal,
	NativeSyntheticEvent,
	NativeScrollEvent,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee, { TimestampTrigger, TriggerType, AndroidImportance, RepeatFrequency } from '@notifee/react-native';
import DatePicker from 'react-native-date-picker';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { useFocusEffect } from '@react-navigation/native';
import { MainDataType } from '@/types/MainDataType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { Paths } from '@/navigation/conf/Paths';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import DateUtils from '@/utils/DateUtils';
import FastImage from 'react-native-fast-image';
import ProverbServices from '@/services/ProverbServices';
import ProverbDetailModal from './modal/ProverbDetailModal';

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

	const scrollRef = useRef<ScrollView>(null); // 전체 스크롤
	const hourScrollRef = useRef<ScrollView>(null); // 알람 시간 선택 스크롤
	const modalScrollRef = useRef<ScrollView>(null); // 모달 내부 스크롤
	// 퀴즈(id)별 랜덤 이미지 매핑
	const [randImageMap, setRandImageMap] = useState<{ [id: number]: any }>({});

	const [imageModalVisible, setImageModalVisible] = useState(false);
	const [selectedImage, setSelectedImage] = useState<any>(null);
	const [selectedDog, setSelectedDog] = useState<MainDataType.Proverb | null>(null);

	const [isTodayUnsolved, setIsTodayUnsolved] = useState(false);
	const [hasStarted, setHasStarted] = useState(false);

	// TodayQuizScreen 컴포넌트 상단
	const [detailModalVisible, setDetailModalVisible] = useState(false);
	const [detailQuiz, setDetailQuiz] = useState<MainDataType.Proverb | null>(null);

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
	const [progressPercent, setProgressPercent] = useState(quizList.length > 0 ? (currentIndex / quizList.length) * 100 : 0);
	const labelColors = ['#1abc9c', '#3498db', '#9b59b6', '#e67e22'];
	const [showAlarmModal, setShowAlarmModal] = useState(false);

	const [showScrollTop, setShowScrollTop] = useState(false);

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
	const [isResultReady, setIsResultReady] = useState(false);

	const { getLocalDateString, getLocalParamDateToString } = DateUtils;

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	useFocusEffect(
		useCallback(() => {
			const resetIfUnsolved = async () => {
				const todayStr = getLocalParamDateToString(todayDate);
				const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
				const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];
				const todayData = storedArr.find((q) => getLocalParamDateToString(q.quizDate) === todayStr);

				// 아직 퀴즈를 다 안 푼 경우만 초기화 실행
				if (todayData && Object.keys(todayData.answerResults ?? {}).length < 5) {
					await handleResetTodayQuiz();
				}
			};

			resetIfUnsolved();

			loadSetting();
			getScheduledAlarmTime();
			scrollRef.current?.scrollTo({ y: 0, animated: false });
		}, [todayDate]),
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

	// 👇 현재 문제 인덱스가 변경되면 ScrollView를 최상단으로 이동
	useEffect(() => {
		setTimeout(() => {
			scrollRef.current?.scrollTo({ y: 0, animated: true });
		}, 50);
	}, [currentIndex]);

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
			// 👇 상태 즉시 반영
			setQuizList(newData.todayQuizIdArr.map((id) => ProverbServices.selectProverbByIds([id])[0]));
			generateQuizOptions(newData.todayQuizIdArr.map((id) => ProverbServices.selectProverbByIds([id])[0]));
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
					value: isCorrect ? item.proverb : '틀린 보기',
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
	const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 100);
	};

	const initQuiz = async () => {
		const todayISO = getLocalDateString();

		if (showTodayReview) {
			setShowTodayReview(false);
		} // 👈 이 줄 추가

		const settings = await notifee.getNotificationSettings();
		const hasPermission = settings.authorizationStatus === 1;

		if (hasPermission) {
			const todayStr = getLocalDateString();
			const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
			const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];
			// 여기서 KST 기준 비교로 todayData 찾기
			const todayData = storedArr.find((q) => getLocalParamDateToString(q.quizDate) === todayStr); // ✅ 중요

			// ✅ 오늘 문제를 아직 안 푼 상태 판별
			const unsolved = !!todayData && (!todayData.answerResults || Object.keys(todayData.answerResults).length === 0);

			setIsTodayUnsolved(unsolved && hasPermission);

			const shouldGenerateNewQuiz =
				!todayData || todayData.todayQuizIdArr.length < 5 || getLocalParamDateToString(todayData.quizDate) !== getLocalParamDateToString(todayDate);

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
					prevQuizIdArr: storedArr.length > 0 ? storedArr[storedArr.length - 1].todayQuizIdArr : [],
				};
				await saveTodayQuizToStorage(newQuizData);
				setQuizList(finalQuizList);
				generateQuizOptions(finalQuizList);
			} else {
				// 기존 퀴즈 복원
				const finalQuizList = ProverbServices.selectProverbByIds(todayData.todayQuizIdArr);
				// ⚠️ 매칭된 문제 개수가 5개가 아니면 새로 생성
				if (!finalQuizList || finalQuizList.length < 5) {
					console.warn('⚠️ 오늘의 퀴즈 데이터 누락 → 새 퀴즈 생성');
					const newQuiz = getTodayQuiz();
					setQuizList(newQuiz);

					const newQuizData: MainDataType.TodayQuizList = {
						quizDate: getLocalDateString(),
						isCheckedIn: todayData?.isCheckedIn ?? false,
						todayQuizIdArr: newQuiz.map((q) => q.id),
						correctQuizIdArr: [],
						worngQuizIdArr: [],
						answerResults: {},
						selectedAnswers: {},
					};
					await saveTodayQuizToStorage(newQuizData);
					generateQuizOptions(newQuiz);
				} else {
					setQuizList(finalQuizList);
					generateQuizOptions(finalQuizList);
				}
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
					const todayQuizData: MainDataType.TodayQuizList = {
						quizDate: new Date().toISOString(), // ✅ ISO 저장
						isCheckedIn: false,
						todayQuizIdArr: newQuiz.map((q) => q.id),
						correctQuizIdArr: [],
						worngQuizIdArr: [],
						answerResults: {},
						selectedAnswers: {},
					};

					await saveTodayQuizToStorage(todayQuizData);

					setQuizList(newQuiz);
					generateQuizOptions(newQuiz);

					setHasStarted(true); // ✅ 바로 문제 시작
				}

				await scheduleDailyQuizNotification(tempAlarmTime);
				setIsAlarmEnabled(true);
				await getScheduledAlarmTime();

				// ✅ 알림 설정 완료 팝업 추가
				const hour = alarmTime.getHours().toString().padStart(2, '0');
				Alert.alert('⏰ 알림 설정 완료!', `매일 ${hour}시에 오늘의 퀴즈가 찾아갈게요!\n놓치지 말고 꼭 참여해보세요 😊`);
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

		// 안전 비교(공백/유니코드 공백/줄바꿈 제거)
		const normalize = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();
		const isCorrect = normalize(selected) === normalize(correct);

		const options = quizOptionsMap[quizId] || [];
		const selectedIndex = options.findIndex((opt) => normalize(opt) === normalize(selected));

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
			setTimeout(() => setHighlightAnswerId(null), 2000);
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
			// @ts-ignore
			storedArr[todayIndex] = updatedToday;
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(storedArr));
		}
		// handleAnswer 내부 마지막 부분에 추가
		setTimeout(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		}, 200); // 약간의 딜레이 주면 UI 반응이 자연스러워짐
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

		// ✅ 여기서 핵심!
		setHasStarted(false); // 👉 다시 시작 전 상태로 전환
		setShowTodayReview(false); // 👉 리뷰 모드 닫기

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

	const handleImagePress = (image: any, item: MainDataType.Proverb) => {
		setSelectedImage(image);
		setSelectedDog(item);
		setImageModalVisible(true);
	};

	const handleScrollToTop = () => {
		if (scrollRef.current) {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollTo({ y: 0, animated: true });
			});
		}
	};
	const getFieldColor = (field: string) => {
		const categoryColorMap: Record<string, string> = {
			'운/우연': '#00cec9', // 청록
			인간관계: '#6c5ce7', // 보라
			'세상 이치': '#fdcb6e', // 연노랑
			'근면/검소': '#e17055', // 주황
			'노력/성공': '#00b894', // 짙은 청록
			'경계/조심': '#d63031', // 빨강
			'욕심/탐욕': '#e84393', // 핫핑크
			'배신/불신': '#2d3436', // 짙은 회색
		};

		return categoryColorMap[field] || '#b2bec3'; // 기본 회색
	};
	const getLevelColor = (levelName: string) => {
		const levelColorMap: Record<string, string> = {
			'아주 쉬움': '#dfe6e9',
			쉬움: '#74b9ff',
			보통: '#0984e3',
			어려움: '#2d3436',
		};

		return levelColorMap[levelName] || '#b2bec3'; // 기본 회색
	};

	const renderItem = ({ item }: { item: MainDataType.Proverb }) => {
		const options = quizOptionsMap[item.id] || [];
		const result = answerResults[item.id];
		const selected = selectedAnswers[item.id];
		const getChoiceLabel = (index: number) => String.fromCharCode(65 + index);
		const isQuizCompleted = Object.keys(answerResults).length === quizList.length;

		// ✅ 전체 풀이 완료 + 해당 문항에 대한 선택이 끝난 상태를 해설 표시 조건으로 사용
		const showExplanation = result !== undefined && isQuizCompleted;

		return (
			<View style={styles.quizBox}>
				{showExplanation ? (
					<View
						style={[
							styles.answerExplainBox,
							result ? styles.answerExplainCorrect : styles.answerExplainWrong, // ✅ 추가
						]}>
						{/* 해설 헤더 */}
						<View style={styles.explainHeaderRow}>
							<Text style={styles.explainIdiom}>{item.proverb}</Text>
							<View style={[styles.resultPill, result ? styles.pillCorrect : styles.pillWrong]}>
								<Text style={styles.resultPillText}>{result ? '정답' : '오답'}</Text>
							</View>
						</View>

						{/* 정답 의미 */}
						<View style={styles.sectionCard}>
							<View style={styles.sectionHeaderRow}>
								<IconComponent name="check-circle" type="FontAwesome" size={14} color="#2e7d32" style={styles.sectionHeaderIcon} />
								<Text style={styles.sectionHeaderText}>정답</Text>
							</View>
							<Text style={styles.correctMeaningValue}>- {item.longMeaning}</Text>
						</View>

						{/* 예문 */}
						{Array.isArray(item.example) && item.example.length > 0 && (
							<View style={styles.sectionCard}>
								<View style={styles.sectionHeaderRow}>
									<Text style={styles.sectionHeaderText}>✍️ 예문</Text>
								</View>

								<View style={{ marginTop: scaleHeight(4) }}>
									{item.example.map((ex, idx) => (
										<View key={`${item.id}-ex-${idx}`} style={styles.sectionBulletRow}>
											<Text style={styles.sectionBulletDot}>•</Text>
											<Text style={styles.sectionBulletText}>{ex}</Text>
										</View>
									))}
								</View>
							</View>
						)}
						{/* 해설 하단: 자세히 보기 버튼 */}
						<TouchableOpacity
							style={styles.detailButton}
							onPress={() => {
								setDetailQuiz(item);
								setDetailModalVisible(true);
							}}>
							<IconComponent name="search" type="FontAwesome" size={14} color="#333" style={{ marginRight: 6 }} />
							<Text style={styles.detailButtonText}>자세히 보기</Text>
						</TouchableOpacity>
					</View>
				) : (
					<>
						{/* 👉 문제 텍스트 출력 추가 */}
						<Text style={styles.questionCombined}>
							<Text style={styles.questionMain}>{item.proverb}</Text>
							{!isQuizCompleted && <Text style={styles.questionSub}> 의미는?</Text>}
						</Text>

						{result !== undefined && (
							<View style={{ alignItems: 'center', marginTop: scaleHeight(-6), marginBottom: scaleHeight(12) }}>
								<Text style={[styles.questionResultInline, result ? styles.correct : styles.wrong]}>{result ? '⭕ 정답!' : '❌ 오답입니다.'}</Text>
							</View>
						)}

						{options.map((option, idx) => {
							const isAnswered = result !== undefined;
							const isCorrectOption = option === item.longMeaning;
							const isUserSelected = selected?.value === option;
							const shouldHighlight = highlightAnswerId === item.id && isCorrectOption;

							return (
								<TouchableOpacity
									key={idx}
									onPress={() => handleAnswer(item.id, option, item.longMeaning)}
									disabled={isAnswered}
									style={[
										styles.optionBase,
										isUserSelected && (isCorrectOption ? styles.correctOption : styles.wrongOption),
										shouldHighlight && styles.highlightCorrectBorder,
									]}>
									<Text style={[styles.optionTextBase, isUserSelected && (isCorrectOption ? styles.correctText : styles.wrongText)]}>
										<Text style={{ color: labelColors[idx % labelColors.length], fontWeight: 'bold' }}>{String.fromCharCode(65 + idx)}.</Text> {option}
									</Text>
								</TouchableOpacity>
							);
						})}
						{result !== undefined && (
							<TouchableOpacity
								style={styles.nextButton}
								onPress={() => {
									if (currentIndex < quizList.length - 1) {
										// 👉 다음 문제로 이동
										setCurrentIndex((prev) => prev + 1);
										scrollRef.current?.scrollTo({ y: 0, animated: true });
									} else {
										// 👉 마지막 문제일 때는 바로 결과 전환 ❌
										// "결과 보기" 버튼만 표시 → 눌렀을 때 실행
										// 별도 state 추가
										setIsResultReady(true);
									}
								}}>
								<Text style={styles.nextButtonText}>{currentIndex < quizList.length - 1 ? '다음 문제' : '결과 보기'}</Text>
							</TouchableOpacity>
						)}
					</>
				)}
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			<ScrollView
				ref={scrollRef}
				onScroll={onScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: scaleHeight(40),
				}}>
				{isAlarmEnabled && (
					<View style={styles.buttonRow}>
						<View style={styles.leftButtonWrapper}>
							{/* <TouchableOpacity onPress={handleResetTodayQuiz}>
								<View style={[styles.buttonContent, { marginLeft: scaleWidth(12) }]}>
									<IconComponent name="rotate-left" type="FontAwesome" size={13} color="#888" style={styles.iconSpacing} />
									<Text style={styles.buttonText}>오늘 문제 다시 풀기</Text>
								</View>
							</TouchableOpacity> */}
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
									<Text style={styles.selectedHourText}>{tempSelectedHour.toString().padStart(2, '0')}시</Text>
									<Switch
										value={isAlarmEnabled}
										onValueChange={handleToggleAlarm}
										trackColor={{ false: '#767577', true: '#81b0ff' }}
										thumbColor={isAlarmEnabled ? '#f5dd4b' : '#f4f3f4'}
										ios_backgroundColor="#3e3e3e"
									/>
								</View>

								<ScrollView
									ref={hourScrollRef}
									key={currentIndex}
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
												style={[styles.hourButton, isSelected && styles.hourButtonSelected]}>
												<Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>{hour.toString().padStart(2, '0')}시</Text>
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
										<IconComponent name="bell" type="FontAwesome" size={15} color="#FFC107" />
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
							{!hasStarted && isTodayUnsolved ? (
								// 👉 아직 시작 안 했을 때는 "퀴즈 도착 카드"
								<View style={styles.emptyQuizBox}>
									<IconComponent name="envelope" type="FontAwesome" size={48} color="#3B82F6" />
									<Text style={styles.emptyQuizTitle}>오늘의 퀴즈가 도착했습니다 ✨</Text>
									<Text style={styles.emptyQuizSubtitle}>지금 바로 시작해 보세요!</Text>

									<TouchableOpacity
										style={styles.startQuizButton}
										onPress={async () => {
											if (quizList.length === 0) {
												await initQuiz();
											}
											setHasStarted(true); // ✅ 시작 상태 켜기
											setCurrentIndex(0);
											scrollRef.current?.scrollTo({ y: 0, animated: true });
										}}>
										<Text style={styles.startQuizButtonText}>오늘의 퀴즈 시작</Text>
									</TouchableOpacity>
								</View>
							) : !isQuizCompleted ? (
								// 👉 시작했고 아직 안 끝났을 때는 문제 화면
								<View style={{ paddingBottom: scaleHeight(16) }}>{renderItem({ item: quizList[currentIndex] })}</View>
							) : (
								// 👉 다 끝난 후 완료 화면
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
										<View style={styles.reviewList}>
											{quizList.map((item) => (
												<View key={item.id}>{renderItem({ item })}</View>
											))}
										</View>
									)}
								</>
							)}
						</View>
					)}
					{/* ❗ fallback UI 추가 */}
					{isAlarmEnabled && quizList.length === 0 && (
						<View style={{ padding: 20, alignItems: 'center' }}>
							<Text style={{ color: '#888', fontSize: 14 }}>퀴즈를 준비 중입니다...</Text>
							<ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />
							<TouchableOpacity onPress={initQuiz} style={{ marginTop: 10 }}>
								<Text style={{ color: '#007AFF' }}>🔄 다시 불러오기</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ScrollView>

			{/* {showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={handleScrollToTop}>
					<IconComponent type="fontawesome6" name="arrow-up" size={20} color="#fff" />
				</TouchableOpacity>
			)} */}
			<Modal visible={showAlarmModal} transparent animationType="fade" onRequestClose={() => setShowAlarmModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.alarmModalCard}>
						<Text style={styles.modalTitle2}>🔔 오늘의 퀴즈 알림 설정</Text>

						<View style={styles.modalRow}>
							<Text style={styles.modalLabel}>알림 사용</Text>

							<Switch
								value={tempIsAlarmEnabled}
								onValueChange={setTempIsAlarmEnabled}
								trackColor={{ false: '#767577', true: '#81b0ff' }}
								thumbColor={tempIsAlarmEnabled ? '#f5dd4b' : '#f4f3f4'}
							/>
						</View>

						{/* 알림 시간은 스위치가 켜졌을 때만 보이게 */}
						{tempIsAlarmEnabled && (
							<View style={styles.modalRow}>
								<View style={{ width: '100%', marginTop: scaleHeight(12) }}>
									<View style={styles.timePickerRow}>
										<Text style={styles.modalLabel}>알림 시간</Text>
										<Text style={styles.selectedHourText}>{tempSelectedHour.toString().padStart(2, '0')}시</Text>
									</View>

									<ScrollView
										ref={modalScrollRef}
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
													style={[styles.hourButton, isSelected && styles.hourButtonSelected]}>
													<Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>{hour.toString().padStart(2, '0')}시</Text>
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

									const hour = finalAlarmTime.getHours().toString().padStart(2, '0');
									Alert.alert('⏰ 알림 저장 완료!', `${hour}시에 오늘의 퀴즈 알람이 지정되었습니다.`);

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
									// ✅ 저장 완료 알림 추가
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
			<Modal visible={showPrevQuizModal} transparent animationType="fade" onRequestClose={() => setShowPrevQuizModal(false)}>
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

						<ScrollView ref={modalScrollRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
							{groupedPrevQuizzes.length === 0 ? (
								<View style={styles.emptyView}>
									<Text style={styles.emptyText}>오늘의 퀴즈를 아직 풀지 않았어요.</Text>
								</View>
							) : (
								groupedPrevQuizzes.map((group) => {
									const { formattedDate, dayOfWeek } = formatQuizDate(group.date);
									return (
										<View key={group.date} style={styles.quizGroup}>
											{/* 섹션 헤더 */}
											<View style={styles.historySectionHeader}>
												<View style={styles.historySectionHeaderLeft}>
													<IconComponent name="calendar" type="FontAwesome" size={16} color="#4CAF50" style={{ marginRight: scaleWidth(6) }} />
													<Text style={styles.historySectionTitle}>
														{formattedDate} ({dayOfWeek}) 퀴즈
													</Text>
												</View>
												<View style={styles.historyDateChip}>
													<Text style={styles.historyDateChipText}>
														({Object.values(group.answerResults).filter((v) => v === true).length}/{group.quizList.length})
													</Text>
												</View>
											</View>

											{group.quizList.map((item) => {
												const isCorrect = group.answerResults?.[item.id] === true;
												const isWrong = group.answerResults?.[item.id] === false;

												return (
													<View key={item.id} style={styles.historyCard}>
														{/* 좌측 컬러바 + 헤더 */}
														<View style={[styles.historyColorBar, isCorrect ? styles.historyBarCorrect : styles.historyBarWrong]} />
														<View style={styles.historyCardBody}>
															{/* 타이틀 + 정오답 배지 */}
															<View style={styles.historyHeaderRow}>
																<Text style={styles.historyIdiom}>{item.proverb}</Text>
																<View style={[styles.resultPill, isCorrect ? styles.pillCorrect : styles.pillWrong]}>
																	<Text style={styles.resultPillText}>{isCorrect ? '정답' : '오답'}</Text>
																</View>
															</View>

															{/* 의미 */}
															<View style={styles.historyMeaningBox}>
																<Text style={styles.historyMeaningLabel}>정답</Text>
																<Text style={styles.historyMeaningValue}>- {item.longMeaning}</Text>
															</View>

															{/* 예문(exampleKr 전체) */}
															{Array.isArray(item.example) && item.example.length > 0 && (
																<View style={{ marginTop: scaleHeight(10) }}>
																	<View style={styles.historySubTitleRow}>
																		<Text style={styles.historySubTitle}>예문</Text>
																	</View>
																	<View style={styles.exampleList}>
																		{item.example.map((ex, idx) => (
																			<View key={`${item.id}-ex-${idx}`} style={styles.bulletItem}>
																				<Text style={styles.bulletDot}>•</Text>
																				<Text style={styles.exampleText}>{ex}</Text>
																			</View>
																		))}
																	</View>
																</View>
															)}
														</View>
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

			{/* 상세 모달 */}
			<ProverbDetailModal visible={detailModalVisible} proverb={detailQuiz} onClose={() => setDetailModalVisible(false)} />

			{/* <IdiomDetailModal idiom={detailQuiz} visible={detailModalVisible} onClose={() => setDetailModalVisible(false)} /> */}
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
		marginBottom: scaleHeight(5),
	},
	wrong: {
		color: 'red',
		fontWeight: 'bold',
		marginBottom: scaleHeight(5),
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
		marginTop: scaleHeight(5),
		marginBottom: scaleHeight(16),
	},
	questionMain: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		color: '#3B82F6', // ✅ 파란색 (DodgerBlue)
		marginBottom: scaleHeight(10),
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
		marginTop: scaleHeight(6),
	},

	correctMeaning: {
		fontSize: scaledSize(16),
		color: '#333',
		marginTop: scaleHeight(8),
		marginBottom: scaleHeight(6),
	},

	correctMeaningHighlight: {
		fontWeight: 'bold',
		color: '#2e7d32',
		fontSize: scaledSize(15),
	},

	correctMeaningHighlight2: {
		fontWeight: 'bold',
		color: '#2e7d32',
		fontSize: scaledSize(15),
		marginBottom: scaleHeight(6),
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

	acodianTxt: { fontSize: scaledSize(14), fontWeight: '600', color: '#333' },

	reviewList: {
		marginTop: scaleHeight(12),
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
		justifyContent: 'space-between', // 좌우 끝으로 배치
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
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		borderRadius: scaleWidth(8),
		borderWidth: 1,
		borderColor: '#ccc',
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	buttonText: {
		fontSize: scaledSize(13),
		color: '#333',
		fontWeight: '600',
	},
	todayReviewBox: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: scaleWidth(12),
		padding: scaleHeight(12),
		marginHorizontal: scaleWidth(16),
		backgroundColor: '#fff',
	},
	continent: {
		fontSize: scaledSize(12),
		color: '#16a085',
		marginTop: 2,
	},
	imageWrapper: {
		position: 'relative',
	},

	image: {
		width: scaleWidth(90), // 기존 70 → 확대
		height: scaleHeight(90), // 기존 70 → 확대
		borderRadius: scaleWidth(10),
		marginRight: scaleWidth(10),
	},

	zoomIconContainer: {
		position: 'absolute',
		bottom: scaleHeight(4),
		right: scaleWidth(8),
		backgroundColor: 'rgba(255, 255, 255, 0.85)',
		borderRadius: scaleWidth(10),
		padding: scaleWidth(3),
	},
	fullscreenOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.95)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fullscreenImage: {
		width: '100%',
		height: '100%',
	},
	fullscreenCloseButton: {
		position: 'absolute',
		top: scaleHeight(40),
		right: scaleWidth(20),
		backgroundColor: 'rgba(0,0,0,0.5)',
		padding: scaleWidth(8),
		borderRadius: scaleWidth(20),
	},
	imageSourceContainer: {
		position: 'absolute',
		bottom: scaleHeight(20),
		left: scaleWidth(16),
		right: scaleWidth(16),
		alignItems: 'center',
	},

	imageSourceText: {
		color: '#bdc3c7',
		fontSize: scaledSize(11),
		textAlign: 'center',
	},

	imageSourceLink: {
		color: '#3498db',
		textDecorationLine: 'underline',
	},
	imageHintText: {
		fontSize: scaledSize(10),
		color: '#888',
		marginBottom: scaleHeight(12),
	},

	dogNameText: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(6),
	},
	optionBase: {
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(24), // ✅ 둥근 버튼
		backgroundColor: '#f0f0f0',
		borderWidth: 1,
		borderColor: '#ccc',
		marginBottom: scaleHeight(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
	},

	optionTextBase: {
		fontSize: scaledSize(14),
		color: '#333',
		fontWeight: '500',
		textAlign: 'left',
	},

	// 변경 → 테두리만 강조
	correctOption: {
		backgroundColor: '#f0f0f0', // 기본 배경 유지
		borderColor: '#4CAF50',
		borderWidth: 3, // 테두리 두께 강조
	},
	wrongOption: {
		backgroundColor: '#f0f0f0', // 기본 배경 유지
		borderColor: '#F44336',
		borderWidth: 3,
	},

	correctText: {
		color: '#4CAF50',
		fontWeight: 'bold',
	},
	wrongText: {
		color: '#F44336',
		fontWeight: 'bold',
	},
	hintText: {
		fontSize: scaledSize(13),
		color: '#444',
		marginTop: scaleHeight(2),
	},
	hintHighlight: {
		fontWeight: 'bold',
		color: '#2c3e50',
	},
	dogInfoBox: {
		backgroundColor: '#f8f9fa',
		padding: scaleHeight(14),
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: '#ddd',
		marginBottom: scaleHeight(12),
	},
	dogInfoTitle: {
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(10),
	},
	dogInfoRow: {
		flexDirection: 'row',
		marginBottom: scaleHeight(6),
		flexWrap: 'wrap',
	},
	dogInfoLabel: {
		fontSize: scaledSize(13),
		color: '#555',
		width: scaleWidth(60),
		fontWeight: 'bold',
	},
	dogInfoValue: {
		fontSize: scaledSize(14),
		marginBottom: scaleHeight(8),
		color: '#333',
		flexShrink: 1,
	},
	questionResultInline: {
		textAlign: 'center',
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		marginLeft: scaleWidth(6),
		lineHeight: scaledSize(20), // ✅ fontSize보다 조금 크게
	},
	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(16),
		bottom: scaleHeight(16),
		backgroundColor: '#2196F3',
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
	},
	catInfoBox: {
		width: '100%',
		backgroundColor: '#fff',
		padding: scaleHeight(12),
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#eee',
		marginBottom: scaleHeight(6),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
	},
	catInfoTitle: {
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(10),
	},
	catInfoRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginVertical: scaleHeight(3),
		flexWrap: 'nowrap', // ✅ 줄바꿈 방지 (라벨+값을 같은 줄에 고정)
	},
	catInfoIcon: {
		marginRight: scaleWidth(6),
		marginTop: scaleHeight(2),
	},
	catInfoLabel: {
		fontSize: scaledSize(13),
		color: '#666',
		fontWeight: '600',
		width: scaleWidth(70),
	},
	catInfoValue: {
		fontSize: scaledSize(13),
		color: '#222',
		flexShrink: 1,
	},
	circleImageWrapper: {
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	circleImage: {
		width: scaleWidth(88), // 크기는 취향에 맞게 조절
		height: scaleWidth(88),
		borderRadius: scaleWidth(44),
		borderWidth: 2,
		borderColor: '#eee',
		// 살짝 그림자
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 3,
	},
	answerExplainBox: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: scaledSize(10),
		padding: scaleHeight(12),
		backgroundColor: '#fafafa',
		marginTop: scaleHeight(6),
	},
	answerExplainCorrect: {
		backgroundColor: 'rgba(76, 175, 80, 0.12)', // 연한 초록
		borderColor: '#4CAF50',
	},

	answerExplainWrong: {
		backgroundColor: 'rgba(244, 67, 54, 0.12)', // 연한 빨강
		borderColor: '#F44336',
	},

	answerBadge: {
		fontSize: scaledSize(15),
		fontWeight: 'bold',
	},
	// 해설 헤더: 속담 + 배지
	explainHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(8),
	},

	explainIdiom: {
		flexShrink: 1,
		flexWrap: 'wrap', // 👉 줄바꿈 허용
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#3B82F6',
		lineHeight: scaledSize(24),
	},

	correctInline: {
		color: '#2e7d32',
		fontWeight: 'bold',
		fontSize: scaledSize(14),
	},

	wrongInline: {
		color: '#c62828',
		fontWeight: 'bold',
		fontSize: scaledSize(14),
	},

	// 정오답 배지(오른쪽)
	resultPill: {
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(16),
		borderWidth: 1,
	},
	pillCorrect: {
		backgroundColor: 'rgba(76, 175, 80, 0.12)', // 연녹
		borderColor: '#4CAF50',
	},
	pillWrong: {
		backgroundColor: 'rgba(244, 67, 54, 0.12)', // 연빨
		borderColor: '#F44336',
	},
	resultPillText: {
		fontSize: scaledSize(13),
		fontWeight: 'bold',
		color: '#2a2a2a',
	},

	// 구분선(선택)
	explainDivider: {
		height: 1,
		backgroundColor: '#eaeaea',
		marginVertical: scaleHeight(8),
	},

	// 정답 의미 라벨/값
	correctMeaningLabel: {
		fontSize: scaledSize(13),
		color: '#777',
		marginBottom: scaleHeight(4),
	},
	correctMeaningValue: {
		fontSize: scaledSize(15),
		color: '#2e7d32',
		fontWeight: 'bold',
		lineHeight: scaledSize(22),
	},
	// ✅ 추가 스타일
	historySectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: scaleHeight(6),
		marginBottom: scaleHeight(10),
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	historySectionHeaderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	historySectionTitle: {
		fontSize: scaledSize(16),
		fontWeight: '700',
		color: '#2a2a2a',
	},
	historyDateChip: {
		paddingVertical: scaleHeight(3),
		paddingHorizontal: scaleWidth(8),
		backgroundColor: '#F5F7FA',
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: scaleWidth(12),
	},
	historyDateChipText: {
		fontSize: scaledSize(11),
		color: '#667085',
	},

	historyCard: {
		flexDirection: 'row',
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e6e6e6',
		borderRadius: scaledSize(12),
		overflow: 'hidden',
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	historyColorBar: {
		width: scaleWidth(5),
	},
	historyBarCorrect: {
		backgroundColor: '#4CAF50',
	},
	historyBarWrong: {
		backgroundColor: '#F44336',
	},
	historyCardBody: {
		flex: 1,
		padding: scaleHeight(12),
	},

	historyHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	historyIdiom: {
		flex: 1,
		fontSize: scaledSize(16),
		fontWeight: '700',
		color: '#222',
		paddingRight: scaleWidth(10),
	},

	historyMeaningBox: {
		marginTop: scaleHeight(6),
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(8),
		backgroundColor: '#FAFAFA',
		borderWidth: 1,
		borderColor: '#eee',
	},
	historyMeaningLabel: {
		fontSize: scaledSize(12),
		color: '#777',
		marginBottom: scaleHeight(4),
	},
	historyMeaningValue: {
		fontSize: scaledSize(14),
		color: '#2e7d32',
		fontWeight: 'bold',
		lineHeight: scaledSize(20),
	},

	historySubTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	historySubTitle: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(13),
		fontWeight: '700',
		color: '#333',
	},

	phraseRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: scaleHeight(4),
		flexWrap: 'wrap',
	},
	phraseKr: {
		fontSize: scaledSize(13),
		color: '#222',
		fontWeight: '600',
	},
	phraseMean: {
		fontSize: scaledSize(13),
		color: '#444',
		flexShrink: 1,
	},

	exampleList: {
		marginTop: scaleHeight(4),
	},
	bulletItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: scaleHeight(4),
	},
	bulletDot: {
		fontSize: scaledSize(14),
		lineHeight: scaledSize(18),
		color: '#4CAF50',
		marginRight: scaleWidth(6),
	},
	exampleText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#555',
		lineHeight: scaledSize(18),
	},

	// 작은 점(정오답 배지 왼쪽)
	resultDot: {
		width: scaleWidth(8),
		height: scaleWidth(8),
		borderRadius: scaleWidth(4),
		marginRight: scaleWidth(6),
	},
	dotCorrect: { backgroundColor: '#4CAF50' },
	dotWrong: { backgroundColor: '#F44336' },
	sectionCard: {
		marginTop: scaleHeight(10),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		borderRadius: scaleWidth(10),
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#EAEAEA',
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	sectionHeaderIcon: {
		marginRight: scaleWidth(6),
	},
	sectionHeaderText: {
		fontSize: scaledSize(14),
		fontWeight: '700',
		color: '#222',
	},
	sectionTag: {
		marginLeft: 'auto',
		paddingVertical: scaleHeight(2),
		paddingHorizontal: scaleWidth(8),
		borderRadius: scaleWidth(10),
		backgroundColor: '#F0FDF4',
		borderWidth: 1,
		borderColor: '#DCFCE7',
	},
	sectionTagText: {
		fontSize: scaledSize(11),
		fontWeight: '700',
		color: '#166534',
	},

	// 어절 행
	sectionItemRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: scaleHeight(4),
		flexWrap: 'wrap',
	},
	sectionItemIndex: {
		fontSize: scaledSize(13),
		color: '#64748B',
		textAlign: 'left',
		marginRight: scaleWidth(6),
	},
	sectionItemKey: {
		fontSize: scaledSize(13),
		color: '#111827',
		fontWeight: '700',
	},
	sectionItemDash: {
		fontSize: scaledSize(13),
		color: '#9CA3AF',
	},
	sectionItemValue: {
		fontSize: scaledSize(13),
		color: '#374151',
		flexShrink: 1,
	},

	// 예문 불릿
	sectionBulletRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: scaleHeight(4),
	},
	sectionBulletDot: {
		fontSize: scaledSize(14),
		lineHeight: scaledSize(18),
		color: '#4CAF50',
		marginRight: scaleWidth(6),
	},
	sectionBulletText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#555',
		lineHeight: scaledSize(18),
	},
	detailButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: scaleHeight(12),
		paddingVertical: scaleHeight(8),
		borderRadius: scaleWidth(8),
		backgroundColor: '#f0f0f0',
		borderWidth: 1,
		borderColor: '#ddd',
	},
	detailButtonText: {
		fontSize: scaledSize(13),
		color: '#333',
		fontWeight: '600',
	},
	detailModalCard: {
		width: '85%',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(12),
		padding: scaleHeight(20),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	detailTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(10),
	},
	detailMeaning: {
		fontSize: scaledSize(15),
		color: '#2e7d32',
		fontWeight: '600',
	},
	detailSubTitle: {
		fontSize: scaledSize(14),
		fontWeight: '700',
		marginBottom: scaleHeight(4),
		color: '#333',
	},
	detailPhrase: {
		fontSize: scaledSize(13),
		color: '#444',
		marginBottom: scaleHeight(3),
	},
	detailExample: {
		fontSize: scaledSize(13),
		color: '#555',
		marginBottom: scaleHeight(3),
	},
	emptyQuizBox: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: scaleHeight(40),
		paddingHorizontal: scaleWidth(16),
	},
	emptyQuizTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#333',
		marginTop: scaleHeight(16),
	},
	emptyQuizSubtitle: {
		fontSize: scaledSize(14),
		color: '#777',
		marginTop: scaleHeight(6),
		marginBottom: scaleHeight(20),
		textAlign: 'center',
	},
	startQuizButton: {
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(24),
		borderRadius: scaleWidth(24),
	},
	startQuizButtonText: {
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#fff',
	},
	centerStartButton: {
		alignSelf: 'center',
		marginBottom: scaleHeight(8),
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(24),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	centerStartButtonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: 'bold',
	},
	nextButton: {
		marginTop: scaleHeight(12),
		alignSelf: 'center',
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(20),
	},
	nextButtonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: 'bold',
	},
});
