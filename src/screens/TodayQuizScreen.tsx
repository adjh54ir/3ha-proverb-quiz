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
	ActivityIndicator,
	Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { sampleSize, shuffle } from '@/utils/ArrayUtils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { useFocusEffect } from '@react-navigation/native';
import { MainDataType } from '@/types/MainDataType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { Paths } from '@/navigation/conf/Paths';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import DateUtils from '@/utils/DateUtils';
import ProverbServices from '@/services/ProverbServices';
import ProverbDetailModal from './modal/ProverbDetailModal';
import ProverbDetailContent from './common/ProverbDetailContent';
import NewBadgeModal from './modal/NewBadgeModal';
import { CONST_BADGES } from '@/const/ConstBadges';
import { TodayQuizBadgeInterceptor } from '@/services/interceptor/TodayQuizBadgeInterceptor';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import { useToast } from '@/hooks/useToast';
import Icon from 'react-native-vector-icons/FontAwesome6';
import FadeInView from '@/components/animation/FadeInView';
import { playCorrect, playWrong, playFinish } from '@/utils/SoundUtils';
import { scheduleDailyQuizReminder, cancelDailyQuizReminder, DAILY_QUIZ_NOTIFICATION_ID } from '@/utils/NotifactionHelper';

const NOTIFICATION_ID = DAILY_QUIZ_NOTIFICATION_ID;
const DEFAULT_ALARM_HOUR = 15;

/**
 * 저장된 알림 시각을 로컬 '시(hour)' 로 읽는다.
 * - 신규 포맷: 'HH:mm' (로컬 시/분. 타임존/날짜가 섞이지 않는다)
 * - 구버전 포맷: ISO 절대시각 → 기기 로컬 시각으로 환산해서 읽는다(하위 호환)
 */
const parseAlarmHour = (stored?: string | null): number => {
	if (!stored) {
		return DEFAULT_ALARM_HOUR;
	}
	const hhmm = /^(\d{1,2}):(\d{2})$/.exec(stored);
	if (hhmm) {
		return Number(hhmm[1]);
	}
	const parsed = new Date(stored);
	return Number.isNaN(parsed.getTime()) ? DEFAULT_ALARM_HOUR : parsed.getHours();
};

