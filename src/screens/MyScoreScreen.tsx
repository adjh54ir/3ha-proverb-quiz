/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import ScrollTopButton, { SCROLL_TOP_THRESHOLD } from '@/screens/common/atomic/ScrollTopButton';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	Alert,
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
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import { CONST_BADGES, BADGE_RARITY_META } from '@/const/ConstBadges';
import BadgeDetailPopup from './modal/BadgeDetailPopup';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, HERO, themedStyles } from '@/const/common/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import { Calendar } from 'react-native-calendars';
import '@/utils/KoreanLocale'; // 달력/moment 한국어 설정 (단일 소스)
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { PET_REWARDS, getLevelByScore } from '@/const/ConstInfoData';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';
import ProverbDetailModal from './modal/ProverbDetailModal';
import LevelModal from './modal/LevelModal';
import { FIELD_DROPDOWN_ITEMS } from '@/const/common/CommonMainData';
import { getLevelColor } from '@/screens/common/CommonProverbModule';
import DateUtils from '@/utils/DateUtils';
import CharacterGuide, { useCharacterGuideOnce, CharacterGuideButton } from '@/screens/common/CharacterGuide';
import { buildDateMark, buildTodayPendingMark, buildSelectedMark } from '@/utils/CalendarMarkUtils';
import { withAlpha, ALPHA, readableTextOn } from '@/utils/ColorAlphaUtils';
import { read } from '@/services/StorageService';
import QuizHistoryService from '@/services/QuizHistoryService';

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

const STYLE_MAP = {
	초급: {
		color: getLevelColor('초급'),
		icon: { type: 'fontAwesome5', name: 'seedling' },
		badgeId: 'level_easy_1',
		type: 'level',
	},
	중급: {
		color: getLevelColor('중급'),
		icon: { type: 'fontAwesome5', name: 'leaf' },
		badgeId: 'level_easy_2',
		type: 'level',
	},
	고급: {
		color: getLevelColor('고급'),
		icon: { type: 'fontAwesome5', name: 'tree' },
		badgeId: 'level_medium',
		type: 'level',
	},
	특급: {
		color: getLevelColor('특급'),
		icon: { type: 'fontAwesome5', name: 'trophy' },
		badgeId: 'level_hard',
		type: 'level',
	},
};



const STORAGE_KEY_QUIZ = MainStorageKeyType.USER_QUIZ_HISTORY;
const STORAGE_KEY_STUDY = MainStorageKeyType.USER_STUDY_HISTORY;
const STORAGE_KEY_TIME = MainStorageKeyType.TIME_CHALLENGE_HISTORY;
const STORAGE_KEY_TODAY = MainStorageKeyType.TODAY_QUIZ_LIST;

// 카테고리 뱃지 매핑 — 드롭다운 단일 소스(FIELD_DROPDOWN_ITEMS)에서 파생
const CATEGORY_BADGE_MAP: Record<string, string> = FIELD_DROPDOWN_ITEMS.reduce((acc, item) => {
	if (item.badgeId) {
		acc[item.label] = item.badgeId;
	}
	return acc;
}, {} as Record<string, string>);

// 정복/클리어 섹션 공통 헤더 (아이콘 칩 + 타이틀 + 진행 카운트 pill)
const ConquerHeader = ({
	iconType,
	iconName,
	tint,
	chipBg,
	title,
	current,
	total,
}: {
	iconType: string;
	iconName: string;
	tint: string;
	chipBg: string;
	title: string;
	current: number;
	total: number;
}) => (
	<View style={styles.conquerHeader}>
		<View style={[styles.conquerHeaderIcon, { backgroundColor: chipBg }]}>
			<IconComponent type={iconType} name={iconName} size={scaledSize(14)} color={tint} />
		</View>
		<Text style={styles.conquerHeaderTitle}>{title}</Text>
		<View style={[styles.conquerCountPill, { backgroundColor: chipBg }]}>
			<Text style={[styles.conquerCountText, { color: tint }]}>
				{current} / {total}
			</Text>
		</View>
	</View>
);

