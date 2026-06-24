/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	Alert,
	Modal,
	LayoutAnimation,
	FlatList,
	NativeSyntheticEvent,
	NativeScrollEvent,
	Animated,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { RootStackParamList } from '@/navigation/conf/Types';
import IconComponent from './common/atomic/IconComponent';
import DonutChart from './common/atomic/DonutChart';
import AnimatedCounter from './common/atomic/AnimatedCounter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import 'moment/locale/ko'; // 한국어 로케일 import
import { CONST_BADGES, BADGE_RARITY_META } from '@/const/ConstBadges';
import BadgeDetailPopup from './modal/BadgeDetailPopup';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import Colors from '@/const/ConstColors';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { PET_REWARDS } from '@/const/ConstInfoData';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { FIELD_DROPDOWN_ITEMS } from '@/const/common/CommonMainData';

interface TodayQuizList {
	quizDate: string;
	isCheckedIn: boolean;
	todayQuizIdArr: number[];
	correctQuizIdArr: number[];
	worngQuizIdArr: number[];
	answerResults: { [quizId: number]: boolean };
	selectedAnswers: {
		[quizId: number]: {
			value: string; // 보기 텍스트
			index: number; // 몇 번째 보기인지 (0부터 시작)
		};
	};
	prevQuizIdArr?: number[];
}

const DIFFICULTIES = [
	{ key: 'Level 1', title: 'Level 1', subtitle: '초급', icon: 'seedling' },
	{ key: 'Level 2', title: 'Level 2', subtitle: '중급', icon: 'leaf' },
	{ key: 'Level 3', title: 'Level 3', subtitle: '고급', icon: 'tree' },
	{ key: 'Level 4', title: 'Level 4', subtitle: '특급', icon: 'trophy' },
];

const CATEGORY_META: Record<string, { color: string; icon: { type: string; name: string } }> = {
	'감정/심리': { color: '#F87171', icon: { type: 'FontAwesome6', name: 'heart' } },
	인간관계: { color: '#93C5FD', icon: { type: 'FontAwesome6', name: 'users' } },
	'도덕/교훈': { color: '#93C5FD', icon: { type: 'FontAwesome6', name: 'scale-balanced' } },
	'지혜/판단': { color: '#FCD34D', icon: { type: 'FontAwesome6', name: 'brain' } },
	'성공/의지': { color: '#BFDBFE', icon: { type: 'FontAwesome6', name: 'medal' } },
	'위기/고난': { color: '#F87171', icon: { type: 'FontAwesome', name: 'exclamation-triangle' } },
	'언어/표현': { color: '#BFDBFE', icon: { type: 'FontAwesome6', name: 'comment-dots' } },
	'생활/사회': { color: '#FCA5A5', icon: { type: 'FontAwesome6', name: 'globe' } },
	'성격/결함': { color: '#94A3B8', icon: { type: 'FontAwesome6', name: 'user-slash' } },
	'성격/덕목': { color: '#22C55E', icon: { type: 'FontAwesome6', name: 'handshake' } },
	'인생/운명': { color: '#FDE68A', icon: { type: 'FontAwesome6', name: 'dice' } },
	'학습/성장': { color: '#22C55E', icon: { type: 'FontAwesome6', name: 'book-open' } },
	'결단/선택': { color: '#22C55E', icon: { type: 'FontAwesome6', name: 'toggle-on' } },
	'전략/경쟁': { color: '#DC2626', icon: { type: 'FontAwesome6', name: 'chess-knight' } },
	'생존/현실': { color: '#22C55E', icon: { type: 'FontAwesome6', name: 'person-digging' } },
	'사랑/가정': { color: '#F87171', icon: { type: 'FontAwesome6', name: 'people-roof' } },
	기타: { color: '#E2E8F0', icon: { type: 'FontAwesome6', name: 'circle-question' } },
};


const STYLE_MAP = {
	초급: {
		color: '#BFDBFE',
		icon: { type: 'fontAwesome5', name: 'seedling' },
		badgeId: 'level_easy_1',
		type: 'level',
	},
	중급: {
		color: '#FCD34D',
		icon: { type: 'fontAwesome5', name: 'leaf' },
		badgeId: 'level_easy_2',
		type: 'level',
	},
	고급: {
		color: '#FB923C',
		icon: { type: 'fontAwesome5', name: 'tree' },
		badgeId: 'level_medium',
		type: 'level',
	},
	특급: {
		color: '#EF4444',
		icon: { type: 'fontAwesome5', name: 'trophy' },
		badgeId: 'level_hard',
		type: 'level',
	},
};

LocaleConfig.locales.kr = {
	monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '11월'],
	monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '11월'],
	dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
	dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
};

LocaleConfig.defaultLocale = 'kr';
moment.locale('ko'); // 로케일 설정

const STORAGE_KEY_QUIZ = MainStorageKeyType.USER_QUIZ_HISTORY;
const STORAGE_KEY_STUDY = MainStorageKeyType.USER_STUDY_HISTORY;
const STORAGE_KEY_TIME = MainStorageKeyType.TIME_CHALLENGE_HISTORY;
const STORAGE_KEY_TODAY = MainStorageKeyType.TODAY_QUIZ_LIST;

// 카테고리 뱃지 매핑
const categoryMap2: { [key: string]: string } = {
	'감정/심리': 'category_emotion',
	인간관계: 'category_relation',
	'도덕/교훈': 'category_ethics',
	'지혜/판단': 'category_judgement',
	'성공/의지': 'category_will',
	'위기/고난': 'category_crisis',
	'언어/표현': 'category_expression',
	'생활/사회': 'category_life',
	'성격/결함': 'category_flaw',
	'성격/덕목': 'category_virtue',
	'인생/운명': 'category_fate',
	'학습/성장': 'category_growth',
	'결단/선택': 'category_decision',
	'전략/경쟁': 'category_strategy',
	'생존/현실': 'category_survival',
	'사랑/가정': 'category_love',
	기타: 'category_etc',
};

