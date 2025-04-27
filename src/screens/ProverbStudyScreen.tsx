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
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';

const STORAGE_KEY = 'UserProverbStudyHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface UserProverbStudyHistory {
	studyProverbs: number[];
	studyCounts?: { [id: string]: number };
	badges?: string[];
	lastStudyAt: Date;
}

const ProverbStudyScreen = () => {
	const carouselRef = useRef<any>(null);
	const flipAnim = useRef(new Animated.Value(0)).current;

	const [proverbs, setProverbs] = useState<MainDataType.Proverb[]>([]);
	const [filteredProverbs, setFilteredProverbs] = useState<MainDataType.Proverb[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const [showExitModal, setShowExitModal] = useState(false);

	const [studyHistory, setStudyHistory] = useState<UserProverbStudyHistory>({
		studyProverbs: [],
		studyCounts: {},
		lastStudyAt: new Date(),
	});

	const [filter, setFilter] = useState<'all' | 'learning' | 'learned'>('learning');

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
		filterData();
	}, [proverbs, studyHistory, filter]);

	const filterData = () => {
		if (filter === 'learned') {
			setFilteredProverbs(proverbs.filter((p) => studyHistory.studyProverbs.includes(p.id)));
		} else if (filter === 'learning') {
			setFilteredProverbs(proverbs.filter((p) => !studyHistory.studyProverbs.includes(p.id)));
		} else {
			setFilteredProverbs(proverbs);
		}
	};

	const flipCard = () => {
		Animated.timing(flipAnim, {
			toValue: isFlipped ? 0 : 180,
			duration: 300,
			useNativeDriver: true,
		}).start(() => setIsFlipped(!isFlipped));
	};

	const handleComplete = async () => {
		const currentProverb = filteredProverbs[currentIndex];
		if (!currentProverb) return;

		const isLearned = studyHistory.studyProverbs.includes(currentProverb.id);

		// 학습 완료 추가
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

			setStudyHistory(updatedHistory);
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

			// ✅ 이 부분 추가
			const newFiltered = getFilteredProverbs(updatedProverbs);
			setFilteredProverbs(newFiltered);

			// ✅ 현재 인덱스를 바로 계산
			const nextIndex = Math.min(currentIndex, newFiltered.length - 1);

			setIsFlipped(false);
			setTimeout(() => {
				setCurrentIndex(nextIndex);
				carouselRef.current?.scrollTo({ index: nextIndex, animated: true });
			}, 300);
		} else {
			// 이미 학습된 경우 (굳이 다시 이동할 필요 없음)
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

	const renderItem = ({ item }: { item: MainDataType.Proverb }) => {
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
						<Text style={styles.cardLabel}>📜 속담</Text>
						<Text style={styles.proverbText}>{item.proverb}</Text>
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
				<View style={styles.progressWrapper}>
					<Text style={styles.progressText}>
						{currentIndex + 1} / {filteredProverbs.length}
					</Text>
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
							}}
						/>
					</Animated.View>
				)}

				<View style={styles.buttonWrapper}>
					<TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
						<Text style={styles.buttonText}>학습 완료</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.studyEndWrapper}>
					<TouchableOpacity style={styles.studyEndButton} onPress={() => setShowExitModal(true)}>
						<Text style={styles.studyEndText}>학습 종료</Text>
					</TouchableOpacity>
				</View>
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
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
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
});
