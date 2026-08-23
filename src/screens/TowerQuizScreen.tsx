// @/screens/TowerQuiz.tsx

/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import AppAlert from '@/screens/common/modal/AppAlert';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useRoute, RouteProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';
import { Paths } from '@/navigation/conf/Paths';
import { generateTowerQuiz, TowerQuizQuestion } from '@/const/ConstTowerQuizData';
import { MainDataType } from '@/types/MainDataType';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import TowerResultModal from './modal/TowerResultModal';
import DateUtils from '@/utils/DateUtils';
import { playCorrect, playWrong, playWhoosh, playFinish } from '@/utils/SoundUtils';
import { startBgm, stopBgm } from '@/utils/BgmUtils';
import CharacterGuide, { useCharacterGuideOnce, CharacterGuideButton } from '@/screens/common/CharacterGuide';
import { withAlpha, ALPHA } from '@/utils/ColorAlphaUtils';
import { useAppNavigation } from '@/navigation/conf/Types';
import { read, write } from '@/services/StorageService';

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
	// 진행 중인 도전을 가로막지 않도록 자동 노출은 끄고, 물음표 버튼으로만 연다
	const guide = useCharacterGuideOnce('towerQuiz', false);
	const navigation = useAppNavigation();
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
	const [effectColor, setEffectColor] = useState<string>(COLORS.primary);

	// 문제 전환 시 fade + slide-up
	const questionAnim = useRef(new Animated.Value(0)).current;
	// 지연 실행 타이머 (언마운트 시 정리)
	const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hasCompletedRef = useRef(false);

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

	// 🎬 도전 시작 사운드 + 🎵 퀴즈 BGM (화면 이탈 시 반드시 정리)
	useEffect(() => {
		playWhoosh();
		startBgm('quiz');
		return () => stopBgm();
	}, []);

	// 문제가 바뀔 때마다 카드/보기 영역 진입 애니메이션
	useEffect(() => {
		questionAnim.setValue(0);
		const anim = Animated.timing(questionAnim, { toValue: 1, duration: 260, useNativeDriver: true });
		anim.start();
		return () => anim.stop();
	}, [currentQuestionIndex, quizData.length]);

	// 언마운트 시 실행 중인 애니메이션/타이머 정리
	useEffect(() => {
		return () => {
			[bossShakeAnim, bossScaleAnim, bossOpacityAnim, effectTextAnim, effectTextTranslateY, effectTextScale, questionAnim].forEach((v) =>
				v.stopAnimation(),
			);
			if (completeTimerRef.current) {
				clearTimeout(completeTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (isAnswered && currentQuestionIndex === totalQuestions - 1) {
			const timer = setTimeout(() => {
				handleQuizComplete();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [isAnswered, currentQuestionIndex, totalQuestions]);

	const CORRECT_TEXTS = ['PERFECT! ⚔️', 'CRITICAL HIT! 💥', 'EXCELLENT! 🌟', 'COMBO! ⚡', 'MIGHTY BLOW! 🔥'];
	const WRONG_TEXTS = ['MISS! 💨', 'BLOCKED! 🛡️', 'WEAK POINT! ❌', 'GUARD BREAK! 😵', 'FAILED! 💀'];

	const playEffectText = (isCorrect: boolean) => {
		const texts = isCorrect ? CORRECT_TEXTS : WRONG_TEXTS;
		const color = isCorrect ? COLORS.primary : COLORS.danger;
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
			const parsed = await read<TowerProgress | null>(TOWER_STORAGE_KEY, null);
			if (parsed) {
				const today = DateUtils.getLocalDateString();
				// SettingScreen 초기화가 ISO 타임스탬프로 저장하는 경우가 있어 로컬 날짜 키로 정규화 후 비교
				if (DateUtils.toLocalDateKey(parsed.lastAttemptDate) !== today) {
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
			await write(TOWER_STORAGE_KEY, newProgress);
			setProgress(newProgress);
		} catch (error) {
			console.error('진행 상황 저장 실패:', error);
		}
	};

	const handleAutoPass = () => {
		if (!__DEV__) return;
		AppAlert.alert('개발자 모드', '모든 문제를 정답 처리하시겠습니까?', [
			{ text: '취소', style: 'cancel' },
			{
				text: '확인',
				onPress: () => {
					setCorrectCount(totalQuestions);
					setCurrentQuestionIndex(totalQuestions - 1);
					setIsAnswered(true);
					setSelectedAnswer(currentQuestion.correctAnswer);

					completeTimerRef.current = setTimeout(() => {
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
			playCorrect(); // 🔊 정답
			setCorrectCount((prev) => prev + 1);
			playBossHitAnimation();
		} else {
			playWrong(); // 🔊 오답
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
				completeTimerRef.current = setTimeout(() => {
					handleQuizComplete();
				}, 300);
			});
		}
	};

	const handleQuizComplete = () => {
		if (!towerLevel) {
			return;
		}
		// 진행도를 못 읽었더라도 결과 화면은 반드시 보여준다(예전에는 여기서 조용히 빠져나가 화면이 멈춘 것처럼 보였다).
		if (!progress) {
			playFinish();
			setShowResultModal(true);
			return;
		}
		// 마지막 문제에서는 isAnswered useEffect(500ms)와 handleNext(300ms)가 모두 이 함수를 부른다.
		// 여기서 한 번만 통과시켜야 attempts 가 2회 차감되지 않는다.
		if (hasCompletedRef.current) {
			return;
		}
		hasCompletedRef.current = true;

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

		playFinish(); // 🎉 층 종료 사운드
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
		// 다음 단계는 저장된 진행도로 판단하므로 파라미터를 넘기지 않는다.
		navigation.replace(Paths.TOWER_CHANLLENGE);
	};

	const handleExit = () => {
		AppAlert.alert('퀴즈 종료', '정말 종료하시겠습니까?\n도전 횟수는 차감됩니다.', [
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

	// 뒤로가기로 그냥 나가면 도전 횟수 차감 안내 없이 시도가 사라진다 — 종료 버튼과 같은 확인을 거친다.
	useBlockBackHandler(true, handleExit);

	if (isLoading) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={COLORS.darkGradient} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<FastImage source={require('@/assets/images/screen-heroes/tower-quiz-coach.png')} style={styles.loadingCoachImage} resizeMode="contain" />
					<Text style={{ color: COLORS.textWhite, fontSize: FONT_SIZES.lg }}>퀴즈 생성 중...</Text>
				</SafeAreaView>
			</View>
		);
	}

	if (!towerLevel) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={COLORS.darkGradient} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<FastImage source={require('@/assets/images/screen-heroes/data-retry.png')} style={styles.errorStateImage} resizeMode="contain" />
					<Text style={{ color: COLORS.textWhite, fontSize: FONT_SIZES.lg }}>타워 정보를 찾을 수 없습니다.</Text>
					<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING_H.xl }}>
						<Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.md }}>뒤로 가기</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		);
	}

	if (quizData.length === 0 || !currentQuestion) {
		return (
			<View style={styles.container}>
				<LinearGradient colors={COLORS.darkGradient} style={StyleSheet.absoluteFillObject} />
				<SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
					<FastImage source={require('@/assets/images/screen-heroes/data-retry.png')} style={styles.errorStateImage} resizeMode="contain" />
					<Text style={{ color: COLORS.textWhite, fontSize: FONT_SIZES.lg }}>레벨 {level}에 해당하는 단어가 없습니다.</Text>
					<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING_H.xl }}>
						<Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.md }}>뒤로 가기</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</View>
		);
	}

	const isCorrectAnswer = selectedAnswer === currentQuestion.correctAnswer;

	return (
		<View style={styles.container}>
			<LinearGradient colors={COLORS.darkGradient} style={StyleSheet.absoluteFillObject} />

			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				<View style={styles.header}>
					<TouchableOpacity onPress={handleExit} style={styles.exitButton} hitSlop={HIT_SLOP}>
						<IconComponent type="materialIcons" name="close" size={scaledSize(28)} color={COLORS.textWhite} />
					</TouchableOpacity>

					<View style={styles.headerCenter}>
						<View style={styles.headerTitleRow}>
							<FastImage source={require('@/assets/images/screen-heroes/tower-crest.png')} style={styles.headerCrest} resizeMode="contain" />
							<Text style={styles.levelTitle} numberOfLines={1}>{towerLevel.name}</Text>
						</View>
						<Text style={styles.questionCount}>
							{currentQuestionIndex + 1} / {totalQuestions} 문제
						</Text>
					</View>

					<View style={styles.headerRight}>
						{__DEV__ && (
							<TouchableOpacity onPress={handleAutoPass} style={styles.devButton} hitSlop={HIT_SLOP}>
								<IconComponent type="materialIcons" name="flash-on" size={scaledSize(20)} color={COLORS.warning} />
							</TouchableOpacity>
						)}
						<View style={styles.scoreContainer}>
							{Array.from({ length: totalQuestions }).map((_, i) => (
								<IconComponent
									key={i}
									type="materialIcons"
									name={i < correctCount ? 'star' : 'star-border'}
									size={scaledSize(18)}
									color={i < correctCount ? COLORS.gold : 'rgba(255,255,255,0.35)'}
								/>
							))}
						</View>
						<CharacterGuideButton onPress={guide.open} tone="onDark" />
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

				<ScrollView
					style={styles.content}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}>
					<View style={styles.bossSection}>
						<View style={[styles.bossGlow, { backgroundColor: withAlpha(towerLevel.color, ALPHA.border) }]} />
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

					<Animated.View
						style={{
							opacity: questionAnim,
							transform: [{ translateY: questionAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) }],
						}}>
						<View style={styles.questionCard}>
							<View style={styles.questionCardGradient}>
							<Text style={styles.questionText}>
								<Text style={styles.questionProverb}>'{currentQuestion.proverb}'</Text>
								<Text style={styles.questionAsk}>의 뜻은 무엇입니까?</Text>
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
								backgroundColor = COLORS.primary;
							} else if (showWrong) {
								backgroundColor = COLORS.danger;
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
											{showCorrect && <IconComponent type="materialIcons" name="check-circle" size={scaledSize(24)} color={COLORS.textWhite} />}
											{showWrong && <IconComponent type="materialIcons" name="cancel" size={scaledSize(24)} color={COLORS.textWhite} />}
										</View>
									</View>
								</TouchableOpacity>
							);
						})}
						</View>
					</Animated.View>

					{isAnswered && (
						<View style={styles.explanationCard}>
							<View
								style={[
									styles.explanationGradient,
									{ backgroundColor: isCorrectAnswer ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' },
								]}>
								<View style={styles.explanationHeader}>
									<IconComponent
										type="materialIcons"
										name={isCorrectAnswer ? 'check-circle' : 'info'}
										size={scaledSize(24)}
										color={isCorrectAnswer ? COLORS.primary : COLORS.danger}
									/>
									<Text style={[styles.explanationTitle, { color: isCorrectAnswer ? COLORS.primary : COLORS.danger }]}>
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
									color={COLORS.textWhite}
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
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'타워 퀴즈는 이 층의 보스가 내는 문제를 푸는 곳입니다.',
					'오른쪽 표시로 지금까지 맞힌 개수를 확인할 수 있습니다.',
					'기준을 넘기면 다음 층과 보상이 열립니다!',
				]}
				title="타워 퀴즈, 이렇게 풉니다"
			/>
		</View>
	);
};

