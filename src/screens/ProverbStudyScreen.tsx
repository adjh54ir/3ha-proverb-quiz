import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
	Animated,
	ActivityIndicator,
	Modal,
	InteractionManager,
	ScrollView,
	Platform,
	Image,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import IconComponent from './common/atomic/IconComponent';
import { useNavigation } from '@react-navigation/native';
import { StudyBadgeInterceptor } from '@/services/interceptor/StudyBadgeInterceptor';
import { CONST_BADGES } from '@/const/ConstBadges';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';

const STORAGE_KEY = 'UserStudyHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	icon: () => <IconComponent type='FontAwesome6' name='clipboard-list' size={16} color='#555' />,
};



const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '아주 쉬움',
		value: '아주 쉬움',
		icon: () => <IconComponent type='FontAwesome6' name='seedling' size={16} color='#85C1E9' />,
	},
	{
		label: '쉬움',
		value: '쉬움',
		icon: () => <IconComponent type='FontAwesome6' name='leaf' size={16} color='#F4D03F' />,
	},
	{
		label: '보통',
		value: '보통',
		icon: () => <IconComponent type='FontAwesome6' name='tree' size={16} color='#EB984E' />,
	},
	{
		label: '어려움',
		value: '어려움',
		icon: () => <IconComponent type='FontAwesome6' name='trophy' size={16} color='#E74C3C' />,
	},
];
const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '운/우연',
		value: '운/우연',
		icon: () => <IconComponent type='FontAwesome6' name='dice' size={16} color='#81ecec' />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		icon: () => <IconComponent type='FontAwesome6' name='users' size={16} color='#a29bfe' />,
	},
	{
		label: '세상 이치',
		value: '세상 이치',
		icon: () => <IconComponent type='fontawesome5' name='globe' size={16} color='#fdcb6e' />,
	},
	{
		label: '근면/검소',
		value: '근면/검소',
		icon: () => <IconComponent type='fontawesome5' name='hammer' size={16} color='#fab1a0' />,
	},
	{
		label: '노력/성공',
		value: '노력/성공',
		icon: () => <IconComponent type='fontawesome5' name='medal' size={16} color='#55efc4' />,
	},
	{
		label: '경계/조심',
		value: '경계/조심',
		icon: () => <IconComponent type='fontawesome5' name='exclamation-triangle' size={16} color='#ff7675' />,
	},
	{
		label: '욕심/탐욕',
		value: '욕심/탐욕',
		icon: () => <IconComponent type='fontawesome5' name='hand-holding-usd' size={16} color='#fd79a8' />,
	},
	{
		label: '배신/불신',
		value: '배신/불신',
		icon: () => <IconComponent type='fontawesome5' name='user-slash' size={16} color='#b2bec3' />,
	},
];

