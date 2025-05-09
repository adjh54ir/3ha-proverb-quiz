import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
	Animated,
	SafeAreaView,
	ActivityIndicator,
	Modal,
	InteractionManager,
	ScrollView,
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
import Icon from 'react-native-vector-icons/FontAwesome6';

const STORAGE_KEY = 'UserStudyHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	icon: () => <Icon name="clipboard-list" size={16} color="#555" />,
};

const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '아주 쉬움',
		value: '아주 쉬움',
		icon: () => <Icon name="seedling" size={16} color="#85C1E9" />,
	},
	{
		label: '쉬움',
		value: '쉬움',
		icon: () => <Icon name="leaf" size={16} color="#F4D03F" />,
	},
	{
		label: '보통',
		value: '보통',
		icon: () => <Icon name="tree" size={16} color="#EB984E" />,
	},
	{
		label: '어려움',
		value: '어려움',
		icon: () => <Icon name="trophy" size={16} color="#E74C3C" />,
	},
];
const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '운/우연',
		value: '운/우연',
		icon: () => <Icon name="dice" size={16} color="#81ecec" />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		icon: () => <Icon name="users" size={16} color="#a29bfe" />,
	},
	{
		label: '세상 이치',
		value: '세상 이치',
		icon: () => <Icon name="globe" size={16} color="#fdcb6e" />,
	},
	{
		label: '근면/검소',
		value: '근면/검소',
		icon: () => <Icon name="hammer" size={16} color="#fab1a0" />,
	},
	{
		label: '노력/성공',
		value: '노력/성공',
		icon: () => <Icon name="medal" size={16} color="#55efc4" />,
	},
	{
		label: '경계/조심',
		value: '경계/조심',
		icon: () => <Icon name="exclamation-triangle" size={16} color="#ff7675" />,
	},
	{
		label: '욕심/탐욕',
		value: '욕심/탐욕',
		icon: () => <Icon name="money-bill-wave" size={16} color="#fd79a8" />,
	},
	{
		label: '배신/불신',
		value: '배신/불신',
		icon: () => <Icon name="user-slash" size={16} color="#b2bec3" />,
	},
];

