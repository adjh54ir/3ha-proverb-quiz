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

// ────────────────────────────────────────────────────────────
// 🎨 Design Tokens
// ────────────────────────────────────────────────────────────
const C = {
	bg: '#F8F9FF', // 전체 배경 (아주 연한 블루-화이트)
	white: '#FFFFFF',
	card: '#FFFFFF', // 카드 배경
	border: '#EEF0F7', // 기본 테두리
	indigo: '#5C6BC0', // 메인 포인트 (인디고)
	indigoLight: '#E8EAF6', // 인디고 연한 배경
	indigoDark: '#3949AB', // 인디고 진한
	emerald: '#00BFA5', // 성공/정답
	emeraldLight: '#E0F7F4',
	rose: '#F43F5E', // 오답/위험
	roseLight: '#FFF0F3',
	amber: '#FF8F00', // 콤보/경고
	amberLight: '#FFF8E1',
	purple: '#7C3AED', // 스킵
	purpleLight: '#F3EFFF',
	cyan: '#00ACC1', // 타이머
	cyanLight: '#E0F7FA',
	txt1: '#1A1D2E', // 텍스트 강조
	txt2: '#5C6070', // 텍스트 보조
	txt3: '#9CA3AF', // 텍스트 흐림
	shadow: 'rgba(92, 107, 192, 0.12)',
};

// 보기 버튼 색상 (A B C D)
const LABEL_COLORS = [C.indigo, C.emerald, C.amber, C.purple];
const LABEL_BG = [C.indigoLight, C.emeraldLight, C.amberLight, C.purpleLight];

const MAX_LIVES = 5;
const CHOICE_COUNT = 4;

const SCORE_ENCOURAGEMENTS: { min: number; messages: string[] }[] = [
	{ min: 1000, messages: ['🏆 정말 대단해요! 이건 거의 신급이에요!', '🎉 환상적인 성과! 축하드립니다!', '🌟 당신은 진정한 속담 마스터!'] },
	{ min: 500, messages: ['💪 훌륭했어요! 많이 맞췄네요!', '🔥 집중력이 남달라요!', '👏 눈부신 실력이에요!'] },
	{ min: 200, messages: ['👍 잘했어요! 점점 실력이 늘고 있어요!', '😊 안정적인 실력이네요!', '📈 다음엔 더 높은 점수를 노려봐요!'] },
	{ min: 0, messages: ['🌱 시작이 반이에요! 포기하지 마세요!', '🙌 계속 도전하면 분명 좋아질 거예요!', '🐾 한 걸음 한 걸음 앞으로!'] },
];

