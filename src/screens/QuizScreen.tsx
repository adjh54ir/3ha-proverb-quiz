/* eslint-disable jsx-quotes */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable curly */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Keyboard, Dimensions, Platform, Animated, ScrollView, FlatList } from 'react-native';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QuizResultModal from './modal/QuizResultModal';
import { QuizBadgeInterceptor } from '@/services/interceptor/QuizBadgeInterceptor';
import { CONST_BADGES } from '@/const/ConstBadges';
import IconComponent from './common/atomic/IconComponent';
import { Paths } from '@/navigation/conf/Paths';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import StartModal from './modal/QuizStartModal';
import NewBadgeModal from './modal/NewBadgeModal';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import QuizHintModal from './modal/QuizHintModal';
import { toggleFavorite } from '@/utils/favoriteUtils';

const labelColors = ['#1abc9c', '#3498db', '#9b59b6', '#e67e22'];

const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;

type QuizRouteParams = {
	mode: 'meaning' | 'proverb' | 'blank';
	questionPool?: MainDataType.Proverb[];
	isWrongReview?: boolean;
	title?: string;
	selectedLevel: string;
	levelKey: string;
	selectedCategory?: string;
};

type QuizRoute = RouteProp<{ QUIZ: QuizRouteParams }, 'QUIZ'>;