const ProverbStudyScreen = () => {
	const navigation = useNavigation();
	const carouselRef = useRef<any>(null);
	const flipAnim = useRef(new Animated.Value(0)).current;
	const toastAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0)).current;

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

	const [levelOpen, setLevelOpen] = useState(false);
	const [themeOpen, setThemeOpen] = useState(false);

	const DETAIL_FILTER_HEIGHT = 80;
	const detailFilterHeightAnim = useRef(new Animated.Value(0)).current;

	const [studyHistory, setStudyHistory] = useState<MainDataType.UserStudyHistory>({
		studyProverbes: [],
		studyCounts: {},
		lastStudyAt: new Date(),
		badges: [],
	});

	const [filter, setFilter] = useState<'all' | 'learning' | 'learned'>('learning');
	const progress = proverbs.length > 0 ? studyHistory.studyProverbes.length / proverbs.length : 0;

	const completionImages = require('@/assets/images/cheer-up.png');

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
		if (currentIndex >= filteredProverbs.length) {
			setCurrentIndex(Math.max(0, filteredProverbs.length - 1));
		}
	}, [filteredProverbs]);

	useEffect(() => {
		Animated.timing(detailFilterHeightAnim, {
			toValue: isDetailFilterOpen ? DETAIL_FILTER_HEIGHT : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [isDetailFilterOpen]);

	useEffect(() => {
		filterData();
		flipAnim.setValue(0); // 카드만 초기화
	}, [proverbs, studyHistory, filter]);

	const filterData = () => {
		let filtered = proverbs;

		if (filter === 'learned') {
			filtered = filtered.filter((p) => studyHistory.studyProverbes.includes(p.id));
		} else if (filter === 'learning') {
			filtered = filtered.filter((p) => !studyHistory.studyProverbes.includes(p.id));
		}

		if (levelFilter !== '전체') {
			filtered = filtered.filter((p) => p.levelName === levelFilter);
		}
		if (themeFilter !== '전체') {
			filtered = filtered.filter((p) => p.category === themeFilter);
		}

		setFilteredProverbs(filtered);
	};

	const flipCard = () => {
		// 드롭다운 닫기 추가
		setLevelOpen(false);
		setThemeOpen(false);

		Animated.timing(flipAnim, {
			toValue: isFlipped ? 0 : 180,
			duration: 300,
			useNativeDriver: true,
		}).start(() => setIsFlipped(!isFlipped));
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

			// 카드가 줄었을 경우 인덱스 조정
			const nextIndex = Math.min(currentIndex, newFiltered.length - 1);
			setCurrentIndex(nextIndex); // 👈 인덱스 보정

			// 카드 앞면으로 돌리기
			if (isFlipped) {
				setIsFlipped(false);
				flipAnim.setValue(0);
			}

			// ✅ 추가: 완료하면 전체보기 모드로 전환
			setPraiseText(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
			showEncourageToast();

			// 일정 시간 후에 포커스 이동 (유효한 인덱스일 경우에만)
			setTimeout(() => {
				if (carouselRef.current && newFiltered.length > 0) {
					carouselRef.current.scrollTo({ index: nextIndex, animated: true });
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
	};

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const mascot = mascotImagesQueue[index % mascotImagesQueue.length];
		const isLearned = studyHistory.studyProverbes.includes(item.id);
		const frontInterpolate = flipAnim.interpolate({
			inputRange: [0, 180],
			outputRange: ['0deg', '180deg'],
		});

		const backInterpolate = flipAnim.interpolate({
			inputRange: [0, 180],
			outputRange: ['180deg', '360deg'],
		});

		const frontAnimatedStyle = {
			transform: [{ rotateY: frontInterpolate }],
			backfaceVisibility: 'hidden' as any,
		};
		const backAnimatedStyle = {
			transform: [{ rotateY: backInterpolate }],
			backfaceVisibility: 'hidden' as any,
		};

		return (
			<View style={styles.cardWrapper}>
				<Animated.View style={[styles.card, frontAnimatedStyle]}>
					<View style={styles.cardInner}>
						<View style={styles.cardContent}>
							{mascot && (
								<FastImage
									//@ts-ignore
									source={mascot}
									style={[styles.subMascotImage]}
									resizeMode='contain'
								/>
							)}
							<Text style={styles.cardLabel}>속담</Text>
							<Text style={styles.proverbText}>{item.proverb}</Text>
							{isLearned && (
								<View style={styles.completedBadge}>
									<Text style={styles.completedBadgeText}>완료됨 ✅</Text>
								</View>
							)}
							<Text style={styles.hintText}>카드를 탭하면 속담 의미를 볼 수 있어요 👆</Text>
						</View>

						<TouchableOpacity
							style={isLearned ? styles.retryButton : styles.cardCompleteButton}
							onPress={isLearned ? handleAgain : handleComplete}>
							<Text style={styles.buttonText}>{isLearned ? '다시 학습하기' : '학습 완료'}</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>

				<Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
					<View style={styles.cardInner}>
						<TouchableOpacity activeOpacity={0.9} style={styles.cardContent} onPress={flipCard}>
							<Text style={styles.cardLabel}>🧠 속담 의미</Text>
							<Text style={styles.meaningHighlight}>{item.longMeaning}</Text>
							<Text style={styles.exampleText}>{item.example ? `✏️ 예시: ${item.example}` : '✏️ 예시가 없는 속담입니다'}</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={isLearned ? styles.retryButton : styles.cardCompleteButton}
							onPress={isLearned ? handleAgain : handleComplete}>
							<Text style={styles.buttonText}>{isLearned ? '다시 학습하기' : '학습 완료'}</Text>
						</TouchableOpacity>
					</View>
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
								{studyHistory.studyProverbes.length} / {proverbs.length}
							</Text>
						</View>
					</View>

					<View style={styles.progressBarWrapper}>
						<View
							style={[
								styles.progressBarFill,
								{ width: isLoading ? '0%' : `${progress * 100}%`, backgroundColor: isLoading ? '#ccc' : '#4a90e2' },
							]}
						/>
					</View>

					<View style={styles.filterContainer}>
						{['전체', '학습 중', '학습 완료'].map((label, i) => {
							const value = i === 0 ? 'all' : i === 1 ? 'learning' : 'learned';
							const isActive = filter === value;
							return (
								<TouchableOpacity
									key={label}
									onPress={() => setFilter(value)}
									style={[styles.filterButton, isActive && styles.filterButtonActive]}>
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
					</View>

					{/* 🔻 아코디언 상세 필터 */}
					{isDetailFilterOpen && (
						<Animated.View style={[styles.detailFilterWrapper, { height: detailFilterHeightAnim }]}>
							<View style={styles.subFilterRow}>
								<View style={[styles.dropdownWrapper, { flex: 1, zIndex: themeOpen ? 1000 : 2000 }]}>
									{' '}
									{/* zIndex 역전 방지 */}
									<DropDownPicker
										open={levelOpen}
										setOpen={setLevelOpen}
										value={levelFilter}
										setValue={setLevelFilter}
										items={LEVEL_DROPDOWN_ITEMS}
										style={styles.dropdown}
										textStyle={{ fontSize: 15, color: '#2c3e50', fontWeight: '500' }}
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
								<View style={{ width: 8 }} />
								<View style={[styles.dropdownWrapperLast, { flex: 1, zIndex: levelOpen ? 1000 : 2000 }]}>
									<DropDownPicker
										open={themeOpen}
										setOpen={setThemeOpen}
										value={themeFilter}
										setValue={setThemeFilter}
										items={FIELD_DROPDOWN_ITEMS}
										style={styles.dropdown}
										textStyle={{ fontSize: 15, color: '#2c3e50', fontWeight: '500' }}
										placeholderStyle={{ color: '#95a5a6', fontSize: 14 }}
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
						<Text>해당 조건에 맞는 속담이 없어요</Text>
					</View>
				) : (
					<>
						<Animated.View style={[styles.carouselContainer, { zIndex: 1 }]}>
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
									parallaxAdjacentItemScale: 0.9,
								}}
								onSnapToItem={(index) => {
									setCurrentIndex(index);
									setIsFlipped(false);
									flipAnim.setValue(0);
									setMascotImage(mascotImages[Math.floor(Math.random() * mascotImages.length)]); // ✅ 추가
								}}
							/>
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
								<TouchableOpacity
									style={[styles.exitButton, { backgroundColor: '#95a5a6' }]}
									onPress={() => setShowExitModal(false)}>
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
						<ConfettiCannon
							key={confettiKey}
							count={100}
							origin={{ x: screenWidth / 2, y: 0 }}
							fadeOut
							autoStart
							explosionSpeed={350}
						/>
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
		backgroundColor: '#f9fafb', // 기존보다 덜 눈부심
	},
	cardWrapper: {
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'center',
		zIndex: 1,
	},
	card: {
		width: screenWidth * 0.85,
		height: screenHeight * 0.6,
		backgroundColor: '#fff',
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backfaceVisibility: 'hidden',
		position: 'absolute',
		zIndex: 1, // ✅ 낮게 조정
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	cardBack: {
		backgroundColor: '#4a90e2',
	},
	cardInner: {
		flex: 1,
		width: '100%',
		padding: 20,
		justifyContent: 'space-between',
	},
	hintText: {
		marginTop: 15,
		fontSize: 14,
		color: '#7f8c8d',
		textAlign: 'center',
	},
	progressWrapper: {
		alignItems: 'center',
		marginVertical: 20,
	},
	progressText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#2c3e50',
	},
	buttonWrapper: {
		alignItems: 'center',
		marginVertical: 20,
	},
	completeButton: {
		backgroundColor: '#27ae60',
		paddingVertical: 12,
		paddingHorizontal: 30,
		borderRadius: 30,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
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
		marginVertical: 8,
	},
	filterButton: {
		borderWidth: 1,
		borderColor: '#4a90e2',
		borderRadius: 20,
		paddingVertical: 6,
		paddingHorizontal: 14,
		marginHorizontal: 6,
		backgroundColor: '#fff',
	},
	filterButtonActive: {
		backgroundColor: '#4a90e2',
	},
	filterText: {
		fontSize: 14,
		color: '#4a90e2',
	},
	filterTextActive: {
		color: '#fff',
	},
	carouselContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1, // 👈 반드시 명시
	},
	studyEndWrapper: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: 12,
		borderTopWidth: 1,
		borderColor: '#ecf0f1',
	},
	studyEndButton: {
		backgroundColor: '#7f8c8d', // 진한 그레이
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 24,
	},
	studyEndText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	detailToggleButton: {
		marginLeft: 8,
		padding: 4,
	},
	subFilterRow: {
		flexDirection: 'row',
	},

	dropdown: {
		backgroundColor: '#fff',
		borderColor: '#ccc',
		height: 44,
	},
	dropdownList: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1.2,
		borderRadius: 12,
	},
	progressHeader: {
		paddingVertical: 20,
		backgroundColor: '#ffffff',
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
		alignItems: 'center',
	},
	progressTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	progressTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#2c3e50',
		marginRight: 10,
	},
	progressBadge: {
		backgroundColor: '#4a90e2',
		paddingVertical: 4,
		paddingHorizontal: 10,
		borderRadius: 12,
	},
	progressBadgeText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	progressBarWrapper: {
		width: '80%',
		height: 10,
		borderRadius: 5,
		backgroundColor: '#dcdde1',
		marginTop: 10,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: 5,
		backgroundColor: '#4a90e2',
	},
	detailFilterWrapper: {
		width: '100%',
		backgroundColor: '#f9fafb',
		paddingHorizontal: 20,
		paddingTop: 10,
		zIndex: 9999, // 👈 DropDownPicker보다 상위 부모도 높게
	},
	retryButton: {
		backgroundColor: '#f39c12', // 다시 학습은 노란색 계열
		paddingVertical: 12,
		paddingHorizontal: 30,
		borderRadius: 30,
		marginBottom: 10,
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
		padding: 24,
		borderRadius: 16,
		alignItems: 'center',
	},
	exitTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 8,
	},
	exitSub: {
		fontSize: 14,
		color: '#7f8c8d',
		marginBottom: 20,
	},
	exitButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	exitButton: {
		flex: 1,
		marginHorizontal: 4,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	exitButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 15,
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
		width: 300,
		backgroundColor: 'rgba(255,255,255,0.95)',
		borderRadius: 24,
		paddingVertical: 16,
		paddingHorizontal: 20,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		transform: [{ translateY: -70 }],
	},
	toastInner: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	toastImage: {
		width: 50,
		height: 50,
		marginRight: 16,
		borderRadius: 12,
	},

	toastTextBox: {
		flex: 1,
	},

	toastTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2d3436',
		marginBottom: 4,
	},

	toastText: {
		fontSize: 15,
		color: '#636e72',
		lineHeight: 22,
	},
	completedBadge: {
		marginTop: 8,
		backgroundColor: '#2ecc71',
		paddingVertical: 4,
		paddingHorizontal: 10,
		borderRadius: 12,
	},
	completedBadgeText: {
		fontSize: 12,
		color: '#fff',
		fontWeight: '600',
	},
	subMascotImage: {
		width: 150,
		height: 150,
		marginTop: 16,
		opacity: 0.9, // 조금 더 뚜렷하게
		marginBottom: 0,
	},
	proverbText: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
		lineHeight: 34,
		// ✅ 아래 줄 수정 (기존 10 → 줄이거나 marginTop만 남김)
		marginTop: 4,
		marginBottom: 0,
	},
	meaningHighlight: {
		fontSize: 22,
		color: '#ffffff',
		fontWeight: 'bold',
		textAlign: 'center',
		lineHeight: 30,
		marginVertical: 10,
	},
	exampleText: {
		fontSize: 15,
		color: '#dfe6e9',
		fontStyle: 'italic',
		textAlign: 'center',
		lineHeight: 22,
		marginTop: 30, // ✅ 예시 위 간격 추가
	},
	cardLabel: {
		fontSize: 17,
		color: '#ffffff',
		marginBottom: 8,
		fontWeight: '600',
		textAlign: 'center',
	},
	cardCompleteButton: {
		backgroundColor: '#27ae60',
		paddingVertical: 10,
		paddingHorizontal: 24,
		borderRadius: 20,
		marginTop: 20,
		marginBottom: 10,
	},
	cardContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center', // 중앙 정렬 추가
	},

	badgeModal: {
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 20,
		width: '85%',
		maxHeight: '80%',
		alignItems: 'center',
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
	statusCardValue: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2c3e50',
	},
	closeButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 15, // 기존 16 → 줄임
	},
	dropdownWrapper: {
		flex: 1,
		marginBottom: 6, // ✅ 여백 조정
		marginRight: 6, // ← 드롭다운 간의 간격
	},
	dropdownWrapperLast: {
		flex: 1,
		marginBottom: 6,
		marginRight: 6, // ✅ 초기화 버튼과 여백 추가!
	},
	dropdownPlaceholder: {
		textAlign: 'center',
		color: '#999', // 선택 전 컬러도 부드럽게
	},
});
