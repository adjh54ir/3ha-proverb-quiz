/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	Image,
	ActivityIndicator,
	Animated,
	Easing,
	ScrollView,
	InteractionManager,
	Pressable,
	Modal,
	Platform,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { MainDataType } from '@/types/MainDataType';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StudyBadgeInterceptor } from '@/services/interceptor/StudyBadgeInterceptor';
import { CONST_BADGES } from '@/const/ConstBadges';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import ProverbServices from '@/services/ProverbServices';
import NewBadgeModal from '@/screens/modal/NewBadgeModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	iconType: 'FontAwesome6',
	badgeId: '',
	iconName: 'clipboard-list',
	iconColor: '#3498db',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color={COLORS.textSecondary} />,
	labelStyle: {
		marginLeft: SPACING_W.xs,
		fontSize: FONT_SIZES.md,
	},
};
const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '초급',
		value: '초급',
		icon: () => <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(16)} color="#85C1E9" />,
	},
	{
		label: '중급',
		value: '중급',
		icon: () => <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(16)} color="#F4D03F" />,
	},
	{
		label: '고급',
		value: '고급',
		icon: () => <IconComponent type="FontAwesome6" name="tree" size={scaledSize(16)} color="#e67e22" />,
	},
	{
		label: '특급',
		value: '특급',
		icon: () => <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(16)} color="#E74C3C" />,
	},
];
export const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '운/우연',
		value: '운/우연',
		badgeId: 'category_luck',
		iconType: 'FontAwesome6',
		iconName: 'dice',
		iconColor: '#76d7c4',
		icon: () => <IconComponent type="FontAwesome6" name="dice" size={scaledSize(16)} color="#76d7c4" />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		badgeId: 'category_relation',
		iconType: 'FontAwesome6',
		iconName: 'users',
		iconColor: '#76d7c4',
		icon: () => <IconComponent type="FontAwesome6" name="users" size={scaledSize(16)} color="#76d7c4" />,
	},
	{
		label: '세상 이치',
		value: '세상 이치',
		badgeId: 'category_world',
		iconType: 'FontAwesome5',
		iconName: 'globe',
		iconColor: '#f4d03f',
		icon: () => <IconComponent type="FontAwesome5" name="globe" size={scaledSize(16)} color="#f4d03f" />,
	},
	{
		label: '근면/검소',
		value: '근면/검소',
		badgeId: 'category_diligence',
		iconType: 'FontAwesome5',
		iconName: 'hammer',
		iconColor: '#fab1a0',
		icon: () => <IconComponent type="FontAwesome5" name="hammer" size={scaledSize(16)} color="#fab1a0" />,
	},
	{
		label: '노력/성공',
		value: '노력/성공',
		badgeId: 'category_success',
		iconType: 'FontAwesome5',
		iconName: 'medal',
		iconColor: '#76d7c4',
		icon: () => <IconComponent type="FontAwesome5" name="medal" size={scaledSize(16)} color="#76d7c4" />,
	},
	{
		label: '경계/조심',
		value: '경계/조심',
		badgeId: 'category_caution',
		iconType: 'FontAwesome5',
		iconName: 'exclamation-triangle',
		iconColor: '#e74c3c',
		icon: () => <IconComponent type="FontAwesome5" name="exclamation-triangle" size={scaledSize(16)} color="#e74c3c" />,
	},
	{
		label: '욕심/탐욕',
		value: '욕심/탐욕',
		badgeId: 'category_greed',
		iconType: 'FontAwesome5',
		iconName: 'hand-holding-usd',
		iconColor: '#fd79a8',
		icon: () => <IconComponent type="FontAwesome5" name="hand-holding-usd" size={scaledSize(16)} color="#fd79a8" />,
	},
	{
		label: '배신/불신',
		value: '배신/불신',
		badgeId: 'category_betrayal',
		iconType: 'FontAwesome5',
		iconName: 'user-slash',
		iconColor: '#bdc3c7',
		icon: () => <IconComponent type="FontAwesome5" name="user-slash" size={scaledSize(16)} color="#bdc3c7" />,
	},
];
const mascotImages = [
	require('@/assets/images/random/random_mascote1.png'),
	require('@/assets/images/random/random_mascote2.png'),
	require('@/assets/images/random/random_mascote3.png'),
	require('@/assets/images/random/random_mascote4.png'),
	require('@/assets/images/random/random_mascote5.png'),
	require('@/assets/images/random/random_mascote6.png'),
	require('@/assets/images/random/random_mascote7.png'),
	require('@/assets/images/random/random_mascote8.png'),
	require('@/assets/images/random/random_mascote9.png'),
	require('@/assets/images/random/random_mascote10.png'),
	require('@/assets/images/random/random_mascote11.png'),
	require('@/assets/images/random/random_mascote12.png'),
	require('@/assets/images/random/random_mascote13.png'),
];

const isTablet = screenWidth > 600;
// 예시: 카드 높이 다르게 적용
const isAndroid = Platform.OS === 'android';
const CARD_HEIGHT = isTablet
	? scaleHeight(560)
	: isAndroid
		? scaleHeight(550) // 📌 iOS 대비 20 높게
		: scaleHeight(540);

const praiseMessages = [
	'속담 하나 더 마스터했어요! 🎉',
	'어휘력이 쑥쑥 자라고 있어요! 🌱',
	'오늘도 속담 하나 추가! 내공이 쌓이고 있어요 💪',
	'이 속담, 이제 완전히 내 것이에요! 📖',
	'꾸준한 학습이 속담 고수를 만들어요! 🏆',
	'속담 하나를 알면 열을 이해할 수 있어요! 🔑',
	'오늘 배운 속담, 일상에서 써보세요! 😊',
	'하나씩 차근차근, 속담 달인이 되는 중! ✨',
	'이 속담의 깊은 뜻까지 알아가고 있네요! 🧠',
	'좋아요! 또 하나의 속담이 머릿속에 새겨졌어요! 📚',
];