const QuizScreen = () => {
	const route = useRoute<QuizRoute>();
	const { width: screenWidth } = Dimensions.get('window');
	const flatListRef = useRef<FlatList<string>>(null);
	const [showAdForHint, setShowAdForHint] = useState(false);

	// 1️⃣ 기존 selectedLevel, selectedCategory 초기값 수정
	const { mode: routeMode, questionPool, isWrongReview = false, title, selectedLevel: routeLevel, selectedCategory: routeCategory } = route.params;

	const isFocused = useIsFocused();
	const navigation = useNavigation();

	const comboAnim = useRef(new Animated.Value(0)).current;
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const scaleAnims = useRef<Animated.Value[]>([]);
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const comboEffectAnim = useRef(new Animated.Value(0)).current;
	const comboShake = useRef(new Animated.Value(0)).current;

	const [isAnswerLocked, setIsAnswerLocked] = useState(false);
	const [quizHistory, setQuizHistory] = useState<MainDataType.UserQuizHistory | null>(null);

	const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<MainDataType.UserBadge[]>([]);
	const [showStartModal, setShowStartModal] = useState(true); // 시작 모달 상태

	const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
	const [question, setQuestion] = useState<MainDataType.Proverb | null>(null);
	const [options, setOptions] = useState<string[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [remainingTime, setRemainingTime] = useState(40);
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
	const [showExitModal, setShowExitModal] = useState<boolean>(false);
	const [badgeModalVisible, setBadgeModalVisible] = useState(false);
	const [showHintModal, setShowHintModal] = useState(false);
	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

	const hasAnsweredRef = useRef(false);
	const [totalScore, setTotalScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [resultType, setResultType] = useState<'correct' | 'wrong' | 'timeout' | 'done'>('correct');

	const scoreBonusAnim = useRef(new Animated.Value(0)).current;
	const [showScoreBonus, setShowScoreBonus] = useState(false);
	const [comboEffectText, setComboEffectText] = useState('');

	const [reviewIndex, setReviewIndex] = useState(0);

	const praiseMessages = [
		'정답이에요! 정말 똑똑하네요! 🎉\n이번 퀴즈를 정확히 짚어냈어요!',
		'대단해요! 완벽한 정답이에요! 🏆\n계속 이렇게만 간다면 금방 속담 마스터가 되겠어요!',
		'굿잡! 멋져요! 💯\n지금까지의 학습이 빛을 발하고 있네요!',
		'똑소리 나는 정답이에요! 🤓✨\n집중력이 정말 뛰어나네요!',
		'정답을 쏙쏙 맞히네요! 🌟\n공부한 보람이 느껴지죠?\n계속 도전해봐요!',
		'👏 대단해요!\n이 속도라면 모든 속담을 금방 외울 수 있을 것 같아요!',
		'정말 똑똑하군요! 📚\n퀴즈를 척척 풀어가는 모습이 인상적이에요!',
	];
	useBlockBackHandler(true); // 뒤로가기 모션 막기

	// ✅ 기존 selectedLevel/selectedCategory 의존 useEffect 삭제하고, 아래로 교체
	useEffect(() => {
		if (!quizHistory) return;
		if (showStartModal) return; // ✅ 시작 모달이 열려있으면 문제 로드 금지
		if (filteredProverbs.length === 0) return;
		if (isAnswerLocked) return;

		if (questionPool && questionPool.length > 0) {
			setProverbs(questionPool);
			loadQuestion();
		} else {
			const all = ProverbServices.selectProverbList();
			const filtered = all.filter((p) => {
				const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
				const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
				return levelMatch && categoryMatch;
			});
			setProverbs(filtered);
			if (filtered.length > 0) loadQuestion();
		}
	}, [quizHistory, selectedLevel]); // ✅ showStartModal 의존성 추가

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
	// 타이머 제어 useEffect 추가
	useEffect(() => {
		if (showHintModal) {
			// 힌트 모달이 열리면 타이머 멈춤
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		} else {
			// 힌트 모달이 닫힐 때 다시 타이머 시작
			if (question && !selected) {
				startTimer();
			}
		}
	}, [showHintModal]);
	useEffect(() => {
		if (quizHistory) setTotalScore(quizHistory.totalScore);
	}, [quizHistory]);

	// 3️⃣ 퀴즈 데이터 로드 useEffect 수정
	useEffect(() => {
		if (questionPool && questionPool.length > 0) {
			setProverbs(questionPool); // 오답 복습용
			loadQuestion();
		} else {
			const all = ProverbServices.selectProverbList();
			const filtered = all.filter((p) => {
				const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
				const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
				return levelMatch && categoryMatch;
			});
			setProverbs(filtered);
			if (filtered.length > 0) loadQuestion();
		}
	}, [selectedLevel, selectedCategory]);

	useEffect(() => {
		if (showExitModal && timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, [showExitModal]);

	// 퀴즈 시작 전 데이터 불러오기
	useEffect(() => {
		const levels = ProverbServices.selectLevelNameList();
		const categories = ProverbServices.selectCategoryList();
		setLevelOptions(['전체', ...levels]);
		setCategoryOptions(['전체', ...categories]);
	}, []);

	useEffect(() => {
		if (options.length) {
			scaleAnims.current = options.map(() => new Animated.Value(1));
		}
	}, [options]);

	useEffect(() => {
		if (isWrongReview && questionPool) {
			loadQuestion();
		}
	}, [reviewIndex]);

	useEffect(() => {
		if (combo > 0) {
			triggerComboAnimation();
		}
	}, [combo]);

	useEffect(() => {
		if (badgeModalVisible) {
			scaleAnim.setValue(0.8);
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
			}).start();
		}
	}, [badgeModalVisible]);

	const filteredProverbs = useMemo(() => {
		return proverbs.filter((p) => {
			const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
			const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
			return levelMatch && categoryMatch;
		});
	}, [proverbs, selectedLevel, selectedCategory]);

	const remainingProverbs = useMemo(() => {
		const solvedSet = new Set([...(quizHistory?.correctProverbId ?? []), ...(quizHistory?.wrongProverbId ?? [])]);
		if (question) solvedSet.add(question.id);
		return filteredProverbs.filter((p) => !solvedSet.has(p.id));
	}, [filteredProverbs, quizHistory, question]);

	/**
	 * 문제 1: 오답 복습 모드에서 모두 다 풀었다고 나오는 문제 해결 버전
	 * - 일반 모드: 기존 로직 유지 (이미 푼 문제 제외하고 랜덤 출제)
	 * - 오답 복습 모드: reviewIndex 기반 순차 출제
	 */
	const loadQuestion = (pool?: MainDataType.Proverb[]) => {
		if (!quizHistory) return;

		setSelected(null);
		setIsCorrect(null);
		setIsAnswerLocked(false);
		setOptions([]);
		setQuestionText('');
		setBlankWord('');
		setQuestion(null);

		if (isWrongReview && questionPool && questionPool.length > 0) {
			if (reviewIndex >= questionPool.length) {
				setResultType('done');
				setResultTitle('오답 복습 완료!');
				setResultMessage('모든 오답을 다시 풀었어요 🎉');
				setShowResultModal(true);
				return;
			}
			setupQuestion(questionPool[reviewIndex]);
			return;
		}

		// ✅ pool 파라미터 우선 사용 (stale closure 방지)
		const source = pool ?? filteredProverbs;
		if (!source || source.length === 0) return;

		const solvedSet = new Set([...(quizHistory.correctProverbId ?? []), ...(quizHistory.wrongProverbId ?? [])]);
		if (question) solvedSet.add(question.id);

		const unSolved = source.filter((p) => !solvedSet.has(p.id));

		if (unSolved.length === 0) {
			setResultType('done');
			setResultTitle('모든 퀴즈 완료!');
			setResultMessage('훌륭해요! 모든 문제를 마쳤어요 🎉');
			setShowResultModal(true);
			return;
		}

		setupQuestion(unSolved[Math.floor(Math.random() * unSolved.length)]);
	};
	/**
	 * 문제 2: 문제 세팅 로직을 별도로 분리하여 재사용 가능하게
	 */
	const setupQuestion = (newQuestion: MainDataType.Proverb) => {
		const distractors = filteredProverbs.filter((p) => p.id !== newQuestion.id);
		const shuffledDistractors = [...distractors].sort(() => Math.random() - 0.5).slice(0, 3);

		let allOptions: string[] = [];
		let displayText = '';

		if (routeMode === 'meaning') {
			allOptions = [...shuffledDistractors.map((p) => p.longMeaning!), newQuestion.longMeaning!];
			displayText = newQuestion.proverb;
		} else if (routeMode === 'proverb') {
			allOptions = [...shuffledDistractors.map((p) => p.proverb), newQuestion.proverb];
			displayText = newQuestion.longMeaning!;
		} else if (routeMode === 'blank') {
			const blank = pickBlankWord(newQuestion.proverb);
			allOptions = [...shuffledDistractors.map((p) => pickBlankWord(p.proverb)), blank];
			displayText = newQuestion.proverb.replace(blank, '(____)');
			setBlankWord(blank);
		}

		// 상태 갱신
		setQuestion(newQuestion);
		setOptions(allOptions.sort(() => Math.random() - 0.5));
		setQuestionText(displayText);
		setSelected(null);
		setIsCorrect(null);
		setRemainingTime(40);

		// 타이머 새로 시작
		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					clearInterval(timerRef.current!);
					handleSelect('');
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const startTimer = () => {
		if (!question || hasAnsweredRef.current || timerRef.current) return; // ✅ 이미 타이머 돌고 있으면 막기

		timerRef.current = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					clearInterval(timerRef.current!);
					timerRef.current = null;
					if (isFocused && question) handleSelect('');
					return 0;
				}
				return prev - 1;
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
		setIsAnswerLocked(true); // 🔒 잠금: 아이콘 유지용

		let acquiredBadges: string[] = [];

		let correctAnswer = '';
		if (routeMode === 'meaning') correctAnswer = question.longMeaning!;
		else if (routeMode === 'proverb') correctAnswer = question.proverb;
		else if (routeMode === 'blank') correctAnswer = blankWord;

		const isTimeout = answer === '';
		const correct = answer === correctAnswer;

		setSelected(answer);
		setIsCorrect(correct);
		setResultType(isTimeout ? 'timeout' : correct ? 'correct' : 'wrong');

		const newCombo = correct ? combo + 1 : 0;

		// 점수 보너스 애니메이션
		if (correct) {
			const newComboValue = combo + 1;
			setShowScoreBonus(true);
			scoreBonusAnim.setValue(0);
			setCombo(newCombo); // 콤보 업데이트
			triggerComboAnimation(); // 콤보 애니메이션 즉시 실행
			if (newComboValue >= 2) {
				triggerComboAnim();
				triggerComboShake();
				triggerComboEffect(newComboValue); // ✅ 항상 실행
			}
			Animated.timing(scoreBonusAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}).start(() => {
				setShowScoreBonus(false);
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

			// 오답 복습 모드일 경우 오답 → 정답 처리 먼저 실행
			if (correct && isWrongReview && updated.wrongProverbId.includes(id)) {
				updated.wrongProverbId = updated.wrongProverbId.filter((wrongId) => wrongId !== id);
				if (!updated.correctProverbId.includes(id)) {
					updated.correctProverbId.push(id);
				}
			}

			// 정답/오답 처리
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
			setTotalScore(finalUpdated.totalScore); // ← 총점 상태 갱신 추가

			if (acquiredBadges.length > 0) {
				const earnedBadgeObjects = CONST_BADGES.filter((b) => acquiredBadges.includes(b.id));
				setNewlyEarnedBadges(earnedBadgeObjects); // ✨ 뱃지 정보 세팅
				setBadgeModalVisible(true); // ✨ 모달 표시
				setConfettiKey(Math.random()); // 🎉 축포 터뜨리기
				return; // 정답/오답 모달 생략
			}
		}

		// ✅ 뱃지가 없을 경우에만 결과 모달 출력
		const title = isTimeout ? '⏰ 시간 초과!' : correct ? '🎉 정답입니다!' : '😢 오답입니다';
		const message = isTimeout
			? '시간 초과로 오답 처리됐어요!'
			: correct
				? praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
				: '앗, 다음엔 맞힐 수 있어요!';

		setTimeout(() => {
			setResultTitle(title);
			setResultMessage(message);
			setShowResultModal(true);
			setIsAnswerLocked(false); // 🔓 다시 풀기 (다음 문제로 넘어갈 때)
		}, 600); // 약간
	};
	const getLevelColor = (level: number) => {
		const levelColorMap: Record<string, string> = {
			1: '#dfe6e9',
			2: '#74b9ff',
			3: '#0984e3',
			4: '#2d3436',
		};

		return levelColorMap[level] || '#b2bec3'; // 기본 회색
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
			setComboEffectText(`🔥 ${comboValue} Combo!`);
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

	const pickBlankWord = (text: string) => {
		const words = text.split(' ').filter((w) => w.length > 1);
		const randomWord = words[Math.floor(Math.random() * words.length)];
		return randomWord;
	};
	const getSolvedCount = () => {
		if (isWrongReview && questionPool) {
			return reviewIndex; // ✅ 오답 복습 모드는 index 기반
		}

		if (!quizHistory) return 0;

		const solvedSet = new Set([...(quizHistory.correctProverbId ?? []), ...(quizHistory.wrongProverbId ?? [])]);

		const filteredProverbs = proverbs.filter((p) => {
			const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
			const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
			return levelMatch && categoryMatch;
		});

		const filteredSolved = filteredProverbs.filter((p) => solvedSet.has(p.id));
		return filteredSolved.length;
	};
	const totalCount =
		isWrongReview && questionPool
			? questionPool.length // ✅ 오답 복습 모드일 땐 고정
			: proverbs.filter((p) => {
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
	const triggerComboAnim = () => {
		comboAnim.setValue(1.4);
		Animated.spring(comboAnim, {
			toValue: 1,
			friction: 4,
			useNativeDriver: true,
		}).start();
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
		// @ts-ignore
		navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
		// navigation.goBack(); // 그래도 예외적으로 강제로
	};

	const handleNextQuestion = () => {
		const isFinal = resultType === 'done';

		// ✅ 상태 먼저 완전히 초기화
		setSelected(null);
		setIsCorrect(null);
		setIsAnswerLocked(false);
		setOptions([]);
		setQuestionText('');
		setBlankWord('');
		setQuestion(null);

		// ✅ 스크롤 최상단 이동
		if (flatListRef.current) {
			flatListRef.current.scrollToOffset({ offset: 0, animated: false });
		}

		// ✅ 100ms 정도 딜레이 후 다음 문제 로드
		setTimeout(() => {
			if (isFinal) {
				safelyGoBack();
			} else {
				if (isWrongReview) {
					setReviewIndex((prev) => prev + 1);
				} else {
					loadQuestion();
				}
			}
		}, 100); // 🔸 딜레이로 이전 상태가 반영된 뒤 새로운 문제 로드
	};

	const getModeLabel = (mode: 'meaning' | 'proverb' | 'blank') => {
		switch (mode) {
			case 'meaning':
				return '뜻 맞추기';
			case 'proverb':
				return '속담 맞추기';
			case 'blank':
				return '빈칸 채우기';
			default:
				return '';
		}
	};
	const onStart = (skipLoad?: boolean) => {
		const filtered = ProverbServices.selectProverbList().filter((p) => {
			const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
			const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
			return levelMatch && categoryMatch;
		});
		setProverbs(filtered);

		if (!skipLoad && filtered.length > 0) {
			loadQuestion(filtered); // ✅ filtered 직접 전달
		}
	};

	const getLevelLabel = (level: number) => {
		switch (level) {
			case 1:
				return '아주 쉬움';
			case 2:
				return '쉬움';
			case 3:
				return '보통';
			case 4:
				return '어려움';
			default:
				return '알수없음';
		}
	};

	const getFieldColor = (field: string) => {
		const categoryColorMap: Record<string, string> = {
			'운/우연': '#00cec9', // 청록
			인간관계: '#6c5ce7', // 보라
			'세상 이치': '#fdcb6e', // 연노랑
			'근면/검소': '#e17055', // 주황
			'노력/성공': '#00b894', // 짙은 청록
			'경계/조심': '#d63031', // 빨강
			'욕심/탐욕': '#e84393', // 핫핑크
			'배신/불신': '#2d3436', // 짙은 회색
		};

		return categoryColorMap[field] || '#b2bec3'; // 기본 회색
	};

	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type='FontAwesome6' name='seedling' size={14} color='#fff' />;
			case 2:
				return <IconComponent type='FontAwesome6' name='leaf' size={14} color='#fff' />;
			case 3:
				return <IconComponent type='FontAwesome6' name='tree' size={14} color='#fff' />;
			case 4:
				return <IconComponent type='FontAwesome6' name='trophy' size={14} color='#fff' />;
			default:
				return null;
		}
	};

	const getFieldIcon = (field: string) => {
		switch (field) {
			case '운/우연':
				return <IconComponent type='FontAwesome6' name='dice' size={12} color='#fff' />;
			case '인간관계':
				return <IconComponent type='FontAwesome6' name='users' size={12} color='#fff' />;
			case '세상 이치':
				return <IconComponent type='fontawesome5' name='globe' size={12} color='#fff' />;
			case '근면/검소':
				return <IconComponent type='fontawesome5' name='hammer' size={12} color='#fff' />;
			case '노력/성공':
				return <IconComponent type='fontawesome5' name='medal' size={12} color='#fff' />;
			case '경계/조심':
				return <IconComponent type='fontawesome5' name='exclamation-triangle' size={12} color='#fff' />;
			case '욕심/탐욕':
				return <IconComponent type='fontawesome5' name='hand-holding-usd' size={12} color='#fff' />;
			case '배신/불신':
				return <IconComponent type='fontawesome5' name='user-slash' size={12} color='#fff' />;
			default:
				return <IconComponent type='FontAwesome6' name='tag' size={12} color='#fff' />;
		}
	};

	const progressPercent = totalCount > 0 ? (getSolvedCount() / totalCount) * 100 : 0;

	// ====================================================
	// 1. favoriteIds 상태 로드 함수 추가 (throw 제거)
	// ====================================================

	// 기존의 throw Error 함수들 완전 제거 후 아래로 교체

	const loadFavorites = async () => {
		try {
			const stored = await AsyncStorage.getItem(MainStorageKeyType.FAVORITES_STORAGE_KEY);
			if (stored) {
				// ✅ FavoriteItem[] 파싱 후 id만 추출
				const favorites: { id: number; addedAt: number }[] = JSON.parse(stored);
				setFavoriteIds(favorites.map((item) => item.id));
			} else {
				setFavoriteIds([]);
			}
		} catch (e) {
			console.error('즐겨찾기 로드 실패', e);
		}
	};

	// 앱 진입 시 즐겨찾기 로드
	useEffect(() => {
		loadFavorites();
	}, []);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
			<View style={{ flex: 1 }}>
				<View style={{ flex: 1 }}>
					<View style={styles.container}>
						<View style={styles.inner}>
							<View style={styles.progressStatusWrapper}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={styles.progressText}>{getModeLabel(routeMode)}</Text>
									{question?.level && (
										<View style={{ flexDirection: 'row', alignItems: 'center' }}>
											{/* 레벨 표시 */}
											<View style={[styles.badgePill, { backgroundColor: getLevelColor(question.level) }]}>
												{getLevelIcon(question.level)}
												<Text style={styles.badgeText}>{getLevelLabel(question.level)}</Text>
											</View>

											{/* 카테고리 표시 */}
											{question?.category && (
												<View style={[styles.badgePill, { backgroundColor: getFieldColor(question.category) }]}>
													{getFieldIcon(question.category)}
													<Text style={styles.badgeText}> {question.category}</Text>
												</View>
											)}
										</View>
									)}
								</View>

								<View style={styles.progressBarWrapper}>
									<View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
								</View>

								<View style={styles.statusCardRow}>
									<View style={styles.statusCard}>
										<Text style={styles.statusCardTitle}>📝 문제</Text>
										<Text style={[styles.statusCardValue]}>
											<Text style={{ color: '#3498db' }}>{getSolvedCount()}</Text>
											{' / '}
											{totalCount}
										</Text>
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
												opacity: comboAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [1, 1],
												}),
											}}>
											<Text
												style={[
													styles.statusCardValue,
													styles.comboValue,
													{ color: combo > 0 ? '#e74c3c' : '#2c3e50' }, // 🔥 조건부 색상 적용
												]}>
												🔥 {combo} Combo
											</Text>
										</Animated.View>
									</View>
								</View>
							</View>
							{question && (
								<View style={{ position: 'absolute', width: '100%', alignItems: 'flex-end', marginTop: scaleHeight(6) }}>
									<TouchableOpacity onPress={() => setShowAdForHint(true)}>
										<View
											style={{
												backgroundColor: '#fef3c7',
												padding: scaleWidth(8),
												borderRadius: scaleWidth(20),
												flexDirection: 'row',
												alignItems: 'center',
											}}>
											<IconComponent type='MaterialIcons' name='lightbulb' size={18} color='#f39c12' />
											<Text style={{ marginLeft: scaleWidth(6), fontWeight: '600', color: '#f39c12' }}>힌트</Text>
										</View>
									</TouchableOpacity>
								</View>
							)}

							<View style={styles.quizBox}>
								<AnimatedCircularProgress
									size={scaleWidth(70)}
									width={scaleWidth(6)} // ✅ 기존 8 → 6
									fill={((40 - remainingTime) / 40) * 100} // ✅ 수정된 부분
									duration={500}
									tintColor='#3498db'
									backgroundColor='#ecf0f1'>
									{() => (
										<View style={styles.timerInner}>
											<Text style={styles.timerText}>{remainingTime}s</Text>
										</View>
									)}
								</AnimatedCircularProgress>

								{question ? (
									<Text style={styles.questionText}>
										{`Q. ${
											routeMode === 'blank'
												? questionText || '문제 준비중...'
												: routeMode === 'meaning'
													? question?.proverb
													: question?.longMeaning || '문제 준비중...'
										}`}
									</Text>
								) : (
									<Text>문제 불러오는 중...</Text>
								)}

								<View style={[styles.optionsContainer, { flex: 1, width: '100%', marginTop: scaleHeight(5) }]}>
									<FlatList
										key={question?.id} // ✅ 질문이 바뀔 때마다 강제 리렌더
										ref={flatListRef}
										data={options}
										scrollEnabled={true} // ✅ 항상 스크롤 가능
										keyExtractor={(item, index) => `${item}-${index}`}
										contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
										showsVerticalScrollIndicator
										renderItem={({ item, index }) => {
											const scaleAnim = scaleAnims.current[index] ?? new Animated.Value(1);
											const isSelected = selected === item;
											const correctAnswer = routeMode === 'meaning' ? question?.longMeaning : routeMode === 'proverb' ? question?.proverb : blankWord;

											const isCorrectAnswer = correctAnswer === item; // 실제 정답
											const isSelectedWrong = isSelected && !isCorrectAnswer; // 내가 고른 오답

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
												<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
													<TouchableOpacity
														onPressIn={handlePressIn}
														onPressOut={handlePressOut}
														style={[
															styles.optionCard,
															isSelected && styles.optionSelectedCard, // ✅ 내가 선택한 보기 (파란색 배경)
															selected && isSelectedWrong && styles.optionWrongCard, // ❌ 오답이면 빨강 배경
														]}
														onPress={() => handleSelect(item)}
														disabled={isAnswerLocked}>
														<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
															<Text style={[styles.optionLabel, { color: labelColors[index], marginRight: scaleWidth(6) }]}>{['A.', 'B.', 'C.', 'D.'][index]}</Text>

															<View style={{ flex: 1 }}>
																<Text style={styles.optionContent}>{item}</Text>
															</View>

															{/* ✅ 선택 이후에만 아이콘 표시 */}
															{selected && (
																<>
																	{/* 정답이면 O 아이콘 (내가 안 눌러도 보임) */}
																	{isCorrectAnswer && <IconComponent type='MaterialIcons' name='check-circle' size={28} color='#2ecc71' />}

																	{/* 내가 고른 게 오답이면 X 아이콘 */}
																	{isSelectedWrong && <IconComponent type='MaterialIcons' name='cancel' size={28} color='#e74c3c' />}
																</>
															)}
														</View>
													</TouchableOpacity>
												</Animated.View>
											);
										}}
									/>
								</View>
							</View>
						</View>
						<View style={styles.bottomExitWrapper}>
							<TouchableOpacity style={styles.exitButton} onPress={() => setShowExitModal(true)}>
								<Text style={styles.exitButtonText}>퀴즈 종료</Text>
							</TouchableOpacity>
						</View>

						{comboEffectText !== '' && (
							<Animated.View
								pointerEvents='none'
								style={{
									position: 'absolute',
									top: '40%', // 필요 시 위치 조정 가능
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
												outputRange: [0, -30],
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

						{confettiKey > 0 && <ConfettiCannon key={confettiKey} count={100} origin={{ x: screenWidth / 2, y: 0 }} fadeOut autoStart />}
					</View>
				</View>
			</View>
			{/* 뱃지 모달 */}
			<NewBadgeModal
				visible={badgeModalVisible}
				badges={newlyEarnedBadges}
				onConfirm={() => {
					setBadgeModalVisible(false);
					setNewlyEarnedBadges([]);

					// 결과 모달 표시 (정답/오답/타임아웃)
					const isTimeout = selected === '';
					const correct = isCorrect === true;
					const titleText = isTimeout ? '⏰ 시간 초과!' : correct ? '🎉 정답입니다!' : '😢 오답입니다';
					const message = isTimeout
						? '시간 초과로 오답 처리됐어요!'
						: correct
							? praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
							: '앗, 다음엔 맞힐 수 있어요!';

					setTimeout(() => {
						setResultTitle(titleText);
						setResultMessage(message);
						setShowResultModal(true);
						setIsAnswerLocked(false);
					}, 300);
				}}
			/>
			<StartModal
				visible={showStartModal}
				onStart={() => {
					setShowStartModal(false);
					setTimeout(() => onStart(), 100); // ✅ onStart 호출 추가
				}}
				onBack={() => safelyGoBack()}
			/>
			<QuizHintModal visible={showHintModal} question={question} onClose={() => setShowHintModal(false)} />
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
									safelyGoBack();
								}}>
								<Text style={styles.modalButtonText}>종료하기</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			<QuizResultModal
				visible={showResultModal && !badgeModalVisible}
				resultType={resultType}
				resultTitle={resultTitle}
				quizMode={routeMode}
				resultMessage={resultMessage}
				question={question}
				favoriteIds={favoriteIds} // ✅ 추가
				onToggleFavorite={async () => {
					if (question?.id) {
						await toggleFavorite(question.id);
						await loadFavorites(); // ← 정상 함수로 교체됨
					}
				}}
				onNext={() => {
					setShowResultModal(false);
					if (badgeModalVisible) return;
					if (resultType === 'done') {
						setTimeout(() => {
							//@ts-ignore
							navigation.navigate(Paths.MAIN_TAB, { screen: Paths.SETTING });
						}, 300);
					} else {
						handleNextQuestion();
					}
				}}
			/>
			{showAdForHint && (
				<AdmobFrontAd
					onAdClosed={() => {
						setShowAdForHint(false);
						setShowHintModal(true);
					}}
				/>
			)}
		</SafeAreaView>
	);
};