const getShuffledChoices = (correct: string, allMeanings: string[]) => {
	const wrongs = allMeanings.filter((m) => m !== correct);
	const shuffled = [...wrongs.sort(() => 0.5 - Math.random()).slice(0, CHOICE_COUNT - 1), correct];
	return shuffled.sort(() => 0.5 - Math.random());
};

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
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
	const [timeLeftMs, setTimeLeftMs] = useState(180_000);
	const [hasUsedChance, setHasUsedChance] = useState(false);
	const [isToastClosable, setIsToastClosable] = useState(false);
	const formattedTime = `${(timeLeftMs / 1000).toFixed(2)}초`;
	const [isPaused, setIsPaused] = useState(false);
	const [heartAnimations] = useState(Array.from({ length: MAX_LIVES }, () => new Animated.Value(1)));
	const [isCountingDown, setIsCountingDown] = useState(false);
	const [count, setCount] = useState(3);
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const [showConfetti, setShowConfetti] = useState(false);
	const [resultMap, setResultMap] = useState<{ [id: number]: 'correct' | 'wrong' }>({});
	const [gameResult, setGameResult] = useState<MainDataType.TimeChallengeResult | null>(null);
	const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const solvedProverbs = questionList.slice(0, currentIndex + 1).filter((q) => resultMap[q.id]);
	const [bonusHistory, setBonusHistory] = useState<number[]>([]);
	const [toastMessage, setToastMessage] = useState('');
	const toastOpacity = useRef(new Animated.Value(0)).current;
	const [encouragements, setEncouragements] = useState<string[]>([]);
	const [animatedScore, setAnimatedScore] = useState(0);

	// 타이머 게이지 (0~1)
	const timerProgress = timeLeftMs / 180_000;
	const timerColor = timerProgress > 0.4 ? C.cyan : timerProgress > 0.2 ? C.amber : C.rose;

	useEffect(() => {
		const allProverbs = ProverbServices.selectProverbList();
		setQuestionList(allProverbs.sort(() => 0.5 - Math.random()));
	}, []);

	useEffect(() => {
		if (gameResult) {setTimeout(() => setAnimatedScore(gameResult.finalScore), 100);}
	}, [gameResult]);

	useEffect(() => {
		if (questionList.length > 0 && currentIndex < questionList.length) {
			const current = questionList[currentIndex];
			const allMeanings = questionList.map((q) => q.longMeaning);
			setChoices(getShuffledChoices(current.longMeaning, allMeanings));
		}
	}, [questionList, currentIndex]);

	useEffect(() => {
		if (isGameOver && gameResult) {
			setShowConfetti(true);
			const match = SCORE_ENCOURAGEMENTS.find(({ min }) => gameResult.finalScore >= min);
			setEncouragements((match?.messages.sort(() => 0.5 - Math.random()) ?? []).slice(0, 3));
		}
	}, [isGameOver, gameResult]);

	useEffect(() => {
		if (isGameOver || isPaused) {return;}
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
	}, [isGameOver, isPaused]);

	useEffect(() => {
		if (lives < MAX_LIVES) {
			const idx = lives;
			Animated.sequence([
				Animated.timing(heartAnimations[idx], { toValue: 0.8, duration: 250, useNativeDriver: true }),
				Animated.timing(heartAnimations[idx], { toValue: 1, duration: 150, useNativeDriver: true }),
			]).start();
		}
	}, [lives]);

	const scrollHandler = {
		onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
			setShowScrollTop(event.nativeEvent.contentOffset.y > moderateScale(100));
		},
		toTop: () => scrollViewRef.current?.scrollTo({ y: 0, animated: true }),
		toBottom: () => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100),
	};

	const saveChallengeResultToStorage = async (result: MainDataType.TimeChallengeResult) => {
		try {
			const existingData = await AsyncStorage.getItem(TIME_CHALLENGE_KEY);
			const history: MainDataType.TimeChallengeHistory = existingData ? JSON.parse(existingData) : [];
			await AsyncStorage.setItem(TIME_CHALLENGE_KEY, JSON.stringify([result, ...history]));
		} catch (e) {
			console.error('⚠️ Failed to save TimeChallenge result', e);
		}
	};

	const animateScale = () => {
		scaleAnim.setValue(1.5);
		Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
	};

	const startCountdownAndReset = () => {
		setIsCountingDown(true);
		setIsFeedbackOpen(false);
		let countdown = 3;
		setCount(countdown);
		animateScale();
		const timer = setInterval(() => {
			countdown--;
			if (countdown < 0) {
				clearInterval(timer);
				setTimeout(() => {
					setIsCountingDown(false);
					resetGame();
				}, 800);
				return;
			}
			setCount(countdown);
			animateScale();
		}, 1000);
	};

	const handleGameOver = () => {
		const quizDate = new Date().toISOString();
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
			totalQuestions: solvedCount,
			solvedQuestions: solvedCount,
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
		setGameResult(result);
	};

	const handleAnswer = useCallback(
		(choice: string) => {
			const correct = questionList[currentIndex].longMeaning;
			const isCorrect = choice === correct;
			setTimeout(() => {
				if (isCorrect) {
					setResultMap((prev) => ({ ...prev, [questionList[currentIndex].id]: 'correct' }));
					setFeedback('correct');
					setScore((prev) => {
						const baseScore = 10;
						let bonusScore = 0;
						const newCombo = combo + 1;
						if (newCombo === 3) {bonusScore = 5;}
						else if (newCombo === 4) {bonusScore = 10;}
						else if (newCombo === 5) {bonusScore = 20;}
						else if (newCombo >= 6) {bonusScore = 30;}
						const totalScore = prev + baseScore + bonusScore;
						const bonus = TimeChallengeInterceptor(totalScore, bonusHistory);
						if (bonus.addedTime > 0) {setTimeLeftMs((prevTime) => prevTime + bonus.addedTime);}
						if (bonus.addedHeart) {setLives((prevLives) => (prevLives < MAX_LIVES ? prevLives + 1 : prevLives));}
						if (bonus.message) {showToast(bonus.message);}
						if (bonus.updatedHistory) {setBonusHistory(bonus.updatedHistory);}
						return totalScore;
					});
					triggerScoreAnim();
					setCombo((prev) => {
						const newCombo = prev + 1;
						if (newCombo >= 2)
							{setTimeout(() => {
								triggerComboAnim();
								triggerComboShake();
								triggerComboEffect(newCombo);
							}, 0);}
						if (newCombo > maxCombo) {setMaxCombo(newCombo);}
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
					const newLives = isCorrect ? lives : lives - 1;
					if (newLives <= 0) {
						handleGameOver();
						setIsGameOver(true);
					} else {setCurrentIndex((prev) => prev + 1);}
				}, 500);
			}, 150);
		},
		[questionList, currentIndex, lives],
	);

	const triggerScoreAnim = () => {
		scoreAnim.setValue(1.4);
		Animated.spring(scoreAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
	};
	const triggerComboAnim = () => {
		comboAnim.setValue(1.4);
		Animated.spring(comboAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
	};

	const showLongToast = (message: string) => {
		setIsToastClosable(true);
		setToastMessage(message);
		toastOpacity.setValue(0);
		Animated.sequence([
			Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
			Animated.delay(5000),
			Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
		]).start(() => setToastMessage(''));
	};

	const triggerComboShake = () => {
		comboShake.setValue(0);
		Animated.sequence([
			Animated.timing(comboShake, { toValue: 1, duration: 50, useNativeDriver: true }),
			Animated.timing(comboShake, { toValue: -1, duration: 50, useNativeDriver: true }),
			Animated.timing(comboShake, { toValue: 0, duration: 50, useNativeDriver: true }),
		]).start();
	};

	const triggerComboEffect = (comboValue: number) => {
		let bonus = 0;
		if (comboValue === 3) {bonus = 5;}
		else if (comboValue === 4) {bonus = 10;}
		else if (comboValue === 5) {bonus = 20;}
		else if (comboValue >= 6) {bonus = 30;}
		if (comboValue >= 2) {
			setComboEffectText(`🔥 ${comboValue} Combo! ${bonus > 0 ? `+${bonus}점` : ''}`);
			comboEffectAnim.setValue(0);
			Animated.timing(comboEffectAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => setComboEffectText(''));
		}
	};

	const handleChance = () => {
		if (hasUsedChance) {return;}
		const current = questionList[currentIndex];
		showLongToast(
			`📂 카테고리 \n${current.category || '카테고리 없음'}\n\n📘 예문\n${current.example || '예문 없음'}\n\n🔍 비슷한 속담들\n${current.sameProverb || '-'}`,
		);
		setHasUsedChance(true);
	};

	const showToast = (message: string, durationSec: number = 3) => {
		setIsToastClosable(false);
		setToastMessage(message);
		setToastRemainingSec(durationSec);
		toastOpacity.setValue(0);
		if (toastTimerRef.current) {
			clearInterval(toastTimerRef.current);
			toastTimerRef.current = null;
		}
		let count = durationSec;
		toastTimerRef.current = setInterval(() => {
			count -= 1;
			if (count <= 0) {
				clearInterval(toastTimerRef.current!);
				toastTimerRef.current = null;
				setToastRemainingSec(null);
			} else {setToastRemainingSec(count);}
		}, 1000);
		Animated.sequence([
			Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
			Animated.delay(durationSec * 1000),
			Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
		]).start(() => {
			setToastMessage('');
			setToastRemainingSec(null);
		});
	};

	const resetGame = () => {
		setQuestionList(ProverbServices.selectProverbList().sort(() => 0.5 - Math.random()));
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
		setResultMap({});
		setGameResult(null);
		heartAnimations.forEach((anim) => anim.setValue(1));
	};

	if (questionList.length === 0) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={{ color: C.txt2, textAlign: 'center', marginTop: 40 }}>문제를 불러오는 중...</Text>
			</SafeAreaView>
		);
	}

	const current = questionList[currentIndex];

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<ScrollView ref={scrollViewRef} style={{ flex: 1 }} onScroll={scrollHandler.onScroll} keyboardShouldPersistTaps="handled">
				{/* ── 상태바: 점수 / 문제 / 콤보 ── */}
				{!isGameOver && (
					<View style={styles.statusRow}>
						{/* 점수 */}
						<View style={[styles.statCard, { borderTopColor: C.indigo }]}>
							<Text style={styles.statEmoji}>🎯</Text>
							<Animated.Text style={[styles.statValue, { transform: [{ scale: scoreAnim }] }]}>{score}</Animated.Text>
							<Text style={styles.statLabel}>점수</Text>
						</View>

						{/* 문제 */}
						<View style={[styles.statCard, { borderTopColor: C.emerald }]}>
							<Text style={styles.statEmoji}>📝</Text>
							<Text style={styles.statValue}>{currentIndex + 1}</Text>
							<Text style={styles.statLabel}>/ {questionList.length}문제</Text>
						</View>

						{/* 콤보 */}
						<View style={[styles.statCard, { borderTopColor: C.amber }]}>
							<Text style={styles.statEmoji}>🔥</Text>
							<Animated.Text
								style={[
									styles.statValue,
									combo >= 2 && { color: C.amber },
									{
										transform: [{ scale: comboAnim }, { translateX: comboShake.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] }) }],
									},
								]}>
								{combo}
							</Animated.Text>
							<Text style={styles.statLabel}>콤보</Text>
						</View>
					</View>
				)}

				{/* ── 타이머 ── */}
				{!isGameOver && (
					<View style={styles.timerWrapper}>
						<View style={styles.timerRow}>
							<IconComponent name="clock-o" type="FontAwesome" color={timerColor} size={14} />
							<Text style={[styles.timerText, { color: timerColor }]}>{formattedTime}</Text>
						</View>
						{/* 프로그레스 바 */}
						<View style={styles.timerBarBg}>
							<Animated.View
								style={[
									styles.timerBarFill,
									{
										width: `${timerProgress * 100}%` as any,
										backgroundColor: timerColor,
									},
								]}
							/>
						</View>
					</View>
				)}

				{/* ── 하트 / 찬스 / 스킵 바 ── */}
				{!isGameOver && (
					<View style={styles.lifeBar}>
						{/* 찬스 */}
						{!hasUsedChance ? (
							<TouchableOpacity onPress={handleChance} style={[styles.utilBtn, { backgroundColor: C.emeraldLight, borderColor: C.emerald }]}>
								<IconComponent name="magic" type="FontAwesome" color={C.emerald} size={13} />
								<Text style={[styles.utilBtnText, { color: C.emerald }]}>찬스</Text>
							</TouchableOpacity>
						) : (
							<View style={styles.utilBtnPlaceholder} />
						)}

						{/* 하트 */}
						<View style={styles.heartsCenter}>
							{Array.from({ length: MAX_LIVES }).map((_, i) => (
								<Animated.View key={i} style={{ transform: [{ scale: heartAnimations[i] }], marginHorizontal: scaleWidth(3) }}>
									<IconComponent name="heart" type="FontAwesome" size={18} color={i < lives ? C.rose : C.border} />
								</Animated.View>
							))}
						</View>

						{/* 스킵 */}
						{!hasUsedSkip ? (
							<TouchableOpacity
								onPress={() => {
									setHasUsedSkip(true);
									setCurrentIndex((prev) => prev + 1);
									setFeedback(null);
									setCombo(0);
								}}
								style={[styles.utilBtn, { backgroundColor: C.purpleLight, borderColor: C.purple }]}>
								<IconComponent name="forward" type="FontAwesome" color={C.purple} size={13} />
								<Text style={[styles.utilBtnText, { color: C.purple }]}>스킵</Text>
							</TouchableOpacity>
						) : (
							<View style={styles.utilBtnPlaceholder} />
						)}
					</View>
				)}

				{/* ── 게임 진행: 문제 + 보기 ── */}
				{!isGameOver && (
					<View style={[styles.questionCard, feedback === 'correct' && styles.questionCardCorrect, feedback === 'wrong' && styles.questionCardWrong]}>
						{/* 문제 번호 뱃지 */}
						<View style={styles.questionBadge}>
							<Text style={styles.questionBadgeText}>Q{currentIndex + 1}</Text>
						</View>

						<Text style={styles.questionText}>{current.proverb}</Text>

						{feedback && (
							<View style={[styles.feedbackBanner, { backgroundColor: feedback === 'correct' ? C.emeraldLight : C.roseLight }]}>
								<Text style={[styles.feedbackBannerText, { color: feedback === 'correct' ? C.emerald : C.rose }]}>
									{feedback === 'correct' ? '⭕  정답!' : '❌  오답'}
								</Text>
							</View>
						)}

						{/* 보기 버튼 */}
						<View style={{ marginTop: scaleHeight(16) }}>
							{choices.map((choice, index) => {
								const isCorrectAnswer = choice === current.longMeaning;
								const isUserSelected = feedback !== null && choice === current.longMeaning;
								const wasUserWrong = feedback === 'wrong' && isUserSelected && !isCorrectAnswer;

								let cardStyle = {};
								let labelBg = LABEL_BG[index];
								let labelColor = LABEL_COLORS[index];
								let suffix = '';

								if (feedback === 'correct' && isCorrectAnswer) {
									cardStyle = styles.choiceBtnCorrect;
									suffix = ' ✓';
								} else if (feedback === 'wrong') {
									if (isCorrectAnswer) {
										cardStyle = styles.choiceBtnCorrect;
										suffix = ' ✓';
									} else if (wasUserWrong) {
										cardStyle = styles.choiceBtnWrong;
										suffix = ' ✗';
									}
								}

								return (
									<TouchableOpacity
										key={choice}
										style={[styles.choiceBtn, cardStyle]}
										onPress={() => handleAnswer(choice)}
										disabled={feedback !== null}
										activeOpacity={0.75}>
										{/* 레이블 뱃지 */}
										<View style={[styles.choiceLabel, { backgroundColor: labelBg }]}>
											<Text style={[styles.choiceLabelText, { color: labelColor }]}>{String.fromCharCode(65 + index)}</Text>
										</View>
										<Text style={styles.choiceText}>
											{choice}
											{suffix !== '' && <Text style={{ fontWeight: '800', color: suffix === ' ✓' ? C.emerald : C.rose }}>{suffix}</Text>}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
				)}

				{/* ── 결과 화면 ── */}
				{isGameOver && (
					<>
						{showConfetti && (
							<View style={styles.confettiWrapper}>
								<ConfettiCannon count={200} origin={{ x: scaleWidth(180), y: 0 }} fadeOut explosionSpeed={500} fallSpeed={2500} />
							</View>
						)}

						{/* 결과 카드 */}
						<View style={styles.resultCard}>
							{/* 헤더 */}
							<View style={styles.resultHeader}>
								<IconComponent name="schedule" type="MaterialIcons" size={24} color={C.amber} />
								<Text style={styles.resultTitle}>타임 챌린지 결과</Text>
							</View>

							{/* 격려 메시지 */}
							{gameResult && (
								<View style={styles.encourageBox}>
									<Text style={styles.encourageText}>{encouragements[0]}</Text>
								</View>
							)}

							{/* 최종 점수 */}
							{gameResult && (
								<View style={styles.scoreBig}>
									<Text style={styles.scoreBigLabel}>최종 점수</Text>
									<View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
										<AnimatedNumbers
											animateToNumber={animatedScore}
											animationDuration={3000}
											fontStyle={{ fontSize: scaledSize(64), fontWeight: '900', color: C.indigo }}
											includeComma
										/>
										<Text style={styles.scoreBigUnit}>점</Text>
									</View>
								</View>
							)}

							{/* 통계 그리드 */}
							{gameResult && (
								<View style={styles.statsGrid}>
									<View style={styles.statGridItem}>
										<Text style={styles.statGridEmoji}>📋</Text>
										<Text style={styles.statGridValue}>{gameResult.totalQuestions}</Text>
										<Text style={styles.statGridLabel}>푼 문제</Text>
									</View>
									<View style={[styles.statGridItem, styles.statGridItemBorder]}>
										<Text style={styles.statGridEmoji}>✅</Text>
										<Text style={[styles.statGridValue, { color: C.emerald }]}>{gameResult.correctCount}</Text>
										<Text style={styles.statGridLabel}>정답</Text>
									</View>
									<View style={[styles.statGridItem, styles.statGridItemBorder]}>
										<Text style={styles.statGridEmoji}>❌</Text>
										<Text style={[styles.statGridValue, { color: C.rose }]}>{gameResult.wrongCount}</Text>
										<Text style={styles.statGridLabel}>오답</Text>
									</View>
									<View style={[styles.statGridItem, styles.statGridItemBorder]}>
										<Text style={styles.statGridEmoji}>🔥</Text>
										<Text style={[styles.statGridValue, { color: C.amber }]}>{gameResult.maxCombo}</Text>
										<Text style={styles.statGridLabel}>최대콤보</Text>
									</View>
								</View>
							)}

							{/* 부가 정보 */}
							{gameResult && (
								<View style={styles.resultMeta}>
									<View style={styles.resultMetaRow}>
										<IconComponent name="clock-o" type="FontAwesome" color={C.txt3} size={14} />
										<Text style={styles.resultMetaText}>
											소요 시간: <Text style={styles.resultMetaBold}>{(gameResult.timeUsedMs / 1000).toFixed(1)}초</Text>
										</Text>
									</View>
									{gameResult.hasUsedSkip && (
										<View style={styles.resultMetaRow}>
											<IconComponent name="forward" type="FontAwesome" color={C.purple} size={14} />
											<Text style={styles.resultMetaText}>스킵 기능 사용함</Text>
										</View>
									)}
									{gameResult.hasUsedChance && (
										<View style={styles.resultMetaRow}>
											<IconComponent name="magic" type="FontAwesome" color={C.emerald} size={14} />
											<Text style={styles.resultMetaText}>찬스 기능 사용함</Text>
										</View>
									)}
								</View>
							)}

							{/* 버튼 */}
							<View style={styles.resultBtnRow}>
								<TouchableOpacity
									style={[styles.resultBtn, { backgroundColor: C.indigoLight, borderColor: C.indigo }]}
									onPress={() => {
										//@ts-ignore
										navigation.navigate(Paths.INIT_TIME_CHANLLENGE);
									}}>
									<IconComponent name="bar-chart" type="FontAwesome" size={15} color={C.indigo} />
									<Text style={[styles.resultBtnText, { color: C.indigo }]}>랭킹 보기</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.resultBtn, { backgroundColor: C.indigo, borderColor: C.indigoDark }]} onPress={startCountdownAndReset}>
									<IconComponent name="refresh" type="FontAwesome" color={C.white} size={15} />
									<Text style={[styles.resultBtnText, { color: C.white }]}>다시 도전</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* 정답·해설 토글 */}
						<TouchableOpacity onPress={() => setIsFeedbackOpen(!isFeedbackOpen)} style={styles.feedbackToggle}>
							<Text style={styles.feedbackToggleText}>정답과 해설 보기</Text>
							<IconComponent name={isFeedbackOpen ? 'angle-up' : 'angle-down'} type="FontAwesome" color={C.txt2} size={16} />
						</TouchableOpacity>

						{isFeedbackOpen && (
							<View style={styles.feedbackList}>
								{solvedProverbs.map((q, i) => {
									const isCorrect = resultMap[q.id] === 'correct';
									return (
										<View key={q.id} style={[styles.feedbackItem, { borderLeftColor: isCorrect ? C.emerald : C.rose }]}>
											<Text style={[styles.feedbackItemTitle, { color: isCorrect ? C.emerald : C.rose }]}>
												{i + 1}. {q.proverb} {isCorrect ? '⭕' : '❌'}
											</Text>
											<Text style={styles.feedbackItemMeaning}>
												<Text style={{ color: C.txt3 }}>의미 </Text>
												{q.longMeaning}
											</Text>
										</View>
									);
								})}
							</View>
						)}
					</>
				)}

				<View style={{ height: scaleHeight(20) }} />
			</ScrollView>

			{/* ── 하단 종료 버튼 ── */}
			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={styles.exitBtn}
					onPress={() => {
						setIsPaused(true);
						setShowExitModal(true);
					}}>
					<Text style={styles.exitBtnText}>종료하기</Text>
				</TouchableOpacity>
			</View>

			{/* ── 종료 모달 ── */}
			{showExitModal && (
				<Modal visible transparent animationType="fade">
					<View style={styles.modalOverlay}>
						<View style={styles.modalCard}>
							<View style={styles.modalIconWrap}>
								<IconComponent name="sign-out" type="FontAwesome" color={C.rose} size={28} />
							</View>
							<Text style={styles.modalTitle}>종료하시겠어요?</Text>
							<Text style={styles.modalDesc}>진행 중인 퀴즈는 저장되지 않습니다.</Text>
							<View style={styles.modalBtnRow}>
								<TouchableOpacity
									style={[styles.modalBtn, { backgroundColor: C.border }]}
									onPress={() => {
										setShowExitModal(false);
										setIsPaused(false);
									}}>
									<Text style={[styles.modalBtnText, { color: C.txt2 }]}>취소</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalBtn, { backgroundColor: C.rose }]}
									onPress={() => {
										setShowExitModal(false);
										setIsPaused(false);
										//@ts-ignore
										navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
									}}>
									<Text style={[styles.modalBtnText, { color: C.white }]}>종료하기</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			)}

			{/* ── 카운트다운 오버레이 ── */}
			{isCountingDown && (
				<View style={StyleSheet.absoluteFillObject}>
					<View style={styles.countdownOverlay}>
						<Animated.Text style={[styles.countdownNum, { transform: [{ scale: scaleAnim }] }]}>{count === 0 ? '시작!' : count}</Animated.Text>
						<Text style={styles.countdownMsg}>{count === 3 ? '심호흡 하세요…' : count === 2 ? '준비하세요!' : count === 1 ? '곧 시작됩니다!' : ''}</Text>
					</View>
				</View>
			)}

			{/* ── 스크롤 탑 버튼 ── */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopBtn} onPress={scrollHandler.toTop}>
					<IconComponent type="MaterialIcons" name="arrow-upward" size={22} color={C.white} />
				</TouchableOpacity>
			)}

			{/* ── 콤보 이펙트 ── */}
			{comboEffectText !== '' && (
				<Animated.View
					pointerEvents="none"
					style={[
						styles.comboEffect,
						{
							opacity: comboEffectAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
							transform: [{ translateY: comboEffectAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }],
						},
					]}>
					<Text style={styles.comboEffectText}>{comboEffectText}</Text>
				</Animated.View>
			)}

			{/* ── 토스트 ── */}
			{toastMessage !== '' && (
				<Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
					<View style={styles.toastInner}>
						<Text style={styles.toastText}>{toastMessage}</Text>
						{isToastClosable && (
							<TouchableOpacity
								onPress={() => {
									setToastMessage('');
									toastOpacity.setValue(0);
								}}
								style={styles.toastCloseBtn}>
								<Text style={styles.toastCloseBtnText}>닫기</Text>
							</TouchableOpacity>
						)}
					</View>
				</Animated.View>
			)}
		</SafeAreaView>
	);
};

