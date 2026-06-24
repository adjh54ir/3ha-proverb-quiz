// @/screens/TowerQuiz.tsx

/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';
import { Paths } from '@/navigation/conf/Paths';
import { generateTowerQuiz, TowerQuizQuestion } from '@/const/ConstTowerQuizData';
import { MainDataType } from '@/types/MainDataType';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import TowerResultModal from './modal/TowerResultModal';

const TOWER_STORAGE_KEY = MainStorageKeyType.TOWER_CHALLENGE_PROGRESS;

// 타워 레벨(number) ↔ 속담 난이도(number) 매핑
const TOWER_LEVEL_MAP: Record<number, MainDataType.Proverb['level']> = {
	1: 1,
	2: 2,
	3: 3,
	4: 4,
};

type RouteParams = {
	TowerQuiz: {
		level: number; // TOWER_LEVELS.level과 동일하게 number 유지
	};
};

const TowerQuizScreen = () => {
	const navigation = useNavigation();
	const route = useRoute<RouteProp<RouteParams, 'TowerQuiz'>>();
	const level = route.params?.level || 1; // number (TOWER_LEVELS 기준)
	const proverbLevel = TOWER_LEVEL_MAP[level] ?? 1; // generateTowerQuiz용 난이도(number)

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [correctCount, setCorrectCount] = useState(0);
	const [isAnswered, setIsAnswered] = useState(false);
	const [progress, setProgress] = useState<TowerProgress | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [quizData, setQuizData] = useState<TowerQuizQuestion[]>([]);
	const [showResultModal, setShowResultModal] = useState(false);

	const bossShakeAnim = useRef(new Animated.Value(0)).current;
	const bossScaleAnim = useRef(new Animated.Value(1)).current;
	const bossOpacityAnim = useRef(new Animated.Value(1)).current;
	const effectTextAnim = useRef(new Animated.Value(0)).current;
	const effectTextTranslateY = useRef(new Animated.Value(0)).current;
	const effectTextScale = useRef(new Animated.Value(0.5)).current;
	const [effectText, setEffectText] = useState('');
	const [effectColor, setEffectColor] = useState('#22C55E');

	const towerLevel = TOWER_LEVELS.find((t) => t.level === level);
	const currentQuestion = quizData[currentQuestionIndex];
	const totalQuestions = quizData.length;

	// 다음 레벨 계산 (number 기반)
	const hasNextLevel = TOWER_LEVELS.some((t) => t.level === level + 1);

	useEffect(() => {
		const generatedQuiz = generateTowerQuiz(proverbLevel, 5); // 문자열 레벨 전달
		setQuizData(generatedQuiz);
		loadProgress();
	}, [level]);

	useEffect(() => {
		if (isAnswered && currentQuestionIndex === totalQuestions - 1) {
			const timer = setTimeout(() => {
				handleQuizComplete();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [isAnswered, currentQuestionIndex, totalQuestions]);

	const getLocalDateString = (date: Date = new Date()): string => {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const formatter = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
		return formatter.format(date);
	};

	const CORRECT_TEXTS = ['PERFECT! ⚔️', 'CRITICAL HIT! 💥', 'EXCELLENT! 🌟', 'COMBO! ⚡', 'MIGHTY BLOW! 🔥'];
	const WRONG_TEXTS = ['MISS! 💨', 'BLOCKED! 🛡️', 'WEAK POINT! ❌', 'GUARD BREAK! 😵', 'FAILED! 💀'];

	const playEffectText = (isCorrect: boolean) => {
		const texts = isCorrect ? CORRECT_TEXTS : WRONG_TEXTS;
		const color = isCorrect ? '#22C55E' : '#EF4444';
		const text = texts[Math.floor(Math.random() * texts.length)];

		setEffectText(text);
		setEffectColor(color);
		effectTextAnim.setValue(0);
		effectTextTranslateY.setValue(0);
		effectTextScale.setValue(0.5);

		Animated.parallel([
			Animated.sequence([
				Animated.timing(effectTextAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
				Animated.delay(600),
				Animated.timing(effectTextAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
			]),
			Animated.timing(effectTextTranslateY, { toValue: -80, duration: 1050, useNativeDriver: true }),
			Animated.sequence([
				Animated.spring(effectTextScale, { toValue: 1.2, useNativeDriver: true, speed: 20, bounciness: 12 }),
				Animated.timing(effectTextScale, { toValue: 1, duration: 200, useNativeDriver: true }),
			]),
		]).start();
	};

	const playBossHitAnimation = () => {
		bossShakeAnim.setValue(0);
		bossScaleAnim.setValue(1);
		bossOpacityAnim.setValue(1);

		Animated.sequence([
			Animated.parallel([
				Animated.sequence([
					Animated.timing(bossShakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
					Animated.timing(bossShakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
					Animated.timing(bossShakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
					Animated.timing(bossShakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
					Animated.timing(bossShakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
					Animated.timing(bossShakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
					Animated.timing(bossShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
				]),
				Animated.sequence([
					Animated.timing(bossOpacityAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
					Animated.timing(bossOpacityAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
					Animated.timing(bossOpacityAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
					Animated.timing(bossOpacityAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
				]),
			]),
		]).start();
	};

	const playBossAttackAnimation = () => {
		bossScaleAnim.setValue(1);
		bossShakeAnim.setValue(0);

		Animated.sequence([
			Animated.timing(bossScaleAnim, { toValue: 1.25, duration: 200, useNativeDriver: true }),
			Animated.timing(bossScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
			Animated.timing(bossScaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
			Animated.timing(bossScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
		]).start();
	};

	const loadProgress = async () => {
		try {
			const saved = await AsyncStorage.getItem(TOWER_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				const today = getLocalDateString();
				if (parsed.lastAttemptDate !== today) {
					parsed.attempts = 1;
					parsed.adRewardUsed = 0;
					parsed.lastAttemptDate = today;
				}
				setProgress(parsed);
			}
		} catch (error) {
			console.error('탑 도전 데이터 로드 실패:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const saveProgress = async (newProgress: TowerProgress) => {
		try {
			await AsyncStorage.setItem(TOWER_STORAGE_KEY, JSON.stringify(newProgress));
			setProgress(newProgress);
		} catch (error) {
			console.error('진행 상황 저장 실패:', error);
		}
	};

	const handleAutoPass = () => {
		if (!__DEV__) return;
		Alert.alert('개발자 모드', '모든 문제를 정답 처리하시겠습니까?', [
			{ text: '취소', style: 'cancel' },
			{
				text: '확인',
				onPress: () => {
					setCorrectCount(totalQuestions);
					setCurrentQuestionIndex(totalQuestions - 1);
					setIsAnswered(true);
					setSelectedAnswer(currentQuestion.correctAnswer);

					setTimeout(() => {
						if (!progress || !towerLevel) {
							return;
						}
						const newProgress: TowerProgress = {
							...progress,
							level: Math.max(progress.level, level + 1),
							completedLevels: [...new Set([...progress.completedLevels, level])],
							attempts: progress.attempts - 1,
							unlockedRewards: [...new Set([...progress.unlockedRewards, level])],
						};
						saveProgress(newProgress);
						setShowResultModal(true);
					}, 500);
				},
			},
		]);
	};

	const handleAnswerSelect = (answerIndex: number) => {
		if (isAnswered) {
			return;
		}
		setSelectedAnswer(answerIndex);
		setIsAnswered(true);

		const isCorrect = answerIndex === currentQuestion.correctAnswer;
		if (isCorrect) {
			setCorrectCount((prev) => prev + 1);
			playBossHitAnimation();
		} else {
			playBossAttackAnimation();
		}
		playEffectText(isCorrect);
	};

	const handleNext = () => {
		if (currentQuestionIndex < totalQuestions - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setIsAnswered(false);
		} else {
			setIsAnswered(true);
			requestAnimationFrame(() => {
				setTimeout(() => {
					handleQuizComplete();
				}, 300);
			});
		}
	};

	const handleQuizComplete = () => {
		if (!progress || !towerLevel) {
			return;
		}

		const isPassed = correctCount === totalQuestions;

		if (isPassed) {
			const newProgress: TowerProgress = {
				...progress,
				level: Math.max(progress.level, level + 1),
				completedLevels: [...new Set([...progress.completedLevels, level])],
				attempts: progress.attempts - 1,
				unlockedRewards: [...new Set([...progress.unlockedRewards, level])],
			};
			saveProgress(newProgress);
		} else {
			const newProgress: TowerProgress = {
				...progress,
				attempts: progress.attempts - 1,
			};
			saveProgress(newProgress);
		}

		setShowResultModal(true);
	};

	const handleRetry = () => {
		setShowResultModal(false);
		navigation.goBack();
	};

	const handleGoHome = () => {
		setShowResultModal(false);
		navigation.goBack();
	};

	const handleNextLevel = () => {
		setShowResultModal(false);
		//@ts-ignore
		navigation.replace(Paths.TOWER_CHANLLENGE, { level: level + 1 });
	};

	const handleExit = () => {
		Alert.alert('퀴즈 종료', '정말 종료하시겠습니까?\n도전 횟수는 차감됩니다.', [
			{ text: '취소', style: 'cancel' },
			{
				text: '종료',
				style: 'destructive',
				onPress: async () => {
					if (progress) {
						const newProgress: TowerProgress = {
							...progress,
							attempts: progress.attempts - 1,
						};
						await saveProgress(newProgress);
					}
					navigation.goBack();
				},
			},
		]);
	};

	if (isLoading) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={['#2B2D3A', '#21222C', '#191A21']} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={{ color: '#fff', fontSize: scaledSize(16) }}>퀴즈 생성 중...</Text>
				</SafeAreaView>
			</View>
		);
	}

	if (!towerLevel) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={['#2B2D3A', '#21222C', '#191A21']} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={{ color: '#fff', fontSize: scaledSize(16) }}>타워 정보를 찾을 수 없습니다.</Text>
					<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: scaleHeight(20) }}>
						<Text style={{ color: '#22C55E', fontSize: scaledSize(14) }}>뒤로 가기</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		);
	}

	if (quizData.length === 0 || !currentQuestion) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={['#2B2D3A', '#21222C', '#191A21']} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={{ color: '#fff', fontSize: scaledSize(16) }}>레벨 {level}에 해당하는 단어가 없습니다.</Text>
					<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: scaleHeight(20) }}>
						<Text style={{ color: '#22C55E', fontSize: scaledSize(14) }}>뒤로 가기</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		);
	}

	const isCorrectAnswer = selectedAnswer === currentQuestion.correctAnswer;

	return (
		<View style={styles.container}>
			<LinearGradient colors={['#2B2D3A', '#21222C', '#191A21']} style={StyleSheet.absoluteFillObject} />

			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				<View style={styles.header}>
					<TouchableOpacity onPress={handleExit} style={styles.exitButton}>
						<IconComponent type="materialIcons" name="close" size={scaledSize(28)} color="#fff" />
					</TouchableOpacity>

					<View style={styles.headerCenter}>
						<Text style={styles.levelTitle} numberOfLines={1}>{towerLevel.name}</Text>
						<Text style={styles.questionCount}>
							{currentQuestionIndex + 1} / {totalQuestions} 문제
						</Text>
					</View>

					<View style={styles.headerRight}>
						{__DEV__ && (
							<TouchableOpacity onPress={handleAutoPass} style={styles.devButton}>
								<IconComponent type="materialIcons" name="flash-on" size={scaledSize(20)} color="#F59E0B" />
							</TouchableOpacity>
						)}
						<View style={styles.scoreContainer}>
							{Array.from({ length: totalQuestions }).map((_, i) => (
								<IconComponent
									key={i}
									type="materialIcons"
									name={i < correctCount ? 'star' : 'star-border'}
									size={scaledSize(18)}
									color={i < correctCount ? '#FBBF24' : 'rgba(255,255,255,0.35)'}
								/>
							))}
						</View>
					</View>
				</View>

				<View style={styles.progressBarContainer}>
					<View style={styles.progressLabelRow}>
						<Text style={styles.progressLabelText}>진행도</Text>
						<Text style={styles.progressLabelText}>
							{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
						</Text>
					</View>
					<View style={styles.progressBarBackground}>
						<View
							style={[
								styles.progressBarFill,
								{
									width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
									backgroundColor: towerLevel.color,
								},
							]}
						/>
					</View>
				</View>

				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<View style={styles.bossSection}>
						<View style={[styles.bossGlow, { backgroundColor: towerLevel.color + '40' }]} />
						<Animated.View
							style={{
								transform: [{ translateX: bossShakeAnim }, { scale: bossScaleAnim }],
								opacity: bossOpacityAnim,
							}}>
							<FastImage source={towerLevel.bossImage} style={styles.bossImage} resizeMode="contain" />
						</Animated.View>
						<Animated.Text
							style={[
								styles.effectText,
								{
									color: effectColor,
									opacity: effectTextAnim,
									transform: [{ translateY: effectTextTranslateY }, { scale: effectTextScale }],
								},
							]}>
							{effectText}
						</Animated.Text>
					</View>

					<View style={styles.questionCard}>
						<View style={styles.questionCardGradient}>
							<Text style={styles.questionText}>
								<Text style={styles.questionProverb}>'{currentQuestion.proverb}'</Text>
								<Text style={styles.questionAsk}>의 뜻은 무엇일까요?</Text>
							</Text>
						</View>
					</View>

					<View style={styles.answersContainer}>
						{currentQuestion.options.map((option, index) => {
							const isSelected = selectedAnswer === index;
							const isCorrect = index === currentQuestion.correctAnswer;
							const showCorrect = isAnswered && isCorrect;
							const showWrong = isAnswered && isSelected && !isCorrect;

							let backgroundColor = 'rgba(255, 255, 255, 0.1)';
							if (showCorrect) {
								backgroundColor = '#22C55E';
							} else if (showWrong) {
								backgroundColor = '#EF4444';
							} else if (isSelected) {
								backgroundColor = towerLevel.color;
							}

							return (
								<TouchableOpacity
									key={index}
									onPress={() => handleAnswerSelect(index)}
									disabled={isAnswered}
									style={styles.answerButton}>
									<View style={[styles.answerGradient, { backgroundColor }]}>
										<View style={styles.answerContent}>
											<View style={styles.answerNumber}>
												<Text style={styles.answerNumberText}>{index + 1}</Text>
											</View>
											<Text style={styles.answerText}>{option}</Text>
											{showCorrect && <IconComponent type="materialIcons" name="check-circle" size={scaledSize(24)} color="#fff" />}
											{showWrong && <IconComponent type="materialIcons" name="cancel" size={scaledSize(24)} color="#fff" />}
										</View>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>

					{isAnswered && (
						<View style={styles.explanationCard}>
							<View
								style={[
									styles.explanationGradient,
									{ backgroundColor: isCorrectAnswer ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)' },
								]}>
								<View style={styles.explanationHeader}>
									<IconComponent
										type="materialIcons"
										name={isCorrectAnswer ? 'check-circle' : 'info'}
										size={scaledSize(24)}
										color={isCorrectAnswer ? '#22C55E' : '#EF4444'}
									/>
									<Text style={[styles.explanationTitle, { color: isCorrectAnswer ? '#22C55E' : '#EF4444' }]}>
										{isCorrectAnswer ? '정답입니다!' : '틀렸습니다'}
									</Text>
								</View>
								<Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
							</View>
						</View>
					)}
				</ScrollView>

				{isAnswered && (
					<View style={styles.nextButtonContainer}>
						<TouchableOpacity onPress={handleNext} style={styles.nextButton}>
							<View style={[styles.nextButtonGradient, { backgroundColor: towerLevel.color }]}>
								<Text style={styles.nextButtonText}>
									{currentQuestionIndex < totalQuestions - 1 ? '다음 문제' : '결과 확인'}
								</Text>
								<IconComponent
									type="materialIcons"
									name={currentQuestionIndex < totalQuestions - 1 ? 'arrow-forward' : 'check'}
									size={scaledSize(24)}
									color="#fff"
								/>
							</View>
						</TouchableOpacity>
					</View>
				)}
			</SafeAreaView>

			<TowerResultModal
				visible={showResultModal}
				isVictory={correctCount === totalQuestions}
				correctCount={correctCount}
				totalQuestions={totalQuestions}
				towerLevel={towerLevel}
				onRetry={handleRetry}
				onHome={handleGoHome}
				onNext={hasNextLevel ? handleNextLevel : undefined}
			/>
		</View>
	);
};

export default TowerQuizScreen;

const styles = StyleSheet.create({
	container: { flex: 1 },
	safeArea: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: scaleWidth(16),
		paddingVertical: scaleHeight(12),
	},
	exitButton: {
		width: scaleWidth(40),
		height: scaleWidth(40),
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerCenter: { flex: 1, alignItems: 'center' },
	levelTitle: { fontSize: scaledSize(18), fontWeight: 'bold', color: '#fff' },
	questionCount: { fontSize: scaledSize(14), color: '#CBD5E1', marginTop: scaleHeight(4) },
	scoreText: { fontSize: scaledSize(16), fontWeight: 'bold', color: '#fff' },
	progressBarContainer: { paddingHorizontal: scaleWidth(16), paddingBottom: scaleHeight(16) },
	progressLabelRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	progressLabelText: { fontSize: scaledSize(11.5), fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
	progressBarBackground: {
		height: scaleHeight(10),
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderRadius: scaleWidth(999),
		overflow: 'hidden',
	},
	progressBarFill: { height: '100%', borderRadius: scaleWidth(999) },
	content: { flex: 1, paddingHorizontal: scaleWidth(16) },
	bossSection: { alignItems: 'center', marginVertical: scaleHeight(20) },
	bossGlow: {
		position: 'absolute',
		width: scaleWidth(120),
		height: scaleWidth(120),
		borderRadius: scaleWidth(60),
	},
	bossImage: { width: scaleWidth(120), height: scaleWidth(120), borderRadius: scaleWidth(60) },
	questionCard: { marginBottom: scaleHeight(24) },
	questionCardGradient: { padding: scaleWidth(20) },
	questionText: {
		fontSize: scaledSize(18),
		fontWeight: '600',
		color: '#fff',
		lineHeight: scaledSize(26),
		textAlign: 'center',
	},
	questionProverb: {
		color: '#60A5FA', // ✅ 속담 부분만 파란색 강조
		fontWeight: '800',
	},
	questionAsk: {
		color: '#fff', // 질문 문구는 흰색
		fontWeight: '600',
	},
	answersContainer: { gap: scaleHeight(12) },
	answerButton: { borderRadius: scaleWidth(12), overflow: 'hidden' },
	answerGradient: { padding: scaleWidth(16) },
	answerContent: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12) },
	answerNumber: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	answerNumberText: { fontSize: scaledSize(16), fontWeight: 'bold', color: '#fff' },
	answerText: { flex: 1, fontSize: scaledSize(16), color: '#fff', lineHeight: scaledSize(22) },
	explanationCard: {
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(20),
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
	},
	explanationGradient: { padding: scaleWidth(16) },
	explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8), marginBottom: scaleHeight(8) },
	explanationTitle: { fontSize: scaledSize(16), fontWeight: 'bold' },
	explanationText: { fontSize: scaledSize(14), color: '#F1F5F9', lineHeight: scaledSize(20) },
	nextButtonContainer: { padding: scaleWidth(16), paddingBottom: scaleHeight(24) },
	nextButton: { borderRadius: scaleWidth(12), overflow: 'hidden' },
	nextButtonGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(8),
		paddingVertical: scaleHeight(16),
	},
	nextButtonText: { fontSize: scaledSize(18), fontWeight: 'bold', color: '#fff' },
	headerRight: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) },
	devButton: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(245, 158, 11, 0.2)',
		borderRadius: scaleWidth(18),
		borderWidth: 1,
		borderColor: 'rgba(245, 158, 11, 0.5)',
	},
	scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(2) },
	effectText: {
		position: 'absolute',
		fontSize: scaledSize(28),
		fontWeight: 'bold',
		textShadowColor: 'rgba(0,0,0,0.5)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 4,
		zIndex: 10,
	},
});