const ProverbStudyScreen = () => {
	const navigation = useNavigation();
	const carouselRef = useRef<any>(null);
	const flipAnim = useRef(new Animated.Value(0)).current;
	const toastAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const buttonScaleAnim = useRef(new Animated.Value(1)).current;
	const [buttonScaleAnimList, setButtonScaleAnimList] = useState<Animated.Value[]>([]);
	const [flipDegreesList, setFlipDegreesList] = useState<number[]>([]);

	const [flipAnimList, setFlipAnimList] = useState<Animated.Value[]>([]);

	const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
	const [filteredProverbs, setFilteredProverbs] = useState<MainDataType.Proverb[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [showToast, setShowToast] = useState(false);
	const [praiseText, setPraiseText] = useState('');

	const [showExitModal, setShowExitModal] = useState(false);
	const [badgeModalVisible, setBadgeModalVisible] = useState(false);

	const [confettiKey, setConfettiKey] = useState(0);
	const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false);
	const [levelFilter, setLevelFilter] = useState('전체');
	const [themeFilter, setThemeFilter] = useState('전체');

	const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<MainDataType.UserBadge[]>([]);

	const [isButtonDisabled, setIsButtonDisabled] = useState(false);

	const [levelOpen, setLevelOpen] = useState(false);
	const [themeOpen, setThemeOpen] = useState(false);

	const DETAIL_FILTER_HEIGHT = 70;
	const detailFilterHeightAnim = useRef(new Animated.Value(0)).current;

	const [studyHistory, setStudyHistory] = useState<MainDataType.UserStudyHistory>({
		studyProverbes: [],
		studyCounts: {},
		lastStudyAt: new Date(),
		badges: [],
	});

	const [filter, setFilter] = useState<'all' | 'learning' | 'learned'>('learning');

	const completionImages = require('@/assets/images/cheer-up.png');


	useBlockBackHandler(true); // 뒤로가기 모션 막기

	const praiseMessages = [
		'속담 박사님 등장! 🎓',
		'뜻을 꿰뚫었네요! 👀',
		'속담의 고수예요! 🧙',
		'이제 말로도 지혜가 느껴져요! 💬✨',
		'지혜 한 스푼 추가요~ 🍯',
		'속담도 척척! 천재인가요? 🧠',
		'할머니도 칭찬하시겠어요! 👵💕',
		'이 정도면 속담 달인! 🏆',
		'오늘도 한 수 배웠어요! 📚',
		'어휘력 +10! 🔠',
		'세상 이치를 꿰뚫는 눈! 🔍',
		'속담 공부 완료! 다음 단계로 고고~ 🚀',
	];

	const mascotImages = [
		require('@/assets/images/random/random_mascote1.png'),
		require('@/assets/images/random/random_mascote2.png'),
		require('@/assets/images/random/random_mascote3.png'),
		require('@/assets/images/random/random_mascote4.png'),
		require('@/assets/images/random/random_mascote5.png'),
		require('@/assets/images/random/random_mascote6.png'),
		require('@/assets/images/random/random_mascote7.png'),
	];
	const [mascotImage, setMascotImage] = useState(mascotImages[Math.floor(Math.random() * mascotImages.length)]);
	const [mascotImagesQueue, setMascotImagesQueue] = useState<string[]>([]);

	useEffect(() => {
		// 속담 수만큼 flipAnim 생성
		const animList = proverbs.map(() => new Animated.Value(0));
		setFlipAnimList(animList);
	}, [proverbs]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = ProverbServices.selectProverbList();
				setProverbs(data);

				const savedData = await AsyncStorage.getItem(STORAGE_KEY);
				if (savedData) {
					setStudyHistory(JSON.parse(savedData));
				}
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		// 앱 시작할 때 미리 10개 랜덤 뽑기
		const randomMascots = Array.from({ length: 10 }, () => mascotImages[Math.floor(Math.random() * mascotImages.length)]);
		setMascotImagesQueue(randomMascots);
	}, []);

	useEffect(() => {
		const animList = filteredProverbs.map(() => new Animated.Value(1));
		setFlipAnimList(animList);
	}, [filteredProverbs]);

	useEffect(() => {
		const scaleList = filteredProverbs.map(() => new Animated.Value(1));
		setButtonScaleAnimList(scaleList);
	}, [filteredProverbs]);

	useEffect(() => {
		Animated.timing(detailFilterHeightAnim, {
			toValue: isDetailFilterOpen ? DETAIL_FILTER_HEIGHT : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [isDetailFilterOpen]);

	useEffect(() => {
		const degrees = filteredProverbs.map(() => 0);
		setFlipDegreesList(degrees);
	}, [filteredProverbs]);

	useEffect(() => {
		filterData(undefined, undefined, undefined, false); // 🔒 인덱스 유지
		flipAnim.setValue(0); // 카드만 초기화
	}, [proverbs, studyHistory, filter]);

	const filterData = (customLevelFilter = levelFilter, customThemeFilter = themeFilter, customFilter = filter, shouldResetIndex = true) => {
		let filtered = proverbs;

		if (customFilter === 'learned') {
			filtered = filtered.filter((p) => studyHistory.studyProverbes.includes(p.id));
		} else if (customFilter === 'learning') {
			filtered = filtered.filter((p) => !studyHistory.studyProverbes.includes(p.id));
		}

		if (customLevelFilter !== '전체') {
			filtered = filtered.filter((p) => p.levelName === customLevelFilter);
		}
		if (customThemeFilter !== '전체') {
			filtered = filtered.filter((p) => p.category === customThemeFilter);
		}

		setFilteredProverbs(filtered);

		if (shouldResetIndex) {
			setCurrentIndex(0);
			setTimeout(() => {
				carouselRef.current?.scrollTo({ index: 0, animated: true });
			}, 100);
		}
	};

	const getLevelColor = (levelName: string) => {
		const levelColorMap: Record<string, string> = {
			'아주 쉬움': '#dfe6e9',
			쉬움: '#74b9ff',
			보통: '#0984e3',
			어려움: '#2d3436',
		};
		return levelColorMap[levelName] || '#b2bec3'; // 기본 회색
	};

	const isCardFlipped = (index: number) => {
		return flipDegreesList[index] >= 90;
	};

	const flipCard = (index: number) => {
		if (isButtonDisabled) return;
		setLevelOpen(false);
		setThemeOpen(false);

		const currentAnim = flipAnimList[index];
		const isFlipped = flipDegreesList[index] >= 90;

		if (currentAnim) {
			Animated.timing(currentAnim, {
				toValue: isFlipped ? 0 : 180,
				duration: 300,
				useNativeDriver: true,
			}).start(() => {
				setCurrentIndex(index);
				setFlipDegreesList((prev) => {
					const newList = [...prev];
					newList[index] = isFlipped ? 0 : 180;
					return newList;
				});
			});
		}
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

	const handleAgain = async () => {
		const currentProverb = filteredProverbs[currentIndex];
		if (!currentProverb) return;

		// 1. studyProverbs에서 현재 항목 제거
		const updatedProverbs = studyHistory.studyProverbes.filter((id) => id !== currentProverb.id);

		// 2. 업데이트된 History 만들기
		const updatedHistory: MainDataType.UserStudyHistory = {
			studyProverbes: updatedProverbs,
			studyCounts: studyHistory.studyCounts,
			badges: studyHistory.badges || [],
			lastStudyAt: new Date(),
		};

		// 3. AsyncStorage 저장
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

		// 4. 상태 갱신
		setStudyHistory(updatedHistory);

		// 5. filteredProverbs 다시 갱신
		const newFiltered = getFilteredProverbs(updatedProverbs);
		setFilteredProverbs(newFiltered);

		// 6. 카드 리셋
		setIsFlipped(false);
		setCurrentIndex((prev) => Math.min(prev, newFiltered.length - 1));

		// 7. carousel 포커스 이동
		setTimeout(() => {
			carouselRef.current?.scrollTo({ index: currentIndex, animated: true });
		}, 300);
	};

	const handleComplete = async () => {
		const currentProverb = filteredProverbs[currentIndex];
		if (!currentProverb) return;

		if (isButtonDisabled) return; // 🔒 중복 방지
		setIsButtonDisabled(true);

		const isLearned = studyHistory.studyProverbes.includes(currentProverb.id);

		if (!isLearned) {
			const updatedProverbs = [...studyHistory.studyProverbes, currentProverb.id];
			const updatedCounts = {
				...studyHistory.studyCounts,
				[currentProverb.id]: (studyHistory.studyCounts?.[currentProverb.id] || 0) + 1,
			};

			const updatedHistory: MainDataType.UserStudyHistory = {
				studyProverbes: updatedProverbs,
				studyCounts: updatedCounts,
				badges: studyHistory.badges || [],
				lastStudyAt: new Date(),
			};

			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
			setStudyHistory(updatedHistory);

			// 3. AsyncStorage, 뱃지, 토스트 등은 InteractionManager 이후 처리
			InteractionManager.runAfterInteractions(() => {
				// 상태 저장
				AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

				// 뱃지 검사 및 모달
				checkAndHandleNewStudyBadges(updatedHistory, setStudyHistory, setBadgeModalVisible, setNewlyEarnedBadges);
			});

			// handleComplete 내부
			const newFiltered = getFilteredProverbs(updatedProverbs);
			setFilteredProverbs(newFiltered);

			// 카드 앞면으로 돌리기
			if (isCardFlipped(currentIndex)) {
				const currentAnim = flipAnimList[currentIndex];
				if (currentAnim) {
					currentAnim.setValue(0);
				}
			}

			// ✅ 추가: 완료하면 전체보기 모드로 전환
			setPraiseText(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
			triggerButtonAnimation(currentIndex); // ← index 명시적으로 전달

			showEncourageToast();

			// 포커스 이동 (newFiltered 기준으로 인덱스 조정)
			// ✅ currentIndex 유지한 채 scroll만
			setTimeout(() => {
				if (carouselRef.current && newFiltered.length > 0) {
					carouselRef.current.scrollTo({
						index: Math.min(currentIndex, newFiltered.length - 1),
						animated: true,
					});
				}
			}, 300);
		}
	};

	const getFilteredProverbs = (customStudyProverbs: number[]) => {
		if (filter === 'learned') return proverbs.filter((p) => customStudyProverbs.includes(p.id));
		if (filter === 'learning') return proverbs.filter((p) => !customStudyProverbs.includes(p.id));
		return proverbs;
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

			// 👇 추가: scale 애니메이션 실행
			scaleAnim.setValue(0);
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
			}).start();

			updatedHistory.badges = [...new Set([...currentBadges, ...newBadges])];
		}

		AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
		setter(updatedHistory);

		// ✅ handleComplete() 마지막에 아래 라인 추가:
		setTimeout(() => {
			setIsButtonDisabled(false); // 🔓 다음 카드에서도 다시 활성화되도록 보장
		}, 300);
	};

	const triggerButtonAnimation = (index: number) => {
		const anim = buttonScaleAnimList[index];
		if (!anim) return;

		Animated.sequence([
			Animated.timing(anim, {
				toValue: 0.95,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.spring(anim, {
				toValue: 1,
				friction: 3,
				useNativeDriver: true,
			}),
		]).start();
	};

	const getFilteredProgress = () => {
		// ✅ level/theme 필터 반영
		let filtered = proverbs;

		if (levelFilter !== '전체') {
			filtered = filtered.filter((p) => p.levelName === levelFilter);
		}
		if (themeFilter !== '전체') {
			filtered = filtered.filter((p) => p.category === themeFilter);
		}

		const total = filtered.length;

		// ✅ 전체 중 학습 완료된 것만 계산
		const completed = filtered.filter((p) => studyHistory.studyProverbes.includes(p.id)).length;

		const progress = total > 0 ? completed / total : 0;

		return { completed, total, progress };
	};

	const { completed, total, progress } = getFilteredProgress();

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const mascot = mascotImagesQueue[index % mascotImagesQueue.length];
		const isLearned = studyHistory.studyProverbes.includes(item.id);

		const anim = flipAnimList[index] ?? new Animated.Value(0); // fallback for safety

		const flipBackFix = {
			transform: [{ rotateY: '180deg' }],
		};

		const frontInterpolate = anim.interpolate({
			inputRange: [0, 180],
			outputRange: ['0deg', '180deg'],
		});

		const backInterpolate = anim.interpolate({
			inputRange: [0, 180],
			outputRange: ['180deg', '360deg'],
		});

		const frontAnimatedStyle = {
			transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
			backfaceVisibility: 'hidden' as any,
		};

		const backAnimatedStyle = {
			transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
			backfaceVisibility: 'hidden' as any,
		};

		return (
			<View style={styles.cardWrapper}>
				<Animated.View style={[styles.cardFront, frontAnimatedStyle, { flex: 1 }]}>
					<View style={styles.cardInner}>
						<View style={styles.cardContent}>
							{item.category && (
								<View style={styles.categoryBadge}>
									<Text style={styles.categoryBadgeText}>{item.category}</Text>
								</View>
							)}
							{/* @ts-ignore */}
							<FastImage source={mascot} style={styles.subMascotImage} resizeMode='contain' />

							<Text style={styles.cardTitle}>📘 속담</Text>
							<View style={styles.proverbContainer}>
								<Text style={styles.proverbText}>{item.proverb}</Text>
							</View>
							{isLearned && (
								<View style={styles.completedBadge}>
									<Text style={styles.completedBadgeText}>완료됨 ✅</Text>
								</View>
							)}
						</View>
						<View style={{ marginBottom: scaleHeight(10) }}>
							<Text style={styles.hintText}>카드를 탭하면 속담 의미를 볼 수 있어요 👆</Text>
						</View>
						<Animated.View style={{ transform: [{ scale: buttonScaleAnimList[index] ?? new Animated.Value(1) }] }}>
							<TouchableOpacity
								style={isLearned ? styles.retryButton : styles.cardCompleteButton}
								onPress={(e) => {
									e.stopPropagation();
									if (isButtonDisabled) return;
									triggerButtonAnimation(index);
									if (isLearned) {
										handleAgain();
									} else {
										handleComplete();
									}
								}}
								disabled={isButtonDisabled}>
								<Text style={styles.buttonText}>{isLearned ? '다시 학습하기' : '학습 완료'}</Text>
							</TouchableOpacity>
						</Animated.View>
					</View>
				</Animated.View>

				<Animated.View
					style={[
						styles.cardFront,
						styles.cardBack,
						{
							transform: [{ rotateY: backInterpolate }],
							position: 'absolute',
							top: 0,
							left: 0,
							zIndex: 2, // 👈 뒷면이 위로 오게
						},
					]}>
					<TouchableOpacity
						activeOpacity={1}
						onPress={() => flipCard(index)}
						style={{ flex: 1 }}
					>
						<View style={[styles.cardInner, { flex: 1 }]}>
							<ScrollView
								style={{ flex: 1 }} // ✅ 추가
								contentContainerStyle={{
									flexGrow: 1,
									justifyContent: 'flex-start',
									paddingTop: scaleHeight(15),
									paddingBottom: scaleHeight(30), // 하단 버튼 여백 유지
								}}
								keyboardShouldPersistTaps='handled'
								showsVerticalScrollIndicator={true}
								scrollEnabled={true}
								overScrollMode='always' // Android 전용
							>
								<View>
									<TouchableOpacity activeOpacity={1} onPress={() => flipCard(index)}>
										<View style={[styles.badge, { backgroundColor: getLevelColor(item.levelName) }]}>
											<Text style={styles.badgeText}>{item.levelName}</Text>
										</View>
										<Text style={styles.cardLabel}>🧠 속담 의미</Text>
										<Text style={styles.meaningHighlight} numberOfLines={undefined} // 무제한 줄바꿈 허용
											allowFontScaling={false}
											adjustsFontSizeToFit={false}>{item.longMeaning}</Text>

										{/* 예시 */}
										{/* {item.example && (
										<View style={styles.sectionWrapper}>
											<Text style={styles.sectionTitle}>✏️ 예시</Text>
											<Text style={styles.sectionText}>{item.example}</Text>
										</View>
									)} */}

										{/* 같은 속담 */}
										{item.sameProverb && item.sameProverb.filter((sp) => sp.trim() !== '').length > 0 && (
											<View style={styles.sectionWrapper}>
												<Text style={styles.sectionTitle}>📚 비슷한 속담</Text>
												{item.sameProverb
													.filter((sp) => sp.trim() !== '')
													.map((sp, idx) => (
														<Text key={idx} style={styles.sectionText}>
															- {sp}
														</Text>
													))}
											</View>
										)}
									</TouchableOpacity>
								</View>
							</ScrollView>

							<TouchableOpacity
								style={[
									isLearned ? styles.retryButton : styles.cardCompleteButton,
									{ opacity: isButtonDisabled ? 0.6 : 1 },
								]}
								onPress={() => {
									if (isButtonDisabled) return;
									if (isLearned) handleAgain();
									else handleComplete();
								}}
								disabled={isButtonDisabled}
							>
								<Text style={styles.buttonText}>
									{isLearned ? '다시 학습하기' : '학습 완료'}
								</Text>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#4a90e2' />
			</View>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
			<View style={styles.container}>
				<View style={styles.progressHeader}>
					<View style={styles.progressTopRow}>
						<Text style={styles.progressTitle}>학습 현황</Text>
						<View style={styles.progressBadge}>
							<Text style={styles.progressBadgeText}>
								{completed} / {total}
							</Text>
						</View>
					</View>

					<View style={styles.progressBarWrapper}>
						<View style={[styles.progressBarFill, { width: isLoading ? '0%' : `${progress * 100}%`, backgroundColor: isLoading ? '#ccc' : '#4a90e2' }]} />
					</View>

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

						{/* 🔽 상세 필터 버튼 */}
						<TouchableOpacity
							onPress={() => {
								setIsDetailFilterOpen((prev) => {
									const newState = !prev;
									if (!newState) {
										setLevelOpen(false);
										setThemeOpen(false);
									}
									return newState;
								});
							}}
							style={styles.detailToggleButton}>
							<IconComponent type='materialIcons' name={isDetailFilterOpen ? 'expand-less' : 'expand-more'} size={24} />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								setIsDetailFilterOpen(false); // 아코디언 닫기
								setLevelOpen(false);
								setThemeOpen(false);
								setLevelFilter('전체');
								setThemeFilter('전체');
								setFilter('learning');
								filterData(); // 필터링 갱신
							}}
							style={styles.resetButton}>
							<IconComponent type='materialIcons' name='restart-alt' size={24} color='#e74c3c' />
						</TouchableOpacity>
					</View>

					{/* 🔻 아코디언 상세 필터 */}
					{isDetailFilterOpen && (
						<Animated.View style={[styles.detailFilterWrapper, { height: detailFilterHeightAnim }]}>
							<View style={styles.subFilterRow}>
								<View style={{ flex: 1, zIndex: themeOpen ? 1000 : 2000 }}>
									{/* zIndex 역전 방지 */}
									<DropDownPicker
										open={levelOpen}
										setOpen={setLevelOpen}
										value={levelFilter}
										setValue={(callback) => {
											const newValue = typeof callback === 'function' ? callback(levelFilter) : callback;
											setLevelFilter(newValue);
											filterData(newValue, themeFilter); // ✅ level 필터 기준으로 명시적 호출
										}}
										items={LEVEL_DROPDOWN_ITEMS}
										style={styles.dropdown}
										textStyle={{ fontSize: scaledSize(15), color: '#2c3e50', fontWeight: '500' }}
										dropDownContainerStyle={styles.dropdownList}
										containerStyle={{
											zIndex: 10000, // ✅ 매우 높게 설정
										}}
										zIndex={10000} // ✅ 최상단 유지
										zIndexInverse={1000}
										placeholderStyle={styles.dropdownPlaceholder}
										iconContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
										listMode='SCROLLVIEW' /* 스크롤뷰 모드로 변경 */
									/>
								</View>
								<View style={{ width: scaleWidth(8) }} />
								<View style={{ flex: 1, zIndex: levelOpen ? 1000 : 2000 }}>
									<DropDownPicker
										open={themeOpen}
										setOpen={setThemeOpen}
										value={themeFilter}
										setValue={(callback) => {
											const newValue = typeof callback === 'function' ? callback(themeFilter) : callback;
											setThemeFilter(newValue);
											filterData(levelFilter, newValue); // ✅ theme 필터 기준으로 명시적 호출
										}}
										items={FIELD_DROPDOWN_ITEMS}
										style={styles.dropdown}
										textStyle={{ fontSize: scaledSize(14), color: '#2c3e50', fontWeight: '500' }}
										placeholderStyle={{ color: '#95a5a6', fontSize: scaledSize(14) }}
										dropDownContainerStyle={styles.dropdownList}
										containerStyle={{ zIndex: 3000 }}
										zIndex={9999} // 높게 설정
										iconContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
										zIndexInverse={1000} // 반대 드롭다운일 경우 대비
										listMode='SCROLLVIEW' /* 스크롤뷰 모드로 변경 */
									/>
								</View>
							</View>
						</Animated.View>
					)}
				</View>

				{filteredProverbs.length === 0 ? (
					<View style={styles.loadingContainer}>
						<Image source={require('@/assets/images/sorry3.png')} style={styles.emptyImage} />
						<Text style={styles.emptyText}>해당 조건에 맞는 속담이 없어요</Text>
					</View>
				) : (
					<>
						<Animated.View style={[styles.carouselContainer, { zIndex: 1, alignSelf: 'center' }]}>
							{!(Platform.OS === 'android' && (showExitModal || badgeModalVisible)) && (
								<Carousel
									ref={carouselRef}
									width={screenWidth * 0.85}
									height={screenHeight * 0.6}
									data={filteredProverbs}
									renderItem={renderItem}
									mode='parallax'
									loop={false}
									windowSize={3}
									pagingEnabled={true}
									scrollAnimationDuration={600}
									modeConfig={{
										parallaxScrollingScale: 0.9,
										parallaxScrollingOffset: 40,
									}}
									onSnapToItem={(index) => {
										setCurrentIndex(index);

										InteractionManager.runAfterInteractions(() => {
											// ❗ 해당 카드 외엔 초기화하지 않음
											flipAnimList.forEach((anim, i) => {
												if (i !== index) {
													anim.setValue(0);
												}
											});
										});
									}}
								/>
							)}
						</Animated.View>
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
										<FastImage source={completionImages} style={styles.toastImage} />
										<View style={styles.toastTextBox}>
											<Text style={styles.toastTitle}>🎉 학습 완료!</Text>
											<Text style={styles.toastText}>{praiseText}</Text>
										</View>
									</View>
								</Animated.View>
							</View>
						)}
					</>
				)}
				<View style={styles.studyEndWrapper}>
					<TouchableOpacity style={styles.studyEndButton} onPress={() => setShowExitModal(true)}>
						<Text style={styles.studyEndText}>학습 종료</Text>
					</TouchableOpacity>
				</View>

				<Modal visible={showExitModal} transparent animationType='fade'>
					<View style={styles.modalOverlay}>
						<View style={styles.exitModalBox}>
							<Text style={styles.exitTitle}>진행중인 학습을 종료하시겠어요?</Text>
							<Text style={styles.exitSub}>홈 화면으로 이동합니다</Text>
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
									<Text style={styles.exitButtonText}>종료</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>

				{/* 뱃지 모달 */}
				<Modal visible={badgeModalVisible} transparent animationType='fade'>
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
							<TouchableOpacity onPress={() => setBadgeModalVisible(false)} style={styles.modalConfirmButton2}>
								<Text style={styles.closeButtonText}>확인</Text>
							</TouchableOpacity>
						</Animated.View>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
	);
};

