/* eslint-disable jsx-quotes */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable curly */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import {RouteProp, useIsFocused, useRoute} from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import QuizResultModal from './modal/QuizResultModal';
import QuizCompletionModal from './modal/QuizCompletionModal';
import { QuizBadgeInterceptor } from '@/services/interceptor/QuizBadgeInterceptor';
import { CONST_BADGES } from '@/const/ConstBadges';
import IconComponent from './common/atomic/IconComponent';
import { Paths } from '@/navigation/conf/Paths';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { shuffle } from '@/utils/ArrayUtils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles, themedValue } from '@/const/common/Theme';
import { getCategoryColor, getLevelColorByNumber } from '@/screens/common/CommonProverbModule';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import StartModal from './modal/QuizStartModal';
import NewBadgeModal from './modal/NewBadgeModal';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import QuizHintModal from './modal/QuizHintModal';
import FastImage from 'react-native-fast-image';
import { playCorrect, playWrong, playTimeout, playTick, playWhoosh, playFinish } from '@/utils/SoundUtils';
import { startBgm, stopBgm } from '@/utils/BgmUtils';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import DateUtils from '@/utils/DateUtils';
import { useAppNavigation, QuizScreenParams } from '@/navigation/conf/Types';
import QuizHistoryService from '@/services/QuizHistoryService';

// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const labelColors = themedValue(() => [COLORS.secondary, COLORS.primary, COLORS.accentTeal, COLORS.accentFlame]); // A, B, C, D 보기 라벨

const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;

/** 문제당 제한시간(초) — 타이머 / 시작 안내 팝업이 같은 값을 쓰도록 한 곳에서 관리한다. */
const QUESTION_TIME_LIMIT = 40;

// 파라미터 정의는 RootStackParamList(단일 소스)에서 가져온다.
type QuizRoute = RouteProp<{ QUIZ: QuizScreenParams }, 'QUIZ'>;

