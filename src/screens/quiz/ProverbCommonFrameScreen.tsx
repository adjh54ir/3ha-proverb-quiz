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
	ScrollView,
} from 'react-native';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import QuizStartModal from '../modal/QuizStartModal';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

interface ProverbQuizScreenProps {
	mode: 'meaning' | 'proverb' | 'fill-blank'; // 추가!
}
type Params = {
	title: string;
	isWrongReview?: boolean;
};

const STORAGE_KEY = 'UserQuizHistory';

const ProverbCommonFrameScreen = ({ mode }: ProverbQuizScreenProps) => {
	const isFocused = useIsFocused();
	const navigation = useNavigation();
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	useBlockBackHandler(true); // 뒤로가기 모션 막기
	const [quizHistory, setQuizHistory] = useState<MainDataType.UserQuizHistory | null>(null);

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

	const hasAnsweredRef = useRef(false);
	const [correctCount, setCorrectCount] = useState(0);
	const [totalScore, setTotalScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [resultType, setResultType] = useState<'correct' | 'wrong' | 'timeout' | 'done'>('correct');

	const praiseMessages = [
		'정답이에요! 정말 똑똑하네요! 🎉\n이번 퀴즈를 정확히 짚어냈어요!',
		'대단해요! 완벽한 정답이에요! 🏆\n계속 이렇게만 간다면 금방 수도 마스터가 되겠어요!',
		'굿잡! 멋져요! 💯\n지금까지의 학습이 빛을 발하고 있네요!',
		'똑소리 나는 정답이에요! 🤓✨\n집중력이 정말 뛰어나네요!',
		'정답을 쏙쏙 맞히네요! 🌟\n공부한 보람이 느껴지죠?\n계속 도전해봐요!',
		'👏 대단해요!\n이 속도라면 전 세계 수도를 금방 외울 수 있을 것 같아요!',
		'정말 똑똑하군요! 📚\n퀴즈를 척척 풀어가는 모습이 인상적이에요!',
		'정확히 알고 있네요! 🗺️\n세계 여행가 수준이에요!\n계속해서 실력을 보여주세요!',
	];

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
			loadQuestion();
		}
	}, [showStartModal]);

	useEffect(() => {
		const all = ProverbServices.selectProverbList();
		setProverbs(all);
	}, []);

	const solvedCount = quizHistory
		? new Set([...(quizHistory.correctProverbId ?? []), ...(quizHistory.wrongProverbId ?? [])]).size
		: 0;
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
			Alert.alert('문제 없음', '선택한 난이도와 카테고리에 해당하는 문제가 없습니다.', [
				{ text: '확인', onPress: () => setShowStartModal(true) },
			]);
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
			displayText = newQuestion.meaning;
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

		let correctAnswer = '';
		if (mode === 'meaning') correctAnswer = question.meaning;
		else if (mode === 'proverb') correctAnswer = question.proverb;
		else if (mode === 'fill-blank') correctAnswer = blankWord;

		const isTimeout = answer === '';
		const correct = answer === correctAnswer;

		setSelected(answer);
		setIsCorrect(correct);
		setResultType(isTimeout ? 'timeout' : correct ? 'correct' : 'wrong');

		if (correct) {
			setCorrectCount((prev) => prev + 1);
			setTotalScore((prev) => prev + 10);
			setCombo((prev) => prev + 1);
		} else {
			setCombo(0);
		}

		// ✅ 🔽 여기에 퀴즈 기록 업데이트 추가
		if (quizHistory && question) {
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

			setQuizHistory(updated);
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		}

		// ✅ 나머지 모달 처리 등은 그대로 유지
		if (isFocused) {
			const title = isTimeout ? '⏰ 시간 초과!' : correct ? '🎉 정답입니다!' : '😢 오답입니다';
			const message = isTimeout
				? `시간 초과로 오답 처리됐어요!\n정답은 '${correctAnswer}'입니다.`
				: correct
					? praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
					: `앗, 다음엔 맞힐 수 있어요!\n정답은 '${correctAnswer}'입니다.`;

			setResultTitle(title);
			setResultMessage(message);
			setTimeout(() => {
				setShowResultModal(true);
			}, 50);
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

	const handleNext = () => {
		setShowResultModal(false);
		loadQuestion();
	};

	const handleExit = () => {
		if (timerRef.current) clearInterval(timerRef.current);
		navigation.goBack();
	};

	const safelyGoBack = () => {
		navigation.goBack(); // 그래도 예외적으로 강제로
	};

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={styles.container}>
					{/* ✅ 항상 보이는 상단 진행 정보 */}
					<View style={styles.fixedTopBar}>
						<View style={styles.progressStatusWrapper}>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
									<Text style={styles.statusCardValue}>{totalScore}점</Text>
								</View>
								<View style={styles.statusCard}>
									<Text style={[styles.statusCardTitle, { color: '#e67e22' }]}>🔥 콤보</Text>
									<Text style={styles.statusCardValue}>{combo} Combo</Text>
								</View>
							</View>
						</View>
					</View>
					<ScrollView contentContainerStyle={styles.quizScrollContainer}>
						<View style={styles.quizBox}>
							<AnimatedCircularProgress
								size={80}
								width={6}
								fill={(20 - remainingTime) * 5}
								tintColor='#3498db'
								backgroundColor='#ecf0f1'>
								{() => <Text style={styles.timerText}>{remainingTime}s</Text>}
							</AnimatedCircularProgress>

							<Text style={styles.questionText}>
								{mode === 'fill-blank'
									? questionText || '문제 준비중...'
									: mode === 'meaning'
										? question?.proverb
										: question?.meaning || '문제 준비중...'}
							</Text>

							<View style={styles.optionsContainer}>
								{options.map((option, index) => {
									const labels = ['A.', 'B.', 'C.', 'D.'];
									return (
										<TouchableOpacity
											key={index}
											style={[styles.optionButton, selected === option && (isCorrect ? styles.correct : styles.wrong)]}
											onPress={() => handleSelect(option)}
											disabled={!!selected}>
											<Text style={styles.optionText}>
												{labels[index]} {option}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
					</ScrollView>

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

					{showResultModal && !showStartModal && !showExitModal && (
						<Modal visible={showResultModal} transparent animationType='fade'>
							<View style={styles.modalOverlay}>
								<View
									style={[
										styles.resultModal,
										resultType === 'correct' && { backgroundColor: '#f0fdf4', borderColor: '#2ecc71', borderWidth: 1 },
										resultType === 'wrong' && { backgroundColor: '#fff1f2', borderColor: '#e74c3c', borderWidth: 1 },
										resultType === 'timeout' && { backgroundColor: '#fffaf0', borderColor: '#f39c12', borderWidth: 1 },
									]}>
									<Text
										style={[
											styles.resultTitle,
											resultType === 'correct' && { color: '#2ecc71' },
											resultType === 'wrong' && { color: '#e74c3c' },
											resultType === 'timeout' && { color: '#f39c12' },
											resultType === 'done' && { color: '#2c3e50' },
										]}>
										{resultTitle}
									</Text>
									<FastImage
										source={
											resultType === 'correct'
												? require('@/assets/images/correct_mascote.png')
												: resultType === 'wrong' || resultType === 'timeout'
													? require('@/assets/images/wrong_mascote.png')
													: resultType === 'done'
														? require('@/assets/images/mascote_done.png') // 🎯 새로운 이미지 경로
														: require('@/assets/images/correct_mascote.png') // fallback
										}
										style={styles.resultMascot}
										resizeMode={FastImage.resizeMode.contain}
									/>

									<View style={styles.resultMessageContainer}>
										<Text style={styles.resultMessage}>{resultType === 'correct' ? resultMessage : null}</Text>

										<View style={{ marginTop: 8, alignItems: 'center' }}>
											{/* 🎯 정답일 때만 메시지와 함께 속담/의미 출력 */}
											{resultType === 'correct' && (
												<>
													<Text style={styles.resultSubText}>
														속담: <Text style={styles.proverbText}>{question?.proverb ?? '속담'}</Text>
													</Text>
													<Text style={styles.resultSubText}>
														의미: <Text style={styles.meaningText}>{question?.meaning ?? '알 수 없음'}</Text>
													</Text>
												</>
											)}

											{/* ❌ 오답 또는 타임아웃일 때는 속담과 의미만 출력 (정답 문구 제거) */}
											{(resultType === 'wrong' || resultType === 'timeout') && (
												<>
													<Text style={styles.resultSubText}>
														속담: <Text style={styles.proverbText}>{question?.proverb ?? '속담'}</Text>
													</Text>
													<Text style={styles.resultSubText}>
														의미: <Text style={styles.meaningText}>{question?.meaning ?? '알 수 없음'}</Text>
													</Text>
												</>
											)}
										</View>
									</View>

									<TouchableOpacity
										style={styles.modalConfirmButton}
										onPress={() => {
											// 👉 모달만 닫고 화면 상태는 유지
											setShowResultModal(false);

											// ✅ 질문 제거는 모달 닫히고 나서 조금 딜레이
											setTimeout(() => {
												if (resultType === 'done') {
													safelyGoBack();
												} else {
													loadQuestion(); // ✅ 새 퀴즈 로드
												}
											}, 400); // 모달 애니메이션 시간보다 길게 (기본 300~400ms)
										}}>
										<Text style={styles.modalConfirmText}>{resultType === 'done' ? '뒤로 가기' : '다음 퀴즈'}</Text>
									</TouchableOpacity>
								</View>
							</View>
						</Modal>
					)}

					{confettiKey > 0 && (
						<ConfettiCannon key={confettiKey} count={100} origin={{ x: screenWidth / 2, y: 0 }} fadeOut autoStart />
					)}
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
};

export default ProverbCommonFrameScreen;

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
	quizBox: { width: '100%', maxWidth: 500, alignItems: 'center' },
	timerText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 8 },
	questionText: { fontSize: 20, fontWeight: 'bold', marginVertical: 20, textAlign: 'center', color: '#2c3e50' },
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
		elevation: 4,
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
		elevation: 2,
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
		elevation: 5,
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
		elevation: 5,
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
		marginBottom: 20,
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
		elevation: 3,
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
		width: '100%',
		maxWidth: 500,
		backgroundColor: '#fff',
		padding: 16,
		marginBottom: 12,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#ddd',
		elevation: 3, // 안드로이드용 그림자
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
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	quizScrollContainer: {
		paddingBottom: 80,
	},
});
