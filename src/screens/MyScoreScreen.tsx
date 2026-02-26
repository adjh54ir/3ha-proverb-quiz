import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import 'moment/locale/ko'; // 한국어 로케일 import
import ProverbServices from '@/services/ProverbServices';
import { CONST_BADGES } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MainDataType } from '@/types/MainDataType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { FIELD_DROPDOWN_ITEMS } from './ProverbStudyScreen';
import LevelModal from './modal/LevelModal';
import { LEVEL_DATA, PET_REWARDS } from '@/const/ConstInfoData';
// import { TOWER_LEVELS } from '@/const/ConstTowerData';

LocaleConfig.defaultLocale = 'kr';
moment.locale('ko'); // 로케일 설정

const STORAGE_KEY_QUIZ = MainStorageKeyType.USER_QUIZ_HISTORY;
const STORAGE_KEY_STUDY = MainStorageKeyType.USER_STUDY_HISTORY;
const STORAGE_KEY_TIME = MainStorageKeyType.TIME_CHALLENGE_HISTORY;
const STORAGE_KEY_TODAY = MainStorageKeyType.TODAY_QUIZ_LIST;

const DIFFICULTIES = [
	{ key: 'Level 1', title: 'Level 1', subtitle: '아주 쉬움', icon: 'seedling' },
	{ key: 'Level 2', title: 'Level 2', subtitle: '쉬움', icon: 'leaf' },
	{ key: 'Level 3', title: 'Level 3', subtitle: '보통', icon: 'tree' },
	{ key: 'Level 4', title: 'Level 4', subtitle: '어려움', icon: 'trophy' },
];

const CATEGORY_META: Record<string, { color: string; icon: { type: string; name: string } }> = {
	'운/우연': { color: '#81ecec', icon: { type: 'fontAwesome5', name: 'dice' } },
	인간관계: { color: '#a29bfe', icon: { type: 'fontAwesome5', name: 'users' } },
	'세상 이치': { color: '#ffeaa7', icon: { type: 'fontAwesome5', name: 'globe' } },
	'근면/검소': { color: '#fab1a0', icon: { type: 'fontAwesome5', name: 'hammer' } },
	'노력/성공': { color: '#55efc4', icon: { type: 'fontAwesome5', name: 'medal' } },
	'경계/조심': { color: '#ff7675', icon: { type: 'fontAwesome5', name: 'exclamation-triangle' } },
	'욕심/탐욕': { color: '#fd79a8', icon: { type: 'fontAwesome5', name: 'hand-holding-usd' } },
	'배신/불신': { color: '#b2bec3', icon: { type: 'fontAwesome5', name: 'user-slash' } },
};