const MyScoreScreen = () => {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const isFocused = useIsFocused();
	const scrollRef = useRef<ScrollView>(null);
	const [refreshing, setRefreshing] = useState(false);
	const levelScrollRef = useRef<ScrollView>(null);

	// 마스코트 진입 애니메이션
	const mascotFade = useRef(new Animated.Value(0)).current;
	const mascotScale = useRef(new Animated.Value(0.8)).current;

	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
	const [totalScore, setTotalScore] = useState<number>(0);
	const [levelMaster, setLevelMaster] = useState<string[]>([]);
	const [correctCount, setCorrectCount] = useState<number>(0);
	const [wrongCount, setWrongCount] = useState<number>(0);
	const [lastAnsweredAt, setLastAnsweredAt] = useState<string>('');
	const [bestCombo, setBestCombo] = useState<number>(0);
	const [showLevelModal, setShowLevelModal] = useState(false);
	const [showBadgeList, setShowBadgeList] = useState(false);
	const [badgeFilter, setBadgeFilter] = useState<'all' | 'earned' | 'locked'>('all');
	const [studyCountries, setStudyCountries] = useState<string[]>([]);
	const [lastStudyAt, setLastStudyAt] = useState<string>('');
	const [totalStudyCount, setTotalStudyCount] = useState<number>(0);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [categoryMaster, setCategoryMaster] = useState<string[]>([]);
	const [totalCountryCount, setTotalCountryCount] = useState<number>(0);

	const [showStudySection, setShowStudySection] = useState(false);
	const [showQuizSection, setShowQuizSection] = useState(false);
	const [showTimeSection, setShowTimeSection] = useState(false);
	const [showBadgeSection, setShowBadgeSection] = useState(false);
	const [showTowerSection, setShowTowerSection] = useState(false);
	const [unlockedRewards, setUnlockedRewards] = useState<number[]>([]);

	const [showTodayQuizSection, setShowTodayQuizSection] = useState(false);
	const [markedQuizDates, setMarkedQuizDates] = useState<{ [date: string]: any }>({});

	const [timeChallengeResults, setTimeChallengeResults] = useState<MainDataType.TimeChallengeResult[]>([]);
	const [isAllExpanded, setIsAllExpanded] = useState(false);

	// ✅ 아코디언 대신 빠른 탐색용 탭 (한 번에 하나의 활동만 표시)
	const ACTIVITY_TABS = [
		{ key: 'all', label: '전체', icon: 'apps' },
		{ key: 'study', label: '학습 활동', icon: 'school' },
		{ key: 'quiz', label: '퀴즈 활동', icon: 'play-arrow' },
		{ key: 'today', label: '오늘의 퀴즈', icon: 'calendar-today' },
		{ key: 'time', label: '타임 챌린지', icon: 'timer' },
		{ key: 'badge', label: '획득 뱃지', icon: 'emoji-events' },
		{ key: 'tower', label: '타워 챌린지', icon: 'apartment' },
	];
	const [activeTab, setActiveTab] = useState<string>('all');

	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	// 🏅 뱃지 상세 팝업 (페이지 이동 대신 팝업)
	const [badgePopupBadge, setBadgePopupBadge] = useState<MainDataType.UserBadge | null>(null);
	const [badgePopupVisible, setBadgePopupVisible] = useState(false);
	const openBadgePopup = (badge: MainDataType.UserBadge) => {
		setBadgePopupBadge(badge);
		setBadgePopupVisible(true);
	};

	const [selectedQuizData, setSelectedQuizData] = useState<MainDataType.TodayQuizList | null>(null);
	const [todayQuizDataList, setTodayQuizDataList] = useState<MainDataType.TodayQuizList[]>([]);
	const [petLevel, setPetLevel] = useState(-1);
	const [detailProverb, setDetailProverb] = useState<MainDataType.Proverb | null>(null);
	const [detailVisible, setDetailVisible] = useState(false);

	const todayQuizListRef = useRef<MainDataType.TodayQuizList[]>([]);

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	const allCategories = ProverbServices.selectCategoryList(); // 전체 카테고리 (8개)
	console.log('allCategories : ', allCategories);
	// TOOD: 해당 부분에서 데이터를 불러 와야 함
	// const allCategories = []; // 전체 카테고리 (8개)

	const getLevelStyle = (subtitle: string) => {
		const entry = STYLE_MAP[subtitle];
		if (!entry) {
			return { bg: '#fff', border: '#CBD5E1' };
		}
		return { bg: entry.color, border: entry.color };
	};

	useEffect(() => {
		if (isFocused) {
			handleScrollToTop();
		}
	}, [isFocused]);

	useFocusEffect(
		useCallback(() => {
			loadData();
			loadCheckedInDates();
			// 마스코트 진입 애니메이션 실행
			mascotFade.setValue(0);
			mascotScale.setValue(0.8);
			const anim = Animated.parallel([
				Animated.timing(mascotFade, {
					toValue: 1,
					duration: 500,
					useNativeDriver: true,
				}),
				Animated.spring(mascotScale, {
					toValue: 1,
					friction: 6,
					tension: 80,
					useNativeDriver: true,
				}),
			]);
			anim.start();
			return () => anim.stop();
		}, []),
	);

	useFocusEffect(
		useCallback(() => {
			const todayStr = moment().format('YYYY-MM-DD');
			const todayData = todayQuizDataList.find((item) => moment(item.quizDate).format('YYYY-MM-DD') === todayStr);

			if (todayData) {
				setSelectedDate(todayStr);
				setSelectedQuizData(todayData);
			}
		}, [todayQuizDataList]),
	);

	useFocusEffect(
		useCallback(() => {
			// 탭 이동 시 진입할 때마다 접힌 상태로 초기화
			setIsAllExpanded(false);
			setShowStudySection(false);
			setShowQuizSection(false);
			setShowTimeSection(false);
			setShowBadgeSection(false);
			setShowTodayQuizSection(false);
			setShowTowerSection(false);
		}, []),
	);

	const loadData = async () => {
		try {
			const studyData = await AsyncStorage.getItem(STORAGE_KEY_STUDY);
			const quizData = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);

			const studyBadges = studyData ? (JSON.parse(studyData)?.badges ?? []) : [];
			const quizJson = quizData ? JSON.parse(quizData) : null;
			const quizBadges = quizJson?.badges ?? [];
			const studyJson = studyData ? JSON.parse(studyData) : null;
			const studiedIds: number[] = studyJson?.studyProverbs ?? [];
			const studyCounts = studyJson?.studyCounts ?? {};
			const lastDate = studyJson?.lastStudyAt ?? '';

			const allProverbs = ProverbServices.selectProverbList();
			setTotalCountryCount(allProverbs.length);
			setStudyCountries(studiedIds.map(String)); // 화면 출력용
			setLastStudyAt(lastDate);

			const totalCount = (Object.values(studyCounts) as number[]).reduce((a, b) => a + b, 0);
			setTotalStudyCount(totalCount);
			// ✅ 수정 - 올바른 키 사용
			const towerRaw = await AsyncStorage.getItem(MainStorageKeyType.TOWER_CHALLENGE_PROGRESS);
			const towerParsed: TowerProgress = towerRaw ? JSON.parse(towerRaw) : {};
			setUnlockedRewards(towerParsed.unlockedRewards ?? []);

			setTotalScore(quizJson?.totalScore ?? 0);
			setCorrectCount(quizJson?.correctProverbId?.length ?? 0);
			setWrongCount(quizJson?.wrongProverbId?.length ?? 0);
			setLastAnsweredAt(quizJson?.lastAnsweredAt ?? '');
			setBestCombo(quizJson?.bestCombo ?? 0);

			const timeData = await AsyncStorage.getItem(STORAGE_KEY_TIME);
			const timeResults: MainDataType.TimeChallengeResult[] = timeData ? JSON.parse(timeData) : [];
			setTimeChallengeResults(timeResults.slice(0, 3)); // 최근 3개만 보기

			const allBadges = [...new Set([...studyBadges, ...quizBadges])];
			setEarnedBadgeIds(allBadges);

			console.log(allCategories);

			// 정복한 카테고리만 추출
			const conqueredCategories = Object.entries(categoryMap2)
				.filter(([_, badgeId]) => allBadges.includes(badgeId))
				.map(([label]) => label);

			setCategoryMaster(conqueredCategories);

			// 🔽 earnedBadgeIds 대신 allBadges 사용
			const conqueredLevels = Object.entries(STYLE_MAP)
				.filter(([_, v]) => allBadges.includes(v.badgeId)) // ✅ 수정됨
				.map(([k]) => {
					switch (k) {
						case '초급':
							return 'Level 1';
						case '중급':
							return 'Level 2';
						case '고급':
							return 'Level 3';
						case '특급':
							return 'Level 4';
						default:
							return '';
					}
				});

			setLevelMaster(conqueredLevels);

			// 타임 챌린지 정보
			const todayJson = await AsyncStorage.getItem(STORAGE_KEY_TODAY);
			const todayData: MainDataType.TodayQuizList[] = todayJson ? JSON.parse(todayJson) : [];

			const marked = todayData.reduce(
				(acc, item) => {
					const dateKey = item.quizDate.slice(0, 10);
					acc[dateKey] = {
						marked: true,
						dotColor: '#22C55E',
						customStyles: {
							container: {
								backgroundColor: '#EFF6FF',
							},
							text: {
								color: '#22C55E',
								fontWeight: 'bold',
							},
						},
					};
					return acc;
				},
				{} as Record<string, any>,
			);

			const todayStr = moment().format('YYYY-MM-DD');

			marked[todayStr] = {
				...(marked[todayStr] || {}),
				customStyles: {
					container: {
						backgroundColor: '#3B82F6', // 🎨 밝은 파란색
					},
					text: {
						color: '#fff',
						fontWeight: 'bold',
					},
				},
			};
			console.log('todayData :', todayData);

			setTodayQuizDataList(todayData); // todayData를 상태로 저장

			setMarkedQuizDates(marked);
		} catch (e) {
			console.error('❌ 데이터 로딩 실패:', e);
		}
	};

	// ✅ PET_REWARDS 인덱스 매핑: 1일→0(견습생), 7일→1(훈련생), 14일→2(수련생), 21일→3(졸업생), 28일→4(마스터)
	const getPetLevel = (checkedIn: { [date: string]: any }) => {
		const count = Object.keys(checkedIn).length;
		if (count >= 28) { return 4; }
		if (count >= 21) { return 3; }
		if (count >= 14) { return 2; }
		if (count >= 7) { return 1; }
		if (count >= 1) { return 0; } // ✅ 1일 이상이면 첫 번째 펫 표시
		return -1;
	};

	const loadCheckedInDates = async () => {
		const json = await AsyncStorage.getItem(STORAGE_KEY_TODAY);
		if (!json) {
			return;
		}

		const arr: MainDataType.TodayQuizList[] = JSON.parse(json);
		const todayStr = new Date().toISOString().slice(0, 10);

		console.log('arr : ', arr);
		console.log('todayStr : ', todayStr);

		const marked: { [date: string]: any } = {};
		arr.forEach((item) => {
			if (item.isCheckedIn) {
				const date = item.quizDate.slice(0, 10);
				const isToday = date === todayStr;

				marked[date] = {
					customStyles: {
						container: {
							backgroundColor: isToday ? '#F59E0B' : '#22C55E', // ✅ 앰버: 오늘(강조), 블루: 이전 출석
							borderRadius: scaleWidth(6),
						},
						text: {
							color: '#fff',
							fontWeight: 'bold',
						},
					},
				};
			}
		});
		setPetLevel(getPetLevel(marked)); // ✅ 추가
	};
	// ISO 형식 대응 버전
	const getRelativeDateLabel = (isoString: string): string => {
		try {
			const inputDate = new Date(isoString);
			const now = new Date();

			const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const startOfInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

			const diffMs = startOfToday.getTime() - startOfInput.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

			const hour = inputDate.getHours();
			const minute = inputDate.getMinutes();
			const timeStr = `${hour}:${String(minute).padStart(2, '0')}`;

			if (diffDays === 0) {
				return `오늘, ${timeStr}`;
			}
			if (diffDays === 1) {
				return `어제, ${timeStr}`;
			}
			if (diffDays === 2) {
				return `그제, ${timeStr}`;
			}
			if (diffDays < 7) {
				return `${diffDays}일 전`;
			}
			if (diffDays < 30) {
				return `${Math.floor(diffDays / 7)}주 전`;
			}

			const y = inputDate.getFullYear();
			const m = String(inputDate.getMonth() + 1).padStart(2, '0');
			const d = String(inputDate.getDate()).padStart(2, '0');
			return `${y}. ${m}. ${d}. ${timeStr}`;
		} catch {
			return isoString;
		}
	};

	const toggleAllSections = () => {
		const nextState = !isAllExpanded;
		setIsAllExpanded(nextState);
		setShowStudySection(nextState);
		setShowQuizSection(nextState);
		setShowTimeSection(nextState);
		setShowBadgeSection(nextState);
		setShowTodayQuizSection(nextState); // ✅ 추가됨
		setShowTowerSection(nextState); // ✅ 추가
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
	};

	const onRefresh = () => {
		setRefreshing(true);
		loadData().finally(() => setRefreshing(false)); // ✅ 이 방식 권장
	};

	const handleScrollToTop = () => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	const toggleBadgeList = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setShowBadgeList((prev) => !prev);
	};

	const handleClearSelectedDate = () => {
		if (!selectedDate) {
			return;
		}

		setMarkedQuizDates((prev) => {
			const updated = { ...prev };

			// 선택된 날짜 마킹이 있으면 제거하거나 기존 마킹만 남김
			const originalMark = todayQuizDataList.find((item) => moment(item.quizDate).format('YYYY-MM-DD') === selectedDate);

			if (originalMark) {
				updated[selectedDate] = {
					marked: true,
					dotColor: '#22C55E',
					customStyles: {
						container: {
							backgroundColor: '#EFF6FF',
						},
						text: {
							color: '#22C55E',
							fontWeight: 'bold',
						},
					},
				};
			} else {
				delete updated[selectedDate]; // 마킹도 없으면 삭제
			}

			return updated;
		});

		setSelectedDate(null);
		setSelectedQuizData(null);
	};

	const totalSolved = correctCount + wrongCount;
	const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

	const LEVEL_DATA = [
		{
			score: 0,
			next: 1000,
			label: '속담 초심자',
			icon: 'seedling',
			mascot: require('@/assets/images/level1_mascote.png'),
			encouragement: '🌱 첫걸음을 내디뎠어요!\n앞으로가 더욱 기대돼요!',
			description: '속담 학습의 출발선에 선 단계로,\n새싹처럼 작은 배움부터 차근차근 키워가는 시기예요.\n앞으로의 성장이 더욱 기대됩니다.',
		},
		{
			score: 1000,
			next: 2000,
			label: '속담 입문자',
			icon: 'leaf',
			mascot: require('@/assets/images/level2_mascote.png'),
			encouragement: '🍃 좋은 출발이에요!\n조금씩 자신감이 붙고 있어요!',
			description: '기초 속담에 차츰 익숙해지고,\n다양한 표현을 접하며 감을 쌓아가는 단계예요.\n이제 막 본격적인 성장의 길에 들어섰습니다.',
		},
		{
			score: 2000,
			next: 3000,
			label: '속담 숙련자',
			icon: 'tree',
			mascot: require('@/assets/images/level3_mascote.png'),
			encouragement: '🌳 지식이 뿌리내려 점점 자라고 있어요!\n이제 훨씬 더 능숙해졌네요!',
			description: '속담의 의미와 쓰임새를 제대로 이해하고,\n실전에서도 능숙하게 활용할 수 있는 단계예요.\n기초를 넘어 한층 성숙한 실력을 갖췄습니다.',
		},
		{
			score: 3000,
			next: 5000,
			label: '속담 고수',
			icon: 'chess-knight',
			mascot: require('@/assets/images/level4_mascote.png'),
			encouragement: '⚔️ 속담의 전장에서 승리하고 있어요!\n어떤 도전도 당당히 맞설 수 있네요!',
			description: '속담을 무기처럼 활용하며,\n어려운 문제도 당당히 맞설 수 있는 단계예요.\n탄탄한 자신감으로 진정한 실력을 보여줍니다.',
		},
		{
			score: 5000,
			next: 7000,
			label: '속담 마스터',
			icon: 'trophy',
			mascot: require('@/assets/images/level5_mascote2.png'),
			encouragement: '👑 속담의 왕좌에 올랐습니다!\n당신은 이제 속담의 진정한 달인입니다!',
			description: '속담을 자유자재로 구사하며,\n누구에게나 귀감이 되는 지혜의 경지에 올랐습니다.\n속담의 참뜻을 깨닫고 삶에 녹여내는 최상위 단계예요.',
		},
		{
			score: 7000,
			next: 99999,
			label: '속담 전설',
			icon: 'crown',
			mascot: require('@/assets/images/level6_mascote.png'),
			encouragement: '🌌 전설이 되셨습니다!\n속담의 모든 지혜를 완전히 정복한 유일무이한 존재예요!',
			description: '790개 속담을 모두 정복하고,\n그 깊은 지혜를 삶 속에 온전히 녹여낸 최고의 경지예요.\n당신의 이름은 속담의 역사에 새겨질 것입니다.',
		},
	];

	const reversedLevelGuide = [...LEVEL_DATA].reverse();
	const currentLevelIndex = reversedLevelGuide.findIndex((item) => totalScore >= item.score && totalScore < item.next);
	useEffect(() => {
		if (showLevelModal && levelScrollRef.current) {
			setTimeout(() => {
				levelScrollRef.current?.scrollTo({
					y: currentLevelIndex * scaleHeight(150), // 카드 높이 예상값
					animated: true,
				});
			}, 100); // 모달이 나타난 후 살짝 delay
		}
	}, [showLevelModal]);

	/**
	 * 스크롤을 관리하는 Handler
	 */
	const scrollHandler = (() => {
		return {
			/**
			 * 스크롤 최상단으로 당기면 Refresh 기능
			 */
			onRefresh: () => {
				// TODO: 로직을 불러오는 부분을 추가해야함.
				setRefreshing(true);
			},

			/**
			 * 스크롤을 일정 높이 만큼 움직였을때 아이콘 등장 처리
			 * @param event
			 */
			onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
				const offsetY = event.nativeEvent.contentOffset.y;
				setShowScrollTop(offsetY > 100);
			},
			/**
			 * 스크롤 최상단으로 이동
			 * @return {void}
			 */
			toTop: (): void => {
				scrollRef.current?.scrollTo({ y: 0, animated: true });
			},

			/**
			 * 스크롤 뷰 최하단으로 이동
			 * @return {void}
			 */
			toBottom: (): void => {
				setTimeout(() => {
					scrollRef.current?.scrollToEnd({ animated: true });
				}, 100);
			},
		};
	})();

	const updateMarkedQuizDatesOnSelect = (
		date: string,
		prevDate: string | null,
		setMarkedQuizDates: React.Dispatch<React.SetStateAction<{ [date: string]: any }>>,
		todayQuizDataList: MainDataType.TodayQuizList[],
	) => {
		setMarkedQuizDates((prev) => {
			const updated = { ...prev };

			// ✅ 이전 선택 날짜 초기화
			if (prevDate && updated[prevDate]) {
				const wasChecked = todayQuizDataList.some((item) => moment(item.quizDate).format('YYYY-MM-DD') === prevDate);

				if (wasChecked) {
					updated[prevDate] = {
						marked: true,
						dotColor: '#22C55E',
						customStyles: {
							container: {
								backgroundColor: '#EFF6FF',
							},
							text: {
								color: '#22C55E',
								fontWeight: 'bold',
							},
						},
					};
				} else {
					delete updated[prevDate];
				}
			}

			// ✅ 새 선택 날짜 강조
			updated[date] = {
				...(updated[date] || {}),
				customStyles: {
					container: {
						backgroundColor: '#E2E8F0',
					},
					text: {
						color: '#334155',
						fontWeight: 'bold',
					},
				},
			};

			return updated;
		});
	};

	const levelGuide = [
		{ score: 0, next: 600, label: '속담 초보자', icon: 'seedling' },
		{ score: 600, next: 1200, label: '속담 입문자', icon: 'leaf' },
		{ score: 1200, next: 1800, label: '여행 능력자', icon: 'tree' },
		{ score: 1800, next: 2461, label: '속담 마스터', icon: 'trophy' },
	];

	const getEncourageMessage = (score: number) => {
		if (score >= 1800) {
			return '🌎 당신은 속담 마스터! 모두가 당신을 주목해요!';
		}
		if (score >= 1200) {
			return '🌍 이제 마스터까지 한 걸음! 계속 도전해요!';
		}
		if (score >= 600) {
			return '✈️ 더 넓은 세계가 당신을 기다리고 있어요!';
		}
		return '🚀 지금부터 시작이에요! 차근차근 도전해봐요!';
	};
	const getTitleByScore = (score: number) => {
		const level = LEVEL_DATA.find((level) => score >= level.score && score < level.next) || LEVEL_DATA[0];
		return {
			label: level.label,
			icon: level.icon,
			mascot: level.mascot,
			description: level.description, // ✅ 이 라인에서 가져옴
		};
	};
	const { label, icon, mascot, description } = getTitleByScore(totalScore);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<ScrollView
				ref={scrollRef}
				style={styles.container}
				contentContainerStyle={{ paddingBottom: scaleHeight(40), flexGrow: 1 }}
				onScroll={scrollHandler.onScroll}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
				<View style={styles.sectionBox}>
					<Animated.View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: scaleHeight(8), opacity: mascotFade, transform: [{ scale: mascotScale }], position: 'relative' }}>
						{/* ✅ 홈화면과 동일한 캐릭터/펫 배치 구조 (180 래퍼 + 150 이미지, 펫은 캐릭터 우측) */}
						<View style={{ width: scaleWidth(180), height: scaleWidth(180), alignItems: 'center', justifyContent: 'center' }}>
							<FastImage
								source={mascot}
								style={{ width: scaleWidth(150), height: scaleWidth(150) }}
								resizeMode={FastImage.resizeMode.contain}
							/>
						</View>

						{petLevel >= 0 && (
							<View
								style={{
									position: 'absolute',
									right: scaleWidth(40),
									top: scaleHeight(38),
									width: scaleWidth(60),
									height: scaleWidth(60),
									borderRadius: scaleWidth(30),
									borderWidth: 2,
									borderColor: '#22C55E',
									overflow: 'hidden',
								}}>
								<FastImage source={PET_REWARDS[petLevel].image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
							</View>
						)}
					</Animated.View>
					<View style={{ alignItems: 'center' }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(10) }}>
							<TouchableOpacity
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
								activeOpacity={0.7}
								onPress={() => setShowLevelModal(true)}>
								<IconComponent type="fontAwesome6" name={icon} size={scaledSize(18)} color="#22C55E" />
								<Text style={{ fontSize: scaledSize(16), color: '#22C55E', fontWeight: '700', marginLeft: scaleWidth(6) }}>
									{label}
								</Text>
								<IconComponent
									type="materialIcons"
									name="info-outline"
									size={scaledSize(18)}
									color="#64748B"
									style={{ marginLeft: scaleWidth(4), marginTop: scaleHeight(1) }}
								/>
							</TouchableOpacity>
						</View>

						<View style={styles.scoreBadge}>
							<IconComponent name="leaderboard" type="materialIcons" size={scaledSize(14)} color="#fff" />
							<Text style={styles.scoreBadgeText}>{totalScore.toLocaleString()}점</Text>
						</View>
					</View>

					<View style={styles.levelDescriptionCard}>
						<View style={[styles.levelDescIconChip, { backgroundColor: '#FEF3C7' }]}>
							<IconComponent type="fontAwesome6" name="trophy" size={scaledSize(14)} color="#F59E0B" />
						</View>
						<Text style={styles.levelDescriptionText} numberOfLines={1} adjustsFontSizeToFit>
							전체 퀴즈 완료 시 <Text style={[styles.levelHighlight, { color: '#D97706' }]}>'도인'</Text> 등급을 획득해요
						</Text>
					</View>

					<View style={styles.levelDescriptionCard}>
						<View style={[styles.levelDescIconChip, { backgroundColor: '#DCFCE7' }]}>
							<IconComponent type="fontAwesome6" name="arrow-rotate-right" size={scaledSize(14)} color="#16A34A" />
						</View>
						<Text style={styles.levelDescriptionText} numberOfLines={1} adjustsFontSizeToFit>
							틀린 문제는 <Text style={styles.levelHighlight}>오답 복습</Text>에서 다시 도전할 수 있어요
						</Text>
					</View>
				</View>

				{/* ✅ 전체 스코어 대시보드 (항상 표시) */}
				{(() => {
					const studyPct = totalCountryCount > 0 ? Math.round((studyCountries.length / totalCountryCount) * 100) : 0;
					const solvedPct = totalCountryCount > 0 ? Math.round((totalSolved / totalCountryCount) * 100) : 0;
					const badgePct = CONST_BADGES.length > 0 ? Math.round((earnedBadgeIds.length / CONST_BADGES.length) * 100) : 0;
					const metrics = [
						{ icon: 'school', color: '#22C55E', soft: '#DCFCE7', label: '학습 진척도', value: `${studyCountries.length}/${totalCountryCount}`, pct: studyPct },
						{ icon: 'check-circle', color: '#3B82F6', soft: '#DBEAFE', label: '퀴즈 정답률', value: `${accuracy}%`, pct: accuracy },
						{ icon: 'play-circle-filled', color: '#14B8A6', soft: '#CCFBF1', label: '퀴즈 진척도', value: `${totalSolved}/${totalCountryCount}`, pct: solvedPct },
						{ icon: 'military-tech', color: '#F59E0B', soft: '#FEF3C7', label: '획득 뱃지', value: `${earnedBadgeIds.length}/${CONST_BADGES.length}`, pct: badgePct },
					];
					return (
						<View style={styles.scoreDashCard}>
							<View style={styles.scoreDashHeader}>
								<View style={styles.scoreDashTitleRow}>
									<View style={styles.scoreDashIconChip}>
										<IconComponent type="materialIcons" name="insights" size={scaledSize(16)} color="#fff" />
									</View>
									<Text style={styles.scoreDashTitle}>전체 스코어</Text>
								</View>
								<View style={styles.scoreDashScorePill}>
									<IconComponent type="materialIcons" name="stars" size={scaledSize(14)} color="#F59E0B" />
									<Text style={styles.scoreDashScoreText}>{totalScore.toLocaleString()}점</Text>
								</View>
							</View>
							<View style={styles.scoreDashGrid}>
								{metrics.map((m) => (
									<View key={m.label} style={styles.scoreDashTile}>
										<View style={styles.scoreDashTileTop}>
											<View style={[styles.scoreDashTileIcon, { backgroundColor: m.soft }]}>
												<IconComponent type="materialIcons" name={m.icon} size={scaledSize(15)} color={m.color} />
											</View>
											<Text style={styles.scoreDashTileLabel}>{m.label}</Text>
										</View>
										<Text style={styles.scoreDashTileValue}>{m.value}</Text>
										<View style={styles.scoreDashBarTrack}>
											<View style={[styles.scoreDashBarFill, { width: `${Math.min(m.pct, 100)}%`, backgroundColor: m.color }]} />
										</View>
										<Text style={[styles.scoreDashTilePct, { color: m.color }]}>{m.pct}%</Text>
									</View>
								))}
							</View>
						</View>
					);
				})()}

				{/* ✅ 빠른 탐색 탭 바 — 원하는 활동을 바로 선택 */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.activityTabBar}>
					{ACTIVITY_TABS.map((tab) => {
						const isActive = activeTab === tab.key;
						return (
							<TouchableOpacity
								key={tab.key}
								activeOpacity={0.8}
								onPress={() => setActiveTab(tab.key)}
								style={[styles.activityTabChip, isActive && styles.activityTabChipActive]}>
								<IconComponent
									type="materialIcons"
									name={tab.icon}
									size={scaledSize(15)}
									color={isActive ? '#fff' : '#64748B'}
								/>
								<Text style={[styles.activityTabText, isActive && styles.activityTabTextActive]}>{tab.label}</Text>
							</TouchableOpacity>
						);
					})}
				</ScrollView>

				<View style={styles.activityGroupBox}>

				{(activeTab === 'all' || activeTab === 'study') && (
				<View style={styles.sectionHeaderStatic}>
					<View style={styles.iconCircle1}>
						<IconComponent type="materialIcons" name="school" size={scaledSize(16)} color="#fff" />
					</View>
					<Text style={styles.sectionTitle}>나의 학습 활동</Text>
				</View>
				)}
				{(activeTab === 'all' || activeTab === 'study') && (
					<View style={styles.activityCardBox}>
						<View style={styles.chartRow}>
							<DonutChart
								percent={totalCountryCount > 0 ? Math.round((studyCountries.length / totalCountryCount) * 100) : 0}
								size={88}
								strokeWidth={10}
								color="#22C55E">
								<AnimatedCounter
									value={totalCountryCount > 0 ? Math.round((studyCountries.length / totalCountryCount) * 100) : 0}
									suffix="%"
									style={styles.donutCenterValue}
								/>
								<Text style={styles.donutCenterLabel}>학습률</Text>
							</DonutChart>
							<View style={styles.chartLegend}>
								<Text style={styles.chartLegendTitle}>나의 학습 진척도</Text>
								<View style={styles.chartLegendRow}>
									<View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
									<Text style={styles.chartLegendText}>
										학습한 속담 <Text style={styles.chartLegendStrong}>{studyCountries.length}개</Text>
									</Text>
								</View>
								<View style={styles.chartLegendRow}>
									<View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
									<Text style={styles.chartLegendText}>
										남은 속담{' '}
										<Text style={styles.chartLegendStrong}>{Math.max(totalCountryCount - studyCountries.length, 0)}개</Text>
									</Text>
								</View>
							</View>
						</View>
						<View style={styles.summaryStatGrid}>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: '#DCFCE7' }]}>
									<IconComponent type="materialIcons" name="track-changes" size={scaledSize(18)} color="#22C55E" />
								</View>
								<Text style={styles.statValue}>
									{studyCountries.length} / {totalCountryCount}
								</Text>
								<Text style={styles.statLabel}>
									학습 완료 ({Math.round((studyCountries.length / totalCountryCount) * 100)}%)
								</Text>
							</View>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: '#DBEAFE' }]}>
									<IconComponent type="materialIcons" name="event-note" size={scaledSize(18)} color="#3B82F6" />
								</View>
								<Text style={styles.statValue}> {lastStudyAt ? moment(lastStudyAt).format('YY.MM.DD') : '없음'} </Text>
								<Text style={styles.statLabel}> 마지막 학습일 </Text>
							</View>
						</View>
					</View>
				)}

				{/* 나의 퀴즈 활동 요약 */}
				{(activeTab === 'all' || activeTab === 'quiz') && (
				<View style={styles.sectionHeaderStatic}>
					<View style={styles.iconCircle2}>
						<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(16)} color="#fff" />
					</View>
					<Text style={styles.sectionTitle}>나의 퀴즈 활동</Text>
				</View>
				)}
				{(activeTab === 'all' || activeTab === 'quiz') && (
					<View style={styles.activityCardBox}>
						<View style={styles.chartRow}>
							<DonutChart percent={accuracy} size={88} strokeWidth={10} color="#3B82F6">
								<AnimatedCounter value={accuracy} suffix="%" style={[styles.donutCenterValue, { color: '#3B82F6' }]} />
								<Text style={styles.donutCenterLabel}>정답률</Text>
							</DonutChart>
							<View style={styles.chartLegend}>
								<Text style={styles.chartLegendTitle}>정답 / 오답 비율</Text>
								<View style={styles.chartLegendRow}>
									<View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
									<Text style={styles.chartLegendText}>
										정답 <Text style={styles.chartLegendStrong}>{correctCount}개</Text>
									</Text>
								</View>
								<View style={styles.chartLegendRow}>
									<View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
									<Text style={styles.chartLegendText}>
										오답 <Text style={styles.chartLegendStrong}>{wrongCount}개</Text>
									</Text>
								</View>
								<View style={styles.stackBarTrack}>
									<View style={[styles.stackBarCorrect, { flex: totalSolved > 0 ? correctCount : 1 }]} />
									<View style={[styles.stackBarWrong, { flex: totalSolved > 0 ? wrongCount : 0 }]} />
								</View>
							</View>
						</View>
						<View style={styles.summaryStatCard}>
							<View style={[styles.statIconChip, { backgroundColor: '#DBEAFE' }]}>
								<IconComponent type="materialIcons" name="calculate" size={scaledSize(18)} color="#3B82F6" />
							</View>
							<Text style={styles.statValue}>
								{totalSolved} / {totalCountryCount}
							</Text>
							<Text style={styles.statLabel}> 총 푼 퀴즈 ({Math.round((totalSolved / totalCountryCount) * 100)}%) </Text>
							<View style={styles.progressBarBackground}>
								<View style={[styles.progressBarFill, { width: `${Math.round((totalSolved / totalCountryCount) * 100)}%` }]} />
							</View>
						</View>
						<View style={styles.summaryStatGrid}>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: '#FFEDD5' }]}>
									<IconComponent type="fontAwesome6" name="fire" size={scaledSize(16)} color="#F97316" />
								</View>
								<Text style={styles.statValue}> {bestCombo} Combo </Text>
								<Text style={styles.statLabel}> 최고 콤보 </Text>
							</View>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: '#DCFCE7' }]}>
									<IconComponent type="materialIcons" name="check-circle" size={scaledSize(18)} color="#22C55E" />
								</View>
								<Text style={styles.statValue}> {accuracy}% </Text>
								<Text style={styles.statLabel}> 정답률 </Text>
							</View>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: '#CCFBF1' }]}>
									<IconComponent type="materialIcons" name="calendar-today" size={scaledSize(16)} color="#14B8A6" />
								</View>
								<Text style={styles.statValue}> {lastAnsweredAt ? moment(lastAnsweredAt).format('YY.MM.DD') : '없음'} </Text>
								<Text style={styles.statLabel}> 마지막 퀴즈일 </Text>
							</View>
						</View>

						<View style={styles.subSectionBox2}>
							<View style={styles.subtitleRow}>
								<IconComponent type="fontAwesome6" name="medal" size={scaledSize(15)} color="#F59E0B" />
								<Text style={styles.sectionSubtitleInline}>
									정복한 레벨 ({levelMaster.length} / {DIFFICULTIES.length})
								</Text>
							</View>
							<Text style={styles.levelHelperText}> - 각 레벨의 속담 퀴즈를 모두 풀었을때 획득할 수 있습니다! </Text>
							<View style={{ alignItems: 'center' }}>
								<FlatList
									data={DIFFICULTIES}
									keyExtractor={(item) => item.key}
									numColumns={2}
									scrollEnabled={false}
									columnWrapperStyle={{ justifyContent: 'space-around' }}
									renderItem={({ item }) => {
										const isEarned = levelMaster.includes(item.title);
										const levelStyle = getLevelStyle(item.subtitle);
										return (
											<View
												style={[
													styles.levelCard,
													isEarned && {
														backgroundColor: levelStyle.bg,
														borderColor: levelStyle.border,
													},
												]}>
												<IconComponent
													name={item.icon}
													type="fontAwesome6"
													size={scaledSize(22)}
													color={isEarned ? '#fff' : '#CBD5E1'}
													style={{ marginBottom: scaleHeight(4) }}
												/>
												<Text style={[styles.levelText, isEarned && { color: '#fff', fontWeight: 'bold' }]}> {item.title} </Text>
												<Text style={[styles.levelSubText, isEarned && { color: '#fff' }]}> {item.subtitle} </Text>

												{/* ✅ 정복 배지 추가 */}
												{isEarned && (
													<View
														style={{
															marginTop: scaleHeight(6),
															backgroundColor: '#fff',
															paddingHorizontal: scaleWidth(6),
															paddingVertical: scaleHeight(2),
															borderRadius: scaleWidth(10),
														}}>
														<Text
															style={{
																fontSize: scaledSize(12),
																color: '#22C55E',
																fontWeight: 'bold',
																textAlign: 'center',
															}}>
															정복
														</Text>
													</View>
												)}
											</View>
										);
									}}
								/>
							</View>
						</View>

						{/* ✅ 정복한 카테고리 출력 */}
						<View style={styles.subSectionBox1}>
							<View style={styles.subtitleRow}>
								<IconComponent type="fontAwesome6" name="brain" size={scaledSize(15)} color="#0EA5E9" />
								<Text style={styles.sectionSubtitleInline}>
									정복한 카테고리 ({categoryMaster.length} / {allCategories.length})
								</Text>
							</View>
							<Text style={styles.regionHelperText}>- 특정 분야의 속담를 모두 풀었을때 획득할 수 있습니다.</Text>
							<FlatList
								data={allCategories}
								keyExtractor={(item) => item}
								scrollEnabled={false}
								renderItem={({ item: category }) => {
									const isEarned = categoryMaster.includes(category);
									const categoryInfo = FIELD_DROPDOWN_ITEMS.find((item) => item.label === category || item.value === category);
									const meta = {
										color: categoryInfo?.iconColor ?? CATEGORY_META[category]?.color ?? '#CBD5E1',
										icon: {
											type: categoryInfo?.iconType ?? 'FontAwesome6',
											name: categoryInfo?.iconName ?? 'circle-question',
										},
									};

									return (
										<View
											style={[
												styles.categoryRowCard,
												isEarned && {
													backgroundColor: meta.color,
													borderColor: meta.color,
													shadowColor: '#000',
													shadowOpacity: 0.2,
													shadowRadius: 4,
													shadowOffset: { width: 0, height: 2 },
												},
											]}>
											<IconComponent
												type={meta.icon.type}
												name={meta.icon.name}
												size={scaledSize(20)}
												color={isEarned ? '#fff' : '#CBD5E1'}
												style={{ marginRight: scaleWidth(8) }}
											/>
											<Text
												style={[
													styles.categoryRowText,
													isEarned && {
														color: '#fff',
														fontWeight: 'bold',
														textShadowColor: 'rgba(0, 0, 0, 0.15)',
														textShadowOffset: { width: 1, height: 1 },
														textShadowRadius: 2,
													},
												]}>
												{category}
											</Text>
											{/* ✅ 이 위치에 추가 */}
											{isEarned && (
												<View
													style={{
														marginLeft: 'auto',
														backgroundColor: '#fff',
														paddingHorizontal: scaleWidth(6),
														paddingVertical: scaleHeight(2),
														borderRadius: scaleWidth(10),
													}}>
													<Text
														style={{
															fontSize: scaledSize(12),
															color: '#22C55E',
															fontWeight: 'bold',
														}}>
														정복
													</Text>
												</View>
											)}
										</View>
									);
								}}
							/>
						</View>
					</View>
				)}

				{(activeTab === 'all' || activeTab === 'today') && (
				<View style={styles.sectionHeaderStatic}>
					<View style={styles.iconCircle4}>
						<IconComponent type="materialIcons" name="calendar-today" size={scaledSize(16)} color="#fff" />
					</View>
					<Text style={styles.sectionTitle}>나의 오늘의 퀴즈</Text>
				</View>
				)}

				{(activeTab === 'all' || activeTab === 'today') && (
					<View style={[styles.sectionBox, {}]}>
						<Calendar
							markedDates={markedQuizDates}
							markingType="custom"
							style={[styles.calendarStyle, { width: '100%' }]}
							onDayPress={(day) => {
								const date = day.dateString;
								const matchedData = todayQuizDataList.find((item) => moment(item.quizDate).format('YYYY-MM-DD') === date);
								setSelectedDate(date);
								setSelectedQuizData(matchedData ?? null);

								updateMarkedQuizDatesOnSelect(date, selectedDate, setMarkedQuizDates, todayQuizDataList);
							}}
							theme={{
								calendarBackground: '#fff',
								todayTextColor: '#22C55E',
								textDayFontSize: 14,
								textMonthFontSize: 16,
								textDayHeaderFontSize: 13,
							}}
						/>
						<View style={[styles.subtitleRow, { marginTop: scaleHeight(8) }]}>
							<IconComponent type="materialIcons" name="fiber-manual-record" size={scaledSize(12)} color="#22C55E" />
							<Text style={{ fontSize: scaledSize(12), color: '#64748B' }}>표시는 오늘의 퀴즈를 모두 푼 날입니다.</Text>
						</View>

						{selectedDate === null && (
							<View style={[styles.subtitleRow, { marginTop: scaleHeight(6), marginBottom: 0 }]}>
								<IconComponent type="materialIcons" name="calendar-today" size={scaledSize(13)} color="#94A3B8" />
								<Text style={styles.emptyText}>날짜를 선택해 주세요.</Text>
							</View>
						)}

						{selectedDate && selectedQuizData === null && (
							<View
								style={{
									borderWidth: 1,
									borderColor: '#E2E8F0',
									backgroundColor: '#F8FAFC',
									borderRadius: scaleWidth(10),
									padding: scaleWidth(14),
									marginTop: scaleHeight(10),
									alignSelf: 'stretch',
								}}>
								<Text style={{ fontSize: scaledSize(13), color: '#94A3B8', textAlign: 'left' }}>
									선택한 날짜에는 오늘의 퀴즈를 풀지 않았어요
								</Text>
							</View>
						)}

						{selectedDate && selectedQuizData && (
							<View style={[styles.sectionBox, { marginTop: scaleHeight(10), borderWidth: 0, paddingHorizontal: 0, paddingVertical: scaleHeight(6), backgroundColor: 'transparent' }]}>
								<Text style={styles.sectionSubtitle}>{selectedDate} 퀴즈 결과</Text>
								{selectedQuizData?.todayQuizIdArr.map((quizId, idx) => {
									const userAnswer = selectedQuizData.selectedAnswers?.[quizId];
									const isCorrect = selectedQuizData.answerResults?.[quizId];
									const quizItem = ProverbServices.selectProverbById(quizId); // 예시 함수

									return (
										<TouchableOpacity
											key={idx}
											activeOpacity={0.85}
											onPress={() => {
												if (quizItem) {
													setDetailProverb(quizItem);
													setDetailVisible(true);
												}
											}}
											style={{
												width: '100%', // 👈 추가
												backgroundColor: '#fff',
												borderRadius: scaleWidth(12),
												paddingVertical: scaleHeight(14),
												paddingHorizontal: scaleWidth(14),
												borderWidth: 0,
												marginBottom: scaleHeight(12),
												shadowColor: '#000',
												shadowOffset: { width: 0, height: 1 },
												shadowOpacity: 0.05,
												shadowRadius: 2,
												alignSelf: 'stretch', // ✅ 전체 너비 확보
											}}>
											<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: scaleWidth(8) }}>
												<View style={{ flex: 1 }}>
													<Text
														style={{
															fontSize: scaledSize(14),
															fontWeight: 'bold',
															marginBottom: scaleHeight(8),
															color: '#334155',
														}}>
														{idx + 1}. {quizItem?.proverb ?? '문제 정보 없음'}
													</Text>

													{/* ✅ 정답/오답 배지 */}
													{isCorrect !== undefined && (
														<View
															style={{
																alignSelf: 'flex-start',
																flexDirection: 'row',
																alignItems: 'center',
																gap: scaleWidth(4),
																backgroundColor: isCorrect ? '#DCFCE7' : '#FEE2E2',
																borderRadius: scaleWidth(8),
																paddingHorizontal: scaleWidth(9),
																paddingVertical: scaleHeight(3),
																marginBottom: scaleHeight(8),
															}}>
															<IconComponent
																type="materialIcons"
																name={isCorrect ? 'check-circle' : 'cancel'}
																size={scaledSize(13)}
																color={isCorrect ? '#16A34A' : '#DC2626'}
															/>
															<Text style={{ fontSize: scaledSize(12), fontWeight: '800', color: isCorrect ? '#16A34A' : '#DC2626' }}>
																{isCorrect ? '정답' : '오답'}
															</Text>
														</View>
													)}
													{!!(quizItem?.longMeaning || quizItem?.meaning) && (
														<Text style={{ fontSize: scaledSize(12.5), color: '#64748B', lineHeight: scaleHeight(18) }} numberOfLines={2}>
															{quizItem.longMeaning || quizItem.meaning}
														</Text>
													)}
												</View>
												<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color="#94A3B8" style={{ marginTop: scaleHeight(2) }} />
											</View>
										</TouchableOpacity>
									);
								})}
							</View>
						)}

						{/* {selectedDate && (
							<TouchableOpacity
								onPress={handleClearSelectedDate}
								style={{
									alignSelf: 'center',
									marginTop: scaleHeight(8),
									paddingHorizontal: scaleWidth(12),
									paddingVertical: scaleHeight(4),
									backgroundColor: '#E2E8F0',
									borderRadius: scaleWidth(8),
								}}>
								<Text style={{ fontSize: scaledSize(12), color: '#334155' }}>선택 해제</Text>
							</TouchableOpacity>
						)} */}
					</View>
				)}

				{/* 기존 결과 화면 */}
				{(activeTab === 'all' || activeTab === 'time') && (
				<View style={styles.sectionHeaderStatic}>
					<View style={styles.iconCircle3}>
						<IconComponent type="materialIcons" name="timer" size={scaledSize(16)} color="#fff" />
					</View>
					<Text style={styles.sectionTitle}>나의 타임 챌린지 결과</Text>
				</View>
				)}

				{(activeTab === 'all' || activeTab === 'time') && (
					<View style={styles.sectionBox}>
						<View style={styles.subtitleRow}>
							<IconComponent type="materialIcons" name="leaderboard" size={scaledSize(16)} color="#F97316" />
							<Text style={styles.topRankingTitleInline}>나의 랭킹 TOP 3</Text>
						</View>

						{timeChallengeResults.length === 0 ? (
							<Text style={styles.noRecordText}>아직 기록이 없습니다. 챌린지를 시작해보세요!</Text>
						) : (
							[...timeChallengeResults]
								.sort((a, b) => b.finalScore - a.finalScore)
								.slice(0, 3)
								.map((item, index) => (
									<View key={index} style={styles.recordCard}>
										<View style={styles.rankRow}>
											{index === 0 && (
												<>
													<IconComponent
														name="trophy"
														type="FontAwesome"
														size={scaledSize(24)}
														color="#FBBF24"
														style={{ marginRight: scaleWidth(8) }}
													/>
													<Text style={styles.firstRankLabel}>1등</Text>
													<Text style={styles.firstRankScore}>
														{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
													</Text>
												</>
											)}
											{index === 1 && (
												<>
													<IconComponent
														name="trophy"
														type="FontAwesome"
														size={scaledSize(20)}
														color="#CBD5E1"
														style={{ marginRight: scaleWidth(13) }}
													/>
													<Text style={styles.secondRankLabel}>2등</Text>
													<Text style={styles.secondRankScore}>
														{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
													</Text>
												</>
											)}
											{index === 2 && (
												<>
													<IconComponent
														name="trophy"
														type="FontAwesome"
														size={scaledSize(18)}
														color="#FB923C"
														style={{ marginRight: scaleWidth(16) }}
													/>
													<Text style={styles.thirdRankLabel}>3등</Text>
													<Text style={styles.thirdRankScore}>
														{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
													</Text>
												</>
											)}
										</View>
									</View>
								))
						)}
					</View>
				)}

				{/* 1. 나의 뱃지 (전체 / 획득 / 미획득 필터) */}
				{(activeTab === 'all' || activeTab === 'badge') && (
					<>
						<View style={styles.sectionHeaderStatic}>
							<View style={styles.iconCircle5}>
								<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(16)} color="#fff" />
							</View>
							<Text style={styles.sectionTitle}>나의 뱃지</Text>
						</View>

						<View style={styles.badgeFilterRow}>
							{([
								{ key: 'all', label: `전체 ${CONST_BADGES.length}` },
								{ key: 'earned', label: `획득 ${earnedBadgeIds.length}` },
								{ key: 'locked', label: `미획득 ${CONST_BADGES.length - earnedBadgeIds.length}` },
							] as const).map((ff) => {
								const active = badgeFilter === ff.key;
								return (
									<TouchableOpacity
										key={ff.key}
										activeOpacity={0.8}
										onPress={() => setBadgeFilter(ff.key)}
										style={[styles.badgeFilterChip, active && styles.badgeFilterChipActive]}>
										<Text style={[styles.badgeFilterText, active && styles.badgeFilterTextActive]}>{ff.label}</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						<View style={[styles.sectionBox, { minHeight: scaleHeight(360) }]}>
							{(() => {
								const list = CONST_BADGES.filter((b) => {
									const earned = earnedBadgeIds.includes(b.id);
									if (badgeFilter === 'earned') { return earned; }
									if (badgeFilter === 'locked') { return !earned; }
									return true;
								});
								if (list.length === 0) {
									return <Text style={styles.emptyText}> - 표시할 뱃지가 없습니다.</Text>;
								}
								return list.map((badge) => {
									const earned = earnedBadgeIds.includes(badge.id);
									const rarity = BADGE_RARITY_META[badge.rarity] ?? BADGE_RARITY_META.common;
									return (
										<TouchableOpacity
											key={badge.id}
											activeOpacity={0.7}
											style={[styles.badgeCard, earned && styles.badgeCardActive]}
											onPress={() => openBadgePopup(badge)}>
											<View style={[styles.iconBox, earned && { backgroundColor: rarity.soft }]}>
												<IconComponent
													name={earned ? badge.icon : 'lock'}
													type={earned ? badge.iconType : 'materialIcons'}
													size={scaledSize(20)}
													color={earned ? rarity.color : '#94A3B8'}
												/>
											</View>
											<View style={styles.textBox}>
												<View style={styles.badgeTitleRow}>
													<Text style={[styles.badgeTitle, earned && styles.badgeTitleActive]} numberOfLines={1}>{badge.name}</Text>
													<View style={[styles.badgeRarityTag, { backgroundColor: earned ? rarity.soft : '#F1F5F9' }]}>
														<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(9)} color={rarity.color} />
														<Text style={[styles.badgeRarityTagText, { color: rarity.color }]}>{rarity.label}</Text>
													</View>
												</View>
												<Text style={[styles.badgeDesc, earned && styles.badgeDescActive]} numberOfLines={1}>{badge.description}</Text>
												<View style={styles.badgeCondRow}>
													<IconComponent type="materialIcons" name="flag" size={scaledSize(10)} color="#94A3B8" />
													<Text style={styles.badgeCondText} numberOfLines={1}>{badge.condition}</Text>
												</View>
											</View>
											<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color={earned ? '#22C55E' : '#CBD5E1'} style={{ alignSelf: 'center' }} />
										</TouchableOpacity>
									);
								});
							})()}
						</View>
					</>
				)}

				{/* 나의 타워 챌린지 내역 */}
				{(activeTab === 'all' || activeTab === 'tower') && (
				<View style={styles.sectionHeaderStatic}>
					<View style={[styles.iconCircle3, { backgroundColor: '#0EA5E9' }]}>
						<IconComponent type="fontAwesome6" name="tower-observation" size={scaledSize(14)} color="#fff" />
					</View>
					<Text style={styles.sectionTitle}>나의 타워 챌린지</Text>
				</View>
				)}

				{(activeTab === 'all' || activeTab === 'tower') && (
					<View style={styles.sectionBox}>
						<View style={styles.subtitleRow}>
							<IconComponent type="fontAwesome6" name="tower-observation" size={scaledSize(14)} color="#0EA5E9" />
							<Text style={styles.topRankingTitleInline}>
								클리어한 타워 ({unlockedRewards.length} / {TOWER_LEVELS.length})
							</Text>
						</View>
						{TOWER_LEVELS.map((tower) => {
							const isCleared = unlockedRewards.includes(tower.level);
							return (
								<View
									key={tower.level}
									style={{
										flexDirection: 'row',
										borderRadius: scaleWidth(12),
										overflow: 'hidden',
										marginBottom: scaleHeight(12),
										borderWidth: 1,
										borderColor: isCleared ? tower.color : '#E2E8F0',
										backgroundColor: '#fff',
										opacity: isCleared ? 1 : 0.4,
									}}>
									{/* 왼쪽: 보스 이미지 + 레벨 배지 */}
									<View
										style={{
											width: scaleWidth(80),
											backgroundColor: isCleared ? tower.backgroundColor : '#F1F5F9',
											alignItems: 'center',
											justifyContent: 'center',
											padding: scaleWidth(8),
										}}>
										<FastImage
											source={tower.bossImage}
											style={{ width: scaleWidth(56), height: scaleWidth(56), borderRadius: scaleWidth(8) }}
											resizeMode="contain"
										/>
										<View
											style={{
												marginTop: scaleHeight(4),
												backgroundColor: isCleared ? tower.color : '#94A3B8',
												borderRadius: scaleWidth(8),
												paddingHorizontal: scaleWidth(6),
												paddingVertical: scaleHeight(2),
											}}>
											<Text style={{ color: '#fff', fontSize: scaledSize(10), fontWeight: 'bold' }}>LV.{tower.level}</Text>
										</View>
									</View>

									{/* 오른쪽: 보스 정보 + 보상 */}
									<View style={{ flex: 1, padding: scaleWidth(12), justifyContent: 'center' }}>
										<Text style={{ fontSize: scaledSize(10), color: '#94A3B8', marginBottom: scaleHeight(2) }}>{tower.bossTitle}</Text>
										<Text style={{ fontSize: scaledSize(14), fontWeight: 'bold', color: '#334155', marginBottom: scaleHeight(6) }}>{tower.bossName}</Text>

										<View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: scaleHeight(6) }} />

										<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) }}>
											<FastImage
												source={tower.reward.image}
												style={{
													width: scaleWidth(36),
													height: scaleWidth(36),
													borderRadius: scaleWidth(6),
													borderWidth: 1,
													borderColor: '#E2E8F0',
												}}
												resizeMode="cover"
											/>
											<View>
												<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(3) }}>
													<IconComponent
														type="materialIcons"
														name={tower.reward.type === 'costume' ? 'checkroom' : 'auto-awesome'}
														size={scaledSize(11)}
														color="#94A3B8"
													/>
													<Text style={{ fontSize: scaledSize(10), color: '#94A3B8' }}>{tower.reward.type === 'costume' ? '코스튬' : '캐릭터'}</Text>
												</View>
												<Text style={{ fontSize: scaledSize(12), fontWeight: 'bold', color: '#334155' }}>{tower.reward.name}</Text>
											</View>

											{/* 클리어 / 미클리어 배지 */}
											<View
												style={{
													marginLeft: 'auto',
													backgroundColor: isCleared ? tower.color : '#94A3B8',
													borderRadius: scaleWidth(10),
													paddingHorizontal: scaleWidth(8),
													paddingVertical: scaleHeight(3),
												}}>
												<Text style={{ color: '#fff', fontSize: scaledSize(10), fontWeight: 'bold' }}>{isCleared ? '클리어 ✓' : '미클리어 🔒'}</Text>
											</View>
										</View>
									</View>
								</View>
							);
						})}
					</View>
				)}
				</View>
			</ScrollView>

			<Modal visible={showLevelModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={[styles.levelModal, { maxHeight: scaleHeight(600) }]}>
						<Text style={styles.levelModalTitle}>등급 안내</Text>

						<ScrollView
							ref={levelScrollRef}
							style={{ width: '100%' }}
							contentContainerStyle={{ paddingBottom: scaleHeight(12) }}
							showsVerticalScrollIndicator={false}>
							{[...LEVEL_DATA].reverse().map((item) => {
								const isCurrent = totalScore >= item.score && totalScore < item.next;
								const mascotImage = getTitleByScore(item.score).mascot;

								return (
									<View key={item.label} style={[styles.levelCardBox, isCurrent && styles.levelCardBoxActive]}>
										{isCurrent && (
											<View style={[styles.levelBadge, { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4) }]}>
												<IconComponent type="fontAwesome6" name="trophy" size={scaledSize(11)} color="#fff" />
												<Text style={styles.levelBadgeText}>현재 등급</Text>
											</View>
										)}
										<FastImage source={mascotImage} style={styles.levelMascot} resizeMode={FastImage.resizeMode.contain} />
										<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(6) }}>
											<IconComponent name={item.icon} type="fontAwesome6" size={scaledSize(16)} color="#22C55E" />
											<Text style={[styles.levelLabel, { marginLeft: scaleWidth(6) }]}>{item.label}</Text>
										</View>
										<Text style={styles.levelScore}>{item.score}점 이상</Text>
										{isCurrent && <Text style={styles.levelEncourage}>{item.encouragement}</Text>}
										<Text style={styles.levelDetailDescription}>{item.description}</Text>
									</View>
								);
							})}
						</ScrollView>

						<TouchableOpacity onPress={() => setShowLevelModal(false)} style={styles.modalConfirmButton}>
							<Text style={styles.modalConfirmText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{/* 🏅 뱃지 상세 팝업 */}
			<BadgeDetailPopup
				visible={badgePopupVisible}
				badge={badgePopupBadge}
				isEarned={badgePopupBadge ? earnedBadgeIds.includes(badgePopupBadge.id) : false}
				onClose={() => setBadgePopupVisible(false)}
			/>
			<ProverbDetailModal visible={detailVisible} proverb={detailProverb} onClose={() => setDetailVisible(false)} />

			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop}>
					<IconComponent type="fontawesome6" name="arrow-up" size={scaledSize(20)} color="#fff" />
				</TouchableOpacity>
			)}
		</SafeAreaView>
	);
};

