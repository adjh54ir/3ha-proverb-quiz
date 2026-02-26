/* eslint-disable react-native/no-inline-styles */
// @/screens/TowerQuiz.tsx
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
import TowerResultModal from './modal/TowerResultModal';

const TOWER_STORAGE_KEY = 'TOWER_CHALLENGE_PROGRESS';

type RouteParams = {
	TowerQuiz: {
		level: number;
	};
};

const TowerQuizScreen = () => {
	const navigation = useNavigation();
	const route = useRoute<RouteProp<RouteParams, 'TowerQuiz'>>();
	const level = route.params?.level || 1;

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [correctCount, setCorrectCount] = useState(0);
	const [isAnswered, setIsAnswered] = useState(false);
	const [progress, setProgress] = useState<TowerProgress | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [quizData, setQuizData] = useState<TowerQuizQuestion[]>([]); // 상태로 관리
	const [showResultModal, setShowResultModal] = useState(false);
	// state 선언부 아래에 추가
	const bossShakeAnim = useRef(new Animated.Value(0)).current;
	const bossScaleAnim = useRef(new Animated.Value(1)).current;
	const bossOpacityAnim = useRef(new Animated.Value(1)).current;
	const bossColorAnim = useRef(new Animated.Value(0)).current; // 0: normal, 1: hit
	const effectTextAnim = useRef(new Animated.Value(0)).current; // opacity
	const effectTextTranslateY = useRef(new Animated.Value(0)).current;
	const effectTextScale = useRef(new Animated.Value(0.5)).current;
	const [effectText, setEffectText] = useState('');
	const [effectColor, setEffectColor] = useState('#27ae60');

	const towerLevel = TOWER_LEVELS.find((t) => t.level === level);
	const currentQuestion = quizData[currentQuestionIndex];
	const totalQuestions = quizData.length;

	// useEffect 부분 수정
	useEffect(() => {
		const generatedQuiz = generateTowerQuiz(level, 5);
		setQuizData(generatedQuiz);
		loadProgress();
		setIsLoading(false); // ← 추가
	}, [level]);

	useEffect(() => {
		if (isAnswered && currentQuestionIndex === totalQuestions - 1) {
			// 마지막 문제를 답변한 경우
			const timer = setTimeout(() => {
				handleQuizComplete();
			}, 500); // 약간의 딜레이 후 결과 표시

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
		return formatter.format(date); // 'YYYY-MM-DD'
	};

	const CORRECT_TEXTS = ['PERFECT! ⚔️', 'CRITICAL HIT! 💥', 'EXCELLENT! 🌟', 'COMBO! ⚡', 'MIGHTY BLOW! 🔥'];
	const WRONG_TEXTS = ['MISS! 💨', 'BLOCKED! 🛡️', 'WEAK POINT! ❌', 'GUARD BREAK! 😵', 'FAILED! 💀'];

	const playEffectText = (isCorrect: boolean) => {
		const texts = isCorrect ? CORRECT_TEXTS : WRONG_TEXTS;
		const color = isCorrect ? '#2ecc71' : '#e74c3c';
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
		// 보스가 피해 입는 효과: 좌우 흔들기 + 빨간 틴트 + 투명도
		bossShakeAnim.setValue(0);
		bossScaleAnim.setValue(1);
		bossOpacityAnim.setValue(1);

		Animated.sequence([
			// 1. 흔들림 + 빨간 틴트
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
				// 잠깐 투명해졌다 돌아오기 (피격 효과)
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
		// 보스가 위협적으로 커지는 효과
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
				const today = getLocalDateString(); // ← 변경

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
			setIsLoading(false); // ← finally로 성공/실패 모두 처리
		}
	};

	// 헤더 부분에 추가할 "모두 정답" 버튼과 핸들러 함수

	// 1. 핸들러 함수 추가 (handleQuizComplete 위에 추가)
	const handleAutoPass = () => {
		Alert.alert('개발자 모드', '모든 문제를 정답 처리하시겠습니까?', [
			{ text: '취소', style: 'cancel' },
			{
				text: '확인',
				onPress: () => {
					// 모든 문제를 정답으로 처리
					setCorrectCount(totalQuestions);
					setCurrentQuestionIndex(totalQuestions - 1);
					setIsAnswered(true);
					setSelectedAnswer(currentQuestion.correctAnswer);

					// 결과 처리
					setTimeout(() => {
						if (!progress || !towerLevel) {
							return;
						}

						const isPassed = true; // 모두 정답이므로 통과
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

	const saveProgress = async (newProgress: TowerProgress) => {
		try {
			await AsyncStorage.setItem(TOWER_STORAGE_KEY, JSON.stringify(newProgress));
			setProgress(newProgress);
		} catch (error) {
			console.error('진행 상황 저장 실패:', error);
		}
	};

	const handleAnswerSelect = (answerIndex: number) => {
		if (isAnswered) return;

		setSelectedAnswer(answerIndex);
		setIsAnswered(true);

		const isCorrect = answerIndex === currentQuestion.correctAnswer;
		if (isCorrect) {
			setCorrectCount((prev) => prev + 1);
			playBossHitAnimation();
		} else {
			playBossAttackAnimation();
		}
		playEffectText(isCorrect); // ← 추가
	};

	const handleNext = () => {
		console.log('handleNext 호출 - 현재 문제:', currentQuestionIndex, '전체:', totalQuestions);
		if (currentQuestionIndex < totalQuestions - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setIsAnswered(false);
		} else {
			console.log('마지막 문제 - 결과 확인 준비');
			console.log('현재 correctCount:', correctCount);
			// 마지막 문제 - 결과 처리를 다음 렌더링 사이클로 지연
			setIsAnswered(true);
			requestAnimationFrame(() => {
				setTimeout(() => {
					console.log('handleQuizComplete 호출 직전');
					handleQuizComplete();
				}, 300);
			});
		}
	};

	// handleQuizComplete 함수 수정
	const handleQuizComplete = () => {
		console.log('handleQuizComplete 실행됨');
		console.log('progress:', progress);
		console.log('towerLevel:', towerLevel);

		if (!progress || !towerLevel) {
			console.log('progress 또는 towerLevel이 없음');
			return;
		}

		// 모든 문제를 맞춰야 통과 (100% 정답률)
		const isPassed = correctCount === totalQuestions;

		console.log('퀴즈 완료:', { correctCount, totalQuestions, isPassed });

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

		console.log('모달 표시 시도');
		setShowResultModal(true);
	};
	const handleRetry = () => {
		setShowResultModal(false);
		navigation.goBack();
		// 여기서 재시작 로직을 추가할 수도 있습니다
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
	// 다음 레벨 존재 여부 확인
	const hasNextLevel = TOWER_LEVELS.some((t) => t.level === level + 1);

	if (!currentQuestion || !towerLevel) {
		return null;
	}

	// 렌더링 조건 수정
	if (isLoading) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={{ color: '#fff', fontSize: scaledSize(16) }}>퀴즈 생성 중...</Text>
				</SafeAreaView>
			</View>
		);
	}

	if (!towerLevel) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={{ color: '#fff', fontSize: scaledSize(16) }}>타워 정보를 찾을 수 없습니다.</Text>
					<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
						<Text style={{ color: '#3498db', fontSize: scaledSize(14) }}>뒤로 가기</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		);
	}

	if (quizData.length === 0 || !currentQuestion) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={{ color: '#fff', fontSize: scaledSize(16) }}>레벨 {level}에 해당하는 단어가 없습니다.</Text>
					<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
						<Text style={{ color: '#3498db', fontSize: scaledSize(14) }}>뒤로 가기</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		);
	}
	const isCorrectAnswer = selectedAnswer === currentQuestion.correctAnswer;

	return (
		<View style={styles.container}>
			<LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFillObject} />

			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				{/* 헤더 */}
				<View style={styles.header}>
					<TouchableOpacity onPress={handleExit} style={styles.exitButton}>
						<IconComponent type="materialIcons" name="close" size={28} color="#fff" />
					</TouchableOpacity>

					<View style={styles.headerCenter}>
						<Text style={styles.levelTitle}>{towerLevel.name}</Text>
						<Text style={styles.questionCount}>
							{currentQuestionIndex + 1} / {totalQuestions}
						</Text>
					</View>

					<View style={styles.headerRight}>
						{/* 개발자 모드 버튼 */}
						<TouchableOpacity onPress={handleAutoPass} style={styles.devButton}>
							<IconComponent type="materialIcons" name="flash-on" size={20} color="#f39c12" />
						</TouchableOpacity>

						<View style={styles.scoreContainer}>
							<IconComponent type="materialIcons" name="star" size={20} color="#f1c40f" />
							<Text style={styles.scoreText}>{correctCount}</Text>
						</View>
					</View>
				</View>

				<View style={styles.progressBarContainer}>
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
					{/* 보스 이미지 */}
					{/* 보스 이미지 */}
					<View style={styles.bossSection}>
						<View style={[styles.bossGlow, { backgroundColor: towerLevel.color + '40' }]} />
						<Animated.View
							style={{
								transform: [{ translateX: bossShakeAnim }, { scale: bossScaleAnim }],
								opacity: bossOpacityAnim,
							}}>
							<FastImage
								source={towerLevel.bossImage}
								style={styles.bossImage}
								resizeMode="contain"
							/>
						</Animated.View>

						{/* 이펙트 텍스트 */}
						<Animated.Text
							style={[
								styles.effectText,
								{
									color: effectColor,
									opacity: effectTextAnim,
									transform: [
										{ translateY: effectTextTranslateY },
										{ scale: effectTextScale },
									],
								},
							]}>
							{effectText}
						</Animated.Text>
					</View>
					{/* 문제 */}
					<View style={styles.questionCard}>
						<View style={styles.questionCardGradient}>
							<Text style={styles.questionText}>{currentQuestion.question}</Text>
						</View>
					</View>

					{/* 선택지 */}
					<View style={styles.answersContainer}>
						{currentQuestion.options.map((option, index) => {
							const isSelected = selectedAnswer === index;
							const isCorrect = index === currentQuestion.correctAnswer;
							const showCorrect = isAnswered && isCorrect;
							const showWrong = isAnswered && isSelected && !isCorrect;

							let backgroundColor = 'rgba(255, 255, 255, 0.1)';
							if (showCorrect) {
								backgroundColor = '#27ae60';
							} else if (showWrong) {
								backgroundColor = '#e74c3c';
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
											{showCorrect && <IconComponent type="materialIcons" name="check-circle" size={24} color="#fff" />}
											{showWrong && <IconComponent type="materialIcons" name="cancel" size={24} color="#fff" />}
										</View>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>

					{/* 설명 (정답 선택 후) */}
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
										size={24}
										color={isCorrectAnswer ? '#27ae60' : '#e74c3c'}
									/>
									<Text style={[styles.explanationTitle, { color: isCorrectAnswer ? '#27ae60' : '#e74c3c' }]}>
										{isCorrectAnswer ? '정답입니다!' : '틀렸습니다'}
									</Text>
								</View>
								<Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
							</View>
						</View>
					)}
				</ScrollView>

				{/* 다음 버튼 */}
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
									size={24}
									color="#fff"
								/>
							</View>
						</TouchableOpacity>
					</View>
				)}
				{/* <BottomHomeButton /> */}
			</SafeAreaView>
			<TowerResultModal
				visible={showResultModal}
				isVictory={correctCount === totalQuestions} // 100% 정답만 승리
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
	container: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
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
	headerCenter: {
		flex: 1,
		alignItems: 'center',
	},
	levelTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#fff',
	},
	questionCount: {
		fontSize: scaledSize(14),
		color: '#bdc3c7',
		marginTop: scaleHeight(4),
	},
	scoreText: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#fff',
	},
	progressBarContainer: {
		paddingHorizontal: scaleWidth(16),
		paddingBottom: scaleHeight(16),
	},
	progressBarBackground: {
		height: scaleHeight(8),
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: scaleWidth(4),
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: scaleWidth(4),
	},
	content: {
		flex: 1,
		paddingHorizontal: scaleWidth(16),
	},
	bossSection: {
		alignItems: 'center',
		marginVertical: scaleHeight(20),
	},
	bossGlow: {
		position: 'absolute',
		width: scaleWidth(120),
		height: scaleWidth(120),
		borderRadius: scaleWidth(60),
	},
	bossImage: {
		width: scaleWidth(120),
		height: scaleWidth(120),
		borderRadius: scaleWidth(60),
	},
	questionCard: {
		marginBottom: scaleHeight(24),
		borderRadius: scaleWidth(16),
		overflow: 'hidden',
	},
	questionCardGradient: {
		padding: scaleWidth(20),
	},
	questionText: {
		fontSize: scaledSize(18),
		fontWeight: '600',
		color: '#fff',
		lineHeight: scaledSize(26),
		textAlign: 'center',
	},
	answersContainer: {
		gap: scaleHeight(12),
	},
	answerButton: {
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
	},
	answerGradient: {
		padding: scaleWidth(16),
	},
	answerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(12),
	},
	answerNumber: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	answerNumberText: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#fff',
	},
	answerText: {
		flex: 1,
		fontSize: scaledSize(16),
		color: '#fff',
		lineHeight: scaledSize(22),
	},
	explanationCard: {
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(20),
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
	},
	explanationGradient: {
		padding: scaleWidth(16),
	},
	explanationHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
		marginBottom: scaleHeight(8),
	},
	explanationTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	explanationText: {
		fontSize: scaledSize(14),
		color: '#ecf0f1',
		lineHeight: scaledSize(20),
	},
	nextButtonContainer: {
		padding: scaleWidth(16),
		paddingBottom: scaleHeight(24),
	},
	nextButton: {
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
	},
	nextButtonGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(8),
		paddingVertical: scaleHeight(16),
	},
	nextButtonText: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#fff',
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
	},
	devButton: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(243, 156, 18, 0.2)',
		borderRadius: scaleWidth(18),
		borderWidth: 1,
		borderColor: 'rgba(243, 156, 18, 0.5)',
	},
	scoreContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
	},
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