const MyScoreScreen = () => {
	// 안내 정책: 화면에 처음 들어갈 때 1회 자동 노출. 다시 보려면 설정 > 화면 안내.
	const guide = useCharacterGuideOnce('myScore');
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const isFocused = useIsFocused();
	const scrollRef = useRef<ScrollView>(null);
	const [refreshing, setRefreshing] = useState(false);

	// 마스코트 진입 애니메이션
	const mascotFade = useRef(new Animated.Value(0)).current;
	const mascotScale = useRef(new Animated.Value(0.8)).current;

	// 전체 스코어 대시보드 진입 애니메이션 (fade + slide-up) + 타일 stagger
	const dashFade = useRef(new Animated.Value(0)).current;
	const dashSlide = useRef(new Animated.Value(scaleHeight(12))).current;
	// ponytail: 대시보드 타일 4개 고정 — 지표가 늘어나면 이 배열 길이도 함께 늘릴 것
	const tileAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
	const [totalScore, setTotalScore] = useState<number>(0);
	const [levelMaster, setLevelMaster] = useState<string[]>([]);
	const [correctCount, setCorrectCount] = useState<number>(0);
	const [wrongCount, setWrongCount] = useState<number>(0);
	// 저장값은 ISO 문자열이지만 방금 쓴 값은 Date 일 수 있다 (DateUtils 는 둘 다 받는다)
	const [lastAnsweredAt, setLastAnsweredAt] = useState<string | Date>('');
	const [bestCombo, setBestCombo] = useState<number>(0);
	const [showLevelModal, setShowLevelModal] = useState(false);
	const [badgeFilter, setBadgeFilter] = useState<'all' | 'earned' | 'locked'>('all');
	const [studyCountries, setStudyCountries] = useState<string[]>([]);
	const [lastStudyAt, setLastStudyAt] = useState<string | Date>('');
	const [totalStudyCount, setTotalStudyCount] = useState<number>(0);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [categoryMaster, setCategoryMaster] = useState<string[]>([]);
	const [totalCountryCount, setTotalCountryCount] = useState<number>(0);

	const [unlockedRewards, setUnlockedRewards] = useState<number[]>([]);
	const [markedQuizDates, setMarkedQuizDates] = useState<{ [date: string]: any }>({});
	const [timeChallengeResults, setTimeChallengeResults] = useState<MainDataType.TimeChallengeResult[]>([]);

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
	// TOOD: 해당 부분에서 데이터를 불러 와야 함
	// const allCategories = []; // 전체 카테고리 (8개)

	const getLevelStyle = (subtitle: string) => {
		const entry = STYLE_MAP[subtitle];
		if (!entry) {
			return { bg: COLORS.surface, border: COLORS.borderDark };
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
			loadData(); // 캘린더 마킹 + 펫 레벨까지 여기서 한 번에 계산한다
			// 다시 들어올 때는 첫 화면 상태로 (활동 탭 / 뱃지 필터 / 열려 있던 팝업 초기화)
			setActiveTab('all');
			setBadgeFilter('all');
			setShowLevelModal(false);
			setBadgePopupVisible(false);
			setDetailVisible(false);
			setShowScrollTop(false);
			// 마스코트 진입 애니메이션 실행
			mascotFade.setValue(0);
			mascotScale.setValue(0.8);
			dashFade.setValue(0);
			dashSlide.setValue(scaleHeight(12));
			tileAnims.forEach((v) => v.setValue(0));
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
				Animated.timing(dashFade, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(dashSlide, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.stagger(
					60,
					tileAnims.map((v) =>
						Animated.timing(v, {
							toValue: 1,
							duration: 260,
							useNativeDriver: true,
						}),
					),
				),
			]);
			anim.start();
			return () => anim.stop();
		}, []),
	);

	useFocusEffect(
		useCallback(() => {
			// '오늘'은 기기 타임존 기준으로만 판단한다 (DateUtils 단일 진입점)
			const todayStr = DateUtils.getLocalDateString();
			const todayData = todayQuizDataList.find((item) => DateUtils.toLocalDateKey(item.quizDate) === todayStr);

			if (todayData) {
				setSelectedDate(todayStr);
				setSelectedQuizData(todayData);
			}
		}, [todayQuizDataList]),
	);

	const loadData = async () => {
		try {
			const studyJson = await read<MainDataType.UserStudyHistory | null>(STORAGE_KEY_STUDY, null);
			const quizJson = await QuizHistoryService.getQuizHistory();

			const studyBadges = studyJson?.badges ?? [];
			const quizBadges = quizJson?.badges ?? [];
			const studiedIds: number[] = studyJson?.studyProverbes ?? [];
			const studyCounts = studyJson?.studyCounts ?? {};
			const lastDate = studyJson?.lastStudyAt ?? '';

			const allProverbs = ProverbServices.selectProverbList();
			setTotalCountryCount(allProverbs.length);
			setStudyCountries(studiedIds.map(String)); // 화면 출력용
			setLastStudyAt(lastDate);

			const totalCount = (Object.values(studyCounts) as number[]).reduce((a, b) => a + b, 0);
			setTotalStudyCount(totalCount);
			// ✅ 수정 - 올바른 키 사용
			const towerParsed = await read<TowerProgress | null>(MainStorageKeyType.TOWER_CHALLENGE_PROGRESS, null);
			setUnlockedRewards(towerParsed?.unlockedRewards ?? []);

			setTotalScore(quizJson?.totalScore ?? 0);
			setCorrectCount(quizJson?.correctProverbId?.length ?? 0);
			setWrongCount(quizJson?.wrongProverbId?.length ?? 0);
			setLastAnsweredAt(quizJson?.lastAnsweredAt ?? '');
			setBestCombo(quizJson?.bestCombo ?? 0);

			const timeResults = await read<MainDataType.TimeChallengeResult[]>(STORAGE_KEY_TIME, []);
			// ⚠️ 예전에는 최근 3건만 남겨 두고 그 안에서 정렬해 'TOP 3' 로 표시했다(=최근 3판 중 1등).
			//    전체 기록에서 점수 상위 3건을 뽑아야 실제 랭킹이 된다.
			setTimeChallengeResults([...timeResults].sort((a, b) => b.finalScore - a.finalScore).slice(0, 3));

			const allBadges = [...new Set([...studyBadges, ...quizBadges])];
			setEarnedBadgeIds(allBadges);

			// 정복한 카테고리만 추출
			const conqueredCategories = Object.entries(CATEGORY_BADGE_MAP)
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
			const todayData = await read<MainDataType.TodayQuizList[]>(STORAGE_KEY_TODAY, []);

			// 캘린더 마킹은 여기 한 곳에서만 만든다.
			// (예전에는 loadCheckedInDates() 가 별도 marked 를 만들고도 setMarkedQuizDates 를 호출하지 않아
			//  출석 표시(초록/앰버)가 화면에 전혀 반영되지 않았다. 두 계산을 합쳐 한 번에 세팅한다.)
			const todayStr = DateUtils.getLocalDateString();

			const marked = todayData.reduce(
				(acc, item) => {
					const dateKey = DateUtils.toLocalDateKey(item.quizDate);
					if (!dateKey) {
						return acc;
					}
					acc[dateKey] = buildDateMark(!!item.isCheckedIn, dateKey === todayStr);
					return acc;
				},
				{} as Record<string, any>,
			);

			// 오늘 출석 전이면 오늘 날짜를 파란색으로 강조 (출석 앰버 표시는 덮어쓰지 않는다)
			const isTodayCheckedIn = todayData.some((item) => DateUtils.toLocalDateKey(item.quizDate) === todayStr && item.isCheckedIn);
			if (!isTodayCheckedIn) {
				marked[todayStr] = { ...(marked[todayStr] || {}), ...buildTodayPendingMark() };
			}

			setTodayQuizDataList(todayData); // todayData를 상태로 저장

			setMarkedQuizDates(marked);
			setPetLevel(getPetLevel(todayData.filter((item) => item.isCheckedIn).length));
		} catch (e) {
			console.error('❌ 데이터 로딩 실패:', e);
		}
	};

	// ✅ PET_REWARDS 인덱스 매핑: 1일→0(견습생), 7일→1(훈련생), 14일→2(수련생), 21일→3(졸업생), 28일→4(마스터)
	const getPetLevel = (count: number) => {
		if (count >= 28) { return 4; }
		if (count >= 21) { return 3; }
		if (count >= 14) { return 2; }
		if (count >= 7) { return 1; }
		if (count >= 1) { return 0; } // ✅ 1일 이상이면 첫 번째 펫 표시
		return -1;
	};

	// ISO 형식 대응 버전
	const getRelativeDateLabel = (isoString: string): string => {
		try {
			const inputDate = new Date(isoString);
			const now = DateUtils.now();

			const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const startOfInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

			const diffMs = startOfToday.getTime() - startOfInput.getTime();
			// 서머타임이 있는 지역에서는 자정~자정 간격이 23h/25h 가 되므로 floor 대신 round
			const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

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

	const onRefresh = () => {
		setRefreshing(true);
		loadData().finally(() => setRefreshing(false)); // ✅ 이 방식 권장
	};

	const handleScrollToTop = () => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	/**
	 * 활동 탭 전환 — 탭을 바꾸면 이전 탭에서 보던 위치가 그대로 남아 엉뚱한 지점이 보인다.
	 * 탭 값만 바꾸지 말고 스크롤도 최상단으로 되돌린다.
	 */
	const handleActivityTabPress = (tabKey: string) => {
		setActiveTab(tabKey);
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	const totalSolved = correctCount + wrongCount;
	const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

	/**
	 * 스크롤을 관리하는 Handler
	 */
	const scrollHandler = (() => {
		return {
			/**
			 * 스크롤을 일정 높이 만큼 움직였을때 아이콘 등장 처리
			 * @param event
			 */
			onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
				const offsetY = event.nativeEvent.contentOffset.y;
				setShowScrollTop(offsetY > SCROLL_TOP_THRESHOLD);
			},
			/**
			 * 스크롤 최상단으로 이동
			 * @return {void}
			 */
			toTop: (): void => {
				scrollRef.current?.scrollTo({ y: 0, animated: true });
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

			// ✅ 이전 선택 날짜를 기본 마킹으로 복원 (출석 색이 유지되어야 한다)
			if (prevDate && updated[prevDate]) {
				const prevItem = todayQuizDataList.find((item) => DateUtils.toLocalDateKey(item.quizDate) === prevDate);

				if (prevItem) {
					updated[prevDate] = buildDateMark(!!prevItem.isCheckedIn, prevDate === DateUtils.getLocalDateString());
				} else {
					delete updated[prevDate];
				}
			}

			// ✅ 새 선택 날짜 강조
			updated[date] = { ...(updated[date] || {}), ...buildSelectedMark() };

			return updated;
		});
	};

	// 등급 판정은 중앙 헬퍼 하나만 사용한다(화면마다 다른 규칙이 생기지 않도록).
	const { label, icon, mascot, description } = getLevelByScore(totalScore);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<ScrollView
				ref={scrollRef}
				style={styles.container}
				contentContainerStyle={{ paddingBottom: SPACING_H.xxxxl, flexGrow: 1 }}
				onScroll={scrollHandler.onScroll}
				scrollEventThrottle={16}
				refreshControl={<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={COLORS.textSecondary}
						colors={[COLORS.primary]}
						progressBackgroundColor={COLORS.surface}
					/>}>
				<View style={styles.sectionBox}>
					{/* 캐릭터 영역 안내 — 줄 가장 오른쪽 */}
					<View style={styles.characterHelpButton}>
						<CharacterGuideButton onPress={guide.open} size={scaledSize(18)} />
					</View>
					<Animated.View style={{ alignItems: 'center', justifyContent: 'center', marginTop: SPACING_H.mdPlus, marginBottom: scaleHeight(-8), opacity: mascotFade, transform: [{ scale: mascotScale }], position: 'relative' }}>
						{/* ✅ 홈화면과 동일한 캐릭터/펫 배치 구조 (래퍼 높이 축소로 타이틀과 밀착) */}
						<View style={{ width: scaleWidth(180), height: scaleWidth(150), alignItems: 'center', justifyContent: 'center' }}>
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
									borderColor: COLORS.primary,
									overflow: 'hidden',
								}}>
								<FastImage source={PET_REWARDS[petLevel].image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
							</View>
						)}
					</Animated.View>
					<View style={{ alignItems: 'center' }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING_H.md }}>
							<TouchableOpacity
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
								activeOpacity={0.7}
								onPress={() => setShowLevelModal(true)}>
								<IconComponent type="fontAwesome6" name={icon} size={scaledSize(18)} color={COLORS.primary} />
								<Text style={{ fontSize: FONT_SIZES.lg, color: COLORS.primary, fontWeight: '700', marginLeft: SPACING_W.xsPlus }}>
									{label}
								</Text>
								<IconComponent
									type="materialIcons"
									name="info-outline"
									size={scaledSize(18)}
									color={COLORS.textSecondary}
									style={{ marginLeft: SPACING_W.xs }}
								/>
							</TouchableOpacity>
						</View>

						<View style={styles.scoreBadge}>
							<IconComponent name="leaderboard" type="materialIcons" size={scaledSize(13)} color={COLORS.textWhite} />
							<Text style={styles.scoreBadgeText}>{totalScore.toLocaleString()}점</Text>
						</View>
					</View>

					<View style={styles.levelDescriptionCard}>
						<View style={[styles.levelDescIconChip, { backgroundColor: COLORS.warningBg }]}>
							<IconComponent type="fontAwesome6" name="trophy" size={scaledSize(14)} color={COLORS.warning} />
						</View>
						{/* 카드 높이가 padding 기반이라 유연하다. 중첩 Text + 1줄 축소는 안드로이드에서 과축소되므로 2줄 허용으로 대체 */}
						<Text style={styles.levelDescriptionText} numberOfLines={2} ellipsizeMode="tail">
							전체 퀴즈 완료 시 <Text style={[styles.levelHighlight, { color: COLORS.warningDark }]}>'속담 전설'</Text> 등급을 획득합니다
						</Text>
					</View>

					<View style={styles.levelDescriptionCard}>
						<View style={[styles.levelDescIconChip, { backgroundColor: COLORS.primarySoft }]}>
							<IconComponent type="fontAwesome6" name="arrow-rotate-right" size={scaledSize(14)} color={COLORS.primaryDark} />
						</View>
						{/* 위 카드와 동일: 1줄 강제 축소 대신 2줄 허용 */}
						<Text style={styles.levelDescriptionText} numberOfLines={2} ellipsizeMode="tail">
							틀린 문제는 <Text style={styles.levelHighlight}>오답 복습</Text>에서 다시 도전할 수 있습니다
						</Text>
					</View>
				</View>

				{/* ✅ 전체 스코어 대시보드 (항상 표시) */}
				{(() => {
					const studyPct = totalCountryCount > 0 ? Math.round((studyCountries.length / totalCountryCount) * 100) : 0;
					const solvedPct = totalCountryCount > 0 ? Math.round((totalSolved / totalCountryCount) * 100) : 0;
					const badgePct = CONST_BADGES.length > 0 ? Math.round((earnedBadgeIds.length / CONST_BADGES.length) * 100) : 0;
					const metrics = [
						{ icon: 'school', color: COLORS.primary, soft: COLORS.primarySoft, label: '학습 진척도', value: `${studyCountries.length}/${totalCountryCount}`, pct: studyPct },
						{ icon: 'check-circle', color: COLORS.secondary, soft: COLORS.secondarySoft, label: '퀴즈 정답률', value: `${accuracy}%`, pct: accuracy },
						{ icon: 'play-circle-filled', color: COLORS.accentTeal, soft: COLORS.accentTealBg, label: '퀴즈 진척도', value: `${totalSolved}/${totalCountryCount}`, pct: solvedPct },
						{ icon: 'military-tech', color: COLORS.warning, soft: COLORS.warningBg, label: '획득 뱃지', value: `${earnedBadgeIds.length}/${CONST_BADGES.length}`, pct: badgePct },
					];
					return (
						<Animated.View style={[styles.scoreDashCard, { opacity: dashFade, transform: [{ translateY: dashSlide }] }]}>
							<View style={styles.scoreDashHeader}>
								<View style={styles.scoreDashTitleRow}>
									<View style={styles.scoreDashIconChip}>
										<IconComponent type="materialIcons" name="insights" size={scaledSize(14)} color={COLORS.textWhite} />
									</View>
									<Text style={styles.scoreDashTitle}>전체 스코어</Text>
								</View>
								<View style={styles.scoreDashScorePill}>
									<IconComponent type="materialIcons" name="stars" size={scaledSize(14)} color={COLORS.warning} />
									<Text style={styles.scoreDashScoreText}>{totalScore.toLocaleString()}점</Text>
								</View>
							</View>
							<View style={styles.scoreDashGrid}>
								{metrics.map((m, mi) => (
									<Animated.View
										key={m.label}
										style={[
											styles.scoreDashTile,
											{
												opacity: tileAnims[mi],
												transform: [
													{
														translateY: tileAnims[mi].interpolate({
															inputRange: [0, 1],
															outputRange: [scaleHeight(10), 0],
														}),
													},
												],
											},
										]}>
										<View style={styles.scoreDashTileTop}>
											<View style={[styles.scoreDashTileIcon, { backgroundColor: m.soft }]}>
												<IconComponent type="materialIcons" name={m.icon} size={scaledSize(13)} color={m.color} />
											</View>
											<Text style={styles.scoreDashTileLabel}>{m.label}</Text>
										</View>
										<Text style={styles.scoreDashTileValue}>{m.value}</Text>
										<View style={styles.scoreDashBarTrack}>
											<View style={[styles.scoreDashBarFill, { width: `${Math.min(m.pct, 100)}%`, backgroundColor: m.color }]} />
										</View>
										<Text style={[styles.scoreDashTilePct, { color: m.color }]}>{m.pct}%</Text>
									</Animated.View>
								))}
							</View>
						</Animated.View>
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
								onPress={() => handleActivityTabPress(tab.key)}
								style={[styles.activityTabChip, isActive && styles.activityTabChipActive]}>
								<IconComponent
									type="materialIcons"
									name={tab.icon}
									size={scaledSize(15)}
									color={isActive ? COLORS.textWhite : COLORS.textSecondary}
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
						<IconComponent type="materialIcons" name="school" size={scaledSize(16)} color={COLORS.textWhite} />
					</View>
					<Text style={styles.sectionTitle}>나의 학습 활동</Text>
				</View>
				)}
				{(activeTab === 'all' || activeTab === 'study') && (
					<View style={styles.activityCardBox}>
						<View style={styles.chartRow}>
							<DonutChart
								percent={totalCountryCount > 0 ? Math.round((studyCountries.length / totalCountryCount) * 100) : 0}
								size={scaledSize(88)}
								strokeWidth={scaledSize(10)}
								color={COLORS.primary}>
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
									<View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
									<Text style={styles.chartLegendText}>
										학습한 속담 <Text style={styles.chartLegendStrong}>{studyCountries.length}개</Text>
									</Text>
								</View>
								<View style={styles.chartLegendRow}>
									<View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
									<Text style={styles.chartLegendText}>
										남은 속담{' '}
										<Text style={styles.chartLegendStrong}>{Math.max(totalCountryCount - studyCountries.length, 0)}개</Text>
									</Text>
								</View>
							</View>
						</View>
						<View style={styles.summaryStatGrid}>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: COLORS.primarySoft }]}>
									<IconComponent type="materialIcons" name="track-changes" size={scaledSize(18)} color={COLORS.primary} />
								</View>
								<Text style={styles.statValue}>
									{studyCountries.length} / {totalCountryCount}
								</Text>
								<Text style={styles.statLabel}>
									학습 완료 ({Math.round((studyCountries.length / totalCountryCount) * 100)}%)
								</Text>
							</View>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: COLORS.secondarySoft }]}>
									<IconComponent type="materialIcons" name="event-note" size={scaledSize(18)} color={COLORS.secondary} />
								</View>
								<Text style={styles.statValue}> {lastStudyAt ? DateUtils.formatLocal(lastStudyAt, 'type6') : '없음'} </Text>
								<Text style={styles.statLabel}> 마지막 학습일 </Text>
							</View>
						</View>
					</View>
				)}

				{/* 나의 퀴즈 활동 요약 */}
				{(activeTab === 'all' || activeTab === 'quiz') && (
				<View style={styles.sectionHeaderStatic}>
					<View style={styles.iconCircle2}>
						<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(16)} color={COLORS.textWhite} />
					</View>
					<Text style={styles.sectionTitle}>나의 퀴즈 활동</Text>
				</View>
				)}
				{(activeTab === 'all' || activeTab === 'quiz') && (
					<View style={styles.activityCardBox}>
						<View style={styles.chartRow}>
							<DonutChart percent={accuracy} size={scaledSize(88)} strokeWidth={scaledSize(10)} color={COLORS.secondary}>
								<AnimatedCounter value={accuracy} suffix="%" style={[styles.donutCenterValue, { color: COLORS.secondary }]} />
								<Text style={styles.donutCenterLabel}>정답률</Text>
							</DonutChart>
							<View style={styles.chartLegend}>
								<Text style={styles.chartLegendTitle}>정답 / 오답 비율</Text>
								<View style={styles.chartLegendRow}>
									<View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
									<Text style={styles.chartLegendText}>
										정답 <Text style={styles.chartLegendStrong}>{correctCount}개</Text>
									</Text>
								</View>
								<View style={styles.chartLegendRow}>
									<View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
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
							<View style={[styles.statIconChip, { backgroundColor: COLORS.secondarySoft }]}>
								<IconComponent type="materialIcons" name="calculate" size={scaledSize(18)} color={COLORS.secondary} />
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
								<View style={[styles.statIconChip, { backgroundColor: COLORS.accentOrangeSoft }]}>
									<IconComponent type="fontAwesome6" name="fire" size={scaledSize(16)} color={COLORS.accentFlame} />
								</View>
								<Text style={styles.statValue}> {bestCombo} Combo </Text>
								<Text style={styles.statLabel}> 최고 콤보 </Text>
							</View>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: COLORS.primarySoft }]}>
									<IconComponent type="materialIcons" name="check-circle" size={scaledSize(18)} color={COLORS.primary} />
								</View>
								<Text style={styles.statValue}> {accuracy}% </Text>
								<Text style={styles.statLabel}> 정답률 </Text>
							</View>
							<View style={styles.summaryStatCard}>
								<View style={[styles.statIconChip, { backgroundColor: COLORS.accentTealBg }]}>
									<IconComponent type="materialIcons" name="calendar-today" size={scaledSize(16)} color={COLORS.accentTeal} />
								</View>
								<Text style={styles.statValue}> {lastAnsweredAt ? DateUtils.formatLocal(lastAnsweredAt, 'type6') : '없음'} </Text>
								<Text style={styles.statLabel}> 마지막 퀴즈일 </Text>
							</View>
						</View>

						<View style={styles.subSectionBox2}>
							<ConquerHeader
								iconType="fontAwesome6"
								iconName="medal"
								tint={COLORS.warning}
								chipBg={COLORS.warningBg}
								title="정복한 레벨"
								current={levelMaster.length}
								total={DIFFICULTIES.length}
							/>
							<Text style={styles.levelHelperText}>각 레벨의 속담 퀴즈를 모두 풀면 획득할 수 있습니다</Text>
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
													size={scaledSize(24)}
													color={isEarned ? COLORS.textWhite : COLORS.textLight}
													style={{ marginBottom: SPACING_H.xsPlus }}
												/>
												<Text style={[styles.levelText, isEarned && { color: COLORS.textWhite, fontWeight: '700' }]}> {item.title} </Text>
												<Text style={[styles.levelSubText, isEarned && { color: COLORS.textWhite }]}> {item.subtitle} </Text>

												{/* ✅ 정복 배지 */}
												{isEarned && (
													<View style={[styles.conquerTag, { marginTop: SPACING_H.xsPlus }]}>
														<IconComponent type="materialIcons" name="check-circle" size={scaledSize(11)} color={COLORS.primaryDark} />
														<Text style={styles.conquerTagText}>정복</Text>
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
							<ConquerHeader
								iconType="fontAwesome6"
								iconName="brain"
								tint={COLORS.accentSky}
								chipBg={COLORS.accentSkyBg}
								title="정복한 카테고리"
								current={categoryMaster.length}
								total={allCategories.length}
							/>
							<Text style={styles.regionHelperText}>특정 분야의 속담을 모두 풀면 획득할 수 있습니다</Text>
							<FlatList
								data={allCategories}
								keyExtractor={(item) => item}
								scrollEnabled={false}
								renderItem={({ item: category }) => {
									const isEarned = categoryMaster.includes(category);
									const categoryInfo = FIELD_DROPDOWN_ITEMS.find((item) => item.label === category || item.value === category);
									const meta = {
										color: categoryInfo?.iconColor ?? COLORS.borderDark,
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
												},
											]}>
											<View
												style={{
													width: scaleWidth(34),
													height: scaleWidth(34),
													borderRadius: scaleWidth(11),
													alignItems: 'center',
													justifyContent: 'center',
													marginRight: SPACING_W.smPlus,
													backgroundColor: isEarned ? 'rgba(255,255,255,0.22)' : COLORS.surfaceAlt,
												}}>
												<IconComponent
													type={meta.icon.type}
													name={meta.icon.name}
													size={scaledSize(18)}
													color={isEarned ? COLORS.textWhite : meta.color}
												/>
											</View>
											<Text
												style={[
													styles.categoryRowText,
													isEarned && {
														color: COLORS.textWhite,
														fontWeight: '700',
														textShadowColor: 'rgba(0, 0, 0, 0.15)',
														textShadowOffset: { width: 1, height: 1 },
														textShadowRadius: 2,
													},
												]}>
												{category}
											</Text>
											{/* ✅ 정복 배지 */}
											{isEarned && (
												<View style={[styles.conquerTag, { marginLeft: 'auto' }]}>
													<IconComponent type="materialIcons" name="check-circle" size={scaledSize(11)} color={COLORS.primaryDark} />
													<Text style={styles.conquerTagText}>정복</Text>
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
						<IconComponent type="materialIcons" name="calendar-today" size={scaledSize(16)} color={COLORS.textWhite} />
					</View>
					<Text style={styles.sectionTitle}>나의 오늘의 퀴즈</Text>
				</View>
				)}

				{(activeTab === 'all' || activeTab === 'today') && (
					<View style={styles.sectionBox}>
						<Calendar
							markedDates={markedQuizDates}
							markingType="custom"
							style={[styles.calendarStyle, { width: '100%' }]}
							onDayPress={(day) => {
								const date = day.dateString;
								const matchedData = todayQuizDataList.find((item) => DateUtils.toLocalDateKey(item.quizDate) === date);
								setSelectedDate(date);
								setSelectedQuizData(matchedData ?? null);

								updateMarkedQuizDatesOnSelect(date, selectedDate, setMarkedQuizDates, todayQuizDataList);
							}}
							theme={{
								calendarBackground: COLORS.surface,
								todayTextColor: COLORS.primary,
								textDayFontSize: FONT_SIZES.md,
								textMonthFontSize: FONT_SIZES.lg,
								textDayHeaderFontSize: FONT_SIZES.smPlus,
							}}
						/>
						<View style={[styles.subtitleRow, { marginTop: SPACING_H.sm }]}>
							<IconComponent type="materialIcons" name="fiber-manual-record" size={scaledSize(12)} color={COLORS.primary} />
							<Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary }}>표시는 오늘의 퀴즈를 모두 푼 날입니다.</Text>
						</View>

						{selectedDate === null && (
							<View style={[styles.subtitleRow, { marginTop: SPACING_H.xsPlus, marginBottom: 0 }]}>
								<IconComponent type="materialIcons" name="calendar-today" size={scaledSize(13)} color={COLORS.textLight} />
								<Text style={styles.emptyText}>날짜를 선택해 주세요.</Text>
							</View>
						)}

						{selectedDate && selectedQuizData === null && (
							<View
								style={{
									borderWidth: 1,
									borderColor: COLORS.border,
									backgroundColor: COLORS.background,
									borderRadius: RADIUS.lg,
									padding: SPACING_W.lg,
									marginTop: SPACING_H.md,
									alignSelf: 'stretch',
								}}>
								<Text style={{ fontSize: FONT_SIZES.smPlus, color: COLORS.textLight, textAlign: 'left' }}>
									선택한 날짜에는 오늘의 퀴즈를 풀지 않았습니다
								</Text>
							</View>
						)}

						{selectedDate && selectedQuizData && (
							<View style={[styles.sectionBox, { marginTop: SPACING_H.md, borderWidth: 0, paddingHorizontal: 0, paddingVertical: SPACING_H.xsPlus, backgroundColor: 'transparent' }]}>
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
												backgroundColor: COLORS.surface,
												borderRadius: RADIUS.lg,
												paddingVertical: SPACING_H.md,
												paddingHorizontal: SPACING_W.lg,
												borderWidth: 0,
												marginBottom: SPACING_H.md,
												alignSelf: 'stretch', // ✅ 전체 너비 확보
											}}>
											<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING_W.sm }}>
												<View style={{ flex: 1 }}>
													<Text
														style={{
															fontSize: FONT_SIZES.md,
															fontWeight: '700',
															marginBottom: SPACING_H.sm,
															color: COLORS.text,
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
																gap: SPACING_W.xs,
																backgroundColor: isCorrect ? COLORS.primarySoft : COLORS.dangerBg,
																borderRadius: RADIUS.round,
																paddingHorizontal: SPACING_W.sm,
																paddingVertical: SPACING_H.xs,
																marginBottom: SPACING_H.sm,
															}}>
															<IconComponent
																type="materialIcons"
																name={isCorrect ? 'check-circle' : 'cancel'}
																size={scaledSize(13)}
																color={isCorrect ? COLORS.primaryDark : COLORS.dangerDark}
															/>
															<Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: isCorrect ? COLORS.primaryDark : COLORS.dangerDark }}>
																{isCorrect ? '정답' : '오답'}
															</Text>
														</View>
													)}
													{!!(quizItem?.longMeaning || quizItem?.meaning) && (
														<Text style={{ fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, lineHeight: scaleHeight(18) }} numberOfLines={2}>
															{quizItem.longMeaning || quizItem.meaning}
														</Text>
													)}
												</View>
												<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color={COLORS.textLight} style={{ alignSelf: 'center' }} />
											</View>
										</TouchableOpacity>
									);
								})}
							</View>
						)}

					</View>
				)}

				{/* 기존 결과 화면 */}
				{(activeTab === 'all' || activeTab === 'time') && (
				<View style={styles.sectionHeaderStatic}>
					<View style={styles.iconCircle3}>
						<IconComponent type="materialIcons" name="timer" size={scaledSize(16)} color={COLORS.textWhite} />
					</View>
					<Text style={styles.sectionTitle}>나의 타임 챌린지 결과</Text>
				</View>
				)}

				{(activeTab === 'all' || activeTab === 'time') && (
					<View style={styles.sectionBox}>
						<View style={styles.subtitleRow}>
							<IconComponent type="materialIcons" name="leaderboard" size={scaledSize(16)} color={COLORS.accentFlame} />
							<Text style={styles.topRankingTitleInline}>나의 랭킹 TOP 3</Text>
						</View>

						{timeChallengeResults.length === 0 ? (
							<Text style={styles.noRecordText}>아직 기록이 없습니다. 챌린지를 시작해보세요!</Text>
						) : (
							timeChallengeResults.map((item, index) => (
									<View key={index} style={styles.recordCard}>
										<View style={styles.rankRow}>
											{index === 0 && (
												<>
													<IconComponent
														name="trophy"
														type="FontAwesome"
														size={scaledSize(24)}
														color={COLORS.gold}
														style={{ marginRight: SPACING_W.sm }}
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
														color={COLORS.borderDark}
														style={{ marginRight: SPACING_W.md }}
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
														color={COLORS.accentOrangeLight}
														style={{ marginRight: SPACING_W.lg }}
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
								<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(16)} color={COLORS.textWhite} />
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
													color={earned ? rarity.color : COLORS.textLight}
												/>
											</View>
											<View style={styles.textBox}>
												<View style={styles.badgeTitleRow}>
													<Text style={[styles.badgeTitle, earned && styles.badgeTitleActive]} numberOfLines={1}>{badge.name}</Text>
													<View style={[styles.badgeRarityTag, { backgroundColor: earned ? rarity.soft : COLORS.surfaceAlt }]}>
														<IconComponent type="materialIcons" name="auto-awesome" size={scaledSize(9)} color={rarity.color} />
														<Text style={[styles.badgeRarityTagText, { color: rarity.color }]}>{rarity.label}</Text>
													</View>
												</View>
												<Text style={[styles.badgeDesc, earned && styles.badgeDescActive]} numberOfLines={1}>{badge.description}</Text>
												<View style={styles.badgeCondRow}>
													<IconComponent type="materialIcons" name="flag" size={scaledSize(10)} color={COLORS.textLight} />
													<Text style={styles.badgeCondText} numberOfLines={1}>{badge.condition}</Text>
												</View>
											</View>
											<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color={earned ? COLORS.primary : COLORS.borderDark} style={{ alignSelf: 'center' }} />
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
					<View style={[styles.iconCircle3, { backgroundColor: COLORS.accentSky }]}>
						<IconComponent type="fontAwesome6" name="tower-observation" size={scaledSize(14)} color={COLORS.textWhite} />
					</View>
					<Text style={styles.sectionTitle}>나의 타워 챌린지</Text>
				</View>
				)}

				{(activeTab === 'all' || activeTab === 'tower') && (
					<View style={styles.sectionBox}>
						<ConquerHeader
							iconType="fontAwesome6"
							iconName="tower-observation"
							tint={COLORS.accentSky}
							chipBg={COLORS.accentSkyBg}
							title="클리어한 타워"
							current={unlockedRewards.length}
							total={TOWER_LEVELS.length}
						/>
						<Text style={styles.regionHelperText}>레벨별 보스를 클리어하면 보상을 받을 수 있습니다</Text>
						{TOWER_LEVELS.map((tower) => {
							const isCleared = unlockedRewards.includes(tower.level);
							return (
								<View
									key={tower.level}
									style={{
										flexDirection: 'row',
										borderRadius: RADIUS.lg,
										overflow: 'hidden',
										marginBottom: SPACING_H.md,
										borderWidth: 1.5,
										borderColor: isCleared ? tower.color : COLORS.border,
										backgroundColor: COLORS.surface,
										opacity: isCleared ? 1 : 0.55,
									}}>
									{/* 왼쪽: 보스 이미지 + 레벨 배지 */}
									<View
										style={{
											width: scaleWidth(80),
											// 고정 파스텔 대신 보스 색에서 틴트를 만든다 — 다크모드에서도 배경에 어울린다
											backgroundColor: isCleared ? withAlpha(tower.color, ALPHA.soft) : COLORS.surfaceAlt,
											alignItems: 'center',
											justifyContent: 'center',
											padding: SPACING_W.sm,
										}}>
										<FastImage
											source={tower.bossImage}
											style={{ width: scaleWidth(56), height: scaleWidth(56), borderRadius: scaleWidth(8) }}
											resizeMode="contain"
										/>
										<View
											style={{
												marginTop: SPACING_H.xs,
												backgroundColor: isCleared ? tower.color : COLORS.textLight,
												borderRadius: RADIUS.round,
												paddingHorizontal: SPACING_W.sm,
												paddingVertical: SPACING_H.xxs,
											}}>
											<Text style={{ color: isCleared ? readableTextOn(tower.color) : COLORS.textWhite, fontSize: FONT_SIZES.xxs, fontWeight: '700' }}>
												LV.{tower.level}
											</Text>
										</View>
									</View>

									{/* 오른쪽: 보스 정보 + 보상 */}
									<View style={{ flex: 1, padding: SPACING_W.md, justifyContent: 'center' }}>
										<Text style={{ fontSize: FONT_SIZES.xxs, color: COLORS.textLight, marginBottom: SPACING_H.xxs }}>{tower.bossTitle}</Text>
										<Text style={{ fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING_H.xsPlus }}>{tower.bossName}</Text>

										<View style={{ height: 1, backgroundColor: COLORS.surfaceAlt, marginBottom: SPACING_H.xsPlus }} />

										<View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING_W.sm }}>
											<FastImage
												source={tower.reward.image}
												style={{
													width: scaleWidth(36),
													height: scaleWidth(36),
													borderRadius: scaleWidth(6),
													borderWidth: 1,
													borderColor: COLORS.border,
												}}
												resizeMode="cover"
											/>
											<View>
												<View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xs }}>
													<IconComponent
														type="materialIcons"
														name={tower.reward.type === 'costume' ? 'checkroom' : 'auto-awesome'}
														size={scaledSize(11)}
														color={COLORS.textLight}
													/>
													<Text style={{ fontSize: FONT_SIZES.xxs, color: COLORS.textLight }}>{tower.reward.type === 'costume' ? '코스튬' : '캐릭터'}</Text>
												</View>
												<Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>{tower.reward.name}</Text>
											</View>

											{/* 클리어 / 미클리어 배지 */}
											<View
												style={{
													marginLeft: 'auto',
													backgroundColor: isCleared ? tower.color : COLORS.textLight,
													borderRadius: RADIUS.round,
													paddingHorizontal: SPACING_W.sm,
													paddingVertical: SPACING_H.xs,
												}}>
												<Text style={{ color: COLORS.textWhite, fontSize: FONT_SIZES.xxs, fontWeight: '700' }}>{isCleared ? '클리어 ✓' : '미클리어 🔒'}</Text>
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

			{/* 등급 안내 팝업 — 홈과 동일한 공통 컴포넌트 사용 */}
			<LevelModal visible={showLevelModal} totalScore={totalScore} onClose={() => setShowLevelModal(false)} />

			{/* 🏅 뱃지 상세 팝업 */}
			<BadgeDetailPopup
				visible={badgePopupVisible}
				badge={badgePopupBadge}
				isEarned={badgePopupBadge ? earnedBadgeIds.includes(badgePopupBadge.id) : false}
				onClose={() => {
					// 닫을 때 뱃지도 비운다 — 남겨 두면 다음에 열 때 이전 뱃지가 한 프레임 스친다
					setBadgePopupVisible(false);
					setBadgePopupBadge(null);
				}}
			/>
			<ProverbDetailModal visible={detailVisible && !!detailProverb} proverb={detailProverb} onClose={() => setDetailVisible(false)} />

			{/* 최하단에 위치할것!! */}
			<ScrollTopButton visible={showScrollTop} onPress={scrollHandler.toTop} />
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'나의 활동에서는 지금까지의 기록을 모아서 볼 수 있습니다.',
					'퀴즈로 점수를 모으면 캐릭터 등급이 올라갑니다. 옆에 붙은 펫은 도전탑 보상으로 얻은 친구입니다.',
					'전체 스코어로 학습 진척도와 정답률을 한눈에 확인하세요.',
					'뱃지를 누르면 획득 조건과 상세 설명이 나옵니다!',
				]}
				title="나의 활동, 이렇게 봅니다"
			/>
		</SafeAreaView>
	);
};

export default MyScoreScreen;

const styles = themedStyles(() => StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: COLORS.background },
	container: {
		paddingHorizontal: SPACING_W.lg,
	},
	pageTitle: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		marginBottom: SPACING_H.xl,
		color: COLORS.text,
	},
	badgeFilterRow: { flexDirection: 'row', gap: SPACING_W.sm, marginBottom: SPACING_H.md },
	badgeFilterChip: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	badgeFilterChipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
	badgeFilterText: { fontSize: FONT_SIZES.smPlus, fontWeight: '700', color: COLORS.textSecondary },
	badgeFilterTextActive: { color: COLORS.primaryDark },

	badgeCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	badgeCardActive: {
		borderColor: COLORS.primary,
		backgroundColor: COLORS.primaryBg,
	},
	iconBox: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: COLORS.border,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: SPACING_W.md,
	},
	iconBoxActive: {
		backgroundColor: COLORS.primarySoft,
	},
	badgeTitle: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '600',
		color: COLORS.text,
		flexShrink: 1,
	},
	badgeTitleActive: {
		color: COLORS.primary,
	},
	badgeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xsPlus },
	badgeRarityTag: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xxs,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.xsPlus,
		paddingVertical: SPACING_H.xxs,
	},
	badgeRarityTagText: { fontSize: FONT_SIZES.xxs, fontWeight: '700' },
	badgeCondRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xs, marginTop: SPACING_H.xs },
	badgeCondText: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, flex: 1 },
	badgeDesc: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.xxs,
		lineHeight: scaleHeight(18),
	},
	badgeDescActive: {
		color: COLORS.primary,
	},
	characterHelpButton: {
		// absolute 자식은 부모의 padding 안쪽을 기준으로 잡힌다.
		// 0 이면 카드 모서리에 딱 붙어 답답해 보여 위·오른쪽을 한 단계 더 띄운다.
		position: 'absolute',
		top: SPACING_H.sm,
		right: SPACING_W.sm,
		zIndex: 20,
	},
	sectionBox: {
		backgroundColor: COLORS.background,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.xxl,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	scoreDashCard: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		padding: SPACING_W.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	scoreDashHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: SPACING_H.md,
	},
	scoreDashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.sm },
	scoreDashIconChip: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: scaleWidth(8),
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	scoreDashTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textStrong },
	scoreDashScorePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xs,
		backgroundColor: COLORS.warningBg,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
	},
	scoreDashScoreText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.warningDark },
	scoreDashGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING_H.sm },
	scoreDashTile: {
		width: '48%',
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.smPlus,
		paddingVertical: SPACING_H.smPlus,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	scoreDashTileTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xsPlus, marginBottom: SPACING_H.xs },
	scoreDashTileIcon: {
		width: scaleWidth(22),
		height: scaleWidth(22),
		borderRadius: scaleWidth(7),
		alignItems: 'center',
		justifyContent: 'center',
	},
	scoreDashTileLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, flexShrink: 1 },
	scoreDashTileValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong, marginBottom: SPACING_H.xs },
	scoreDashBarTrack: {
		height: scaleHeight(6),
		borderRadius: scaleWidth(3),
		backgroundColor: COLORS.border,
		overflow: 'hidden',
	},
	scoreDashBarFill: { height: '100%', borderRadius: scaleWidth(3) },
	scoreDashTilePct: { fontSize: FONT_SIZES.xs, fontWeight: '700', marginTop: SPACING_H.xs, textAlign: 'right' },
	subSectionBox1: {
		backgroundColor: COLORS.surface,
		padding: SPACING_W.lg,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	subSectionBox2: {
		backgroundColor: COLORS.surface,
		padding: SPACING_W.lg,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},

	statItem: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		marginBottom: SPACING_H.xsPlus,
	},
	subTitle: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '600',
		color: COLORS.text,
		marginBottom: SPACING_H.xsPlus,
	},
	tagItem: {
		fontSize: FONT_SIZES.md,
		color: COLORS.primary,
		marginBottom: SPACING_H.xs,
	},
	emptyText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
	},
	textBox: { flex: 1 },
	levelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	levelTitle: {
		fontSize: FONT_SIZES.lg,
		marginLeft: SPACING_W.xsPlus,
		color: COLORS.primary,
		fontWeight: '700',
	},
	quizSummaryBox: {
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: scaleWidth(12),
		padding: SPACING_W.md,
		marginTop: SPACING_H.sm,
		marginBottom: SPACING_H.lg,
	},
	levelIconWrap: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		borderRadius: scaleWidth(18),
		borderWidth: 2,
		borderColor: COLORS.primary,
		backgroundColor: COLORS.secondaryBg,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.sm,
	},
	levelModal: {
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.xl,
		paddingTop: SPACING_H.xl,
		paddingBottom: SPACING_H.md,
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
	},
	levelModalTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		marginBottom: SPACING_H.md,
		color: COLORS.text,
	},
	levelRowItem: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		paddingVertical: SPACING_H.sm,
		borderBottomWidth: 1,
		borderColor: COLORS.border,
	},
	levelRowItemActive: {
		backgroundColor: COLORS.secondaryBg,
		borderColor: COLORS.primary,
	},
	levelCardBox: {
		backgroundColor: COLORS.background,
		borderRadius: scaleWidth(14),
		padding: SPACING_W.lg,
		alignItems: 'center',
		marginBottom: SPACING_H.mdPlus,
		width: '100%',
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	levelCardBoxActive: {
		backgroundColor: COLORS.secondaryBg,
		borderColor: COLORS.primary,
		borderWidth: 2,
	},
	levelBadge: {
		backgroundColor: COLORS.secondary,
		paddingHorizontal: SPACING_W.smPlus,
		paddingVertical: SPACING_H.xs,
		borderRadius: scaleWidth(12),
		marginBottom: SPACING_H.sm,
	},
	levelBadgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
	levelMascot: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		marginBottom: SPACING_H.smPlus,
	},
	levelLabel: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.xxs,
	},
	levelScore: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
	},
	levelEncourage: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.primary,
		marginTop: SPACING_H.xsPlus,
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	levelIconWrapSmall: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(14),
		backgroundColor: COLORS.secondarySoft,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: SPACING_W.smPlus,
	},
	levelModalText: {
		flex: 1,
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
	},
	levelModalScore: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
	},
	levelNowText: {
		marginLeft: SPACING_W.xsPlus,
		fontSize: FONT_SIZES.md,
		color: COLORS.primary,
		fontWeight: '700',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalConfirmButton: {
		marginTop: SPACING_H.lg,
		paddingVertical: SPACING_H.smPlus,
		paddingHorizontal: SPACING_W.xxl,
		backgroundColor: COLORS.secondary,
		borderRadius: scaleWidth(8),
	},
	modalConfirmText: {
		color: COLORS.textWhite,
		fontWeight: '600',
		fontSize: FONT_SIZES.md,
	},
	levelCenteredRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	levelDescription: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		textAlign: 'center',
		lineHeight: scaleHeight(18),
		marginBottom: SPACING_H.xs,
	},
	levelScoreText: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.textSecondary,
		textAlign: 'center',
		marginTop: SPACING_H.xs,
	},
	levelScoreHighlight: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.primary,
		marginTop: SPACING_H.xs,
	},
	activityCardBox: {
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.lg,
		padding: SPACING_W.lg,
		marginBottom: SPACING_H.xxl,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	activityRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: SPACING_H.smPlus,
	},
	activityLabel: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
	},
	activityValue: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.text,
	},
	summaryCard: {
		backgroundColor: HERO.bg,
		padding: SPACING_W.lg,
		borderRadius: scaleWidth(12),
		marginBottom: SPACING_H.lg,
		borderWidth: 1,
		borderColor: COLORS.gold,
	},
	summaryTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.warning,
		marginBottom: SPACING_H.sm,
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	progressText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		marginRight: SPACING_W.md,
	},
	progressBarBackground: {
		width: '80%',
		height: scaleHeight(6),
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: scaleHeight(3),
		marginTop: SPACING_H.xsPlus,
		alignSelf: 'center',
	},
	progressBarFill: {
		height: scaleHeight(6),
		backgroundColor: COLORS.secondary,
		borderRadius: scaleHeight(3),
	},
	gridRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginTop: SPACING_H.xsPlus,
	},
	regionCard: {
		width: '28%',
		height: scaleHeight(100),
		borderWidth: 1,
		borderColor: COLORS.borderDark,
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: SPACING_W.xsPlus,
		paddingVertical: SPACING_H.sm,
		backgroundColor: COLORS.surface,
		marginBottom: SPACING_H.md,
		marginHorizontal: SPACING_W.xs,
	},
	levelCard: {
		width: '42%',
		aspectRatio: 1,
		borderWidth: 1.5,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.background,
		marginHorizontal: SPACING_W.sm,
		marginBottom: SPACING_H.md,
	},
	regionText: {
		fontSize: FONT_SIZES.md,
		textAlign: 'center',
		color: COLORS.textSecondary,
	},
	levelText: {
		fontSize: FONT_SIZES.mdPlus,
		textAlign: 'center',
		color: COLORS.text,
		fontWeight: '700',
	},
	cardActive: {
		backgroundColor: COLORS.secondaryBg,
	},
	summaryStatGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		columnGap: SPACING_W.xs,
	},
	summaryStatCard: {
		flex: 1,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingVertical: SPACING_H.md,
		marginHorizontal: SPACING_W.xs,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.border,
		marginBottom: SPACING_H.md,
	},
	statIcon: {
		fontSize: FONT_SIZES.heading,
		marginBottom: SPACING_H.xs,
	},
	statValue: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.xs,
	},
	statLabel: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
	},
	statIconChip: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(10),
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.xsPlus,
	},
	chartRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		padding: SPACING_W.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	donutCenterValue: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		color: COLORS.primaryDark,
	},
	donutCenterLabel: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.xxs,
	},
	chartLegend: {
		flex: 1,
		marginLeft: SPACING_W.md,
	},
	chartLegendTitle: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.smPlus,
	},
	chartLegendRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING_H.xsPlus,
	},
	legendDot: {
		width: scaleWidth(10),
		height: scaleWidth(10),
		borderRadius: scaleWidth(5),
		marginRight: SPACING_W.sm,
	},
	chartLegendText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
	},
	chartLegendStrong: {
		fontWeight: '700',
		color: COLORS.text,
	},
	stackBarTrack: {
		flexDirection: 'row',
		height: scaleHeight(8),
		borderRadius: scaleHeight(4),
		overflow: 'hidden',
		marginTop: SPACING_H.sm,
		backgroundColor: COLORS.surfaceAlt,
	},
	stackBarCorrect: { backgroundColor: COLORS.primary },
	stackBarWrong: { backgroundColor: COLORS.danger },
	subtitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xsPlus,
		marginBottom: SPACING_H.md,
		marginTop: SPACING_H.sm,
	},
	conquerHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: SPACING_H.sm,
		marginBottom: SPACING_H.xs,
	},
	conquerHeaderIcon: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(9),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.sm,
	},
	conquerHeaderTitle: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.text,
	},
	conquerCountPill: {
		marginLeft: 'auto',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	conquerCountText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
	conquerTag: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xs,
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xxs,
		borderRadius: RADIUS.round,
	},
	conquerTagText: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.primaryDark,
		fontWeight: '700',
	},
	sectionSubtitleInline: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.text,
		fontWeight: '700',
	},
	topRankingTitleInline: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.text,
	},
	regionSubText: {
		fontSize: FONT_SIZES.xxs,
		color: COLORS.textLight,
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	levelSubText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	sectionSubtitle: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.text,
		marginBottom: SPACING_H.md,
		marginTop: SPACING_H.sm,
		fontWeight: '700',
	},
	gridRowNoBottomGap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginTop: SPACING_H.md,
		paddingBottom: SPACING_H.xsPlus,
	},
	regionHelperText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.lg,
	},
	levelHelperText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.xs,
		marginBottom: SPACING_H.lg,
	},
	adContainer: {
		backgroundColor: COLORS.surface,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: SPACING_H.smPlus,
		paddingVertical: SPACING_H.xsPlus,
	},
	regionCardActive: {
		backgroundColor: COLORS.secondaryBg,
		borderColor: COLORS.primary,
	},
	regionTextActive: {
		color: COLORS.primary,
		fontWeight: '700',
	},
	scoreBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		marginBottom: SPACING_H.md,
	},
	scoreBadgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		marginLeft: SPACING_W.xsPlus,
	},
	iconCircle1: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		marginRight: SPACING_W.xsPlus,
		borderRadius: scaleWidth(15),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.primary, // 🎨 학습 모드(홈 버튼) 초록
	},
	iconCircle2: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(15),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.xsPlus,
		backgroundColor: COLORS.secondary, // 🎨 밝은 파랑 배경 추가
	},

	iconCircle3: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(15),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.xsPlus,
		backgroundColor: COLORS.accentFlame,
	},

	iconCircle4: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(15),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.xsPlus,
		backgroundColor: COLORS.accentTeal, // 오늘의 퀴즈 — 비중복 틸 컬러
	},
	iconCircle5: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(15),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.xsPlus,
		backgroundColor: COLORS.warning,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: SPACING_H.lg,
		marginBottom: SPACING_H.smPlus,
		backgroundColor: COLORS.surface,
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.mdPlus,
},
	sectionHeaderStatic: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: SPACING_H.sm,
		marginBottom: SPACING_H.md,
	},
	activityGroupBox: {
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.surface,
		marginHorizontal: scaleWidth(-8),
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.md,
		marginTop: SPACING_H.sm,
	},
	activityTabBar: {
		paddingVertical: SPACING_H.xsPlus,
		paddingRight: SPACING_W.sm,
		gap: SPACING_W.sm,
		alignItems: 'center',
		marginBottom: SPACING_H.xsPlus,
	},
	activityTabChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
		gap: SPACING_W.xsPlus,
	},
	activityTabChipActive: {
		backgroundColor: COLORS.primary,
	},
	activityTabText: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '600',
		color: COLORS.textSecondary,
	},
	activityTabTextActive: {
		color: COLORS.textWhite,
		fontWeight: '700',
	},
	sectionTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	sectionTitle2: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		marginBottom: SPACING_H.md,
		color: COLORS.text,
	},
	categoryRowCard: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderWidth: 1.5,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.background,
		marginBottom: SPACING_H.md,
		width: '100%',
	},
	categoryRowText: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.text,
		fontWeight: '600',
	},
	levelDetailDescription: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		textAlign: 'center',
		marginTop: SPACING_H.xsPlus,
		lineHeight: scaleHeight(18),
	},
	timeResultCard: {
		marginBottom: SPACING_H.md,
		padding: SPACING_W.md,
		backgroundColor: COLORS.background,
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	timeResultDate: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xs,
	},
	timeResultScore: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.xsPlus,
	},
	timeResultRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: SPACING_H.xs,
	},
	timeResultItem: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
	},
	timeResultTime: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		textAlign: 'right',
	},
	timeCard: {
		marginBottom: SPACING_H.md,
		padding: SPACING_W.md,
		backgroundColor: COLORS.surface,
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: COLORS.borderDark,
	},
	timeCardDate: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xxs,
	},
	timeCardScore: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.xsPlus,
	},
	timeCardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: SPACING_H.xs,
	},
	timeCardItem: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
	},
	timeCardUsed: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		textAlign: 'right',
	},
	topRankingTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.md,
	},

	noRecordText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
		textAlign: 'center',
		marginTop: SPACING_H.lg,
	},

	recordCard: {
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		marginBottom: SPACING_H.md,
	},

	rankRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	firstRankLabel: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.gold,
		fontWeight: '700',
		marginRight: SPACING_W.sm,
	},

	secondRankLabel: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		fontWeight: '700',
		marginRight: SPACING_W.sm,
	},

	thirdRankLabel: {
		fontSize: FONT_SIZES.md,
		color: COLORS.accentOrangeLight,
		fontWeight: '700',
		marginRight: SPACING_W.sm,
	},

	firstRankScore: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.text,
	},

	secondRankScore: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
	},

	thirdRankScore: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
	},

	rankDate: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
	},
	calendarStyle: {
		alignSelf: 'stretch', // 또는 width: '100%'
		borderRadius: RADIUS.lg,
		overflow: 'hidden',
		marginBottom: SPACING_H.md,
	},
	levelDescriptionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		marginBottom: SPACING_H.sm,
		borderWidth: 1,
		borderColor: COLORS.border,
		gap: SPACING_W.smPlus,
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
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
		lineHeight: scaleHeight(19),
		fontWeight: '500',
	},
	levelHighlight: {
		fontWeight: '700',
		color: COLORS.primary,
	},
}));