export default QuizScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	inner: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(10),
		paddingTop: scaleHeight(8),
	},
	quizBox: {
		flex: 1,
		width: '100%',
		paddingHorizontal: scaleWidth(12),
		alignItems: 'center',
	},
	timerText: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
	},
	questionText: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginTop: scaleHeight(6),
		marginBottom: scaleHeight(12),
		textAlign: 'center',
		color: '#3498db',
		lineHeight: scaleHeight(28),
	},
	optionsContainer: { width: '100%' },
	optionButton: {
		backgroundColor: '#ecf0f1',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(12),
	},
	optionText: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#34495e',
	},
	correct: { backgroundColor: '#2ecc71' },
	wrong: { backgroundColor: '#e74c3c' },
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	resultModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		width: '80%',
	},
	resultTitle: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(6),
	},
	resultMessage: {
		fontSize: scaledSize(16),
		color: '#34495e',
		marginBottom: 0,
		textAlign: 'center',
	},
	modalButton: {
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(40),
		borderRadius: scaleWidth(30),
		marginTop: scaleHeight(20),
	},
	modalButtonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
	bottomExitWrapper: {
		width: '100%',
		paddingVertical: scaleHeight(7),
		alignItems: 'center',
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	exitButton: {
		backgroundColor: '#7f8c8d',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(40),
		borderRadius: scaleWidth(30),
	},
	exitButtonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
	selectModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(24),
		paddingBottom: scaleHeight(24),
		paddingTop: scaleHeight(48),
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		width: '90%',
		position: 'relative',
	},
	selectTitle: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(8),
	},
	selectSub: {
		fontSize: scaledSize(16),
		color: '#34495e',
		marginBottom: scaleHeight(20),
		textAlign: 'center',
	},
	selectLabel: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: scaleHeight(8),
	},
	selectButton: {
		width: '48%',
		minHeight: scaleHeight(70),
		borderRadius: scaleWidth(12),
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.15,
		shadowRadius: scaleWidth(4),
	},
	selectRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginTop: scaleHeight(16),
	},
	backButton: {
		alignSelf: 'flex-start',
		marginBottom: scaleHeight(16),
	},
	backButtonInline: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: 0,
		borderRadius: scaleWidth(30),
		borderWidth: 2,
		borderColor: '#3498db',
	},
	backButtonText: {
		marginLeft: scaleWidth(8),
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#3498db',
	},
	selectSectionWrapper: {
		width: '100%',
	},
	closeButton: {
		position: 'absolute',
		top: scaleHeight(12),
		right: scaleWidth(12),
		zIndex: 10,
		padding: scaleWidth(4),
	},
	closeButtonText: {
		fontSize: scaledSize(22),
		color: '#7f8c8d',
		fontWeight: 'bold',
	},
	statusCardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: scaleHeight(3),
	},
	statusCard: {
		flex: 1,
		backgroundColor: '#ecf0f1',
		marginHorizontal: scaleWidth(2),
		paddingVertical: scaleHeight(12),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowOpacity: 0.1,
		shadowRadius: scaleWidth(2),
	},
	statusCardTitle: {
		fontSize: scaledSize(15),
		color: '#7f8c8d',
		fontWeight: 600,
		marginBottom: scaleHeight(4),
	},
	statusCardValue: {
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#2c3e50',
	},
	exitModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(20),
		width: '85%',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(4) },
		shadowOpacity: 0.2,
		shadowRadius: scaleWidth(6),
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
	badgeModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(20),
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
		padding: scaleHeight(12),
		borderRadius: scaleWidth(8),
		marginRight: scaleWidth(6),
		alignItems: 'center',
	},
	resultMascot: {
		width: scaleWidth(150),
		height: scaleWidth(150),
		marginVertical: scaleHeight(5),
	},
	correctHighlight: {
		color: '#27ae60',
		fontWeight: 'bold',
		fontSize: scaledSize(17),
	},
	resultMessageContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: scaleHeight(90),
	},
	replayText: {
		marginTop: scaleHeight(10),
		fontSize: scaledSize(13),
		textAlign: 'center',
		color: '#2980b9',
		fontWeight: '600',
		textDecorationLine: 'underline',
	},
	modalConfirmButton: {
		backgroundColor: '#2980b9',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(36),
		borderRadius: scaleWidth(30),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.2,
		shadowRadius: scaleWidth(4),
	},
	modalConfirmText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
	capitalHighlight: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#e74c3c',
	},

	proverbText: {
		fontWeight: '700',
		color: '#2c3e50',
		fontSize: scaledSize(16),
	},

	meaningText: {
		fontWeight: '700',
		color: '#2980b9',
		fontSize: scaledSize(16),
	},

	resultSubText: {
		fontSize: scaledSize(15),
		color: '#34495e',
		marginTop: scaleHeight(6),
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	progressStatusWrapper: {
		width: '100%',
		maxWidth: scaleWidth(500),
		backgroundColor: '#fff',
		padding: scaleWidth(16),
		marginBottom: scaleHeight(12),
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#ddd',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: scaleWidth(3),
	},
	progressText: {
		fontSize: scaledSize(17),
		color: '#2c3e50',
		fontWeight: '600',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},

	progressBarWrapper: {
		height: scaleHeight(10),
		width: '100%',
		backgroundColor: '#eee',
		borderRadius: scaleWidth(5),
		overflow: 'hidden',
		marginBottom: scaleHeight(16),
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: '#4a90e2',
		borderRadius: scaleWidth(5),
	},
	fixedTopBar: {
		width: '100%',
		backgroundColor: '#fff',
		zIndex: 10,
		paddingTop: Platform.OS === 'ios' ? scaleHeight(50) : scaleHeight(20),
		paddingBottom: scaleHeight(10),
		borderBottomWidth: scaleHeight(1),
		borderColor: '#eee',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(4),
	},
	quizScrollContainer: {
		paddingBottom: scaleHeight(80),
	},
	scoreBonusText: {
		position: 'absolute',
		top: scaleHeight(-10),
		fontSize: scaledSize(22),
		color: '#00b894',
		fontWeight: 'bold',
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: scaleWidth(1), height: scaleHeight(1) },
		textShadowRadius: scaleWidth(2),
	},
	optionCard: {
		backgroundColor: '#fff',
		padding: scaleWidth(14),
		borderRadius: scaleWidth(16),
		borderWidth: 1.2,
		borderColor: '#dfe6e9',
		marginBottom: scaleHeight(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.06,
		shadowRadius: scaleWidth(3),
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
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: 0,
	},
	optionContent: {
		fontSize: scaledSize(16),
		fontWeight: '700',
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		flexShrink: 1,
		flexWrap: 'wrap',
	},
	resultMessageBig: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2ecc71',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
		marginBottom: scaleHeight(16),
	},
	correctInfoCard: {
		width: '100%',
		backgroundColor: '#eafaf1',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginTop: scaleHeight(10),
	},
	correctInfoLabel: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#27ae60',
		marginBottom: scaleHeight(4),
	},
	correctInfoText: {
		fontSize: scaledSize(15),
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		fontWeight: '500',
	},

	badgeModalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(16),
		textAlign: 'center',
	},
	badgeItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(12),
		width: '100%',
		borderRadius: scaleWidth(12),
		borderWidth: 1.2,
		borderColor: '#d1f2eb',
		backgroundColor: '#f9fefc',
	},
	badgeIconWrap: {
		marginRight: scaleWidth(12),
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#ADD8E6',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowOpacity: 0.1,
		shadowRadius: scaleWidth(2),
	},
	badgeName: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#27ae60',
		marginBottom: scaleHeight(2),
	},
	badgeTextWrap: {
		flexShrink: 1,
		flexGrow: 1,
		minWidth: 0,
		maxWidth: '85%',
	},
	badgeDescription: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		lineHeight: scaleHeight(20),
	},
	modalConfirmText2: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
	modalConfirmButton2: {
		backgroundColor: '#2980b9',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(36),
		borderRadius: scaleWidth(30),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.2,
		shadowRadius: scaleWidth(4),
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#f9f9f9',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#ddd',
		width: '100%',
	},
	badgeCardActive: {
		borderColor: '#27ae60',
		backgroundColor: '#f0fbf4',
	},
	iconBox: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(12),
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
		fontSize: scaledSize(15),
	},
	modalContentBox: {
		width: '90%',
		minHeight: scaleHeight(340),
		backgroundColor: '#fff',
		paddingVertical: scaleHeight(24),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(20),
		alignItems: 'center',
		justifyContent: 'center',
	},
	timerInner: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	selectedInfoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(12),
	},
	selectedInfoItem: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		fontWeight: '500',
		backgroundColor: '#f1f2f6',
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(8),
		overflow: 'hidden',
	},
	quizTypeLabel: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		textAlign: 'center',
		marginTop: scaleHeight(4),
		fontWeight: '500',
	},
	quizSubText: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		fontWeight: '500',
		textAlign: 'left',
		marginBottom: scaleHeight(8),
		marginTop: scaleHeight(-4),
	},
	badge: {
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(12),
	},
	pillBadgeText: {
		fontSize: scaledSize(12),
		fontWeight: '600',
	},
	badgeRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	pillBadge: {
		borderWidth: 1,
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(14),
		marginHorizontal: scaleWidth(4),
		backgroundColor: 'rgba(0,0,0,0.02)',
	},
	badgePill: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(20),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(6), // ✅ 기존 2 → 6~8 정도로 늘리면 높이가 확보됨
		marginLeft: scaleWidth(6),
		marginBottom: scaleHeight(6),
	},
	badgeText: {
		color: '#fff',
		marginLeft: scaleWidth(3),
		fontSize: scaledSize(13), // ✅ 글씨도 조금 키워주면 더 균형 맞음
		fontWeight: '600',
	},
	titleIcon: {
		marginLeft: scaleWidth(6),
		marginTop: scaleHeight(2),
	},
	comboValue: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#e74c3c', // 🔥 강조된 빨간색
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
		flexShrink: 1,
		flexWrap: 'nowrap',
		textAlign: 'center',
		includeFontPadding: false,
		maxWidth: '100%',
	},
	optionSelectedBorder: {
		borderWidth: 2,
		borderColor: '#3498db', // 선택한 보기 파란 테두리
	},
	optionSelectedCard: {
		backgroundColor: '#eaf2fb', // 💙 선택시 파란 배경
		borderColor: '#3498db',
		borderWidth: 2,
	},
});
