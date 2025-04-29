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
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import IconComponent from './common/atomic/IconComponent';
import { useNavigation } from '@react-navigation/native';

const STORAGE_KEY = 'UserProverbStudyHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface UserProverbStudyHistory {
	studyProverbs: number[];
	studyCounts?: { [id: string]: number };
	badges?: string[];
	lastStudyAt: Date;
}

const ProverbStudyScreen = () => {
	const navigation = useNavigation();
	const carouselRef = useRef<any>(null);
	const flipAnim = useRef(new Animated.Value(0)).current;
	const toastAnim = useRef(new Animated.Value(0)).current;


	const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
	const [filteredProverbs, setFilteredProverbs] = useState<MainDataType.Proverb[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [showToast, setShowToast] = useState(false);
	const [praiseText, setPraiseText] = useState('');

	const [showExitModal, setShowExitModal] = useState(false);
	const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false);
	const [levelFilter, setLevelFilter] = useState<'all' | 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5'>('all');
	const [themeFilter, setThemeFilter] = useState<'all' | '속담' | '격언' | '명언'>('all');

	const [levelOpen, setLevelOpen] = useState(false);
	const [themeOpen, setThemeOpen] = useState(false);

	const DETAIL_FILTER_HEIGHT = 80;
	const detailFilterHeightAnim = useRef(new Animated.Value(0)).current;

	const [studyHistory, setStudyHistory] = useState<UserProverbStudyHistory>({
		studyProverbs: [],
		studyCounts: {},
		lastStudyAt: new Date(),
	});

	const [filter, setFilter] = useState<'all' | 'learning' | 'learned'>('learning');
	const progress = filteredProverbs.length > 0 ? (currentIndex + 1) / filteredProverbs.length : 0;
	const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([
		{ label: '전체', value: 'all' }, // 기본값
	]);



	const levelOptions = [
		{ label: '전체', value: 'all' },
		{ label: '아주 쉬움', value: '아주 쉬움' },
		{ label: '쉬움', value: '쉬움' },
		{ label: '보통', value: '보통' },
		{ label: '어려움', value: '어려움' },
		{ label: '아주 어려움', value: '아주 어려움' },
	];
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
		require('@/assets/images/level1_back.png'),
		require('@/assets/images/level2_back.png'),
		require('@/assets/images/level3_back.png'),
		require('@/assets/images/level4_back.png'),
		require('@/assets/images/level1_mascote_back.png'),
		require('@/assets/images/level2_mascote_back.png'),
		require('@/assets/images/level3_mascote.png'),
		require('@/assets/images/level4_mascote.png'),
		require('@/assets/images/level1_back.png'),
		require('@/assets/images/level2_back.png'),
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
		const loadCategories = () => {
			try {
				const categories = ProverbServices.selectCategoryList();
				const options = [{ label: '전체', value: 'all' }, ...categories.map((cat) => ({ label: cat, value: cat }))];
				setCategoryOptions(options);
			} catch (error) {
				console.error('카테고리 옵션 로드 실패:', error);
			}
		};

		loadCategories();
	}, []);

	useEffect(() => {
		// 앱 시작할 때 미리 10개 랜덤 뽑기
		const randomMascots = Array.from({ length: 10 }, () => mascotImages[Math.floor(Math.random() * mascotImages.length)]);
		setMascotImagesQueue(randomMascots);
	}, []);

	useEffect(() => {
		Animated.timing(detailFilterHeightAnim, {
			toValue: isDetailFilterOpen ? DETAIL_FILTER_HEIGHT : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [isDetailFilterOpen]);


	useEffect(() => {
		filterData();
	}, [proverbs, studyHistory, filter]);

	const filterData = () => {
		let filtered = proverbs;

		if (filter === 'learned') {
			filtered = filtered.filter((p) => studyHistory.studyProverbs.includes(p.id));
		} else if (filter === 'learning') {
			filtered = filtered.filter((p) => !studyHistory.studyProverbs.includes(p.id));
		}

		// 🔥 추가된 필터 적용
		if (levelFilter !== 'all') {
			filtered = filtered.filter((p) => p.levelName === levelFilter); // ✅ level → levelName
		}
		if (themeFilter !== 'all') {
			filtered = filtered.filter((p) => p.category === themeFilter); // ✅ theme → category
		}

		setFilteredProverbs(filtered);
	};

	const flipCard = () => {
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
		const updatedProverbs = studyHistory.studyProverbs.filter(id => id !== currentProverb.id);

		// 2. 업데이트된 History 만들기
		const updatedHistory: UserProverbStudyHistory = {
			studyProverbs: updatedProverbs,
			studyCounts: studyHistory.studyCounts,
			badges: studyHistory.badges,
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
	}

	const handleComplete = async () => {
		const currentProverb = filteredProverbs[currentIndex];
		if (!currentProverb) return;

		const isLearned = studyHistory.studyProverbs.includes(currentProverb.id);

		if (!isLearned) {
			const updatedProverbs = [...studyHistory.studyProverbs, currentProverb.id];
			const updatedCounts = {
				...studyHistory.studyCounts,
				[currentProverb.id]: (studyHistory.studyCounts?.[currentProverb.id] || 0) + 1,
			};

			const updatedHistory: UserProverbStudyHistory = {
				studyProverbs: updatedProverbs,
				studyCounts: updatedCounts,
				badges: studyHistory.badges || [],
				lastStudyAt: new Date(),
			};

			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
			setStudyHistory(updatedHistory);

			const newFiltered = getFilteredProverbs(updatedProverbs);
			setFilteredProverbs(newFiltered);

			setCurrentIndex((prev) => Math.min(prev, newFiltered.length - 1));
			setIsFlipped(false);

			// ✅ 추가: 완료하면 전체보기 모드로 전환

			setPraiseText(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
			showEncourageToast();

			setTimeout(() => {
				carouselRef.current?.scrollTo({ index: currentIndex, animated: true });
			}, 300);
		}
	};

	const getFilteredProverbs = (customStudyProverbs: number[]) => {
		if (filter === 'learned') return proverbs.filter((p) => customStudyProverbs.includes(p.id));
		if (filter === 'learning') return proverbs.filter((p) => !customStudyProverbs.includes(p.id));
		return proverbs;
	};

	const frontInterpolate = flipAnim.interpolate({
		inputRange: [0, 180],
		outputRange: ['0deg', '180deg'],
	});

	const backInterpolate = flipAnim.interpolate({
		inputRange: [0, 180],
		outputRange: ['180deg', '360deg'],
	});


	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const mascot = mascotImagesQueue[index % mascotImagesQueue.length];
		const isLearned = studyHistory.studyProverbs.includes(item.id); // ✅ 완료 여부 체크

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
					<TouchableOpacity activeOpacity={0.9} style={styles.cardInner} onPress={flipCard}>
						{mascot && (
							<View style={{ marginBottom: 20 }}>
								<FastImage source={mascot} style={{ width: 240, height: 240 }} resizeMode="contain" />
							</View>
						)}
						<Text style={styles.cardLabel}>📜 속담</Text>
						<Text style={styles.proverbText}>{item.proverb}</Text>
						{isLearned && ( // ✅ 학습 완료한 경우
							<View style={styles.completedBadge}>
								<Text style={styles.completedBadgeText}>완료됨 ✅</Text>
							</View>
						)}
						<Text style={styles.hintText}>카드를 탭하면 뜻풀이를 볼 수 있어요 👆</Text>
					</TouchableOpacity>
				</Animated.View>

				<Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
					<TouchableOpacity activeOpacity={0.9} style={styles.cardInner} onPress={flipCard}>
						<Text style={styles.cardLabel}>🧠 뜻풀이</Text>
						<Text style={styles.meaningHighlight}>{item.meaning}</Text>
						{item.example ? (
							<Text style={styles.exampleText}>✏️ 예시: {item.example}</Text>
						) : (
							<Text style={styles.exampleText}>✏️ 예시가 없는 속담입니다</Text>
						)}
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
								{studyHistory.studyProverbs.length} / {proverbs.length}
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
								<View style={{ flex: 1, zIndex: themeOpen ? 1000 : 2000 }}> {/* zIndex 역전 방지 */}
									<DropDownPicker
										open={levelOpen}
										setOpen={setLevelOpen}
										value={levelFilter}
										setValue={setLevelFilter}
										items={levelOptions}
										style={styles.dropdown}
										textStyle={{ fontSize: 15, color: '#2c3e50', fontWeight: '500' }}
										placeholderStyle={{ color: '#95a5a6', fontSize: 14 }}
										dropDownContainerStyle={styles.dropdownList}
										containerStyle={{ zIndex: 3000, elevation: 10 }}
										zIndex={9999}           // 높게 설정
										zIndexInverse={1000}    // 반대 드롭다운일 경우 대비
										listMode='SCROLLVIEW' /* 스크롤뷰 모드로 변경 */
									/>
								</View>
								<View style={{ width: 8 }} />
								<View style={{ flex: 1, zIndex: levelOpen ? 1000 : 2000 }}>
									<DropDownPicker
										open={themeOpen}
										setOpen={setThemeOpen}
										value={themeFilter}
										setValue={setThemeFilter}
										items={categoryOptions}
										style={styles.dropdown}
										textStyle={{ fontSize: 15, color: '#2c3e50', fontWeight: '500' }}
										placeholderStyle={{ color: '#95a5a6', fontSize: 14 }}
										dropDownContainerStyle={styles.dropdownList}
										containerStyle={{ zIndex: 3000, elevation: 10 }}
										zIndex={9999}           // 높게 설정
										zIndexInverse={1000}    // 반대 드롭다운일 경우 대비
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
					<Animated.View style={[styles.carouselContainer]}>
						<Carousel
							ref={carouselRef}
							width={screenWidth * 0.85}
							height={screenHeight * 0.5}
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
				)}

				<View style={styles.buttonWrapper}>
					{studyHistory.studyProverbs.includes(filteredProverbs[currentIndex]?.id) ? (
						<TouchableOpacity style={styles.retryButton} onPress={handleAgain}>
							<Text style={styles.buttonText}>다시 학습하기</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
							<Text style={styles.buttonText}>학습 완료</Text>
						</TouchableOpacity>
					)}
				</View>

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
			</View>
		</SafeAreaView >
	);
};

export default ProverbStudyScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f9fafb', // 기존보다 덜 눈부심
	},
	cardWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	card: {
		width: screenWidth * 0.85,
		height: screenHeight * 0.5,
		backgroundColor: '#fff',
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backfaceVisibility: 'hidden',
		position: 'absolute',
		elevation: 6,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	cardBack: {
		backgroundColor: '#4a90e2',
	},
	cardInner: {
		width: '100%',
		height: '100%',
		padding: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	proverbText: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
	},
	hintText: {
		marginTop: 20,
		fontSize: 14,
		color: '#7f8c8d',
		textAlign: 'center',
	},
	cardLabel: {
		fontSize: 16,
		color: '#7f8c8d',
		marginBottom: 10,
		textAlign: 'center',
		fontWeight: '500',
	},
	meaningHighlight: {
		fontSize: 20,
		color: '#fff',
		fontWeight: 'bold',
		textAlign: 'center',
		marginVertical: 10,
	},
	exampleText: {
		fontSize: 14,
		color: '#dfe6e9',
		fontStyle: 'italic',
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
		elevation: 4,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
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
		elevation: 2,
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
		borderColor: '#dfe6e9',
		borderWidth: 1.2,
		borderRadius: 12,
		paddingHorizontal: 12,
		height: 44,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 2,
	},
	dropdownList: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1.2,
		borderRadius: 12,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		paddingBottom: 0,
		marginBottom: 0,
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
	},
	retryButton: {
		backgroundColor: '#f39c12', // 다시 학습은 노란색 계열
		paddingVertical: 12,
		paddingHorizontal: 30,
		borderRadius: 30,
		elevation: 4,
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
		elevation: 10,
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
});
