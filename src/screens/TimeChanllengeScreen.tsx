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
import AnimatedNumbers from 'react-native-animated-numbers';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { TimeChallengeInterceptor } from '@/services/interceptor/TimeChanllengeInterceptor';

const MAX_LIVES = 5;
const CHOICE_COUNT = 4;

const SCORE_ENCOURAGEMENTS: { min: number; messages: string[] }[] = [
	{
		min: 1000,
		messages: ['🏆 정말 대단해요! 이건 거의 신급이에요!', '🎉 환상적인 성과! 축하드립니다!', '🌟 당신은 진정한 속담 마스터!'],
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
		messages: ['🌱 시작이 반이에요! 포기하지 마세요!', '🙌 계속 도전하면 분명 좋아질 거예요!', '🐾 한 걸음 한 걸음 앞으로!'],
	},
];
const getShuffledChoices = (correct: string, allMeanings: string[]) => {
	const wrongs = allMeanings.filter((m) => m !== correct);
	const shuffled = [...wrongs.sort(() => 0.5 - Math.random()).slice(0, CHOICE_COUNT - 1), correct];
	return shuffled.sort(() => 0.5 - Math.random());
};

const InfinityQuizScreen = () => {
	const TIME_CHALLENGE_KEY = MainStorageKeyType.TIME_CHALLENGE_HISTORY;

	const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

	const navigation = useNavigation();

	const scrollViewRef = useRef<ScrollView>(null);
	const scoreAnim = useRef(new Animated.Value(1)).current;
	const comboAnim = useRef(new Animated.Value(1)).current;
	const comboShake = useRef(new Animated.Value(0)).current;
	const comboEffectAnim = useRef(new Animated.Value(0)).current;
	const [comboEffectText, setComboEffectText] = useState('');
	const [toastRemainingSec, setToastRemainingSec] = useState<number | null>(null);

	const [lives, setLives] = useState(MAX_LIVES);
	const [score, setScore] = useState(0);

	const [questionList, setQuestionList] = useState<MainDataType.Proverb[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [choices, setChoices] = useState<string[]>([]);
	const [isGameOver, setIsGameOver] = useState(false);
	const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
	const [showExitModal, setShowExitModal] = useState(false);
	const [combo, setCombo] = useState(0);
	const [maxCombo, setMaxCombo] = useState(0);
	const [hasUsedSkip, setHasUsedSkip] = useState(false);
	const [timeLeftMs, setTimeLeftMs] = useState(180_000); // 180초 → 180,000ms
	const [hasUsedChance, setHasUsedChance] = useState(false);
	const [isToastClosable, setIsToastClosable] = useState(false);

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
	const labelColors = ['#1abc9c', '#3498db', '#9b59b6', '#e67e22']; // A, B, C, D 색상
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
			const allMeanings = questionList.map((q) => q.longMeaning);
			const newChoices = getShuffledChoices(current.longMeaning, allMeanings);
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
			const correct = questionList[currentIndex].longMeaning;
			const isCorrect = choice === correct;

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

	const handleChance = () => {
		if (hasUsedChance) {
			return;
		}

		const current = questionList[currentIndex];

		const example = current.example || '예문 없음';
		const category = current.category || '카테고리 없음';
		const sameProverb = current.sameProverb || '없음';

		// 여러 줄 구성
		const message = `
📂 카테고리 
${category}

📘 예문
${example}

🔍 비슷한 속담들
${sameProverb ? sameProverb : '-'}
`;

		showLongToast(message);
		setHasUsedChance(true);
	};

	const showToast = (message: string, durationSec: number = 3) => {
		setIsToastClosable(false); // 닫기 버튼 숨기기
		setToastMessage(message);
		setToastRemainingSec(durationSec);
		toastOpacity.setValue(0);

		// 기존 타이머가 있으면 정리
		if (toastTimerRef.current) {
			clearInterval(toastTimerRef.current);
			toastTimerRef.current = null;
		}

		// 카운트다운 시작
		let count = durationSec;
		toastTimerRef.current = setInterval(() => {
			count -= 1;
			if (count <= 0) {
				clearInterval(toastTimerRef.current!);
				toastTimerRef.current = null;
				setToastRemainingSec(null);
			} else {
				setToastRemainingSec(count);
			}
		}, 1000);

		Animated.sequence([
			Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
			Animated.delay(durationSec * 1000),
			Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
		]).start(() => {
			setToastMessage('');
			setToastRemainingSec(null); // 여기만 유지
		});
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
			<ScrollView ref={scrollViewRef} style={{ flex: 1 }} onScroll={scrollHandler.onScroll} keyboardShouldPersistTaps="handled">
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
									combo >= 2 && { color: '#e74c3c' },
								]}>
								{combo} Combo
							</Animated.Text>
						</View>
					</View>
				)}
				{!isGameOver && (
					<View style={styles.timeBoxWrapper}>
						<View style={styles.timeBox}>
							<IconComponent name="clock-o" type="FontAwesome" color="#27ae60" size={18} />
							<Text style={styles.timeText}>남은 시간: {formattedTime}</Text>
						</View>
					</View>
				)}
				{/* 💓 하트 최상단 단독 표시 */}

				{!isGameOver && (
					<View style={styles.lifeBarWrapper}>
						{!hasUsedChance && (
							<View style={styles.leftFixed}>
								<TouchableOpacity onPress={handleChance} style={styles.chanceContent}>
									<IconComponent name="magic" type="FontAwesome" color="#27ae60" size={16} />
									<Text style={styles.chanceText}>찬스 (1)</Text>
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
										marginHorizontal: 2,
									}}>
									<IconComponent name="heart" type="FontAwesome" size={20} color={i < lives ? '#ff4d4d' : '#e0e0e0'} />
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
								}}
								style={styles.rightFixed}>
								<View style={styles.skipContent}>
									<IconComponent name="forward" type="FontAwesome" color="#9b59b6" size={16} />
									<Text style={styles.skipText}>스킵 (1)</Text>
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
								<ConfettiCannon count={200} origin={{ x: scaleWidth(180), y: 0 }} fadeOut explosionSpeed={500} fallSpeed={2500} />
							</View>
						)}
						<View style={styles.resultWrapper}>
							<View style={styles.gameOverBox}>
								<View style={styles.resultTitleCard}>
									<View style={{ flexDirection: 'row', alignContent: 'center' }}>
										<IconComponent name="schedule" type="MaterialIcons" size={28} color="#e67e22" style={{ marginRight: scaleWidth(8) }} />
										<Text style={styles.gameOverText}>타임 챌린지 결과</Text>
									</View>
								</View>
								{gameResult && (
									<View
										style={{
											width: '100%',
											backgroundColor: '#f8f8ff',
											borderColor: '#d0d0ff',
											borderWidth: 1,
											borderRadius: scaleWidth(10),
											padding: scaleWidth(14),
											marginTop: scaleHeight(16),
										}}>
										<Text
											style={{
												fontSize: scaledSize(15),
												color: '#333',
												textAlign: 'center',
												lineHeight: scaleHeight(22),
												fontWeight: '600',
											}}>
											{encouragements[0]}
										</Text>
									</View>
								)}

								{gameResult && (
									<View style={{ alignItems: 'center', marginVertical: scaleHeight(16) }}>
										{/* 👇 최종 점수 텍스트 추가 */}
										<Text
											style={{
												fontSize: scaledSize(18),
												fontWeight: '600',
												color: '#2c3e50',
												marginBottom: scaleHeight(8),
											}}>
											최종 점수
										</Text>

										{/* 숫자 애니메이션 */}
										<View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
											<AnimatedNumbers
												animateToNumber={animatedScore}
												animationDuration={3000}
												fontStyle={{
													fontSize: scaledSize(64),
													fontWeight: 'bold',
													color: '#e74c3c', // 🔴 빨간색으로 변경
												}}
												includeComma
											/>
											<Text
												style={{
													fontSize: scaledSize(28),
													marginLeft: scaleWidth(4),
													marginBottom: scaleHeight(15),
												}}>
												점
											</Text>
										</View>
									</View>
								)}

								{gameResult && (
									<View style={styles.resultSummaryBox}>
										<View style={styles.resultRow}>
											<IconComponent name="list" type="FontAwesome" color="#3498db" size={20} />
											<Text style={styles.resultText}>
												푼 문제: <Text style={styles.bold}>{gameResult.totalQuestions}문제</Text>
											</Text>
										</View>
										<View style={styles.resultRow}>
											<IconComponent name="check" type="FontAwesome" color="#2ecc71" size={20} />
											<Text style={styles.resultText}>
												정답 수: <Text style={styles.bold}>{gameResult.correctCount}문제</Text>
											</Text>
										</View>
										<View style={styles.resultRow}>
											<IconComponent name="times" type="FontAwesome" color="#e74c3c" size={20} />
											<Text style={styles.resultText}>
												{' '}
												오답 수: <Text style={styles.bold}>{gameResult.wrongCount}문제</Text>
											</Text>
										</View>
										<View style={styles.resultRow}>
											<IconComponent name="fire" type="FontAwesome" color="#e67e22" size={20} />
											<Text style={styles.resultText}>
												최대 콤보: <Text style={styles.bold}>{gameResult.maxCombo} Combo!</Text>
											</Text>
										</View>
										<View style={styles.resultRow}>
											<IconComponent name="clock-o" type="FontAwesome" color="#27ae60" size={20} />
											<Text style={styles.resultText}>
												소요 시간: <Text style={styles.bold}>{(gameResult.timeUsedMs / 1000).toFixed(1)}초</Text>
											</Text>
										</View>
										{gameResult.hasUsedSkip && (
											<View style={styles.resultRow}>
												<IconComponent name="forward" type="FontAwesome" color="#9b59b6" size={20} />
												<Text style={styles.resultText}>스킵 기능 사용함</Text>
											</View>
										)}
										{gameResult.hasUsedChance && (
											<View style={styles.resultRow}>
												<IconComponent name="magic" type="FontAwesome" color="#27ae60" size={20} />
												<Text style={styles.resultText}>찬스 기능 사용함</Text>
											</View>
										)}
									</View>
								)}

								<View style={styles.resultButtons}>
									{/* 나의 랭킹 보러가기 */}
									<TouchableOpacity
										style={{
											flex: 1,
											backgroundColor: '#2980b9',
											borderRadius: scaleWidth(10),
											paddingVertical: scaleHeight(12),
											flexDirection: 'row',
											justifyContent: 'center',
											alignItems: 'center',
										}}
										onPress={() => {
											//@ts-ignore
											navigation.navigate(Paths.INIT_TIME_CHANLLENGE); // 실제 경로로 변경
										}}>
										<IconComponent name="bar-chart" type="FontAwesome" size={18} color="#fff" style={{ marginRight: scaleWidth(8) }} />
										<Text style={{ fontSize: scaledSize(14), fontWeight: 'bold', color: '#fff' }}>랭킹 보러가기</Text>
									</TouchableOpacity>

									{/* 다시 도전하기 */}
									<TouchableOpacity
										style={{
											flex: 1,
											backgroundColor: '#4caf50',
											borderRadius: scaleWidth(10),
											paddingVertical: scaleHeight(12),
											flexDirection: 'row',
											justifyContent: 'center',
											alignItems: 'center',
										}}
										onPress={startCountdownAndReset}>
										<IconComponent name="refresh" type="FontAwesome" color="#fff" size={18} style={{ marginRight: scaleWidth(8) }} />
										<Text style={{ fontSize: scaledSize(14), fontWeight: 'bold', color: '#fff' }}>다시 도전하기</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>

						<TouchableOpacity
							onPress={() => setIsFeedbackOpen(!isFeedbackOpen)}
							style={{
								backgroundColor: '#ecf0f1',
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
									color: '#2c3e50',
									marginRight: scaleWidth(5),
								}}>
								정답과 해설 보기
							</Text>
							<IconComponent name={isFeedbackOpen ? 'angle-up' : 'angle-down'} type="FontAwesome" color="#2c3e50" size={18} />
						</TouchableOpacity>

						{/* 문제 피드백 리스트 */}
						{isFeedbackOpen && (
							<View style={styles.feedbackList}>
								{solvedProverbs.map((q, i) => {
									const isCorrect = resultMap[q.id] === 'correct';
									return (
										// TODO: 수정 필요
										<View key={q.id} style={[styles.feedbackItem, { backgroundColor: isCorrect ? '#eafaf1' : '#fdecea' }]}>
											<Text style={[styles.feedbackTitle, { color: isCorrect ? '#27ae60' : '#c0392b' }]}>
												{i + 1}. {q.proverb} {isCorrect ? '⭕ 정답' : '❌ 오답'}
											</Text>
											<Text style={styles.feedbackMeaning}>
												➤ 의미: <Text style={{ fontWeight: 'bold' }}>{q.longMeaning}</Text>
											</Text>
										</View>
									);
								})}
							</View>
						)}
					</>
				) : (
					<View style={[styles.questionBox, feedback === 'correct' && styles.questionBoxCorrect, feedback === 'wrong' && styles.questionBoxWrong]}>
						<View style={{ marginBottom: scaleHeight(20) }}>
							<Text style={styles.questionText}>{current.proverb}</Text>
							{feedback && (
								<Text
									style={[
										styles.feedbackStatus,
										{
											color: feedback === 'correct' ? '#27ae60' : '#e74c3c',
											marginTop: scaleHeight(6),
										},
									]}>
									{feedback === 'correct' ? '⭕ 정답!' : '❌ 오답'}
								</Text>
							)}
						</View>

						{choices.map((choice, index) => {
							const isCorrectAnswer = choice === current.longMeaning;
							const isUserSelected = feedback !== null && choice === choices.find((c) => c === choice && c === questionList[currentIndex].longMeaning);
							const wasUserWrong = feedback === 'wrong' && isUserSelected && !isCorrectAnswer;

							let borderColor = labelColors[index];
							let suffix = '';

							if (feedback === 'correct' && isCorrectAnswer) {
								borderColor = '#2ecc71'; // 초록 테두리
								suffix = ' (O)';
							} else if (feedback === 'wrong') {
								if (isCorrectAnswer) {
									borderColor = '#2ecc71'; // 정답은 초록 테두리
									suffix = ' (O)';
								} else if (wasUserWrong) {
									borderColor = '#e74c3c'; // 오답은 빨간 테두리
									suffix = ' (X)';
								}
							}

							return (
								<TouchableOpacity
									key={choice}
									style={[
										styles.choiceBtn,
										feedback &&
										(() => {
											if (feedback === 'correct' && isCorrectAnswer) {
												return {
													backgroundColor: '#d4edda',
													borderColor: '#2ecc71', // ✅ 초록 테두리
												};
											} else if (feedback === 'wrong') {
												if (isUserSelected && !isCorrectAnswer) {
													return {
														backgroundColor: '#f8d7da',
														borderColor: '#e74c3c', // ✅ 빨간 테두리 (오답)
													};
												} else if (isCorrectAnswer) {
													return {
														backgroundColor: '#d4edda',
														borderColor: '#2ecc71', // ✅ 정답
													};
												}
											}
											return {};
										})(),
									]}
									onPress={() => handleAnswer(choice)}
									disabled={feedback !== null}>
									<Text style={styles.choiceBtnText}>
										<Text style={{ color: labelColors[index] }}>{String.fromCharCode(65 + index)}.</Text> {choice}
										<Text
											style={{
												fontWeight: 'bold',
												color: suffix === ' (O)' ? '#27ae60' : suffix === ' (X)' ? '#c0392b' : '#000',
											}}>
											{suffix}
										</Text>
									</Text>
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

			{showExitModal && (
				<Modal visible transparent animationType="fade">
					<View style={styles.modalOverlay}>
						<View style={styles.exitModal}>
							<Text style={styles.exitModalTitle}>타임 챌린지를 종료하시겠어요?</Text>
							<Text style={styles.exitModalMessage}>진행 중인 퀴즈는 저장되지 않습니다.</Text>
							<View style={styles.modalButtonRow}>
								<TouchableOpacity
									style={[styles.modalBackButton, { backgroundColor: '#bdc3c7' }]}
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
						<Animated.Text style={[styles.countdownText, { transform: [{ scale: scaleAnim }] }]}>{count === 0 ? '시작!' : count}</Animated.Text>
						<Text style={styles.countdownMessage}>
							{count === 3 ? '심호흡 하세요…' : count === 2 ? '준비하세요!' : count === 1 ? '곧 시작됩니다!' : ''}
						</Text>
					</View>
				</View>
			)}

			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop}>
					<IconComponent type="MaterialIcons" name="arrow-upward" size={24} color="#ffffff" />
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
							color: '#e74c3c',
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
						top: '20%',
						left: 0,
						right: 0,
						alignItems: 'center',
						opacity: toastOpacity,
						zIndex: 1000,
					}}>
					<View
						style={{
							backgroundColor: '#2c3e50',
							paddingVertical: scaleHeight(20),
							paddingHorizontal: scaleWidth(24),
							borderRadius: scaleWidth(28),
							minHeight: scaleHeight(100),
							minWidth: scaleWidth(200),
							maxWidth: '85%',
							justifyContent: 'center',
							alignItems: 'center',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.3,
							shadowRadius: 6,
						}}>
						<Text
							style={{
								color: '#fff',
								fontSize: scaledSize(18),
								fontWeight: '700',
								textAlign: 'center',
								lineHeight: scaleHeight(28),
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
									backgroundColor: '#34495e',
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
	container: { flex: 1, padding: 20, backgroundColor: '#fff' },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	score: { fontSize: scaledSize(20), fontWeight: 'bold' },
	lives: { fontSize: scaledSize(20), color: 'red' },
	statusText: {
		fontSize: scaledSize(14),
		color: '#555',
	},
	scoreValue: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#333',
		marginTop: 4,
	},

	correct: { backgroundColor: '#d4fdd4' },
	wrong: { backgroundColor: '#ffd6d6' },
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
		backgroundColor: '#4caf50',
		borderRadius: 10,
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
		borderTopColor: '#eee',
		paddingTop: scaleHeight(6),
		paddingBottom: Platform.OS === 'android' ? scaleHeight(10) : scaleHeight(14),
	},
	exitButton: {
		backgroundColor: '#7f8c8d',
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
		backgroundColor: 'rgba(0,0,0,0.4)',
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
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
		textAlign: 'center',
	},
	exitModalMessage: {
		fontSize: scaledSize(15),
		color: '#7f8c8d',
		marginBottom: scaleHeight(20),
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	exitModalConfirmButton: {
		flex: 1,
		backgroundColor: '#e74c3c',
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
		backgroundColor: '#bdc3c7',
		padding: scaleHeight(12),
		borderRadius: scaleWidth(8),
		marginRight: scaleWidth(6),
		alignItems: 'center',
	},
	modalStartButton: {
		flex: 1,
		backgroundColor: '#3498db',
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
		borderBottomColor: '#eee',
		zIndex: 10,
	},

	statusBox: {
		flex: 1,
		marginHorizontal: scaleWidth(4),
		backgroundColor: '#f9f9f9',
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
		color: '#555',
	},

	statusValue: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#2c3e50',
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
		borderBottomColor: '#eee',
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
		borderColor: '#ddd',
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},

	questionBox: {
		marginTop: scaleHeight(10),
		padding: 20,
		borderRadius: 16,
		backgroundColor: '#f9f9f9',
		borderWidth: 1,
		borderColor: '#b6e3f6',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
	},
	questionText: {
		fontSize: scaledSize(24),
		fontWeight: 'bold',
		textAlign: 'left',
		color: '#2c3e50',
	},
	choicesWrapper: {
		gap: scaleHeight(10),
	},
	choiceBtn: {
		padding: 16,
		marginVertical: scaleHeight(8),
		marginHorizontal: scaleWidth(6),
		backgroundColor: '#ecf0f1',
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#ccc',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 4,

		// 이 줄 수정!
		alignItems: 'flex-start',
	},
	choiceBtnText: {
		fontSize: scaledSize(16),
		textAlign: 'left',
		color: '#2c3e50',
		fontWeight: '500',
	},
	skipTopRightButton: {
		position: 'absolute',
		top: scaleHeight(12),
		right: scaleWidth(12),
		zIndex: 1,
	},
	skipTopRightText: {
		fontSize: scaledSize(12),
		color: '#555',
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
		backgroundColor: '#e8f8f5', // 💚 연한 초록 계열 배경
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#b2dfdb',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},

	timeText: {
		marginLeft: scaleWidth(8),
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
	},
	skipInlineButton: {
		backgroundColor: '#eee',
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(10),
		borderRadius: 8,
		marginLeft: scaleWidth(6),
	},
	skipInlineText: {
		fontSize: scaledSize(12),
		color: '#555',
		fontWeight: '500',
	},
	questionBoxCorrect: {
		backgroundColor: '#d4edda', // 연한 초록색 배경
	},
	questionBoxWrong: {
		backgroundColor: '#f8d7da', // 연한 빨간색 배경
	},
	resultSummaryBox: {
		width: '100%', // ✅ 전체 너비 사용
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(24),
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(14),
		backgroundColor: '#fefefe',
		borderWidth: 1,
		borderColor: '#e0e0e0',
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
		borderBottomColor: '#f0f0f0',
	},
	resultText: {
		fontSize: scaledSize(15),
		marginLeft: scaleWidth(10),
		color: '#34495e',
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
		borderColor: '#ccc',
		borderRadius: scaleWidth(12),
		backgroundColor: '#fefefe',
	},
	feedbackItem: {
		padding: scaleWidth(12),
		borderRadius: scaleWidth(10),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#ccc',
	},
	feedbackTitle: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		marginBottom: scaleHeight(12),
	},
	feedbackMeaning: {
		fontSize: scaledSize(14),
		marginBottom: scaleHeight(2),
		color: '#2c3e50',
	},
	feedbackResult: {
		fontSize: scaledSize(13),
		color: '#555',
	},
	countdownOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		zIndex: 999,
	},
	countdownText: {
		fontSize: scaledSize(72),
		fontWeight: 'bold',
		color: '#fff',
	},
	countdownMessage: {
		fontSize: scaledSize(20),
		marginTop: scaleHeight(12),
		color: '#fff',
		fontWeight: '500',
	},
	feedbackStatus: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		marginLeft: scaleWidth(8),
	},
	skipButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f0e9f9',
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
		gap: scaleWidth(6),
	},

	skipText: {
		fontSize: scaledSize(13),
		color: '#6c3483',
		fontWeight: '600',
		lineHeight: scaleHeight(15),
	},
	lifeBarWrapper: {
		position: 'relative',
		height: scaleHeight(40),
		justifyContent: 'center',
		marginBottom: scaleHeight(6),
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: scaleWidth(12),
		backgroundColor: '#fdfdfd',
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
		backgroundColor: '#f0e9f9',
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
		backgroundColor: '#2196F3',
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
	},
	leftFixed: {
		position: 'absolute',
		left: scaleWidth(12),
		justifyContent: 'center',
		height: '100%',
	},

	rightFixed: {
		position: 'absolute',
		right: scaleWidth(12),
		justifyContent: 'center',
		height: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f0e9f9',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},

	chanceText: {
		fontSize: scaledSize(13),
		lineHeight: scaleHeight(15),
		color: '#2980b9',
		fontWeight: '600',
	},
	chanceContent: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#e8f8f5', // 💚 연한 초록색 배경
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		gap: scaleWidth(6), // 아이콘과 텍스트 간격
	},
	resultTitleCard: {
		alignItems: 'center',
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		backgroundColor: '#fdf6ec',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#f5c26b',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},
	animatedScore: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#e67e22',
	},
	resultWrapper: {
		marginTop: scaleHeight(28),
		width: '100%',
		borderWidth: 1,
		borderColor: '#ccc',
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
		gap: scaleWidth(12),
		marginBottom: scaleHeight(16),
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
});
