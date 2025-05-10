import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	KeyboardAvoidingView,
	TouchableWithoutFeedback,
	Keyboard,
	Dimensions,
	Platform,
	Alert,
	SafeAreaView,
	Animated,
	ScrollView,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import QuizStartModal from '../modal/QuizStartModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QuizResultModal from '../modal/QuizResultModal';
import { QuizBadgeInterceptor } from '@/services/interceptor/QuizBadgeInterceptor';
import { CONST_BADGES } from '@/const/ConstBadges';
import IconComponent from '../common/atomic/IconComponent';

const { width: screenWidth } = Dimensions.get('window');

interface ProverbQuizScreenProps {
	mode: 'meaning' | 'proverb' | 'fill-blank'; // 추가!
}
const labelColors = ['#1abc9c', '#3498db', '#9b59b6', '#e67e22'];

const STORAGE_KEY = 'UserQuizHistory';

const ProverbCommonFrameScreen = ({ mode }: ProverbQuizScreenProps) => {
	const isFocused = useIsFocused();
	const navigation = useNavigation();
	const comboAnim = useRef(new Animated.Value(0)).current;
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const scaleAnims = useRef<Animated.Value[]>([]);
	const scaleAnim = useRef(new Animated.Value(0)).current;

	const [quizHistory, setQuizHistory] = useState<MainDataType.UserQuizHistory | null>(null);

	const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<MainDataType.UserBadge[]>([]);

	const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
	const [question, setQuestion] = useState<MainDataType.Proverb | null>(null);
	const [options, setOptions] = useState<string[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [remainingTime, setRemainingTime] = useState(10);
	const [showStartModal, setShowStartModal] = useState(true);
	const [showResultModal, setShowResultModal] = useState(false);
	const [resultTitle, setResultTitle] = useState('');
	const [resultMessage, setResultMessage] = useState('');
	const [confettiKey, setConfettiKey] = useState(0);
	const [blankWord, setBlankWord] = useState('');
	const [questionText, setQuestionText] = useState('');
	const [selectedLevel, setSelectedLevel] = useState<string>('전체'); // 기본값 '전체'
	const [selectedCategory, setSelectedCategory] = useState<string>('전체'); // 기본값 '전체'
	const [levelOptions, setLevelOptions] = useState<string[]>([]);
	const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
	const [modeStep, setModeStep] = useState(0); // 0 = 난이도, 1 = 카테고리
	const [showExitModal, setShowExitModal] = useState<boolean>(false);
	const [badgeModalVisible, setBadgeModalVisible] = useState(false);

	const hasAnsweredRef = useRef(false);
	const [correctCount, setCorrectCount] = useState(0);
	const [totalScore, setTotalScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [resultType, setResultType] = useState<'correct' | 'wrong' | 'timeout' | 'done'>('correct');

	const scoreBonusAnim = useRef(new Animated.Value(0)).current;
	const [showScoreBonus, setShowScoreBonus] = useState(false);

	const praiseMessages = [
		'정답이에요! 정말 똑똑하네요! 🎉\n이번 퀴즈를 정확히 짚어냈어요!',
		'대단해요! 완벽한 정답이에요! 🏆\n계속 이렇게만 간다면 금방 수도 마스터가 되겠어요!',
		'굿잡! 멋져요! 💯\n지금까지의 학습이 빛을 발하고 있네요!',
		'똑소리 나는 정답이에요! 🤓✨\n집중력이 정말 뛰어나네요!',
		'정답을 쏙쏙 맞히네요! 🌟\n공부한 보람이 느껴지죠?\n계속 도전해봐요!',
		'👏 대단해요!\n이 속도라면 모든 속담을 금방 외울 수 있을 것 같아요!',
		'정말 똑똑하군요! 📚\n퀴즈를 척척 풀어가는 모습이 인상적이에요!',
	];
	useBlockBackHandler(true); // 뒤로가기 모션 막기
	useEffect(() => {
		(async () => {
			const stored = await AsyncStorage.getItem(STORAGE_KEY);

			if (stored) {
				setQuizHistory(JSON.parse(stored));
			} else {
				// 최초 초기화
				const initial: MainDataType.UserQuizHistory = {
					correctProverbId: [],
					wrongProverbId: [],
					lastAnsweredAt: new Date(),
					quizCounts: {},
					badges: [],
					totalScore: 0,
					bestCombo: 0,
				};
				await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
				setQuizHistory(initial);
			}
		})();
	}, []);

	// 퀴즈 시작 전 데이터 불러오기
	useEffect(() => {
		const levels = ProverbServices.selectLevelNameList();
		const categories = ProverbServices.selectCategoryList();
		setLevelOptions(['전체', ...levels]);
		setCategoryOptions(['전체', ...categories]);
	}, []);

	useEffect(() => {
		if (!showStartModal) {
			// 퀴즈 시작과 동시에 최신 기록 반영
			(async () => {
				const stored = await AsyncStorage.getItem(STORAGE_KEY);
				if (stored) {
					const parsed: MainDataType.UserQuizHistory = JSON.parse(stored);
					setQuizHistory(parsed);
					setTotalScore(parsed.totalScore || 0); // ✅ 여기서 totalScore 반영
				}
			})();
			loadQuestion();
		}
	}, [showStartModal]);

	useEffect(() => {
		const all = ProverbServices.selectProverbList();
		setProverbs(all);
	}, []);

	useEffect(() => {
		if (options.length) {
			scaleAnims.current = options.map(() => new Animated.Value(1));
		}
	}, [options]);

	useEffect(() => {
		if (badgeModalVisible) {
			scaleAnim.setValue(0.8);
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
			}).start();
		}
	}, [badgeModalVisible]);

	const solvedCount = quizHistory ? new Set([...(quizHistory.correctProverbId ?? []), ...(quizHistory.wrongProverbId ?? [])]).size : 0;
	/**
	 * 퀴즈 불러오기
	 * @returns
	 */
	const loadQuestion = () => {
		const filteredProverbs = proverbs.filter((p) => {
			const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
			const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
			return levelMatch && categoryMatch;
		});

		if (filteredProverbs.length === 0) {
			Alert.alert('문제 없음', '선택한 난이도와 카테고리에 해당하는 문제가 없습니다.', [{ text: '확인', onPress: () => setShowStartModal(true) }]);
			return;
		}

		const shuffled = [...filteredProverbs].sort(() => Math.random() - 0.5);
		const newQuestion = shuffled[0];
		const distractors = shuffled.slice(1, 4);

		let allOptions: string[] = [];
		let displayText: string = '';

		if (mode === 'meaning') {
			// 뜻 맞추기
			allOptions = [...distractors.map((item) => item.meaning), newQuestion.meaning];
			displayText = newQuestion.proverb;
		} else if (mode === 'proverb') {
			// 속담 맞추기
			allOptions = [...distractors.map((item) => item.proverb), newQuestion.proverb];
			displayText = newQuestion.longMeaning!;
		} else if (mode === 'fill-blank') {
			// 빈칸 채우기
			const blank = pickBlankWord(newQuestion.proverb);
			displayText = newQuestion.proverb.replace(blank, '(____)');
			allOptions = [...distractors.map((item) => pickBlankWord(item.proverb)), blank];
			setBlankWord(blank); // 따로 기억해둬야 함
		}

		setQuestion(newQuestion);
		setOptions(allOptions.sort(() => Math.random() - 0.5));
		setQuestionText(displayText); // 문제 텍스트 따로 저장
		setSelected(null);
		setIsCorrect(null);
		setRemainingTime(20);

		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					clearInterval(timerRef.current!);
					handleSelect(''); // 타임아웃 처리
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		if (filteredProverbs.length === 1) {
			// 마지막 문제를 풀고 나면 종료
			setResultType('done');
			setResultTitle('모든 퀴즈 완료!');
			setResultMessage('훌륭해요! 모든 문제를 마쳤어요 🎉');
			setShowResultModal(true);
			return;
		}
	};

	const startTimer = () => {
		if (!question || hasAnsweredRef.current) return;

		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			setRemainingTime((prev) => {
				const next = prev - 1;
				if (next <= 0) {
					clearInterval(timerRef.current!);
					// 🔒 포커스 확인
					if (isFocused && question) {
						handleSelect('');
					}
				}
				return next;
			});
		}, 1000);
	};

	/**
	 *
	 * @param answer
	 * @returns
	 */
	const handleSelect = async (answer: string) => {
		if (!question) return;
		if (timerRef.current) clearInterval(timerRef.current);

		let acquiredBadges: string[] = [];

		let correctAnswer = '';
		if (mode === 'meaning') correctAnswer = question.longMeaning;
		else if (mode === 'proverb') correctAnswer = question.proverb;
		else if (mode === 'fill-blank') correctAnswer = blankWord;

		const isTimeout = answer === '';
		const correct = answer === correctAnswer;

		setSelected(answer);
		setIsCorrect(correct);
		setResultType(isTimeout ? 'timeout' : correct ? 'correct' : 'wrong');

		if (correct) {
			setShowScoreBonus(true);
			scoreBonusAnim.setValue(0); // 초기화
			Animated.timing(scoreBonusAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}).start(() => setShowScoreBonus(false));
			setCorrectCount((prev) => prev + 1);
			setTotalScore((prev) => prev + 10);
			setCombo((prev) => {
				const newCombo = prev + 1;
				triggerComboAnimation();
				return newCombo;
			});
		} else {
			setCombo(0);
		}

		// ✅ 🔽 여기에 퀴즈 기록 업데이트 추가
		if (quizHistory && question) {
			// 기존 업데이트 로직 유지
			const updated = { ...quizHistory };
			const id = question.id;

			updated.quizCounts[id] = (updated.quizCounts[id] || 0) + 1;
			updated.lastAnsweredAt = new Date();

			if (correct) {
				if (!updated.correctProverbId.includes(id)) {
					updated.correctProverbId.push(id);
				}
				updated.totalScore += 10;
				updated.bestCombo = Math.max(updated.bestCombo || 0, combo + 1);
			} else {
				if (!updated.wrongProverbId.includes(id)) {
					updated.wrongProverbId.push(id);
				}
			}

			acquiredBadges = QuizBadgeInterceptor(updated, ProverbServices.selectProverbList());

			const finalUpdated = {
				...updated,
				badges: [...new Set([...(updated.badges || []), ...acquiredBadges])],
			};
			setQuizHistory(finalUpdated);
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalUpdated));

			if (acquiredBadges.length > 0) {
				const earnedBadgeObjects = CONST_BADGES.filter((b) => acquiredBadges.includes(b.id));
				setNewlyEarnedBadges(earnedBadgeObjects); // ✨ 뱃지 정보 세팅
				setBadgeModalVisible(true); // ✨ 모달 표시
				setConfettiKey(Math.random()); // 🎉 축포 터뜨리기
				return; // 정답/오답 모달 생략
			}
		}

		// ✅ 뱃지가 없을 경우에만 결과 모달 출력
		if (isFocused) {
			const title = isTimeout ? '⏰ 시간 초과!' : correct ? '🎉 정답입니다!' : '😢 오답입니다';
			const message = isTimeout
				? '시간 초과로 오답 처리됐어요!'
				: correct
					? praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
					: '앗, 다음엔 맞힐 수 있어요!';

			setResultTitle(title);
			setResultMessage(message);
			setShowResultModal(true);
		}
	};

	const pickBlankWord = (text: string) => {
		const words = text.split(' ').filter((w) => w.length > 1);
		const randomWord = words[Math.floor(Math.random() * words.length)];
		return randomWord;
	};
	const getSolvedCount = () => {
		if (!quizHistory) return 0;

		const solvedSet = new Set([...(quizHistory.correctProverbId ?? []), ...(quizHistory.wrongProverbId ?? [])]);

		if (selected && question?.id && !solvedSet.has(question.id)) {
			// 방금 푼 문제를 아직 history에 반영 안 된 상태라면 1개 더해줌
			return solvedSet.size + 1;
		}

		return solvedSet.size;
	};
	const totalCount = proverbs.filter((p) => {
		const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
		const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
		return levelMatch && categoryMatch;
	}).length;

	const triggerComboAnimation = () => {
		comboAnim.setValue(0);
		Animated.sequence([
			Animated.timing(comboAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(comboAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start();
	};

	const scoreBonusStyle = {
		opacity: scoreBonusAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [1, 0],
		}) as unknown as number, // 이 부분이 핵심
		transform: [
			{
				translateY: scoreBonusAnim.interpolate({
					inputRange: [0, 1],
					outputRange: [0, -60],
				}) as unknown as number,
			},
			{
				scale: scoreBonusAnim.interpolate({
					inputRange: [0, 0.3, 1],
					outputRange: [1, 1.5, 1],
				}) as unknown as number,
			},
		],
		position: 'absolute' as const,
		top: -30,
	};

	const safelyGoBack = () => {
		navigation.goBack(); // 그래도 예외적으로 강제로
	};

	const handleNextQuestion = () => {
		const isFinal = resultType === 'done';

		// 먼저 초기화
		setResultTitle('');
		setResultMessage('');
		setShowResultModal(false);

		setSelected(null);
		setIsCorrect(null);
		setOptions([]);
		setQuestionText('');
		setBlankWord('');
		setQuestion(null);

		setTimeout(() => {
			if (isFinal) {
				safelyGoBack();
			} else {
				loadQuestion();
			}
		}, 300);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={{ flex: 1 }}>
						<View style={styles.container}>
							<View style={styles.inner}>
								<View style={styles.progressStatusWrapper}>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
										<Text style={styles.progressText}>진행중인 퀴즈</Text>
										<Text style={[styles.progressText, { color: '#3498db' }]}>
											{getSolvedCount()} / {totalCount}
										</Text>
									</View>

									<View style={styles.progressBarWrapper}>
										<View style={[styles.progressBarFill, { width: `${(solvedCount / totalCount) * 100}%` }]} />
									</View>

									<View style={styles.statusCardRow}>
										<View style={styles.statusCard}>
											<Text style={styles.statusCardTitle}>📝 푼 퀴즈 수</Text>
											<Text style={styles.statusCardValue}>{solvedCount}</Text>
										</View>
										<View style={styles.statusCard}>
											<Text style={styles.statusCardTitle}>🎯 총점</Text>
											<View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
												<Text style={styles.statusCardValue}>{totalScore}점</Text>
												{showScoreBonus && <Animated.Text style={[styles.scoreBonusText, scoreBonusStyle]}>+10점!</Animated.Text>}
											</View>
										</View>
										<View style={styles.statusCard}>
											<Text style={[styles.statusCardTitle, { color: '#e67e22' }]}>🔥 콤보</Text>
											<Animated.View
												style={{
													transform: [
														{
															scale: comboAnim.interpolate({
																inputRange: [0, 1],
																outputRange: [1, 1.5],
															}),
														},
													],
												}}>
												<Text style={styles.statusCardValue}>{combo} Combo</Text>
											</Animated.View>
										</View>
									</View>
								</View>
								<View style={styles.quizBox}>
									<AnimatedCircularProgress size={80} width={6} fill={(20 - remainingTime) * 5} tintColor='#3498db' backgroundColor='#ecf0f1'>
										{() => <Text style={styles.timerText}>{remainingTime}s</Text>}
									</AnimatedCircularProgress>

									<Text style={styles.questionText}>
										{mode === 'fill-blank'
											? questionText || '문제 준비중...'
											: mode === 'meaning'
												? question?.proverb
												: question?.longMeaning || '문제 준비중...'}
									</Text>

									<View style={styles.optionsContainer}>
										{options.map((option, index) => {
											const scaleAnim = scaleAnims.current[index] ?? new Animated.Value(1); // 방어코드

											const isSelected = selected === option;
											const isAnswerCorrect = isCorrect && isSelected;
											const isAnswerWrong = !isCorrect && isSelected;

											const handlePressIn = () => {
												Animated.spring(scaleAnim, {
													toValue: 0.97,
													useNativeDriver: true,
												}).start();
											};

											const handlePressOut = () => {
												Animated.spring(scaleAnim, {
													toValue: 1,
													useNativeDriver: true,
												}).start();
											};

											return (
												<Animated.View key={index} style={{ transform: [{ scale: scaleAnim }] }}>
													<TouchableOpacity
														onPressIn={handlePressIn}
														onPressOut={handlePressOut}
														style={[styles.optionCard, isAnswerCorrect && styles.optionCorrectCard, isAnswerWrong && styles.optionWrongCard]}
														onPress={() => handleSelect(option)}
														disabled={!!selected}>
														<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
															<View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
																<Text style={[styles.optionLabel, { color: labelColors[index], marginRight: 6 }]}>{['A.', 'B.', 'C.', 'D.'][index]}</Text>
																<Text style={styles.optionContent}>{option}</Text>
															</View>

															{isSelected && <Icon name={isAnswerCorrect ? 'check-circle' : 'cancel'} size={28} color={isAnswerCorrect ? '#2ecc71' : '#e74c3c'} />}
														</View>
													</TouchableOpacity>
												</Animated.View>
											);
										})}
									</View>
								</View>
							</View>

							<View style={styles.bottomExitWrapper}>
								<TouchableOpacity style={styles.exitButton} onPress={() => setShowExitModal(true)}>
									<Text style={styles.exitButtonText}>퀴즈 종료</Text>
								</TouchableOpacity>
							</View>

							{/* ======================= 퀴즈 시작 팝업 ============================ */}
							<QuizStartModal
								visible={showStartModal}
								modeStep={modeStep}
								setModeStep={setModeStep}
								selectedLevel={selectedLevel}
								selectedCategory={selectedCategory}
								levelOptions={levelOptions}
								categoryOptions={categoryOptions}
								setSelectedLevel={setSelectedLevel}
								setSelectedCategory={setSelectedCategory}
								onClose={() => {
									if (timerRef.current) clearInterval(timerRef.current);
									navigation.goBack();
								}}
								onStart={() => {
									setShowStartModal(false);
									console.log('선택된 난이도:', selectedLevel);
									console.log('선택된 카테고리:', selectedCategory);
								}}
							/>

							{/* ======================= 퀴즈 종료 ============================ */}
							<Modal visible={showExitModal} transparent animationType='fade'>
								<View style={styles.modalOverlay}>
									<View style={styles.exitModal}>
										<Text style={styles.exitModalTitle}>퀴즈를 종료하시겠어요?</Text>
										<Text style={styles.exitModalMessage}>진행 중인 퀴즈가 저장되지 않습니다.</Text>
										<View style={styles.modalButtonRow}>
											<TouchableOpacity
												style={[styles.modalBackButton, { backgroundColor: '#bdc3c7' }]}
												onPress={() => {
													setShowExitModal(false);
													startTimer(); // ⏱ 타이머 재시작
												}}>
												<Text style={styles.modalButtonText}>취소</Text>
											</TouchableOpacity>
											<TouchableOpacity
												style={styles.exitModalConfirmButton}
												onPress={() => {
													// setShowExitModal(false);
													// if (isWrongReview) {
													//     //@ts-ignore
													//     navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
													// } else {
													//     safelyGoBack();
													// }
													safelyGoBack();
												}}>
												<Text style={styles.modalButtonText}>종료하기</Text>
											</TouchableOpacity>
										</View>
									</View>
								</View>
							</Modal>

							<QuizResultModal
								visible={showResultModal}
								resultType={resultType}
								resultTitle={resultTitle}
								resultMessage={resultMessage}
								question={question}
								onNext={handleNextQuestion}
							/>

							{/* 뱃지 모달 */}
							<Modal visible={badgeModalVisible} transparent animationType='fade'>
								<View style={styles.modalOverlay}>
									<ConfettiCannon key={confettiKey} count={100} origin={{ x: screenWidth / 2, y: 0 }} fadeOut autoStart explosionSpeed={350} />
									<Animated.View style={[styles.badgeModal, { transform: [{ scale: scaleAnim }] }]}>
										<Text style={styles.badgeModalTitle}>🎉 새로운 뱃지를 획득했어요!</Text>
										<ScrollView style={{ maxHeight: 300, width: '100%' }} contentContainerStyle={{ paddingHorizontal: 12 }}>
											{newlyEarnedBadges.map((badge, index) => (
												<View
													key={index}
													style={[styles.badgeCard, styles.badgeCardActive]} // 액티브 카드 스타일 항상 적용
												>
													<View style={[styles.iconBox, styles.iconBoxActive]}>
														{/* @ts-ignore */}
														<IconComponent type={badge.iconType} name={badge.icon} size={20} color={'#27ae60'} />
													</View>
													<View style={styles.badgeTextWrap}>
														<Text style={[styles.badgeName, styles.badgeTitleActive]}>{badge.name}</Text>
														<Text style={[styles.badgeDescription, styles.badgeDescActive]}>{badge.description}</Text>
													</View>
												</View>
											))}
										</ScrollView>
										<TouchableOpacity
											onPress={() => {
												setBadgeModalVisible(false); // 모달 닫기
												handleNextQuestion(); // 다음 문제로 진행
											}}
											style={styles.modalConfirmButton}>
											<Text style={styles.closeButtonText2}>확인</Text>
										</TouchableOpacity>
									</Animated.View>
								</View>
							</Modal>

							{confettiKey > 0 && <ConfettiCannon key={confettiKey} count={100} origin={{ x: screenWidth / 2, y: 0 }} fadeOut autoStart />}
						</View>
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

export default ProverbCommonFrameScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},

	inner: {
		flex: 1,
		justifyContent: 'flex-start', // 👈 상단 정렬로 변경
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 24, // 👈 여유 간격이 필요하다면 추가 (예: 24)
	},
	quizBox: {
		width: '100%',
		maxWidth: 460, // 기존 500 → 살짝 줄임
		alignItems: 'center',
	},
	timerText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 8 },
	questionText: {
		fontSize: 18, // 기존 20 → 살짝 축소
		fontWeight: 'bold',
		marginVertical: 24, // 기존 30 → 줄임
		textAlign: 'center',
		color: '#3498db',
	},
	optionsContainer: { width: '100%' },
	optionButton: { backgroundColor: '#ecf0f1', padding: 16, borderRadius: 12, marginBottom: 12 },
	optionText: { fontSize: 16, fontWeight: '600', color: '#34495e' },
	correct: { backgroundColor: '#2ecc71' },
	wrong: { backgroundColor: '#e74c3c' },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
	resultModal: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', width: '80%' },
	resultTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
	resultMessage: { fontSize: 16, color: '#34495e', marginBottom: 0, textAlign: 'center' },
	modalButton: {
		backgroundColor: '#3498db',
		paddingVertical: 14,
		paddingHorizontal: 40,
		borderRadius: 30,
		marginTop: 20,
	},
	modalButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	bottomExitWrapper: {
		width: '100%',
		paddingVertical: 14,
		alignItems: 'center',
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	exitButton: { backgroundColor: '#7f8c8d', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30 },
	exitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
	selectModal: {
		backgroundColor: '#fff',
		paddingHorizontal: 24,
		paddingBottom: 24,
		paddingTop: 48,
		borderRadius: 16,
		alignItems: 'center',
		width: '90%',
		position: 'relative',
	},
	selectTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 8,
	},
	selectSub: {
		fontSize: 16,
		color: '#34495e',
		marginBottom: 20,
		textAlign: 'center',
	},
	selectLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: 8,
	},
	selectButton: {
		width: '48%',
		minHeight: 70,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},

	selectRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginTop: 16,
	},
	backButton: {
		alignSelf: 'flex-start',
		marginBottom: 16,
	},
	backButtonInline: {
		flex: 1, // ✅ 퀴즈 시작과 동일 너비
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		paddingVertical: 14,
		paddingHorizontal: 0, // 안쪽 여백 최소화
		borderRadius: 30,
		borderWidth: 2,
		borderColor: '#3498db',
	},
	backButtonText: {
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
		color: '#3498db',
	},
	selectSectionWrapper: {
		width: '100%',
	},
	closeButton: {
		position: 'absolute',
		top: 12,
		right: 12,
		zIndex: 10,
		padding: 4,
	},
	closeButtonText: {
		fontSize: 22,
		color: '#7f8c8d',
		fontWeight: 'bold',
	},
	statusCardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: 16,
	},

	statusCard: {
		flex: 1,
		backgroundColor: '#ecf0f1',
		marginHorizontal: 4,
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},

	statusCardTitle: {
		fontSize: 14,
		color: '#7f8c8d',
		marginBottom: 4,
	},

	statusCardValue: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2c3e50',
	},
	exitModal: {
		backgroundColor: '#fff',
		padding: 24,
		borderRadius: 20,
		width: '85%',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 6,
	},
	exitModalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 12,
		textAlign: 'center',
	},
	exitModalMessage: {
		fontSize: 15,
		color: '#7f8c8d',
		marginBottom: 20,
		textAlign: 'center',
		lineHeight: 22,
	},
	exitModalConfirmButton: {
		flex: 1,
		backgroundColor: '#e74c3c',
		padding: 12,
		borderRadius: 8,
		marginLeft: 6,
		alignItems: 'center',
	},
	badgeModal: {
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 20,
		width: '85%',
		maxHeight: '80%',
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
		padding: 12,
		borderRadius: 8,
		marginRight: 6,
		alignItems: 'center',
	},
	resultMascot: {
		width: 150,
		height: 150,
		marginVertical: 5,
	},
	correctHighlight: {
		color: '#27ae60',
		fontWeight: 'bold',
		fontSize: 17,
	},
	resultMessageContainer: {
		alignItems: 'center',
		justifyContent: 'center', // ✨ 추가: 수직 중앙 정렬
		minHeight: 90, // ✨ 팝업 내 균형 맞춤용 최소 높이
	},
	replayText: {
		marginTop: 10,
		fontSize: 13,
		textAlign: 'center',
		color: '#2980b9',
		fontWeight: '600',
		textDecorationLine: 'underline',
	},
	modalConfirmButton: {
		backgroundColor: '#2980b9',
		paddingVertical: 14,
		paddingHorizontal: 36,
		borderRadius: 30,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	modalConfirmText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	capitalHighlight: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#e74c3c',
	},

	proverbText: {
		fontWeight: '700',
		color: '#2c3e50',
		fontSize: 16, // 기존보다 살짝 키움
	},

	meaningText: {
		fontWeight: '700',
		color: '#2980b9',
		fontSize: 16, // 기존보다 살짝 키움
	},

	resultSubText: {
		fontSize: 15, // 기존 14 → 가독성 개선
		color: '#34495e',
		marginTop: 6,
		textAlign: 'center',
		lineHeight: 22,
	},
	progressStatusWrapper: {
		// ✅ 여기에 marginTop 추가!
		width: '100%',
		maxWidth: 500,
		backgroundColor: '#fff',
		padding: 16,
		marginBottom: 12,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#ddd',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	progressText: {
		fontSize: 16,
		color: '#2c3e50',
		fontWeight: '600',
		marginBottom: 8,
		textAlign: 'center',
	},

	progressBarWrapper: {
		height: 10,
		width: '100%',
		backgroundColor: '#eee',
		borderRadius: 5,
		overflow: 'hidden',
		marginBottom: 16,
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: '#4a90e2',
		borderRadius: 5,
	},
	fixedTopBar: {
		width: '100%',
		backgroundColor: '#fff',
		zIndex: 10,
		paddingTop: Platform.OS === 'ios' ? 50 : 20,
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderColor: '#eee',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	quizScrollContainer: {
		paddingBottom: 80,
	},
	scoreBonusText: {
		position: 'absolute',
		top: -10,
		fontSize: 22,
		color: '#00b894',
		fontWeight: 'bold',
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	optionCard: {
		backgroundColor: '#fff',
		padding: 12, // 기존 16 → 줄임
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: '#dcdde1',
		marginBottom: 12, // 기존 14 → 줄임
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
	},

	optionCorrectCard: {
		borderColor: '#2ecc71',
		backgroundColor: '#eafaf1',
	},

	optionWrongCard: {
		borderColor: '#e74c3c',
		backgroundColor: '#fdecea',
	},

	optionLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: 0, // 아래 여백 제거
	},

	optionContent: {
		fontSize: 16,
		fontWeight: '700',
		color: '#2c3e50',
		lineHeight: 22,
		flexShrink: 1,
		flexWrap: 'wrap', // ✅ 줄바꿈 허용
	},
	resultMessageBig: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2ecc71',
		textAlign: 'center',
		lineHeight: 24,
		marginBottom: 16,
	},

	correctInfoCard: {
		width: '100%',
		backgroundColor: '#eafaf1',
		borderRadius: 12,
		padding: 16,
		marginTop: 10,
	},

	correctInfoLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#27ae60',
		marginBottom: 4,
	},

	correctInfoText: {
		fontSize: 15,
		color: '#2c3e50',
		lineHeight: 22,
		fontWeight: '500',
	},
	badgeModalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 16,
		textAlign: 'center',
	},
	badgeItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingVertical: 10,
		paddingHorizontal: 12,
		marginBottom: 12,
		width: '100%',
		borderRadius: 12,
		borderWidth: 1.2,
		borderColor: '#d1f2eb', // 밝은 초록 계열
		backgroundColor: '#f9fefc', // 전체 배경도 아주 옅은 초록색
	},
	badgeIconWrap: {
		marginRight: 12,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#ADD8E6',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	badgeName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#27ae60', // 초록색 강조
		marginBottom: 2,
	},

	badgeTextWrap: {
		flexShrink: 1,
		flexGrow: 1,
		minWidth: 0,
		maxWidth: '85%', // ✅ 설명 부분이 너무 길지 않게 제한
	},
	badgeDescription: {
		fontSize: 14,
		color: '#7f8c8d',
		lineHeight: 20,
	},
	modalConfirmText2: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	modalConfirmButton2: {
		backgroundColor: '#2980b9',
		paddingVertical: 14,
		paddingHorizontal: 36,
		borderRadius: 30,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#f9f9f9',
		borderRadius: 12,
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#ddd',
		width: '100%', // ✅ 명확히 카드 너비 지정
	},
	badgeCardActive: {
		borderColor: '#27ae60',
		backgroundColor: '#f0fbf4',
	},
	iconBox: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	iconBoxActive: {
		backgroundColor: '#d0f0dc',
	},
	badgeTitleActive: {
		color: '#27ae60',
	},
	badgeDescActive: {
		color: '#2d8659',
	},

	closeButtonText2: {
		color: 'white',
		fontWeight: '600',
		fontSize: 15, // 기존 16 → 줄임
	},
	modalContentBox: {
		width: '90%',
		minHeight: 340, // 카테고리 선택 팝업 기준
		backgroundColor: '#fff',
		paddingVertical: 24,
		paddingHorizontal: 20,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