const reviewPraiseMessages = [
	'복습도 실력이에요! 👍',
	'다시 봐도 새로운 속담이죠? 🔁',
	'반복이 속담 실력의 비결이에요! 💡',
	'한 번 더 보면 더 오래 기억돼요! 🧱',
	'꾸준한 복습, 최고예요! 🌟',
];
const DETAIL_FILTER_HEIGHT = scaleHeight(60);
const IMAGE_HEIGHT = isAndroid ? scaleHeight(220) : scaleHeight(200);
const QuizStudyScreen = () => {
	const STORAGE_KEY = MainStorageKeyType.USER_STUDY_HISTORY;
	const completionImages = require('@/assets/images/cheer-up.png');

	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const scrollViewRef = useRef<ScrollView>(null);
	const carouselRef = useRef<any>(null);
	const isBackCardScrollingRef = useRef(false);
	const toastAnim = useRef(new Animated.Value(0)).current;
	const toastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const toastAnimRef = useRef<Animated.CompositeAnimation | null>(null);
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const detailFilterHeightAnim = useRef(new Animated.Value(0)).current;
	const screenFadeAnim = useRef(new Animated.Value(0)).current;
	const flipAnimRefs = useRef<Record<string, Animated.Value>>({});
	const pressAnimRefs = useRef<Record<string, Animated.Value>>({});
	const glowAnimRefs = useRef<Record<string, Animated.Value>>({});
	const buttonAnimRefs = useRef<Record<string, Animated.Value>>({});
	// ✅ 화면 안에서 예약되는 모든 setTimeout 을 모아두고 언마운트 시 일괄 정리
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const runLater = (fn: () => void, ms: number) => {
		const timer = setTimeout(fn, ms);
		timersRef.current.push(timer);
		return timer;
	};

	// ✅ 첫 렌더부터 채워진 상태로 시작 (빈 배열이면 index % 0 = NaN → source undefined 가 됨)
	const [mascotImagesQueue, setMascotImagesQueue] = useState<number[]>(() =>
		Array.from({ length: 10 }, () => mascotImages[Math.floor(Math.random() * mascotImages.length)]),
	);
	const [isLoading, setIsLoading] = useState(true);
	const [flippedCard, setFlippedCard] = useState<number | null>(null);
	const [completedCardId, setCompletedCardId] = useState<number | null>(null);
	const [proverbList, setProverbList] = useState<MainDataType.Proverb[]>([]);
	const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<MainDataType.UserBadge[]>([]);
	const [studyHistory, setStudyHistory] = useState<MainDataType.UserStudyHistory>({
		studyProverbes: [],
		studyCounts: {},
		lastStudyAt: new Date(),
	});
	const [filter, setFilter] = useState<'all' | 'learning' | 'learned'>('learning');
	const [badgeModalVisible, setBadgeModalVisible] = useState(false);
	const [showGuideModal, setShowGuideModal] = useState(false);
	const [showToast, setShowToast] = useState(false);
	const [praiseText, setPraiseText] = useState('');
	const [levelFilter, setLevelFilter] = useState<'전체' | '초급' | '중급' | '고급' | '특급'>('전체');
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);
	const [regionFilter, setRegionFilter] = useState<string>('전체');
	const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false);
	const [levelOpen, setLevelOpen] = useState(false);
	const [regionOpen, setRegionOpen] = useState(false);
	const [showExitModal, setShowExitModal] = useState(false);

	const progress = proverbList.length > 0 ? (studyHistory.studyProverbes ?? []).length / proverbList.length : 0;

	// ✅ 화면 진입 애니메이션 (fade + slide-up)
	useEffect(() => {
		const anim = Animated.timing(screenFadeAnim, {
			toValue: 1,
			duration: 300,
			easing: Easing.out(Easing.quad),
			useNativeDriver: true,
		});
		anim.start();
		return () => anim.stop();
	}, [screenFadeAnim]);

	/**
	 * Info 팝업 업데이트
	 */
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					onPress={() => {
						setShowGuideModal(true);
						setLevelOpen(false); // ✅ 드롭다운 닫기
						setRegionOpen(false); // ✅ 드롭다운 닫기
					}}
					hitSlop={{ top: scaleHeight(10), bottom: scaleHeight(10), left: SPACING_W.sm, right: SPACING_W.sm }}
					style={{ marginRight: SPACING_W.lg }}>
					<IconComponent type="materialIcons" name="info-outline" size={scaledSize(24)} color={COLORS.secondary} />
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	useEffect(() => {
		if (carouselRef.current && getFilteredData().length > 0) {
			// ✅ Carousel이 업데이트 된 다음에 호출
			InteractionManager.runAfterInteractions(() => {
				carouselRef.current?.scrollTo({ index: 0, animated: false });
			});
		}
	}, [proverbList, filter]);

	useEffect(() => {
		const anim = Animated.timing(detailFilterHeightAnim, {
			toValue: isDetailFilterOpen ? DETAIL_FILTER_HEIGHT : 0,
			duration: 300,
			useNativeDriver: false,
		});
		anim.start();
		return () => anim.stop();
	}, [isDetailFilterOpen]);

	useEffect(() => {
		// 뱃지 모달 열릴 때 애니메이션 실행
		if (!badgeModalVisible) {
			return;
		}
		scaleAnim.setValue(0);
		const anim = Animated.spring(scaleAnim, {
			toValue: 1,
			bounciness: 12,
			useNativeDriver: true,
		});
		anim.start();
		return () => anim.stop();
	}, [badgeModalVisible]);

	useEffect(() => {
		if (carouselRef.current && getFilteredData().length > 0) {
			carouselRef.current?.scrollTo({ index: 0, animated: false });
			setFlippedCard(null);
			setCompletedCardId(null); // ✅ 추가
		}
	}, [levelFilter, regionFilter]);

	// ✅ 화면 재진입 시마다 재조회 (설정 화면에서 학습 기록 초기화/주입이 가능하므로 최신 상태가 필요)
	useEffect(() => {
		if (isFocused) {
			fetchData();
		}
	}, [isFocused]);

	// 레벨 이름/숫자 매핑(재사용용)
	const LEVEL_NAME_MAP: Record<number, '초급' | '중급' | '고급' | '특급'> = {
		1: '초급',
		2: '중급',
		3: '고급',
		4: '특급',
	};
	// 레벨 색상
	const getLevelColor = (level: number) => {
		const levelColorMap: Record<number, string> = {
			1: '#2ecc71', // 초급
			2: '#F4D03F', // 중급
			3: '#e67e22', // 고급
			4: '#E74C3C', // 특급
		};
		return levelColorMap[level] || '#bdc3c7';
	};

	// 카테고리 색상
	const getFieldColor = (field?: string) => {
		const categoryColorMap: Record<string, string> = {
			신체: '#e74c3c',
			음식: '#f4d03f',
			동물: '#76d7c4',
			'언어/표현': '#74b9ff',
			'감정/분위기': '#e17055',
			'행동/태도': '#16a085',
			'재물/비유': '#fab1a0',
			기타: '#bdc3c7',
		};
		return field ? categoryColorMap[field] || '#bdc3c7' : '#bdc3c7';
	};

	// 레벨 아이콘
	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 2:
				return <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 3:
				return <IconComponent type="FontAwesome6" name="tree" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 4:
				return <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(14)} color={COLORS.textWhite} />;
			default:
				return null;
		}
	};

	// 카테고리 아이콘(FIELD_DROPDOWN_ITEMS에서 매칭)
	const getCategoryIcon = (category?: string) => {
		if (!category) {
			return null;
		}
		const matched = FIELD_DROPDOWN_ITEMS.find((i) => i.value === category) as { iconType: string; iconName: string } | undefined;
		return matched ? <IconComponent type={matched.iconType} name={matched.iconName} size={scaledSize(14)} color={COLORS.textWhite} /> : null;
	};

	const fetchData = async () => {
		try {
			const proverbList2 = ProverbServices.selectProverbList();
			setProverbList(proverbList2);

			const savedData = await AsyncStorage.getItem(STORAGE_KEY);
			if (savedData) {
				const parsed = JSON.parse(savedData);
				const fixed: MainDataType.UserStudyHistory = {
					studyProverbes: parsed.studyProverbes ?? [],
					studyCounts: parsed.studyCounts ?? {},
					badges: parsed.badges ?? [],
					lastStudyAt: parsed.lastStudyAt ? new Date(parsed.lastStudyAt) : new Date(),
				};
				setStudyHistory(fixed);
			} else {
				setStudyHistory({ studyProverbes: [], studyCounts: {}, badges: [], lastStudyAt: new Date() });
			}

			scrollViewRef.current?.scrollTo({ y: 0, animated: true });
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);

			// ✅ 카드 맨 앞으로 이동
			InteractionManager.runAfterInteractions(() => {
				carouselRef.current?.scrollTo({ index: 0, animated: false });
			});
		}
	};

	const completeStudy = async (id: number) => {
		const isAlreadyLearned = studyHistory.studyProverbes.includes(id);
		const prevFiltered = getFilteredData();
		const prevIndex = prevFiltered.findIndex((c) => c.id === id);

		// 1. 학습 상태 업데이트
		const updatedCountries = isAlreadyLearned ? studyHistory.studyProverbes.filter((code) => code !== id) : [...studyHistory.studyProverbes, id];

		const updatedCounts = {
			...studyHistory.studyCounts,
			[id]: (studyHistory.studyCounts?.[id] || 0) + (isAlreadyLearned ? 0 : 1),
		};

		const updatedHistory: MainDataType.UserStudyHistory = {
			studyProverbes: updatedCountries,
			studyCounts: updatedCounts,
			badges: studyHistory.badges || [],
			lastStudyAt: new Date(), // ✅ 마지막 학습일자 추가
		};

		// ✅ 이미지 갱신: 해당 index 위치의 이미지를 새 랜덤 이미지로 교체
		setMascotImagesQueue((prevQueue) => {
			const newQueue = [...prevQueue];
			const filteredData = getFilteredData();
			const currentIndex = filteredData.findIndex((p) => p.id === id);
			if (currentIndex !== -1 && newQueue.length > 0) {
				newQueue[currentIndex % newQueue.length] = mascotImages[Math.floor(Math.random() * mascotImages.length)];
			}
			return newQueue;
		});

		// 2. UI 상태 먼저 빠르게 업데이트
		setStudyHistory(updatedHistory);

		if (flipAnimRefs.current[id]) {
			const anim = flipAnimRefs.current[id];
			anim.stopAnimation(() => {
				Animated.timing(anim, {
					toValue: 0,
					duration: 100,
					easing: Easing.ease,
					useNativeDriver: true,
				}).start(() => {
					setFlippedCard(null); // ✅ 애니메이션 후 상태 초기화
				});
			});
		} else {
			setFlippedCard(null);
		}

		// 3. AsyncStorage, 뱃지, 토스트 등은 InteractionManager 이후 처리
		InteractionManager.runAfterInteractions(() => {
			// 상태 저장
			AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

			// 뱃지 검사 및 모달
			checkAndHandleNewStudyBadges(updatedHistory, setStudyHistory, setBadgeModalVisible, setNewlyEarnedBadges);
		});

		// 4. 학습 완료 상태일 경우만 토스트 및 이동 처리
		const nextFiltered = getFilteredDataByHistory(updatedCountries);
		const nextIndex = Math.min(prevIndex, nextFiltered.length - 1);

		setCompletedCardId(id);
		setPraiseText(
			isAlreadyLearned
				? reviewPraiseMessages[Math.floor(Math.random() * reviewPraiseMessages.length)]
				: praiseMessages[Math.floor(Math.random() * praiseMessages.length)],
		);
		showEncourageToast();

		// 👉 자동 넘김을 원하지 않을 경우 주석처리
		// 또는 조건부 실행
		const AUTO_SCROLL_ENABLED = false;
		if (AUTO_SCROLL_ENABLED) {
			runLater(() => {
				carouselRef.current?.scrollTo({ index: nextIndex, animated: true });
				InteractionManager.runAfterInteractions(() => {
					setCompletedCardId(null);
				});
			}, 800);
		}
	};
	// 🔹 필터별 재사용 가능한 헬퍼 함수
	const getFilteredDataByHistory = (customCountries: number[]) => {
		if (filter === 'learned') {
			return proverbList.filter((c) => customCountries.includes(c.id));
		}
		if (filter === 'learning') {
			return proverbList.filter((c) => !customCountries.includes(c.id));
		}
		return proverbList;
	};
	/**
	 * 새로 획득한 학습 뱃지를 인터셉터로 확인 후 업데이트 및 모달 처리
	 */
	const checkAndHandleNewStudyBadges = (
		updatedHistory: MainDataType.UserStudyHistory,
		setter: React.Dispatch<React.SetStateAction<MainDataType.UserStudyHistory>>,
		setBadgeModalVisible: (v: boolean) => void,
		setNewlyEarnedBadges: (badges: MainDataType.UserBadge[]) => void,
	) => {
		const currentBadges = updatedHistory.badges ?? [];

		const newBadgeIds = StudyBadgeInterceptor(updatedHistory);
		const newBadges = newBadgeIds.filter((id) => !currentBadges.includes(id));

		// ✅ 인자로 받은 객체를 직접 변이하면 setState 가 같은 참조를 받아 리렌더가 스킵된다 → 새 객체로 교체
		let nextHistory = updatedHistory;
		if (newBadges.length > 0) {
			const earnedBadges = CONST_BADGES.filter((b) => newBadges.includes(b.id));
			setNewlyEarnedBadges(earnedBadges);
			setBadgeModalVisible(true);

			nextHistory = { ...updatedHistory, badges: [...new Set([...currentBadges, ...newBadges])] };
		}

		AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
		setter(nextHistory);
	};

	const showEncourageToast = () => {
		// 이전에 예약된 숨김/애니메이션 정리 (중복 호출 대비)
		if (toastHideTimerRef.current) {
			clearTimeout(toastHideTimerRef.current);
			toastHideTimerRef.current = null;
		}
		toastAnimRef.current?.stop();

		setShowToast(true);
		toastAnim.setValue(0);

		// 등장: 스프링 팝인
		const inAnim = Animated.spring(toastAnim, {
			toValue: 1,
			friction: 7,
			tension: 80,
			useNativeDriver: true,
		});
		toastAnimRef.current = inAnim;
		inAnim.start(({ finished }) => {
			// stop() 으로 중단된 경우에도 이 콜백은 finished:false 로 호출된다.
			// 여기서 걸러내지 않으면 중단된 애니메이션이 숨김 타이머를 남겨,
			// 뒤이어 뜬 토스트가 예정보다 일찍 사라진다.
			if (!finished) {
				return;
			}
			// 일정 시간 노출 후 페이드 아웃
			toastHideTimerRef.current = setTimeout(() => {
				const outAnim = Animated.timing(toastAnim, {
					toValue: 0,
					duration: 260,
					easing: Easing.in(Easing.quad),
					useNativeDriver: true,
				});
				toastAnimRef.current = outAnim;
				outAnim.start(({ finished }) => {
					if (finished) {
						setShowToast(false);
					}
				});
			}, 1600);
		});
	};

	// ✅ 언마운트 시 토스트/카드/필터 애니메이션 및 예약 타이머 정리 (메모리 누수 방지)
	useEffect(
		() => () => {
			if (toastHideTimerRef.current) {
				clearTimeout(toastHideTimerRef.current);
				toastHideTimerRef.current = null;
			}
			toastAnimRef.current?.stop();
			toastAnim.stopAnimation();
			screenFadeAnim.stopAnimation();
			scaleAnim.stopAnimation();
			detailFilterHeightAnim.stopAnimation();
			[flipAnimRefs, pressAnimRefs, glowAnimRefs, buttonAnimRefs].forEach((store) => {
				Object.values(store.current).forEach((value) => value.stopAnimation());
				store.current = {};
			});
			timersRef.current.forEach(clearTimeout);
			timersRef.current = [];
		},
		[toastAnim, screenFadeAnim, scaleAnim, detailFilterHeightAnim],
	);

	const flipCard = (id: number) => {
		if (isButtonDisabled) {
			return;
		} // ✅ 버튼 잠김 시 flip 차단

		if (!flipAnimRefs.current[id]) {
			flipAnimRefs.current[id] = new Animated.Value(0);
		}
		const anim = flipAnimRefs.current[id];
		const isCurrentlyFlipped = flippedCard === id;

		Animated.timing(anim, {
			toValue: isCurrentlyFlipped ? 0 : 180,
			duration: 150,
			easing: Easing.ease,
			useNativeDriver: true,
		}).start(() => {
			setFlippedCard(isCurrentlyFlipped ? null : id);
		});
	};
	// 상단 훅/레퍼런스들 근처에 추가
	const koCollator = (
		typeof Intl !== 'undefined' && (Intl as any).Collator ? new Intl.Collator('ko-KR', { numeric: true, sensitivity: 'base' }) : null
	) as Intl.Collator | null;

	const compareKr = (a?: string, b?: string) => {
		const A = a ?? '';
		const B = b ?? '';
		return koCollator ? koCollator.compare(A, B) : A.localeCompare(B, 'ko-KR');
	};

	const getFilteredData = (): MainDataType.Proverb[] => {
		let filtered = proverbList;

		if (filter === 'learned') {
			filtered = filtered.filter((c) => studyHistory.studyProverbes.includes(c.id));
		} else if (filter === 'learning') {
			filtered = filtered.filter((c) => !studyHistory.studyProverbes.includes(c.id));
		}

		const LEVEL_MAP: Record<string, number> = { '초급': 1, 중급: 2, 고급: 3, 특급: 4 };
		if (levelFilter !== '전체') {
			filtered = filtered.filter((item) => item.level === LEVEL_MAP[levelFilter]);
		}
		if (regionFilter !== '전체') {
			filtered = filtered.filter((c) => c.category === regionFilter);
		}

		// ✅ 여기서 'idiomKr' 기준으로 가나다 정렬
		return [...filtered].sort((a, b) => compareKr(a.proverb, b.proverb));
	};

	const resetCard = () => {
		setIsDetailFilterOpen(false); // 상세 필터 닫기
		setLevelOpen(false); // 드롭다운 강제 닫기
		setRegionOpen(false);
		setFilter('learning'); // 학습중으로 기본 필터 변경
		setLevelFilter('전체'); // 상세 필터 초기화
		setRegionFilter('전체');

		// ✅ 추가: 캐러셀 첫 번째로 이동
		runLater(() => {
			const data = getFilteredData();
			if (carouselRef.current && data.length > 0) {
				carouselRef.current?.scrollTo({ index: 0, animated: false });
			}
		}, 100); // dropDownPicker와 충돌을 피하기 위한 약간의 delay
	};

	const handleAnimatedButtonPress = (proverbId: number, action: () => void) => {
		if (!buttonAnimRefs.current[proverbId]) {
			buttonAnimRefs.current[proverbId] = new Animated.Value(1);
		}
		const buttonAnim = buttonAnimRefs.current[proverbId];

		Animated.sequence([
			Animated.timing(buttonAnim, {
				toValue: 0.95,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(buttonAnim, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start(() => {
			action(); // ✅ 애니메이션 끝난 후 콜백 실행
		});
	};

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const mascot = mascotImagesQueue.length > 0 ? mascotImagesQueue[index % mascotImagesQueue.length] : mascotImages[0];

		const proverbId = item.id;
		const isLearned = studyHistory.studyProverbes.includes(proverbId);

		if (!buttonAnimRefs.current[proverbId]) {
			buttonAnimRefs.current[proverbId] = new Animated.Value(1);
		}
		const buttonAnim = buttonAnimRefs.current[proverbId];
		// flipAnim 및 pressAnim 초기화
		const flipAnim = flipAnimRefs.current[proverbId] ?? new Animated.Value(0);
		const pressAnim = pressAnimRefs.current[proverbId] ?? new Animated.Value(1);
		const glowAnim = glowAnimRefs.current[proverbId] ?? new Animated.Value(0);

		if (!flipAnimRefs.current[proverbId]) {
			flipAnimRefs.current[proverbId] = flipAnim;
		}
		if (!pressAnimRefs.current[proverbId]) {
			pressAnimRefs.current[proverbId] = pressAnim;
		}
		if (!glowAnimRefs.current[proverbId]) {
			glowAnimRefs.current[proverbId] = glowAnim;
		}

		const handleCardPress = () => {
			if (isBackCardScrollingRef.current) {
				return;
			}
			Animated.parallel([
				Animated.sequence([
					Animated.timing(pressAnim, {
						toValue: 0.95,
						duration: 80,
						useNativeDriver: true,
					}),
					Animated.timing(pressAnim, {
						toValue: 1,
						duration: 80,
						useNativeDriver: true,
					}),
				]),
				Animated.sequence([
					Animated.timing(glowAnim, {
						toValue: 1,
						duration: 100,
						useNativeDriver: false, // shadow 관련은 false
					}),
					Animated.timing(glowAnim, {
						toValue: 0,
						duration: 300,
						useNativeDriver: false,
					}),
				]),
			]).start(() => {
				flipCard(proverbId); // 카드 flip 실행
			});
		};
		// ✅ rotateY(3D 회전)는 기기에 따라 뒷면 글씨가 거울 반전되어 깨지므로 사용하지 않음.
		//    앞/뒷면 모두 회전 없이 스케일 + 페이드(크로스페이드)로 전환 → 글씨가 항상 똑바로 보임.
		const frontScale = flipAnim.interpolate({ inputRange: [0, 90, 180], outputRange: [1, 0.97, 0.94] });
		const backScale = flipAnim.interpolate({ inputRange: [0, 90, 180], outputRange: [0.94, 0.97, 1] });
		const frontOpacity = flipAnim.interpolate({ inputRange: [0, 80, 90, 180], outputRange: [1, 1, 0, 0] });
		const backOpacity = flipAnim.interpolate({ inputRange: [0, 90, 100, 180], outputRange: [0, 0, 1, 1] });

		return (
			<View style={styles.cardWrapper}>
				<Pressable onPress={handleCardPress} style={styles.cardFront}>
					<Animated.View
						style={[
							styles.cardFace,
							{
								opacity: frontOpacity,
								transform: [{ scale: frontScale }],
								zIndex: flippedCard === proverbId ? 0 : 1, // 보이는 면이 위로
								position: 'absolute',
							},
						]}>
						<View style={styles.flagSection}>
							<View style={styles.flagContainer}>
								<FastImage source={mascot} style={styles.flagImageSquare} resizeMode="cover" />
							</View>
						</View>
						{flippedCard !== proverbId && (
							// JSX 내부
							<View style={styles.cardMiddle}>
								{/* 대표 속담: 가독성이 핵심이라 축소 하한(0.85)을 둬 안드로이드 과축소를 막는다 */}
								<Text style={styles.hanjaText} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.85}>
									{item.proverb}
								</Text>

								<View style={styles.badgeSection}>
									{/* 배지 + 태그 한 줄 */}
									<View style={styles.badgeInlineRow}>
										{/* 레벨 뱃지 */}
										<View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
											{getLevelIcon(item.level)}
											<Text style={[styles.badgeText, { marginLeft: SPACING_W.xs }]}>{LEVEL_NAME_MAP[item.level] || '알 수 없음'}</Text>
										</View>

										{/* 카테고리 뱃지 */}
										<View style={[styles.categoryBadge, { backgroundColor: getFieldColor(item.category) }]}>
											{getCategoryIcon(item.category)}
											<Text style={[styles.badgeText, { marginLeft: SPACING_W.xs }]}>{item.category || '미지정'}</Text>
										</View>

										{/* 태그 */}
										{/* {Array.isArray(item.tags) && item.tags.length > 0 && (
											<View style={styles.tagWrap}>
												{item.tags.map((t, i) => (
													<View key={i} style={styles.tagChip}>
														<Text style={styles.tagText}>#{t}</Text>
													</View>
												))}
											</View>
										)} */}
									</View>
								</View>

								{/* <Text style={styles.hangulText}>{item.hangul}</Text> */}
								<Text style={styles.cardHint}>카드를 탭하면 속담 정보가 나와요 👆</Text>
							</View>
						)}

						<TouchableOpacity
							style={[
								styles.button,
								{ width: '100%', alignSelf: 'center' }, // ✅ 수정된 부분
								isLearned ? styles.learnedButton : styles.learningButton,
								{ opacity: isButtonDisabled ? 0.6 : 1 },
							]}
							activeOpacity={0.8}
							onPress={(e) => {
								e.stopPropagation(); // ✅ 여기서 이벤트 버블링 차단
								if (isButtonDisabled) {
									return;
								}
								setIsButtonDisabled(true); // ✅ 중복 방지
								handleAnimatedButtonPress(proverbId, () => {
									completeStudy(proverbId);
									runLater(() => setIsButtonDisabled(false), 1000); // 1초 후 재활성화
								});
							}}
							disabled={isButtonDisabled}
							hitSlop={{ top: scaleHeight(10), bottom: scaleHeight(10), left: scaleWidth(10), right: scaleWidth(10) }} // 여유 클릭 범위
						>
							<Text style={styles.buttonText}>{isLearned ? '다시 학습하기' : '학습 완료'}</Text>
						</TouchableOpacity>
					</Animated.View>

					<Animated.View
						style={[
							styles.cardFace2,
							{
								opacity: backOpacity,
								transform: [{ scale: backScale }],
								borderWidth: 1,
								borderColor: COLORS.border,
								zIndex: flippedCard === proverbId ? 1 : 0, // 보이는 면이 위로
								position: 'absolute',
							},
						]}>
						<View style={styles.cardBackSurface}>
							<ScrollView
								ref={scrollViewRef}
								style={styles.cardBackScroll}
								onScrollBeginDrag={() => {
									isBackCardScrollingRef.current = true;
								}}
								onScrollEndDrag={() => {
									runLater(() => {
										isBackCardScrollingRef.current = false;
									}, 120);
								}}
								onMomentumScrollEnd={() => {
									isBackCardScrollingRef.current = false;
								}}
								contentContainerStyle={styles.cardBackScrollContent}
								nestedScrollEnabled
								removeClippedSubviews={false}
								showsVerticalScrollIndicator={true}>
								{/* <View style={[styles.badge, { backgroundColor: getLevelColor(item.level) }]}>
								<Text style={styles.badgeText}>{item.level}</Text>
							</View> */}

								<View style={styles.cardBackContainer}>
									{/* 제목 */}
									<Text style={styles.cardBackTitle}>{item.proverb}</Text>

									{/* 뜻 풀이 강조 박스 */}
									<View style={styles.meaningQuoteBox}>
										<IconComponent
											type="fontAwesome6"
											name="quote-left"
											size={scaledSize(24)}
											color={COLORS.primary}
											style={{ marginBottom: SPACING_H.sm }}
										/>
										<Text style={styles.meaningQuoteText}>{item.longMeaning}</Text>
									</View>
									{/* 예문 */}
									{item.example && (
										<View style={styles.exampleBox}>
											<Text style={styles.sectionTitle}>✍️ 예문</Text>
											{item.example.map((ex, idx) => (
												<Text key={idx} style={styles.sectionText}>
													• {ex.trim()}
												</Text>
											))}
										</View>
									)}
									{/* 같은 속담 */}
									{item.sameProverb && item.sameProverb.filter((sp) => sp.trim() !== '').length > 0 && (
										<View style={styles.sectionBox}>
											<Text style={styles.sectionTitle}>💬 동의 속담</Text>
											{item.sameProverb
												.filter((sp) => sp.trim() !== '')
												.map((sp, idx) => (
													<Text key={idx} style={styles.sectionText}>
														- {sp}
													</Text>
												))}
										</View>
									)}
								</View>

								{/* 뜻 풀이 */}
								{/* <View style={styles.meaningBox}>
										<Text style={styles.sectionContent}>💡 {item.meaning}</Text>
									</View> */}
								{/* 구성 한자 */}
								{/* <View style={styles.charList}>
										{item.characters.map((char, i) => (
											<View key={i} style={styles.charRow}>
												<Text style={styles.charMain}>{char.char}</Text>
												<Text style={styles.charMeaning}>{char.meaning}</Text>
												<Text style={styles.charSub}>
													({char.strokes}획, 부수: {char.radical})
												</Text>
											</View>
										))}
									</View> */}

								{/* 예문 */}
								{/* <View style={styles.exampleBox}>
										<Text style={styles.sectionTitle}>📝 예문</Text>
										<Text style={styles.sectionContent}>{item.example}</Text>
									</View> */}
							</ScrollView>
						</View>

						{/* ✅ 하단 버튼 영역 고정 */}
						<View style={styles.fixedBottomButton}>
							<TouchableOpacity
								style={[styles.button, isLearned ? styles.learnedButton : styles.learningButton, { opacity: isButtonDisabled ? 0.6 : 1 }]}
								activeOpacity={0.8}
								onPress={(e) => {
									e.stopPropagation(); // 필수!
									if (isButtonDisabled) {
										return;
									}
									setIsButtonDisabled(true);
									handleAnimatedButtonPress(proverbId, () => {
										completeStudy(proverbId);
										runLater(() => setIsButtonDisabled(false), 1000);
									});
								}}
								disabled={isButtonDisabled}
								hitSlop={{ top: scaleHeight(10), bottom: scaleHeight(10), left: scaleWidth(10), right: scaleWidth(10) }} // 여유 클릭 범위
							>
								<Text style={styles.buttonText}>{isLearned ? '다시 학습하기' : '학습 완료'}</Text>
							</TouchableOpacity>
						</View>
					</Animated.View>
				</Pressable>
			</View>
		);
	};

	// ================================================================================================================================================
	return (
		<>
			<SafeAreaView style={styles.main} edges={['top']}>
				<Animated.View
					style={[
						styles.container,
						{
							opacity: screenFadeAnim,
							transform: [
								{
									translateY: screenFadeAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [scaleHeight(12), 0],
									}),
								},
							],
						},
					]}>
					<View style={styles.progressHeader}>
						<View style={styles.progressTopRow}>
							<Text style={styles.progressTitle}>학습 현황</Text>
							<View style={styles.progressBadge}>
								<Text style={styles.progressBadgeText}>
									{studyHistory.studyProverbes.length} / {proverbList.length}
								</Text>
							</View>
						</View>

						<View style={styles.progressBarWrapper}>
							<View
								style={[
									styles.progressBarFill,
									{ width: isLoading ? '0%' : `${progress * 100}%`, backgroundColor: isLoading ? COLORS.textLight : COLORS.secondary },
								]}
							/>
						</View>

						{/* 기본 필터: 전체 / 학습 중 / 학습 완료 */}
						<View style={styles.filterContainer}>
							{['전체', '학습 중', '학습 완료'].map((label, i) => {
								const value = i === 0 ? 'all' : i === 1 ? 'learning' : 'learned';
								const isActive = filter === value;
								return (
									<TouchableOpacity
										key={label}
										onPress={() => setFilter(value)}
										activeOpacity={0.8}
										style={[styles.filterButton, isActive && styles.filterButtonActive]}>
										<Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
									</TouchableOpacity>
								);
							})}

							{/* 상세 열기 버튼 */}
							<TouchableOpacity
								onPress={() => {
									setIsDetailFilterOpen((prev) => {
										const newState = !prev;
										// 아코디언 닫히는 순간 드롭다운도 강제 닫기
										if (!newState) {
											setLevelOpen(false);
											setRegionOpen(false);
										} else {
											setLevelFilter('전체');
											setRegionFilter('전체');
										}
										return newState;
									});
								}}
								hitSlop={{ top: scaleHeight(8), bottom: scaleHeight(8), left: SPACING_W.sm, right: SPACING_W.sm }}
								style={styles.detailToggleButton}>
								<IconComponent type="materialIcons" name={isDetailFilterOpen ? 'expand-less' : 'expand-more'} size={scaledSize(24)} />
							</TouchableOpacity>
							{/* 🔻 초기화 버튼 추가 */}
							<TouchableOpacity
								onPress={resetCard}
								hitSlop={{ top: scaleHeight(8), bottom: scaleHeight(8), left: SPACING_W.sm, right: SPACING_W.sm }}
								style={styles.resetButton}>
								<IconComponent type="materialIcons" name="restart-alt" size={scaledSize(24)} color={COLORS.danger} />
							</TouchableOpacity>
						</View>

						{/* 상세 필터 아코디언 영역 */}
						{isDetailFilterOpen && (
							<Animated.View style={[styles.detailFilterWrapper, { height: detailFilterHeightAnim }]}>
								<View style={styles.subFilterRow}>
									<View style={{ flex: 1, zIndex: regionOpen ? 1000 : 2000 }}>
										{' '}
										{/* zIndex 역전 방지 */}
										<DropDownPicker
											open={isDetailFilterOpen && levelOpen}
											setOpen={setLevelOpen}
											value={levelFilter}
											setValue={setLevelFilter}
											items={LEVEL_DROPDOWN_ITEMS} // ✅ 아이콘이 포함된 항목 사용
											placeholder="난이도"
											style={styles.dropdown}
											textStyle={{
												fontSize: FONT_SIZES.md,
												color: COLORS.textStrong,
												fontWeight: '500',
											}}
											placeholderStyle={{ color: COLORS.textLight, fontSize: FONT_SIZES.md }}
											dropDownContainerStyle={styles.dropdownList}
											containerStyle={{ zIndex: 3000 }}
											zIndex={9999} // 높게 설정
											zIndexInverse={1000} // 반대 드롭다운일 경우 대비
											listMode="SCROLLVIEW" /* 스크롤뷰 모드로 변경 */
										/>
									</View>
									<View style={{ width: SPACING_W.sm }} />
									<View style={{ flex: 1, zIndex: levelOpen ? 1000 : 2000 }}>
										<DropDownPicker
											listMode="MODAL"
											open={isDetailFilterOpen && regionOpen}
											value={regionFilter}
											modalTitle="카테고리 선택"
											items={FIELD_DROPDOWN_ITEMS}
											setOpen={setRegionOpen}
											setValue={setRegionFilter}
											dropDownDirection="BOTTOM"
											scrollViewProps={{ nestedScrollEnabled: true }}
											style={styles.dropdownField}
											dropDownContainerStyle={{
												overflow: 'visible',
												zIndex: 3000,
												...styles.dropdownListField,
												maxHeight: scaleHeight(200),
											}}
											zIndex={5000}
											zIndexInverse={4000}
											containerStyle={{ zIndex: 5000 }}
											labelStyle={{ fontSize: FONT_SIZES.md, color: COLORS.textStrong }}
											iconContainerStyle={{ marginRight: SPACING_W.sm }}
											showArrowIcon={true}
											showTickIcon={false}
											renderListItem={({ item, onPress }) => (
												<TouchableOpacity
													//@ts-ignore
													onPress={() => onPress(item)}
													activeOpacity={0.8}
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														paddingVertical: SPACING_H.md,
														paddingHorizontal: SPACING_W.lg,
														borderBottomWidth: 1,
														borderBottomColor: COLORS.border,
													}}>
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: SPACING_W.md }}>
														{typeof item.icon === 'function' ? item.icon() : item.icon}
													</View>
													<Text style={{ fontSize: FONT_SIZES.mdPlus, color: COLORS.textStrong, flex: 1 }}>{item.label}</Text>
												</TouchableOpacity>
											)}
											modalProps={{
												animationType: 'fade',
												presentationStyle: 'overFullScreen',
												transparent: true,
											}}
											modalContentContainerStyle={{
												marginTop: '25%',
												width: '85%',
												alignSelf: 'center',
												maxHeight: scaleHeight(500),
												backgroundColor: COLORS.surface,
												borderWidth: 1,
												borderColor: COLORS.border,
												borderRadius: RADIUS.xl,
												paddingHorizontal: 0,
												paddingVertical: SPACING_H.xl,
												shadowColor: '#000',
												shadowOpacity: 0.08,
												shadowOffset: { width: 0, height: 2 },
												shadowRadius: 8,
												position: 'relative',
											}}
											modalTitleStyle={{
												fontSize: FONT_SIZES.lg,
												fontWeight: '700',
												color: COLORS.textStrong,
												textAlign: 'center',
												paddingVertical: SPACING_H.md,
												paddingHorizontal: SPACING_W.lg,
												paddingRight: scaleWidth(40),
											}}
											closeIconStyle={{
												marginTop: scaleHeight(3),
												width: scaleWidth(24),
												height: scaleWidth(24),
											}}
											closeIconContainerStyle={{
												position: 'absolute',
												right: SPACING_W.md,
												top: SPACING_H.md,
												padding: scaleWidth(4),
												zIndex: 1,
											}}
										/>
									</View>
								</View>
							</Animated.View>
						)}
					</View>

					{isLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={COLORS.secondary} />
							<Text style={styles.loadingText}>속담 정보를 불러오는 중...</Text>
						</View>
					) : getFilteredData().length === 0 ? (
						<View style={styles.emptyWrapper}>
							<Image source={require('@/assets/images/no-data.png')} style={styles.emptyImage} />
							<Text style={styles.emptyText}>
								{filter === 'learned'
									? '완료한 속담이 아직 없어요.\n학습 후 완료 버튼을 눌러보세요!'
									: filter === 'learning'
										? '진행 중인 속담이 없어요.\n다시 학습하기 버튼으로 시작해보세요!'
										: '등록된 속담이 없습니다.'}
							</Text>
						</View>
					) : (
						<>
							<Animated.View style={[styles.carouselContainer, { zIndex: 1, alignSelf: 'center' }]}>
								{!(Platform.OS === 'android' && (showGuideModal || badgeModalVisible || showExitModal)) && (
									<Carousel
										ref={carouselRef}
										width={scaleWidth(370)}
										height={screenHeight * 0.65}
										// @ts-ignore
										data={getFilteredData()}
										renderItem={renderItem}
										mode="parallax"
										loop={false}
										windowSize={3}
										pagingEnabled={true}
										scrollAnimationDuration={600}
										modeConfig={{
											parallaxScrollingScale: 0.92,
											parallaxScrollingOffset: 30,
											parallaxAdjacentItemScale: 0.9,
										}}
										onSnapToItem={() => {
											Object.values(flipAnimRefs.current).forEach((anim) => {
												Animated.timing(anim, {
													toValue: 0,
													duration: 100,
													useNativeDriver: true,
												}).start();
											});
											setFlippedCard(null);
										}}
									/>
								)}
							</Animated.View>
						</>
					)}
					<View style={styles.studyEndWrapper}>
						<TouchableOpacity
							style={styles.studyEndButton}
							activeOpacity={0.8}
							onPress={() => {
								setLevelOpen(false);
								setRegionOpen(false);
								runLater(() => {
									setShowExitModal(true); // ✅ 약간의 delay를 주면 Modal 정상 출력
								}, 200);
							}}>
							<Text style={styles.studyEndText}>학습 종료</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>
			</SafeAreaView>

			<Modal visible={showExitModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.exitModalBox}>
						{/* 헤더 아이콘 + 타이틀 */}
						<View style={styles.exitHeader}>
							<IconComponent
								type="FontAwesome6"
								name="circle-xmark"
								size={scaledSize(isTablet ? 42 : 32)}
								color={COLORS.danger}
								style={{ marginBottom: SPACING_H.sm }}
							/>
							<Text style={[styles.exitTitle, isTablet && { fontSize: FONT_SIZES.heading, lineHeight: scaledSize(32) }]}>
								진행 중인 학습을 종료하시겠어요?
							</Text>
						</View>

						{/* 본문 */}
						<Text style={[styles.exitSub, isTablet && { fontSize: FONT_SIZES.lg, lineHeight: scaledSize(24) }]}>
							학습 기록은 저장되지 않으며, 홈 화면으로 이동합니다.
						</Text>

						{/* 버튼 */}
						<View style={styles.exitButtonRow}>
							<TouchableOpacity
								style={[styles.exitButton, { backgroundColor: COLORS.surfaceAlt }]}
								activeOpacity={0.8}
								onPress={() => setShowExitModal(false)}>
								<Text style={[styles.exitButtonText, { color: COLORS.text }]}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.exitButton, { backgroundColor: COLORS.danger }]}
								activeOpacity={0.8}
								onPress={() => {
									setShowExitModal(false);
									navigation.goBack();
								}}>
								<Text style={styles.exitButtonText}>종료하기</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{showToast &&
				(() => {
					const isComplete = typeof completedCardId === 'number' && (studyHistory.studyProverbes ?? []).includes(completedCardId);
					const accent = isComplete ? COLORS.primary : COLORS.secondary;
					const accentSoft = isComplete ? COLORS.primarySoft : COLORS.secondarySoft;
					const learnedCount = (studyHistory.studyProverbes ?? []).length;
					const totalCount = proverbList.length;
					const pct = totalCount > 0 ? Math.min(Math.round((learnedCount / totalCount) * 100), 100) : 0;
					return (
						<View style={styles.toastWrapper} pointerEvents="none">
							<Animated.View
								style={[
									styles.toastCard,
									{
										opacity: toastAnim,
										transform: [
											{
												translateY: toastAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [scaleHeight(28), 0],
												}),
											},
											{
												scale: toastAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [0.9, 1],
												}),
											},
										],
									},
								]}>
								{/* 상단 상태 칩 */}
								<View style={[styles.toastPill, { backgroundColor: accentSoft }]}>
									<IconComponent type="materialIcons" name={isComplete ? 'check-circle' : 'menu-book'} size={scaledSize(13)} color={accent} />
									<Text style={[styles.toastPillText, { color: accent }]}>{isComplete ? '학습 완료' : '복습 시작'}</Text>
								</View>

								{/* 마스코트 (은은한 헤일로) */}
								<View style={[styles.toastHalo, { backgroundColor: accentSoft }]}>
									<View style={[styles.toastHaloInner, { borderColor: accent }]}>
										<Image source={completionImages} style={styles.toastMascot} />
									</View>
								</View>

								{/* 칭찬 문구 */}
								<Text style={styles.toastPraise}>{praiseText}</Text>

								{/* 학습 진행도 */}
								<View style={styles.toastProgressRow}>
									<Text style={styles.toastProgressLabel}>학습 진행</Text>
									<Text style={[styles.toastProgressValue, { color: accent }]}>
										{learnedCount} / {totalCount}
										<Text style={styles.toastProgressPct}> · {pct}%</Text>
									</Text>
								</View>
								<View style={styles.toastProgressTrack}>
									<View style={[styles.toastProgressFill, { backgroundColor: accent, width: `${pct}%` }]} />
								</View>
							</Animated.View>
						</View>
					);
				})()}

			<NewBadgeModal visible={badgeModalVisible} badges={newlyEarnedBadges} onConfirm={() => setBadgeModalVisible(false)} />
		</>
	);
};
const styles = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: COLORS.surface,
	},
	container: {
		flex: 1,
		backgroundColor: COLORS.surface,
	},
	cardWrapper: {
		height: scaleHeight(812 * 0.7),
		width: '100%',
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	cardFront: {
		width: scaleWidth(370), // ✅ 내부 카드(cardFace)와 같은 크기로
		height: CARD_HEIGHT, // ✅ 앞/뒷면(cardFace)과 동일 높이로 맞춰 크로스페이드 중 빈 영역 방지
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.surface, // ✅ 플립 전환 중에도 카드 영역이 항상 흰색으로 가득 채워지도록
		alignItems: 'center',
		justifyContent: 'center',
	},
	flagContainer: {
		width: isTablet ? scaleWidth(180) : scaleWidth(260),
		height: isTablet ? scaleWidth(160) : scaleWidth(260),
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.md,
		overflow: 'hidden',
		borderColor: COLORS.border,
		borderWidth: 1,
	},
	progressHeader: {
		paddingTop: SPACING_H.md,
		backgroundColor: COLORS.surface,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingBottom: 0,
		marginHorizontal: SPACING_W.lg,
	},
	progressTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.xs,
	},
	progressTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginRight: SPACING_W.sm,
	},
	progressBadge: {
		backgroundColor: COLORS.secondary,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.round,
	},
	progressBadgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: SPACING_H.md,
	},
	filterButton: {
		borderWidth: 1,
		borderColor: COLORS.secondary,
		borderRadius: RADIUS.round,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.md,
		marginHorizontal: SPACING_W.xs,
		backgroundColor: COLORS.surface,
		minHeight: scaleHeight(32),
		justifyContent: 'center',
		marginBottom: SPACING_H.md,
	},

	filterText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.secondary,
		fontWeight: '600',
		lineHeight: scaledSize(18),
		textAlign: 'center',
	},
	filterButtonActive: {
		backgroundColor: COLORS.secondary,
	},
	filterTextActive: {
		color: COLORS.textWhite,
	},
	button: {
		height: scaleHeight(50),
		marginTop: SPACING_H.lg,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.secondary,
		justifyContent: 'center',
		alignItems: 'center', // ✅ 변경 (기존 `alignContent` → `alignItems`)
		width: '100%', // ✅ 항상 100% 사용
		alignSelf: 'center', // ✅ 중앙 정렬
	},
	learnedButton: {
		backgroundColor: COLORS.warning,
	},
	learningButton: {
		backgroundColor: COLORS.primary,
	},
	buttonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		letterSpacing: 0.5,
		textAlign: 'center',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: scaleHeight(40),
	},
	loadingText: {
		marginTop: SPACING_H.md,
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		lineHeight: scaledSize(21),
	},
	progressBarWrapper: {
		width: '80%',
		height: scaleHeight(10),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
		marginTop: SPACING_H.sm,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.secondary,
	},
	carouselContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardFace: {
		width: scaleWidth(370),
		height: CARD_HEIGHT, // ✅ 여기 반영
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		justifyContent: 'space-between',
		alignSelf: 'center',
		borderWidth: 1,
		borderColor: COLORS.border, // ✅ 테두리 추가
	},

	cardFace2: {
		width: scaleWidth(370),
		height: CARD_HEIGHT, // ✅ 여기 반영
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.sm,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		justifyContent: 'space-between',
		alignSelf: 'center',
	},
	cardBackSurface: {
		flex: 1,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.md,
		overflow: 'hidden',
	},
	cardBackScroll: {
		flex: 1,
		backgroundColor: COLORS.surface,
	},
	cardBackScrollContent: {
		paddingTop: SPACING_H.xs,
		paddingHorizontal: 0,
		paddingBottom: scaleHeight(80),
		flexGrow: 1,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim, // 어두운 배경 복원
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 99999,
	},
	flagSection: {
		position: 'relative',
		width: '100%',
		height: IMAGE_HEIGHT, // ✅ 조건부 높이 적용
		alignItems: 'center',
		marginBottom: SPACING_H.md, // 👈 이미지 아래 공간 확보
	},
	cardHint: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		lineHeight: scaledSize(21),
		textAlign: 'center',
		marginTop: SPACING_H.lg,
	},
	toastCard: {
		width: scaleWidth(300),
		maxWidth: '88%',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		paddingTop: SPACING_H.lg,
		paddingBottom: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	toastPill: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	toastPillText: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
	},
	toastHalo: {
		width: scaleWidth(88),
		height: scaleWidth(88),
		borderRadius: scaleWidth(88) / 2,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.md,
	},
	toastHaloInner: {
		width: scaleWidth(70),
		height: scaleWidth(70),
		borderRadius: scaleWidth(70) / 2,
		backgroundColor: COLORS.surface,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	toastMascot: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: RADIUS.md,
	},
	toastPraise: {
		alignSelf: 'stretch', // ✅ 카드 폭에 맞춰 줄바꿈 (긴 문구 오른쪽 잘림 방지)
		width: '100%',
		flexShrink: 1,
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
		lineHeight: scaledSize(20),
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: SPACING_H.md,
	},
	toastProgressRow: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: SPACING_H.xs,
	},
	toastProgressLabel: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		color: COLORS.textLight,
	},
	toastProgressValue: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
	toastProgressPct: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		color: COLORS.textLight,
	},
	toastProgressTrack: {
		width: '100%',
		height: scaleHeight(7),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
		overflow: 'hidden',
	},
	toastProgressFill: {
		height: '100%',
		borderRadius: RADIUS.round,
	},
	toastWrapper: {
		// 전체화면 중앙 오버레이 (퍼센트 top 제거 → 위치 어긋남/잘림 방지)
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999,
	},
	emptyWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
		backgroundColor: COLORS.background,
	},
	emptyImage: {
		width: scaleWidth(140),
		height: scaleWidth(140),
		marginBottom: SPACING_H.xl,
		opacity: 0.6,
	},
	emptyText: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.textSecondary,
		textAlign: 'center',
		lineHeight: scaledSize(24),
	},
	detailToggleButton: {
		marginLeft: SPACING_W.sm,
		padding: scaleWidth(4),
		marginBottom: SPACING_H.md,
	},
	detailFilterWrapper: {
		width: '100%',
		backgroundColor: COLORS.surface,
		paddingTop: 0,
		paddingHorizontal: SPACING_W.lg,
		zIndex: 9999,
	},
	subFilterRow: {
		flexDirection: 'row',
	},
	resetButton: {
		marginLeft: SPACING_W.sm,
		padding: scaleWidth(4),
		marginBottom: SPACING_H.md,
	},
	dropdown: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
	},
	dropdownList: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: RADIUS.md,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		paddingBottom: 0,
		marginBottom: 0,
	},
	studyEndWrapper: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: SPACING_H.md,
		paddingBottom: scaleHeight(Platform.OS === 'android' ? 30 : 20), // ← 이 부분을 조정
		borderTopWidth: 1,
		borderColor: COLORS.border,
	},
	studyEndButton: {
		backgroundColor: COLORS.surfaceAlt,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xxl,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	studyEndText: {
		color: COLORS.textSecondary,
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
	},
	exitModalBox: {
		width: '80%',
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.xl,
		paddingVertical: SPACING_H.xl,
		borderRadius: RADIUS.xl,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	exitHeader: {
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	exitTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
		textAlign: 'center',
		lineHeight: scaledSize(26),
	},
	exitSub: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.xl,
		textAlign: 'center',
		lineHeight: scaledSize(21),
	},
	exitButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		columnGap: SPACING_W.sm,
		width: '100%',
		marginTop: SPACING_H.xs,
	},
	exitButton: {
		flex: 1,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: scaleHeight(44),
	},
	exitButtonText: {
		color: COLORS.textWhite,
		fontWeight: '700',
		fontSize: FONT_SIZES.mdPlus,
	},
	cardMiddle: {
		flex: 1,
		marginTop: scaleHeight(70),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 0, // ✅ 좌우 여백은 cardFace(SPACING_W.lg)에서 일괄 처리
		width: '100%', // ✅ 부모 크기에 맞추기
	},

	fixedBottomButton: {
		position: 'absolute',
		bottom: SPACING_H.xl,
		left: 0,
		right: 0,
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg, // ➕ 앞면 카드와 동일한 좌우 여백
	},
	flagImageSquare: {
		// width: '100%',
		width: '100%',
		aspectRatio: 1, // 정사각형
		alignSelf: 'center',
	},
	hanjaText: {
		fontSize: FONT_SIZES.display,
		fontWeight: '700',
		color: COLORS.textStrong,
		textAlign: 'center',
		lineHeight: scaledSize(38),
		marginBottom: SPACING_H.md,
		letterSpacing: 1, // ✅ 기존보다 줄임
		flexShrink: 1, // ✅ 넘칠 경우 줄이도록
		width: '100%', // ✅ 부모 영역 꽉 차게
	},

	hangulText: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.textSecondary,
		fontWeight: '500',
		textAlign: 'center',
		lineHeight: scaledSize(24),
		marginBottom: SPACING_H.sm,
	},
	badgeSection: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		marginBottom: SPACING_H.md,
	},
	cardBackContainer: {
		flexGrow: 1,
		paddingHorizontal: SPACING_W.sm,
		paddingTop: SPACING_H.md,
		paddingBottom: SPACING_H.xl,
		backgroundColor: COLORS.surface, // 더 깔끔한 흰색 배경
		borderRadius: RADIUS.md,
		width: '100%',
	},

	sectionTitle: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textStrong,
		lineHeight: scaledSize(22),
		marginBottom: SPACING_H.sm,
	},

	meaningBox: {
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.warningBg, // 밝은 크림색
		borderWidth: 1,
		borderColor: COLORS.warning, // 옅은 옐로 보더
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.md,
	},

	exampleBox: {
		backgroundColor: COLORS.secondaryBg, // 연한 하늘색
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.md,
	},

	sectionContent: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.text,
		lineHeight: scaledSize(23),
		textAlign: 'left',
	},

	cardBackTitle: {
		fontSize: FONT_SIZES.title,
		fontWeight: '700',
		color: COLORS.secondaryDark,
		textAlign: 'center',
		lineHeight: scaledSize(34),
		marginBottom: SPACING_H.lg,
	},
	dropdownField: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
	},
	dropdownListField: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: RADIUS.md,
	},
	sectionBox: {
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		marginBottom: SPACING_H.md,
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 8,
	},
	sectionText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(21),
		marginBottom: SPACING_H.xs,
	},
	meaningQuoteBox: {
		alignItems: 'center', // 중앙 정렬
		justifyContent: 'center',
		backgroundColor: COLORS.secondaryBg, // 파란색 계열 배경
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		marginBottom: SPACING_H.md,
	},

	meaningQuoteText: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '600',
		color: COLORS.text,
		lineHeight: scaledSize(24),
		textAlign: 'center', // 텍스트도 중앙 정렬
	},
	badgeInlineRow: {
		flexDirection: 'row',
		alignItems: 'center', // 세로 중앙
		justifyContent: 'center',
		flexWrap: 'wrap',
		columnGap: SPACING_W.sm,
		rowGap: SPACING_H.sm,
		width: '100%',
	},
	levelBadge: {
		flexDirection: 'row',
		alignItems: 'center', // 세로 중앙 고정
		justifyContent: 'center',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	categoryBadge: {
		flexDirection: 'row',
		alignItems: 'center', // 세로 중앙 고정
		justifyContent: 'center',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	badgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '600',
	},
	tagWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap', // ✅ 태그도 여러 줄
		justifyContent: 'center', // ✅ 중앙 모으기
	},
	tagChip: {
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
		marginRight: SPACING_W.xs,
	},

	tagText: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '600',
		color: COLORS.text,
	},
});

export default QuizStudyScreen;