const STYLE_MAP = {
	'아주 쉬움': {
		color: '#85C1E9',
		icon: { type: 'fontAwesome5', name: 'seedling' },
		badgeId: 'level_easy_1',
		type: 'level',
	},
	쉬움: {
		color: '#F4D03F',
		icon: { type: 'fontAwesome5', name: 'leaf' },
		badgeId: 'level_easy_2',
		type: 'level',
	},
	보통: {
		color: '#EB984E',
		icon: { type: 'fontAwesome5', name: 'tree' },
		badgeId: 'level_medium',
		type: 'level',
	},
	어려움: {
		color: '#E74C3C',
		icon: { type: 'fontAwesome5', name: 'trophy' },
		badgeId: 'level_hard',
		type: 'level',
	},
};
const CapitalResultScreen = () => {
	const isFocused = useIsFocused();
	const scrollRef = useRef<ScrollView>(null);
	const [refreshing, setRefreshing] = useState(false);
	const levelScrollRef = useRef<ScrollView>(null);

	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
	const [totalScore, setTotalScore] = useState<number>(0);
	const [levelMaster, setLevelMaster] = useState<string[]>([]);
	const [correctCount, setCorrectCount] = useState<number>(0);
	const [wrongCount, setWrongCount] = useState<number>(0);
	const [lastAnsweredAt, setLastAnsweredAt] = useState<string>('');
	const [bestCombo, setBestCombo] = useState<number>(0);
	const [showLevelModal, setShowLevelModal] = useState(false);
	const [showBadgeList, setShowBadgeList] = useState(false);
	const [studyCountries, setStudyCountries] = useState<string[]>([]);
	const [lastStudyAt, setLastStudyAt] = useState<string>('');
	const [totalStudyCount, setTotalStudyCount] = useState<number>(0);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [categoryMaster, setCategoryMaster] = useState<string[]>([]);
	const [totalCountryCount, setTotalCountryCount] = useState<number>(0);
	const [petLevel, setPetLevel] = useState(-1);

	const [showStudySection, setShowStudySection] = useState(false);
	const [showQuizSection, setShowQuizSection] = useState(false);
	const [showTimeSection, setShowTimeSection] = useState(false);
	const [showBadgeSection, setShowBadgeSection] = useState(false);
	const [showTodayQuizSection, setShowTodayQuizSection] = useState(false);
	const [showTowerSection, setShowTowerSection] = useState(false);
	const [unlockedRewards, setUnlockedRewards] = useState<number[]>([]);

	const [isAllExpanded, setIsAllExpanded] = useState(false);

	const [markedQuizDates, setMarkedQuizDates] = useState<{ [date: string]: any }>({});
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [todayQuizDataList, setTodayQuizDataList] = useState<MainDataType.TodayQuizList[]>([]);
	const [selectedQuizData, setSelectedQuizData] = useState<MainDataType.TodayQuizList | null>(null);

	const [timeChallengeResults, setTimeChallengeResults] = useState<MainDataType.TimeChallengeResult[]>([]);

	const [levelStats, setLevelStats] = useState<
		{ key: string; title: string; subtitle: string; icon: string; totalCount: number; solvedCount: number }[]
	>([]);
	const [categoryStats, setCategoryStats] = useState<{ category: string; totalCount: number; solvedCount: number }[]>([]);

	const allCategories = ProverbServices.selectCategoryList(); // 전체 카테고리 (8개)

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	const getLevelStyle = (subtitle: string) => {
		const entry = STYLE_MAP[subtitle];
		if (!entry) {
			return { bg: '#fff', border: '#ccc' };
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
		}, []),
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
			const categoryMap: Record<string, { total: number; studied: number }> = {};

			const studyData = await AsyncStorage.getItem(STORAGE_KEY_STUDY);
			const quizData = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);

			const studyBadges = studyData ? (JSON.parse(studyData)?.badges ?? []) : [];
			const quizJson = quizData ? JSON.parse(quizData) : null;
			const quizBadges = quizJson?.badges ?? [];
			const studyJson = studyData ? JSON.parse(studyData) : null;
			const studiedIds: number[] = studyJson?.studyProverbes ?? [];
			const studyCounts = studyJson?.studyCounts ?? {};
			const lastDate = studyJson?.lastStudyAt ?? '';

			const allProverbs = ProverbServices.selectProverbList();
			setTotalCountryCount(allProverbs.length);
			setStudyCountries(studiedIds.map(String)); // 화면 출력용
			setLastStudyAt(lastDate);

			const totalCount = (Object.values(studyCounts) as number[]).reduce((a, b) => a + b, 0);
			setTotalStudyCount(totalCount);

			setTotalScore(quizJson?.totalScore ?? 0);
			setCorrectCount(quizJson?.correctProverbId?.length ?? 0);
			setWrongCount(quizJson?.wrongProverbId?.length ?? 0);
			setLastAnsweredAt(quizJson?.lastAnsweredAt ?? '');
			setBestCombo(quizJson?.bestCombo ?? 0);

			const timeData = await AsyncStorage.getItem(STORAGE_KEY_TIME);
			const timeResults: MainDataType.TimeChallengeResult[] = timeData ? JSON.parse(timeData) : [];
			setTimeChallengeResults(timeResults.slice(0, 3)); // 최근 3개만 보기
			// 전체 카테고리별 속담 수 초기화
			allProverbs.forEach((item) => {
				const cat = item.category;
				if (!categoryMap[cat]) {
					categoryMap[cat] = { total: 0, studied: 0 };
				}
				categoryMap[cat].total++;
				if (studiedIds.includes(item.id)) {
					categoryMap[cat].studied++;
				}
			});

			const allBadges = [...new Set([...studyBadges, ...quizBadges])];
			setEarnedBadgeIds(allBadges);

			console.log(allCategories);

			// 카테고리 뱃지 매핑
			const categoryMap2: { [key: string]: string } = {
				'운/우연': 'category_luck',
				인간관계: 'category_relation',
				'세상 이치': 'category_life',
				'근면/검소': 'category_diligence',
				'노력/성공': 'category_effort',
				'경계/조심': 'category_caution',
				'욕심/탐욕': 'category_greed',
				'배신/불신': 'category_betrayal',
			};

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
						case '아주 쉬움':
							return 'Level 1';
						case '쉬움':
							return 'Level 2';
						case '보통':
							return 'Level 3';
						case '어려움':
							return 'Level 4';
						default:
							return '';
					}
				});

			setLevelMaster(conqueredLevels);

			// ✅ 여기서 solvedIds 뽑기
			const solvedIds = [...(quizJson?.correctProverbId ?? []), ...(quizJson?.wrongProverbId ?? [])];

			// ✅ 레벨별 문제 묶기 + 푼 개수 세기
			const levelStats = DIFFICULTIES.map((level, idx) => {
				const problems = allProverbs.filter((p) => p.level === idx + 1);
				const totalCount = problems.length;
				const solvedCount = problems.filter((p) => solvedIds.includes(p.id)).length;
				return { ...level, totalCount, solvedCount };
			});

			// ✅ 상태 저장해서 UI에서 사용
			setLevelStats(levelStats);
			// category만 뽑아서 중복 제거
			const categories = [...new Set(allProverbs.map((p) => p.category))];

			// ✅ 카테고리별 문제 묶기 + 푼 개수 세기
			const categoryStats = categories.map((category) => {
				const problems = allProverbs.filter((p) => p.category === category);
				const totalCount = problems.length;
				const solvedCount = problems.filter((p) => solvedIds.includes(p.id)).length;
				return { category, totalCount, solvedCount };
			});

			setCategoryStats(categoryStats);

			const todayJson = await AsyncStorage.getItem(STORAGE_KEY_TODAY);
			const todayData: MainDataType.TodayQuizList[] = todayJson ? JSON.parse(todayJson) : [];

			const marked = todayData.reduce(
				(acc, item) => {
					const dateKey = item.quizDate.slice(0, 10);
					acc[dateKey] = {
						marked: true,
						dotColor: '#4CAF50',
						customStyles: {
							container: {
								backgroundColor: '#e8f5e9',
							},
							text: {
								color: '#2e7d32',
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
						backgroundColor: '#3498db', // 🎨 밝은 파란색
					},
					text: {
						color: '#ffffff',
						fontWeight: 'bold',
					},
				},
			};
			console.log('todayData :', todayData);

			setTodayQuizDataList(todayData); // todayData를 상태로 저장

			setMarkedQuizDates(marked);

			// loadData 함수 안의 맨 아래에 추가
			if (!selectedDate) {
				const todayStr = moment().format('YYYY-MM-DD');
				const todayQuiz = todayData.find((item) => moment(item.quizDate).format('YYYY-MM-DD') === todayStr);
				setSelectedDate(todayStr);
				setSelectedQuizData(todayQuiz ?? null);
				updateMarkedQuizDatesOnSelect(todayStr, null, setMarkedQuizDates, todayData);
			}
		} catch (e) {
			console.error('❌ 데이터 로딩 실패:', e);
		}
	};

	const getCategoryMeta = (category: string) => {
		const item = FIELD_DROPDOWN_ITEMS.find((it) => it.label === category);
		if (!item) {
			return {
				color: '#ccc',
				icon: { type: 'FontAwesome6', name: 'question' },
				badgeId: 'category_etc',
			};
		}
		return {
			color: item.iconColor,
			icon: { type: item.iconType, name: item.iconName },
			badgeId: item.badgeId,
		};
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

	const totalSolved = correctCount + wrongCount;
	const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

	const levelDataForScroll = useMemo(() => [...LEVEL_DATA], []);
	const currentLevelIndex = levelDataForScroll.findIndex((item) => totalScore >= item.score && totalScore < (item.next ?? Infinity));
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

	const toggleAllSections = () => {
		const nextState = !isAllExpanded;
		setIsAllExpanded(nextState);
		setShowStudySection(nextState);
		setShowQuizSection(nextState);
		setShowTimeSection(nextState);
		setShowBadgeSection(nextState);
		setShowTodayQuizSection(nextState); // ✅ 추가됨
		setShowTowerSection(nextState); // ✅ 추가
	};

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
						dotColor: '#4CAF50',
						customStyles: {
							container: {
								backgroundColor: '#e8f5e9',
							},
							text: {
								color: '#2e7d32',
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
						backgroundColor: '#dfe6e9',
					},
					text: {
						color: '#2c3e50',
						fontWeight: 'bold',
					},
				},
			};

			return updated;
		});
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
		};
	};
	const { label, icon, mascot } = getTitleByScore(totalScore);

	return (
		<>
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<ScrollView
					ref={scrollRef}
					style={styles.container}
					contentContainerStyle={{ paddingBottom: scaleHeight(40), flexGrow: 1 }}
					onScroll={scrollHandler.onScroll}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
					<View style={styles.sectionBox}>
						<View style={{ alignItems: 'center', marginVertical: scaleHeight(8) }}>
							<FastImage source={mascot} style={{ width: scaleWidth(120), height: scaleHeight(120) }} resizeMode={FastImage.resizeMode.contain} />

							{petLevel >= 0 && (
								<View
									style={{
										position: 'absolute',
										right: scaleWidth(35), // 마스코트 오른쪽 바깥쪽
										width: scaleWidth(60),
										height: scaleWidth(60),
										borderRadius: scaleWidth(30),
										borderWidth: 2,
										borderColor: '#27ae60',
										overflow: 'hidden',
									}}>
									<FastImage source={PET_REWARDS[petLevel].image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
								</View>
							)}
						</View>
						<View style={{ alignItems: 'center' }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(8) }}>
								<TouchableOpacity
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
									}}
									activeOpacity={0.7}
									onPress={() => setShowLevelModal(true)}>
									<IconComponent
										type="fontAwesome6"
										name={icon}
										size={18}
										color={label === '속담 전설' ? '#FFD700' : '#27ae60'} // ✅ 조건 분기
									/>
									<Text
										style={{
											fontSize: scaledSize(16),
											color: label === '속담 전설' ? '#FFD700' : '#27ae60', // ✅ 텍스트 색도 노란색으로
											fontWeight: '700',
											marginLeft: scaleWidth(6),
										}}>
										{label}
									</Text>
									<IconComponent type="materialIcons" name="info-outline" size={18} color="#7f8c8d" style={{ marginLeft: scaleWidth(4) }} />
								</TouchableOpacity>
							</View>

							<View style={styles.scoreBadge}>
								<IconComponent name="leaderboard" type="materialIcons" size={14} color="#fff" />
								<Text style={styles.scoreBadgeText}>{totalScore.toLocaleString()}점</Text>
							</View>
						</View>
						<View style={styles.levelDescriptionCard}>
							<IconComponent type="fontAwesome6" name="trophy" size={16} color="#f39c12" style={{ marginRight: scaleWidth(6) }} />
							<Text style={styles.levelDescriptionText}>
								모든 퀴즈를 풀면 <Text style={styles.levelHighlight}>'속담 마스터'</Text> 등급을 획득할 수 있습니다.
							</Text>
						</View>

						<View style={styles.levelDescriptionCard}>
							<IconComponent
								type="fontAwesome6"
								name="arrow-rotate-right" // ✅ 'redo' 대신 사용
								size={16}
								color="#2980b9"
								style={{ marginRight: scaleWidth(6) }}
							/>
							<Text style={styles.levelDescriptionText}>
								틀린 문제는 <Text style={styles.levelHighlight}>오답 복습</Text>에서 다시 도전할 수 있어요 🚀
							</Text>
						</View>
					</View>
					<TouchableOpacity
						onPress={toggleAllSections}
						style={{
							alignSelf: 'center',
							backgroundColor: '#ecf0f1',
							paddingVertical: scaleHeight(6),
							paddingHorizontal: scaleWidth(14),
							borderRadius: scaleWidth(20),
						}}>
						<Text style={{ fontSize: scaledSize(13), color: '#2c3e50' }}>
							{isAllExpanded ? '나의 모든 활동 결과 접기 ▲' : '나의 모든 활동 결과 보기 ▼'}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.sectionHeader} onPress={() => setShowStudySection(!showStudySection)}>
						<View style={styles.iconCircle1}>
							<IconComponent type="materialIcons" name="school" size={scaledSize(16)} color="#ffffff" />
						</View>
						<Text style={styles.sectionTitle}>나의 학습 활동</Text>
						<IconComponent
							type="materialIcons"
							name={showStudySection ? 'expand-less' : 'expand-more'}
							size={20}
							color="#27ae60"
							style={{ marginLeft: 'auto' }}
						/>
					</TouchableOpacity>
					{showStudySection && (
						<View style={styles.activityCardBox}>
							<View style={styles.summaryStatGrid}>
								<View style={styles.summaryStatCard}>
									<Text style={styles.statIcon}>🎯</Text>
									<Text style={styles.statValue}>
										{studyCountries.length} / {totalCountryCount}
									</Text>
									<Text style={styles.statLabel}>학습 완료 속담 ({Math.round((studyCountries.length / totalCountryCount) * 100)}%)</Text>
								</View>
								<View style={styles.summaryStatCard}>
									<Text style={styles.statIcon}>📆</Text>
									<Text style={styles.statValue}> {lastStudyAt ? moment(lastStudyAt).format('YY.MM.DD') : '없음'} </Text>
									<Text style={styles.statLabel}> 마지막 학습일 </Text>
								</View>
							</View>
						</View>
					)}

					{/* 나의 퀴즈 활동 요약 */}
					<TouchableOpacity style={styles.sectionHeader} onPress={() => setShowQuizSection(!showQuizSection)}>
						<View style={styles.iconCircle2}>
							<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(16)} color="#ffffff" />
						</View>
						<Text style={styles.sectionTitle}>나의 퀴즈 활동</Text>
						<IconComponent
							type="materialIcons"
							name={showQuizSection ? 'expand-less' : 'expand-more'}
							size={20}
							color="#27ae60"
							style={{ marginLeft: 'auto' }}
						/>
					</TouchableOpacity>
					{showQuizSection && (
						<View style={styles.activityCardBox}>
							<View style={styles.summaryStatCard}>
								<Text style={styles.statIcon}>🧮</Text>
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
									<Text style={styles.statIcon}>🔥</Text>
									<Text style={styles.statValue}> {bestCombo} Combo </Text>
									<Text style={styles.statLabel}> 최고 콤보 </Text>
								</View>
								<View style={styles.summaryStatCard}>
									<Text style={styles.statIcon}>✅</Text>
									<Text style={styles.statValue}> {accuracy}% </Text>
									<Text style={styles.statLabel}> 정답률 </Text>
								</View>
								<View style={styles.summaryStatCard}>
									<Text style={styles.statIcon}>📅</Text>
									<Text style={styles.statValue}> {lastAnsweredAt ? moment(lastAnsweredAt).format('YY.MM.DD') : '없음'} </Text>
									<Text style={styles.statLabel}> 마지막 퀴즈일 </Text>
								</View>
							</View>

							{/* ✅ 정복한 레벨 세로 한 줄씩 + 개수 진행률 */}
							<View style={styles.subSectionBox2}>
								<Text style={styles.sectionSubtitle}>
									🏅 정복한 레벨 ({levelMaster.length} / {DIFFICULTIES.length})
								</Text>
								<Text style={styles.levelHelperText}>- 각 레벨 퀴즈를 모두 풀면 정복으로 표시됩니다.</Text>

								{levelStats.map((item) => {
									const progressPercent = item.totalCount > 0 ? Math.round((item.solvedCount / item.totalCount) * 100) : 0;

									const isConquered = progressPercent === 100;
									const styleMeta = STYLE_MAP[item.subtitle]; // ✅ 레벨별 색상 가져오기

									return (
										<View
											key={item.key}
											style={[
												styles.levelRowCard,
												isConquered && {
													backgroundColor: styleMeta.color,
													borderColor: styleMeta.color,
													shadowColor: '#000',
													shadowOpacity: 0.15,
													shadowRadius: 4,
													shadowOffset: { width: 0, height: 2 },
												},
											]}>
											<IconComponent
												name={item.icon}
												type="fontAwesome6"
												size={20}
												color={isConquered ? '#fff' : styleMeta.color} // ✅ 항상 styleMeta.color 사용
												style={{ marginRight: scaleWidth(8) }}
											/>
											<Text
												style={[
													styles.levelRowTitle,
													{ color: isConquered ? '#fff' : styleMeta.color }, // ✅ 항상 레벨별 색상 사용
													isConquered && {
														fontWeight: 'bold',
														textShadowColor: 'rgba(0, 0, 0, 0.15)',
														textShadowOffset: { width: 1, height: 1 },
														textShadowRadius: 2,
													},
												]}>
												{item.subtitle}
											</Text>

											{/* 진행률 바 */}
											<View style={styles.progressBarBackgroundRow}>
												<View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: isConquered ? '#fff' : '#27ae60' }]} />
											</View>

											{/* 개수 */}
											<Text style={[styles.levelRowCount, isConquered && { color: '#fff' }]}>
												{item.solvedCount}/{item.totalCount}
											</Text>

											{isConquered && (
												<View
													style={{
														marginLeft: scaleWidth(6),
														backgroundColor: '#fff',
														paddingHorizontal: scaleWidth(6),
														paddingVertical: scaleHeight(2),
														borderRadius: scaleWidth(10),
													}}>
													<Text
														style={{
															fontSize: scaledSize(12),
															color: styleMeta.color, // ✅ 레벨별 색상 적용
															fontWeight: 'bold',
														}}>
														정복
													</Text>
												</View>
											)}
										</View>
									);
								})}
							</View>
							{/* ✅ 정복한 카테고리 출력 */}
							<View style={styles.subSectionBox1}>
								<Text style={styles.sectionSubtitle}>
									🧠 정복한 카테고리 ({categoryMaster.length} / {allCategories.length})
								</Text>
								<Text style={styles.regionHelperText}>- 특정 분야의 속담을 모두 풀었을때 획득할 수 있습니다.</Text>

								{categoryStats.map((item) => {
									const meta = getCategoryMeta(item.category);
									const progressPercent = item.totalCount > 0 ? Math.round((item.solvedCount / item.totalCount) * 100) : 0;

									// ✅ 정복 조건
									const isEarned = categoryMaster.includes(item.category) || progressPercent === 100;

									return (
										<View
											key={item.category}
											style={[
												styles.categoryRowCard,
												isEarned && {
													backgroundColor: meta.color,
													borderColor: meta.color,
													shadowColor: '#000',
													shadowOpacity: 0.15,
													shadowRadius: 4,
													shadowOffset: { width: 0, height: 2 },
												},
											]}>
											<IconComponent
												type={meta.icon.type}
												name={meta.icon.name}
												size={20}
												color={isEarned ? '#fff' : meta.color} // ✅ 비활성화도 meta.color 적용
												style={{ marginRight: scaleWidth(8) }}
											/>
											<Text
												style={[
													styles.categoryRowText,
													{ color: isEarned ? '#fff' : meta.color }, // ✅ 항상 meta.color 사용
													isEarned && {
														fontWeight: 'bold',
														textShadowColor: 'rgba(0, 0, 0, 0.15)',
														textShadowOffset: { width: 1, height: 1 },
														textShadowRadius: 2,
													},
												]}>
												{item.category}
											</Text>

											{/* 프로그래스바 */}
											<View style={styles.progressBarBackgroundRow}>
												<View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: isEarned ? '#fff' : '#27ae60' }]} />
											</View>

											{/* 개수 */}
											<Text style={[styles.levelRowCount, isEarned && { color: '#fff' }]}>
												{item.solvedCount}/{item.totalCount}
											</Text>

											{isEarned && (
												<View
													style={{
														marginLeft: scaleWidth(6),
														backgroundColor: '#fff',
														paddingHorizontal: scaleWidth(6),
														paddingVertical: scaleHeight(2),
														borderRadius: scaleWidth(10),
													}}>
													<Text
														style={{
															fontSize: scaledSize(12),
															color: meta.color, // ✅ 카테고리 색상 적용
															fontWeight: 'bold',
														}}>
														정복
													</Text>
												</View>
											)}
										</View>
									);
								})}
							</View>
						</View>
					)}
					<TouchableOpacity style={styles.sectionHeader} onPress={() => setShowTodayQuizSection(!showTodayQuizSection)}>
						<View style={styles.iconCircle4}>
							<IconComponent type="materialIcons" name="calendar-today" size={scaledSize(16)} color="#ffffff" />
						</View>
						<Text style={styles.sectionTitle}>나의 오늘의 퀴즈</Text>
						<IconComponent
							type="materialIcons"
							name={showTodayQuizSection ? 'expand-less' : 'expand-more'}
							size={20}
							color="#27ae60"
							style={{ marginLeft: 'auto' }}
						/>
					</TouchableOpacity>

					{showTodayQuizSection && (
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
									todayTextColor: '#27ae60',
									textDayFontSize: 14,
									textMonthFontSize: 16,
									textDayHeaderFontSize: 13,
								}}
							/>
							<Text style={{ fontSize: scaledSize(12), color: '#7f8c8d', marginTop: scaleHeight(8) }}>🟢 표시는 오늘의 퀴즈를 모두 푼 날입니다.</Text>

							{selectedDate === null && <Text style={styles.emptyText}>📅 날짜를 선택해 주세요.</Text>}

							{selectedDate && selectedQuizData === null && (
								<View
									style={{
										borderWidth: 1,
										borderColor: '#ddd',
										backgroundColor: '#fdfdfd',
										borderRadius: scaleWidth(10),
										padding: scaleWidth(14),
										marginTop: scaleHeight(10),
										alignSelf: 'stretch',
									}}>
									<Text style={{ fontSize: scaledSize(13), color: '#95a5a6', textAlign: 'left' }}>선택한 날짜에는 오늘의 퀴즈를 풀지 않았어요</Text>
								</View>
							)}

							{selectedDate && selectedQuizData && (
								<View style={[styles.sectionBox, { marginTop: scaleHeight(10) }]}>
									<Text style={styles.sectionSubtitle}>{selectedDate} 퀴즈 결과</Text>
									{selectedQuizData?.todayQuizIdArr.map((quizId, idx) => {
										const userAnswer = selectedQuizData.selectedAnswers?.[quizId];
										const isCorrect = selectedQuizData.answerResults?.[quizId];
										const quizItem = ProverbServices.selectProverbById(quizId); // 예시 함수

										return (
											<View
												key={idx}
												style={{
													width: '100%', // 👈 추가
													backgroundColor: '#ffffff',
													borderRadius: scaleWidth(12),
													padding: scaleWidth(14),
													borderWidth: 1,
													borderColor: '#dfe6e9',
													marginBottom: scaleHeight(12),
													shadowColor: '#000',
													shadowOffset: { width: 0, height: 1 },
													shadowOpacity: 0.05,
													shadowRadius: 2,
													alignSelf: 'stretch', // ✅ 전체 너비 확보
												}}>
												<Text
													style={{
														fontSize: scaledSize(14),
														fontWeight: 'bold',
														marginBottom: scaleHeight(8),
														color: '#2c3e50',
													}}>
													{idx + 1}. {quizItem?.proverb || '문제 정보를 찾을 수 없습니다'}
												</Text>

												{/* ✅ 정답 여부 문구 추가 */}
												{isCorrect !== undefined && (
													<Text
														style={{
															fontSize: scaledSize(13),
															fontWeight: 'bold',
															marginBottom: scaleHeight(6),
															color: isCorrect ? '#27ae60' : '#e74c3c',
														}}>
														{isCorrect ? '이 문제는 맞췄어요 👏' : '이 문제는 틀렸어요 😢'}
													</Text>
												)}
											</View>
										);
									})}
								</View>
							)}
						</View>
					)}
					{/* 기존 결과 화면 */}
					<TouchableOpacity style={styles.sectionHeader} onPress={() => setShowTimeSection(!showTimeSection)}>
						<View style={styles.iconCircle3}>
							<IconComponent type="materialIcons" name="timer" size={scaledSize(16)} color="#ffffff" />
						</View>
						<Text style={styles.sectionTitle}>나의 타임 챌린지 결과</Text>
						<IconComponent
							type="materialIcons"
							name={showTimeSection ? 'expand-less' : 'expand-more'}
							size={20}
							color="#27ae60"
							style={{ marginLeft: 'auto' }}
						/>
					</TouchableOpacity>

					{showTimeSection && (
						<View style={styles.sectionBox}>
							<Text style={styles.topRankingTitle}>📋 나의 랭킹 TOP 3</Text>

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
														<IconComponent name="trophy" type="FontAwesome" size={24} color="#f1c40f" style={{ marginRight: scaleWidth(8) }} />
														<Text style={styles.firstRankLabel}>1등</Text>
														<Text style={styles.firstRankScore}>
															{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
														</Text>
													</>
												)}
												{index === 1 && (
													<>
														<IconComponent name="trophy" type="FontAwesome" size={20} color="#bdc3c7" style={{ marginRight: scaleWidth(13) }} />
														<Text style={styles.secondRankLabel}>2등</Text>
														<Text style={styles.secondRankScore}>
															{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
														</Text>
													</>
												)}
												{index === 2 && (
													<>
														<IconComponent name="trophy" type="FontAwesome" size={18} color="#cd7f32" style={{ marginRight: scaleWidth(16) }} />
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

					{/* 1. 나의 뱃지 목록 (획득한 뱃지만 보여줌) */}
					<TouchableOpacity style={styles.sectionHeader} onPress={() => setShowBadgeSection(!showBadgeSection)}>
						<View style={styles.iconCircle4}>
							<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(16)} color="#ffffff" />
						</View>
						<Text style={styles.sectionTitle}>나의 획득한 뱃지</Text>
						<IconComponent
							type="materialIcons"
							name={showBadgeSection ? 'expand-less' : 'expand-more'}
							size={20}
							color="#27ae60"
							style={{ marginLeft: 'auto' }}
						/>
					</TouchableOpacity>
					{showBadgeSection && (
						<>
							<View style={styles.sectionBox}>
								{earnedBadgeIds.length === 0 ? (
									<Text style={styles.emptyText}> 획득한 뱃지가 없습니다.</Text>
								) : (
									earnedBadgeIds.map((badgeId) => {
										const badge = CONST_BADGES.find((b) => b.id === badgeId);
										if (!badge) {
											return null;
										}
										return (
											<View key={badge.id} style={[styles.badgeCard, styles.badgeCardActive]}>
												<View style={[styles.iconBox, styles.iconBoxActive]}>
													<IconComponent name={badge.icon} type={badge.iconType} size={20} color="#27ae60" />
												</View>
												<View style={styles.textBox}>
													<Text style={[styles.badgeTitle, styles.badgeTitleActive]}> {badge.name} </Text>
													<Text style={[styles.badgeDesc, styles.badgeDescActive]}> {badge.description} </Text>
												</View>
											</View>
										);
									})
								)}
							</View>

							<TouchableOpacity onPress={toggleBadgeList} style={{ marginBottom: scaleHeight(12) }}>
								<Text style={{ color: '#27ae60', textAlign: 'center', fontSize: scaledSize(13) }}>
									{showBadgeList ? '뱃지 목록 닫기 ▲' : '획득 가능한 뱃지 보기 ▼'}
								</Text>
							</TouchableOpacity>
						</>
					)}

					{showBadgeList && (
						<View style={styles.sectionBox}>
							{CONST_BADGES.filter((badge) => !earnedBadgeIds.includes(badge.id)).length === 0 ? (
								<Text style={styles.emptyText}> 모든 뱃지를 획득했어요! 🎉</Text>
							) : (
								CONST_BADGES.filter((badge) => !earnedBadgeIds.includes(badge.id)).map((badge) => (
									<View key={badge.id} style={styles.badgeCard}>
										<View style={styles.iconBox}>
											<IconComponent name={badge.icon} type={badge.iconType} size={20} color="#2c3e50" />
										</View>
										<View style={styles.textBox}>
											<Text style={styles.badgeTitle}> {badge.name} </Text>
											<Text style={styles.badgeDesc}> {badge.description} </Text>
										</View>
									</View>
								))
							)}
						</View>
					)}
					{/* {showTowerSection && (
						<View style={styles.sectionBox}>
							{unlockedRewards.length === 0 ? (
								<Text style={styles.noRecordText}>아직 클리어한 타워가 없습니다. 도전해보세요!</Text>
							) : (
								<>
									<Text style={styles.topRankingTitle}>
										🗼 클리어한 타워 ({unlockedRewards.length} / {TOWER_LEVELS.length})
									</Text>
									{TOWER_LEVELS.filter(t => unlockedRewards.includes(t.level)).map(tower => (
										<View
											key={tower.level}
											style={{
												flexDirection: 'row',
												borderRadius: scaleWidth(12),
												overflow: 'hidden',
												marginBottom: scaleHeight(12),
												borderWidth: 1,
												borderColor: tower.color,
												backgroundColor: '#fff',
											}}>
											<View style={{ width: scaleWidth(80), backgroundColor: tower.backgroundColor, alignItems: 'center', justifyContent: 'center', padding: scaleWidth(8) }}>
												<FastImage
													source={tower.bossImage}
													style={{ width: scaleWidth(56), height: scaleWidth(56), borderRadius: scaleWidth(8) }}
													resizeMode="contain"
												/>
												<View style={{ marginTop: scaleHeight(4), backgroundColor: tower.color, borderRadius: scaleWidth(8), paddingHorizontal: scaleWidth(6), paddingVertical: scaleHeight(2) }}>
													<Text style={{ color: '#fff', fontSize: scaledSize(10), fontWeight: 'bold' }}>LV.{tower.level}</Text>
												</View>
											</View>

											<View style={{ flex: 1, padding: scaleWidth(12), justifyContent: 'center' }}>
												<Text style={{ fontSize: scaledSize(10), color: '#999', marginBottom: scaleHeight(2) }}>{tower.bossTitle}</Text>
												<Text style={{ fontSize: scaledSize(14), fontWeight: 'bold', color: '#2c3e50', marginBottom: scaleHeight(6) }}>{tower.bossName}</Text>

												<View style={{ height: 1, backgroundColor: '#eee', marginBottom: scaleHeight(6) }} />

												<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) }}>
													<FastImage
														source={tower.reward.image}
														style={{ width: scaleWidth(36), height: scaleWidth(36), borderRadius: scaleWidth(6), borderWidth: 1, borderColor: '#ddd' }}
														resizeMode="cover"
													/>
													<View>
														<Text style={{ fontSize: scaledSize(10), color: '#888' }}>
															{tower.reward.type === 'costume' ? '👕 코스튬' : '🌟 캐릭터'}
														</Text>
														<Text style={{ fontSize: scaledSize(12), fontWeight: 'bold', color: '#2c3e50' }}>{tower.reward.name}</Text>
													</View>

													<View style={{ marginLeft: 'auto', backgroundColor: tower.color, borderRadius: scaleWidth(10), paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(3) }}>
														<Text style={{ color: '#fff', fontSize: scaledSize(10), fontWeight: 'bold' }}>클리어 ✓</Text>
													</View>
												</View>
											</View>
										</View>
									))}
								</>
							)}
						</View>
					)} */}
				</ScrollView>

				<LevelModal visible={showLevelModal} totalScore={totalScore} onClose={() => setShowLevelModal(false)} />
			</SafeAreaView>

			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop}>
					<IconComponent type="fontawesome6" name="arrow-up" size={20} color="#ffffff" />
				</TouchableOpacity>
			)}
		</>
	);
};

