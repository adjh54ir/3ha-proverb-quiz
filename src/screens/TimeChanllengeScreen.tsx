import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	Alert,
	Text,
	TouchableOpacity,
	View,
	StyleSheet,
	Platform,
	ScrollView,
	Modal,
	Animated,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from './common/atomic/IconComponent';
import { moderateScale, scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W } from '@/const/common/Theme';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeChallengeInterceptor } from '@/services/interceptor/TimeChanllengeInterceptor';
import AnimatedNumbers from 'react-native-animated-numbers';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import ProverbDetailModal from './modal/ProverbDetailModal';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import FastImage from 'react-native-fast-image';
import { playCorrect, playWrong, playCombo, playTick, playWhoosh, playFinish } from '@/utils/SoundUtils';
import { startBgm, stopBgm } from '@/utils/BgmUtils';
import DateUtils from '@/utils/DateUtils';

const MAX_LIVES = 5;
const CHOICE_COUNT = 4;

const SCORE_ENCOURAGEMENTS: { min: number; messages: string[] }[] = [
	{
		min: 1000,
		messages: [
			'🏆 정말 대단해요! 이건 거의 신급이에요!',
			'🎉 환상적인 성과! 축하드립니다!',
			'🌟 당신은 진정한 속담 마스터!',
		],
	},
	{
		min: 500,
		messages: ['💪 훌륭했어요! 많이 맞췄네요!', '🔥 집중력이 남달라요!', '👏 눈부신 실력이에요!'],
	},
	{
		min: 200,
		messages: ['👍 잘했어요! 점점 실력이 늘고 있어요!', '😊 안정적인 실력이네요!', '📈 다음엔 더 높은 점수를 노려봐요!'],
	},
	{
		min: 0,
		messages: [
			'🌱 시작이 반이에요! 포기하지 마세요!',
			'🙌 계속 도전하면 분명 좋아질 거예요!',
			'🐾 한 걸음 한 걸음 앞으로!',
		],
	},
];
const getShuffledChoices = (correct: string, allMeanings: string[]) => {
	const wrongs = allMeanings.filter((m) => m !== correct);
	const shuffled = [...wrongs.sort(() => 0.5 - Math.random()).slice(0, CHOICE_COUNT - 1), correct];
	return shuffled.sort(() => 0.5 - Math.random());
};

