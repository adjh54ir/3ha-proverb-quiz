/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Modal,
	Keyboard,
	TouchableWithoutFeedback,
	Animated,
	Easing,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';
import { Paths } from '@/navigation/conf/Paths';
import IconComponent from './common/atomic/IconComponent';
import { CONST_BADGES } from '@/const/ConstBadges';

import ConfettiCannon from 'react-native-confetti-cannon';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import DateUtils from '@/utils/DateUtils';
import notifee, { EventType } from '@notifee/react-native';




const greetingMessages = [
	'🎯 반가워! 오늘도 똑똑해질 준비됐나요?',
	'🧠 오늘의 속담으로 지혜를 키워봐요!',
	'📚 기억력 자신 있죠? 속담 퀴즈에 도전!',
	'📝 속담 하나, 교훈 하나! 함께 배워봐요!',
	'✨ 속담으로 생각을 키워보는 시간이에요!',
	'💡 옛말 속 지혜, 오늘도 한마디 배워볼까요?',
	'👀 퀴즈로 속담을 익히면 재미가 두 배!',
	'🔍 뜻을 알면 더 재밌는 속담! 지금 풀어보세요!',
	'🧩 맞히는 재미, 배우는 즐거움! 속담 퀴즈 GO!',
	'🐣 하루 한 속담! 작지만 큰 지혜가 자라나요!',
];

const LEVEL_DATA = [
	{
		score: 0,
		next: 600,
		label: '속담 초보자',
		icon: 'seedling',
		encouragement: '🌱 첫걸음을 뗐어요! 이제 속담의 세계로!',
		description: '속담 학습의 출발선에 선 단계로,\n기초적인 표현부터 차근히 익히는 시기예요.',
		mascot: require('@/assets/images/level1_mascote.png'),
	},
	{
		score: 600,
		next: 1200,
		label: '속담 입문자',
		icon: 'leaf',
		encouragement: '🍃 차근차근 익혀가는 중이에요!\n조금씩 자신감이 붙고 있어요!',
		description: '기초 속담에 익숙해지고,\n다양한 표현을 접하며 감을 잡아가는 단계예요.',
		mascot: require('@/assets/images/level2_mascote.png'),
	},
	{
		score: 1200,
		next: 1800,
		label: '속담 숙련자',
		icon: 'tree',
		encouragement: '🌳 멋져요! 속담 실력이 부쩍 늘었어요!',
		description: '속담의 뜻과 쓰임새를 잘 이해하고 있으며,\n실전 문제에도 능숙하게 대응할 수 있는 단계예요.',
		mascot: require('@/assets/images/level3_mascote.png'),
	},
	{
		score: 1800,
		next: 2461,
		label: '속담 마스터',
		icon: 'trophy',
		encouragement: '🏆 속담 마스터에 도달했어요! 정말 대단해요!',
		description: '속담에 대한 깊은 이해와 활용 능력을 갖춘 최상위 단계로,\n누구에게나 모범이 될 수 있는 수준이에요.',
		mascot: require('@/assets/images/level4_mascote.png'),
	},
];

LocaleConfig.locales.kr = {
	monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '11월'],
	monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '11월'],
	dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
	dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
};

LocaleConfig.defaultLocale = 'kr';