export default InfinityQuizScreen;

// ────────────────────────────────────────────────────────────
// 🎨 Styles
// ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: scaleWidth(20) },

	// ── 상태바 ──────────────────────────────────────────────
	statusRow: {
		flexDirection: 'row',
		marginTop: scaleHeight(28),
		marginBottom: scaleHeight(14),
		gap: scaleWidth(10),
	},
	statCard: {
		flex: 1,
		backgroundColor: C.card,
		borderRadius: scaleWidth(16),
		paddingVertical: scaleHeight(14),
		alignItems: 'center',
		borderTopWidth: 3,
		shadowColor: C.shadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 3,
	},
	statEmoji: { fontSize: scaledSize(18), marginBottom: scaleHeight(4) },
	statValue: { fontSize: scaledSize(20), fontWeight: '800', color: C.txt1, letterSpacing: -0.5 },
	statLabel: { fontSize: scaledSize(11), color: C.txt3, marginTop: scaleHeight(2), fontWeight: '500' },

	// ── 타이머 ──────────────────────────────────────────────
	timerWrapper: {
		backgroundColor: C.card,
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(16),
		marginBottom: scaleHeight(12),
		shadowColor: C.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 1,
		shadowRadius: 6,
		elevation: 2,
	},
	timerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(8) },
	timerText: { fontSize: scaledSize(14), fontWeight: '700', marginLeft: scaleWidth(6), letterSpacing: 0.5 },
	timerBarBg: {
		height: scaleHeight(6),
		backgroundColor: C.border,
		borderRadius: scaleWidth(4),
		overflow: 'hidden',
	},
	timerBarFill: {
		height: '100%',
		borderRadius: scaleWidth(4),
	},

	// ── 하트 바 ─────────────────────────────────────────────
	lifeBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: C.card,
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(14),
		marginBottom: scaleHeight(14),
		shadowColor: C.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 1,
		shadowRadius: 6,
		elevation: 2,
	},
	heartsCenter: { flexDirection: 'row', alignItems: 'center' },
	utilBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
		paddingVertical: scaleHeight(5),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
	},
	utilBtnText: { fontSize: scaledSize(12), fontWeight: '700' },
	utilBtnPlaceholder: { width: scaleWidth(60) },

	// ── 문제 카드 ────────────────────────────────────────────
	questionCard: {
		backgroundColor: C.card,
		borderRadius: scaleWidth(20),
		padding: scaleWidth(20),
		shadowColor: C.shadow,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 1,
		shadowRadius: 12,
		elevation: 4,
		borderWidth: 1,
		borderColor: C.border,
	},
	questionCardCorrect: { borderColor: C.emerald, backgroundColor: C.emeraldLight },
	questionCardWrong: { borderColor: C.rose, backgroundColor: C.roseLight },
	questionBadge: {
		alignSelf: 'flex-start',
		backgroundColor: C.indigoLight,
		borderRadius: scaleWidth(8),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(3),
		marginBottom: scaleHeight(12),
	},
	questionBadgeText: { fontSize: scaledSize(12), fontWeight: '700', color: C.indigo, letterSpacing: 0.5 },
	questionText: {
		fontSize: scaledSize(22),
		fontWeight: '800',
		color: C.txt1,
		lineHeight: scaledSize(32),
		letterSpacing: -0.3,
		marginBottom: scaleHeight(4),
	},
	feedbackBanner: {
		borderRadius: scaleWidth(10),
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(14),
		marginTop: scaleHeight(10),
		alignItems: 'center',
	},
	feedbackBannerText: { fontSize: scaledSize(15), fontWeight: '800' },

	// 보기 버튼
	choiceBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: C.bg,
		borderRadius: scaleWidth(14),
		borderWidth: 1.5,
		borderColor: C.border,
		padding: scaleWidth(14),
		marginBottom: scaleHeight(10),
		gap: scaleWidth(12),
	},
	choiceBtnCorrect: { backgroundColor: C.emeraldLight, borderColor: C.emerald },
	choiceBtnWrong: { backgroundColor: C.roseLight, borderColor: C.rose },
	choiceLabel: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(8),
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	choiceLabelText: { fontSize: scaledSize(13), fontWeight: '800' },
	choiceText: { flex: 1, fontSize: scaledSize(15), color: C.txt1, fontWeight: '500', lineHeight: scaledSize(22) },

	// ── 결과 카드 ────────────────────────────────────────────
	resultCard: {
		backgroundColor: C.card,
		borderRadius: scaleWidth(24),
		padding: scaleWidth(20),
		marginTop: scaleHeight(28),
		borderWidth: 1,
		borderColor: C.border,
		shadowColor: C.shadow,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 5,
	},
	resultHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
		backgroundColor: C.amberLight,
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(16),
		marginBottom: scaleHeight(16),
	},
	resultTitle: { fontSize: scaledSize(18), fontWeight: '800', color: C.txt1 },
	encourageBox: {
		backgroundColor: C.indigoLight,
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(16),
		marginBottom: scaleHeight(12),
	},
	encourageText: { fontSize: scaledSize(14), color: C.indigo, fontWeight: '600', textAlign: 'center', lineHeight: scaledSize(21) },
	scoreBig: { alignItems: 'center', paddingVertical: scaleHeight(20) },
	scoreBigLabel: { fontSize: scaledSize(13), color: C.txt3, fontWeight: '600', letterSpacing: 0.5, marginBottom: scaleHeight(4) },
	scoreBigUnit: { fontSize: scaledSize(24), fontWeight: '700', color: C.txt2, marginLeft: scaleWidth(4), marginBottom: scaleHeight(14) },

	// 통계 그리드
	statsGrid: {
		flexDirection: 'row',
		backgroundColor: C.bg,
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: C.border,
		overflow: 'hidden',
		marginBottom: scaleHeight(14),
	},
	statGridItem: { flex: 1, alignItems: 'center', paddingVertical: scaleHeight(14) },
	statGridItemBorder: { borderLeftWidth: 1, borderLeftColor: C.border },
	statGridEmoji: { fontSize: scaledSize(18), marginBottom: scaleHeight(4) },
	statGridValue: { fontSize: scaledSize(18), fontWeight: '800', color: C.txt1 },
	statGridLabel: { fontSize: scaledSize(11), color: C.txt3, marginTop: scaleHeight(2) },

	// 부가 정보
	resultMeta: { gap: scaleHeight(6), marginBottom: scaleHeight(16) },
	resultMetaRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6) },
	resultMetaText: { fontSize: scaledSize(13), color: C.txt3 },
	resultMetaBold: { fontWeight: '700', color: C.txt2 },

	// 버튼 행
	resultBtnRow: { flexDirection: 'row', gap: scaleWidth(10) },
	resultBtn: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(6),
		paddingVertical: scaleHeight(14),
		borderRadius: scaleWidth(14),
		borderWidth: 1.5,
	},
	resultBtnText: { fontSize: scaledSize(14), fontWeight: '700' },

	// ── 피드백 ──────────────────────────────────────────────
	feedbackToggle: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: C.card,
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(16),
		marginTop: scaleHeight(12),
		borderWidth: 1,
		borderColor: C.border,
	},
	feedbackToggleText: { fontSize: scaledSize(14), fontWeight: '700', color: C.txt1 },
	feedbackList: { marginTop: scaleHeight(10), gap: scaleHeight(8) },
	feedbackItem: {
		backgroundColor: C.card,
		borderRadius: scaleWidth(12),
		padding: scaleWidth(14),
		borderLeftWidth: 4,
		borderWidth: 1,
		borderColor: C.border,
	},
	feedbackItemTitle: { fontSize: scaledSize(14), fontWeight: '700', marginBottom: scaleHeight(6) },
	feedbackItemMeaning: { fontSize: scaledSize(13), color: C.txt2, lineHeight: scaledSize(20) },

	// ── 하단 바 ─────────────────────────────────────────────
	bottomBar: {
		alignItems: 'center',
		backgroundColor: C.white,
		borderTopWidth: 1,
		borderTopColor: C.border,
		paddingTop: scaleHeight(8),
		paddingBottom: Platform.OS === 'android' ? scaleHeight(10) : scaleHeight(14),
	},
	exitBtn: {
		backgroundColor: C.bg,
		borderWidth: 1,
		borderColor: C.border,
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(36),
		borderRadius: scaleWidth(20),
	},
	exitBtnText: { color: C.txt3, fontSize: scaledSize(14), fontWeight: '600' },

	// ── 모달 ────────────────────────────────────────────────
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(26,29,46,0.45)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalCard: {
		width: '85%',
		backgroundColor: C.white,
		borderRadius: scaleWidth(24),
		padding: scaleWidth(28),
		alignItems: 'center',
		shadowColor: 'rgba(0,0,0,0.15)',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 1,
		shadowRadius: 24,
		elevation: 10,
	},
	modalIconWrap: {
		width: scaleWidth(60),
		height: scaleWidth(60),
		borderRadius: scaleWidth(30),
		backgroundColor: C.roseLight,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	modalTitle: { fontSize: scaledSize(18), fontWeight: '800', color: C.txt1, marginBottom: scaleHeight(8) },
	modalDesc: { fontSize: scaledSize(14), color: C.txt3, textAlign: 'center', lineHeight: scaleHeight(22), marginBottom: scaleHeight(24) },
	modalBtnRow: { flexDirection: 'row', gap: scaleWidth(10), width: '100%' },
	modalBtn: { flex: 1, paddingVertical: scaleHeight(14), borderRadius: scaleWidth(12), alignItems: 'center' },
	modalBtnText: { fontSize: scaledSize(15), fontWeight: '700' },

	// ── 카운트다운 ──────────────────────────────────────────
	countdownOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(248,249,255,0.92)',
		zIndex: 999,
	},
	countdownNum: {
		fontSize: scaledSize(96),
		fontWeight: '900',
		color: C.indigo,
		letterSpacing: -4,
	},
	countdownMsg: {
		fontSize: scaledSize(16),
		color: C.txt3,
		fontWeight: '600',
		marginTop: scaleHeight(12),
		letterSpacing: 0.3,
	},

	// ── 스크롤 탑 ───────────────────────────────────────────
	scrollTopBtn: {
		position: 'absolute',
		right: scaleWidth(24),
		bottom: scaleHeight(80),
		backgroundColor: C.indigo,
		width: scaleWidth(42),
		height: scaleWidth(42),
		borderRadius: scaleWidth(21),
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: C.indigo,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 8,
		elevation: 6,
	},

	// ── 콤보 이펙트 ─────────────────────────────────────────
	comboEffect: {
		position: 'absolute',
		top: '38%',
		left: 0,
		right: 0,
		alignItems: 'center',
		pointerEvents: 'none',
	},
	comboEffectText: {
		fontSize: scaledSize(32),
		fontWeight: '900',
		color: C.amber,
		letterSpacing: -0.5,
		textShadowColor: 'rgba(255,143,0,0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 8,
	},

	// ── 토스트 ──────────────────────────────────────────────
	toast: {
		position: 'absolute',
		top: '18%',
		left: scaleWidth(20),
		right: scaleWidth(20),
		zIndex: 1000,
	},
	toastInner: {
		backgroundColor: C.txt1,
		paddingVertical: scaleHeight(18),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(18),
		alignItems: 'center',
		shadowColor: 'rgba(0,0,0,0.2)',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 8,
	},
	toastText: {
		color: C.white,
		fontSize: scaledSize(15),
		fontWeight: '600',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
	},
	toastCloseBtn: {
		marginTop: scaleHeight(12),
		backgroundColor: 'rgba(255,255,255,0.15)',
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(10),
	},
	toastCloseBtnText: { color: C.white, fontSize: scaledSize(13), fontWeight: '700' },

	// ── 컨페티 ──────────────────────────────────────────────
	confettiWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 999,
		pointerEvents: 'none',
	},
});