const InfinityQuizScreen = () => {
	const TIME_CHALLENGE_KEY = MainStorageKeyType.TIME_CHALLENGE_HISTORY;

	const navigation = useNavigation();

	const scrollViewRef = useRef<ScrollView>(null);
	const scoreAnim = useRef(new Animated.Value(1)).current;
	const comboAnim = useRef(new Animated.Value(1)).current;
	const comboShake = useRef(new Animated.Value(0)).current;
	const comboEffectAnim = useRef(new Animated.Value(0)).current;
	const [comboEffectText, setComboEffectText] = useState('');

	// 상세 모달 관련 state
	const [detailModalVisible, setDetailModalVisible] = useState(false);
	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);

	const [lives, setLives] = useState(MAX_LIVES);
	const [score, setScore] = useState(0);

	const [isToastClosable, setIsToastClosable] = useState(false);

	const [questionList, setQuestionList] = useState<MainDataType.Proverb[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [choices, setChoices] = useState<string[]>([]);
	const [isGameOver, setIsGameOver] = useState(false);
	const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
	const [selectedChoice, setSelectedChoice] = useState<string | null>(null); // 사용자가 고른 보기
	const [showExitModal, setShowExitModal] = useState(false);
	const [combo, setCombo] = useState(0);
	const [maxCombo, setMaxCombo] = useState(0);
	const [hasUsedSkip, setHasUsedSkip] = useState(false);
	const [timeLeftMs, setTimeLeftMs] = useState(180_000); // 180초 → 180,000ms
	const [hasUsedChance, setHasUsedChance] = useState(false);
	const [chanceModalVisible, setChanceModalVisible] = useState(false);
	const [showChanceAd, setShowChanceAd] = useState(false);
	const [chanceData, setChanceData] = useState<{
		example: string[];
		category?: string;
		level?: string;
		sameProverb?: string[];
	} | null>(null);

	const formattedTime = `${(timeLeftMs / 1000).toFixed(2)}초`;
	const [isPaused, setIsPaused] = useState(false);
	const [heartAnimations, setHeartAnimations] = useState(Array.from({ length: MAX_LIVES }, () => new Animated.Value(1)));

	const [isCountingDown, setIsCountingDown] = useState(false);
	const [count, setCount] = useState(3);
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const [showConfetti, setShowConfetti] = useState(false);

	const [resultMap, setResultMap] = useState<{ [id: number]: 'correct' | 'wrong' }>({});
	const [gameResult, setGameResult] = useState<MainDataType.TimeChallengeResult | null>(null);
	const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

	const [showScrollTop, setShowScrollTop] = useState(false);
	const labelColors = [COLORS.secondary, COLORS.primary, COLORS.accentFlame, COLORS.accentPink]; // A, B, C, D 색상 (각각 다르게)
	const solvedProverbs = questionList.slice(0, currentIndex + 1).filter((q) => resultMap[q.id]);

	const [bonusHistory, setBonusHistory] = useState<number[]>([]);
	const [toastMessage, setToastMessage] = useState('');
	const toastOpacity = useRef(new Animated.Value(0)).current;

	const [encouragements, setEncouragements] = useState<string[]>([]);
	const [animatedScore, setAnimatedScore] = useState(0);

	// 문제 전환 진입 애니메이션 (fade + slide-up)
	const questionFade = useRef(new Animated.Value(0)).current;
	const questionSlide = useRef(new Animated.Value(scaleHeight(12))).current;
	// 타이머 정리를 위한 ref (카운트다운 / 결과 점수 딜레이)
	const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const scoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const allProverbs = ProverbServices.selectProverbList();
		const shuffled = allProverbs.sort(() => 0.5 - Math.random());
		setQuestionList(shuffled);
	}, []);

	useEffect(() => {
		if (gameResult) {
			// 애니메이션을 위해 100ms 딜레이 후 점수 적용
			scoreTimeoutRef.current = setTimeout(() => {
				setAnimatedScore(gameResult.finalScore);
			}, 100);
		}
		return () => {
			if (scoreTimeoutRef.current) {
				clearTimeout(scoreTimeoutRef.current);
			}
		};
	}, [gameResult]);

	// 문제가 바뀔 때마다 카드 진입 애니메이션
	useEffect(() => {
		if (isGameOver) {
			return;
		}
		questionFade.setValue(0);
		questionSlide.setValue(scaleHeight(12));
		const entrance = Animated.parallel([
			Animated.timing(questionFade, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(questionSlide, { toValue: 0, duration: 250, useNativeDriver: true }),
		]);
		entrance.start();
		return () => entrance.stop();
	}, [currentIndex, isGameOver, questionFade, questionSlide]);

	// 언마운트 시 카운트다운 타이머 / 애니메이션 정리
	useEffect(() => {
		return () => {
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
			}
			if (countdownTimeoutRef.current) {
				clearTimeout(countdownTimeoutRef.current);
			}
			scaleAnim.stopAnimation();
			scoreAnim.stopAnimation();
			comboAnim.stopAnimation();
			comboShake.stopAnimation();
			comboEffectAnim.stopAnimation();
			stopBgm(); // 🎵 화면 이탈 시 BGM 정리(메모리 누수 방지)
			toastOpacity.stopAnimation();
		};
	}, [scaleAnim, scoreAnim, comboAnim, comboShake, comboEffectAnim, toastOpacity]);

	useEffect(() => {
		if (questionList.length > 0 && currentIndex < questionList.length) {
			const current = questionList[currentIndex];
			const allMeanings = questionList.map((q) => q.longMeaning || q.meaning);
			const newChoices = getShuffledChoices(current.longMeaning || current.meaning, allMeanings);
			setChoices(newChoices);
		}
	}, [questionList, currentIndex]);

	useEffect(() => {
		if (isGameOver && gameResult) {
			setShowConfetti(true);
			const score = gameResult.finalScore;

			// 점수에 맞는 메시지 세트 찾기
			const match = SCORE_ENCOURAGEMENTS.find(({ min }) => score >= min);
			const shuffled = match?.messages.sort(() => 0.5 - Math.random()) ?? [];
			setEncouragements(shuffled.slice(0, 3)); // 최대 3개만 표시
		}
	}, [isGameOver, gameResult]);

	useEffect(() => {
		if (isGameOver || isPaused) {
			return;
		}

		const interval = setInterval(() => {
			setTimeLeftMs((prev) => {
				if (prev <= 100) {
					clearInterval(interval);
					setIsGameOver(true);
					return 0;
				}
				return prev - 100;
			});
		}, 100);

		return () => clearInterval(interval);
	}, [isGameOver, isPaused]); // isPaused 추가!

	// ⏱️ 마지막 5초 카운트다운 효과음 (1초 단위로 한 번씩만)
	useEffect(() => {
		if (isGameOver || isPaused) {
			return;
		}
		const secondsLeft = Math.ceil(timeLeftMs / 1000);
		if (secondsLeft > 0 && secondsLeft <= 5) {
			playTick();
		}
	}, [Math.ceil(timeLeftMs / 1000), isGameOver, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

	// 🎉 게임 종료 사운드 + BGM 정리
	useEffect(() => {
		if (isGameOver) {
			stopBgm();
			playFinish();
		}
	}, [isGameOver]);

	// lives 감소 시 애니메이션
	useEffect(() => {
		if (lives >= MAX_LIVES) {
			return;
		}
		const indexToAnimate = lives; // ex: 4 -> 3일 때 index 3 애니메이션
		const heartAnim = Animated.sequence([
			Animated.timing(heartAnimations[indexToAnimate], {
				toValue: 0.8,
				duration: 250,
				useNativeDriver: true,
			}),
			Animated.timing(heartAnimations[indexToAnimate], {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}),
		]);
		heartAnim.start();
		return () => heartAnim.stop();
	}, [lives]);

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
				setShowScrollTop(offsetY > moderateScale(100));
			},
			/**
			 * 스크롤 최상단으로 이동
			 * @return {void}
			 */
			toTop: (): void => {
				scrollViewRef.current?.scrollTo({ y: 0, animated: true });
			},

			/**
			 * 스크롤 뷰 최하단으로 이동
			 * @return {void}
			 */
			toBottom: (): void => {
				setTimeout(() => {
					scrollViewRef.current?.scrollToEnd({ animated: true });
				}, 100);
			},
		};
	})();

	const saveChallengeResultToStorage = async (result: MainDataType.TimeChallengeResult) => {
		try {
			const existingData = await AsyncStorage.getItem(TIME_CHALLENGE_KEY);
			const history: MainDataType.TimeChallengeHistory = existingData ? JSON.parse(existingData) : [];
			const updated = [result, ...history]; // 최근 기록을 맨 앞에
			await AsyncStorage.setItem(TIME_CHALLENGE_KEY, JSON.stringify(updated));
		} catch (e) {
			console.error('⚠️ Failed to save TimeChallenge result', e);
		}
	};

	const animateScale = () => {
		scaleAnim.setValue(1.5);
		Animated.spring(scaleAnim, {
			toValue: 1,
			useNativeDriver: true,
			friction: 4,
		}).start();
	};

	const startCountdownAndReset = () => {
		setIsCountingDown(true);
		setIsFeedbackOpen(false); // ✅ 보기가 열려있다면 닫는다

		let countdown = 3;
		setCount(countdown); // 시작 시 3 한 번만 세팅
		animateScale(); // 첫 애니메이션도 같이 실행

		if (countdownTimerRef.current) {
			clearInterval(countdownTimerRef.current);
		}
		const timer = setInterval(() => {
			countdown--;

			if (countdown < 0) {
				clearInterval(timer);

				countdownTimeoutRef.current = setTimeout(() => {
					setIsCountingDown(false);
					playWhoosh(); // 🎬 챌린지 시작 사운드
					startBgm('time'); // 🎵 타임챌린지 BGM
					resetGame(); // 기존 resetGame 호출
				}, 800);
				return;
			}

			setCount(countdown);
			animateScale();
			playTick(); // ⏱️ 3·2·1 카운트다운
		}, 1000);
		countdownTimerRef.current = timer;
	};

	const handleGameOver = () => {
		const quizDate = DateUtils.now().toISOString(); // 예: '2025-06-26T14:20:00.000Z'

		const totalQuestions = currentIndex + 1;
		const correctQuizIdList = questionList
			.slice(0, currentIndex + 1)
			.filter((q) => resultMap[q.id] === 'correct')
			.map((q) => q.id);
		const wrongQuizIdList = questionList
			.slice(0, currentIndex + 1)
			.filter((q) => resultMap[q.id] === 'wrong')
			.map((q) => q.id);

		const solvedCount = correctQuizIdList.length + wrongQuizIdList.length;

		const result: MainDataType.TimeChallengeResult = {
			quizDate,
			finalScore: score,
			totalQuestions: solvedCount, // 👈 여기 수정
			solvedQuestions: correctQuizIdList.length + wrongQuizIdList.length,
			correctCount: correctQuizIdList.length,
			wrongCount: wrongQuizIdList.length,
			maxCombo,
			timeUsedMs: 180000 - timeLeftMs,
			hasUsedChance,
			hasUsedSkip,
			quizIdList: questionList.slice(0, currentIndex + 1).map((q) => q.id),
			correctQuizIdList,
			wrongQuizIdList,
		};

		setAnimatedScore(score);

		saveChallengeResultToStorage(result);
		setGameResult(result); // ✅ 상태 저장
	};

	const handleAnswer = useCallback(
		(choice: string) => {
			const correct = questionList[currentIndex].longMeaning || questionList[currentIndex].meaning;
			const isCorrect = choice === correct;
			setSelectedChoice(choice); // 사용자가 고른 보기 기록

			// 선택 즉시 UI 반응 방지 → 약간 딜레이 후 처리
			setTimeout(() => {
				if (isCorrect) {
					playCorrect(); // 🔊 정답
					setResultMap((prev) => ({ ...prev, [questionList[currentIndex].id]: 'correct' }));
					setFeedback('correct');
					// ✅ 점수 증가 → 애니메이션 → 상태 업데이트 순서 변경
					setScore((prev) => {
						const baseScore = 10;

						// 👇 콤보에 따른 보너스 점수 계산
						let bonusScore = 0;
						const newCombo = combo + 1;

						if (newCombo === 3) {
							bonusScore = 5;
						} else if (newCombo === 4) {
							bonusScore = 10;
						} else if (newCombo === 5) {
							bonusScore = 20;
						} else if (newCombo >= 6) {
							bonusScore = 30;
						}

						const totalScore = prev + baseScore + bonusScore;

						// 🎯 점수 기반 보너스 인터셉터 호출
						const bonus = TimeChallengeInterceptor(totalScore, bonusHistory);

						if (bonus.addedTime > 0) {
							setTimeLeftMs((prevTime) => prevTime + bonus.addedTime);
						}
						if (bonus.addedHeart) {
							setLives((prevLives) => (prevLives < MAX_LIVES ? prevLives + 1 : prevLives));
						}
						if (bonus.message) {
							showToast(bonus.message);
						}
						if (bonus.updatedHistory) {
							setBonusHistory(bonus.updatedHistory);
						}

						return totalScore;
					});
					triggerScoreAnim(); // 점수 애니메이션
					if (combo + 1 >= 2) {
						triggerComboAnim(); // 콤보 애니메이션 (2콤보 이상일 때만)
						playCombo(combo + 1); // 🔊 콤보가 쌓일수록 음이 높아진다
					}

					// ✅ 콤보 증가도 마찬가지로 처리
					setCombo((prev) => {
						const newCombo = prev + 1;
						if (newCombo >= 2) {
							setTimeout(() => {
								triggerComboAnim();
								triggerComboShake();
								triggerComboEffect(newCombo); // 👈 여기 추가
							}, 0);
						}
						if (newCombo > maxCombo) {
							setMaxCombo(newCombo);
						}
						return newCombo;
					});
				} else {
					playWrong(); // 🔊 오답
					setResultMap((prev) => ({ ...prev, [questionList[currentIndex].id]: 'wrong' }));
					setFeedback('wrong');
					setLives((prev) => prev - 1);
					setCombo(0);
				}

				setTimeout(() => {
					setFeedback(null);
					setSelectedChoice(null);
					// 수정 코드
					const newLives = isCorrect ? lives : lives - 1;

					if (newLives <= 0) {
						handleGameOver();
						setIsGameOver(true);
					} else {
						setCurrentIndex((prev) => prev + 1);
					}
				}, 500);
			}, 150); // ✅ 150ms 딜레이 후 반응
		},
		[questionList, currentIndex, lives],
	);

	const triggerScoreAnim = () => {
		scoreAnim.setValue(1.4);
		Animated.spring(scoreAnim, {
			toValue: 1,
			friction: 4,
			useNativeDriver: true,
		}).start();
	};

	const triggerComboAnim = () => {
		comboAnim.setValue(1.4);
		Animated.spring(comboAnim, {
			toValue: 1,
			friction: 4,
			useNativeDriver: true,
		}).start();
	};
	const showLongToast = (message: string) => {
		setIsToastClosable(true); // 닫기 버튼 보이기
		setToastMessage(message);
		toastOpacity.setValue(0);
		Animated.sequence([
			Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
			Animated.delay(5000), // 5초 이상 유지
			Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
		]).start(() => {
			setToastMessage('');
		});
	};

	const triggerComboShake = () => {
		comboShake.setValue(0);
		Animated.sequence([
			Animated.timing(comboShake, {
				toValue: 1,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(comboShake, {
				toValue: -1,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(comboShake, {
				toValue: 0,
				duration: 50,
				useNativeDriver: true,
			}),
		]).start();
	};
	const triggerComboEffect = (comboValue: number) => {
		let bonus = 0;
		if (comboValue === 3) {
			bonus = 5;
		} else if (comboValue === 4) {
			bonus = 10;
		} else if (comboValue === 5) {
			bonus = 20;
		} else if (comboValue >= 6) {
			bonus = 30;
		}

		if (comboValue >= 2) {
			setComboEffectText(`🔥 ${comboValue} Combo! ${bonus > 0 ? `+${bonus}점` : ''}`);
			comboEffectAnim.setValue(0);
			Animated.timing(comboEffectAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}).start(() => {
				setComboEffectText('');
			});
		}
	};

	const showToast = (message: string) => {
		setIsToastClosable(false); // 닫기 버튼 숨기기
		setToastMessage(message);
		toastOpacity.setValue(0);
		Animated.sequence([
			Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
			Animated.delay(1200),
			Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
		]).start();
	};

	const resetGame = () => {
		const shuffled = ProverbServices.selectProverbList().sort(() => 0.5 - Math.random());
		setQuestionList(shuffled);
		setScore(0);
		setLives(MAX_LIVES);
		setCurrentIndex(0);
		setFeedback(null);
		setCombo(0);
		setMaxCombo(0);
		setHasUsedSkip(false);
		setTimeLeftMs(180_000);
		setIsGameOver(false);
		setIsFeedbackOpen(false);
		setHasUsedChance(false);
		// ✅ 하트 애니메이션 초기화
		heartAnimations.forEach((anim) => anim.setValue(1));
	};

	if (questionList.length === 0) {
		return (
			<SafeAreaView>
				<Text>문제를 불러오는 중...</Text>
			</SafeAreaView>
		);
	}

	const current = questionList[currentIndex];

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<ScrollView
				ref={scrollViewRef}
				style={{ flex: 1 }}
				contentContainerStyle={isGameOver ? styles.resultScrollContent : styles.quizScrollContent}
				onScroll={scrollHandler.onScroll}
				keyboardShouldPersistTaps="handled">
				{!isGameOver && (
					<View style={styles.statusBoxRow}>
						{/* 🎯 점수 */}
						<View style={styles.statusBox}>
							<View style={styles.iconWithLabel}>
								<Text style={styles.statusLabel}>🎯 점수</Text>
							</View>
							<Animated.Text
								style={[
									styles.statusValue,
									{
										transform: [{ scale: scoreAnim }],
									},
								]}>
								{score} 점
							</Animated.Text>
						</View>

						{/* 📝 문제 */}
						<View style={styles.statusBox}>
							<View style={styles.iconWithLabel}>
								<Text style={styles.statusLabel}>📝 문제</Text>
							</View>
							<Text style={styles.statusValue}>
								{currentIndex + 1} / {questionList.length}
							</Text>
						</View>

						{/* 🔥 콤보 */}
						<View style={styles.statusBox}>
							<View style={styles.iconWithLabel}>
								<Text style={styles.statusLabel}>🔥 콤보</Text>
							</View>
							<Animated.Text
								style={[
									styles.statusValue,
									{
										transform: [
											{ scale: comboAnim },
											{
												translateX: comboShake.interpolate({
													inputRange: [-1, 1],
													outputRange: [-5, 5],
												}),
											},
										],
									},
									combo >= 2 && { color: COLORS.danger },
								]}>
								{combo} Combo
							</Animated.Text>
						</View>
					</View>
				)}
				{!isGameOver && (
					<View style={styles.timeBoxWrapper}>
						<View style={styles.timeBox}>
							<IconComponent name="clock-o" type="FontAwesome" color={COLORS.primary} size={scaledSize(18)} />
							<Text style={styles.timeText}>남은 시간: {formattedTime}</Text>
						</View>
					</View>
				)}
				{/* 💓 하트 최상단 단독 표시 */}

				{!isGameOver && (
					<View style={styles.lifeBarWrapper}>
						{!hasUsedChance && (
							<View style={styles.leftFixed}>
								<TouchableOpacity
									onPress={() => {
										const current = questionList[currentIndex];
										setChanceData({
											example: current.example ?? [],
											category: current.category,
											level: current.levelName,
											sameProverb: (current.sameProverb ?? []).filter((item) => item.trim()),
										});
										setHasUsedChance(true); // ✅ 사용 처리
										setIsPaused(true); // ✅ 찬스 팝업 동안 타이머 일시정지
										setShowChanceAd(true); // ✅ 찬스 사용 시 무조건 광고 노출 후 힌트 표시
									}}
									style={styles.chanceContent}
									activeOpacity={0.8}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
									<IconComponent name="magic" type="FontAwesome" color={COLORS.primaryDark} size={scaledSize(12)} />
									<Text style={styles.chanceText}>찬스</Text>
								</TouchableOpacity>
							</View>
						)}

						{/* 가운데: 하트 */}
						<View style={styles.heartCentered}>
							{Array.from({ length: MAX_LIVES }).map((_, i) => (
								<Animated.View
									key={i}
									style={{
										transform: [{ scale: heartAnimations[i] }],
										marginHorizontal: SPACING_W.xxs,
									}}>
									<IconComponent
										name="heart"
										type="FontAwesome"
										size={scaledSize(15)}
										color={i < lives ? COLORS.danger : COLORS.border}
									/>
								</Animated.View>
							))}
						</View>

						{/* 오른쪽: 스킵 버튼 */}
						{!hasUsedSkip && (
							<TouchableOpacity
								onPress={() => {
									setHasUsedSkip(true);
									setCurrentIndex((prev) => prev + 1);
									setFeedback(null);
									setCombo(0);
									showToast('⏭️ 이번 문제는 건너뛸게요! 스킵은 게임당 한 번만 사용할 수 있어요');
								}}
								style={styles.rightFixed}
								activeOpacity={0.8}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
								<View style={styles.skipContent}>
									<IconComponent name="forward" type="FontAwesome" color={COLORS.primaryDark} size={scaledSize(12)} />
									<Text style={styles.skipText}>스킵</Text>
								</View>
							</TouchableOpacity>
						)}
					</View>
				)}

				{/* 👇 스킵 버튼을 문제 텍스트 위에 둠 */}
				{isGameOver ? (
					<>
						{showConfetti && (
							<View style={styles.globalConfettiWrapper}>
								<ConfettiCannon
									count={200}
									origin={{ x: scaleWidth(180), y: 0 }}
									fadeOut
									explosionSpeed={500}
									fallSpeed={2500}
								/>
							</View>
						)}
						<View style={styles.resultWrapper}>
							<View style={styles.gameOverBox}>
								<View style={styles.resultHeader}>
									<FastImage source={require('@/assets/images/screen-heroes/time-result.png')} style={styles.timeResultImage} resizeMode="contain" />
									<Text style={styles.resultHeaderTitle}>타임 챌린지 결과</Text>
									<Text style={styles.resultHeaderSub}>수고했어요! 결과를 확인해 보세요</Text>
								</View>
								{gameResult && (
									<View style={styles.scoreHero}>
										<Text style={styles.scoreHeroLabel}>최종 점수</Text>
										<View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
											<AnimatedNumbers
												animateToNumber={animatedScore}
												animationDuration={3000}
												fontStyle={styles.scoreHeroNumber}
												includeComma
											/>
											<Text style={styles.scoreHeroUnit}>점</Text>
										</View>
										<Text style={styles.scoreHeroMsg}>{encouragements[0]}</Text>
									</View>
								)}

								{gameResult && (
									<>
										{/* ✅ 정답 / 오답 강조 카드 */}
										<View style={styles.resultScoreCardRow}>
											<View style={[styles.resultScoreCard, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.successBorder }]}>
												<View style={[styles.resultScoreIcon, { backgroundColor: COLORS.primary }]}>
													<IconComponent name="check" type="materialIcons" color={COLORS.textWhite} size={scaledSize(16)} />
												</View>
												<Text style={[styles.resultScoreValue, { color: COLORS.primaryDark }]}>{gameResult.correctCount}</Text>
												<Text style={styles.resultScoreLabel}>정답</Text>
											</View>
											<View style={[styles.resultScoreCard, { backgroundColor: COLORS.dangerSoftBg, borderColor: COLORS.dangerBorderSoft }]}>
												<View style={[styles.resultScoreIcon, { backgroundColor: COLORS.danger }]}>
													<IconComponent name="close" type="materialIcons" color={COLORS.textWhite} size={scaledSize(16)} />
												</View>
												<Text style={[styles.resultScoreValue, { color: COLORS.dangerDark }]}>{gameResult.wrongCount}</Text>
												<Text style={styles.resultScoreLabel}>오답</Text>
											</View>
										</View>

										<View style={styles.statList}>
											<View style={styles.statLine}>
												<Text style={styles.statLineLabel}>푼 문제</Text>
												<Text style={styles.statLineValue}>{gameResult.totalQuestions}문제</Text>
											</View>
											<View style={styles.statLineDivider} />
											<View style={styles.statLine}>
												<Text style={styles.statLineLabel}>최대 콤보</Text>
												<Text style={[styles.statLineValue, { color: COLORS.accentFlame }]}>{gameResult.maxCombo} Combo</Text>
											</View>
											<View style={styles.statLineDivider} />
											<View style={styles.statLine}>
												<Text style={styles.statLineLabel}>소요 시간</Text>
												<Text style={styles.statLineValue}>{(gameResult.timeUsedMs / 1000).toFixed(1)}초</Text>
											</View>
										</View>

										{(gameResult.hasUsedSkip || gameResult.hasUsedChance) && (
											<View style={styles.usedTagRow}>
												{gameResult.hasUsedSkip && (
													<View style={styles.usedTag}>
														<Text style={styles.usedTagText}>⏭ 스킵 사용</Text>
													</View>
												)}
												{gameResult.hasUsedChance && (
													<View style={styles.usedTag}>
														<Text style={styles.usedTagText}>✨ 찬스 사용</Text>
													</View>
												)}
											</View>
										)}
									</>
								)}

								<View style={styles.resultButtons}>
									{/* 나의 랭킹 보러가기 (보조) */}
									<TouchableOpacity
										style={[styles.resultBtn, styles.resultBtnSecondary]}
										activeOpacity={0.85}
										onPress={() => {
											//@ts-ignore
											navigation.navigate(Paths.INIT_TIME_CHANLLENGE); // 실제 경로로 변경
										}}>
										<IconComponent
											name="bar-chart"
											type="FontAwesome"
											size={scaledSize(16)}
											color={COLORS.secondary}
											style={{ marginRight: SPACING_W.xsPlus }}
										/>
										<Text style={styles.resultBtnSecondaryText}>랭킹</Text>
									</TouchableOpacity>

									{/* 다시 도전하기 (주요) */}
									<TouchableOpacity
										style={[styles.resultBtn, styles.resultBtnPrimary]}
										activeOpacity={0.85}
										onPress={startCountdownAndReset}>
										<IconComponent
											name="refresh"
											type="FontAwesome"
											color={COLORS.textWhite}
											size={scaledSize(16)}
											style={{ marginRight: SPACING_W.xsPlus }}
										/>
										<Text style={styles.resultBtnPrimaryText}>다시 도전</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>

						<TouchableOpacity
							activeOpacity={0.8}
							onPress={() => setIsFeedbackOpen(!isFeedbackOpen)}
							style={{
								backgroundColor: COLORS.surfaceAlt,
								borderRadius: RADIUS.sm,
								paddingVertical: SPACING_H.smPlus,
								paddingHorizontal: SPACING_W.lg,
								marginTop: SPACING_H.md,
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}>
							<Text
								style={{
									fontSize: FONT_SIZES.mdPlus,
									fontWeight: '600',
									color: COLORS.text,
									marginRight: SPACING_W.xs,
								}}>
								정답과 해설 보기
							</Text>
							<IconComponent
								name={isFeedbackOpen ? 'angle-up' : 'angle-down'}
								type="FontAwesome"
								color={COLORS.text}
								size={scaledSize(18)}
							/>
						</TouchableOpacity>

						{/* 문제 피드백 리스트 */}
						{/* 문제 피드백 리스트 */}
						{isFeedbackOpen && (
							<View style={styles.feedbackList}>
								{solvedProverbs.map((q, i) => {
									const isCorrect = resultMap[q.id] === 'correct';
									return (
										<TouchableOpacity
											key={q.id}
											activeOpacity={0.7}
											onPress={() => {
												setSelectedProverb(q);
												setDetailModalVisible(true);
											}}
											style={[styles.feedbackItem, { backgroundColor: isCorrect ? COLORS.secondaryBg : COLORS.dangerSoftBg }]}>
											<View style={styles.feedbackContent}>
												<View style={{ flex: 1 }}>
													<View style={styles.feedbackTitleRow}>
														<Text style={[styles.feedbackTitle, { color: COLORS.textStrong, flex: 1 }]} numberOfLines={1}>
															{i + 1}. {q.proverb}
														</Text>
														<View style={[styles.feedbackResultBadge, { backgroundColor: isCorrect ? COLORS.primarySoft : COLORS.dangerBg }]}>
															<IconComponent
																type="materialIcons"
																name={isCorrect ? 'check-circle' : 'cancel'}
																size={scaledSize(12)}
																color={isCorrect ? COLORS.primaryDark : COLORS.dangerDark}
															/>
															<Text style={[styles.feedbackResultBadgeText, { color: isCorrect ? COLORS.primaryDark : COLORS.dangerDark }]}>
																{isCorrect ? '정답' : '오답'}
															</Text>
														</View>
													</View>
													<Text style={styles.feedbackMeaning}>
														의미: <Text style={{ fontWeight: '700' }}>{q.longMeaning || q.meaning}</Text>
													</Text>
												</View>
												<IconComponent
													name="chevron-right"
													type="FontAwesome"
													size={scaledSize(16)}
													color={COLORS.textLight}
													style={styles.feedbackArrow}
												/>
											</View>
										</TouchableOpacity>
									);
								})}
							</View>
						)}
					</>
				) : (
					<Animated.View
						style={[
							styles.questionBox,
							feedback === 'correct' && styles.questionBoxCorrect,
							feedback === 'wrong' && styles.questionBoxWrong,
							{ opacity: questionFade, transform: [{ translateY: questionSlide }] },
						]}>
						<View style={{ marginBottom: SPACING_H.lg, alignItems: 'center' }}>
							<Text style={styles.questionText}>
								<Text style={styles.questionIdiom}>
									{current.proverb}
								</Text>
								<Text style={styles.questionAsk}>{'\n'}의미는?</Text>
							</Text>
							{feedback && (
								<View
									style={[styles.feedbackTag, feedback === 'correct' ? styles.feedbackTagCorrect : styles.feedbackTagWrong]}>
									<IconComponent
										type="materialIcons"
										name={feedback === 'correct' ? 'check-circle' : 'cancel'}
										size={scaledSize(14)}
										color={feedback === 'correct' ? COLORS.primaryDark : COLORS.dangerDark}
									/>
									<Text style={[styles.feedbackTagText, { color: feedback === 'correct' ? COLORS.primaryDark : COLORS.dangerDark }]}>
										{feedback === 'correct' ? '정답입니다' : '오답입니다'}
									</Text>
								</View>
							)}
						</View>

						{choices.map((choice, index) => {
							const isCorrectAnswer = choice === (current.longMeaning || current.meaning);
							const isUserSelected = selectedChoice === choice;
							const wasUserWrong = feedback === 'wrong' && isUserSelected && !isCorrectAnswer;
							// 채점 후 정답 카드 / 사용자가 고른 오답 카드 강조
							const showCorrect = feedback !== null && isCorrectAnswer;
							const showWrong = wasUserWrong;
							const isDimmed = feedback !== null && !showCorrect && !showWrong;

							return (
								<TouchableOpacity
									key={choice}
									style={[
										styles.choiceBtn,
										showCorrect && styles.choiceBtnCorrect,
										showWrong && styles.choiceBtnWrong,
										isDimmed && styles.choiceBtnDimmed,
									]}
									onPress={() => handleAnswer(choice)}
									disabled={feedback !== null}
									activeOpacity={0.85}>
									<View
										style={[
											styles.choiceLabelBadge,
											{ backgroundColor: labelColors[index] + '1A', borderColor: labelColors[index] + '55' },
										]}>
										<Text style={[styles.choiceLabelText, { color: labelColors[index] }]}>{String.fromCharCode(65 + index)}</Text>
									</View>
									<Text
										style={[styles.choiceBtnText, showCorrect && styles.choiceTextCorrect, showWrong && styles.choiceTextWrong]}>
										{choice}
									</Text>
									{showCorrect && (
										<IconComponent name="check-circle" type="materialIcons" size={scaledSize(20)} color={COLORS.primaryDark} />
									)}
									{showWrong && <IconComponent name="cancel" type="materialIcons" size={scaledSize(20)} color={COLORS.dangerDark} />}
								</TouchableOpacity>
							);
						})}
					</Animated.View>
				)}
			</ScrollView>

			<View style={styles.bottomExitWrapper}>
				<TouchableOpacity
					style={styles.exitButton}
					activeOpacity={0.85}
					onPress={() => {
						setIsPaused(true); // 타이머 일시정지
						setShowExitModal(true);
					}}>
					<Text style={styles.exitButtonText}>종료하기</Text>
				</TouchableOpacity>
			</View>
			<ProverbDetailModal
				visible={detailModalVisible}
				proverb={selectedProverb}
				onClose={() => setDetailModalVisible(false)}
			/>

			{/* ✅ 찬스 광고 (광고 종료 후 힌트 모달 표시) */}
			{showChanceAd && (
				<AdmobFrontAd
					onAdClosed={() => {
						setShowChanceAd(false);
						setChanceModalVisible(true);
					}}
				/>
			)}

			{/* ✅ 찬스 힌트 모달 */}
			<Modal
				visible={chanceModalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => {
					setChanceModalVisible(false);
					setIsPaused(false); // ✅ 닫힐 때 타이머 재개
				}}>
				<View style={styles.modalOverlay}>
					<View style={styles.chanceModalCard}>
						<View style={styles.chanceModalHeaderIcon}>
							<IconComponent name="magic" type="FontAwesome" color={COLORS.textWhite} size={scaledSize(22)} />
						</View>
						<Text style={styles.chanceModalTitle}>찬스 힌트</Text>
						<Text style={styles.chanceModalSubtitle}>아래 단서를 모두 활용해 정답을 찾아보세요</Text>

						{/* 메타 정보 칩 (카테고리 · 난이도) */}
						<View style={styles.chanceMetaRow}>
							{!!chanceData?.category && (
								<View style={styles.chanceMetaChip}>
									<Text style={styles.chanceMetaChipText}>{chanceData.category}</Text>
								</View>
							)}
							{!!chanceData?.level && (
								<View style={styles.chanceMetaChip}>
									<Text style={styles.chanceMetaChipText}>{chanceData.level}</Text>
								</View>
							)}
						</View>

						{!!chanceData?.sameProverb?.length && (
							<View style={styles.chanceKeywordBox}>
								<Text style={styles.chanceExampleLabel}>🔑 동의속담</Text>
								<View style={styles.chanceKeywordWrap}>
									{chanceData.sameProverb.map((same, i) => (
										<View key={i} style={styles.chanceKeywordChip}>
											<Text style={styles.chanceKeywordText}>{same}</Text>
										</View>
									))}
								</View>
							</View>
						)}

						{!!chanceData?.example?.length && (
							<View style={styles.chanceExampleBox}>
								<Text style={styles.chanceExampleLabel}>📘 예문</Text>
								{chanceData.example.map((ex, i) => (
									<Text key={i} style={styles.chanceExampleText}>
										· {ex}
									</Text>
								))}
							</View>
						)}

						<TouchableOpacity
							style={styles.chanceModalButton}
							onPress={() => {
								setChanceModalVisible(false);
								setIsPaused(false); // ✅ 확인 시 타이머 재개
							}}
							activeOpacity={0.85}>
							<Text style={styles.chanceModalButtonText}>확인</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{showExitModal && (
				<Modal visible transparent animationType="fade">
					<View style={styles.modalOverlay}>
						<View style={styles.exitModal}>
							<Text style={styles.exitModalTitle}>타임 챌린지를 종료하시겠어요?</Text>
							<Text style={styles.exitModalMessage}>진행 중인 퀴즈는 저장되지 않습니다.</Text>
							<View style={styles.modalButtonRow}>
								<TouchableOpacity
									activeOpacity={0.85}
									style={[styles.modalBackButton, { backgroundColor: COLORS.borderDark }]}
									onPress={() => {
										setShowExitModal(false);
										setIsPaused(false); // 타이머 재개
									}}>
									<Text style={styles.modalButtonText}>취소</Text>
								</TouchableOpacity>
								<TouchableOpacity
									activeOpacity={0.85}
									style={styles.exitModalConfirmButton}
									onPress={() => {
										setShowExitModal(false);
										setIsPaused(false); // 상태 초기화
										//@ts-ignore
										navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
									}}>
									<Text style={styles.modalButtonText}>종료하기</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			)}

			{isCountingDown && (
				<View style={StyleSheet.absoluteFillObject}>
					<View style={styles.countdownOverlay}>
						<Animated.View style={[styles.countdownCircle, { transform: [{ scale: scaleAnim }] }]}>
							<Text style={styles.countdownText}>{count === 0 ? '시작!' : String(count)}</Text>
						</Animated.View>
						<View style={styles.countdownMessageWrapper}>
							<Text style={styles.countdownMessage}>
								{count === 3 ? '심호흡 하세요' : count === 2 ? '준비하세요!' : count === 1 ? '곧 시작됩니다!' : '화이팅!'}
							</Text>
						</View>
					</View>
				</View>
			)}

			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop} activeOpacity={0.85}>
					<IconComponent type="MaterialIcons" name="arrow-upward" size={scaledSize(24)} color={COLORS.textWhite} />
				</TouchableOpacity>
			)}

			{comboEffectText !== '' && (
				<Animated.View
					pointerEvents="none"
					style={{
						position: 'absolute',
						top: '40%', // 필요 시 '50%' 또는 카드의 정확한 위치로 수정
						left: 0,
						right: 0,
						alignItems: 'center',
						opacity: comboEffectAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [1, 0],
						}),
						transform: [
							{
								translateY: comboEffectAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [0, -30], // 살짝 위로 올라가게
								}),
							},
						],
					}}>
					<Text
						style={{
							fontSize: scaledSize(36),
							fontWeight: '700',
							color: COLORS.danger,
							textShadowColor: COLORS.textDeep,
							textShadowOffset: { width: 1, height: 1 },
							textShadowRadius: 2,
						}}>
						{comboEffectText}
					</Text>
				</Animated.View>
			)}

			{toastMessage !== '' && (
				<Animated.View
					style={{
						position: 'absolute',
						bottom: isToastClosable ? '30%' : scaleHeight(100),
						left: 0,
						right: 0,
						alignItems: 'center',
						opacity: toastOpacity,
						zIndex: 1000,
					}}>
					<View
						style={{
							backgroundColor: COLORS.textStrong,
							paddingVertical: isToastClosable ? scaleHeight(20) : scaleHeight(12),
							paddingHorizontal: isToastClosable ? scaleWidth(24) : scaleWidth(18),
							borderRadius: RADIUS.xl,
							minHeight: isToastClosable ? scaleHeight(100) : undefined,
							minWidth: isToastClosable ? scaleWidth(200) : undefined,
							maxWidth: '88%',
							justifyContent: 'center',
							alignItems: 'center',
							flexDirection: isToastClosable ? 'column' : 'row',
							gap: SPACING_W.sm,
						}}>
						<Text
							style={{
								color: COLORS.textWhite,
								fontSize: isToastClosable ? scaledSize(18) : scaledSize(14),
								fontWeight: '700',
								textAlign: 'center',
								lineHeight: isToastClosable ? scaleHeight(28) : scaleHeight(20),
								marginBottom: isToastClosable ? scaleHeight(12) : 0,
							}}>
							{toastMessage}
						</Text>

						{/* ✅ 하단 닫기 버튼: long toast에만 표시 */}
						{isToastClosable && (
							<TouchableOpacity
								onPress={() => {
									setToastMessage('');
									toastOpacity.setValue(0);
								}}
								style={{
									marginTop: SPACING_H.xs,
									backgroundColor: COLORS.text,
									paddingVertical: SPACING_H.xsPlus,
									paddingHorizontal: SPACING_W.lg,
									borderRadius: RADIUS.md,
								}}>
								<Text
									style={{
										color: COLORS.textWhite,
										fontSize: FONT_SIZES.md,
										fontWeight: '600',
									}}>
									닫기
								</Text>
							</TouchableOpacity>
						)}
					</View>
				</Animated.View>
			)}
		</SafeAreaView>
	);
};

