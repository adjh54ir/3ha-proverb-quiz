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
import ConfettiCannon from 'react-native-confetti-cannon';
import DropDownPicker from 'react-native-dropdown-picker';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StudyBadgeInterceptor } from '@/services/interceptor/StudyBadgeInterceptor';
import { CONST_BADGES } from '@/const/ConstBadges';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import ProverbServices from '@/services/ProverbServices';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	iconType: 'FontAwesome6',
	badgeId: '',
	iconName: 'clipboard-list',
	iconColor: '#3498db',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={16} color="#555" />,
	labelStyle: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
	},
};
const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '아주 쉬움',
		value: '아주 쉬움',
		icon: () => <IconComponent type="FontAwesome6" name="seedling" size={16} color="#85C1E9" />,
	},
	{
		label: '쉬움',
		value: '쉬움',
		icon: () => <IconComponent type="FontAwesome6" name="leaf" size={16} color="#F4D03F" />,
	},
	{
		label: '보통',
		value: '보통',
		icon: () => <IconComponent type="FontAwesome6" name="tree" size={16} color="#EB984E" />,
	},
	{
		label: '어려움',
		value: '어려움',
		icon: () => <IconComponent type="FontAwesome6" name="trophy" size={16} color="#E74C3C" />,
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
		iconColor: '#81ecec',
		icon: () => <IconComponent type="FontAwesome6" name="dice" size={16} color="#81ecec" />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		badgeId: 'category_relation',
		iconType: 'FontAwesome6',
		iconName: 'users',
		iconColor: '#a29bfe',
		icon: () => <IconComponent type="FontAwesome6" name="users" size={16} color="#a29bfe" />,
	},
	{
		label: '세상 이치',
		value: '세상 이치',
		badgeId: 'category_world',
		iconType: 'FontAwesome5',
		iconName: 'globe',
		iconColor: '#fdcb6e',
		icon: () => <IconComponent type="FontAwesome5" name="globe" size={16} color="#fdcb6e" />,
	},
	{
		label: '근면/검소',
		value: '근면/검소',
		badgeId: 'category_diligence',
		iconType: 'FontAwesome5',
		iconName: 'hammer',
		iconColor: '#fab1a0',
		icon: () => <IconComponent type="FontAwesome5" name="hammer" size={16} color="#fab1a0" />,
	},
	{
		label: '노력/성공',
		value: '노력/성공',
		badgeId: 'category_success',
		iconType: 'FontAwesome5',
		iconName: 'medal',
		iconColor: '#55efc4',
		icon: () => <IconComponent type="FontAwesome5" name="medal" size={16} color="#55efc4" />,
	},
	{
		label: '경계/조심',
		value: '경계/조심',
		badgeId: 'category_caution',
		iconType: 'FontAwesome5',
		iconName: 'exclamation-triangle',
		iconColor: '#ff7675',
		icon: () => <IconComponent type="FontAwesome5" name="exclamation-triangle" size={16} color="#ff7675" />,
	},
	{
		label: '욕심/탐욕',
		value: '욕심/탐욕',
		badgeId: 'category_greed',
		iconType: 'FontAwesome5',
		iconName: 'hand-holding-usd',
		iconColor: '#fd79a8',
		icon: () => <IconComponent type="FontAwesome5" name="hand-holding-usd" size={16} color="#fd79a8" />,
	},
	{
		label: '배신/불신',
		value: '배신/불신',
		badgeId: 'category_betrayal',
		iconType: 'FontAwesome5',
		iconName: 'user-slash',
		iconColor: '#b2bec3',
		icon: () => <IconComponent type="FontAwesome5" name="user-slash" size={16} color="#b2bec3" />,
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
const DETAIL_FILTER_HEIGHT = 60;
const IMAGE_HEIGHT = isAndroid ? scaleHeight(220) : scaleHeight(200);
const QuizStudyScreen = () => {
	const STORAGE_KEY = MainStorageKeyType.USER_STUDY_HISTORY;
	const completionImages = require('@/assets/images/cheer-up.png');

	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const scrollViewRef = useRef<ScrollView>(null);
	const carouselRef = useRef<any>(null);
	const toastAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const detailFilterHeightAnim = useRef(new Animated.Value(0)).current;
	const flipAnimRefs = useRef<Record<string, Animated.Value>>({});
	const pressAnimRefs = useRef<Record<string, Animated.Value>>({});
	const glowAnimRefs = useRef<Record<string, Animated.Value>>({});
	const buttonAnimRefs = useRef<Record<string, Animated.Value>>({});

	const [mascotImagesQueue, setMascotImagesQueue] = useState<number[]>([]);
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
	const [levelFilter, setLevelFilter] = useState<'전체' | '아주 쉬움' | '쉬움' | '보통' | '어려움'>('전체');
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);
	const [regionFilter, setRegionFilter] = useState<string>('전체');
	const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false);
	const [levelOpen, setLevelOpen] = useState(false);
	const [regionOpen, setRegionOpen] = useState(false);
	const [confettiKey, setConfettiKey] = useState(0);
	const [showExitModal, setShowExitModal] = useState(false);

	const progress = proverbList.length > 0 ? (studyHistory.studyProverbes ?? []).length / proverbList.length : 0;

	useEffect(() => {
		// 앱 시작할 때 미리 10개 랜덤 뽑기
		const randomMascots = Array.from({ length: 10 }, () => mascotImages[Math.floor(Math.random() * mascotImages.length)]);
		setMascotImagesQueue(randomMascots);
	}, []);

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
					style={{ marginRight: 16 }}>
					<IconComponent type="materialIcons" name="info-outline" size={24} color="#3498db" />
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
		Animated.timing(detailFilterHeightAnim, {
			toValue: isDetailFilterOpen ? DETAIL_FILTER_HEIGHT : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [isDetailFilterOpen]);

	useEffect(() => {
		// 뱃지 모달 열릴 때 애니메이션 및 빵빠레 실행
		if (badgeModalVisible) {
			setConfettiKey(Math.random());
			scaleAnim.setValue(0);
			Animated.spring(scaleAnim, {
				toValue: 1,
				bounciness: 12,
				useNativeDriver: true,
			}).start();
		}
	}, [badgeModalVisible]);

	useEffect(() => {
		if (carouselRef.current && getFilteredData().length > 0) {
			carouselRef.current?.scrollTo({ index: 0, animated: false });
			setFlippedCard(null);
			setCompletedCardId(null); // ✅ 추가
		}
	}, [levelFilter, regionFilter]);

	useEffect(() => {
		if (isFocused) {
			fetchData();
		}
	}, []);

	// 레벨 이름/숫자 매핑(재사용용)
	const LEVEL_NAME_MAP: Record<number, '아주 쉬움' | '쉬움' | '보통' | '어려움'> = {
		1: '아주 쉬움',
		2: '쉬움',
		3: '보통',
		4: '어려움',
	};
	// 레벨 색상
	const getLevelColor = (level: number) => {
		const levelColorMap: Record<number, string> = {
			1: '#2ecc71', // 아주 쉬움
			2: '#F4D03F', // 쉬움
			3: '#EB984E', // 보통
			4: '#E74C3C', // 어려움
		};
		return levelColorMap[level] || '#b2bec3';
	};

	// 카테고리 색상
	const getFieldColor = (field?: string) => {
		const categoryColorMap: Record<string, string> = {
			신체: '#ff7675',
			음식: '#fdcb6e',
			동물: '#55efc4',
			'언어/표현': '#74b9ff',
			'감정/분위기': '#e17055',
			'행동/태도': '#00cec9',
			'재물/비유': '#fab1a0',
			기타: '#b2bec3',
		};
		return field ? categoryColorMap[field] || '#b2bec3' : '#b2bec3';
	};

	// 레벨 아이콘
	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type="FontAwesome6" name="seedling" size={14} color="#fff" />;
			case 2:
				return <IconComponent type="FontAwesome6" name="leaf" size={14} color="#fff" />;
			case 3:
				return <IconComponent type="FontAwesome6" name="tree" size={14} color="#fff" />;
			case 4:
				return <IconComponent type="FontAwesome6" name="trophy" size={14} color="#fff" />;
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
		return matched ? <IconComponent type={matched.iconType} name={matched.iconName} size={14} color="#fff" /> : null;
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
			if (currentIndex !== -1) {
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
			setTimeout(() => {
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

		if (newBadges.length > 0) {
			const earnedBadges = CONST_BADGES.filter((b) => newBadges.includes(b.id));
			setNewlyEarnedBadges(earnedBadges);
			setBadgeModalVisible(true);

			updatedHistory.badges = [...new Set([...currentBadges, ...newBadges])];
		}

		AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
		setter(updatedHistory);
	};

	const showEncourageToast = () => {
		setShowToast(true);
		Animated.timing(toastAnim, {
			toValue: 1,
			duration: 100,
			useNativeDriver: true,
		}).start(() => {
			setTimeout(() => {
				Animated.timing(toastAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}).start(() => setShowToast(false));
			}, 1500); // 보여지는 시간
		});
	};

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

		const LEVEL_MAP: Record<string, number> = { '아주 쉬움': 1, 쉬움: 2, 보통: 3, 어려움: 4 };
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
		setTimeout(() => {
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
		const mascot = mascotImagesQueue[index % mascotImagesQueue.length];

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
		const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
		const backInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

		return (
			<View style={styles.cardWrapper}>
				<Pressable onPress={handleCardPress} style={styles.cardFront}>
					<Animated.View
						style={[
							styles.cardFace,
							{
								// height: CARD_HEIGHT,
								transform: [{ rotateY: frontInterpolate }],
								backfaceVisibility: 'hidden', // 추가
								// zIndex: flippedCard === proverbId ? 0 : 1, // 앞면 위
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
								<Text style={styles.hanjaText} numberOfLines={3} adjustsFontSizeToFit>
									{item.proverb}
								</Text>

								<View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: scaleHeight(12) }}>
									{/* 배지 + 태그 한 줄 */}
									<View style={styles.badgeInlineRow}>
										{/* 레벨 뱃지 */}
										<View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
											{getLevelIcon(item.level)}
											<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>{LEVEL_NAME_MAP[item.level] || '알 수 없음'}</Text>
										</View>

										{/* 카테고리 뱃지 */}
										<View style={[styles.categoryBadge, { backgroundColor: getFieldColor(item.category) }]}>
											{getCategoryIcon(item.category)}
											<Text style={[styles.badgeText, { marginLeft: scaleWidth(4) }]}>{item.category || '미지정'}</Text>
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
							onPress={(e) => {
								e.stopPropagation(); // ✅ 여기서 이벤트 버블링 차단
								if (isButtonDisabled) {
									return;
								}
								setIsButtonDisabled(true); // ✅ 중복 방지
								handleAnimatedButtonPress(proverbId, () => {
									completeStudy(proverbId);
									setTimeout(() => setIsButtonDisabled(false), 1000); // 1초 후 재활성화
								});
							}}
							disabled={isButtonDisabled}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 여유 클릭 범위
						>
							<Text style={styles.buttonText}>{isLearned ? '다시 학습하기' : '학습 완료'}</Text>
						</TouchableOpacity>
					</Animated.View>

					<Animated.View
						style={[
							styles.cardFace2,
							{
								transform: [{ rotateY: backInterpolate }],
								backfaceVisibility: 'hidden',
								borderWidth: 1, // 👈 추가
								borderColor: '#ddd', // 👈 추가
								position: 'absolute',
							},
						]}>
						<View style={{ flex: 1 }}>
							<ScrollView
								ref={scrollViewRef}
								style={{ flex: 1 }}
								contentContainerStyle={{
									paddingVertical: scaleHeight(0),
									paddingHorizontal: 0,
									flexGrow: 1,
									minHeight: scaleHeight(520),
								}}
								removeClippedSubviews={false}
								showsVerticalScrollIndicator={false}>
								{/* <View style={[styles.badge, { backgroundColor: getLevelColor(item.level) }]}>
								<Text style={styles.badgeText}>{item.level}</Text>
							</View> */}

								<View style={styles.cardBackContainer}>
									{/* 제목 */}
									<Text style={styles.cardBackTitle}>{item.proverb}</Text>

									{/* 뜻 풀이 강조 박스 */}
									<View style={styles.meaningQuoteBox}>
										<IconComponent type="fontAwesome6" name="quote-left" size={28} color="#58D68D" style={{ marginBottom: scaleHeight(8) }} />
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
								onPress={(e) => {
									e.stopPropagation(); // 필수!
									if (isButtonDisabled) {
										return;
									}
									setIsButtonDisabled(true);
									handleAnimatedButtonPress(proverbId, () => {
										completeStudy(proverbId);
										setTimeout(() => setIsButtonDisabled(false), 1000);
									});
								}}
								disabled={isButtonDisabled}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 여유 클릭 범위
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
				<View style={styles.container}>
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
							<View style={[styles.progressBarFill, { width: isLoading ? '0%' : `${progress * 100}%`, backgroundColor: isLoading ? '#ccc' : '#4a90e2' }]} />
						</View>

						{/* 기본 필터: 전체 / 학습 중 / 학습 완료 */}
						<View style={styles.filterContainer}>
							{['전체', '학습 중', '학습 완료'].map((label, i) => {
								const value = i === 0 ? 'all' : i === 1 ? 'learning' : 'learned';
								const isActive = filter === value;
								return (
									<TouchableOpacity key={label} onPress={() => setFilter(value)} style={[styles.filterButton, isActive && styles.filterButtonActive]}>
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
								style={styles.detailToggleButton}>
								<IconComponent type="materialIcons" name={isDetailFilterOpen ? 'expand-less' : 'expand-more'} size={24} />
							</TouchableOpacity>
							{/* 🔻 초기화 버튼 추가 */}
							<TouchableOpacity onPress={resetCard} style={styles.resetButton}>
								<IconComponent type="materialIcons" name="restart-alt" size={24} color="#e74c3c" />
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
												fontSize: scaledSize(14), // 더 작게
												color: '#2c3e50',
												fontWeight: '500',
											}}
											placeholderStyle={{ color: '#95a5a6', fontSize: scaledSize(14) }}
											dropDownContainerStyle={styles.dropdownList}
											containerStyle={{ zIndex: 3000 }}
											zIndex={9999} // 높게 설정
											zIndexInverse={1000} // 반대 드롭다운일 경우 대비
											listMode="SCROLLVIEW" /* 스크롤뷰 모드로 변경 */
										/>
									</View>
									<View style={{ width: 8 }} />
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
											labelStyle={{ fontSize: scaledSize(14), color: '#2c3e50' }}
											iconContainerStyle={{ marginRight: scaleWidth(8) }}
											showArrowIcon={true}
											showTickIcon={false}
											renderListItem={({ item, onPress }) => (
												<TouchableOpacity
													//@ts-ignore
													onPress={() => onPress(item)}
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														paddingVertical: scaleHeight(14),
														paddingHorizontal: scaleWidth(16),
														borderBottomWidth: 1,
														borderBottomColor: '#f0f0f0',
													}}>
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: scaleWidth(12) }}>
														{typeof item.icon === 'function' ? item.icon() : item.icon}
													</View>
													<Text style={{ fontSize: scaledSize(15), color: '#2c3e50', flex: 1 }}>{item.label}</Text>
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
												backgroundColor: '#fff',
												borderWidth: 1,
												borderColor: '#ccc',
												borderRadius: scaleWidth(20),
												paddingHorizontal: 0,
												paddingVertical: scaleHeight(20),
												shadowColor: '#000',
												shadowOpacity: 0.15,
												shadowOffset: { width: 0, height: 6 },
												shadowRadius: scaleWidth(8),
												position: 'relative',
											}}
											modalTitleStyle={{
												fontSize: scaledSize(16),
												fontWeight: 'bold',
												color: '#2d3436',
												textAlign: 'center',
												paddingVertical: scaleHeight(12),
												paddingHorizontal: scaleWidth(16),
												paddingRight: scaleWidth(40),
											}}
											closeIconStyle={{
												marginTop: scaleHeight(3),
												width: scaleWidth(24),
												height: scaleWidth(24),
											}}
											closeIconContainerStyle={{
												position: 'absolute',
												right: scaleWidth(12),
												top: scaleHeight(12),
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
							<ActivityIndicator size="large" color="#4a90e2" />
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
							onPress={() => {
								setLevelOpen(false);
								setRegionOpen(false);
								setTimeout(() => {
									setShowExitModal(true); // ✅ 약간의 delay를 주면 Modal 정상 출력
								}, 200);
							}}>
							<Text style={styles.studyEndText}>학습 종료</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>

			<Modal visible={showExitModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.exitModalBox}>
						{/* 헤더 아이콘 + 타이틀 */}
						<View style={styles.exitHeader}>
							<IconComponent type="FontAwesome6" name="circle-xmark" size={isTablet ? 42 : 32} color="#e74c3c" style={{ marginBottom: scaleHeight(8) }} />
							<Text style={[styles.exitTitle, isTablet && { fontSize: scaledSize(22) }]}>진행 중인 학습을 종료하시겠어요?</Text>
						</View>

						{/* 본문 */}
						<Text style={[styles.exitSub, isTablet && { fontSize: scaledSize(16), lineHeight: scaleHeight(24) }]}>
							학습 기록은 저장되지 않으며, 홈 화면으로 이동합니다.
						</Text>

						{/* 버튼 */}
						<View style={styles.exitButtonRow}>
							<TouchableOpacity style={[styles.exitButton, { backgroundColor: '#95a5a6' }]} onPress={() => setShowExitModal(false)}>
								<Text style={styles.exitButtonText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.exitButton, { backgroundColor: '#e74c3c' }]}
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

			{showToast && (
				<View style={styles.toastWrapper}>
					<Animated.View
						style={[
							styles.toastContainer,
							{
								opacity: toastAnim,
								transform: [
									{
										translateY: toastAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [-50, 0],
										}),
									},
								],
							},
						]}>
						<View style={styles.toastInner}>
							<Image source={completionImages} style={styles.toastImage} />
							<View style={styles.toastTextBox}>
								<Text style={styles.toastTitle}>
									{typeof completedCardId === 'number' && studyHistory.studyProverbes.includes(completedCardId) ? '🎉 학습 완료!' : '📚 복습 시작!'}
								</Text>
								<Text style={styles.toastText}>{praiseText}</Text>
							</View>
						</View>
					</Animated.View>
				</View>
			)}

			<Modal visible={badgeModalVisible} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<ConfettiCannon key={confettiKey} count={100} origin={{ x: screenWidth / 2, y: 0 }} fadeOut autoStart explosionSpeed={350} />
					<Animated.View style={[styles.badgeModal, { transform: [{ scale: scaleAnim }] }]}>
						<Text style={styles.badgeModalTitle}>🎉 새로운 뱃지를 획득했어요!</Text>
						<ScrollView style={{ maxHeight: scaleHeight(300), width: '100%' }} contentContainerStyle={{ paddingHorizontal: scaleWidth(12) }}>
							{newlyEarnedBadges.map((badge, index) => (
								<View
									key={index}
									style={[styles.badgeCard, styles.badgeCardActive]} // 액티브 카드 스타일 항상 적용
								>
									<View style={[styles.iconBox, styles.iconBoxActive]}>
										<IconComponent type={badge.iconType} name={badge.icon} size={20} color={'#27ae60'} />
									</View>
									<View style={styles.badgeTextWrap}>
										<Text style={[styles.badgeName, styles.badgeTitleActive]}>{badge.name}</Text>
										<Text style={[styles.badgeDescription, styles.badgeDescActive]}>{badge.description}</Text>
									</View>
								</View>
							))}
						</ScrollView>
						<TouchableOpacity onPress={() => setBadgeModalVisible(false)} style={styles.modalConfirmButton2}>
							<Text style={styles.closeButtonText}>확인</Text>
						</TouchableOpacity>
					</Animated.View>
				</View>
			</Modal>
		</>
	);
};
const styles = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: '#fff',
	},
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	cardWrapper: {
		height: scaleHeight(812 * 0.7),
		width: '100%',
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingTop: scaleHeight(-10), // 위로 땡기기
	},
	cardFront: {
		width: scaleWidth(370), // ✅ 내부 카드(cardFace)와 같은 크기로
		height: scaleHeight(540),
		borderRadius: scaleWidth(20),
		alignItems: 'center',
		justifyContent: 'center',
	},
	flagContainer: {
		width: isTablet ? scaleWidth(180) : scaleWidth(260),
		height: isTablet ? scaleWidth(160) : scaleWidth(260),
		backgroundColor: '#f8f9fa',
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
		borderColor: '#e0e0e0',
		borderWidth: 1,
	},
	progressHeader: {
		paddingTop: scaleHeight(12),
		backgroundColor: '#ffffff',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#dcdde1',
		borderRadius: scaleWidth(16),
		paddingBottom: 0,
		marginHorizontal: scaleWidth(12),
	},
	progressTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(3),
	},
	progressTitle: {
		fontSize: scaledSize(17),
		fontWeight: '600',
		color: '#2c3e50',
		marginRight: scaleWidth(10),
	},
	progressBadge: {
		backgroundColor: '#4a90e2',
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(12),
	},
	progressBadgeText: {
		color: '#fff',
		fontSize: scaledSize(14),
		fontWeight: '600',
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: scaleHeight(12),
	},
	filterButton: {
		borderWidth: 1,
		borderColor: '#4a90e2',
		borderRadius: scaleWidth(16),
		paddingVertical: scaleHeight(6), // 기존보다 약간 증가
		paddingHorizontal: scaleWidth(14), // 기존보다 증가
		marginHorizontal: scaleWidth(4),
		backgroundColor: '#fff',
		minHeight: scaleHeight(24), // 기존보다 높게
		justifyContent: 'center',
		marginBottom: scaleHeight(10),
	},

	filterText: {
		fontSize: scaledSize(13), // 기존보다 크게
		color: '#4a90e2',
		lineHeight: scaleHeight(20),
		textAlign: 'center',
	},
	filterButtonActive: {
		backgroundColor: '#4a90e2',
	},
	filterTextActive: {
		color: '#fff',
	},
	button: {
		height: scaleHeight(50),
		marginTop: scaleHeight(16),
		borderRadius: scaleWidth(30),
		backgroundColor: '#3b82f6',
		justifyContent: 'center',
		alignItems: 'center', // ✅ 변경 (기존 `alignContent` → `alignItems`)
		width: '100%', // ✅ 항상 100% 사용
		alignSelf: 'center', // ✅ 중앙 정렬
	},
	learnedButton: {
		backgroundColor: '#f39c12',
	},
	learningButton: {
		backgroundColor: '#2ecc71',
	},
	buttonText: {
		color: 'white',
		fontSize: scaledSize(18),
		fontWeight: '600',
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
		marginTop: scaleHeight(10),
		fontSize: scaledSize(16),
		color: '#666',
	},
	progressBarWrapper: {
		width: '80%',
		height: scaleHeight(10),
		borderRadius: scaleWidth(5),
		backgroundColor: '#dcdde1',
		marginTop: scaleHeight(10),
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: scaleWidth(5),
		backgroundColor: '#4a90e2',
	},
	carouselContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardFace: {
		width: scaleWidth(370),
		height: CARD_HEIGHT, // ✅ 여기 반영
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(20),
		padding: scaleWidth(20),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.15,
		shadowRadius: 10,
		justifyContent: 'space-between',
		alignSelf: 'center',
		borderWidth: 1,
		borderColor: '#ddd', // ✅ 테두리 추가
	},

	cardFace2: {
		width: scaleWidth(370),
		height: CARD_HEIGHT, // ✅ 여기 반영
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(20),
		padding: scaleWidth(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.15,
		shadowRadius: 10,
		justifyContent: 'space-between',
		alignSelf: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)', // 어두운 배경 복원
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 99999,
	},
	flagSection: {
		position: 'relative',
		width: '100%',
		height: IMAGE_HEIGHT, // ✅ 조건부 높이 적용
		alignItems: 'center',
		marginBottom: scaleHeight(12), // 👈 이미지 아래 공간 확보
	},
	flipIconOutside: {
		position: 'absolute',
		top: scaleHeight(-12),
		right: scaleWidth(20),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		padding: scaleWidth(6),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
	capitalInfo: {
		marginBottom: scaleHeight(40),
	},

	capitalWrapper: {
		alignItems: 'center',
		marginTop: scaleHeight(40),
		marginBottom: scaleHeight(20),
		paddingHorizontal: scaleWidth(30),
	},

	sectionLabel: {
		fontSize: scaledSize(18),
		color: '#ffeaa7',
		fontWeight: '600',
		marginBottom: scaleHeight(6),
		textAlign: 'center',
	},
	cardHint: {
		fontSize: scaledSize(16),
		color: '#7f8c8d',
		marginTop: scaleHeight(20),
	},
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(12),
		right: scaleWidth(12),
		padding: scaleWidth(8),
		zIndex: 10,
	},

	closeButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: scaledSize(15),
	},
	toastContainer: {
		width: scaleWidth(340), // ✅ 기존보다 더 넓게
		backgroundColor: 'rgba(255,255,255,0.98)',
		borderRadius: scaleWidth(28), // ✅ 더 둥글게
		paddingVertical: scaleHeight(20), // ✅ 더 넓은 여백
		paddingHorizontal: scaleWidth(24),
		alignItems: 'center',
		shadowColor: '#000',

		shadowOffset: { width: 0, height: scaleHeight(6) },
		shadowOpacity: 0.2, // ✅ 그림자 강조
		shadowRadius: scaleWidth(10),
		transform: [{ translateY: -scaleHeight(70) }],
	},
	badgeModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(20),
		width: '85%',
		maxHeight: '80%',
		alignItems: 'center',
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
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(6),
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
	modalConfirmButton2: {
		backgroundColor: '#2980b9',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(36),
		borderRadius: scaleWidth(30),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	toastInner: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	toastImage: {
		width: scaleWidth(60), // ✅ 이미지 더 크게
		height: scaleWidth(60),
		marginRight: scaleWidth(18),
		borderRadius: scaleWidth(14),
	},
	toastTextBox: {
		flex: 1,
	},
	toastTitle: {
		fontSize: scaledSize(20), // ✅ 더 큰 글자
		fontWeight: 'bold',
		color: '#2d3436',
		marginBottom: scaleHeight(6),
	},
	toastText: {
		fontSize: scaledSize(15), // ✅ 일반 텍스트도 확대
		color: '#636e72',
		lineHeight: scaleHeight(24),
	},
	toastWrapper: {
		position: 'absolute',
		top: '40%',
		left: 0,
		right: 0,
		alignItems: 'center',
		zIndex: 999,
	},
	emptyWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(24),
		backgroundColor: '#f5f6fa',
	},
	emptyImage: {
		width: scaleWidth(140),
		height: scaleWidth(140),
		marginBottom: scaleHeight(20),
		opacity: 0.6,
	},
	emptyText: {
		fontSize: scaledSize(16),
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
	},
	filterSection: {
		paddingTop: scaleHeight(10),
		backgroundColor: '#fff',
	},
	basicFilterRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	detailToggleButton: {
		marginLeft: scaleWidth(8),
		padding: scaleWidth(4),
		marginBottom: scaleHeight(10),
	},
	detailFilterWrapper: {
		width: '100%',
		backgroundColor: '#ffffff',
		paddingTop: 0,
		paddingHorizontal: scaleWidth(20),
		zIndex: 9999,
	},
	subFilterRow: {
		flexDirection: 'row',
		paddingHorizontal: scaleWidth(5),
	},
	resetButton: {
		marginLeft: scaleWidth(6),
		padding: scaleWidth(4),
		marginBottom: scaleHeight(10),
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
	statusCardValue: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
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
	dropdown: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1,
		borderRadius: scaleWidth(8),
		paddingHorizontal: scaleWidth(8), // 여백도 줄임
	},
	dropdownList: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1,
		borderRadius: scaleWidth(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowOpacity: 0.06,
		shadowRadius: scaleWidth(2),
		paddingBottom: 0,
		marginBottom: 0,
	},
	studyEndWrapper: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: scaleHeight(12),
		paddingBottom: scaleHeight(Platform.OS === 'android' ? 30 : 20), // ← 이 부분을 조정
		borderTopWidth: 1,
		borderColor: '#ecf0f1',
	},
	studyEndButton: {
		backgroundColor: '#7f8c8d',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(24),
		borderRadius: scaleWidth(24),
	},
	studyEndText: {
		color: '#ffffff',
		fontSize: scaledSize(14),
		fontWeight: 'bold',
	},
	exitModalBox: {
		width: '80%',
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 6,
	},
	exitHeader: {
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	exitTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
	},
	exitSub: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		marginBottom: scaleHeight(20),
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	exitButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginTop: scaleHeight(4),
	},
	exitButton: {
		flex: 1,
		marginHorizontal: scaleWidth(4),
		paddingVertical: scaleHeight(12),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	exitButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: scaledSize(15),
	},
	flagImage: {
		width: '100%',
		aspectRatio: 1.6,
		borderRadius: scaleWidth(12),
		backgroundColor: '#f5f5f5',
		borderColor: '#ddd',
		borderWidth: 1,
	},
	cardMiddle: {
		flex: 1,
		marginTop: scaleHeight(70),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(10), // ✅ 좌우 여백
		width: '100%', // ✅ 부모 크기에 맞추기
	},

	fixedBottomButton: {
		position: 'absolute',
		bottom: scaleHeight(20),
		left: 0,
		right: 0,
		alignItems: 'center',
		paddingHorizontal: scaleWidth(20), // ➕ 여백만큼 padding으로 처리
	},
	subMascotImage: {
		width: '100%',
		aspectRatio: 1,
		resizeMode: 'contain',
		alignSelf: 'center',
	},
	flagImageSquare: {
		// width: '100%',
		width: '100%',
		aspectRatio: 1, // 정사각형
		alignSelf: 'center',
	},
	hanjaText: {
		fontSize: scaledSize(28),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
		marginBottom: scaleHeight(12),
		letterSpacing: 2, // ✅ 기존보다 줄임
		flexShrink: 1, // ✅ 넘칠 경우 줄이도록
		width: '100%', // ✅ 부모 영역 꽉 차게
	},

	hangulText: {
		fontSize: scaledSize(18),
		color: '#7f8c8d',
		fontWeight: '500',
		textAlign: 'center',
		marginBottom: scaleHeight(8),
	},
	cardBackContainer: {
		flex: 1,
		paddingHorizontal: scaleWidth(12),
		paddingTop: scaleHeight(12),
		paddingBottom: scaleHeight(30),
		backgroundColor: '#ffffff', // 더 깔끔한 흰색 배경
		borderRadius: scaleWidth(20),
		width: '100%',
		height: '100%',
	},

	cardTitle: {
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#2980b9',
		textAlign: 'center',
		marginBottom: scaleHeight(14),
	},

	sectionTitle: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},

	meaningBox: {
		borderRadius: scaleWidth(14),
		backgroundColor: '#fff3cd', // 밝은 크림색
		borderLeftWidth: 4,
		borderLeftColor: '#f9a825', // 오렌지 강조선
		padding: scaleWidth(14),
		marginBottom: scaleHeight(12),
	},

	exampleBox: {
		backgroundColor: '#e3f2fd', // 연한 하늘색
		borderRadius: scaleWidth(14),
		padding: scaleWidth(14),
		marginBottom: scaleHeight(6),
	},

	sectionContent: {
		fontSize: scaledSize(15),
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		textAlign: 'left',
	},

	cardBackTitle: {
		fontSize: scaledSize(24),
		fontWeight: 'bold',
		color: '#2980b9',
		textAlign: 'center',
		marginBottom: scaleHeight(16),
	},
	dropdownField: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1,
		borderRadius: scaleWidth(8),
		paddingHorizontal: scaleWidth(8), // 여백도 줄임
	},
	dropdownListField: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: scaleWidth(12),
	},
	sectionBox: {
		borderWidth: 1,
		borderColor: '#E6EEF5',
		backgroundColor: '#FDFEFE',
		padding: scaleWidth(12),
		borderRadius: scaleWidth(12),
		marginTop: scaleHeight(5),
		marginBottom: scaleHeight(6),
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	sectionText: {
		fontSize: scaledSize(14),
		color: '#444',
		lineHeight: 20,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	phraseRow: {
		marginBottom: scaleHeight(6),
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(8),
		backgroundColor: '#F9FBFF',
		borderRadius: scaleWidth(8),
	},
	inlineLabel: {
		fontSize: scaledSize(13),
		marginBottom: scaleHeight(3),
		fontWeight: '700',
		color: '#2c3e50',
	},
	inlineValue: {
		fontSize: scaledSize(13),
		color: '#555',
		marginTop: scaleHeight(2),
	},
	highlightSection: {
		borderWidth: 1.5,
		borderColor: '#A5D8FF',
		backgroundColor: '#EAF4FF',
		padding: scaleWidth(14),
		borderRadius: scaleWidth(14),
		marginBottom: scaleHeight(6),
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	highlightHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	highlightTitle: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#1E6BB8',
		marginLeft: scaleWidth(6),
	},
	highlightText: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
		lineHeight: 22,
	},
	metaWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: scaleWidth(8),
		marginTop: scaleHeight(16),
		justifyContent: 'center',
	},
	metaChip: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(14),
	},
	metaText: {
		fontSize: scaledSize(13),
		fontWeight: '600',
	},
	meaningQuoteBox: {
		alignItems: 'center', // 중앙 정렬
		justifyContent: 'center',
		backgroundColor: '#EAF4FF', // 파란색 계열 배경
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(14),
		marginBottom: scaleHeight(16),
	},

	meaningQuoteText: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		textAlign: 'center', // 텍스트도 중앙 정렬
	},
	badgeInlineRow: {
		flexDirection: 'row',
		alignItems: 'center', // 세로 중앙
		gap: scaleWidth(6),
		marginTop: scaleHeight(8),
		marginBottom: scaleHeight(8),
		width: '100%',
	},
	levelBadge: {
		flexDirection: 'row',
		alignItems: 'center', // 세로 중앙 고정
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(14),
	},
	categoryBadge: {
		flexDirection: 'row',
		alignItems: 'center', // 세로 중앙 고정
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(14),
	},
	badgeText: {
		color: '#fff',
		fontSize: scaledSize(13),
		fontWeight: '600',
	},
	tagWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap', // ✅ 태그도 여러 줄
		justifyContent: 'center', // ✅ 중앙 모으기
	},
	// 태그 가로 스크롤 영역
	tagScroll: {
		flex: 1, // 남는 공간을 태그가 차지
		marginLeft: scaleWidth(6), // 배지와 간격
		maxHeight: scaleHeight(30), // 라인 높이 안정화
	},

	tagScrollContent: {
		alignItems: 'center',
		justifyContent: 'center', // ✅ 태그도 가운데 정렬
	},

	tagChip: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(14),
		backgroundColor: '#F1F2F6',
		marginRight: scaleWidth(6),
	},

	tagText: {
		fontSize: scaledSize(13),
		fontWeight: '600',
		color: '#2c3e50',
	},
});

export default QuizStudyScreen;