const Home = () => {
	const navigation = useNavigation();
	const scrollRef = useRef<NodeJS.Timeout | null>(null);
	const levelScrollRef = useRef<ScrollView>(null);
	const scrollViewRef = useRef<ScrollView>(null);

	const [greeting, setGreeting] = useState('🖐️ 안녕! 오늘도 속담 퀴즈 풀 준비 됐니?');
	const [totalScore, setTotalScore] = useState(0);
	const [showConfetti, setShowConfetti] = useState(false);
	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
	const [showBadgeModal, setShowBadgeModal] = useState(false);
	const [selectedBadge, setSelectedBadge] = useState<(typeof CONST_BADGES)[number] | null>(null);

	const earnedBadges = CONST_BADGES.filter((b) => earnedBadgeIds.includes(b.id));
	const visibleBadges = earnedBadges; // 제한 없이 모두 보여줌
	const [showLevelModal, setShowLevelModal] = useState(false);

	// 오늘의 퀴즈
	const USER_QUIZ_HISTORY_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;
	const USER_STUDY_HISTORY_KEY = MainStorageKeyType.USER_STUDY_HISTORY;
	const TODAY_QUIZ_LIST_KEY = MainStorageKeyType.TODAY_QUIZ_LIST;

	const hasAutoCheckedIn = useRef(false); // ✅ 중복 방지용
	const [stampAnim] = useState(new Animated.Value(0));
	const [isCheckedIn, setIsCheckedIn] = useState(false);
	const [petLevel, setPetLevel] = useState(-1);
	const [showStamp, setShowStamp] = useState(false);
	const [checkedInDates, setCheckedInDates] = useState<{ [date: string]: any }>({});
	const [showCheckInModal, setShowCheckInModal] = useState(false); // 초기값 false
	const PET_REWARDS = [
		{ day: 7, image: require('@/assets/images/pet_level1_org.png') },
		{ day: 14, image: require('@/assets/images/pet_level2_org.png') },
		{ day: 21, image: require('@/assets/images/pet_level3_org.png') },
	];

	const [showMascotHint, setShowMascotHint] = useState(true);

	const { getLocalDateString, getLocalParamDateToString } = DateUtils

	useFocusEffect(
		useCallback(() => {
			setShowConfetti(true);
			scrollRef.current = setTimeout(() => setShowConfetti(false), 3000);
			hasAutoCheckedIn.current = false;

			(async () => {
				await ensureTodayQuizExists(); // ✅ 오늘 퀴즈 항목 생성 먼저
				await loadData();
				await checkTodayCheckIn();
				await loadCheckedInDates();
			})();

			scrollViewRef.current?.scrollTo({ y: 0, animated: true });

			return () => {
				if (scrollRef.current) {
					clearTimeout(scrollRef.current);
				}
			};
		}, []),
	);

	useEffect(() => {
		if (showCheckInModal && !isCheckedIn && !hasAutoCheckedIn.current) {
			handleCheckIn();
			hasAutoCheckedIn.current = true; // 중복 호출 방지
		}
	}, [showCheckInModal, isCheckedIn]);


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

	const getLevelData = (score: number) => {
		return LEVEL_DATA.find((l) => score >= l.score && score < l.next) || LEVEL_DATA[0];
	};
	// 이걸 기존 getLevelData 아래에 추가해
	const levelData = useMemo(() => getLevelData(totalScore), [totalScore]);

	const reversedLevelData = useMemo(() => [...LEVEL_DATA].reverse(), []);

	const { label, icon, mascot, description } = levelData;




	useEffect(() => {
		setShowConfetti(true);

		// 일정 시간 후 자동 종료
		const timeout = setTimeout(() => {
			setShowConfetti(false);
		}, 3000);

		// 정리
		return () => clearTimeout(timeout);
	}, []);

	/**
	 * navigation 관리 
	 */
	useEffect(() => {
		// 푸시 클릭했을 때
		const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
			if (type === EventType.PRESS) {
				const screen = detail.notification?.data?.moveToScreen;
				if (screen) {
					// @ts-ignore
					navigation.navigate(screen)
				}
			}
		});

		// 앱 종료 상태에서 푸시 누른 경우
		notifee.getInitialNotification()
			.then(initialNotification => {
				console.log("앱 종료 상태에서 푸시 누른 경우")
				if (initialNotification) {
					const screen = initialNotification.notification?.data?.moveToScreen;
					if (screen) {
						// @ts-ignore
						navigate(screen)
					}
				}
			});
		return () => {
			unsubscribe();
		};
	}, [])

	const getPetLevel = (checkedIn: { [date: string]: any }) => {
		const count = Object.keys(checkedIn).length;
		if (count >= 30) {
			return 2;
		}
		if (count >= 14) {
			return 1;
		}
		if (count >= 7) {
			return 0;
		}
		return -1;
	};
	const stampStyle = {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [
			{ translateX: -scaleWidth(60) },
			{ translateY: -scaleHeight(60) },
			{
				scale: stampAnim.interpolate({
					inputRange: [0, 0.5, 1],
					outputRange: [0, 1.2, 1],
				}),
			},
			{
				rotate: stampAnim.interpolate({
					inputRange: [0, 1],
					outputRange: ['0deg', '-10deg'],
				}),
			},
		],
		opacity: stampAnim.interpolate({
			inputRange: [0, 0.2, 1],
			outputRange: [0, 1, 1],
		}),
	} as const;

	const handleCheckIn = async () => {
		const json = await AsyncStorage.getItem(TODAY_QUIZ_LIST_KEY);
		if (!json) {
			return;
		}

		const arr: MainDataType.TodayQuizList[] = JSON.parse(json);
		const todayStr = getLocalDateString();
		const updated = arr.map((item) => (item.quizDate.slice(0, 10) === todayStr ? { ...item, isCheckedIn: true } : item));
		await AsyncStorage.setItem(TODAY_QUIZ_LIST_KEY, JSON.stringify(updated));
		setIsCheckedIn(true);

		setShowStamp(true); // 애니메이션용 플래그

		stampAnim.setValue(0); // 초기화
		Animated.timing(stampAnim, {
			toValue: 1,
			duration: 700,
			useNativeDriver: true,
			easing: Easing.out(Easing.exp),
		}).start(() => {
			// 애니메이션이 끝나면 잠깐 보여주고 사라지게
			setTimeout(() => setShowStamp(false), 3000);
		});

		// ✅ 바로 달력에 반영
		setCheckedInDates((prev) => ({
			...prev,
			[todayStr]: {
				customStyles: {
					container: {
						backgroundColor: '#27ae60', // ✅ 오늘은 초록색
						borderRadius: scaleWidth(6),
					},
					text: {
						color: '#ffffff',
						fontWeight: 'bold',
					},
				},
			},
		}));

		if (scrollRef.current) {
			clearTimeout(scrollRef.current);
		}
		scrollRef.current = setTimeout(() => setShowConfetti(false), 3000);
	};

	// getTitleByScore 함수 추가
	const getTitleByScore = (score: number) => {
		if (score >= 1800) {
			return {
				label: '속담 마스터',
				icon: 'trophy',
				mascot: require('@/assets/images/level4_mascote.png'),
			};
		}
		if (score >= 1200) {
			return {
				label: '속담 능력자',
				icon: 'tree',
				mascot: require('@/assets/images/level3_mascote.png'),
			};
		}
		if (score >= 600) {
			return {
				label: '속담 입문자',
				icon: 'leaf',
				mascot: require('@/assets/images/level2_mascote.png'),
			};
		}
		return {
			label: '속담 초보자',
			icon: 'seedling',
			mascot: require('@/assets/images/level1_mascote.png'),
		};
	};

	const loadData = async () => {
		const quizData = await AsyncStorage.getItem(USER_QUIZ_HISTORY_KEY);
		const studyData = await AsyncStorage.getItem(USER_STUDY_HISTORY_KEY);
		const todayQuiz = await AsyncStorage.getItem(TODAY_QUIZ_LIST_KEY);

		let realScore = 0;
		if (quizData) {
			realScore = JSON.parse(quizData).totalScore || 0;
			if (todayQuiz) {
				const parsed = JSON.parse(todayQuiz);
				console.log('parsed : ', todayQuiz);
				const todayStr = getLocalDateString();
				const todayItem = parsed.find((q: any) => q.quizDate.slice(0, 10) === todayStr);
				if (todayItem) {
					setIsCheckedIn(todayItem.isCheckedIn || false);
				}
			}
		}

		setTotalScore(realScore);
		const quizBadges = quizData ? JSON.parse(quizData).badges || [] : [];
		const studyBadges = studyData ? JSON.parse(studyData).badges || [] : [];
		setEarnedBadgeIds([...new Set([...quizBadges, ...studyBadges])]);
	};
	// 필요 시 랜덤 퀴즈 생성기 로직
	const generateTodayQuizIds = (count: number): number[] => {
		const allIds = CONST_MAIN_DATA.PROVERB.map((item) => item.id);
		const shuffled = allIds.sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	};
	const ensureTodayQuizExists = async () => {
		const todayStr = getLocalDateString();

		const json = await AsyncStorage.getItem(TODAY_QUIZ_LIST_KEY);

		if (json) {
			const list: MainDataType.TodayQuizList[] = JSON.parse(json);
			const exists = list.some((item) => item.quizDate.slice(0, 10) === todayStr);
			if (exists) {
				console.log('✅ 이미 오늘의 퀴즈 항목이 존재합니다');
				return;
			}

			// 오늘 항목이 없으면 추가
			const newQuizItem: MainDataType.TodayQuizList = {
				quizDate: new Date().toISOString(),
				isCheckedIn: false,
				todayQuizIdArr: generateTodayQuizIds(5),
				correctQuizIdArr: [],
				worngQuizIdArr: [],
				answerResults: {},
				selectedAnswers: {},
			};

			await AsyncStorage.setItem(TODAY_QUIZ_LIST_KEY, JSON.stringify([...list, newQuizItem]));
			console.log('📌 오늘 퀴즈 추가됨');
		} else {
			// 키 자체가 없음: 새로 생성
			const newQuizItem: MainDataType.TodayQuizList = {
				quizDate: new Date().toISOString(),
				isCheckedIn: false,
				todayQuizIdArr: generateTodayQuizIds(5),
				correctQuizIdArr: [],
				worngQuizIdArr: [],
				answerResults: {},
				selectedAnswers: {},
			};

			await AsyncStorage.setItem(TODAY_QUIZ_LIST_KEY, JSON.stringify([newQuizItem]));
			console.log('📌 오늘 퀴즈 리스트 새로 생성됨');
		}
	};

	const checkTodayCheckIn = async () => {
		const json = await AsyncStorage.getItem(TODAY_QUIZ_LIST_KEY);
		if (!json) {
			return;
		}

		const arr: MainDataType.TodayQuizList[] = JSON.parse(json);
		const todayStr = getLocalDateString();
		const todayItem = arr.find((q) => q.quizDate.slice(0, 10) === todayStr);

		if (todayItem) {
			const checked = todayItem.isCheckedIn || false;
			setIsCheckedIn(checked);

			if (!checked) {
				setShowCheckInModal(true); // ✅ 출석 안했을 때만 모달 표시
			}
		}
	};

	const loadCheckedInDates = async () => {
		const json = await AsyncStorage.getItem(TODAY_QUIZ_LIST_KEY);
		if (!json) {
			return;
		}

		const arr: MainDataType.TodayQuizList[] = JSON.parse(json);
		const todayStr = getLocalDateString();

		const marked: { [date: string]: any } = {};
		arr.forEach((item) => {
			if (item.isCheckedIn) {
				const date = item.quizDate.slice(0, 10);
				const isToday = date === todayStr;

				marked[date] = {
					customStyles: {
						container: {
							backgroundColor: isToday ? '#27ae60' : '#2980b9', // ✅ 초록: 오늘, 파랑: 이전 출석
							borderRadius: scaleWidth(6),
						},
						text: {
							color: '#ffffff',
							fontWeight: 'bold',
						},
					},
				};
			}
		});
		setCheckedInDates(marked);
		setPetLevel(getPetLevel(marked)); // ✅ 추가
	};

	const handleMascotPress = () => {
		const random = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
		setGreeting(random);
		setShowConfetti(false);

		// 빵빠레 텍스트는 한 번 클릭하면 사라지게
		if (showMascotHint) setShowMascotHint(false);

		requestAnimationFrame(() => setShowConfetti(true));
		if (scrollRef.current) {
			clearTimeout(scrollRef.current);
		}
		scrollRef.current = setTimeout(() => setShowConfetti(false), 3000);
	};

	const moveToHandler = {
		//@ts-ignore
		quiz: () => navigation.navigate(Paths.PROVERB_QUIZ_MODE_SELECT),
		//@ts-ignore
		study: () => navigation.navigate(Paths.PROVERB_STUDY),
		//@ts-ignore
		wrongReview: () => navigation.navigate(Paths.QUIZ_WRONG_REVIEW),
		//@ts-ignore
		timechalleng: () => navigation.navigate(Paths.INIT_TIME_CHANLLENGE),
	};
	const ActionCard = ({
		iconName,
		iconType,
		label,
		description,
		color,
		onPress,
	}: {
		iconName: string;
		iconType: string;
		label: string;
		description: string;
		color: string;
		onPress: () => void;
	}) => (
		<TouchableOpacity style={[styles.actionCard, { borderColor: color }]} onPress={onPress}>
			<View style={[styles.iconCircle, { backgroundColor: color }]}>
				<IconComponent name={iconName} type={iconType} size={24} color="#fff" />
			</View>
			<View style={styles.cardTextBox}>
				<Text style={styles.cardTitle}>{label}</Text>
				<Text style={styles.cardDescription}>{description}</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			{showConfetti && (
				<View style={styles.globalConfettiWrapper}>
					<ConfettiCannon count={60} origin={{ x: scaleWidth(180), y: 0 }} fadeOut explosionSpeed={500} fallSpeed={2500} />
				</View>
			)}
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
					<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} ref={scrollViewRef}>
						<View style={styles.container}>
							<View style={styles.imageContainer}>
								<View style={styles.speechWrapper}>
									<View style={styles.speechBubble}>
										<Text style={styles.speechText}>{greeting}</Text>
									</View>
									<View style={styles.speechTail} />
								</View>

								<View
									style={styles.petView}>
									<TouchableOpacity onPress={handleMascotPress}>
										<View style={styles.mascoteView}>
											<FastImage key={totalScore} source={mascot} style={styles.image} resizeMode="contain" />
										</View>
									</TouchableOpacity>
									{/* ✅ 회색 작게 안내 텍스트 추가 */}
									{showMascotHint && (
										<Text style={styles.mascotHintText}>캐릭터를 누르면 빵빠레가 팡팡!</Text>
									)}

									{petLevel >= 0 && (
										<View
											style={styles.petContent}>
											<FastImage
												source={PET_REWARDS[petLevel].image}
												style={styles.petImage}
												resizeMode="cover"
											/>
										</View>
									)}
								</View>
							</View>
							<View style={styles.titleContainer}>
								<View style={{ alignItems: 'center' }}>
									{/* 타이틀 라인 */}
									<View style={styles.innerTitleContainer}>
										<IconComponent type="fontAwesome6" name={icon} size={18} color="#27ae60" />
										<Text
											style={styles.titleText}>
											{label}
										</Text>
										<TouchableOpacity onPress={() => setShowLevelModal(true)}>
											<IconComponent
												type="materialIcons"
												name="info-outline"
												size={18}
												color="#7f8c8d"
												style={styles.infoIcon}
											/>
										</TouchableOpacity>
									</View>

									{/* 점수 뱃지 */}
									<View style={styles.scoreBadgeItem}>
										<IconComponent name="leaderboard" type="materialIcons" size={14} color="#fff" />
										<Text style={styles.scoreBadgeTextItem}>{totalScore.toLocaleString()}점</Text>
									</View>
									{/* 설명 */}
									<Text style={[styles.levelDescription]}>{description}</Text>
								</View>
								{earnedBadges.length > 0 && (
									<View style={styles.badgeView}>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={{ paddingHorizontal: scaleWidth(10) }}>
											{visibleBadges.map((item) => (
												<View key={item.id} style={styles.badgeViewInner}>
													<TouchableOpacity
														style={styles.iconBoxActive}
														onPress={() => setSelectedBadge(item)} // ✅ 툴팁 관리 필요없음
													>
														<IconComponent name={item.icon} type={item.iconType} size={20} color="#27ae60" />
													</TouchableOpacity>
												</View>
											))}
										</ScrollView>
									</View>
								)}
							</View>
						</View>

						<ActionCard
							iconName="play-arrow"
							iconType="materialIcons"
							label="시작하기"
							description="속담 뜻, 속담 찾기, 빈칸 채우기 퀴즈를 선택해서 퀴즈를 풀어봐요"
							color="#3498db"
							onPress={moveToHandler.quiz}
						/>
						<ActionCard
							iconName="school"
							iconType="materialIcons"
							label="학습 모드"
							description="카드 형식으로 속담과 속담의 의미를 재미있게 익혀봐요"
							color="#2ecc71"
							onPress={moveToHandler.study}
						/>
						<ActionCard
							iconName="replay"
							iconType="materialIcons"
							label="오답 복습"
							description="틀린 퀴즈를 다시 풀면서 기억을 더 확실히 다져봐요"
							color="#f1c40f"
							onPress={moveToHandler.wrongReview}
						/>
						<ActionCard
							iconName="schedule"
							iconType="materialIcons"
							label="타임 챌린지"
							description="180초 제한 시간 안에 5개의 하트로 문제를 최대한 많이 풀어보세요!"
							color="#e67e22"
							onPress={moveToHandler.timechalleng}
						/>

						<TouchableOpacity style={styles.curiousButton} onPress={() => setShowBadgeModal(true)}>
							<IconComponent type="materialIcons" name="emoji-events" size={18} color="#2ecc71" />
							<Text style={styles.curiousButtonText}>숨겨진 뱃지들을 찾아보세요!</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.curiousButton2,
								{ borderColor: '#9b59b6' }, // 💜 보라색 계열로 변경
							]}
							onPress={() => setShowCheckInModal(true)}>
							<IconComponent type="materialIcons" name="event-available" size={18} color="#9b59b6" />
							<Text style={[styles.curiousButtonText, { color: '#9b59b6' }]}>오늘의 출석 확인하기</Text>
						</TouchableOpacity>
					</ScrollView>
				</KeyboardAvoidingView>
			</TouchableWithoutFeedback>

			{/* 설명 모달 */}
			<Modal visible={!!selectedBadge} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.badgeDetailModal}>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedBadge(null)}>
							<IconComponent type="materialIcons" name="close" size={24} color="#555" />
						</TouchableOpacity>

						{selectedBadge && (
							<>
								<View style={styles.badgeIconWrapper}>
									<IconComponent name={selectedBadge.icon} type={selectedBadge.iconType} size={48} color="#27ae60" />
								</View>

								<Text style={styles.badgeDetailTitle}>{selectedBadge.name}</Text>
								<Text style={styles.badgeDetailDescription}>{selectedBadge.description}</Text>

								<TouchableOpacity onPress={() => setSelectedBadge(null)} style={styles.modalConfirmButton}>
									<Text style={styles.modalConfirmText}>닫기</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>
			</Modal>

			{/* 획득 가능한 뱃지 모달 */}
			<Modal transparent visible={showBadgeModal} animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.badgeModalContent}>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowBadgeModal(false)}>
							<IconComponent type="materialIcons" name="close" size={24} color="#555" />
						</TouchableOpacity>

						<Text style={styles.pageTitle}>획득 가능한 뱃지</Text>
						<Text style={styles.badgeProgressText}>
							총 {CONST_BADGES.length}개 뱃지 중 <Text style={{ fontWeight: 'bold', color: '#27ae60' }}>{earnedBadgeIds.length}개를 획득했어요!</Text>
						</Text>

						<ScrollView contentContainerStyle={{ padding: 10 }} style={styles.badgeScrollView}>
							{CONST_BADGES.map((badge) => {
								const isEarned = earnedBadgeIds.includes(badge.id);
								return (
									<View
										key={badge.id}
										style={[
											styles.badgeCard,
											isEarned && styles.badgeCardActive, // ✅ 활성화된 스타일 적용
										]}>
										<View
											style={[
												styles.iconBox,
												isEarned && styles.badgeCardActive, // 아이콘 박스도 강조
											]}>
											<IconComponent
												name={badge.icon}
												type={badge.iconType}
												size={20}
												color={isEarned ? '#27ae60' : '#2c3e50'} // ✅ 색상 강조
											/>
										</View>
										<View style={styles.textBox}>
											<Text
												style={[
													styles.badgeTitle,
													isEarned && styles.badgeTitleActive, // 텍스트 강조
												]}>
												{badge.name}
											</Text>
											<Text
												style={[
													styles.badgeDesc,
													isEarned && styles.badgeDescActive, // 설명 강조
												]}>
												획득조건: {badge.description}
											</Text>
										</View>
									</View>
								);
							})}
						</ScrollView>

						<TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBadgeModal(false)}>
							<Text style={styles.modalCloseText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			<Modal visible={showLevelModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={[styles.levelModal, { maxHeight: scaleHeight(600) }]}>
						<Text style={styles.levelModalTitle}>등급 안내</Text>
						{/* ✅ 내 점수 출력 */}

						<ScrollView
							ref={levelScrollRef}
							style={{ width: '100%' }}
							contentContainerStyle={{ paddingBottom: scaleHeight(12) }}
							showsVerticalScrollIndicator={false}>
							{reversedLevelData.map((item) => {
								const isCurrent = totalScore >= item.score && totalScore < item.next;
								return (
									<View key={item.label} style={[styles.levelCardBox, isCurrent && styles.levelCardBoxActive]}>
										{isCurrent && (
											<View style={styles.levelBadge}>
												<Text style={styles.levelBadgeText}>🏆 현재 등급</Text>
											</View>
										)}
										<FastImage source={item.mascot} style={styles.levelMascot} resizeMode={FastImage.resizeMode.contain} />
										<Text style={styles.levelLabel}>{item.label}</Text>
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
			<Modal visible={showCheckInModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={[styles.modalContent]}>
						<TouchableOpacity
							style={styles.modalCloseIcon}
							onPress={() => {
								setShowCheckInModal(false);
								loadCheckedInDates(); // 출석 기록 다시 불러오기
								loadData(); // 점수/뱃지 등 다시 로드
							}}>
							<IconComponent type="materialIcons" name="close" size={24} color="#555" />
						</TouchableOpacity>

						<Text style={styles.modalTitle}>오늘의 출석</Text>

						<ScrollView
							style={{ width: '100%' }}
							contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
							showsVerticalScrollIndicator={false}>
							<View style={styles.rowCentered}>
								<FastImage
									source={mascot}
									style={styles.mascotImage}
									resizeMode={FastImage.resizeMode.cover}
								/>
								<Text style={[styles.modalText2, { flex: 1 }]}>
									매일 접속하면 퀴즈에서 얻은 나의 캐릭터가 출석 스탬프를 찍어줘요!{'\n'}
								</Text>
							</View>

							<View style={styles.highlightBox}>
								<Text style={styles.highlightText}>
									연속 출석을 통해 3단계로 진화하는 귀여운 펫도 함께 얻을 수 있답니다 🐾{'\n'}
									획득한 펫은 캐릭터 옆에 항상 따라다녀요!
								</Text>
							</View>

							<View style={styles.petScrollContainer}>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.petScrollContent}>
									{[
										{ label: '7일 출석', image: require('@/assets/images/pet_level1_org.png') },
										{ label: '14일 출석', image: require('@/assets/images/pet_level2_org.png') },
										{ label: '21일 출석', image: require('@/assets/images/pet_level3_org.png') },
									].map((item, index, arr) => (
										<View
											key={index}
											style={[
												styles.petItemBox,
												{ marginRight: index !== arr.length - 1 ? scaleWidth(10) : 0 },
											]}>
											<FastImage
												source={item.image}
												style={styles.petImage2}
												resizeMode="contain"
											/>
											<Text style={styles.petLabelText}>{item.label}</Text>
											<Text style={styles.petStageText}>
												{['새싹 친구', '잎사귀 친구', '꽃잎 친구'][index]}
											</Text>

											{index < arr.length - 1 && (
												<IconComponent
													name="chevron-right"
													type="fontAwesome"
													size={12}
													color="#7f8c8d"
													style={styles.arrowIcon}
												/>
											)}
										</View>
									))}
								</ScrollView>
							</View>
							<Calendar
								markingType="custom"
								markedDates={checkedInDates}
								disableAllTouchEventsForDisabledDays={true}
								theme={{
									todayTextColor: '#e74c3c',
									arrowColor: '#2ecc71',
									textDayFontSize: scaledSize(13),
									textMonthFontSize: scaledSize(14),
									textDayHeaderFontSize: scaledSize(15),
								}}
								renderHeader={(date) => {
									const year = date.getFullYear();
									const month = (date.getMonth() + 1).toString().padStart(2, '0');
									return (
										<Text style={styles.calendarHeaderText}>
											{`${year}년 ${month}월`} 출석
										</Text>
									);
								}}
								hideArrows
								style={styles.calendarContainer}
							/>
							{showStamp && (
								<Animated.View style={[stampStyle, styles.stampContainer]}>
									<FastImage
										source={mascot}
										style={styles.stampImage}
										resizeMode="contain"
									/>
									<Text style={styles.stampText}>오늘 출석 완료!</Text>
								</Animated.View>
							)}
							{isCheckedIn && (
								<Text style={styles.checkInCompleteText}>
									🎉 오늘도 출석 완료! 🎉
								</Text>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	wrapper: { flex: 1, backgroundColor: '#fff' },
	scrollContainer: { paddingBottom: scaleHeight(40) },
	container: {
		flexGrow: 1,
		paddingHorizontal: scaleWidth(16),
		paddingVertical: scaleHeight(12), // ← 이 부분을 줄이거나 0으로
	},
	imageContainer: { alignItems: 'center' },
	image: {
		width: scaleWidth(150),
		height: scaleWidth(150),
	},
	speechWrapper: { alignItems: 'center', marginBottom: scaleHeight(-20) },
	speechBubble: {
		backgroundColor: '#fef9e7',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(20),
		maxWidth: '100%',
		shadowColor: '#000',
		shadowOpacity: 0.07,
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowRadius: scaleWidth(3),
	},
	speechTail: {
		width: 0,
		height: 0,
		borderLeftWidth: scaleWidth(10),
		borderRightWidth: scaleWidth(10),
		borderTopWidth: scaleHeight(10),
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#fef9e7',
		alignSelf: 'center',
	},
	speechText: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
		textAlign: 'center',
		fontWeight: '600',
		lineHeight: scaleHeight(22),
	},
	levelContainer: { alignItems: 'center', marginBottom: scaleHeight(16) },
	levelText: {
		fontSize: scaledSize(14),
		color: '#27ae60',
		fontWeight: '600',
		marginLeft: scaleWidth(6),
	},
	badgeScrollWrapper: {
		height: scaleHeight(70),
		width: '100%',
		marginTop: scaleHeight(8),
	},
	iconBoxActive: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		marginHorizontal: scaleWidth(2),
		borderRadius: scaleWidth(18),
		backgroundColor: '#d0f0dc',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#27ae60',
	},
	toggleBadgeText: {
		color: '#27ae60',
		fontSize: scaledSize(13),
		marginTop: scaleHeight(4),
		textAlign: 'center',
	},
	greetingText: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
	},
	actionButton: {
		width: scaleWidth(260),
		paddingVertical: scaleHeight(14),
		borderRadius: scaleWidth(10),
		marginVertical: scaleHeight(8),
		alignSelf: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	helpButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: scaleHeight(30),
		alignSelf: 'center',
		backgroundColor: '#95a5a6',
		paddingHorizontal: scaleWidth(18),
		paddingVertical: scaleHeight(10),
		borderRadius: scaleWidth(8),
		opacity: 0.9,
	},
	helpButtonText: {
		color: '#fff',
		fontSize: scaledSize(14),
		fontWeight: '500',
		marginLeft: scaleWidth(6),
	},
	helpIcon: {
		marginRight: scaleWidth(4),
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '85%',
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
	},
	modalCloseButton: {
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(8),
		marginTop: scaleHeight(20),
	},
	modalCloseText: {
		color: '#fff',
		fontWeight: '600',
	},
	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(14),
		textAlign: 'center',
	},
	modalText: {
		fontSize: scaledSize(14),
		color: '#34495e',
		lineHeight: scaleHeight(22),
		textAlign: 'left',
		marginTop: scaleHeight(10),
		marginBottom: scaleHeight(20),
	},
	boldText: {
		fontWeight: 'bold',
	},
	badgeModalContent: {
		width: '90%',
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f4f6f8',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowRadius: scaleWidth(2),
		width: '100%',
	},
	iconBox: {
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(16),
	},
	textBox: {
		flex: 1,
	},
	badgeTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#34495e',
	},
	badgeDesc: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginTop: scaleHeight(4),
	},
	pageTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(16),
		textAlign: 'center',
	},
	curiousButton: {
		marginTop: scaleHeight(16),
		alignSelf: 'center',
		paddingHorizontal: scaleWidth(14),
		paddingVertical: scaleHeight(10),
		borderRadius: scaleWidth(30),
		borderWidth: 1,
		borderColor: '#2ecc71',
		backgroundColor: '#ffffff',
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
		marginBottom: scaleHeight(24),
	},
	curiousButtonText: {
		color: '#2ecc71',
		fontWeight: '600',
		fontSize: scaledSize(14),
		marginLeft: scaleWidth(8),
		textAlign: 'center',
	},
	actionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(16),
		marginHorizontal: 0,
		marginBottom: scaleHeight(16),
		padding: scaleWidth(14),
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		alignSelf: 'center',
		width: '88%',
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowRadius: scaleWidth(2),
	},
	iconCircle: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(26),
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(16),
	},
	cardTitle: {
		fontSize: scaledSize(16),
		fontWeight: '700',
		color: '#2c3e50',
	},
	cardDescription: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginTop: scaleHeight(4),
		lineHeight: scaleHeight(18),
	},
	cardTextBox: {
		flex: 1,
	},
	badgeCardActive: {
		backgroundColor: '#e8f5e9',
		borderColor: '#2ecc71',
		borderWidth: 1.2,
	},
	badgeTitleActive: {
		color: '#27ae60',
	},
	badgeDescActive: {
		color: '#2d8659',
	},
	badgeProgressText: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#27ae60',
		marginBottom: scaleHeight(12),
		textAlign: 'center',
	},
	confettiWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: scaleWidth(150),
		height: scaleHeight(280),
		zIndex: 10,
	},
	tooltipBox: {
		marginTop: scaleHeight(6),
		backgroundColor: '#2c3e50',
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(8),
		maxWidth: scaleWidth(180),
		zIndex: 10,
	},
	tooltipText: {
		color: '#fff',
		fontSize: scaledSize(12),
		textAlign: 'center',
		lineHeight: scaleHeight(18),
	},
	badgeDetailModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
		position: 'relative',
	},
	badgeIconWrapper: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		borderRadius: scaleWidth(40),
		backgroundColor: '#eafaf1',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	badgeDetailTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},
	badgeDetailDescription: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(10),
		right: scaleWidth(10),
		zIndex: 2,
		padding: scaleWidth(5),
	},
	modalConfirmButton: {
		backgroundColor: '#27ae60',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(8),
		marginTop: scaleHeight(20),
		alignSelf: 'center',
	},
	modalConfirmText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: scaledSize(14),
		textAlign: 'center',
	},
	levelModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
		paddingBottom: scaleHeight(12),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
		maxHeight: scaleHeight(600),
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
		marginLeft: scaleWidth(6),
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
	main: { flex: 1, backgroundColor: '#fff' },
	mascoteView: {
		width: scaleWidth(180),
		height: scaleWidth(180),
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconView: {
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	iconViewInner: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	myScoreLabel: {
		fontSize: scaledSize(17),
		color: '#27ae60',
		fontWeight: '700',
		marginLeft: scaleWidth(6),
	},
	badgeView: { width: '100%', marginTop: scaleHeight(10) },
	badgeViewInner: {
		marginRight: scaleWidth(12),
		alignItems: 'center',
	},
	badgeScrollView: {
		maxHeight: scaleHeight(400),
		width: '100%',
	},
	gradeScrollView: {
		paddingBottom: scaleHeight(12),
	},
	globalConfettiWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 999,
		pointerEvents: 'none',
	},
	rowCentered: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	mascotImage: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(24),
		borderWidth: 2,
		borderColor: '#27ae60',
		marginRight: scaleWidth(10),
	},
	modalText2: {
		fontSize: scaledSize(13),
		color: '#2c3e50',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(6),
		fontWeight: '500',
	},
	highlightBox: {
		padding: scaleHeight(10),
		backgroundColor: '#fef9e7',
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: '#f1c40f',
	},
	highlightText: {
		fontSize: scaledSize(12),
		color: '#2c3e50',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
		fontWeight: '500',
	},
	petScrollContainer: {
		marginTop: scaleHeight(12),
		marginBottom: scaleHeight(12),
	},
	petScrollContent: {
		paddingHorizontal: scaleWidth(12),
	},
	petItemBox: {
		width: scaleWidth(90),
		alignItems: 'center',
		padding: scaleWidth(6),
		borderRadius: scaleWidth(8),
		backgroundColor: '#f8f9fa',
		borderWidth: 1,
		borderColor: '#dcdcdc',
		position: 'relative',
	},
	petImage2: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(24),
		borderWidth: 2,
		borderColor: '#27ae60',
		marginBottom: scaleHeight(6),
	},
	petLabelText: {
		fontSize: scaledSize(11),
		color: '#2c3e50',
		fontWeight: '600',
		textAlign: 'center',
	},
	petStageText: {
		fontSize: scaledSize(10),
		color: '#7f8c8d',
		marginTop: scaleHeight(2),
		textAlign: 'center',
	},
	arrowIcon: {
		position: 'absolute',
		right: -scaleWidth(8),
		top: '45%',
	},
	calendarContainer: {
		width: '100%',
		borderRadius: scaleWidth(8),
		borderWidth: 1,
		borderColor: '#27ae60',
		overflow: 'hidden',
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(4),
	},
	calendarHeaderText: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
		marginVertical: scaleHeight(10),
	},
	stampContainer: {
		alignItems: 'center',
	},
	stampImage: {
		width: scaleWidth(120),
		height: scaleWidth(120),
		marginBottom: scaleHeight(6),
	},
	stampText: {
		fontSize: scaledSize(16),
		color: '#e74c3c',
		fontWeight: 'bold',
		textShadowColor: 'rgba(0,0,0,0.2)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	checkInCompleteText: {
		fontSize: scaledSize(14),
		color: '#27ae60',
		marginTop: scaleHeight(10),
		fontWeight: 'bold',
		textAlign: 'center',
	},
	petView: { alignItems: 'center', justifyContent: 'center', marginTop: scaleHeight(8), position: 'relative' },
	petContent: {
		position: 'absolute',
		right: scaleWidth(-35), // ✅ 너무 멀리 떨어져 있음
		top: scaleHeight(10),
		width: scaleWidth(60),
		height: scaleWidth(60),
		borderRadius: scaleWidth(30),
		borderWidth: 2,
		borderColor: '#27ae60',
		overflow: 'hidden',
	},
	petImage: { width: '100%', height: '100%' },
	titleContainer: {
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	curiousButton2: {
		alignSelf: 'center',
		paddingHorizontal: scaleWidth(14),
		paddingVertical: scaleHeight(10),
		borderRadius: scaleWidth(30),
		borderWidth: 1,
		borderColor: '#2ecc71',
		backgroundColor: '#ffffff',
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
		marginBottom: scaleHeight(24),
	},
	innerTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(6) },
	titleText: {
		fontSize: scaledSize(16),
		color: '#27ae60',
		fontWeight: '700',
		marginLeft: scaleWidth(6),
		marginBottom: scaleHeight(5),
	},
	infoIcon: { marginLeft: scaleWidth(4), marginTop: scaleHeight(-3) },
	scoreBadgeItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#27ae60',
		borderRadius: scaleHeight(12),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		marginBottom: scaleHeight(10),
	},
	scoreBadgeTextItem: {
		color: '#fff',
		fontSize: scaledSize(14),
		fontWeight: '600',
		marginLeft: scaleWidth(4),
	},
	levelDescription: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		textAlign: 'center',
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(8),
		lineHeight: scaleHeight(20),
		paddingHorizontal: scaleWidth(8),
	},
	levelDetailDescription: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
		textAlign: 'center',
		marginTop: scaleHeight(6),
		lineHeight: scaleHeight(18),
	},
	mascotHintText: {
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(6),
		fontSize: scaledSize(11),
		color: '#7f8c8d',
		textAlign: 'center',
	},
});

export default Home;