export default ProverbStudyScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f9fafb',
	},
	cardWrapper: {
		left: 0,
		right: 0,
		alignItems: 'center',
		zIndex: 1,
		backfaceVisibility: 'hidden',
	},
	cardFront: {
		width: screenWidth * 0.85,
		height: screenHeight * 0.6,
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
		backfaceVisibility: 'hidden',
		position: 'absolute',
		zIndex: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(6) },
		shadowOpacity: 0.15,
		shadowRadius: scaleWidth(10),
		alignSelf: 'center',
		borderWidth: 1,
		borderColor: '#ddd',
	},
	cardBack: {
		backgroundColor: '#4a90e2',
		zIndex: 2,
	},
	cardInner: {
		flex: 1,
		width: '100%',
		padding: scaleWidth(20),
		minHeight: '100%',
	},
	hintText: {
		marginTop: scaleHeight(80),
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		textAlign: 'center',
	},
	progressWrapper: {
		alignItems: 'center',
		marginVertical: scaleHeight(20),
	},
	progressText: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#2c3e50',
	},
	buttonWrapper: {
		alignItems: 'center',
		marginVertical: scaleHeight(20),
	},
	completeButton: {
		backgroundColor: '#27ae60',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(30),
		borderRadius: scaleWidth(30),
	},
	buttonText: {
		color: '#fff',
		fontSize: scaledSize(17),
		fontWeight: '600',
		textAlign: 'center',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	filterContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: scaleHeight(12),
	},
	filterButton: {
		borderWidth: 1,
		borderColor: '#4a90e2',
		borderRadius: scaleWidth(20),
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(14),
		marginHorizontal: scaleWidth(6),
		backgroundColor: '#fff',
		minHeight: scaleHeight(36),
		justifyContent: 'center',
		marginBottom: scaleHeight(10),
	},
	filterButtonActive: {
		backgroundColor: '#4a90e2',
	},
	filterText: {
		fontSize: scaledSize(14),
		color: '#4a90e2',
		lineHeight: scaleHeight(20),
		textAlign: 'center',
	},
	filterTextActive: {
		color: '#fff',
	},
	carouselContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1,
	},
	studyEndWrapper: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: scaleHeight(12),
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
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	detailToggleButton: {
		marginLeft: scaleWidth(8),
		padding: scaleWidth(4),
	},


	subFilterRow: {
		flexDirection: 'row',
		marginTop: scaleHeight(5),
		paddingHorizontal: scaleWidth(10),
	},
	dropdown: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1.2,
		borderRadius: scaleWidth(12),
		paddingHorizontal: scaleWidth(12),
		height: scaleHeight(44),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowOpacity: 0.06,
		shadowRadius: scaleWidth(2),
	},
	dropdownList: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1.2,
		borderRadius: scaleWidth(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.1,
		shadowRadius: scaleWidth(4),
		paddingBottom: 0,
		marginBottom: 0,
	},
	progressHeader: {
		paddingTop: scaleHeight(20),
		backgroundColor: '#ffffff',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#dcdde1',
		borderRadius: scaleWidth(16),
		paddingBottom: 0,
		marginHorizontal: scaleWidth(16),
		marginTop: scaleHeight(12),
	},
	progressTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(8),
	},
	progressTitle: {
		fontSize: scaledSize(18),
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
	progressBarWrapper: {
		width: '80%',
		height: scaleHeight(10),
		borderRadius: scaleHeight(5),
		backgroundColor: '#dcdde1',
		marginTop: scaleHeight(10),
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: scaleHeight(5),
		backgroundColor: '#4a90e2',
	},
	detailFilterWrapper: {
		width: '100%',
		backgroundColor: '#ffffff',
		paddingTop: 0,
		paddingHorizontal: scaleWidth(20),
		zIndex: 9999,
	},
	retryButton: {
		backgroundColor: '#f39c12',
		height: scaleHeight(48),
		borderRadius: scaleWidth(24),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(30),
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(10),
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	exitModalBox: {
		width: '80%',
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		alignItems: 'center',
	},
	exitTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(8),
	},
	exitSub: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		marginBottom: scaleHeight(20),
	},
	exitButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	exitButton: {
		flex: 1,
		marginHorizontal: scaleWidth(4),
		paddingVertical: scaleHeight(12),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
	},
	exitButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: scaledSize(15),
	},
	toastWrapper: {
		position: 'absolute',
		top: '40%',
		left: 0,
		right: 0,
		alignItems: 'center',
		zIndex: 999,
	},
	toastContainer: {
		width: screenWidth * 0.9,
		maxWidth: scaleWidth(500),
		backgroundColor: 'rgba(255,255,255,0.95)',
		borderRadius: scaleWidth(24),
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(6) },
		shadowOpacity: 0.15,
		shadowRadius: scaleWidth(8),
		transform: [{ translateY: -70 }],
	},
	toastInner: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
	},
	toastImage: {
		width: scaleWidth(50),
		height: scaleWidth(50),
		marginRight: scaleWidth(16),
		borderRadius: scaleWidth(12),
	},
	toastTextBox: {
		flex: 1,
	},
	toastTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2d3436',
		marginBottom: scaleHeight(4),
	},
	toastText: {
		fontSize: scaledSize(15),
		color: '#636e72',
		lineHeight: scaleHeight(22),
	},
	completedBadge: {
		marginTop: scaleHeight(8),
		backgroundColor: '#2ecc71',
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(12),
	},
	completedBadgeText: {
		fontSize: scaledSize(12),
		color: '#fff',
		fontWeight: '600',
	},
	subMascotImage: {
		width: scaleWidth(120),
		height: scaleWidth(120),
		marginTop: scaleHeight(0),
		marginBottom: scaleHeight(10),
	},
	meaningHighlight: {
		fontSize: scaledSize(20),
		color: '#ffffff',
		fontWeight: 'bold',
		textAlign: 'left',
		lineHeight: scaleHeight(30),
		marginVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(10),
		flexShrink: 1,
		flexWrap: 'wrap',
		overflow: 'visible',
	},
	exampleText: {
		fontSize: scaledSize(15),
		color: '#dfe6e9',
		fontStyle: 'italic',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
		marginTop: scaleHeight(20),
		paddingHorizontal: scaleWidth(10),
	},
	cardLabel: {
		fontSize: scaledSize(17),
		color: '#ffffff',
		marginBottom: scaleHeight(3),
		fontWeight: '600',
		textAlign: 'left',
		marginLeft: scaleWidth(10),
	},
	cardCompleteButton: {
		backgroundColor: '#27ae60',
		height: scaleHeight(48),
		borderRadius: scaleWidth(24),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(30),
		marginTop: scaleHeight(20),
		marginBottom: scaleHeight(10),
	},
	cardContent: {
		flex: 1,
		alignItems: 'center',
		paddingTop: scaleHeight(8),
		paddingBottom: scaleHeight(5),
		paddingHorizontal: scaleWidth(12),
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
	statusCardValue: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
	},
	closeButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: scaledSize(15),
	},
	dropdownWrapper: {
		flex: 1,
		marginBottom: scaleHeight(6),
		marginRight: scaleWidth(6),
		width: '48%',
	},
	dropdownWrapperLast: {
		flex: 1,
		marginBottom: scaleHeight(6),
		marginRight: scaleWidth(6),
		width: '48%',
	},
	dropdownPlaceholder: {
		textAlign: 'center',
		color: '#999',
	},
	emptyImage: {
		width: scaleWidth(100),
		height: scaleWidth(100),
		marginBottom: scaleHeight(20),
		opacity: 0.6,
	},
	emptyText: {
		fontSize: scaleHeight(16),
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
	},
	resetButton: {
		marginLeft: scaleWidth(6),
		padding: scaleWidth(4),
	},
	cardTitle: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: scaleHeight(12),
	},
	proverbText: {
		fontSize: scaledSize(28),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
		lineHeight: scaleHeight(34),
		marginTop: scaleHeight(0),
		marginBottom: scaleHeight(0),
	},
	proverbContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleHeight(3),
	},
	categoryBadge: {
		alignSelf: 'center',
		backgroundColor: '#dfe6e9',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(12),
	},
	categoryBadgeText: {
		fontSize: scaledSize(13),
		color: '#2c3e50',
		fontWeight: '500',
	},
	sectionWrapper: {
		marginTop: scaleHeight(20),
		alignItems: 'flex-start',
		paddingHorizontal: scaleWidth(12),
		width: '100%',
	},
	sectionTitle: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: scaleHeight(6),
		textAlign: 'left',
		width: '100%',
	},
	sectionText: {
		fontSize: scaledSize(14),
		color: '#ecf0f1',
		lineHeight: scaleHeight(20),
		textAlign: 'left',
		width: '100%',
	},
	levelLabel: {
		fontSize: scaledSize(14),
		color: '#f1c40f',
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: scaleHeight(20),
	},
	button: {
		height: scaleHeight(50),
		marginTop: scaleHeight(16),
		borderRadius: scaleWidth(30),
		backgroundColor: '#3b82f6',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		alignSelf: 'center',
	},
	badge: {
		maxWidth: '60%',
		alignSelf: 'center',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		backgroundColor: '#f1f2f6',
		marginBottom: scaleHeight(20),
	},
	badgeText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: '600',
	},
});