export default CapitalResultScreen;

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#fff' },
	container: {
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
	},
	pageTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		marginBottom: scaleHeight(20),
		color: '#2c3e50',
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	badgeCardActive: {
		borderColor: '#27ae60',
		backgroundColor: '#f0fbf4',
	},
	iconBox: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(12),
	},
	iconBoxActive: {
		backgroundColor: '#d0f0dc',
	},
	badgeTitle: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
	},
	badgeTitleActive: {
		color: '#27ae60',
	},
	badgeDesc: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginTop: scaleHeight(2),
		lineHeight: scaleHeight(18),
	},
	badgeDescActive: {
		color: '#2d8659',
	},
	sectionBox: {
		backgroundColor: '#f9f9f9',
		padding: scaleWidth(16),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	subSectionBox1: {
		backgroundColor: '#ffffff',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	subSectionBox2: {
		backgroundColor: '#ffffff',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	sectionTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
	},
	statItem: {
		fontSize: scaledSize(14),
		color: '#34495e',
		marginBottom: scaleHeight(6),
	},
	subTitle: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: scaleHeight(6),
	},
	tagItem: {
		fontSize: scaledSize(14),
		color: '#27ae60',
		marginBottom: scaleHeight(4),
	},
	emptyText: {
		fontSize: scaledSize(13),
		color: '#95a5a6',
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
		color: '#27ae60',
		fontWeight: '700',
	},
	quizSummaryBox: {
		backgroundColor: '#f4f6f7',
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
		borderColor: '#27ae60',
		backgroundColor: '#eafaf1',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(8),
		shadowColor: '#27ae60',
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
		color: '#2c3e50',
	},
	levelRowItem: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		paddingVertical: scaleHeight(8),
		borderBottomWidth: 1,
		borderColor: '#eee',
	},
	levelRowItemActive: {
		backgroundColor: '#eafaf1',
		borderColor: '#27ae60',
	},
	levelCardBox: {
		backgroundColor: '#fdfdfd',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(16),
		alignItems: 'center',
		marginBottom: scaleHeight(14),
		width: '100%',
		borderWidth: 1,
		borderColor: '#ececec',
	},
	levelCardBoxActive: {
		backgroundColor: '#eafaf1',
		borderColor: '#2ecc71',
		borderWidth: 2,
	},
	levelBadge: {
		backgroundColor: '#27ae60',
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
		color: '#2c3e50',
		marginBottom: scaleHeight(2),
	},
	levelScore: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},
	levelEncourage: {
		fontSize: scaledSize(12),
		color: '#27ae60',
		marginTop: scaleHeight(6),
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	levelIconWrapSmall: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(14),
		backgroundColor: '#d0f0dc',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(10),
	},
	levelModalText: {
		flex: 1,
		fontSize: scaledSize(14),
		color: '#2c3e50',
	},
	levelModalScore: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},
	levelNowText: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
		color: '#27ae60',
		fontWeight: 'bold',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalConfirmButton: {
		marginTop: scaleHeight(16),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		backgroundColor: '#27ae60',
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
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(18),
		marginBottom: scaleHeight(4),
	},
	levelScoreText: {
		fontSize: scaledSize(15),
		color: '#7f8c8d',
		textAlign: 'center',
		marginTop: scaleHeight(4),
	},
	levelScoreHighlight: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#27ae60',
		marginTop: scaleHeight(4),
	},
	activityCardBox: {
		backgroundColor: '#f4f6f7',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
	activityRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	activityLabel: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
	},
	activityValue: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#34495e',
	},
	summaryCard: {
		backgroundColor: '#fff8e1',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#f1c40f',
	},
	summaryTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#f39c12',
		marginBottom: scaleHeight(8),
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	progressText: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
		marginRight: scaleWidth(12),
	},
	progressBarBackground: {
		width: '80%',
		height: scaleHeight(6),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleHeight(3),
		marginTop: scaleHeight(6),
		alignSelf: 'center',
	},
	progressBarFill: {
		height: scaleHeight(6),
		backgroundColor: '#27ae60',
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
		borderColor: '#ccc',
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
		borderColor: '#ccc',
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
		color: '#7f8c8d',
	},
	levelText: {
		fontSize: scaledSize(15),
		textAlign: 'center',
		color: '#7f8c8d',
	},
	cardActive: {
		backgroundColor: '#f0fbf4',
	},
	summaryStatGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	summaryStatCard: {
		flex: 1,
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(16),
		marginHorizontal: scaleWidth(4),
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ecf0f1',
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
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(4),
	},
	statLabel: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},
	regionSubText: {
		fontSize: scaledSize(10),
		color: '#b0b0b0',
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	levelSubText: {
		fontSize: scaledSize(12),
		color: '#b0b0b0',
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	sectionSubtitle: {
		fontSize: scaledSize(15),
		color: '#2c3e50',
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
		color: '#7f8c8d',
		marginBottom: scaleHeight(12),
	},
	levelHelperText: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
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
		backgroundColor: '#eafaf1',
		borderColor: '#27ae60',
	},
	regionTextActive: {
		color: '#27ae60',
		fontWeight: 'bold',
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
	scoreBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#27ae60',
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
	levelDetailDescription: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
		textAlign: 'center',
		marginTop: scaleHeight(6),
		lineHeight: scaleHeight(18),
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(8),
	},
	iconCircle1: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		marginRight: scaleWidth(6),
		borderRadius: scaleWidth(20),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#2ecc71', // 🎨 밝은 초록 배경 추가
	},
	iconCircle2: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#3498db', // 🎨 밝은 파랑 배경 추가
	},
	iconCircle3: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#e67e22', // 🎨 밝은 파랑 배경 추가
	},

	iconCircle4: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#d0e8ff', // 🎨 밝은 파랑 배경 추가
	},
	iconCircle5: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(6),
		backgroundColor: '#9b59b6', // 🟠 추천 색상: 진한 주황색 (희망, 성취 느낌)
	},
	calendarStyle: {
		alignSelf: 'stretch', // 또는 width: '100%'
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
		marginBottom: scaleHeight(10),
	},
	topRankingTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},

	noRecordText: {
		fontSize: scaledSize(13),
		color: '#95a5a6',
		textAlign: 'center',
		marginTop: scaleHeight(12),
	},

	recordCard: {
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(14),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#ddd',
		marginBottom: scaleHeight(10),
	},

	rankRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	firstRankLabel: {
		fontSize: scaledSize(15),
		color: '#f1c40f',
		fontWeight: 'bold',
		marginRight: scaleWidth(8),
	},

	secondRankLabel: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		fontWeight: 'bold',
		marginRight: scaleWidth(8),
	},

	thirdRankLabel: {
		fontSize: scaledSize(14),
		color: '#cd7f32',
		fontWeight: 'bold',
		marginRight: scaleWidth(8),
	},

	firstRankScore: {
		fontSize: scaledSize(15),
		color: '#2c3e50',
	},

	secondRankScore: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
	},

	thirdRankScore: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
	},

	rankDate: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
	},
	levelRowCard: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
		borderWidth: 1, // ✅ 기본 border
		borderColor: '#ccc',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(10),
		backgroundColor: '#fff',
	},

	levelRowTitle: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#2c3e50',
		width: scaleWidth(60),
	},

	progressBarBackgroundRow: {
		flex: 1,
		height: scaleHeight(6),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleHeight(3),
		marginHorizontal: scaleWidth(10),
	},

	levelRowCount: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		fontWeight: '600',
		minWidth: scaleWidth(50),
		textAlign: 'right',
	},
	levelRowCardConquered: {
		borderWidth: 2,
		borderColor: '#27ae60',
		backgroundColor: '#f0fbf4',
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 3,
		shadowOffset: { width: 0, height: 2 },
	},
	categoryRowCardConquered: {
		backgroundColor: '#27ae60', // 전체 초록 강조
		borderColor: '#27ae60',
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
	},
	categoryRowTextConquered: {
		color: '#fff',
		fontWeight: 'bold',
		textShadowColor: 'rgba(0, 0, 0, 0.15)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	categoryRowCard: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: scaleWidth(12),
		backgroundColor: '#fff',
		marginBottom: scaleHeight(10),
		width: '100%',
	},
	categoryRowText: {
		fontSize: scaledSize(15),
		color: '#7f8c8d',
	},
	levelDescriptionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f9f9f9',
		borderRadius: scaleWidth(10),
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(8),
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
	levelDescriptionText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#2c3e50',
		lineHeight: scaleHeight(18),
	},
	levelHighlight: {
		fontWeight: 'bold',
		color: '#27ae60',
	},
});