/** 저장 포맷('HH:mm') 으로 변환 */
const toAlarmTimeString = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/** 화면 표시용 Date (오늘 날짜 + 지정 시각). 스케줄링은 hour 로만 한다. */
const hourToDate = (hour: number) => {
	const date = DateUtils.now();
	date.setHours(hour, 0, 0, 0);
	return date;
};

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
	const [isTodayUnsolved, setIsTodayUnsolved] = useState(false);
	const [hasStarted, setHasStarted] = useState(false);

	// TodayQuizScreen 컴포넌트 상단
	const [detailModalVisible, setDetailModalVisible] = useState(false);
	const [detailQuiz, setDetailQuiz] = useState<MainDataType.Proverb | null>(null);

	const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
	const [alarmTime, setAlarmTime] = useState(hourToDate(DEFAULT_ALARM_HOUR));
	const [quizList, setQuizList] = useState<MainDataType.Proverb[]>([]);
	const [answerResults, setAnswerResults] = useState<{ [id: number]: boolean | null }>({});
	const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<MainDataType.UserBadge[]>([]);
	const [badgeModalVisible, setBadgeModalVisible] = useState(false);
	const [selectedAnswers, setSelectedAnswers] = useState<{
		[id: number]: { value: string; index: number };
	}>({});
	const [quizOptionsMap, setQuizOptionsMap] = useState<{ [id: number]: string[] }>({});
	const [currentIndex, setCurrentIndex] = useState(0); // 현재 문제 번호
	const [progressPercent, setProgressPercent] = useState(quizList.length > 0 ? (currentIndex / quizList.length) * 100 : 0);
	const labelColors = [COLORS.secondary, COLORS.primary, COLORS.accentTeal, COLORS.accentFlame]; // A, B, C, D 보기 라벨
	const [showAlarmModal, setShowAlarmModal] = useState(false);

	const [tempIsAlarmEnabled, setTempIsAlarmEnabled] = useState(false);

	const [showPrevQuizModal, setShowPrevQuizModal] = useState(false);

	const [groupedPrevQuizzes, setGroupedPrevQuizzes] = useState<GroupedPrevQuiz[]>([]);
	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	/** 주요 변경(알림 설정 등) 피드백용 공통 토스트 */
	const { showToast: showToastMessage, ToastView } = useToast();
	const [highlightAnswerId, setHighlightAnswerId] = useState<number | null>(null);

	const [showTodayReview, setShowTodayReview] = useState(false);
	const [todayDate, setTodayDate] = useState(DateUtils.now());

	// 알림 시각의 단일 소스. 절대시각(Date) 이 아니라 '로컬 시' 만 들고 있어야 타임존/날짜가 섞이지 않는다.
	const [tempSelectedHour, setTempSelectedHour] = useState(DEFAULT_ALARM_HOUR);

	const total = quizList.length;
	const solved = Object.keys(answerResults).length;
	const correct = Object.values(answerResults).filter((v) => v === true).length;

	const isQuizCompleted = Object.keys(answerResults).length === quizList.length;

	const { getLocalDateString, getLocalParamDateToString } = DateUtils;

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	// ponytail: 타이머 한 곳에 모아 언마운트 시 일괄 정리 (핸들러마다 ref 만들지 않음)
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const addTimer = (fn: () => void, ms: number) => {
		timersRef.current.push(setTimeout(fn, ms));
	};
	useEffect(() => {
		return () => {
			timersRef.current.forEach(clearTimeout);
			timersRef.current = [];
		};
	}, []);

	const loadFavorites = async () => {
		const ids = await getFavorites();
		setFavoriteIds(ids);
	};

	const handleToggleFavorite = async (id: number) => {
		const added = await toggleFavorite(id);
		await loadFavorites();
		showToastMessage(added ? '즐겨찾기 추가' : '즐겨찾기 제거');
	};

	useEffect(() => {
		loadFavorites();
	}, [showPrevQuizModal]);

	useFocusEffect(
		useCallback(() => {
			// ⚠️ 예전에는 여기서 "아직 다 안 푼 오늘의 퀴즈"를 초기화했는데,
			//    1~4문제만 푼 상태로 탭을 벗어났다 돌아오면 진행도가 통째로 날아갔다.
			//    복원/생성은 initQuiz 가 이미 정확히 처리하므로 초기화하지 않는다.
			loadSetting();
			getScheduledAlarmTime();
			// 다시 들어올 때는 접힌 상태 + 맨 위에서 시작한다 (진행 중인 답안은 유지)
			setShowTodayReview(false);
			setShowPrevQuizModal(false);
			setShowAlarmModal(false);
			setDetailModalVisible(false);
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
		const timer = setTimeout(() => {
			scrollRef.current?.scrollTo({ y: 0, animated: true });
		}, 50);
		return () => clearTimeout(timer);
	}, [currentIndex]);

	/** 현재 알림 권한 보유 여부 (알림 '예약' 에만 쓴다) */
	const hasNotificationPermission = async () => {
		const settings = await notifee.getNotificationSettings();
		return settings.authorizationStatus === 1;
	};

	const loadSetting = async () => {
		try {
			const json = await AsyncStorage.getItem(SETTING_KEY);

			if (json !== null) {
				const parseJson: MainDataType.SettingInfo = JSON.parse(json);
				const hour = parseAlarmHour(parseJson.alarmTime);

				setIsAlarmEnabled(parseJson.isUseAlarm); // ✅ 수정
				setAlarmTime(hourToDate(hour));
				setTempIsAlarmEnabled(parseJson.isUseAlarm);
				setTempSelectedHour(hour);

				// 저장된 시각 기준으로 재예약(고정 ID 라 멱등). 과거 시각으로 잘못 잡혀 있던 예약도 여기서 교정된다.
				// ⚠️ '예약' 만 권한에 의존한다. 퀴즈 생성/표시(initQuiz)는 권한과 무관하게 항상 동작해야 한다.
				if (parseJson.isUseAlarm && (await hasNotificationPermission())) {
					await scheduleDailyQuizNotification(hour);
				}
			}
		} catch (e) {
			console.error('알림 설정 로딩 실패:', e);
			return null;
		}
	};

	const getTodayQuiz = (excludeIds: number[] = []) => {
		const allProverbs = ProverbServices.selectProverbList();

		const excludeSet = new Set(excludeIds);
		const filtered = allProverbs.filter((p) => !excludeSet.has(p.id)); // ✅ 이전 문제 제외
		return sampleSize(filtered, 5);
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
				date: DateUtils.toLocalDateKey(entry.quizDate),
				formattedDate: `${formatted.formattedDate}(${formatted.dayOfWeek})`,
				quizList,
				answerResults: entry.answerResults, // ✅ 추가
			};
		});

		setGroupedPrevQuizzes(grouped);
		setShowPrevQuizModal(true);
	};

	/**
	 * 오늘의 퀴즈를 생성/복원한다.
	 * ⚠️ 알림 권한과 무관하게 항상 동작해야 한다.
	 *    (예전에는 notifee 권한이 없으면 통째로 스킵해서 사용자가 알림을 거부하면
	 *     quizList 가 영영 비어 "퀴즈를 준비 중입니다..." 화면에 갇혔다.)
	 *    알림 '예약' 만 권한이 있을 때 수행한다 → loadSetting / handleToggleAlarm.
	 */
	const initQuiz = async () => {
		const todayISO = getLocalDateString();

		if (showTodayReview) {
			setShowTodayReview(false);
		} // 👈 이 줄 추가

		const todayStr = getLocalDateString();
		const storedJson = await AsyncStorage.getItem(STORAGE_KEY);
		const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];
		// 여기서 KST 기준 비교로 todayData 찾기
		const todayData = storedArr.find((q) => getLocalParamDateToString(q.quizDate) === todayStr); // ✅ 중요

		// ✅ 오늘 문제를 아직 안 푼 상태 판별
		const unsolved = !!todayData && (!todayData.answerResults || Object.keys(todayData.answerResults).length === 0);

		setIsTodayUnsolved(unsolved);

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
			// 새 퀴즈를 만들었으면 이전 날짜의 답안이 남아 있으면 안 된다(완료 화면으로 잘못 넘어간다).
			setAnswerResults({});
			setSelectedAnswers({});
			setCurrentIndex(0);
			setQuizList(finalQuizList);
			generateQuizOptions(finalQuizList);
		} else {
			// 기존 퀴즈 복원
			const restored = ProverbServices.selectProverbByIds(todayData.todayQuizIdArr);

			// ⚠️ 매칭된 문제 개수가 5개가 아니면 새로 생성
			if (!restored || restored.length < 5) {
				console.warn('⚠️ 오늘의 퀴즈 데이터 누락 → 새 퀴즈 생성');
				const newQuiz = getTodayQuiz();

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
				// ⚠️ 예전에는 아래에서 다시 restored(누락된 목록)로 덮어써서 복구가 무효가 됐다.
				setAnswerResults({});
				setSelectedAnswers({});
				setCurrentIndex(0);
				setQuizList(newQuiz);
				generateQuizOptions(newQuiz);
				return;
			}

			const restoredResults = todayData.answerResults ?? {};
			setQuizList(restored);
			generateQuizOptions(restored);
			setAnswerResults(restoredResults);
			setSelectedAnswers(todayData.selectedAnswers ?? {});

			// 풀다 만 상태로 돌아왔다면 이미 푼 문제를 다시 넘기지 않도록 첫 미답 문항부터 이어서 푼다.
			const answeredCount = Object.keys(restoredResults).length;
			if (answeredCount > 0 && answeredCount < restored.length) {
				const nextIndex = restored.findIndex((q) => restoredResults[q.id] === undefined);
				setCurrentIndex(nextIndex === -1 ? 0 : nextIndex);
				setHasStarted(true);
			} else {
				setCurrentIndex(0);
			}
		}
	};

	const generateQuizOptions = (quizListParam: MainDataType.Proverb[]) => {
		// 전체 속담 목록은 문항마다 다시 조회할 필요가 없다(문항 수 x 전체 건수 만큼 낭비된다).
		const allMeanings = ProverbServices.selectProverbList().filter((p) => !!p.longMeaning);
		const optionsMap: { [id: number]: string[] } = {};

		quizListParam.forEach((item) => {
			const answer = item.longMeaning;
			// id 뿐 아니라 '뜻이 같은' 항목도 빼야 보기 안에 정답이 두 번 뜨지 않는다.
			const wrongPool = allMeanings.filter((p) => p.id !== item.id && p.longMeaning !== answer).map((p) => p.longMeaning);
			const wrongs = sampleSize(wrongPool, 3);

			while (wrongs.length < 3) {
				wrongs.push('모름');
			}

			optionsMap[item.id] = shuffle([...wrongs, answer]);
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

	/**
	 * 매일 지정한 '로컬 시각' 에 반복 알림을 예약한다.
	 * @param hour 0-23 (로컬 기준). 저장된 값만 넘길 것 — 현재 시각으로 재계산하지 않는다.
	 */
	// 예약 로직은 NotifactionHelper 로 일원화했다 — 앱 부팅 시 재예약(드리프트 보정)과 같은 코드를 쓴다.
	const scheduleDailyQuizNotification = async (hour: number) => {
		await scheduleDailyQuizReminder(hour, Paths.TODAY_QUIZ);
	};

	const cancelScheduledNotification = async () => {
		await cancelDailyQuizReminder();
	};

	const requestPermission = async () => {
		const settings = await notifee.requestPermission();

		console.log('settings :: ', settings);
		return settings.authorizationStatus === 1;
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

				const todayData = storedArr.find((q) => DateUtils.toLocalDateKey(q.quizDate) === todayStr);

				// 사용자가 고른 '로컬 시' 를 그대로 저장한다. (타임존 오프셋 보정 금지 — 읽고 쓸 때마다 시각이 밀린다)
				await saveSettingInfo({
					isUseAlarm: true,
					alarmTime: toAlarmTimeString(tempSelectedHour),
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
						quizDate: DateUtils.now().toISOString(), // ✅ ISO 저장
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

				await scheduleDailyQuizNotification(tempSelectedHour);
				setAlarmTime(hourToDate(tempSelectedHour));
				setTempIsAlarmEnabled(true);
				setIsAlarmEnabled(true);
				await getScheduledAlarmTime();

				// ✅ 알림 설정 완료 팝업 추가
				const hour = tempSelectedHour.toString().padStart(2, '0');
				showToastMessage('⏰ 알림 설정 완료', `매일 ${hour}시에 오늘의 퀴즈가 찾아갑니다!`);
			} else {
				Alert.alert('알림 권한 필요', '설정에서 알림 권한을 허용해주세요.');
				Linking.openSettings();
			}
		} else {
			await cancelScheduledNotification();

			setAlarmTime(hourToDate(DEFAULT_ALARM_HOUR));
			setShowTodayReview(false);
			setTempSelectedHour(DEFAULT_ALARM_HOUR);
			setTempIsAlarmEnabled(false);
			setIsAlarmEnabled(false);

			await saveSettingInfo({
				isUseAlarm: false,
				alarmTime: toAlarmTimeString(DEFAULT_ALARM_HOUR),
			});

			await getScheduledAlarmTime();
		}
	};

	/**
	 * 🏅 오늘의 퀴즈 누적 완료 일수를 기준으로 신규 뱃지를 지급하고 모달을 띄운다.
	 */
	const checkAndAwardTodayQuizBadges = async (storedArr: MainDataType.TodayQuizList[]) => {
		const completedDayCount = storedArr.filter(
			(d) =>
				(d.todayQuizIdArr?.length ?? 0) > 0 &&
				Object.keys(d.answerResults ?? {}).length >= (d.todayQuizIdArr?.length ?? 0),
		).length;

		const historyJson = await AsyncStorage.getItem(MainStorageKeyType.USER_QUIZ_HISTORY);
		const history: MainDataType.UserQuizHistory = historyJson
			? JSON.parse(historyJson)
			: {
					correctProverbId: [],
					wrongProverbId: [],
					lastAnsweredAt: DateUtils.now(),
					quizCounts: {},
					badges: [],
					totalScore: 0,
			  };
		history.badges = history.badges ?? [];

		const newBadgeIds = TodayQuizBadgeInterceptor(completedDayCount, history.badges);
		if (newBadgeIds.length === 0) {
			return;
		}

		const earnedBadgeObjects = newBadgeIds
			.map((id) => CONST_BADGES.find((b) => b.id === id))
			.filter(Boolean) as MainDataType.UserBadge[];

		const updatedHistory: MainDataType.UserQuizHistory = {
			...history,
			badges: [...new Set([...history.badges, ...newBadgeIds])],
		};
		await AsyncStorage.setItem(MainStorageKeyType.USER_QUIZ_HISTORY, JSON.stringify(updatedHistory));

		setNewlyEarnedBadges(earnedBadgeObjects);
		setBadgeModalVisible(true);
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

		// 🔊 정답/오답 효과음
		if (isCorrect) {
			playCorrect();
		} else {
			playWrong();
		}

		if (!isCorrect) {
			setHighlightAnswerId(quizId);
			addTimer(() => setHighlightAnswerId(null), 2000);
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

			// ✅ 오늘의 퀴즈를 모두 풀었으면 누적 완료 일수 기준 뱃지 부여
			const isAllAnswered = Object.keys(newAnswerResults).length >= quizList.length && quizList.length > 0;
			if (isAllAnswered) {
				playFinish(); // 🎉 오늘의 퀴즈 완료 사운드
				await checkAndAwardTodayQuizBadges(storedArr);
			}
		}
		// handleAnswer 내부 마지막 부분에 추가
		addTimer(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		}, 200); // 약간의 딜레이 주면 UI 반응이 자연스러워짐
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

						{/* ✅ 속담 상세 팝업과 동일한 내용을 해설로 인라인 표시 */}
						<View style={styles.explainDetailWrap}>
							<ProverbDetailContent proverb={item} />
						</View>
					</View>
				) : (
					<>
						{/* 👉 문제 텍스트 출력 추가 (속담 / 의미는? 줄바꿈) */}
						<View style={styles.questionCombined}>
							<Text style={styles.questionMain}>{item.proverb}</Text>
							{!isQuizCompleted && <Text style={styles.questionSub}>의미는?</Text>}
						</View>

						{result !== undefined && (
							<View style={styles.resultBannerWrap}>
								<View style={[styles.resultBanner, result ? styles.resultBannerCorrect : styles.resultBannerWrong]}>
									<View style={[styles.resultBannerIcon, { backgroundColor: result ? COLORS.primary : COLORS.danger }]}>
										<IconComponent type="materialIcons" name={result ? 'check' : 'close'} size={scaledSize(16)} color={COLORS.textWhite} />
									</View>
									<Text style={[styles.resultBannerText, { color: result ? COLORS.primaryDeep : COLORS.dangerDark }]}>
										{result ? '정답입니다!' : '아쉽습니다, 오답입니다'}
									</Text>
								</View>
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
									activeOpacity={0.8}
									onPress={() => handleAnswer(item.id, option, item.longMeaning)}
									disabled={isAnswered}
									style={[
										styles.optionBase,
										isUserSelected && (isCorrectOption ? styles.correctOption : styles.wrongOption),
										shouldHighlight && styles.highlightCorrectBorder,
									]}>
									<Text style={[styles.optionTextBase, isUserSelected && (isCorrectOption ? styles.correctText : styles.wrongText)]}>
										<Text style={{ color: labelColors[idx % labelColors.length], fontWeight: '700' }}>{String.fromCharCode(65 + idx)}.</Text> {option}
									</Text>
								</TouchableOpacity>
							);
						})}
						{/* 마지막 문제를 풀면 상위에서 곧바로 완료 화면으로 전환되므로 '다음 문제'만 노출한다 */}
						{result !== undefined && currentIndex < quizList.length - 1 && (
							<TouchableOpacity
								style={styles.nextButton}
								activeOpacity={0.8}
								onPress={() => {
									setCurrentIndex((prev) => prev + 1);
									scrollRef.current?.scrollTo({ y: 0, animated: true });
								}}>
								<Text style={styles.nextButtonText}>다음 문제</Text>
							</TouchableOpacity>
						)}
					</>
				)}
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			<FadeInView style={{ flex: 1 }}>
			<ScrollView
				ref={scrollRef}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: SPACING_H.xxxxl,
				}}>
				{isAlarmEnabled && (
					<View style={styles.buttonRow}>
						<View style={styles.rightButtonWrapper}>
							<TouchableOpacity onPress={loadLastTodayQuizList} activeOpacity={0.8} hitSlop={HIT_SLOP}>
								<View style={styles.buttonContent}>
									<IconComponent name="book" type="FontAwesome" size={scaledSize(13)} color={COLORS.textSecondary} style={styles.iconSpacing} />
									<Text style={styles.buttonText}>지난 오늘의 퀴즈</Text>
								</View>
							</TouchableOpacity>
						</View>
					</View>
				)}

				<View style={styles.rightAlignedRow} />

				{!isAlarmEnabled && (
					<View style={styles.content}>
						<Image source={require('@/assets/images/screen-heroes/today-quiz.png')} style={styles.todayHeroImage} resizeMode="contain" />
						<Text style={styles.title}>🍀 매일 '오늘의 퀴즈'가 도착합니다! 🍀</Text>

						<View style={{ alignSelf: 'stretch', marginTop: SPACING_H.sm }}>
							<View style={styles.bulletRow}>
								<Text style={styles.bullet}>•</Text>
								<Text style={styles.bulletText}>매일 5개의 속담 퀴즈가 도착합니다.</Text>
							</View>
							<View style={styles.bulletRow}>
								<Text style={styles.bullet}>•</Text>
								<Text style={styles.bulletText}>원하는 시간에 푸시 알림을 받을 수 있습니다.</Text>
							</View>
							<View style={styles.bulletRow}>
								<Text style={styles.bullet}>•</Text>
								<Text style={styles.bulletText}>문제를 모두 풀면 자세한 해설을 볼 수 있습니다.</Text>
							</View>
						</View>

						<View style={styles.alarmRow}>
							<View style={{ flexDirection: 'column', width: '100%', marginTop: SPACING_H.sm }}>
								<View style={styles.alarmRow}>
									<Text style={styles.switchLabel}>알림 설정/시간</Text>
									<Text style={styles.selectedHourText}>{tempSelectedHour.toString().padStart(2, '0')}시</Text>
									<Switch
										value={isAlarmEnabled}
										onValueChange={handleToggleAlarm}
										trackColor={{ false: COLORS.borderDark, true: COLORS.primaryLight }}
										thumbColor={isAlarmEnabled ? COLORS.primary : COLORS.surface}
										ios_backgroundColor={COLORS.borderDark}
									/>
								</View>

								<ScrollView
									ref={hourScrollRef}
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.hourScrollContainer}>
									{Array.from({ length: 24 }).map((_, hour) => {
										const isSelected = tempSelectedHour === hour;
										return (
											<TouchableOpacity
												key={hour}
												activeOpacity={0.8}
												onPress={() => setTempSelectedHour(hour)}
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
									activeOpacity={0.8}
									hitSlop={HIT_SLOP}
									onPress={() => {
										setTempIsAlarmEnabled(isAlarmEnabled);
										setTempSelectedHour(alarmTime.getHours());
										setShowAlarmModal(true);
									}}>
									<View style={styles.bellWrapper}>
										<IconComponent name="bell" type="FontAwesome" size={scaledSize(15)} color={COLORS.warning} />
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
								<Image source={require('@/assets/images/feature-states/today-quiz-arrival.png')} style={styles.todayQuizArrivalImage} resizeMode="contain" />
									<Text style={styles.emptyQuizTitle}>오늘의 퀴즈가 도착했습니다 ✨</Text>
									<Text style={styles.emptyQuizSubtitle}>지금 바로 시작해 보세요!</Text>

									<TouchableOpacity
										style={styles.startQuizButton}
										activeOpacity={0.8}
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
								// key 로 문항마다 재마운트 → 문제 전환 시 페이드+슬라이드업
								<FadeInView key={currentIndex} duration={260} style={{ paddingBottom: SPACING_H.lg }}>
									{/* 목록이 새로 만들어지는 순간 index 가 범위를 벗어날 수 있어 방어한다 */}
									{quizList[currentIndex] ? renderItem({ item: quizList[currentIndex] }) : null}
								</FadeInView>
							) : (
								// 👉 다 끝난 후 완료 화면
								<>
									<FadeInView>
										<View style={styles.completedCard}>
											<View style={styles.completedEmojiCircle}>
												<Text style={styles.completedEmoji}>🎉</Text>
											</View>
											<Text style={styles.completedTitle}>오늘의 문제 끝!</Text>
											<Text style={styles.completedSubtitle}>내일 또 뵙겠습니다 👋</Text>
											<View style={styles.completedScorePill}>
												<IconComponent type="materialIcons" name="check-circle" size={scaledSize(16)} color={COLORS.primary} />
												<Text style={styles.completedScoreText}>
													<Text style={styles.completedScoreNum}>{correct}</Text>
													<Text style={styles.completedScoreTotal}> / {quizList.length}</Text> 정답
												</Text>
											</View>
										</View>
									</FadeInView>

									<TouchableOpacity activeOpacity={0.8} onPress={() => setShowTodayReview((prev) => !prev)} style={styles.reviewToggleButton}>
										<IconComponent
											name={showTodayReview ? 'chevron-up' : 'chevron-down'}
											type="FontAwesome"
											size={scaledSize(16)}
											color={COLORS.text}
											style={{ marginRight: SPACING_W.sm }}
										/>
										<Text style={styles.acodianTxt}>{showTodayReview ? '오늘의 퀴즈 접기' : '오늘의 퀴즈 다시 보기'}</Text>
									</TouchableOpacity>

									{showTodayReview && (
										<View style={styles.reviewList}>
											{quizList.map((item, idx) => {
												const itemResult = answerResults[item.id];
												return (
													// 리스트 stagger — 최대 6개까지만 지연
													<FadeInView key={item.id} delay={Math.min(idx, 5) * 40} duration={260} offsetY={8}>
														<TouchableOpacity
															activeOpacity={0.85}
															style={styles.reviewItemCard}
															onPress={() => {
																setDetailQuiz(item);
																setDetailModalVisible(true);
															}}>
															<View style={styles.reviewItemTextWrap}>
																<Text style={styles.reviewItemTitle} numberOfLines={1} ellipsizeMode="tail">
																	{item.proverb}
																</Text>
																<Text style={styles.reviewItemMeaning} numberOfLines={2} ellipsizeMode="tail">
																	{item.longMeaning || item.meaning}
																</Text>
															</View>
															<View style={[styles.reviewItemPill, itemResult ? styles.pillCorrect : styles.pillWrong]}>
																<Text style={styles.resultPillText}>{itemResult ? '정답' : '오답'}</Text>
															</View>
															<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color={COLORS.textLight} />
														</TouchableOpacity>
													</FadeInView>
												);
											})}
										</View>
									)}
								</>
							)}
						</View>
					)}
					{/* ❗ fallback UI 추가 */}
					{isAlarmEnabled && quizList.length === 0 && (
						<View style={{ paddingVertical: SPACING_H.xl, paddingHorizontal: SPACING_W.xl, alignItems: 'center' }}>
							<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.md }}>퀴즈를 준비 중입니다...</Text>
							<ActivityIndicator size="small" color={COLORS.secondary} style={{ marginTop: SPACING_H.md }} />
							<TouchableOpacity
								activeOpacity={0.8}
								onPress={initQuiz}
								hitSlop={HIT_SLOP}
								style={{ marginTop: SPACING_H.md }}>
								<Text style={{ color: COLORS.secondary, fontSize: FONT_SIZES.md, fontWeight: '600' }}>🔄 다시 불러오기</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ScrollView>
			</FadeInView>

			<Modal visible={showAlarmModal} transparent animationType="fade" onRequestClose={() => setShowAlarmModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.alarmModalCard}>
						<Text style={styles.modalTitle2}>🔔 오늘의 퀴즈 알림 설정</Text>

						<View style={styles.modalRow}>
							<Text style={styles.modalLabel}>알림 사용</Text>

							<Switch
								value={tempIsAlarmEnabled}
								onValueChange={setTempIsAlarmEnabled}
								trackColor={{ false: COLORS.borderDark, true: COLORS.primaryLight }}
								thumbColor={tempIsAlarmEnabled ? COLORS.primary : COLORS.surface}
								ios_backgroundColor={COLORS.borderDark}
							/>
						</View>

						{/* 알림 시간은 스위치가 켜졌을 때만 보이게 */}
						{tempIsAlarmEnabled && (
							<View style={styles.modalRow}>
								<View style={{ width: '100%', marginTop: SPACING_H.md }}>
									<View style={styles.timePickerRow}>
										<Text style={styles.modalLabel}>알림 시간</Text>
										<Text style={styles.selectedHourText}>{tempSelectedHour.toString().padStart(2, '0')}시</Text>
									</View>

									<ScrollView
										ref={modalScrollRef}
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={{
											paddingVertical: SPACING_H.sm,
											paddingHorizontal: SPACING_W.xs,
										}}>
										{Array.from({ length: 24 }).map((_, hour) => {
											const isSelected = tempSelectedHour === hour;
											return (
												<TouchableOpacity
													key={hour}
													activeOpacity={0.8}
													onPress={() => setTempSelectedHour(hour)}
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
								activeOpacity={0.8}
								onPress={() => {
									setShowAlarmModal(false);
									// ✅ 임시값 초기화
									setTempIsAlarmEnabled(isAlarmEnabled);
									setTempSelectedHour(alarmTime.getHours());
								}}>
								<Text style={styles.cancelButtonText}>취소</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.saveButton}
								activeOpacity={0.8}
								onPress={async () => {
									setShowAlarmModal(false);

									const finalHour = tempIsAlarmEnabled ? tempSelectedHour : DEFAULT_ALARM_HOUR;

									if (!tempIsAlarmEnabled) {
										setTempSelectedHour(DEFAULT_ALARM_HOUR);
										await cancelScheduledNotification();
										// ✅ 알림 끈 경우엔 별도 메시지 없이 저장만
									} else {
										await scheduleDailyQuizNotification(finalHour);
										showToastMessage('⏰ 알림 저장 완료', `${finalHour.toString().padStart(2, '0')}시에 오늘의 퀴즈 알람이 지정되었습니다.`);
									}

									await saveSettingInfo({
										isUseAlarm: tempIsAlarmEnabled,
										alarmTime: toAlarmTimeString(finalHour),
									});

									setAlarmTime(hourToDate(finalHour));
									setIsAlarmEnabled(tempIsAlarmEnabled);
									setShowTodayReview(false);

									await getScheduledAlarmTime();
								}}>
								<Text style={styles.saveButtonText}>저장</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			<Modal visible={showPrevQuizModal} transparent animationType="fade" onRequestClose={() => setShowPrevQuizModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.alarmModalCard}>
						{/* 닫기 아이콘 */}
						<TouchableOpacity
							style={styles.modalCloseIcon}
							activeOpacity={0.8}
							hitSlop={HIT_SLOP}
							onPress={() => setShowPrevQuizModal(false)}>
							<IconComponent name="close" type="AntDesign" size={scaledSize(20)} color={COLORS.text} />
						</TouchableOpacity>

						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING_H.xs }}>
							<IconComponent name="book" type="FontAwesome" size={scaledSize(18)} color={COLORS.textSecondary} style={{ marginRight: SPACING_W.sm }} />
							<Text style={styles.modalTitle}>지난 오늘의 퀴즈</Text>
						</View>

						<Text style={styles.modalNotice}>※ 오늘 날짜는 제외되며, 전날 퀴즈만 표시됩니다.</Text>

						<ScrollView ref={modalScrollRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
							{groupedPrevQuizzes.length === 0 ? (
								<View style={styles.emptyView}>
									<Text style={styles.emptyText}>오늘의 퀴즈를 아직 풀지 않았습니다.</Text>
								</View>
							) : (
								groupedPrevQuizzes.map((group) => {
									const { formattedDate, dayOfWeek } = formatQuizDate(group.date);
									const correctCount = Object.values(group.answerResults).filter((v) => v === true).length;
									return (
										<View key={group.date} style={styles.quizGroup}>
											{/* 섹션 헤더 */}
											<View style={styles.historySectionHeader}>
												<View style={styles.historySectionHeaderLeft}>
													<IconComponent name="calendar" type="FontAwesome" size={scaledSize(16)} color={COLORS.primary} style={{ marginRight: SPACING_W.sm }} />
													<Text style={styles.historySectionTitle}>
														{formattedDate} ({dayOfWeek}) 퀴즈
													</Text>
												</View>
												<View style={styles.historyDateChip}>
													<Text style={styles.historyDateChipText}>
														{correctCount}/{group.quizList.length} 정답
													</Text>
												</View>
											</View>

											{/* ✅ 해설 스타일로 통일된 카드 */}
											{group.quizList.map((item) => {
												const isCorrect = group.answerResults?.[item.id] === true;
												const isFavorite = favoriteIds.includes(item.id);
												return (
													<View key={item.id} style={styles.historyCard}>
														<View style={styles.historyCardBody}>
															<View style={styles.historyHeaderRow}>
																<Text style={styles.historyIdiom} numberOfLines={2}>{item.proverb}</Text>
																<View style={styles.historyHeaderRight}>
																	<View style={[styles.resultPill, isCorrect ? styles.pillCorrect : styles.pillWrong]}>
																		<Text style={styles.resultPillText}>{isCorrect ? '정답' : '오답'}</Text>
																	</View>
																</View>
															</View>
															<View style={styles.historyMeaningBox}>
																<Text style={styles.historyMeaningValue}>{item.longMeaning || item.meaning}</Text>
															</View>
														</View>
														<View style={styles.historyActionColumn}>
															<TouchableOpacity
																style={styles.historyActionButton}
																activeOpacity={0.8}
																onPress={(e) => {
																	e.stopPropagation();
																	handleToggleFavorite(item.id);
																}}
																hitSlop={HIT_SLOP}>
																<Icon name="star" solid={isFavorite} size={scaledSize(18)} color={isFavorite ? COLORS.warning : COLORS.borderDark} />
															</TouchableOpacity>
														</View>
													</View>
												);
											})}
										</View>
									);
								})
							)}
						</ScrollView>

						<TouchableOpacity style={styles.modalFooterButton} activeOpacity={0.8} onPress={() => setShowPrevQuizModal(false)}>
							<Text style={styles.modalFooterButtonText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
				<ToastView />
			</Modal>

			{/* 상세 모달 */}
			<ProverbDetailModal visible={detailModalVisible && !!detailQuiz} proverb={detailQuiz} onClose={() => setDetailModalVisible(false)} />

			{/* 토스트는 화면 최상위에 한 번만 렌더한다.
			    (모달이 열려 있을 때는 모달 안쪽 ToastView 가 대신 보여준다 → 중복 렌더 방지) */}
			{!showPrevQuizModal && <ToastView />}

			{/* ✅ 신규 뱃지 획득 모달 */}
			<NewBadgeModal
				visible={badgeModalVisible}
				badges={newlyEarnedBadges}
				onConfirm={() => {
					setBadgeModalVisible(false);
					setNewlyEarnedBadges([]);
				}}
			/>
		</SafeAreaView>
	);
};

export default TodayQuizScreen;

const styles = themedStyles(() => StyleSheet.create({
	/* ===== 화면 기본 ===== */
	main: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	container: {
		paddingVertical: SPACING_H.sm,
	},

	/* ===== 상단 버튼 행 ===== */
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginHorizontal: SPACING_W.lg,
		marginTop: SPACING_H.sm,
	},
	rightButtonWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
	},
	buttonText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
		fontWeight: '600',
	},
	iconSpacing: {
		marginRight: SPACING_W.xs,
	},
	rightAlignedRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginHorizontal: SPACING_W.lg,
	},

	/* ===== 알림 미설정 안내 카드 ===== */
	content: {
		marginTop: SPACING_H.md,
		marginHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		justifyContent: 'center',
		alignItems: 'center',
	},
	todayHeroImage: { width: scaleWidth(190), height: scaleHeight(126), marginBottom: SPACING_H.sm },
	title: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		marginBottom: SPACING_H.md,
		color: COLORS.textStrong,
		textAlign: 'center',
	},
	bulletRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: SPACING_H.sm,
	},
	bullet: {
		fontSize: FONT_SIZES.md,
		color: COLORS.primary,
		marginRight: SPACING_W.sm,
		lineHeight: scaledSize(20),
	},
	bulletText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		flexShrink: 1,
		lineHeight: scaledSize(20),
	},
	alarmRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		paddingVertical: SPACING_H.xs,
		marginBottom: SPACING_H.sm,
	},
	switchLabel: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		fontWeight: '500',
	},
	selectedHourText: {
		marginLeft: SPACING_W.sm,
		fontSize: FONT_SIZES.md,
		color: COLORS.secondary,
		fontWeight: '700',
	},
	hourScrollContainer: {
		paddingVertical: SPACING_H.sm,
	},
	hourButton: {
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.lg,
		marginRight: SPACING_W.sm,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surfaceAlt,
	},
	hourButtonSelected: {
		backgroundColor: COLORS.primary,
		borderColor: COLORS.primary,
	},
	hourText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.text,
	},
	hourTextSelected: {
		color: COLORS.textWhite,
		fontWeight: '700',
	},

	/* ===== 점수 / 진행도 ===== */
	scoreBox: {
		marginTop: SPACING_H.sm,
		marginHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	scoreRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
	},
	scoreText: {
		flex: 1,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	scoreRightGroup: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	bellWrapper: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(32) / 2,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.warning,
		backgroundColor: COLORS.warningBg,
	},
	progressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		marginTop: SPACING_H.md,
	},
	progressBarBackground: {
		flex: 1,
		height: scaleHeight(10),
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.round,
		overflow: 'hidden',
		marginRight: SPACING_W.md,
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.round,
	},
	progressText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
		fontWeight: '600',
	},

	/* ===== 퀴즈 카드 ===== */
	quizContainer2: {
		marginHorizontal: SPACING_W.lg,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	quizBox: {
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.surface,
	},
	questionCombined: {
		alignItems: 'center',
		marginTop: SPACING_H.xs,
		marginBottom: SPACING_H.lg,
	},
	questionMain: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.secondary,
		marginBottom: SPACING_H.sm,
		lineHeight: scaledSize(30),
		textAlign: 'center',
	},
	questionSub: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.textSecondary,
		textAlign: 'center',
	},

	/* ===== 정/오답 배너 ===== */
	resultBannerWrap: {
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	resultBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.round,
		borderWidth: 1,
	},
	resultBannerCorrect: {
		backgroundColor: COLORS.primaryBg,
		borderColor: COLORS.primarySoft,
	},
	resultBannerWrong: {
		backgroundColor: COLORS.dangerBg,
		borderColor: COLORS.danger,
	},
	resultBannerIcon: {
		width: scaleWidth(22),
		height: scaleWidth(22),
		borderRadius: scaleWidth(22) / 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.sm,
	},
	resultBannerText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
	},

	/* ===== 보기(선택지) ===== */
	optionBase: {
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.surfaceAlt,
		borderWidth: 1,
		borderColor: COLORS.border,
		marginBottom: SPACING_H.sm,
	},
	optionTextBase: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		fontWeight: '500',
		lineHeight: scaledSize(20),
		textAlign: 'left',
	},
	correctOption: {
		backgroundColor: COLORS.primaryBg,
		borderColor: COLORS.primary,
		borderWidth: 2,
	},
	wrongOption: {
		backgroundColor: COLORS.dangerBg,
		borderColor: COLORS.danger,
		borderWidth: 2,
	},
	correctText: {
		color: COLORS.primaryDark,
		fontWeight: '700',
	},
	wrongText: {
		color: COLORS.dangerDark,
		fontWeight: '700',
	},
	highlightCorrectBorder: {
		borderColor: COLORS.primary,
		borderWidth: 2,
	},
	nextButton: {
		marginTop: SPACING_H.lg,
		alignSelf: 'stretch',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: scaleHeight(48),
		backgroundColor: COLORS.secondary,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xl,
		borderRadius: RADIUS.md,
	},
	nextButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},

	/* ===== 퀴즈 시작 카드 ===== */
	emptyQuizBox: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: SPACING_H.xxxxl,
		paddingHorizontal: SPACING_W.lg,
	},
	todayQuizArrivalImage: {
		width: scaleWidth(168),
		height: scaleWidth(168),
	},
	emptyQuizTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginTop: SPACING_H.lg,
		textAlign: 'center',
	},
	emptyQuizSubtitle: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.sm,
		marginBottom: SPACING_H.xl,
		textAlign: 'center',
	},
	startQuizButton: {
		alignSelf: 'stretch',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: scaleHeight(48),
		backgroundColor: COLORS.secondary,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xxl,
		borderRadius: RADIUS.md,
	},
	startQuizButtonText: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textWhite,
	},

	/* ===== 완료 카드 ===== */
	completedCard: {
		alignItems: 'center',
		marginTop: SPACING_H.xl,
		marginHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xxl,
		paddingHorizontal: SPACING_W.lg,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	completedEmojiCircle: {
		width: scaleWidth(64),
		height: scaleWidth(64),
		borderRadius: scaleWidth(64) / 2,
		backgroundColor: COLORS.primaryBg,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.md,
	},
	completedEmoji: {
		fontSize: scaledSize(30),
	},
	completedTitle: {
		fontSize: FONT_SIZES.xl,
		color: COLORS.textStrong,
		fontWeight: '700',
		marginBottom: SPACING_H.xs,
		textAlign: 'center',
	},
	completedSubtitle: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		fontWeight: '500',
		textAlign: 'center',
	},
	completedScorePill: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		marginTop: SPACING_H.lg,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.primaryBg,
		borderWidth: 1,
		borderColor: COLORS.primarySoft,
	},
	completedScoreText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		fontWeight: '600',
	},
	completedScoreNum: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.primaryDark,
		fontWeight: '700',
	},
	completedScoreTotal: {
		color: COLORS.textLight,
		fontWeight: '700',
	},

	/* ===== 오늘의 퀴즈 다시 보기 ===== */
	reviewToggleButton: {
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.md,
		alignSelf: 'center',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	acodianTxt: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.text,
	},
	reviewList: {
		marginTop: SPACING_H.xs,
		paddingHorizontal: SPACING_W.lg,
		paddingBottom: SPACING_H.md,
	},
	reviewItemCard: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	reviewItemTextWrap: {
		flex: 1,
	},
	reviewItemTitle: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	reviewItemMeaning: {
		marginTop: SPACING_H.xs,
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		lineHeight: scaledSize(18),
	},
	reviewItemPill: {
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.sm,
		borderRadius: RADIUS.round,
		borderWidth: 1,
	},

	/* ===== 해설 ===== */
	answerExplainBox: {
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		backgroundColor: COLORS.background,
		marginTop: SPACING_H.sm,
	},
	answerExplainCorrect: {
		backgroundColor: COLORS.primaryBg,
		borderColor: COLORS.primary,
	},
	answerExplainWrong: {
		backgroundColor: COLORS.dangerBg,
		borderColor: COLORS.danger,
	},
	explainHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: SPACING_H.sm,
	},
	explainIdiom: {
		flexShrink: 1,
		flexWrap: 'wrap',
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.secondary,
		lineHeight: scaledSize(26),
	},
	explainDetailWrap: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginTop: SPACING_H.sm,
	},
	resultPill: {
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.sm,
		borderRadius: RADIUS.round,
		borderWidth: 1,
	},
	pillCorrect: {
		backgroundColor: COLORS.primarySoft,
		borderColor: COLORS.primary,
	},
	pillWrong: {
		backgroundColor: COLORS.dangerBg,
		borderColor: COLORS.danger,
	},
	resultPillText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
		color: COLORS.text,
	},

	/* ===== 모달 공통 ===== */
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	alarmModalCard: {
		width: '100%',
		maxWidth: scaleWidth(420),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingVertical: SPACING_H.xl,
		paddingHorizontal: SPACING_W.lg,
		alignItems: 'center',
	},
	modalTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	modalTitle2: {
		fontSize: FONT_SIZES.xl,
		marginBottom: SPACING_H.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	modalNotice: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
		marginTop: SPACING_H.xs,
		marginBottom: SPACING_H.md,
		textAlign: 'center',
	},
	modalRow: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: SPACING_H.xs,
	},
	modalLabel: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.text,
		fontWeight: '600',
	},
	timePickerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: SPACING_H.xs,
	},
	modalButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		columnGap: SPACING_W.md,
		marginTop: SPACING_H.xl,
		width: '100%',
	},
	cancelButton: {
		flex: 1,
		minHeight: scaleHeight(48),
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surfaceAlt,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelButtonText: {
		color: COLORS.textSecondary,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '600',
	},
	saveButton: {
		flex: 1,
		minHeight: scaleHeight(48),
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	saveButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
	},
	modalCloseIcon: {
		position: 'absolute',
		top: SPACING_H.lg,
		right: SPACING_W.lg,
		padding: SPACING_W.xs,
		zIndex: 10,
	},
	modalFooterButton: {
		width: '100%',
		marginTop: SPACING_H.lg,
		minHeight: scaleHeight(48),
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surfaceAlt,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xl,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalFooterButtonText: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.text,
	},
	scrollView: {
		maxHeight: scaleHeight(520),
		width: '100%',
	},
	scrollContent: {
		paddingBottom: SPACING_H.xl,
	},
	emptyView: {
		paddingVertical: SPACING_H.xxxxl,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.textLight,
	},

	/* ===== 지난 오늘의 퀴즈(히스토리) ===== */
	quizGroup: {
		marginBottom: SPACING_H.xl,
	},
	historySectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: SPACING_H.sm,
		marginBottom: SPACING_H.md,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	historySectionHeaderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	historySectionTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	historyDateChip: {
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.sm,
		backgroundColor: COLORS.surfaceAlt,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.round,
	},
	historyDateChipText: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '600',
		color: COLORS.textSecondary,
	},
	historyCard: {
		flexDirection: 'row',
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		overflow: 'hidden',
		marginBottom: SPACING_H.md,
	},
	historyCardBody: {
		flex: 1,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
	},
	historyHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	historyHeaderRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	historyIdiom: {
		flex: 1,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
		lineHeight: scaledSize(22),
		paddingRight: SPACING_W.sm,
	},
	historyMeaningBox: {
		marginTop: SPACING_H.sm,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.sm,
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	historyMeaningValue: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		fontWeight: '500',
		lineHeight: scaledSize(20),
	},
	historyActionColumn: {
		width: scaleWidth(44),
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: SPACING_H.sm,
		paddingRight: SPACING_W.sm,
	},
	historyActionButton: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		alignItems: 'center',
		justifyContent: 'center',
	},
}));