const QuizScreen = () => {
	const route = useRoute<QuizRoute>();
	const { width: screenWidth } = useWindowDimensions();
	const flatListRef = useRef<FlatList<string>>(null);
	const [showAdForHint, setShowAdForHint] = useState(false);

	// 1️⃣ 기존 selectedLevel, selectedCategory 초기값 수정
	const { mode: routeMode, questionPool, isWrongReview = false, title, selectedLevel: routeLevel, selectedCategory: routeCategory } = route.params;

	const isFocused = useIsFocused();
	const navigation = useAppNavigation();

	const comboAnim = useRef(new Animated.Value(0)).current;
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const scaleAnims = useRef<Animated.Value[]>([]);
	// ⏱ 타이머가 경고 구간에 들어오면 힌트 전구가 빛나는 애니메이션
	const hintGlowAnim = useRef(new Animated.Value(0)).current;
	const hintGlowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const comboEffectAnim = useRef(new Animated.Value(0)).current;
	const comboShake = useRef(new Animated.Value(0)).current;
	// 문제 전환 시 페이드 인 (문제 텍스트 + 보기 목록 공용)
	const questionFadeAnim = useRef(new Animated.Value(1)).current;
	// 화면에서 띄운 setTimeout 을 모아 두었다가 언마운트 시 일괄 정리
	const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
	const runLater = (fn: () => void, ms: number) => {
		timeoutsRef.current.push(setTimeout(fn, ms));
	};

	const [isAnswerLocked, setIsAnswerLocked] = useState(false);
	const [quizHistory, setQuizHistory] = useState<MainDataType.UserQuizHistory | null>(null);

	const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<MainDataType.UserBadge[]>([]);
	const [showStartModal, setShowStartModal] = useState(true); // 시작 모달 상태

	const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
	const [question, setQuestion] = useState<MainDataType.Proverb | null>(null);
	const [options, setOptions] = useState<string[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [remainingTime, setRemainingTime] = useState(QUESTION_TIME_LIMIT);
	const [showResultModal, setShowResultModal] = useState(false);
	const [showCompletionModal, setShowCompletionModal] = useState(false);
	const [completionData, setCompletionData] = useState({ correct: 0, wrong: 0, total: 0, accuracy: 0 });
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
	const [hintAdWatchedQuestionId, setHintAdWatchedQuestionId] = useState<number | null>(null);

	// ponytail: '답변 완료' 여부는 selected(null=미답변) 로 충분. 별도 ref 는 중복 상태라 제거함.
	const [totalScore, setTotalScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [resultType, setResultType] = useState<'correct' | 'wrong' | 'timeout' | 'done'>('correct');

	const scoreBonusAnim = useRef(new Animated.Value(0)).current;
	const [showScoreBonus, setShowScoreBonus] = useState(false);
	const [comboEffectText, setComboEffectText] = useState('');

	const [reviewIndex, setReviewIndex] = useState(0);

	const normalizeRouteLevel = (level?: QuizScreenParams['selectedLevel']): string => {
		switch (level) {
			case 1:
				return '초급';
			case 2:
				return '중급';
			case 3:
				return '고급';
			case 4:
				return '특급';
			case 'all':
			default:
				return '전체';
		}
	};

	const praiseMessages = [
		'정답입니다! 정말 똑똑합니다! 🎉\n이번 퀴즈를 정확히 짚어냈습니다!',
		'대단합니다! 완벽한 정답입니다! 🏆\n계속 이렇게만 간다면 금방 속담 마스터가 되겠습니다!',
		'굿잡! 멋집니다! 💯\n지금까지의 학습이 빛을 발하고 있습니다!',
		'똑소리 나는 정답입니다! 🤓✨\n집중력이 정말 뛰어납니다!',
		'정답을 쏙쏙 맞히십니다! 🌟\n공부한 보람이 느껴집니다.\n계속 도전해 보세요!',
		'👏 대단합니다!\n이 속도라면 모든 속담을 금방 외울 수 있을 것 같습니다!',
		'정말 똑똑합니다! 📚\n퀴즈를 척척 풀어가는 모습이 인상적입니다!',
	];
	// 뒤로가기를 그냥 삼키면 앱이 멈춘 것처럼 보인다 — 화면의 종료 버튼과 같은 확인 팝업을 띄운다.
	useBlockBackHandler(true, () => setShowExitModal(true));

	useEffect(() => {
		setSelectedLevel(normalizeRouteLevel(routeLevel));
		setSelectedCategory(routeCategory ?? '전체');
	}, [routeLevel, routeCategory]);

	useEffect(() => {
		if (!quizHistory) return;
		if (showStartModal) return; // ✅ 시작 모달이 열려있으면 문제 로드 금지
		if (filteredProverbs.length === 0) return;
		if (isAnswerLocked) return;

		if (questionPool && questionPool.length > 0) {
			setProverbs(questionPool);
			loadQuestion(questionPool);
		} else {
			const all = ProverbServices.selectProverbList();
			const filtered = all.filter((p) => {
				const levelMatch = selectedLevel === '전체' || p.levelName === selectedLevel;
				const categoryMatch = selectedCategory === '전체' || p.category === selectedCategory;
				return levelMatch && categoryMatch;
			});
			setProverbs(filtered);
			if (filtered.length > 0) loadQuestion(filtered);
		}
	}, [quizHistory, showStartModal, isAnswerLocked, questionPool, selectedLevel, selectedCategory]); // ✅ showStartModal 의존성 추가

	useEffect(() => {
		(async () => {
			// 기록이 없으면 빈 기록을 돌려주므로 화면에서 별도 초기화가 필요 없다
			setQuizHistory(await QuizHistoryService.getQuizHistoryOrEmpty());
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
		if (quizHistory) setTotalScore(quizHistory.totalScore ?? 0);
	}, [quizHistory]);

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
	// ✅ 퀴즈 완료 팝업 표시 (누적 정답/오답 기준 통계 계산)
	const showCompletion = () => {
		const correct = quizHistory?.correctProverbId?.length ?? 0;
		const wrong = quizHistory?.wrongProverbId?.length ?? 0;
		const total = correct + wrong;
		const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
		setCompletionData({ correct, wrong, total, accuracy });
		playFinish(); // 🎉 퀴즈 완료 사운드
		setShowCompletionModal(true);
	};

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
				showCompletion();
				return;
			}
			setupQuestion(questionPool[reviewIndex], questionPool);
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
			showCompletion();
			return;
		}

		setupQuestion(unSolved[Math.floor(Math.random() * unSolved.length)], source);
	};
	/**
	 * 문제 2: 문제 세팅 로직을 별도로 분리하여 재사용 가능하게
	 */
	const setupQuestion = (newQuestion: MainDataType.Proverb, pool: MainDataType.Proverb[] = filteredProverbs) => {
		const shuffledPool = shuffle(pool.filter((p) => p.id !== newQuestion.id));
		const shuffledDistractors = shuffledPool.slice(0, 3);

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
			// 오답 보기가 정답과 같은 단어를 뽑는 경우가 있어 중복을 제거한 뒤 부족분을 다른 속담에서 채운다.
			const wrongWords: string[] = [];
			for (const p of shuffledPool) {
				if (wrongWords.length >= 3) {
					break;
				}
				const word = pickBlankWord(p.proverb);
				if (word && word !== blank && !wrongWords.includes(word)) {
					wrongWords.push(word);
				}
			}
			allOptions = [...wrongWords, blank];
			displayText = newQuestion.proverb.replace(blank, '(____)');
			setBlankWord(blank);
		} else if (routeMode === 'example' || routeMode === 'exampleBlank') {
			allOptions = [...shuffledDistractors.map((p) => p.proverb), newQuestion.proverb];
			const ex = (newQuestion.example && newQuestion.example[0]) || '';
			displayText = ex
				? routeMode === 'exampleBlank' && ex.includes(newQuestion.proverb)
					? ex.split(newQuestion.proverb).join('◯◯◯')
					: ex
				: newQuestion.longMeaning || newQuestion.meaning;
		}

		// 상태 갱신
		setQuestion(newQuestion);
		setOptions(shuffle(allOptions));
		setQuestionText(displayText);
		setSelected(null);
		setIsCorrect(null);
		setRemainingTime(QUESTION_TIME_LIMIT);

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
		// ✅ 이미 답을 골랐거나(selected !== null) 타이머가 돌고 있으면 재시작 금지
		if (!question || selected !== null || timerRef.current) return;

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
		else if (routeMode === 'example' || routeMode === 'exampleBlank') correctAnswer = question.proverb;

		const isTimeout = answer === '';
		const correct = answer === correctAnswer;

		setSelected(answer);
		setIsCorrect(correct);
		setResultType(isTimeout ? 'timeout' : correct ? 'correct' : 'wrong');

		// 🔊 정답/오답/시간초과 효과음
		if (isTimeout) {
			playTimeout();
		} else if (correct) {
			playCorrect();
		} else {
			playWrong();
		}

		const newCombo = correct ? combo + 1 : 0;

		// 점수 보너스 애니메이션
		if (correct) {
			const newComboValue = combo + 1;
			setShowScoreBonus(true);
			scoreBonusAnim.setValue(0);
			setCombo(newCombo); // 콤보 업데이트
			triggerComboAnimation(); // 콤보 애니메이션 즉시 실행
			if (newComboValue >= 2) {
				// triggerComboAnim() 은 같은 comboAnim 을 1.4→1 로 몰아서
				// triggerComboAnimation()(0→1→0)과 충돌해 콤보 숫자가 확대된 채 굳는다 → 사용하지 않는다.
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
		// ⚠️ 기록/뱃지 처리 중 어떤 오류가 나더라도 아래의 결과(해설) 모달은 반드시 노출되도록 try/catch 로 감쌉니다.
		if (quizHistory && question) {
			try {
				const id = question.id;
				// patch 안에서 최신 저장값을 받아 수정한다 —
				// 화면 state 를 그대로 덮어쓰면 그 사이 다른 화면이 준 뱃지/점수가 사라진다.
				let updated!: MainDataType.UserQuizHistory;
				const finalUpdated = await QuizHistoryService.patch((stored) => {
					updated = { ...stored };

					// 누락 가능 필드 방어 (오래된 저장 데이터 대비)
					updated.quizCounts = updated.quizCounts ?? {};
					updated.correctProverbId = updated.correctProverbId ?? [];
					updated.wrongProverbId = updated.wrongProverbId ?? [];
					updated.badges = updated.badges ?? [];
					updated.totalScore = updated.totalScore ?? 0;
					updated.bestCombo = updated.bestCombo ?? 0;

					updated.quizCounts[id] = (updated.quizCounts[id] || 0) + 1;
					updated.lastAnsweredAt = DateUtils.now();

					// 오답 복습 모드일 경우 오답 → 정답 처리 먼저 실행
					if (correct && isWrongReview && updated.wrongProverbId.includes(id)) {
						updated.wrongProverbId = updated.wrongProverbId.filter((wrongId) => wrongId !== id);
						if (!updated.correctProverbId.includes(id)) {
							updated.correctProverbId.push(id);
						}
					}

					// 정답/오답 처리 (quizCounts/lastAnsweredAt 는 위에서 이미 1회 반영)
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
					return { ...updated, badges: [...new Set([...(updated.badges || []), ...acquiredBadges])] };
				});
				setQuizHistory(finalUpdated);
				setTotalScore(finalUpdated.totalScore); // ← 총점 상태 갱신 추가

				if (acquiredBadges.length > 0) {
					const earnedBadgeObjects = CONST_BADGES.filter((b) => acquiredBadges.includes(b.id));
					if (earnedBadgeObjects.length > 0) {
						setNewlyEarnedBadges(earnedBadgeObjects); // ✨ 뱃지 정보 세팅
						setBadgeModalVisible(true); // ✨ 모달 표시
						setConfettiKey(Math.random()); // 🎉 축포 터뜨리기
						return; // 정답/오답 모달 생략 (뱃지 모달 우선 표시)
					}
				}
			} catch (e) {
				// 기록/뱃지 처리 실패 시에도 해설(결과 모달)은 정상적으로 보여줍니다.
				console.warn('[QuizScreen] 기록/뱃지 처리 중 오류 발생, 결과 모달로 계속 진행합니다:', e);
			}
		}

		// ✅ 뱃지가 없을 경우에만 결과 모달 출력
		const title = isTimeout ? '⏰ 시간 초과!' : correct ? '🎉 정답입니다!' : '😢 오답입니다';
		const message = isTimeout
			? '시간 초과로 오답 처리됐습니다!'
			: correct
				? praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
				: '앗, 다음에는 맞힐 수 있습니다!';

		runLater(() => {
			setResultTitle(title);
			setResultMessage(message);
			setShowResultModal(true);
			setIsAnswerLocked(false); // 🔓 다시 풀기 (다음 문제로 넘어갈 때)
		}, 600); // 약간
	};
	// 난이도 색상 — 공통 난이도 램프(CommonProverbModule) 단일 소스 사용
	const getLevelColor = getLevelColorByNumber;

	const triggerComboEffect = (comboValue: number) => {
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

	/**
	 * 빈칸으로 가릴 단어를 고른다.
	 * 2글자 이상 단어가 하나도 없는 속담(짧은 단어로만 구성)에서 undefined 가 나오면
	 * replace(undefined) 가 되어 빈칸이 표시되지 않고 정답 비교도 깨진다 → 항상 문자열을 돌려준다.
	 */
	const pickBlankWord = (text: string): string => {
		const words = text.split(' ').filter((w) => w.length > 1);
		if (words.length > 0) {
			return words[Math.floor(Math.random() * words.length)];
		}
		const fallback = text.split(' ').filter(Boolean);
		return fallback.length > 0 ? fallback.reduce((a, b) => (b.length > a.length ? b : a)) : text;
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
		top: scaleHeight(-30),
	};

	/**
	 * 완료 팝업의 '틀린 문제 다시 풀기' — 누적 오답만 모아 오답 복습 모드로 즉시 재진입한다.
	 * replace 로 이동해야 뒤로가기 시 방금 끝낸 퀴즈로 돌아가지 않는다.
	 */
	const wrongPool = useMemo(() => {
		const wrongIds = new Set(quizHistory?.wrongProverbId ?? []);
		return proverbs.filter((p) => wrongIds.has(p.id));
	}, [proverbs, quizHistory]);

	const handleReviewWrong = () => {
		setShowCompletionModal(false);
		navigation.replace(Paths.QUIZ, {
			mode: routeMode,
			questionPool: wrongPool,
			isWrongReview: true,
			title: '오답 복습',
			selectedLevel: 'all',
			levelKey: 'all',
		});
	};

	const safelyGoBack = () => {
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
		runLater(() => {
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

	const getModeLabel = (mode: 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank') => {
		switch (mode) {
			case 'meaning':
				return '뜻 맞추기';
			case 'proverb':
				return '속담 맞추기';
			case 'blank':
				return '빈칸 채우기';
			case 'example':
				return '예문 속담';
			case 'exampleBlank':
				return '예문 빈칸';
			default:
				return '';
		}
	};
	const onStart = (skipLoad?: boolean) => {
		// ✅ 난이도/카테고리 선택 화면에서 넘어온 questionPool(이미 필터링됨)을 최우선 사용.
		//    questionPool이 없을 때만 로컬 상태 기준으로 필터링한다.
		const filtered =
			questionPool && questionPool.length > 0
				? questionPool
				: ProverbServices.selectProverbList().filter((p) => {
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
				return '초급';
			case 2:
				return '중급';
			case 3:
				return '고급';
			case 4:
				return '특급';
			default:
				return '알수없음';
		}
	};

	// 카테고리 색상 — 공통 팔레트(CommonProverbModule) 단일 소스 사용
	const getFieldColor = (field: string) => getCategoryColor(field);

	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type='FontAwesome6' name='seedling' size={scaledSize(14)} color={COLORS.textWhite} />;
			case 2:
				return <IconComponent type='FontAwesome6' name='leaf' size={scaledSize(14)} color={COLORS.textWhite} />;
			case 3:
				return <IconComponent type='FontAwesome6' name='tree' size={scaledSize(14)} color={COLORS.textWhite} />;
			case 4:
				return <IconComponent type='FontAwesome6' name='trophy' size={scaledSize(14)} color={COLORS.textWhite} />;
			default:
				return null;
		}
	};

	const getFieldIcon = (field: string) => {
		switch (field) {
			case '운/우연':
				return <IconComponent type='FontAwesome6' name='dice' size={scaledSize(12)} color={COLORS.textWhite} />;
			case '인간관계':
				return <IconComponent type='FontAwesome6' name='users' size={scaledSize(12)} color={COLORS.textWhite} />;
			case '세상 이치':
				return <IconComponent type='fontawesome5' name='globe' size={scaledSize(12)} color={COLORS.textWhite} />;
			case '근면/검소':
				return <IconComponent type='fontawesome5' name='hammer' size={scaledSize(12)} color={COLORS.textWhite} />;
			case '노력/성공':
				return <IconComponent type='fontawesome5' name='medal' size={scaledSize(12)} color={COLORS.textWhite} />;
			case '경계/조심':
				return <IconComponent type='fontawesome5' name='exclamation-triangle' size={scaledSize(12)} color={COLORS.textWhite} />;
			case '욕심/탐욕':
				return <IconComponent type='fontawesome5' name='hand-holding-usd' size={scaledSize(12)} color={COLORS.textWhite} />;
			case '배신/불신':
				return <IconComponent type='fontawesome5' name='user-slash' size={scaledSize(12)} color={COLORS.textWhite} />;
			default:
				return <IconComponent type='FontAwesome6' name='tag' size={scaledSize(12)} color={COLORS.textWhite} />;
		}
	};

	const progressPercent = totalCount > 0 ? (getSolvedCount() / totalCount) * 100 : 0;

	// ====================================================
	// 1. favoriteIds 상태 로드 함수 추가 (throw 제거)
	// ====================================================

	// 기존의 throw Error 함수들 완전 제거 후 아래로 교체

	const loadFavorites = async () => {
		setFavoriteIds(await getFavorites());
	};

	// 앱 진입 시 즐겨찾기 로드
	useEffect(() => {
		loadFavorites();
	}, []);

	// ⏱ 타이머가 노란색(경고) 구간(<=20초)에 진입하면 힌트 전구 깜빡임 시작 / 벗어나면 정지
	// ⏱️ 마지막 5초 카운트다운 효과음 (setState 업데이터는 순수해야 하므로 여기서 재생)
	useEffect(() => {
		if (remainingTime > 0 && remainingTime <= 5 && selected === null && !!question) {
			playTick();
		}
	}, [remainingTime, question, selected]);

	useEffect(() => {
		const inWarning = remainingTime <= 20 && remainingTime > 0 && !!question && selected === null;
		if (inWarning) {
			if (!hintGlowLoopRef.current) {
				hintGlowLoopRef.current = Animated.loop(
					Animated.sequence([
						Animated.timing(hintGlowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
						Animated.timing(hintGlowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
					]),
				);
				hintGlowLoopRef.current.start();
			}
		} else if (hintGlowLoopRef.current) {
			hintGlowLoopRef.current.stop();
			hintGlowLoopRef.current = null;
			hintGlowAnim.setValue(0);
		}
		return () => {
			if (hintGlowLoopRef.current) {
				hintGlowLoopRef.current.stop();
				hintGlowLoopRef.current = null;
			}
		};
	}, [remainingTime, question, selected, hintGlowAnim]);

	// 🎞 문제가 바뀔 때 문제/보기 영역 페이드 + 살짝 슬라이드 업
	useEffect(() => {
		if (!question) return;
		questionFadeAnim.setValue(0);
		const anim = Animated.timing(questionFadeAnim, { toValue: 1, duration: 260, useNativeDriver: true });
		anim.start();
		return () => anim.stop();
	}, [question?.id, questionFadeAnim]);

	// 🧹 언마운트 시 타이머/타임아웃/애니메이션 일괄 정리 (메모리 누수 방지)
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			timeoutsRef.current.forEach((id) => clearTimeout(id));
			timeoutsRef.current = [];
			if (hintGlowLoopRef.current) {
				hintGlowLoopRef.current.stop();
				hintGlowLoopRef.current = null;
			}
			[comboAnim, comboEffectAnim, comboShake, scaleAnim, scoreBonusAnim, hintGlowAnim, questionFadeAnim].forEach((value) => value.stopAnimation());
			stopBgm(); // 🎵 화면을 벗어나면 BGM 정리
		};
	}, [comboAnim, comboEffectAnim, comboShake, scaleAnim, scoreBonusAnim, hintGlowAnim, questionFadeAnim]);

	const questionEnterStyle = {
		opacity: questionFadeAnim,
		transform: [{ translateY: questionFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(10), 0] }) }],
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
					<View style={styles.container}>
						<View style={styles.inner}>
						<View style={styles.progressStatusWrapper}>
								<View style={styles.quizHeaderRow}>
									<View style={styles.quizHeaderCopy}>
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
									<FastImage source={require('@/assets/images/screen-heroes/quiz-coach.png')} style={styles.quizCoachImage} resizeMode="contain" />
								</View>

								<View style={styles.progressBarWrapper}>
									<View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
								</View>

								<View style={styles.statusCardRow}>
									<View style={styles.statusCard}>
										<View style={[styles.statusCardIcon, { backgroundColor: COLORS.secondarySoft }]}>
											<IconComponent type='materialIcons' name='quiz' size={scaledSize(16)} color={COLORS.secondary} />
										</View>
										<Text style={styles.statusCardTitle}>푼 퀴즈</Text>
										<Text style={styles.statusCardValue}>
											<Text style={{ color: COLORS.secondary }}>{getSolvedCount()}</Text>
											<Text style={styles.statusCardUnit}>{` / ${totalCount}`}</Text>
										</Text>
									</View>
									<View style={styles.statusCard}>
										<View style={[styles.statusCardIcon, { backgroundColor: COLORS.successSoft }]}>
											<IconComponent type='materialIcons' name='star' size={scaledSize(16)} color={COLORS.success} />
										</View>
										<Text style={styles.statusCardTitle}>총점</Text>
										<View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
											<Text style={styles.statusCardValue}>{Number.isFinite(totalScore) ? totalScore : 0}<Text style={styles.statusCardUnit}>점</Text></Text>
											{showScoreBonus && <Animated.Text style={[styles.scoreBonusText, scoreBonusStyle]}>+10점!</Animated.Text>}
										</View>
									</View>
									<View style={styles.statusCard}>
										<View style={[styles.statusCardIcon, { backgroundColor: COLORS.warningBg }]}>
											<IconComponent type='materialCommunityIcons' name='fire' size={scaledSize(16)} color={combo > 0 ? COLORS.warning : COLORS.textLight} />
										</View>
										<Text style={styles.statusCardTitle}>콤보</Text>
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
											<Text style={[styles.statusCardValue, { color: combo > 0 ? COLORS.warning : COLORS.text }]}>
												{combo}
												<Text style={styles.statusCardUnit}> Combo</Text>
											</Text>
										</Animated.View>
									</View>
								</View>
							</View>
							<View style={styles.quizBox}>
								<AnimatedCircularProgress
									size={scaleWidth(70)}
									width={scaleWidth(6)} // ✅ 기존 8 → 6
									fill={((QUESTION_TIME_LIMIT - remainingTime) / QUESTION_TIME_LIMIT) * 100}
									duration={500}
									tintColor={remainingTime > 20 ? COLORS.secondary : remainingTime > 10 ? COLORS.warning : COLORS.danger}
									backgroundColor={COLORS.surfaceAlt}>
									{() => (
										<View style={styles.timerInner}>
											<Text style={[styles.timerText, { color: remainingTime > 20 ? COLORS.secondary : remainingTime > 10 ? COLORS.warning : COLORS.danger }]}>
												{remainingTime}초
											</Text>
										</View>
									)}
								</AnimatedCircularProgress>

								{question ? (
									<Animated.View style={[{ alignItems: 'center', marginBottom: SPACING_H.sm }, questionEnterStyle]}>
										<Text style={[styles.questionText, { textAlign: 'center' }]}>
											{routeMode === 'blank' || routeMode === 'example' || routeMode === 'exampleBlank'
												? questionText || '문제 준비중...'
												: routeMode === 'meaning'
													? question?.proverb
													: question?.longMeaning || '문제 준비중...'}
										</Text>
										<View style={styles.promptRow}>
											<Text style={styles.promptText}>
												{routeMode === 'meaning'
													? '무슨 의미입니까?'
													: routeMode === 'proverb'
														? '무슨 속담입니까?'
													: routeMode === 'blank'
														? '빈칸은 무엇입니까?'
														: routeMode === 'exampleBlank'
															? '빈칸에 들어갈 속담은?'
															: '어울리는 속담은?'}
											</Text>
											<TouchableOpacity
												onPress={() => {
													if (question?.id && hintAdWatchedQuestionId === question.id) {
														setShowHintModal(true);
														return;
													}
													setShowAdForHint(true);
												}}
												hitSlop={HIT_SLOP}>
												<Animated.View
													style={[
														styles.hintBulbButton,
														remainingTime <= 20 && remainingTime > 10 && styles.hintBulbButtonWarning,
														{
															opacity: hintGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
															transform: [{ scale: hintGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
														},
													]}>
													<IconComponent type='MaterialIcons' name='lightbulb' size={scaledSize(19)} color={COLORS.warning} />
												</Animated.View>
											</TouchableOpacity>
										</View>
									</Animated.View>
								) : (
									<Text style={styles.loadingText}>문제 불러오는 중...</Text>
								)}

								<Animated.View style={[styles.optionsContainer, questionEnterStyle]}>
									<FlatList
										key={question?.id} // ✅ 질문이 바뀔 때마다 강제 리렌더
										ref={flatListRef}
										data={options}
										scrollEnabled={true} // ✅ 항상 스크롤 가능
										keyExtractor={(item, index) => `${item}-${index}`}
										contentContainerStyle={{ paddingBottom: SPACING_H.xxxxl }}
										showsVerticalScrollIndicator
										renderItem={({ item, index }) => {
											const scaleAnim = scaleAnims.current[index] ?? new Animated.Value(1);
											const isSelected = selected === item;
											const correctAnswer =
												routeMode === 'meaning'
													? question?.longMeaning
													: routeMode === 'proverb'
														? question?.proverb
														: routeMode === 'example' || routeMode === 'exampleBlank'
															? question?.proverb
															: blankWord;

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
															selected && isCorrectAnswer && styles.optionCorrectCard, // ⭕ 정답은 항상 초록 강조
															selected && isSelectedWrong && styles.optionWrongCard, // ❌ 오답이면 빨강 배경
														]}
														onPress={() => handleSelect(item)}
														activeOpacity={0.85}
														disabled={isAnswerLocked}>
														<View style={styles.optionRow}>
															<Text style={[styles.optionLabel, { color: labelColors[index] }]}>{['A.', 'B.', 'C.', 'D.'][index]}</Text>

															<View style={{ flex: 1 }}>
																<Text style={styles.optionContent}>{item}</Text>
															</View>

															{/* ✅ 선택 이후에만 아이콘 표시 */}
															{selected && (
																<>
																	{/* 정답이면 O 아이콘 (내가 안 눌러도 보임) */}
																	{isCorrectAnswer && <IconComponent type='MaterialIcons' name='check-circle' size={scaledSize(26)} color={COLORS.success} />}

																	{/* 내가 고른 게 오답이면 X 아이콘 */}
																	{isSelectedWrong && <IconComponent type='MaterialIcons' name='cancel' size={scaledSize(26)} color={COLORS.danger} />}
																</>
															)}
														</View>
													</TouchableOpacity>
												</Animated.View>
											);
										}}
									/>
								</Animated.View>
							</View>
						</View>
						<View style={styles.bottomExitWrapper}>
							<TouchableOpacity style={styles.exitButton} activeOpacity={0.85} onPress={() => setShowExitModal(true)}>
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
												outputRange: [0, scaleHeight(-30)],
											}),
										},
									],
								}}>
								<Text style={styles.comboEffectText}>{comboEffectText}</Text>
							</Animated.View>
						)}

						{confettiKey > 0 && <ConfettiCannon key={confettiKey} count={100} origin={{ x: screenWidth / 2, y: 0 }} fadeOut autoStart />}
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
						? '시간 초과로 오답 처리됐습니다!'
						: correct
							? praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
							: '앗, 다음에는 맞힐 수 있습니다!';

					runLater(() => {
						setResultTitle(titleText);
						setResultMessage(message);
						setShowResultModal(true);
						setIsAnswerLocked(false);
					}, 300);
				}}
			/>
			<StartModal
				visible={showStartModal}
				mode={routeMode}
				timeLimit={QUESTION_TIME_LIMIT}
				onStart={() => {
					setShowStartModal(false);
					playWhoosh(); // 🎬 퀴즈 시작 사운드
					startBgm('quiz'); // 🎵 퀴즈 BGM 시작
					runLater(() => onStart(), 100); // ✅ onStart 호출 추가
				}}
				onBack={() => safelyGoBack()}
			/>
			<QuizHintModal visible={showHintModal} question={question} mode={routeMode} questionText={questionText} onClose={() => setShowHintModal(false)} />
			{/* ======================= 퀴즈 종료 ============================ */}
			<Modal visible={showExitModal} transparent animationType='fade' onRequestClose={() => setShowExitModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.exitModal}>
						<Text style={styles.exitModalTitle}>퀴즈를 종료하시겠습니까?</Text>
						<Text style={styles.exitModalMessage}>진행 중인 퀴즈가 저장되지 않습니다.</Text>
						<View style={styles.modalButtonRow}>
							<TouchableOpacity
								style={styles.modalBackButton}
								activeOpacity={0.85}
								onPress={() => {
									setShowExitModal(false);
									startTimer(); // ⏱ 타이머 재시작
								}}>
								<Text style={styles.modalBackButtonText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.exitModalConfirmButton}
								activeOpacity={0.85}
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
			blankWord={blankWord}
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
						// 퀴즈를 다 풀면 홈으로 돌아간다(설정 탭으로 보내던 오이동 수정)
						runLater(() => safelyGoBack(), 300);
					} else {
						handleNextQuestion();
					}
				}}
			/>
			<QuizCompletionModal
				visible={showCompletionModal}
				correct={completionData.correct}
				wrong={completionData.wrong}
				total={completionData.total}
				accuracy={completionData.accuracy}
				onReviewWrong={wrongPool.length > 0 ? handleReviewWrong : undefined}
				onConfirm={() => {
					setShowCompletionModal(false);
					safelyGoBack();
				}}
			/>
			{showAdForHint && (
				<AdmobFrontAd
					onAdClosed={() => {
						if (question?.id) {
							setHintAdWatchedQuestionId(question.id);
						}
						setShowAdForHint(false);
						setShowHintModal(true);
					}}
				/>
			)}
		</SafeAreaView>
	);
};