export default MyScoreScreen;

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: Colors.background },
	container: {
		paddingHorizontal: scaleWidth(16),
	},
	pageTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		marginBottom: scaleHeight(20),
		color: '#334155',
	},
	badgeFilterRow: { flexDirection: 'row', gap: scaleWidth(8), marginBottom: scaleHeight(10) },
	badgeFilterChip: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: scaleHeight(8),
		borderRadius: scaleWidth(999),
		backgroundColor: '#F1F5F9',
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	badgeFilterChipActive: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
	badgeFilterText: { fontSize: scaledSize(12.5), fontWeight: '700', color: '#64748B' },
	badgeFilterTextActive: { color: '#16A34A' },

	badgeCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	badgeCardActive: {
		borderColor: '#22C55E',
		backgroundColor: '#F0FDF4',
	},
	iconBox: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: '#E2E8F0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(12),
	},
	iconBoxActive: {
		backgroundColor: '#DCFCE7',
	},
	badgeTitle: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#334155',
		flexShrink: 1,
	},
	badgeTitleActive: {
		color: '#22C55E',
	},
	badgeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6) },
	badgeRarityTag: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(2),
		borderRadius: scaleWidth(6),
		paddingHorizontal: scaleWidth(6),
		paddingVertical: scaleHeight(2),
	},
	badgeRarityTagText: { fontSize: scaledSize(10), fontWeight: '800' },
	badgeCondRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(3), marginTop: scaleHeight(4) },
	badgeCondText: { fontSize: scaledSize(11), color: '#94A3B8', flex: 1 },
	badgeDesc: {
		fontSize: scaledSize(13),
		color: '#64748B',
		marginTop: scaleHeight(2),
		lineHeight: scaleHeight(18),
	},
	badgeDescActive: {
		color: '#22C55E',
	},
	sectionBox: {
		backgroundColor: '#F8FAFC',
		padding: scaleWidth(16),
		paddingHorizontal: scaleWidth(12),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	scoreDashCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: scaleWidth(18),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#EEF2F7',
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 12,
		elevation: 3,
	},
	scoreDashHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(14),
	},
	scoreDashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) },
	scoreDashIconChip: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(9),
		backgroundColor: '#22C55E',
		alignItems: 'center',
		justifyContent: 'center',
	},
	scoreDashTitle: { fontSize: scaledSize(15.5), fontWeight: '800', color: '#1E293B' },
	scoreDashScorePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
		backgroundColor: '#FEF9EC',
		borderRadius: scaleWidth(20),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(5),
	},
	scoreDashScoreText: { fontSize: scaledSize(13), fontWeight: '800', color: '#D97706' },
	scoreDashGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: scaleHeight(10) },
	scoreDashTile: {
		width: '48%',
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#EEF2F7',
	},
	scoreDashTileTop: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(7), marginBottom: scaleHeight(8) },
	scoreDashTileIcon: {
		width: scaleWidth(26),
		height: scaleWidth(26),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
		justifyContent: 'center',
	},
	scoreDashTileLabel: { fontSize: scaledSize(12), fontWeight: '600', color: '#64748B', flexShrink: 1 },
	scoreDashTileValue: { fontSize: scaledSize(18), fontWeight: '800', color: '#1E293B', marginBottom: scaleHeight(8) },
	scoreDashBarTrack: {
		height: scaleHeight(6),
		borderRadius: scaleWidth(3),
		backgroundColor: '#E2E8F0',
		overflow: 'hidden',
	},
	scoreDashBarFill: { height: '100%', borderRadius: scaleWidth(3) },
	scoreDashTilePct: { fontSize: scaledSize(11), fontWeight: '700', marginTop: scaleHeight(5), textAlign: 'right' },
	subSectionBox1: {
		backgroundColor: '#fff',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	subSectionBox2: {
		backgroundColor: '#fff',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},

	statItem: {
		fontSize: scaledSize(14),
		color: '#334155',
		marginBottom: scaleHeight(6),
	},
	subTitle: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#334155',
		marginBottom: scaleHeight(6),
	},
	tagItem: {
		fontSize: scaledSize(14),
		color: '#22C55E',
		marginBottom: scaleHeight(4),
	},
	emptyText: {
		fontSize: scaledSize(13),
		color: '#94A3B8',
	},
	textBox: { flex: 1 },
	levelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	levelTitle: {
		fontSize: scaledSize(16),
		marginLeft: scaleWidth(6),
		color: '#22C55E',
		fontWeight: '700',
	},
	quizSummaryBox: {
		backgroundColor: '#F1F5F9',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginTop: scaleHeight(8),
		marginBottom: scaleHeight(16),
	},
	levelIconWrap: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		borderRadius: scaleWidth(18),
		borderWidth: 2,
		borderColor: '#22C55E',
		backgroundColor: '#EFF6FF',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(8),
		shadowColor: '#22C55E',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.25,
		shadowRadius: 2,
	},
	levelModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
		paddingBottom: scaleHeight(12),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
	},
	levelModalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginBottom: scaleHeight(12),
		color: '#334155',
	},
	levelRowItem: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		paddingVertical: scaleHeight(8),
		borderBottomWidth: 1,
		borderColor: '#F1F5F9',
	},
	levelRowItemActive: {
		backgroundColor: '#EFF6FF',
		borderColor: '#22C55E',
	},
	levelCardBox: {
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(16),
		alignItems: 'center',
		marginBottom: scaleHeight(14),
		width: '100%',
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	levelCardBoxActive: {
		backgroundColor: '#EFF6FF',
		borderColor: '#22C55E',
		borderWidth: 2,
	},
	levelBadge: {
		backgroundColor: '#3B82F6',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(8),
	},
	levelBadgeText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: 'bold',
	},
	levelMascot: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		marginBottom: scaleHeight(10),
	},
	levelLabel: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(2),
	},
	levelScore: {
		fontSize: scaledSize(13),
		color: '#64748B',
	},
	levelEncourage: {
		fontSize: scaledSize(12),
		color: '#22C55E',
		marginTop: scaleHeight(6),
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	levelIconWrapSmall: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(14),
		backgroundColor: '#DBEAFE',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(10),
	},
	levelModalText: {
		flex: 1,
		fontSize: scaledSize(14),
		color: '#334155',
	},
	levelModalScore: {
		fontSize: scaledSize(13),
		color: '#64748B',
	},
	levelNowText: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
		color: '#22C55E',
		fontWeight: 'bold',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalConfirmButton: {
		marginTop: scaleHeight(16),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		backgroundColor: '#3B82F6',
		borderRadius: scaleWidth(8),
	},
	modalConfirmText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: scaledSize(14),
	},
	levelCenteredRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	levelDescription: {
		fontSize: scaledSize(13),
		color: '#64748B',
		textAlign: 'center',
		lineHeight: scaleHeight(18),
		marginBottom: scaleHeight(4),
	},
	levelScoreText: {
		fontSize: scaledSize(15),
		color: '#64748B',
		textAlign: 'center',
		marginTop: scaleHeight(4),
	},
	levelScoreHighlight: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#22C55E',
		marginTop: scaleHeight(4),
	},
	activityCardBox: {
		backgroundColor: '#F1F5F9',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	activityRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	activityLabel: {
		fontSize: scaledSize(14),
		color: '#334155',
	},
	activityValue: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#334155',
	},
	summaryCard: {
		backgroundColor: '#FFFBEB',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#FBBF24',
	},
	summaryTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#F59E0B',
		marginBottom: scaleHeight(8),
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	progressText: {
		fontSize: scaledSize(14),
		color: '#334155',
		marginRight: scaleWidth(12),
	},
	progressBarBackground: {
		width: '80%',
		height: scaleHeight(6),
		backgroundColor: '#F1F5F9',
		borderRadius: scaleHeight(3),
		marginTop: scaleHeight(6),
		alignSelf: 'center',
	},
	progressBarFill: {
		height: scaleHeight(6),
		backgroundColor: '#3B82F6',
		borderRadius: scaleHeight(3),
	},
	gridRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginTop: scaleHeight(6),
	},
	regionCard: {
		width: '28%',
		height: scaleHeight(100),
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(6),
		paddingVertical: scaleHeight(8),
		backgroundColor: '#fff',
		marginBottom: scaleHeight(12),
		marginHorizontal: scaleWidth(5),
	},
	levelCard: {
		width: '40%',
		aspectRatio: 1,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: scaleWidth(12),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		marginHorizontal: scaleWidth(8),
		marginBottom: scaleHeight(12),
	},
	regionText: {
		fontSize: scaledSize(14),
		textAlign: 'center',
		color: '#64748B',
	},
	levelText: {
		fontSize: scaledSize(15),
		textAlign: 'center',
		color: '#64748B',
	},
	cardActive: {
		backgroundColor: '#EFF6FF',
	},
	summaryStatGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	summaryStatCard: {
		flex: 1,
		backgroundColor: '#fff',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(11),
		marginHorizontal: scaleWidth(3),
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#F1F5F9',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		marginBottom: scaleHeight(12),
	},
	statIcon: {
		fontSize: scaledSize(22),
		marginBottom: scaleHeight(4),
	},
	statValue: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(3),
	},
	statLabel: {
		fontSize: scaledSize(11.5),
		color: '#64748B',
	},
	statIconChip: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(10),
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(6),
	},
	chartRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#F1F5F9',
	},
	donutCenterValue: {
		fontSize: scaledSize(17),
		fontWeight: '800',
		color: '#16A34A',
	},
	donutCenterLabel: {
		fontSize: scaledSize(11),
		color: '#64748B',
		marginTop: scaleHeight(2),
	},
	chartLegend: {
		flex: 1,
		marginLeft: scaleWidth(12),
	},
	chartLegendTitle: {
		fontSize: scaledSize(14),
		fontWeight: '800',
		color: '#1E293B',
		marginBottom: scaleHeight(10),
	},
	chartLegendRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	legendDot: {
		width: scaleWidth(10),
		height: scaleWidth(10),
		borderRadius: scaleWidth(5),
		marginRight: scaleWidth(8),
	},
	chartLegendText: {
		fontSize: scaledSize(13),
		color: '#64748B',
	},
	chartLegendStrong: {
		fontWeight: '800',
		color: '#334155',
	},
	stackBarTrack: {
		flexDirection: 'row',
		height: scaleHeight(8),
		borderRadius: scaleHeight(4),
		overflow: 'hidden',
		marginTop: scaleHeight(8),
		backgroundColor: '#F1F5F9',
	},
	stackBarCorrect: { backgroundColor: '#22C55E' },
	stackBarWrong: { backgroundColor: '#EF4444' },
	subtitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		marginBottom: scaleHeight(12),
		marginTop: scaleHeight(8),
	},
	sectionSubtitleInline: {
		fontSize: scaledSize(15),
		color: '#334155',
		fontWeight: 'bold',
	},
	topRankingTitleInline: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
	},
	regionSubText: {
		fontSize: scaledSize(10),
		color: '#94A3B8',
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	levelSubText: {
		fontSize: scaledSize(12),
		color: '#94A3B8',
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	sectionSubtitle: {
		fontSize: scaledSize(15),
		color: '#334155',
		marginBottom: scaleHeight(12),
		marginTop: scaleHeight(8),
		fontWeight: 'bold',
	},
	gridRowNoBottomGap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginTop: scaleHeight(12),
		paddingBottom: scaleHeight(6),
	},
	regionHelperText: {
		fontSize: scaledSize(12),
		color: '#64748B',
		marginBottom: scaleHeight(16),
	},
	levelHelperText: {
		fontSize: scaledSize(12),
		color: '#64748B',
		marginTop: scaleHeight(3),
		marginBottom: scaleHeight(15),
	},
	adContainer: {
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: scaleHeight(10),
		paddingVertical: scaleHeight(6),
	},
	regionCardActive: {
		backgroundColor: '#EFF6FF',
		borderColor: '#22C55E',
	},
	regionTextActive: {
		color: '#22C55E',
		fontWeight: 'bold',
	},
	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(16),
		bottom: scaleHeight(16),
		backgroundColor: '#3B82F6',
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
	},
	scoreBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#22C55E',
		borderRadius: scaleWidth(20),
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(4),
		marginBottom: scaleHeight(12),
	},
	scoreBadgeText: {
		color: '#fff',
		fontSize: scaledSize(13),
		fontWeight: '700',
		marginLeft: scaleWidth(6),
	},
	iconCircle1: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		marginRight: scaleWidth(6),
		borderRadius: scaleWidth(20),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#22C55E', // 🎨 학습 모드(홈 버튼) 초록
	},
	iconCircle2: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#3B82F6', // 🎨 밝은 파랑 배경 추가
	},

	iconCircle3: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#F97316', // 🎨 밝은 파랑 배경 추가
	},

	iconCircle4: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#14B8A6', // 오늘의 퀴즈 — 비중복 틸 컬러
	},
	iconCircle5: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#F59E0B',
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: scaleHeight(16),
		marginBottom: scaleHeight(10),
		backgroundColor: '#FFFFFF',
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: '#EEF2F6',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(14),
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 1,
	},
	sectionHeaderStatic: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(10),
	},
	activityGroupBox: {
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: scaleWidth(16),
		backgroundColor: '#FCFDFE',
		marginHorizontal: scaleWidth(-8),
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(12),
		marginTop: scaleHeight(8),
	},
	activityTabBar: {
		paddingVertical: scaleHeight(6),
		paddingRight: scaleWidth(8),
		gap: scaleWidth(8),
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	activityTabChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(14),
		borderRadius: scaleWidth(20),
		backgroundColor: '#F1F5F9',
		gap: scaleWidth(6),
	},
	activityTabChipActive: {
		backgroundColor: '#22C55E',
	},
	activityTabText: {
		fontSize: scaledSize(13),
		fontWeight: '600',
		color: '#64748B',
	},
	activityTabTextActive: {
		color: '#fff',
		fontWeight: '700',
	},
	sectionTitle: {
		fontSize: scaledSize(16),
		fontWeight: '800',
		color: '#1E293B',
	},
	sectionTitle2: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginBottom: scaleHeight(12),
		color: '#334155',
	},
	categoryRowCard: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: scaleWidth(12),
		backgroundColor: '#fff',
		marginBottom: scaleHeight(10),
		width: '100%',
	},
	categoryRowText: {
		fontSize: scaledSize(15),
		color: '#64748B',
	},
	levelDetailDescription: {
		fontSize: scaledSize(12),
		color: '#64748B',
		textAlign: 'center',
		marginTop: scaleHeight(6),
		lineHeight: scaleHeight(18),
	},
	timeResultCard: {
		marginBottom: scaleHeight(12),
		padding: scaleWidth(12),
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	timeResultDate: {
		fontSize: scaledSize(13),
		color: '#64748B',
		marginBottom: scaleHeight(4),
	},
	timeResultScore: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(6),
	},
	timeResultRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(4),
	},
	timeResultItem: {
		fontSize: scaledSize(13),
		color: '#334155',
	},
	timeResultTime: {
		fontSize: scaledSize(12),
		color: '#64748B',
		textAlign: 'right',
	},
	timeCard: {
		marginBottom: scaleHeight(12),
		padding: scaleWidth(12),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: '#CBD5E1',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
	},
	timeCardDate: {
		fontSize: scaledSize(13),
		color: '#64748B',
		marginBottom: scaleHeight(2),
	},
	timeCardScore: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(6),
	},
	timeCardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(4),
	},
	timeCardItem: {
		fontSize: scaledSize(13),
		color: '#334155',
	},
	timeCardUsed: {
		fontSize: scaledSize(12),
		color: '#64748B',
		textAlign: 'right',
	},
	topRankingTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(12),
	},

	noRecordText: {
		fontSize: scaledSize(13),
		color: '#94A3B8',
		textAlign: 'center',
		marginTop: scaleHeight(12),
	},

	recordCard: {
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(14),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		marginBottom: scaleHeight(10),
	},

	rankRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	firstRankLabel: {
		fontSize: scaledSize(15),
		color: '#FBBF24',
		fontWeight: 'bold',
		marginRight: scaleWidth(8),
	},

	secondRankLabel: {
		fontSize: scaledSize(14),
		color: '#64748B',
		fontWeight: 'bold',
		marginRight: scaleWidth(8),
	},

	thirdRankLabel: {
		fontSize: scaledSize(14),
		color: '#FB923C',
		fontWeight: 'bold',
		marginRight: scaleWidth(8),
	},

	firstRankScore: {
		fontSize: scaledSize(15),
		color: '#334155',
	},

	secondRankScore: {
		fontSize: scaledSize(14),
		color: '#334155',
	},

	thirdRankScore: {
		fontSize: scaledSize(14),
		color: '#334155',
	},

	rankDate: {
		fontSize: scaledSize(12),
		color: '#64748B',
	},
	calendarStyle: {
		alignSelf: 'stretch', // 또는 width: '100%'
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
		marginBottom: scaleHeight(10),
	},
	levelDescriptionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(8),
		borderWidth: 1,
		borderColor: '#EEF2F6',
		gap: scaleWidth(10),
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 1,
	},
	levelDescIconChip: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(9),
		alignItems: 'center',
		justifyContent: 'center',
	},
	levelDescriptionText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#334155',
		lineHeight: scaleHeight(19),
		fontWeight: '500',
	},
	levelHighlight: {
		fontWeight: 'bold',
		color: '#22C55E',
	},
});
