/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModalHandoff } from '@/hooks/useModalHandoff';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { Paths } from '@/navigation/conf/Paths';
import { useAppNavigation } from '@/navigation/conf/Types';
import IconComponent from './common/atomic/IconComponent';
import { CONST_BADGES, BADGE_RARITY_META } from '@/const/ConstBadges';
import BadgeDetailPopup from './modal/BadgeDetailPopup';
import BadgeListModal from './modal/BadgeListModal';
import { HIT_SLOP, COLORS, FONT_SIZES, HERO, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';

import ConfettiCannon from 'react-native-confetti-cannon';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateUtils from '@/utils/DateUtils';
import '@/utils/KoreanLocale'; // 달력/moment 한국어 설정 (단일 소스)
import CheckInModal from './modal/CheckInModal';
import DailyMissionModal from './modal/DailyMissionModal';
import LevelUpModal, { LevelUpInfo } from './modal/LevelUpModal';
import LevelModal from './modal/LevelModal';
import * as TodayQuizService from '@/services/TodayQuizService';
import { useHomeProgress } from '@/hooks/home/useHomeProgress';
import { useAttendance } from '@/hooks/home/useAttendance';
import { useDailyMissionSummary } from '@/hooks/home/useDailyMissionSummary';
import { PET_REWARDS, getLevelByScore, getProgressPercent, getQuestionsToNext } from '@/const/ConstInfoData';
import FadeInView, { staggerDelay } from '@/components/animation/FadeInView';
import TowerRewardSection from '@/components/TowerRewardSection';
import { playFinish } from '@/utils/SoundUtils';
import CharacterGuide, { useCharacterGuideOnce, CharacterGuideButton } from '@/screens/common/CharacterGuide';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const greetingMessages = [
	'🎯 반갑습니다! 오늘도 똑똑해질 준비되셨습니까?',
	'🧠 오늘의 속담으로 지혜를 키워 보세요!',
	'📚 기억력 자신 있으십니까? 속담 퀴즈에 도전!',
	'📝 속담 하나, 교훈 하나! 함께 배워 보세요!',
	'✨ 속담으로 생각을 키워 보는 시간입니다!',
	'💡 옛말 속 지혜, 오늘도 한마디 배워 보시겠습니까?',
	'👀 퀴즈로 속담을 익히면 재미가 두 배!',
	'🔍 뜻을 알면 더 재밌는 속담! 지금 풀어보세요!',
	'🧩 맞히는 재미, 배우는 즐거움! 속담 퀴즈 GO!',
	'🐣 하루 한 속담! 작지만 큰 지혜가 자랍니다!',
];


/**
 * 홈 화면 메인 액션 카드
 * - Home 내부가 아닌 모듈 스코프에 정의: 리렌더마다 재마운트되어 진입 애니메이션이 반복되는 문제 방지
 */
const ActionCard = ({
	iconName,
	iconType,
	label,
	description,
	color,
	onPress,
	isNew,
	index = 0,
	primary = false,
}: {
	iconName: string;
	iconType: string;
	label: string;
	description: string;
	color: string;
	onPress: () => void;
	isNew?: boolean;
	index?: number;
	/** 그 화면에서 가장 먼저 눌러야 할 동작인지 — 보더를 색으로 칠해 위계를 만든다 */
	primary?: boolean;
}) => {
	return (
		// 카드 8장이 위에서부터 차례로 떠오른다 (공통 리스트 진입 애니메이션)
		<FadeInView delay={staggerDelay(index, 8)} duration={280}>
			<TouchableOpacity
				style={[styles.actionCard, primary && { borderColor: color, borderWidth: 1.5 }]}
				activeOpacity={0.85}
				onPress={onPress}>
				<View style={[styles.iconCircle, { backgroundColor: color }]}>
					<IconComponent name={iconName} type={iconType} size={scaledSize(24)} color={COLORS.textWhite} />
				</View>
				<View style={styles.cardTextBox}>
					<Text style={styles.cardTitle}>{label}</Text>
					<Text style={styles.cardDescription}>{description}</Text>
				</View>

				{/* ✅ NEW 대각선 배지 */}
				{isNew && (
					<View style={styles.newBadgeWrapper}>
						<View style={styles.newBadge}>
							<Text style={styles.newBadgeText}>NEW</Text>
						</View>
					</View>
				)}
			</TouchableOpacity>
		</FadeInView>
	);
};

const MascotMoment = ({
	image,
	title,
	description,
	backgroundColor,
	accentColor,
	imageOnRight = false,
}: {
	image: number;
	title: string;
	description: string;
	backgroundColor: string;
	accentColor: string;
	imageOnRight?: boolean;
}) => (
	<View style={[styles.mascotMoment, imageOnRight && styles.mascotMomentRight, { backgroundColor, borderTopColor: accentColor }]}>
		<FastImage source={image} style={[styles.mascotMomentImage, imageOnRight && styles.mascotMomentImageRight]} resizeMode="contain" />
		<View style={[styles.mascotMomentCopy, imageOnRight && styles.mascotMomentCopyLeft]}>
			<Text style={[styles.mascotMomentTitle, imageOnRight && styles.mascotMomentTextRight]}>{title}</Text>
			<Text style={[styles.mascotMomentDescription, imageOnRight && styles.mascotMomentTextRight]}>{description}</Text>
		</View>
	</View>
);

const Home = () => {
	const reducedMotion = useReducedMotion();
	// 안내 정책: 화면에 처음 들어갈 때 1회 자동 노출. 다시 보려면 설정 > 화면 안내.
	const guide = useCharacterGuideOnce('home');
	// 모달 → 모달 전환 시 이전 모달 깜빡임 방지
	const handoff = useModalHandoff();
	const navigation = useAppNavigation();
	const confettiTimer = useRef<NodeJS.Timeout | null>(null); // 축포 자동 종료 타이머
	const scrollViewRef = useRef<ScrollView>(null);

	const [greeting, setGreeting] = useState('🖐️ 안녕하세요! 오늘도 속담 퀴즈 풀 준비 되셨습니까?');
	const [showConfetti, setShowConfetti] = useState(false);
	const [showBadgeModal, setShowBadgeModal] = useState(false);
	const [selectedBadge, setSelectedBadge] = useState<(typeof CONST_BADGES)[number] | null>(null);

	// 저장소를 만지는 로직은 전부 훅/서비스로 분리했다 (화면은 그리기만 담당)
	const { progress, status: progressStatus, levelUp, clearLevelUp, refresh: refreshProgress, addScoreLocally } = useHomeProgress();
	const attendance = useAttendance();
	const { summary: missionSummary, refresh: refreshMissionSummary } = useDailyMissionSummary();

	const { totalScore, badgeIds: progressBadgeIds, unlockedRewards } = progress;
	// 출석 훅이 새로 준 뱃지도 함께 보여준다
	const earnedBadgeIds = useMemo(
		() => [...new Set([...progressBadgeIds, ...attendance.earnedBadgeIds])],
		[progressBadgeIds, attendance.earnedBadgeIds],
	);

	// 획득 뱃지 (CONST_BADGES 기준으로 유효한 것만 — 중복/유령 id 방지)
	const earnedBadges = CONST_BADGES.filter((b) => earnedBadgeIds.includes(b.id));
	// 홈 상단에는 미리보기만 노출하고, 초과분은 +N 칩으로 안내 → 전체는 뱃지 모달에서 확인
	const BADGE_PREVIEW_LIMIT = 12;
	const previewBadges = earnedBadges.slice(0, BADGE_PREVIEW_LIMIT);
	const extraBadgeCount = Math.max(earnedBadges.length - previewBadges.length, 0);
	const [showLevelModal, setShowLevelModal] = useState(false);

	const hasAutoCheckedIn = useRef(false); // ✅ 중복 방지용
	const stampAnim = useRef(new Animated.Value(0)).current;
	const stampTimer = useRef<NodeJS.Timeout | null>(null);
	// 화면 진입 fade + slide-up
	const screenAnim = useRef(new Animated.Value(0)).current;
	const { isCheckedIn, checkedInDates, petLevel, streakInfo } = attendance;
	const [showStamp, setShowStamp] = useState(false);
	const [showCheckInModal, setShowCheckInModal] = useState(false); // 초기값 false
	const [showDailyMission, setShowDailyMission] = useState(false); // 오늘의 미션 모달
	const [showLevelUp, setShowLevelUp] = useState(false); // 레벨업 축하 모달

	const [showMascotHint, setShowMascotHint] = useState(true);

	// 🏅 뱃지 리스트 펄스 애니메이션
	const badgePulse = useRef(new Animated.Value(0)).current;

	// ✅ 펫 탭 애니메이션 / 말풍선
	const petScale = useRef(new Animated.Value(1)).current;
	const petSpeechAnim = useRef(new Animated.Value(0)).current;
	const petSpeechTimer = useRef<NodeJS.Timeout | null>(null);
	const [petSpeech, setPetSpeech] = useState<string | null>(null);
	const hasShownInitialPetSpeech = useRef(false);

	const PET_MESSAGES = [
		'뀨! 안녕하세요!',
		'오늘도 함께 공부하겠습니다!',
		'속담 한 개 배워 보시겠습니까?',
		'함께 놀아 주셔서 고맙습니다!',
		'잘하고 계십니다, 최고입니다!',
		'조금만 더 힘내 보세요!',
		'쓰담쓰담 좋습니다~',
		'퀴즈 풀러 가 보시겠습니까?',
		'배고픕니다... 점수 주세요!',
		'오늘도 출석 잊지 마세요!',
	];

	// 펫 말풍선 노출(공통)
	const showPetSpeech = useCallback(
		(msg?: string) => {
			const message = msg ?? PET_MESSAGES[Math.floor(Math.random() * PET_MESSAGES.length)];
			setPetSpeech(message);
			petSpeechAnim.setValue(0);
			Animated.spring(petSpeechAnim, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();

			if (petSpeechTimer.current) {
				clearTimeout(petSpeechTimer.current);
			}
			petSpeechTimer.current = setTimeout(() => {
				Animated.timing(petSpeechAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => setPetSpeech(null));
			}, 2200);
		},
		[petSpeechAnim],
	);

	// ✅ 화면 진입 애니메이션 (fade + slide-up)
	useEffect(() => {
		const anim = Animated.timing(screenAnim, {
			toValue: 1,
			duration: 300,
			easing: Easing.out(Easing.quad),
			useNativeDriver: true,
		});
		anim.start();
		return () => anim.stop();
	}, [screenAnim]);

	// ✅ 언마운트 시 타이머 정리 (말풍선/도장/레벨 스크롤)
	useEffect(
		() => () => {
			if (petSpeechTimer.current) {
				clearTimeout(petSpeechTimer.current);
			}
			if (stampTimer.current) {
				clearTimeout(stampTimer.current);
			}
		},
		[],
	);

	// 🏅 뱃지 리스트 은은한 펄스 애니메이션 루프
	useEffect(() => {
		if (reducedMotion) {
			// 끊임없이 맥박치는 요소는 '애니메이션 줄이기'에서 가장 먼저 빠져야 한다.
			badgePulse.setValue(0);
			return;
		}
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(badgePulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
				Animated.timing(badgePulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [badgePulse, reducedMotion]);

	// 펫 통통 튀는 모션
	const bouncePet = useCallback(() => {
		Animated.sequence([
			Animated.timing(petScale, { toValue: 1.22, duration: 140, useNativeDriver: true }),
			Animated.spring(petScale, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
		]).start();
	}, [petScale]);

	const todayStr = DateUtils.getLocalDateString();

	// ✅ 펫이 처음 등장하면 한 번 인사 말풍선 자동 노출
	useEffect(() => {
		if (petLevel >= 0 && !hasShownInitialPetSpeech.current) {
			hasShownInitialPetSpeech.current = true;
			// 요일별로 좀 더 귀여운 인사말
			const dayGreetings = [
				'일요일입니다~ 푹 쉬면서 한 문제 어떠십니까? 😴',
				'월요일 파이팅! 오늘도 같이 시작합니다 💪',
				'화요일입니다! 가볍게 한 판 풀어 보시겠습니까? 🔥',
				'수요일, 벌써 한 주의 절반! 잘하고 계십니다 🌱',
				'목요일입니다~ 조금만 더 힘내세요! ✨',
				'불금입니다! 오늘도 똑똑해지고 가세요 🎉',
				'토요일입니다~ 여유롭게 한 문제 풀어 보세요 ☕',
			];
			const firstGreeting = dayGreetings[DateUtils.now().getDay()] ?? '안녕하세요! 오늘도 함께 공부하겠습니다 😊';
			const t = setTimeout(() => showPetSpeech(firstGreeting), 900);
			return () => clearTimeout(t);
		}
	}, [petLevel, showPetSpeech]);

	// ✅ 출석/미션 모달이 떠 있지 않을 때, 보류된 레벨업 모달을 살짝 지연 후 노출
	useEffect(() => {
		if (levelUp && !showCheckInModal && !showDailyMission) {
			const t = setTimeout(() => setShowLevelUp(true), 600);
			return () => clearTimeout(t);
		}
	}, [showCheckInModal, showDailyMission, levelUp]);

	useFocusEffect(
		useCallback(() => {
			// 열려 있던 팝업은 닫고 시작한다 (출석 팝업은 아래에서 다시 판단)
			setShowBadgeModal(false);
			setSelectedBadge(null);
			setShowLevelModal(false);
			setShowDailyMission(false);
			setShowLevelUp(false);

			setShowConfetti(true);
			confettiTimer.current = setTimeout(() => setShowConfetti(false), 3000);
			hasAutoCheckedIn.current = false;

			loadHomeData();

			scrollViewRef.current?.scrollTo({ y: 0, animated: true });

			return () => {
				if (confettiTimer.current) {
					clearTimeout(confettiTimer.current);
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

	const levelData = useMemo(() => getLevelByScore(totalScore), [totalScore]);

	const { label, icon, mascot, description } = levelData;

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
		await attendance.checkIn(); // 저장 + 달력 반영은 훅이 담당
		playFinish(); // 🎉 출석 완료 축하 사운드

		setShowStamp(true); // 애니메이션용 플래그
		stampAnim.setValue(0); // 초기화
		Animated.timing(stampAnim, {
			toValue: 1,
			duration: 700,
			useNativeDriver: true,
			easing: Easing.out(Easing.exp),
		}).start(() => {
			// 애니메이션이 끝나면 잠깐 보여주고 사라지게
			if (stampTimer.current) {
				clearTimeout(stampTimer.current);
			}
			stampTimer.current = setTimeout(() => setShowStamp(false), 3000);
		});
	};

	// 진행도(다음 등급까지 %) — 중앙 헬퍼 사용
	const progressPercent = getProgressPercent(totalScore);
	let progressColor: string = COLORS.primary; // 그린 (0~59%)

	if (progressPercent >= 60 && progressPercent < 90) {
		progressColor = COLORS.warning; // 앰버 (60~89%)
	}

	if (progressPercent >= 90) {
		progressColor = COLORS.danger; // 레드 (90~100%)
	}

	// 다음 등급까지 남은 문제 수 — 중앙 헬퍼 사용
	const questionsToNext = getQuestionsToNext(totalScore);

	/** 홈 진입 시 필요한 데이터를 한 번에 읽어 온다. */
	const loadHomeData = useCallback(async () => {
		await TodayQuizService.ensureToday(); // 오늘 항목이 없으면 만들어 둔다
		await Promise.all([refreshProgress(), attendance.refresh(), refreshMissionSummary()]);

		// 아직 출석 전이면 출석 팝업을 띄운다
		const today = await TodayQuizService.getToday();
		if (today && !today.isCheckedIn) {
			setShowCheckInModal(true);
		}
	}, [refreshProgress, attendance.refresh, refreshMissionSummary]);

	const handleMascotPress = () => {
		const random = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
		setGreeting(random);
		setShowConfetti(false);

		// 빵빠레 텍스트는 한 번 클릭하면 사라지게
		if (showMascotHint) {
			setShowMascotHint(false);
		}

		// ✅ 캐릭터를 누르면 펫 말풍선도 함께 노출
		if (petLevel >= 0) {
			bouncePet();
			showPetSpeech();
		}

		requestAnimationFrame(() => setShowConfetti(true));
		if (confettiTimer.current) {
			clearTimeout(confettiTimer.current);
		}
		confettiTimer.current = setTimeout(() => setShowConfetti(false), 3000);
	};

	const moveToHandler = {
		quiz: () => navigation.navigate(Paths.PROVERB_QUIZ_MODE_SELECT),
		study: () => navigation.navigate(Paths.PROVERB_STUDY),
		wrongReview: () => navigation.navigate(Paths.QUIZ_WRONG_REVIEW),
		timechalleng: () => navigation.navigate(Paths.INIT_TIME_CHANLLENGE),
		towerchalleng: () => navigation.navigate(Paths.TOWER_CHANLLENGE),
		favorite: () => navigation.navigate(Paths.FAVORITE),
		myBook: () => navigation.navigate(Paths.MY_PROVERB_BOOK),
	};
	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			{/* 컨페티는 화면 전체를 덮는 큰 모션이라 '애니메이션 줄이기'에서는 생략한다. */}
			{showConfetti && !reducedMotion && (
				<View style={styles.globalConfettiWrapper}>
					<ConfettiCannon count={60} origin={{ x: scaleWidth(180), y: 0 }} fadeOut explosionSpeed={500} fallSpeed={2500} />
				</View>
			)}
			<Animated.View
				style={[
					styles.wrapper,
					{
						opacity: screenAnim,
						transform: [{ translateY: screenAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) }],
					},
				]}>
				{/*
				  아이콘 칩 색은 '기능 계열' 을 나타낸다 — 무지개처럼 흩어지지 않도록 3계열로 묶는다.
				  · 학습  : 블루 / 그린  (주 동작 2개, 보더까지 칠해 위계를 준다)
				  · 도전  : 앰버 → 플레임 → 오렌지 (난이도가 올라가는 램프)
				  · 수집  : 틸 / 스카이
				*/}
				<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} ref={scrollViewRef}>
					<View style={styles.heroSection}>
						<View style={styles.imageContainer}>
							<View style={styles.streakChipWrapper}>
								<View style={styles.streakHelpButton}>
									<CharacterGuideButton onPress={guide.open} size={scaledSize(18)} />
								</View>
								<View style={[styles.streakChip, streakInfo.current > 0 ? styles.streakChipActive : styles.streakChipIdle]}>
									<IconComponent
										name="local-fire-department"
										type="materialIcons"
										size={scaledSize(14)}
										color={streakInfo.current > 0 ? COLORS.accentFlame : COLORS.textLight}
									/>
									<Text style={[styles.streakChipText, streakInfo.current > 0 && styles.streakChipTextActive]}>
										{streakInfo.current > 0 ? `${streakInfo.current}일 연속 출석 중` : '오늘 출석하기'}
									</Text>
								</View>
							</View>

							<View style={styles.speechWrapper}>
								<View style={styles.speechBubble}>
									<Text style={styles.speechText}>{greeting}</Text>
								</View>
								<View style={styles.speechTail} />
							</View>

							<View style={styles.petView}>
								<TouchableOpacity onPress={handleMascotPress}>
									<View style={styles.mascoteView}>
										<FastImage key={totalScore} source={mascot} style={styles.image} resizeMode="contain" />
									</View>
								</TouchableOpacity>

								{petLevel >= 0 && (
									<TouchableOpacity style={styles.petContent} activeOpacity={0.8} onPress={bouncePet}>
										<Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: petScale }] }}>
											<FastImage source={PET_REWARDS[petLevel].image} style={styles.petImage} resizeMode="cover" />
										</Animated.View>
									</TouchableOpacity>
								)}

								{/* ✅ 펫 말풍선 */}
								{petLevel >= 0 && petSpeech && (
									<Animated.View
										style={[
											styles.petSpeechBubble,
											{
												opacity: petSpeechAnim,
												transform: [
													{ scale: petSpeechAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
													{ translateY: petSpeechAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(6), 0] }) },
												],
											},
										]}>
										<Text style={styles.petSpeechText} numberOfLines={1}>
											{petSpeech}
										</Text>
									</Animated.View>
								)}
							</View>
						</View>
						{/* ✅ 회색 작게 안내 텍스트 추가 */}
						{showMascotHint && <Text style={styles.mascotHintText}>캐릭터를 누르면 빵빠레가 팡팡!</Text>}
						{/* 레벨업 게이지바 */}
						<View style={styles.progressBarWrapper}>
							<View
								style={[
									styles.progressBarBackground,
									{
										borderColor: progressPercent < 60 ? COLORS.primarySoft : progressPercent < 90 ? COLORS.warningBg : COLORS.dangerBg,
									},
								]}>
								<Animated.View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: progressColor }]} />
								<Text style={styles.progressBarTextInside}>{Math.floor(progressPercent)}%</Text>
							</View>

							{/* ✅ 문제 개수 안내 텍스트 추가 */}
							{questionsToNext > 0 && <Text style={styles.progressBarTextBelow}>다음 레벨까지 {questionsToNext}문제 남음</Text>}
						</View>
						<View style={styles.titleContainer}>
							<View style={styles.titleInnerBox}>
								{/* 타이틀 라인 */}
								<View style={styles.innerTitleContainer}>
									<TouchableOpacity
										style={styles.levelTitleTouch}
										activeOpacity={0.7}
										hitSlop={HIT_SLOP}
										onPress={() => setShowLevelModal(true)}>
										<IconComponent
											type="fontAwesome6"
											name={icon}
											size={scaledSize(18)}
											color={label === '속담 마스터' ? COLORS.gold : COLORS.primaryDark} // ✅ 조건 분기
										/>
										<Text
											style={[
												styles.levelTitleText,
												// ✅ 마스터 등급만 골드 강조
												label === '속담 마스터' && styles.levelTitleTextMaster,
											]}>
											{label}
										</Text>
										<IconComponent
											type="materialIcons"
											name="info-outline"
											size={scaledSize(18)}
											color={COLORS.textSecondary}
											style={styles.levelInfoIcon}
										/>
									</TouchableOpacity>
								</View>

								{/* 점수 뱃지 */}
								{progressStatus === 'error' ? (
									// 읽기에 실패했는데 0점으로 보여주면 기록이 날아간 줄 안다 → 실패임을 밝히고 다시 시도할 길을 준다
									<TouchableOpacity
										style={[styles.scoreBadgeItem, styles.scoreBadgeItemError]}
										onPress={refreshProgress}
										activeOpacity={0.8}
										hitSlop={HIT_SLOP}>
										<IconComponent name="refresh" type="materialIcons" size={scaledSize(14)} color={COLORS.textWhite} />
										<Text style={styles.scoreBadgeTextItem}>기록을 불러오지 못했습니다 · 다시 시도</Text>
									</TouchableOpacity>
								) : (
									<View style={styles.scoreBadgeItem}>
										<IconComponent name="leaderboard" type="materialIcons" size={scaledSize(14)} color={COLORS.textWhite} />
										<Text style={styles.scoreBadgeTextItem}>
											{progressStatus === 'ready' ? `${totalScore.toLocaleString()}점` : '불러오는 중…'}
										</Text>
									</View>
								)}
								{/* 설명 */}
								<Text style={[styles.levelDescription]}>{description}</Text>
								<TowerRewardSection unlockedRewards={unlockedRewards} />
							</View>
							{earnedBadges.length > 0 && (
								<View style={styles.badgeView}>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={styles.badgeScrollContent}>
										{previewBadges.map((item, idx) => {
											const rarity = BADGE_RARITY_META[item.rarity] ?? BADGE_RARITY_META.common;
											// 인덱스에 따라 위상을 살짝 어긋나게 하여 물결치듯 펄스
											const phase = (idx % 3) / 3;
											const pulseScale = badgePulse.interpolate({
												inputRange: [0, phase, Math.min(phase + 0.5, 1), 1],
												outputRange: [1, 1, 1.18, 1],
												extrapolate: 'clamp',
											});
											const pulseLift = badgePulse.interpolate({
												inputRange: [0, phase, Math.min(phase + 0.5, 1), 1],
												outputRange: [0, 0, -scaleHeight(4), 0],
												extrapolate: 'clamp',
											});
											return (
												<TouchableOpacity
													key={item.id}
													activeOpacity={0.8}
													onPress={() => setSelectedBadge(item)}
													style={styles.badgeChipTouch}>
													<Animated.View
														style={[
															styles.iconBoxActive,
															{
																backgroundColor: rarity.soft,
																borderColor: rarity.color,
																transform: [{ scale: pulseScale }, { translateY: pulseLift }],
															},
														]}>
														<IconComponent name={item.icon} type={item.iconType} size={scaledSize(17)} color={rarity.color} />
													</Animated.View>
												</TouchableOpacity>
											);
										})}
										{extraBadgeCount > 0 && (
											<TouchableOpacity
												activeOpacity={0.85}
												onPress={() => setShowBadgeModal(true)}
												style={[styles.iconBoxActive, styles.badgeMoreChip]}>
												<Text style={styles.badgeMoreText}>+{extraBadgeCount}</Text>
											</TouchableOpacity>
										)}
									</ScrollView>
								</View>
							)}
						</View>
					</View>

					<ActionCard
						index={0}
						iconName="play-arrow"
						iconType="materialIcons"
						label="시작하기"
						description="속담 뜻, 속담 찾기, 빈칸 채우기 퀴즈를 선택해서 퀴즈를 풀어 봅니다"
						color={COLORS.secondary}
						primary
						onPress={moveToHandler.quiz}
					/>
					<ActionCard
						index={1}
						iconName="school"
						iconType="materialIcons"
						label="학습 모드"
						description="카드 형식으로 속담과 속담의 의미를 재미있게 익힙니다"
						color={COLORS.primary}
						primary
						onPress={moveToHandler.study}
					/>
					<MascotMoment
						image={require('@/assets/images/home-mascot-moments/mascot-study.png')}
						title="속담은 뜻을 알면 더 오래 남습니다"
						description="천천히 읽고, 오늘의 지혜를 하나씩 익혀 보세요."
						backgroundColor={HERO.bg}
						accentColor={HERO.accent}
					/>
					<ActionCard
						index={2}
						iconName="replay"
						iconType="materialIcons"
						label="오답 복습"
						description="틀린 퀴즈를 다시 풀면서 기억을 더 확실히 다집니다"
						color={COLORS.warning}
						onPress={moveToHandler.wrongReview}
					/>
					<ActionCard
						index={3}
						iconName="schedule"
						iconType="materialIcons"
						label="타임 챌린지"
						description="180초 제한 시간 안에 5개의 하트로 문제를 최대한 많이 풀어보세요!"
						color={COLORS.accentFlame}
						onPress={moveToHandler.timechalleng}
					/>
					<ActionCard
						index={4}
						iconName="castle"
						iconType="materialCommunityIcons"
						label="타워 챌린지"
						description="레벨별 보스를 차례로 도전하고 특별한 보상을 획득하세요!"
						color={COLORS.accentOrange}
						onPress={moveToHandler.towerchalleng}
					/>
					<MascotMoment
						image={require('@/assets/images/home-mascot-moments/mascot-challenge-final.png')}
						title="준비됐다면 기록에 도전!"
						description="빠르게 풀어도, 한 문제씩 정확하게 풀어도 좋습니다."
						backgroundColor={HERO.bg}
						accentColor={HERO.accent}
						imageOnRight
					/>
					<ActionCard
						index={5}
						iconName="star"
						iconType="materialIcons"
						label="즐겨찾기"
						description="자주 보고 싶은 속담을 모아두고 한눈에 다시 확인합니다"
						color={COLORS.accentTeal}
						onPress={moveToHandler.favorite}
						isNew
					/>
					<ActionCard
						index={6}
						iconName="menu-book"
						iconType="materialIcons"
						label="나만의 속담집"
						description="원하는 속담을 모아 나만의 속담집을 만들고 퀴즈로 풀어 봅니다"
						color={COLORS.accentSky}
						onPress={moveToHandler.myBook}
						isNew
					/>
					<MascotMoment
						image={require('@/assets/images/home-mascot-moments/mascot-collection.png')}
						title="나만의 지혜 창고를 채워 보세요"
						description="좋아하는 속담과 뱃지를 차곡차곡 모을 수 있습니다."
						backgroundColor={HERO.bg}
						accentColor={HERO.accent}
					/>

					<View style={styles.quickActionRow}>
						<TouchableOpacity style={styles.quickActionCard} activeOpacity={0.85} onPress={() => setShowDailyMission(true)}>
							<View style={[styles.quickActionIconChip, { backgroundColor: COLORS.primarySoft }]}>
								<IconComponent type="materialIcons" name="task-alt" size={scaledSize(20)} color={COLORS.primary} />
								{!missionSummary.allDone && <View style={styles.quickActionDot} />}
							</View>
							<Text style={styles.quickActionTitle}>오늘의 미션</Text>
							<Text style={styles.quickActionDesc}>
								{missionSummary.allDone
									? missionSummary.claimed
										? '완료 🎉'
										: '보상 받기 🎁'
									: `${missionSummary.done}/${missionSummary.total} 진행`}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.quickActionCard} activeOpacity={0.85} onPress={() => setShowBadgeModal(true)}>
							<View style={[styles.quickActionIconChip, { backgroundColor: COLORS.warningBg }]}>
								<IconComponent type="materialIcons" name="emoji-events" size={scaledSize(20)} color={COLORS.warning} />
							</View>
							<Text style={styles.quickActionTitle}>숨겨진 뱃지</Text>
							<Text style={styles.quickActionDesc}>모아보기</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.quickActionCard} activeOpacity={0.85} onPress={() => setShowCheckInModal(true)}>
							<View style={[styles.quickActionIconChip, { backgroundColor: COLORS.secondarySoft }]}>
								<IconComponent type="materialIcons" name="event-available" size={scaledSize(20)} color={COLORS.secondary} />
							</View>
							<Text style={styles.quickActionTitle}>오늘의 출석</Text>
							<Text style={styles.quickActionDesc}>확인하기</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</Animated.View>

			{/* 뱃지 상세 팝업 (나의 활동과 동일 컴포넌트 재사용) */}
			{/* RN Modal 두 개가 동시에 present 되면 iOS 에서 상세가 안 뜨므로, 목록이 닫힌 뒤에만 띄운다. */}
			<BadgeDetailPopup
				visible={!!selectedBadge && !showBadgeModal}
				badge={selectedBadge}
				isEarned={!!selectedBadge && earnedBadgeIds.includes(selectedBadge.id)}
				onClose={() => setSelectedBadge(null)}
			/>

			{/* 획득 가능한 뱃지 모달 */}
			<BadgeListModal
				visible={showBadgeModal}
				badges={CONST_BADGES}
				earnedIds={earnedBadgeIds}
				onClose={() => setShowBadgeModal(false)}
				onSelectBadge={(badge) => {
					// 목록 모달이 닫힌 뒤 상세를 연다(동시에 뜨면 이전 모달이 깜빡인다)
					handoff(
						() => setShowBadgeModal(false),
						() => setSelectedBadge(badge),
					);
				}}
			/>

			<DailyMissionModal
				visible={showDailyMission}
				onClose={() => {
					setShowDailyMission(false);
					refreshMissionSummary();
				}}
				onClaimed={(bonus) => {
					// ✅ 보너스 즉시 반영 (캐릭터/점수/게이지 바로 갱신)
					addScoreLocally(bonus ?? 0);
					// 스토리지 기준으로 한 번 더 정합성 맞춤
					refreshProgress();
					refreshMissionSummary();
				}}
			/>

			<LevelUpModal
				visible={showLevelUp && !!levelUp}
				level={levelUp}
				onClose={() => {
					setShowLevelUp(false);
					clearLevelUp();
				}}
			/>

			<LevelModal visible={showLevelModal} totalScore={totalScore} onClose={() => setShowLevelModal(false)} />
			<CheckInModal
				visible={showCheckInModal}
				isCheckedIn={isCheckedIn}
				checkedInDates={checkedInDates}
				mascot={mascot}
				showStamp={showStamp}
				stampStyle={stampStyle}
				petLevel={petLevel}
				onClose={() => {
					setShowCheckInModal(false);
					attendance.refresh();
					refreshProgress();
				}}
			/>
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'여기는 홈입니다. 오늘 할 학습과 도전을 한눈에 볼 수 있습니다.',
					'매일 들어와 출석하면 연속 출석일이 하루씩 쌓입니다. 하루라도 건너뛰면 1일부터 다시 시작합니다.',
					'캐릭터를 누르면 지금 등급과 성장 상태를 확인할 수 있습니다.',
					'아래 메뉴에서 학습·퀴즈·도전 중 하나를 골라 시작해보세요!',
				]}
				title="홈, 이렇게 씁니다"
			/>
		</SafeAreaView>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	main: { flex: 1, backgroundColor: COLORS.surface },
	wrapper: { flex: 1, backgroundColor: COLORS.surface },
	container: {
		flexGrow: 1,
		// 좌우 여백은 다른 화면(속담 사전/나의 활동/즐겨찾기 …)과 같은 lg 로 맞춘다.
		paddingHorizontal: SPACING_W.lg,
		paddingBottom: SPACING_H.xxxxl, // 하단 잘림 방지 여백
	},

	// ===== 상단 히어로(캐릭터/게이지/등급) 영역 =====
	heroSection: {
		marginBottom: SPACING_H.xl,
	},
	imageContainer: { alignItems: 'center' },
	streakChipWrapper: {
		alignSelf: 'stretch',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	// 물음표는 줄 가장 오른쪽에 두고, 가운데 칩 위치는 건드리지 않는다
	streakHelpButton: {
		position: 'absolute',
		right: 0,
		zIndex: 20,
	},
	image: {
		width: scaleWidth(150),
		height: scaleWidth(150),
	},
	mascoteView: {
		width: scaleWidth(180),
		height: scaleWidth(158),
		alignItems: 'center',
		justifyContent: 'center',
	},

	// ===== 말풍선 =====
	speechWrapper: { alignItems: 'center', marginBottom: scaleHeight(-10) },
	speechBubble: {
		backgroundColor: COLORS.warningSoft,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xl,
		borderRadius: RADIUS.xl,
		maxWidth: '100%',
	},
	speechTail: {
		width: 0,
		height: 0,
		borderLeftWidth: scaleWidth(10),
		borderRightWidth: scaleWidth(10),
		borderTopWidth: scaleHeight(10),
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: COLORS.warningSoft,
		alignSelf: 'center',
	},
	speechText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textStrong,
		textAlign: 'center',
		fontWeight: '600',
		lineHeight: scaledSize(22),
	},

	// ===== 펫 =====
	petView: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.xs,
		position: 'relative',
	},
	petContent: {
		position: 'absolute',
		right: -scaleWidth(24),
		top: scaleHeight(38),
		width: scaleWidth(60),
		height: scaleWidth(60),
		borderRadius: scaleWidth(60) / 2,
		borderWidth: 2,
		borderColor: COLORS.primaryDark,
		overflow: 'hidden',
	},
	petImage: { width: '100%', height: '100%' },
	petSpeechBubble: {
		position: 'absolute',
		right: -scaleWidth(64),
		top: SPACING_H.xs,
		backgroundColor: COLORS.textStrong,
		paddingVertical: SPACING_H.xsPlus,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.md,
		zIndex: 20,
	},
	petSpeechText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		textAlign: 'center',
	},
	mascotHintText: {
		marginBottom: SPACING_H.sm,
		fontSize: FONT_SIZES.xs,
		color: COLORS.textSecondary,
		fontWeight: '400',
		textAlign: 'center',
	},

	// ===== 진행 게이지 =====
	progressBarWrapper: {
		width: '100%',
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	progressBarBackground: {
		width: '85%',
		height: scaleHeight(20),
		borderRadius: RADIUS.round,
		borderWidth: 1.5,
		borderColor: COLORS.primaryDark,
		backgroundColor: COLORS.surface,
		overflow: 'hidden',
		alignSelf: 'center',
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.round,
		position: 'absolute', // ✅ 항상 왼쪽에서부터 차도록
		left: 0, // ✅ 시작 위치 고정
	},
	progressBarTextInside: {
		position: 'absolute',
		top: SPACING_H.xs / 2,
		left: 0,
		right: 0,
		textAlign: 'center',
		textAlignVertical: 'center', // Android 전용
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	progressBarTextBelow: {
		marginTop: SPACING_H.xs,
		fontSize: FONT_SIZES.xxs,
		color: COLORS.textLight,
		fontWeight: '400',
		textAlign: 'center',
	},

	// ===== 등급/점수 =====
	titleContainer: {
		alignItems: 'center',
	},
	titleInnerBox: { alignItems: 'center' },
	innerTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING_H.sm },
	levelTitleTouch: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: SPACING_H.xs,
	},
	levelTitleText: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.primaryDark,
		fontWeight: '700',
		marginLeft: SPACING_W.sm,
	},
	levelTitleTextMaster: {
		color: COLORS.gold,
	},
	levelInfoIcon: { marginLeft: SPACING_W.xs },
	scoreBadgeItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.primaryDark,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		marginBottom: SPACING_H.sm,
	},
	scoreBadgeItemError: {
		backgroundColor: COLORS.danger,
	},
	scoreBadgeTextItem: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		marginLeft: SPACING_W.xs,
	},
	levelDescription: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		fontWeight: '400',
		textAlign: 'center',
		marginBottom: SPACING_H.sm,
		lineHeight: scaledSize(20),
		paddingHorizontal: SPACING_W.sm,
	},

	// ===== 획득 뱃지 미리보기 =====
	badgeView: {
		width: '100%',
		marginTop: SPACING_H.sm,
		minHeight: scaleHeight(60),
		justifyContent: 'center',
		overflow: 'visible',
	},
	// 일정한 간격(gap)으로 균일 배치 + 적을 때는 가운데 정렬
	badgeScrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: SPACING_W.md,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
	},
	iconBoxActive: {
		width: scaleWidth(38),
		height: scaleWidth(38),
		borderRadius: scaleWidth(38) / 2,
		backgroundColor: COLORS.primarySoft,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.primaryDark,
	},
	badgeChipTouch: {
		// 터치 영역을 아이콘 칩 크기로 한정 (빈 공간 오터치 방지)
		width: scaleWidth(38),
		height: scaleWidth(38),
	},
	badgeMoreChip: {
		backgroundColor: COLORS.surfaceAlt,
		borderColor: COLORS.borderDark,
	},
	badgeMoreText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
		color: COLORS.textSecondary,
	},

	// ===== 메인 액션 카드 =====
	actionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		width: '100%',
	},
	iconCircle: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(52) / 2,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: SPACING_W.lg,
	},
	cardTextBox: {
		flex: 1,
	},
	cardTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	cardDescription: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '400',
		color: COLORS.textSecondary,
		marginTop: SPACING_H.xs,
		lineHeight: scaledSize(18),
	},
	newBadgeWrapper: {
		position: 'absolute',
		top: 0,
		right: 0,
		width: scaleWidth(56),
		height: scaleWidth(56),
		overflow: 'hidden',
		borderTopRightRadius: RADIUS.lg, // actionCard borderRadius와 동일
	},
	newBadge: {
		position: 'absolute',
		top: scaleWidth(10),
		right: -scaleWidth(14),
		width: scaleWidth(64),
		backgroundColor: COLORS.danger,
		paddingVertical: SPACING_H.xs,
		transform: [{ rotate: '45deg' }],
		alignItems: 'center',
	},
	newBadgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.xxs,
		fontWeight: '700',
		letterSpacing: 0.8,
	},

	// ===== 스크롤 구간 마스코트 =====
	mascotMoment: {
		minHeight: scaleHeight(104),
		flexDirection: 'row',
		alignItems: 'center',
		borderTopWidth: 3,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.sm,
		marginBottom: SPACING_H.md,
		overflow: 'hidden',
	},
	mascotMomentRight: {
		flexDirection: 'row-reverse',
	},
	mascotMomentImage: {
		width: scaleWidth(94),
		height: scaleWidth(94),
		marginRight: SPACING_W.md,
	},
	mascotMomentImageRight: {
		marginRight: 0,
		marginLeft: SPACING_W.md,
	},
	mascotMomentCopy: {
		flex: 1,
		alignItems: 'flex-start',
	},
	mascotMomentCopyLeft: {
		alignItems: 'flex-end',
	},
	mascotMomentTextRight: {
		textAlign: 'right',
	},
	mascotMomentTitle: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textStrong,
		lineHeight: scaledSize(21),
	},
	mascotMomentDescription: {
		marginTop: SPACING_H.xs,
		fontSize: FONT_SIZES.sm,
		fontWeight: '400',
		color: COLORS.textSecondary,
		lineHeight: scaledSize(18),
	},

	// ===== 연속 출석 칩 =====
	streakChip: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderWidth: 1,
	},
	streakChipActive: {
		backgroundColor: COLORS.accentOrangeBg,
		borderColor: COLORS.accentOrangeBorder,
	},
	streakChipIdle: {
		backgroundColor: COLORS.surfaceAlt,
		borderColor: COLORS.border,
	},
	streakChipText: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '700',
		color: COLORS.textLight,
		marginLeft: SPACING_W.xs,
	},
	streakChipTextActive: {
		color: COLORS.accentOrange,
	},

	// ===== 하단 퀵 액션 =====
	quickActionRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: SPACING_H.sm,
		gap: SPACING_W.md,
	},
	quickActionCard: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.sm,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	quickActionIconChip: {
		width: scaleWidth(44),
		height: scaleWidth(44),
		borderRadius: scaleWidth(44) / 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.sm,
	},
	quickActionDot: {
		position: 'absolute',
		top: scaleWidth(2),
		right: scaleWidth(2),
		width: scaleWidth(10),
		height: scaleWidth(10),
		borderRadius: scaleWidth(10) / 2,
		backgroundColor: COLORS.danger,
		borderWidth: 1.5,
		borderColor: COLORS.surface,
	},
	quickActionTitle: {
		color: COLORS.textStrong,
		fontWeight: '700',
		fontSize: FONT_SIZES.md,
		textAlign: 'center',
	},
	quickActionDesc: {
		color: COLORS.textSecondary,
		fontWeight: '500',
		fontSize: FONT_SIZES.xs,
		marginTop: SPACING_H.xs,
		textAlign: 'center',
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
}));

export default Home;
