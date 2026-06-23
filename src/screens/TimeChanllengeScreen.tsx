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
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeChallengeInterceptor } from '@/services/interceptor/TimeChanllengeInterceptor';
import AnimatedNumbers from 'react-native-animated-numbers';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import ProverbDetailModal from './modal/ProverbDetailModal';

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
	const labelColors = ['#3B82F6', '#22C55E', '#F97316', '#EC4899']; // A, B, C, D 색상 (각각 다르게)
	const solvedProverbs = questionList.slice(0, currentIndex + 1).filter((q) => resultMap[q.id]);

	const [bonusHistory, setBonusHistory] = useState<number[]>([]);
	const [toastMessage, setToastMessage] = useState('');
	const toastOpacity = useRef(new Animated.Value(0)).current;

	const [encouragements, setEncouragements] = useState<string[]>([]);
	const [animatedScore, setAnimatedScore] = useState(0);

	useEffect(() => {
		const allProverbs = ProverbServices.selectProverbList();
		const shuffled = allProverbs.sort(() => 0.5 - Math.random());
		setQuestionList(shuffled);
	}, []);

	useEffect(() => {
		if (gameResult) {
			// 애니메이션을 위해 100ms 딜레이 후 점수 적용
			setTimeout(() => {
				setAnimatedScore(gameResult.finalScore);
			}, 100);
		}
	}, [gameResult]);

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

	// lives 감소 시 애니메이션
	useEffect(() => {
		if (lives < MAX_LIVES) {
			const indexToAnimate = lives; // ex: 4 -> 3일 때 index 3 애니메이션
			Animated.sequence([
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
			]).start();
		}
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

		const timer = setInterval(() => {
			countdown--;

			if (countdown < 0) {
				clearInterval(timer);

				setTimeout(() => {
					setIsCountingDown(false);
					resetGame(); // 기존 resetGame 호출
				}, 800);
				return;
			}

			setCount(countdown);
			animateScale();
		}, 1000);
	};

	const handleGameOver = () => {
		const quizDate = new Date().toISOString(); // 예: '2025-06-26T14:20:00.000Z'

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
				contentContainerStyle={isGameOver ? styles.resultScrollContent : undefined}
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
									combo >= 2 && { color: '#EF4444' },
								]}>
								{combo} Combo
							</Animated.Text>
						</View>
					</View>
				)}
				{!isGameOver && (
					<View style={styles.timeBoxWrapper}>
						<View style={styles.timeBox}>
							<IconComponent name="clock-o" type="FontAwesome" color="#22C55E" size={scaledSize(18)} />
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
										setChanceModalVisible(true);
										setHasUsedChance(true); // ✅ 사용 처리
										setIsPaused(true); // ✅ 찬스 팝업 동안 타이머 일시정지
									}}
									style={styles.chanceContent}>
									<IconComponent name="magic" type="FontAwesome" color="#16A34A" size={scaledSize(12)} />
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
										marginHorizontal: scaleWidth(2),
									}}>
									<IconComponent
										name="heart"
										type="FontAwesome"
										size={scaledSize(15)}
										color={i < lives ? '#EF4444' : '#E2E8F0'}
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
								style={styles.rightFixed}>
								<View style={styles.skipContent}>
									<IconComponent name="forward" type="FontAwesome" color="#16A34A" size={scaledSize(12)} />
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
											<View style={[styles.resultScoreCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
												<View style={[styles.resultScoreIcon, { backgroundColor: '#22C55E' }]}>
													<IconComponent name="check" type="materialIcons" color="#fff" size={scaledSize(16)} />
												</View>
												<Text style={[styles.resultScoreValue, { color: '#16A34A' }]}>{gameResult.correctCount}</Text>
												<Text style={styles.resultScoreLabel}>정답</Text>
											</View>
											<View style={[styles.resultScoreCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
												<View style={[styles.resultScoreIcon, { backgroundColor: '#EF4444' }]}>
													<IconComponent name="close" type="materialIcons" color="#fff" size={scaledSize(16)} />
												</View>
												<Text style={[styles.resultScoreValue, { color: '#DC2626' }]}>{gameResult.wrongCount}</Text>
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
												<Text style={[styles.statLineValue, { color: '#F97316' }]}>{gameResult.maxCombo} Combo</Text>
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
											color="#3B82F6"
											style={{ marginRight: scaleWidth(6) }}
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
											color="#fff"
											size={scaledSize(16)}
											style={{ marginRight: scaleWidth(6) }}
										/>
										<Text style={styles.resultBtnPrimaryText}>다시 도전</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>

						<TouchableOpacity
							onPress={() => setIsFeedbackOpen(!isFeedbackOpen)}
							style={{
								backgroundColor: '#F1F5F9',
								borderRadius: scaleWidth(10),
								paddingVertical: scaleHeight(10),
								paddingHorizontal: scaleWidth(16),
								marginTop: scaleHeight(12),
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}>
							<Text
								style={{
									fontSize: scaledSize(15),
									fontWeight: '600',
									color: '#334155',
									marginRight: scaleWidth(5),
								}}>
								정답과 해설 보기
							</Text>
							<IconComponent
								name={isFeedbackOpen ? 'angle-up' : 'angle-down'}
								type="FontAwesome"
								color="#334155"
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
											style={[styles.feedbackItem, { backgroundColor: isCorrect ? '#EFF6FF' : '#FEF2F2' }]}>
											<View style={styles.feedbackContent}>
												<View style={{ flex: 1 }}>
													<View style={styles.feedbackTitleRow}>
														<Text style={[styles.feedbackTitle, { color: '#1E293B', flex: 1 }]} numberOfLines={1}>
															{i + 1}. {q.proverb}
														</Text>
														<View style={[styles.feedbackResultBadge, { backgroundColor: isCorrect ? '#DCFCE7' : '#FEE2E2' }]}>
															<IconComponent
																type="materialIcons"
																name={isCorrect ? 'check-circle' : 'cancel'}
																size={scaledSize(12)}
																color={isCorrect ? '#16A34A' : '#DC2626'}
															/>
															<Text style={[styles.feedbackResultBadgeText, { color: isCorrect ? '#16A34A' : '#DC2626' }]}>
																{isCorrect ? '정답' : '오답'}
															</Text>
														</View>
													</View>
													<Text style={styles.feedbackMeaning}>
														의미: <Text style={{ fontWeight: 'bold' }}>{q.longMeaning || q.meaning}</Text>
													</Text>
												</View>
												<IconComponent
													name="chevron-right"
													type="FontAwesome"
													size={scaledSize(16)}
													color="#94A3B8"
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
					<View
						style={[
							styles.questionBox,
							feedback === 'correct' && styles.questionBoxCorrect,
							feedback === 'wrong' && styles.questionBoxWrong,
						]}>
						<View style={{ marginBottom: scaleHeight(18) }}>
							<Text style={styles.questionText}>
								<Text style={styles.questionIdiom}>
									{current.proverb}
								</Text>
								<Text> 의미는?</Text>
							</Text>
							{feedback && (
								<View
									style={[styles.feedbackTag, feedback === 'correct' ? styles.feedbackTagCorrect : styles.feedbackTagWrong]}>
									<IconComponent
										type="materialIcons"
										name={feedback === 'correct' ? 'check-circle' : 'cancel'}
										size={scaledSize(14)}
										color={feedback === 'correct' ? '#16A34A' : '#DC2626'}
									/>
									<Text style={[styles.feedbackTagText, { color: feedback === 'correct' ? '#16A34A' : '#DC2626' }]}>
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
										<IconComponent name="check-circle" type="materialIcons" size={scaledSize(20)} color="#16A34A" />
									)}
									{showWrong && <IconComponent name="cancel" type="materialIcons" size={scaledSize(20)} color="#DC2626" />}
								</TouchableOpacity>
							);
						})}
					</View>
				)}
			</ScrollView>

			<View style={styles.bottomExitWrapper}>
				<TouchableOpacity
					style={styles.exitButton}
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
							<IconComponent name="magic" type="FontAwesome" color="#fff" size={scaledSize(22)} />
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
								<Text style={styles.chanceExampleLabel}>🔑 비슷한 속담</Text>
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
									style={[styles.modalBackButton, { backgroundColor: '#CBD5E1' }]}
									onPress={() => {
										setShowExitModal(false);
										setIsPaused(false); // 타이머 재개
									}}>
									<Text style={styles.modalButtonText}>취소</Text>
								</TouchableOpacity>
								<TouchableOpacity
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
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop}>
					<IconComponent type="MaterialIcons" name="arrow-upward" size={scaledSize(24)} color="#fff" />
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
							fontWeight: 'bold',
							color: '#EF4444',
							textShadowColor: '#000',
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
							backgroundColor: '#1E293B',
							paddingVertical: isToastClosable ? scaleHeight(20) : scaleHeight(12),
							paddingHorizontal: isToastClosable ? scaleWidth(24) : scaleWidth(18),
							borderRadius: scaleWidth(24),
							minHeight: isToastClosable ? scaleHeight(100) : undefined,
							minWidth: isToastClosable ? scaleWidth(200) : undefined,
							maxWidth: '88%',
							justifyContent: 'center',
							alignItems: 'center',
							flexDirection: isToastClosable ? 'column' : 'row',
							gap: scaleWidth(8),
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.25,
							shadowRadius: 8,
							elevation: 6,
						}}>
						<Text
							style={{
								color: '#fff',
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
									marginTop: scaleHeight(4),
									backgroundColor: '#334155',
									paddingVertical: scaleHeight(6),
									paddingHorizontal: scaleWidth(16),
									borderRadius: scaleWidth(12),
								}}>
								<Text
									style={{
										color: '#fff',
										fontSize: scaledSize(14),
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
	container: { flex: 1, padding: scaleWidth(20), backgroundColor: '#fff' },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	score: { fontSize: scaledSize(20), fontWeight: 'bold' },
	lives: { fontSize: scaledSize(20), color: 'red' },
	statusText: {
		fontSize: scaledSize(14),
		color: '#64748B',
	},
	scoreValue: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#334155',
		marginTop: scaleHeight(4),
	},

	correct: { backgroundColor: '#DBEAFE' },
	wrong: { backgroundColor: '#FECACA' },
	gameOverBox: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: scaleHeight(8),
	},
	gameOverText: {
		fontSize: scaledSize(24),
		fontWeight: 'bold',
	},
	finalScore: {
		fontSize: scaledSize(22),
		marginBottom: scaleHeight(30),
	},
	restartBtn: {
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(30),
		backgroundColor: '#3B82F6',
		borderRadius: scaledSize(10),
		marginBottom: scaleHeight(24),
	},
	restartText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: scaledSize(18),
	},
	bottomExitWrapper: {
		width: '100%',
		height: scaleHeight(30), // ✅ 명시적 높이 추가
		alignItems: 'center',
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#F1F5F9',
		paddingTop: scaleHeight(6),
		paddingBottom: Platform.OS === 'android' ? scaleHeight(10) : scaleHeight(14),
	},
	exitButton: {
		backgroundColor: '#64748B',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(32),
		borderRadius: scaleWidth(20),
		height: scaleHeight(40), // ✅ 버튼 높이 보장
		justifyContent: 'center', // 수직 정렬 보장
		alignItems: 'center',
	},
	exitButtonText: {
		color: '#fff',
		fontSize: scaledSize(14), // 🔽 기존보다 작게
		fontWeight: '600',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		// backgroundColor: 'red',
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: scaleHeight(40),
	},
	exitModal: {
		width: '85%',
		maxHeight: '80%',
		backgroundColor: 'white',
		// backgroundColor: 'red',
		borderRadius: scaleWidth(16),
		padding: scaleWidth(20),
	},
	exitModalTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(12),
		textAlign: 'center',
	},
	exitModalMessage: {
		fontSize: scaledSize(15),
		color: '#64748B',
		marginBottom: scaleHeight(20),
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	exitModalConfirmButton: {
		flex: 1,
		backgroundColor: '#EF4444',
		padding: scaleHeight(12),
		borderRadius: scaleWidth(8),
		marginLeft: scaleWidth(6),
		alignItems: 'center',
	},
	modalButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	modalBackButton: {
		flex: 1,
		backgroundColor: '#CBD5E1',
		padding: scaleHeight(12),
		borderRadius: scaleWidth(8),
		marginRight: scaleWidth(6),
		alignItems: 'center',
	},
	modalStartButton: {
		flex: 1,
		backgroundColor: '#3B82F6',
		padding: scaleHeight(12),
		borderRadius: scaleWidth(8),
		marginLeft: scaleWidth(6),
		alignItems: 'center',
	},
	modalButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: scaledSize(15),
	},
	fixedHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(8),
		paddingTop: scaleHeight(12),
		paddingBottom: scaleHeight(8),
		borderBottomWidth: 1,
		borderBottomColor: '#F1F5F9',
		zIndex: 10,
	},

	statusBox: {
		flex: 1,
		marginHorizontal: scaleWidth(4),
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(8),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},

	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
	},

	statusLabel: {
		fontSize: scaledSize(13),
		color: '#64748B',
	},

	statusValue: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#334155',
	},
	heartRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: scaleWidth(2),
	},
	iconWithLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(4),
		marginBottom: scaleHeight(6),
	},
	statusWrapper: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(10),
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#F1F5F9',
		gap: scaleWidth(6),
	},
	statusBoxRow: {
		marginTop: scaleHeight(30),
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(10),
		backgroundColor: '#fff',
		gap: scaleWidth(6),

		// ✅ 추가된 테두리 스타일
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},

	questionBox: {
		marginTop: scaleHeight(10),
		padding: scaleWidth(20),
		borderRadius: scaledSize(16),
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#DBEAFE',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
	},
	questionText: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		textAlign: 'left',
		color: '#334155',
		marginLeft: scaleWidth(12),
		lineHeight: scaleHeight(30),
	},
	questionIdiom: {
		color: '#3B82F6',
		fontWeight: '800',
	},
	feedbackTag: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		gap: scaleWidth(4),
		marginTop: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(5),
		borderRadius: scaleWidth(999),
	},
	feedbackTagCorrect: { backgroundColor: '#DCFCE7' },
	feedbackTagWrong: { backgroundColor: '#FEE2E2' },
	feedbackTagText: { fontSize: scaledSize(13), fontWeight: '800' },
	choicesWrapper: {
		gap: scaleHeight(10),
	},
	choiceBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: scaleWidth(16),
		paddingHorizontal: scaleWidth(22),
		marginVertical: scaleHeight(8),
		marginHorizontal: scaleWidth(-5),
		backgroundColor: '#F1F5F9',
		borderRadius: scaledSize(12),
		borderWidth: 2,
		borderColor: '#CBD5E1',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 4,
	},
	choiceBtnText: {
		flex: 1,
		fontSize: scaledSize(16),
		textAlign: 'left',
		color: '#334155',
		fontWeight: '500',
	},
	choiceLabelBadge: {
		width: scaleWidth(26),
		height: scaleWidth(26),
		borderRadius: scaleWidth(8),
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	choiceLabelText: {
		fontSize: scaledSize(14),
		fontWeight: '800',
	},
	choiceBtnCorrect: {
		backgroundColor: '#DCFCE7',
		borderColor: '#16A34A',
	},
	choiceBtnWrong: {
		backgroundColor: '#FEE2E2',
		borderColor: '#DC2626',
	},
	choiceBtnDimmed: {
		opacity: 0.5,
	},
	choiceTextCorrect: {
		color: '#15803D',
		fontWeight: '800',
	},
	choiceTextWrong: {
		color: '#B91C1C',
		fontWeight: '700',
	},
	skipTopRightButton: {
		position: 'absolute',
		top: scaleHeight(12),
		right: scaleWidth(12),
		zIndex: 1,
	},
	skipTopRightText: {
		fontSize: scaledSize(12),
		color: '#64748B',
		opacity: 0.6,
		fontWeight: '500',
	},
	timeBoxWrapper: {
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},

	timeBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#EFF6FF', // 💚 연한 초록 계열 배경
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#BFDBFE',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},

	timeText: {
		marginLeft: scaleWidth(8),
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#334155',
	},
	skipInlineButton: {
		backgroundColor: '#F1F5F9',
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaledSize(8),
		marginLeft: scaleWidth(6),
	},
	skipInlineText: {
		fontSize: scaledSize(12),
		color: '#64748B',
		fontWeight: '500',
	},
	questionBoxCorrect: {
		backgroundColor: '#DBEAFE', // 연한 초록색 배경
	},
	questionBoxWrong: {
		backgroundColor: '#FEE2E2', // 연한 빨간색 배경
	},
	resultSummaryBox: {
		width: '100%', // ✅ 전체 너비 사용
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(24),
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(14),
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#E2E8F0',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	resultRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(4),
		borderBottomWidth: 1,
		borderBottomColor: '#F1F5F9',
	},
	resultText: {
		fontSize: scaledSize(15),
		marginLeft: scaleWidth(10),
		color: '#334155',
		fontWeight: '500',
	},
	bold: {
		fontWeight: 'bold',
	},

	feedbackList: {
		width: '100%',
		marginTop: scaleHeight(20),
		padding: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: scaleWidth(12),
		backgroundColor: '#F8FAFC',
	},
	feedbackItem: {
		padding: scaleWidth(12),
		borderRadius: scaleWidth(10),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#CBD5E1',
	},
	feedbackTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(7),
		marginBottom: scaleHeight(10),
	},
	feedbackResultBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(3),
		borderRadius: scaleWidth(7),
		paddingHorizontal: scaleWidth(7),
		paddingVertical: scaleHeight(2),
	},
	feedbackResultBadgeText: { fontSize: scaledSize(11), fontWeight: '800' },
	feedbackTitle: {
		flex: 1,
		fontSize: scaledSize(15),
		fontWeight: '700',
	},
	feedbackMeaning: {
		fontSize: scaledSize(14),
		marginBottom: scaleHeight(2),
		color: '#334155',
	},
	feedbackResult: {
		fontSize: scaledSize(13),
		color: '#64748B',
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
		fontWeight: 'bold',
		color: '#fff',
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
		borderColor: '#22C55E',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	countdownMessage: {
		fontSize: scaledSize(17),
		color: '#fff',
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.3,
	},
	countdownMessageWrapper: {
		marginTop: scaleHeight(32),
		paddingHorizontal: scaleWidth(24),
		paddingVertical: scaleHeight(10),
		backgroundColor: 'rgba(255,255,255,0.12)',
		borderRadius: scaledSize(20),
		minWidth: scaleWidth(180),
		alignItems: 'center',
	},
	feedbackStatus: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		marginLeft: scaleWidth(8),
	},
	skipButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#EFF6FF',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},

	skipContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
	},

	skipText: {
		fontSize: scaledSize(11),
		color: '#115E59',
		fontWeight: '700',
		lineHeight: scaleHeight(13),
	},
	lifeBarWrapper: {
		position: 'relative',
		height: scaleHeight(32),
		justifyContent: 'center',
		marginBottom: scaleHeight(6),
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(8),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: scaleWidth(12),
		backgroundColor: '#F8FAFC',
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
		backgroundColor: '#EFF6FF',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		zIndex: 2,
	},
	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(24),
		bottom: scaleHeight(80), // 기존 16 → 80으로 조정하여 종료 버튼과 겹치지 않도록
		backgroundColor: '#3B82F6',
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
	},
	leftFixed: {
		position: 'absolute',
		left: scaleWidth(8),
		justifyContent: 'center',
		height: '100%',
	},

	rightFixed: {
		position: 'absolute',
		right: scaleWidth(8),
		justifyContent: 'center',
		height: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F0FDF4',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(8),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},

	chanceText: {
		fontSize: scaledSize(11),
		lineHeight: scaleHeight(13),
		color: '#16A34A',
		fontWeight: '700',
	},
	chanceContent: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F0FDF4', // 💚 연한 초록색 배경
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(8),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		gap: scaleWidth(4), // 아이콘과 텍스트 간격
	},
	chanceModalCard: {
		width: '85%',
		maxWidth: scaleWidth(360),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		paddingTop: scaleHeight(22),
		paddingBottom: scaleHeight(18),
		paddingHorizontal: scaleWidth(20),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.18,
		shadowRadius: 16,
		elevation: 8,
	},
	chanceModalHeaderIcon: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(26),
		backgroundColor: '#16A34A',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(10),
	},
	chanceModalTitle: {
		fontSize: scaledSize(18),
		fontWeight: '800',
		color: '#1E293B',
		marginBottom: scaleHeight(2),
	},
	chanceModalSubtitle: {
		fontSize: scaledSize(12.5),
		color: '#94A3B8',
		marginBottom: scaleHeight(16),
		fontWeight: '600',
	},
	chanceCharBox: {
		width: '100%',
		flexDirection: 'row',
		gap: scaleWidth(8),
		marginBottom: scaleHeight(14),
	},
	chanceCharRow: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: '#F1F5F9',
		borderRadius: scaleWidth(10),
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(6),
	},
	chanceCharChar: {
		fontSize: scaledSize(18),
		fontWeight: '800',
		color: '#0F172A',
		marginBottom: scaleHeight(3),
	},
	chanceCharReading: {
		fontSize: scaledSize(11),
		color: '#3B82F6',
		fontWeight: '800',
		textAlign: 'center',
		marginTop: scaleHeight(2),
	},
	chanceCharMeaning: {
		fontSize: scaledSize(11),
		color: '#64748B',
		fontWeight: '600',
		textAlign: 'center',
	},
	chanceCharSub: {
		fontSize: scaledSize(9.5),
		color: '#94A3B8',
		fontWeight: '600',
		textAlign: 'center',
		marginTop: scaleHeight(2),
	},
	chanceMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: scaleWidth(6), marginBottom: scaleHeight(10) },
	chanceMetaChip: { backgroundColor: '#EFF6FF', borderRadius: scaleWidth(999), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4) },
	chanceMetaChipText: { fontSize: scaledSize(11.5), fontWeight: '700', color: '#3B82F6' },
	chanceKeywordBox: { width: '100%', marginBottom: scaleHeight(10) },
	chanceKeywordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(6), marginTop: scaleHeight(6) },
	chanceKeywordChip: { backgroundColor: '#F1F5F9', borderRadius: scaleWidth(8), paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(3) },
	chanceKeywordText: { fontSize: scaledSize(12), fontWeight: '600', color: '#475569' },

	chanceExampleBox: {
		width: '100%',
		backgroundColor: '#F0FDF4',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(18),
	},
	chanceExampleLabel: {
		fontSize: scaledSize(12),
		fontWeight: '800',
		color: '#15803D',
		marginBottom: scaleHeight(4),
	},
	chanceExampleText: {
		fontSize: scaledSize(13.5),
		color: '#334155',
		fontWeight: '600',
		lineHeight: scaleHeight(20),
	},
	chanceModalButton: {
		width: '100%',
		backgroundColor: '#16A34A',
		paddingVertical: scaleHeight(13),
		borderRadius: scaleWidth(14),
		alignItems: 'center',
	},
	chanceModalButtonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '700',
	},
	resultTitleCard: {
		alignItems: 'center',
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		backgroundColor: '#FFFBEB',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#FCD34D',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},
	animatedScore: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#F97316',
	},
	resultScrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingBottom: scaleHeight(20),
	},
	resultWrapper: {
		marginTop: scaleHeight(8),
		width: '100%',
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: scaleWidth(14),
		backgroundColor: '#fff',
		padding: scaleWidth(16),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	resultButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		gap: scaleWidth(10),
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(8),
	},
	resultHeader: {
		width: '100%',
		alignItems: 'center',
		marginBottom: scaleHeight(4),
	},
	resultHeaderTitle: {
		fontSize: scaledSize(20),
		fontWeight: '800',
		color: '#1E293B',
	},
	resultHeaderSub: {
		fontSize: scaledSize(12.5),
		color: '#94A3B8',
		fontWeight: '600',
		marginTop: scaleHeight(3),
	},
	scoreHero: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: scaleHeight(12),
		marginTop: scaleHeight(6),
	},
	scoreHeroLabel: {
		fontSize: scaledSize(13),
		fontWeight: '700',
		color: '#94A3B8',
		marginBottom: scaleHeight(2),
	},
	resultScoreCardRow: {
		flexDirection: 'row',
		width: '100%',
		gap: scaleWidth(10),
		marginTop: scaleHeight(6),
		marginBottom: scaleHeight(10),
	},
	resultScoreCard: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: scaleHeight(14),
		borderRadius: scaleWidth(14),
		borderWidth: 1,
	},
	resultScoreIcon: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(14),
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(6),
	},
	resultScoreValue: {
		fontSize: scaledSize(24),
		fontWeight: '800',
	},
	resultScoreLabel: {
		fontSize: scaledSize(12.5),
		color: '#64748B',
		fontWeight: '700',
		marginTop: scaleHeight(2),
	},
	statList: {
		width: '100%',
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: '#EEF2F6',
		paddingHorizontal: scaleWidth(16),
		paddingVertical: scaleHeight(4),
		marginTop: scaleHeight(6),
		marginBottom: scaleHeight(12),
	},
	statLine: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: scaleHeight(11),
	},
	statLineLabel: {
		fontSize: scaledSize(13.5),
		color: '#64748B',
		fontWeight: '600',
	},
	statLineValue: {
		fontSize: scaledSize(14.5),
		color: '#1E293B',
		fontWeight: '800',
	},
	statLineDivider: {
		height: 1,
		backgroundColor: '#EEF2F6',
	},
	scoreHeroNumber: {
		fontSize: scaledSize(56),
		fontWeight: 'bold',
		color: '#EF4444',
	},
	scoreHeroUnit: {
		fontSize: scaledSize(24),
		fontWeight: '700',
		color: '#EF4444',
		marginLeft: scaleWidth(4),
		marginBottom: scaleHeight(12),
	},
	scoreHeroMsg: {
		fontSize: scaledSize(13),
		color: '#475569',
		textAlign: 'center',
		fontWeight: '600',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(6),
	},
	statGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		width: '100%',
		gap: scaleWidth(8),
		marginTop: scaleHeight(14),
		marginBottom: scaleHeight(12),
	},
	statChip: {
		flexGrow: 1,
		flexBasis: '30%',
		alignItems: 'center',
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#EEF2F6',
		paddingVertical: scaleHeight(12),
	},
	statChipValue: {
		fontSize: scaledSize(18),
		fontWeight: '800',
		color: '#334155',
		marginBottom: scaleHeight(2),
	},
	statChipLabel: {
		fontSize: scaledSize(11),
		color: '#94A3B8',
		fontWeight: '600',
	},
	usedTagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: scaleWidth(8),
		marginBottom: scaleHeight(14),
	},
	usedTag: {
		backgroundColor: '#F0FDF4',
		borderRadius: scaleWidth(20),
		paddingVertical: scaleHeight(5),
		paddingHorizontal: scaleWidth(12),
	},
	usedTagText: {
		fontSize: scaledSize(11.5),
		color: '#15803D',
		fontWeight: '700',
	},
	resultBtn: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(13),
	},
	resultBtnPrimary: {
		backgroundColor: '#3B82F6',
	},
	resultBtnPrimaryText: {
		fontSize: scaledSize(14),
		fontWeight: '800',
		color: '#fff',
	},
	resultBtnSecondary: {
		backgroundColor: '#EFF6FF',
		borderWidth: 1,
		borderColor: '#BFDBFE',
	},
	resultBtnSecondaryText: {
		fontSize: scaledSize(14),
		fontWeight: '800',
		color: '#3B82F6',
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
		marginLeft: scaleWidth(10),
	},
});