export default QuizScreen;


const styles = themedStyles(() => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.surface,
	},
	inner: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.sm,
	},
	// ===== 상단 진행/상태 영역 =====
	progressStatusWrapper: {
		width: '100%',
		maxWidth: scaleWidth(500),
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.md,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	quizHeaderRow: { minHeight: scaleHeight(64), flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm },
	quizHeaderCopy: { flex: 1 },
	quizCoachImage: { width: scaleWidth(72), height: scaleHeight(66), marginTop: scaleHeight(-6) },
	progressText: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.text,
		fontWeight: '600',
		marginBottom: SPACING_H.sm,
		textAlign: 'center',
	},
	badgePill: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
		marginLeft: SPACING_W.sm,
		marginBottom: SPACING_H.sm,
	},
	badgeText: {
		color: COLORS.textWhite,
		marginLeft: SPACING_W.xs,
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
	},
	progressBarWrapper: {
		height: scaleHeight(10),
		width: '100%',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.round,
		overflow: 'hidden',
		marginBottom: SPACING_H.lg,
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: COLORS.secondary,
		borderRadius: RADIUS.round,
	},
	statusCardRow: {
		flexDirection: 'row',
		width: '100%',
		columnGap: SPACING_W.sm,
	},
	statusCard: {
		flex: 1,
		backgroundColor: COLORS.background,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.sm,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	statusCardIcon: {
		width: scaleWidth(30),
		height: scaleWidth(30),
		borderRadius: scaleWidth(30) / 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.xs,
	},
	statusCardTitle: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		fontWeight: '600',
		marginBottom: SPACING_H.xs,
	},
	statusCardValue: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.text,
	},
	statusCardUnit: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '600',
		color: COLORS.textLight,
	},
	scoreBonusText: {
		position: 'absolute',
		top: scaleHeight(-10),
		fontSize: FONT_SIZES.heading,
		color: COLORS.success,
		fontWeight: '700',
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	// ===== 문제 영역 =====
	quizBox: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
	},
	timerInner: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	timerText: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	questionText: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.sm,
		textAlign: 'center',
		color: COLORS.secondaryDark,
		lineHeight: scaledSize(28),
	},
	loadingText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.lg,
	},
	promptRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		marginBottom: SPACING_H.sm,
	},
	promptText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.textStrong,
		textAlign: 'center',
	},
	hintBulbButton: {
		width: scaleWidth(34),
		height: scaleWidth(34),
		borderRadius: scaleWidth(34) / 2,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.warningSoft,
		borderWidth: 1,
		borderColor: COLORS.warningBorder,
	},
	hintBulbButtonWarning: {
		backgroundColor: COLORS.warningBg,
		borderColor: COLORS.warning,
	},
	// ===== 보기(선택지) =====
	optionsContainer: {
		flex: 1,
		width: '100%',
		marginTop: SPACING_H.sm,
	},
	optionCard: {
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		// ponytail: 터치 영역 44 이상 보장을 위해 의도적으로 스케일하지 않은 고정 최소 높이
		minHeight: 48,
		justifyContent: 'center',
		borderRadius: RADIUS.md,
		borderWidth: 2,
		borderColor: COLORS.border,
		marginBottom: SPACING_H.md,
	},
	optionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
	},
	optionSelectedCard: {
		backgroundColor: COLORS.secondaryBg,
		borderColor: COLORS.secondary,
	},
	optionCorrectCard: {
		backgroundColor: COLORS.successBg,
		borderColor: COLORS.success,
	},
	optionWrongCard: {
		backgroundColor: COLORS.dangerBg,
		borderColor: COLORS.danger,
	},
	optionLabel: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	optionContent: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '600',
		color: COLORS.textStrong,
		lineHeight: scaledSize(22),
		flexShrink: 1,
		flexWrap: 'wrap',
	},
	comboEffectText: {
		fontSize: FONT_SIZES.display,
		fontWeight: '700',
		color: COLORS.danger,
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	// ===== 하단 종료 버튼 =====
	bottomExitWrapper: {
		width: '100%',
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.lg,
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
	},
	exitButton: {
		backgroundColor: COLORS.textSecondary,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xxl,
		// ponytail: 터치 영역 44 이상 보장을 위한 고정 최소 높이
		minHeight: 48,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: RADIUS.round,
	},
	exitButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '600',
	},
	// ===== 종료 확인 모달 =====
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	exitModal: {
		width: '100%',
		maxWidth: scaleWidth(420),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.xl,
		paddingVertical: SPACING_H.xl,
		borderRadius: RADIUS.xl,
		alignItems: 'center',
	},
	exitModalTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.sm,
		textAlign: 'center',
	},
	exitModalMessage: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xl,
		textAlign: 'center',
		lineHeight: scaledSize(22),
	},
	modalButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		columnGap: SPACING_W.md,
		width: '100%',
	},
	modalBackButton: {
		flex: 1,
		backgroundColor: COLORS.surfaceAlt,
		paddingVertical: SPACING_H.md,
		// ponytail: 터치 영역 44 이상 보장을 위한 고정 최소 높이
		minHeight: 48,
		borderRadius: RADIUS.md,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalBackButtonText: {
		color: COLORS.textSecondary,
		fontSize: FONT_SIZES.lg,
		fontWeight: '600',
	},
	exitModalConfirmButton: {
		flex: 1,
		backgroundColor: COLORS.danger,
		paddingVertical: SPACING_H.md,
		// ponytail: 터치 영역 44 이상 보장을 위한 고정 최소 높이
		minHeight: 48,
		borderRadius: RADIUS.md,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '600',
	},
}));