export default InfinityQuizScreen;

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: SPACING_W.lg, paddingVertical: SPACING_H.md, backgroundColor: COLORS.surface },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	score: { fontSize: FONT_SIZES.xxl, fontWeight: '700' },
	lives: { fontSize: FONT_SIZES.xxl, color: 'red' },
	statusText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
	},
	scoreValue: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		color: COLORS.text,
		marginTop: SPACING_H.xs,
	},

	correct: { backgroundColor: COLORS.secondarySoft },
	wrong: { backgroundColor: COLORS.dangerBorderSoft },
	gameOverBox: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: SPACING_H.sm,
	},
	gameOverText: {
		fontSize: FONT_SIZES.title,
		fontWeight: '700',
	},
	finalScore: {
		fontSize: FONT_SIZES.heading,
		marginBottom: SPACING_H.xxxl,
	},
	restartBtn: {
		paddingVertical: SPACING_H.mdPlus,
		paddingHorizontal: SPACING_W.xxxl,
		backgroundColor: COLORS.secondary,
		borderRadius: RADIUS.sm,
		marginBottom: SPACING_H.xxl,
	},
	restartText: {
		color: COLORS.textWhite,
		fontWeight: '700',
		fontSize: FONT_SIZES.xl,
	},
	bottomExitWrapper: {
		width: '100%',
		height: scaleHeight(30), // ✅ 명시적 높이 추가
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		borderTopWidth: 1,
		borderTopColor: COLORS.surfaceAlt,
		paddingTop: SPACING_H.xsPlus,
		paddingBottom: Platform.OS === 'android' ? scaleHeight(10) : scaleHeight(14),
	},
	exitButton: {
		backgroundColor: COLORS.textSecondary,
		paddingVertical: SPACING_H.smPlus,
		paddingHorizontal: SPACING_W.xxxl,
		borderRadius: RADIUS.round,
		height: scaleHeight(40), // ✅ 버튼 높이 보장
		justifyContent: 'center', // 수직 정렬 보장
		alignItems: 'center',
	},
	exitButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.md, // 🔽 기존보다 작게
		fontWeight: '600',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		// backgroundColor: 'red',
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: SPACING_H.xxxxl,
	},
	exitModal: {
		width: '85%',
		maxHeight: '80%',
		backgroundColor: COLORS.surface,
		// backgroundColor: 'red',
		borderRadius: RADIUS.lg,
		padding: SPACING_W.xl,
	},
	exitModalTitle: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.md,
		textAlign: 'center',
	},
	exitModalMessage: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xl,
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	exitModalConfirmButton: {
		flex: 1,
		backgroundColor: COLORS.danger,
		padding: SPACING_H.md,
		borderRadius: RADIUS.sm,
		marginLeft: SPACING_W.xsPlus,
		alignItems: 'center',
	},
	modalButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	modalBackButton: {
		flex: 1,
		backgroundColor: COLORS.borderDark,
		padding: SPACING_H.md,
		borderRadius: RADIUS.sm,
		marginRight: SPACING_W.xsPlus,
		alignItems: 'center',
	},
	modalStartButton: {
		flex: 1,
		backgroundColor: COLORS.secondary,
		padding: SPACING_H.md,
		borderRadius: RADIUS.sm,
		marginLeft: SPACING_W.xsPlus,
		alignItems: 'center',
	},
	modalButtonText: {
		color: COLORS.textWhite,
		fontWeight: '600',
		fontSize: FONT_SIZES.mdPlus,
	},
	fixedHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.sm,
		paddingTop: SPACING_H.md,
		paddingBottom: SPACING_H.sm,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.surfaceAlt,
		zIndex: 10,
	},

	statusBox: {
		flex: 1,
		marginHorizontal: SPACING_W.xs,
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.smPlus,
		paddingHorizontal: SPACING_W.sm,
		alignItems: 'center',
	},

	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xs,
	},

	statusLabel: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
	},

	statusValue: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.text,
	},
	heartRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: SPACING_W.xxs,
	},
	iconWithLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: SPACING_W.xs,
		marginBottom: SPACING_H.xsPlus,
	},
	statusWrapper: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.smPlus,
		backgroundColor: COLORS.surface,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.surfaceAlt,
		gap: SPACING_W.xsPlus,
	},
	statusBoxRow: {
		marginTop: SPACING_H.sm,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.md,
		backgroundColor: COLORS.surface,
		gap: SPACING_W.sm,

		// ✅ 추가된 테두리 스타일
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
		marginBottom: SPACING_H.md,
	},

	questionBox: {
		marginTop: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.secondarySoft,
	},
	questionText: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		textAlign: 'center',
		color: COLORS.text,
		lineHeight: scaleHeight(26),
	},
	questionIdiom: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.secondary,
		fontWeight: '800',
	},
	questionAsk: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		fontWeight: '700',
	},
	feedbackTag: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		gap: SPACING_W.xs,
		marginTop: SPACING_H.smPlus,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	feedbackTagCorrect: { backgroundColor: COLORS.primarySoft },
	feedbackTagWrong: { backgroundColor: COLORS.dangerBg },
	feedbackTagText: { fontSize: FONT_SIZES.smPlus, fontWeight: '800' },
	choicesWrapper: {
		gap: SPACING_H.smPlus,
	},
	choiceBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		marginVertical: SPACING_H.sm,
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		borderWidth: 2,
		borderColor: COLORS.borderDark,
	},
	choiceBtnText: {
		flex: 1,
		fontSize: FONT_SIZES.lg,
		textAlign: 'left',
		color: COLORS.text,
		fontWeight: '500',
	},
	choiceLabelBadge: {
		width: scaleWidth(26),
		height: scaleWidth(26),
		borderRadius: RADIUS.sm,
		backgroundColor: COLORS.surface,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	choiceLabelText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '800',
	},
	choiceBtnCorrect: {
		backgroundColor: COLORS.primarySoft,
		borderColor: COLORS.primaryDark,
	},
	choiceBtnWrong: {
		backgroundColor: COLORS.dangerBg,
		borderColor: COLORS.dangerDark,
	},
	choiceBtnDimmed: {
		opacity: 0.5,
	},
	choiceTextCorrect: {
		color: COLORS.primaryDeep,
		fontWeight: '800',
	},
	choiceTextWrong: {
		color: COLORS.dangerDeep,
		fontWeight: '700',
	},
	skipTopRightButton: {
		position: 'absolute',
		top: SPACING_H.md,
		right: SPACING_W.md,
		zIndex: 1,
	},
	skipTopRightText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		opacity: 0.6,
		fontWeight: '500',
	},
	timeBoxWrapper: {
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},

	timeBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.secondaryBg, // 💚 연한 초록 계열 배경
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.secondaryBorder,
	},

	timeText: {
		marginLeft: SPACING_W.sm,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '600',
		color: COLORS.text,
	},
	skipInlineButton: {
		backgroundColor: COLORS.surfaceAlt,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.smPlus,
		borderRadius: RADIUS.sm,
		marginLeft: SPACING_W.xsPlus,
	},
	skipInlineText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		fontWeight: '500',
	},
	questionBoxCorrect: {
		backgroundColor: COLORS.secondarySoft, // 연한 초록색 배경
	},
	questionBoxWrong: {
		backgroundColor: COLORS.dangerBg, // 연한 빨간색 배경
	},
	resultSummaryBox: {
		width: '100%', // ✅ 전체 너비 사용
		marginTop: SPACING_H.xl,
		marginBottom: SPACING_H.xxl,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.xl,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	resultRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: SPACING_H.xsPlus,
		paddingHorizontal: SPACING_W.xs,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.surfaceAlt,
	},
	resultText: {
		fontSize: FONT_SIZES.mdPlus,
		marginLeft: SPACING_W.smPlus,
		color: COLORS.text,
		fontWeight: '500',
	},
	bold: {
		fontWeight: '700',
	},

	feedbackList: {
		width: '100%',
		marginTop: SPACING_H.xl,
		padding: SPACING_W.md,
		borderWidth: 1,
		borderColor: COLORS.borderDark,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.background,
	},
	feedbackItem: {
		padding: SPACING_W.md,
		borderRadius: RADIUS.sm,
		marginBottom: SPACING_H.smPlus,
		borderWidth: 1,
		borderColor: COLORS.borderDark,
	},
	feedbackTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.sm,
		marginBottom: SPACING_H.smPlus,
	},
	feedbackResultBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xs,
		borderRadius: RADIUS.sm,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xxs,
	},
	feedbackResultBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '800' },
	feedbackTitle: {
		flex: 1,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
	},
	feedbackMeaning: {
		fontSize: FONT_SIZES.md,
		marginBottom: SPACING_H.xxs,
		color: COLORS.text,
	},
	feedbackResult: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
	},
	countdownOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.92)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999,
	},
	countdownText: {
		fontSize: scaledSize(72),
		fontWeight: '700',
		color: COLORS.textWhite,
		textAlign: 'center',
		includeFontPadding: false,
		textAlignVertical: 'center',
		lineHeight: scaledSize(80),
	},
	countdownCircle: {
		width: scaleWidth(160),
		height: scaleWidth(160),
		borderRadius: scaleWidth(80),
		backgroundColor: 'rgba(20, 184, 166, 0.2)',
		borderWidth: 4,
		borderColor: COLORS.primary,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	countdownMessage: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.textWhite,
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.3,
	},
	countdownMessageWrapper: {
		marginTop: SPACING_H.xxxl,
		paddingHorizontal: SPACING_W.xxl,
		paddingVertical: SPACING_H.smPlus,
		backgroundColor: 'rgba(255,255,255,0.12)',
		borderRadius: RADIUS.xl,
		minWidth: scaleWidth(180),
		alignItems: 'center',
	},
	feedbackStatus: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		marginLeft: SPACING_W.sm,
	},
	skipButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.secondaryBg,
		borderRadius: RADIUS.round,
		paddingVertical: SPACING_H.xsPlus,
		paddingHorizontal: SPACING_W.md,
	},

	skipContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xs,
	},

	skipText: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.accentTealDeep,
		fontWeight: '700',
		lineHeight: scaleHeight(13),
	},
	lifeBarWrapper: {
		position: 'relative',
		height: scaleHeight(32),
		justifyContent: 'center',
		marginBottom: SPACING_H.xsPlus,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.sm,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.background,
	},

	heartCentered: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},

	skipFixedRight: {
		marginLeft: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.secondaryBg,
		borderRadius: RADIUS.round,
		paddingVertical: SPACING_H.xsPlus,
		paddingHorizontal: SPACING_W.md,
		zIndex: 2,
	},
	scrollTopButton: {
		position: 'absolute',
		right: SPACING_W.xxl,
		bottom: scaleHeight(80), // 기존 16 → 80으로 조정하여 종료 버튼과 겹치지 않도록
		backgroundColor: COLORS.secondary,
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
	},
	leftFixed: {
		position: 'absolute',
		left: SPACING_W.sm,
		justifyContent: 'center',
		height: '100%',
	},

	rightFixed: {
		position: 'absolute',
		right: SPACING_W.sm,
		justifyContent: 'center',
		height: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.primaryBg,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.sm,
	},

	chanceText: {
		fontSize: FONT_SIZES.xs,
		lineHeight: scaleHeight(13),
		color: COLORS.primaryDark,
		fontWeight: '700',
	},
	chanceContent: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.primaryBg, // 💚 연한 초록색 배경
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.sm,
		gap: SPACING_W.xs, // 아이콘과 텍스트 간격
	},
	chanceModalCard: {
		width: '85%',
		maxWidth: scaleWidth(360),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingTop: SPACING_H.xxl,
		paddingBottom: SPACING_H.lgPlus,
		paddingHorizontal: SPACING_W.xl,
		alignItems: 'center',
	},
	chanceModalHeaderIcon: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(26),
		backgroundColor: COLORS.primaryDark,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.smPlus,
	},
	chanceModalTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '800',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.xxs,
	},
	chanceModalSubtitle: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
		marginBottom: SPACING_H.lg,
		fontWeight: '600',
	},
	chanceCharBox: {
		width: '100%',
		flexDirection: 'row',
		gap: SPACING_W.sm,
		marginBottom: SPACING_H.mdPlus,
	},
	chanceCharRow: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.sm,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.xsPlus,
	},
	chanceCharChar: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '800',
		color: COLORS.textDeep,
		marginBottom: SPACING_H.xs,
	},
	chanceCharReading: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.secondary,
		fontWeight: '800',
		textAlign: 'center',
		marginTop: SPACING_H.xxs,
	},
	chanceCharMeaning: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.textSecondary,
		fontWeight: '600',
		textAlign: 'center',
	},
	chanceCharSub: {
		fontSize: FONT_SIZES.xxs,
		color: COLORS.textLight,
		fontWeight: '600',
		textAlign: 'center',
		marginTop: SPACING_H.xxs,
	},
	chanceMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING_W.xsPlus, marginBottom: SPACING_H.smPlus },
	chanceMetaChip: { backgroundColor: COLORS.secondaryBg, borderRadius: RADIUS.round, paddingHorizontal: SPACING_W.smPlus, paddingVertical: SPACING_H.xs },
	chanceMetaChipText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.secondary },
	chanceKeywordBox: { width: '100%', marginBottom: SPACING_H.smPlus },
	chanceKeywordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING_W.xsPlus, marginTop: SPACING_H.xsPlus },
	chanceKeywordChip: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.sm, paddingHorizontal: SPACING_W.sm, paddingVertical: SPACING_H.xs },
	chanceKeywordText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textMuted },

	chanceExampleBox: {
		width: '100%',
		backgroundColor: COLORS.primaryBg,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.smPlus,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.lgPlus,
	},
	chanceExampleLabel: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '800',
		color: COLORS.primaryDeep,
		marginBottom: SPACING_H.xs,
	},
	chanceExampleText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
		fontWeight: '600',
		lineHeight: scaleHeight(20),
	},
	chanceModalButton: {
		width: '100%',
		backgroundColor: COLORS.primaryDark,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		alignItems: 'center',
	},
	chanceModalButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
	},
	resultTitleCard: {
		alignItems: 'center',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.smPlus,
		backgroundColor: COLORS.warningSoft,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.warningBorder,
	},
	animatedScore: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.accentFlame,
	},
	quizScrollContent: {
		paddingBottom: SPACING_H.xxxxl,
	},
	resultScrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingBottom: SPACING_H.xl,
	},
	resultWrapper: {
		marginTop: SPACING_H.sm,
		width: '100%',
		borderWidth: 1,
		borderColor: COLORS.borderDark,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.surface,
		padding: SPACING_W.lg,
	},
	resultButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		gap: SPACING_W.smPlus,
		marginTop: SPACING_H.xs,
		marginBottom: SPACING_H.sm,
	},
	resultHeader: {
		width: '100%',
		alignItems: 'center',
		marginBottom: SPACING_H.xs,
	},
	timeResultImage: { width: scaleWidth(148), height: scaleHeight(104), marginBottom: SPACING_H.xs },
	resultHeaderTitle: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '800',
		color: COLORS.textStrong,
	},
	resultHeaderSub: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
		fontWeight: '600',
		marginTop: SPACING_H.xs,
	},
	scoreHero: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: SPACING_H.md,
		marginTop: SPACING_H.xsPlus,
	},
	scoreHeroLabel: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '700',
		color: COLORS.textLight,
		marginBottom: SPACING_H.xxs,
	},
	resultScoreCardRow: {
		flexDirection: 'row',
		width: '100%',
		gap: SPACING_W.smPlus,
		marginTop: SPACING_H.xsPlus,
		marginBottom: SPACING_H.smPlus,
	},
	resultScoreCard: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: SPACING_H.mdPlus,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
	},
	resultScoreIcon: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(14),
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.xsPlus,
	},
	resultScoreValue: {
		fontSize: FONT_SIZES.title,
		fontWeight: '800',
	},
	resultScoreLabel: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		fontWeight: '700',
		marginTop: SPACING_H.xxs,
	},
	statList: {
		width: '100%',
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xs,
		marginTop: SPACING_H.xsPlus,
		marginBottom: SPACING_H.md,
	},
	statLine: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: SPACING_H.md,
	},
	statLineLabel: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		fontWeight: '600',
	},
	statLineValue: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textStrong,
		fontWeight: '800',
	},
	statLineDivider: {
		height: 1,
		backgroundColor: COLORS.border,
	},
	scoreHeroNumber: {
		fontSize: scaledSize(56),
		fontWeight: '700',
		color: COLORS.danger,
	},
	scoreHeroUnit: {
		fontSize: FONT_SIZES.title,
		fontWeight: '700',
		color: COLORS.danger,
		marginLeft: SPACING_W.xs,
		marginBottom: SPACING_H.md,
	},
	scoreHeroMsg: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textMuted,
		textAlign: 'center',
		fontWeight: '600',
		lineHeight: scaleHeight(20),
		marginTop: SPACING_H.xsPlus,
	},
	statGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		width: '100%',
		gap: SPACING_W.sm,
		marginTop: SPACING_H.mdPlus,
		marginBottom: SPACING_H.md,
	},
	statChip: {
		flexGrow: 1,
		flexBasis: '30%',
		alignItems: 'center',
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingVertical: SPACING_H.md,
	},
	statChipValue: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '800',
		color: COLORS.text,
		marginBottom: SPACING_H.xxs,
	},
	statChipLabel: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.textLight,
		fontWeight: '600',
	},
	usedTagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: SPACING_W.sm,
		marginBottom: SPACING_H.mdPlus,
	},
	usedTag: {
		backgroundColor: COLORS.primaryBg,
		borderRadius: RADIUS.round,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.md,
	},
	usedTagText: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.primaryDeep,
		fontWeight: '700',
	},
	resultBtn: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.md,
	},
	resultBtnPrimary: {
		backgroundColor: COLORS.secondary,
	},
	resultBtnPrimaryText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '800',
		color: COLORS.textWhite,
	},
	resultBtnSecondary: {
		backgroundColor: COLORS.secondaryBg,
		borderWidth: 1,
		borderColor: COLORS.secondaryBorder,
	},
	resultBtnSecondaryText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '800',
		color: COLORS.secondary,
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
	feedbackContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	feedbackArrow: {
		marginLeft: SPACING_W.smPlus,
	},
});