export default TowerQuizScreen;

const styles = themedStyles(() => StyleSheet.create({
	container: { flex: 1 },
	safeArea: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
	},
	exitButton: {
		width: scaleWidth(44),
		height: scaleWidth(44),
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerCenter: { flex: 1, alignItems: 'center' },
	headerTitleRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.xs },
	headerCrest: { width: scaleWidth(28), height: scaleWidth(28) },
	loadingCoachImage: { width: scaleWidth(150), height: scaleHeight(150), marginBottom: SPACING_H.lg },
	errorStateImage: { width: scaleWidth(150), height: scaleHeight(100), marginBottom: SPACING_H.lg },
	levelTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textWhite },
	questionCount: { fontSize: FONT_SIZES.md, color: COLORS.darkTextSecondary, marginTop: SPACING_H.xs },
	progressBarContainer: { paddingHorizontal: SPACING_W.lg, paddingBottom: SPACING_H.lg },
	progressLabelRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: SPACING_H.xs,
	},
	progressLabelText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
	progressBarBackground: {
		height: scaleHeight(10),
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderRadius: RADIUS.round,
		overflow: 'hidden',
	},
	progressBarFill: { height: '100%', borderRadius: RADIUS.round },
	content: { flex: 1, paddingHorizontal: SPACING_W.lg },
	// 하단 고정 '다음 문제' 버튼에 컨텐츠가 가리지 않도록 여백 확보
	contentContainer: { paddingBottom: SPACING_H.xxxxl },
	bossSection: { alignItems: 'center', marginVertical: SPACING_H.xl },
	bossGlow: {
		position: 'absolute',
		width: scaleWidth(120),
		height: scaleWidth(120),
		borderRadius: scaleWidth(60),
	},
	bossImage: { width: scaleWidth(120), height: scaleWidth(120), borderRadius: scaleWidth(60) },
	questionCard: { marginBottom: SPACING_H.xxl },
	questionCardGradient: { paddingHorizontal: SPACING_W.lg, paddingVertical: SPACING_H.lg },
	questionText: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '600',
		color: COLORS.textWhite,
		lineHeight: scaledSize(26),
		textAlign: 'center',
	},
	questionProverb: {
		color: COLORS.darkAccent, // ✅ 속담 부분만 파란색 강조
		fontWeight: '700',
	},
	questionAsk: {
		color: COLORS.textWhite, // 질문 문구는 흰색
		fontWeight: '600',
	},
	answersContainer: { gap: SPACING_H.md },
	answerButton: { borderRadius: RADIUS.md, overflow: 'hidden' },
	answerGradient: { paddingHorizontal: SPACING_W.lg, paddingVertical: SPACING_H.lg },
	answerContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.md },
	answerNumber: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(32) / 2,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	answerNumberText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textWhite },
	answerText: { flex: 1, fontSize: FONT_SIZES.lg, color: COLORS.textWhite, lineHeight: scaledSize(22) },
	explanationCard: {
		marginTop: SPACING_H.xl,
		marginBottom: SPACING_H.xl,
		borderRadius: RADIUS.md,
		overflow: 'hidden',
	},
	explanationGradient: { paddingHorizontal: SPACING_W.lg, paddingVertical: SPACING_H.lg },
	explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.sm, marginBottom: SPACING_H.sm },
	explanationTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
	explanationText: { fontSize: FONT_SIZES.md, color: COLORS.darkText, lineHeight: scaledSize(20) },
	nextButtonContainer: { paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, paddingBottom: SPACING_H.lg },
	nextButton: { borderRadius: RADIUS.md, overflow: 'hidden' },
	nextButtonGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: SPACING_W.sm,
		minHeight: scaleHeight(48),
		paddingVertical: SPACING_H.lg,
	},
	nextButtonText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textWhite },
	headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.sm },
	devButton: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(245, 158, 11, 0.2)',
		borderRadius: scaleWidth(36) / 2,
		borderWidth: 1,
		borderColor: 'rgba(245, 158, 11, 0.5)',
	},
	scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xs },
	effectText: {
		position: 'absolute',
		fontSize: FONT_SIZES.display,
		fontWeight: '700',
		textShadowColor: 'rgba(0,0,0,0.5)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 4,
		zIndex: 10,
	},
}));
