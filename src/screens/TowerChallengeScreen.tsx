// @/screens/TowerChallenge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Carousel from 'react-native-reanimated-carousel';
import BottomHomeButton from '@/components/BottomHomeButton';
import CompleteOverlay from '@/components/CompleteOverlay';
import AdmobRewardAd from './common/ads/AdmobRewardAd';

const TOWER_STORAGE_KEY = 'TOWER_CHALLENGE_PROGRESS';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TowerChallengeScreen = () => {
	const navigation = useNavigation();
	const [progress, setProgress] = useState<TowerProgress>({
		level: 1,
		attempts: 1,
		adRewardUsed: 0,
		completedLevels: [],
		currentQuestion: 0,
		correctAnswers: 0,
		lastAttemptDate: new Date().toISOString().slice(0, 10),
		unlockedRewards: [], // 이 줄 추가
	});

	// state
	const [showAd, setShowAd] = useState(false);


	useEffect(() => {
		loadProgress();
	}, []);

	const loadProgress = async () => {
		try {
			const saved = await AsyncStorage.getItem(TOWER_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				const today = new Date().toISOString().slice(0, 10);

				if (parsed.lastAttemptDate !== today) {
					parsed.attempts = 1;
					parsed.adRewardUsed = 0;
					parsed.lastAttemptDate = today;
				} else {
					parsed.attempts = Math.max(0, parsed.attempts ?? 1);
				}

				setProgress(parsed);
			}
		} catch (error) {
			console.error('탑 도전 데이터 로드 실패:', error);
		}
	};

	const saveProgress = async (newProgress: TowerProgress) => {
		try {
			await AsyncStorage.setItem(TOWER_STORAGE_KEY, JSON.stringify(newProgress));
			setProgress(newProgress);
		} catch (error) {
			console.error('탑 도전 데이터 저장 실패:', error);
		}
	};

	const handleWatchAd = () => {
		if (progress.adRewardUsed >= 3) {
			Alert.alert('알림', '오늘은 더 이상 광고를 볼 수 없습니다.');
			return;
		}
		setShowAd(true);
	};


	// handleStartChallenge 함수 수정
	const handleStartChallenge = (level: number) => {
		const towerLevel = TOWER_LEVELS.find((t) => t.level === level);

		if (!towerLevel) {
			return;
		}

		if (progress.level < level) {
			Alert.alert('알림', '이전 레벨을 먼저 클리어해주세요!');
			return;
		}

		if (progress.completedLevels.includes(level)) {
			Alert.alert('알림', '이미 완료한 레벨입니다! 🎉');
			return;
		}

		// 도전 횟수가 없으면 광고 시청 유도
		if (progress.attempts <= 0) {
			Alert.alert('도전 횟수 부족', '광고를 시청하여 도전 기회를 얻으시겠습니까?', [
				{ text: '취소', style: 'cancel' },
				{ text: '광고 시청', onPress: handleWatchAd },
			]);
			return;
		}

		const newAttempts = Math.max(0, progress.attempts - 1); // 음수 방지
		const newProgress = {
			...progress,
			attempts: newAttempts,
		};
		saveProgress(newProgress);

		// 타입 안전하게 네비게이션
		// @ts-ignore
		navigation.navigate(Paths.TOWER_QUIZ, { level });
	};
	const handleDevReset = () => {
		Alert.alert('개발자 모드', '작업을 선택하세요', [
			{ text: '취소', style: 'cancel' },
			...TOWER_LEVELS.map((t) => ({
				text: `${t.level}단계 클리어`,
				onPress: async () => {
					const newCompleted = [...new Set([...progress.completedLevels, t.level])];
					const newLevel = Math.max(progress.level, t.level + 1);
					const clearedProgress: TowerProgress = {
						...progress,
						level: newLevel,
						completedLevels: newCompleted,
						unlockedRewards: [...new Set([...progress.unlockedRewards, t.level])],
					};
					await saveProgress(clearedProgress);
					Alert.alert('완료', `${t.level}단계 클리어 처리되었습니다.`);
				},
			})),
			{
				text: '처음 상태로 초기화',
				style: 'destructive',
				onPress: async () => {
					await AsyncStorage.removeItem(TOWER_STORAGE_KEY);
					setProgress({
						level: 1,
						attempts: 1,
						adRewardUsed: 0,
						completedLevels: [],
						currentQuestion: 0,
						correctAnswers: 0,
						lastAttemptDate: new Date().toISOString().slice(0, 10),
						unlockedRewards: [],
					});
					Alert.alert('완료', '초기화되었습니다.');
				},
			},
		]);
	};
	// renderTowerCard 함수 전체 수정
	const renderTowerCard = ({ item: tower, index }: { item: (typeof TOWER_LEVELS)[0]; index: number }) => {
		const isCompleted = progress.completedLevels.includes(tower.level);
		const isLocked = progress.level < tower.level;

		return (
			<View style={styles.carouselItem}>
				<View style={[styles.towerCard, isCompleted && styles.towerCardCompleted, isLocked && styles.towerCardLocked]}>
					{isCompleted && <CompleteOverlay />}  {/* ← 추가 */}
					{/* 레벨 배지 */}
					<View style={[styles.levelBadge, { backgroundColor: tower.color }]}>
						<Text style={styles.levelText}>LV.{tower.level}</Text>
						{isCompleted && (
							<IconComponent type="materialIcons" name="check-circle" size={18} color="#fff" style={styles.badgeIcon} />
						)}
						{isLocked && <IconComponent type="materialIcons" name="lock" size={18} color="#fff" style={styles.badgeIcon} />}
					</View>
					<Text style={styles.towerName}>{tower.name}</Text>
					{/* 보스 섹션 */}
					<View style={styles.bossContainer}>
						{!isLocked ? (
							<View style={styles.bossWrapper}>
								<View style={[styles.bossGlow, { backgroundColor: tower.color + '30' }]} />
								<View style={[styles.bossImageContainer, { borderColor: tower.color }]}>
									<FastImage source={tower.bossImage} style={styles.bossImage} resizeMode="contain" />
								</View>
							</View>
						) : (
							<View style={styles.lockedBoss}>
								<IconComponent type="materialIcons" name="lock" size={48} color="#546e7a" />
								<Text style={styles.lockedText}>LOCKED</Text>
							</View>
						)}
						<Text style={styles.bossName}>{isLocked ? '???' : tower.bossName}</Text>
					</View>
					{/* 보상 */}
					<View style={styles.rewardSection}>
						<Text style={styles.rewardLabel}>🎁 클리어 보상</Text>
						{!isLocked ? (
							<View style={styles.rewardBox}>
								<FastImage source={tower.reward.image} style={styles.rewardImage} />
								<Text style={styles.rewardName}>{tower.reward.name}</Text>
							</View>
						) : (
							<View style={styles.rewardLocked}>
								<Text style={styles.rewardLockedText}>???</Text>
							</View>
						)}
					</View>
					{/* 도전 버튼 */}
					{/* 도전 버튼 */}
					<TouchableOpacity
						onPress={() => handleStartChallenge(tower.level)}
						disabled={isLocked}
						style={[
							styles.challengeButton,
							isCompleted && styles.challengeButtonCompleted,
							isLocked && styles.challengeButtonLocked,
							!isCompleted && !isLocked && progress.attempts > 0 && { backgroundColor: tower.color },
							!isCompleted && !isLocked && progress.attempts <= 0 && styles.challengeButtonAd,
						]}
						activeOpacity={0.8}>
						<View style={styles.buttonContent}>
							{!isCompleted && !isLocked && (
								<>
									{progress.attempts > 0 ? (
										<>
											<IconComponent type="materialIcons" name="favorite" size={18} color="#fff" />
											<Text style={styles.challengeButtonText}>도전하기 (하트 -1)</Text>
										</>
									) : (
										<>
											<IconComponent type="materialIcons" name="play-circle-filled" size={18} color="#fff" />
											<Text style={styles.challengeButtonText}>광고 보고 도전하기</Text>
										</>
									)}
								</>
							)}
							{isCompleted && <Text style={styles.challengeButtonText}>✓ 완료</Text>}
							{isLocked && <Text style={styles.challengeButtonText}>잠김</Text>}
						</View>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			{/* 배경 그라디언트 */}
			<LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFillObject} />

			<SafeAreaView style={styles.safeArea} edges={['top']}>
				{/* 타워 메인 헤더 */}
				<View style={styles.headerSection}>
					{/* <View style={styles.towerImageContainer}>
						<View style={styles.towerGlow} />
						<FastImage source={require('@/assets/images/tower.png')} style={styles.towerMainImage} resizeMode="contain" />
					</View> */}
					{__DEV__ && (
						<TouchableOpacity onPress={handleDevReset} style={styles.devButton}>
							<IconComponent type="materialIcons" name="build" size={18} color="#f39c12" />
							<Text style={styles.devButtonText}>DEV</Text>
						</TouchableOpacity>
					)}
					<Text style={styles.mainTitle}>타워 챌린지</Text>
					<Text style={styles.subTitle}>정상을 향한 여정</Text>
				</View>


				{/* 도전 횟수 표시 */}

				{/* 캐러셀 */}
				<View style={styles.carouselContainer}>
					<Carousel
						loop={false}
						width={SCREEN_WIDTH * 0.9}
						height={scaleHeight(480)}  // 620 → 480
						data={TOWER_LEVELS}
						renderItem={renderTowerCard}
						mode="parallax"
						modeConfig={{
							parallaxScrollingScale: 0.92,
							parallaxScrollingOffset: 45,
						}}
					/>
				</View>
				<View style={styles.descriptionSection}>
					{/* 남은 도전 + 광고 카드 */}
					<View style={styles.attemptsRow}>
						{/* 남은 도전 횟수 */}
						<View style={styles.attemptCard}>
							<View style={styles.heartIconWrap}>
								{Array.from({ length: progress.attempts }).map((_, i) => (
									<IconComponent
										key={i}
										type="materialIcons"
										name="favorite"
										size={18}
										color="#e74c3c"
									/>
								))}
							</View>
							<Text style={styles.attemptLabel}>오늘 남은 도전</Text>
							<Text style={styles.attemptCount}>{progress.attempts}<Text style={styles.attemptUnit}>회</Text></Text>
						</View>

						<TouchableOpacity
							style={[styles.adCard, progress.adRewardUsed >= 3 && styles.adCardDisabled]}
							onPress={handleWatchAd}
							activeOpacity={0.8}
						>
							<IconComponent type="materialIcons" name="play-circle-filled" size={22} color="#fff" />
							<View style={styles.adTextContainer}>
								<Text style={styles.adButtonTitle}>광고 보고 +1회</Text>
								<Text style={styles.adButtonSub}>
									{progress.adRewardUsed >= 3 ? '오늘 모두 사용함' : `오늘 ${progress.adRewardUsed}/3 사용`}
								</Text>
							</View>
						</TouchableOpacity>
					</View>

					{/* 안내 박스 */}
					<View style={styles.descriptionBox}>
						<Text style={styles.descriptionBullet}>• 각 레벨마다 5문제를 모두 맞춰야 클리어!</Text>
						<Text style={styles.descriptionBullet}>• 클리어 시 특별한 보상을 획득할 수 있어요</Text>
						<Text style={styles.descriptionBullet}>• 하루 1회만 도전 가능 (매일 자정 초기화)</Text>
						<Text style={styles.descriptionBullet}>• 광고 시청으로 최대 3회 추가 도전 가능</Text>
					</View>
				</View>


				<View style={styles.bottomPadding} />
				<BottomHomeButton />

				{showAd && (
					<AdmobRewardAd
						onRewarded={() => {
							const newProgress = {
								...progress,
								attempts: progress.attempts + 1,
								adRewardUsed: progress.adRewardUsed + 1,
							};
							saveProgress(newProgress);
							setShowAd(false); // ← 여기서 오버레이 닫기
							Alert.alert('성공!', '도전 기회 1회가 추가되었습니다! 🎉');
						}}
						onClosed={() => {
							setShowAd(false);
							Alert.alert('알림', '광고를 끝까지 시청해야 보상이 지급됩니다.');
						}}
						onFailed={() => {
							setShowAd(false);
							Alert.alert('알림', '광고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
						}}
					/>
				)}
			</SafeAreaView>
		</View>
	);
};

export default TowerChallengeScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	headerSection: {
		alignItems: 'center',
		paddingTop: scaleHeight(8),
		paddingBottom: scaleHeight(4),
	},
	towerImageContainer: {
		width: scaleWidth(100),
		height: scaleWidth(100),
		justifyContent: 'center',
		alignItems: 'center',
	},
	towerGlow: {
		position: 'absolute',
		width: scaleWidth(110),
		height: scaleWidth(110),
		borderRadius: scaleWidth(55),
		backgroundColor: 'rgba(52, 152, 219, 0.2)',
		shadowColor: '#3498db',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 20,
	},
	towerMainImage: {
		width: scaleWidth(80),
		height: scaleHeight(80),
		borderRadius: scaleWidth(40),
	},
	mainTitle: {
		fontSize: scaledSize(24),
		fontWeight: 'bold',
		color: '#fff',
		marginTop: scaleHeight(6),
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	subTitle: {
		fontSize: scaledSize(11),
		color: '#bdc3c7',
		marginTop: scaleHeight(1),
		letterSpacing: 1,
	},
	// 스타일 수정
	attemptsContainer: {
		paddingHorizontal: scaleWidth(20),
		paddingVertical: scaleHeight(8),
	},

	attemptsRow: {
		flexDirection: 'row',
		gap: scaleWidth(10),
		marginBottom: scaleHeight(10),
		height: scaleHeight(90),  // alignItems: 'stretch' 제거, 고정 높이
	},
	attemptCard: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(231, 76, 60, 0.1)',
		borderRadius: scaleWidth(14),
		paddingHorizontal: scaleWidth(10),
		borderWidth: 1.5,
		borderColor: 'rgba(231, 76, 60, 0.35)',
		gap: scaleHeight(4),
		// paddingVertical 제거
	},
	adCard: {
		flex: 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(10),
		borderRadius: scaleWidth(14),
		borderWidth: 1.5,
		borderColor: 'rgba(52, 152, 219, 0.5)',
		backgroundColor: '#2980b9',  // LinearGradient 대신 단색
		paddingHorizontal: scaleWidth(14),
	},
	adCardDisabled: {
		borderColor: 'rgba(84, 110, 122, 0.4)',
		backgroundColor: '#607d8b',
	},
	adTextContainer: {
		flexShrink: 1,
	},
	adButtonTitle: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#fff',
	},
	adButtonSub: {
		fontSize: scaledSize(10),
		color: 'rgba(255,255,255,0.7)',
		marginTop: scaleHeight(2),
	},
	heartIconWrap: {
		flexDirection: 'row',
		gap: scaleWidth(3),
		marginBottom: scaleHeight(2),
	},
	attemptLabel: {
		fontSize: scaledSize(11),
		color: '#bdc3c7',
		fontWeight: '500',
	},
	attemptCount: {
		fontSize: scaledSize(26),
		fontWeight: 'bold',
		color: '#fff',
		lineHeight: scaledSize(30),
	},
	attemptUnit: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#bdc3c7',
	},
	adGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(14),
		gap: scaleWidth(10),
		flex: 1,               // 추가
		minHeight: scaleHeight(70),  // 추가
	},

	cardCompactText: {
		fontSize: scaledSize(13),
	},
	cardLabel: {
		color: '#bdc3c7',
	},
	cardValue: {
		fontWeight: 'bold',
		color: '#fff',
	},
	adValue: {
		color: '#3498db',
	},
	cardIconWrapper: {
		width: scaleWidth(44),
		height: scaleWidth(44),
		borderRadius: scaleWidth(22),
		backgroundColor: 'rgba(231, 76, 60, 0.15)',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1.5,
		borderColor: 'rgba(231, 76, 60, 0.3)',
	},
	adIconWrapper: {
		backgroundColor: 'rgba(52, 152, 219, 0.15)',
		borderColor: 'rgba(52, 152, 219, 0.3)',
	},
	cardContent: {
		flex: 1,
	},
	compactAttemptRow: {
		flexDirection: 'row',
		gap: scaleWidth(8),
		alignItems: 'center',
		height: scaleHeight(44), // 고정 높이 추가
	},
	attemptCompactBox: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(14),
		paddingVertical: scaleHeight(12), // 10에서 12로 증가
		borderRadius: scaleWidth(10),
		gap: scaleWidth(6),
		minWidth: scaleWidth(100),
		height: scaleHeight(44), // 고정 높이 추가
	},
	adCompactButton: {
		flex: 1,
		borderRadius: scaleWidth(10),
		overflow: 'hidden',
		minWidth: scaleWidth(140),
		height: scaleHeight(44), // 고정 높이 추가
	},
	adCompactGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: scaleHeight(12), // 10에서 12로 증가
		gap: scaleWidth(4),
		height: '100%', // 부모 높이에 맞춤
	},
	attemptCompactText: {
		fontSize: scaledSize(13),
		color: '#ecf0f1',
		flexShrink: 0,
	},
	attemptCompactCount: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#fff',
	},
	adCompactText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: '600',
		flexShrink: 0,
	},
	carouselContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	carouselItem: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(8),
	},
	towerCard: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: scaleWidth(20),
		padding: scaleWidth(16),
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		overflow: 'hidden', // ← 추가
	},
	towerCardCompleted: {
		backgroundColor: 'rgba(39, 174, 96, 0.12)',
		borderColor: 'rgba(39, 174, 96, 0.3)',
	},
	towerCardLocked: {
		backgroundColor: 'rgba(52, 73, 94, 0.12)',
		borderColor: 'rgba(52, 73, 94, 0.2)',
	},
	// cardGradient 스타일 삭제

	levelBadge: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(20),
		marginBottom: scaleHeight(8),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
	},
	levelText: {
		fontSize: scaledSize(12),
		fontWeight: 'bold',
		color: '#fff',
	},
	badgeIcon: {
		marginLeft: scaleWidth(6),
	},

	cardGradient: {
		padding: scaleWidth(16),
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: scaleWidth(20),
	},
	towerName: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},
	bossContainer: {
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	bossWrapper: {
		position: 'relative',
		marginBottom: scaleHeight(4),
	},
	bossGlow: {
		position: 'absolute',
		width: scaleWidth(100),
		height: scaleWidth(100),
		borderRadius: scaleWidth(50),
		top: scaleWidth(3),
		left: scaleWidth(3),
	},
	bossImageContainer: {
		width: scaleWidth(106),
		height: scaleWidth(106),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		borderRadius: scaleWidth(53),
		borderWidth: 3,
	},
	bossImage: {
		width: scaleWidth(90),
		height: scaleWidth(90),
		borderRadius: scaleWidth(45),
	},
	lockedBoss: {
		width: scaleWidth(106),
		height: scaleWidth(106),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		borderRadius: scaleWidth(53),
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.1)',
		marginBottom: scaleHeight(8),
	},
	lockedText: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
		marginTop: scaleHeight(8),
		fontWeight: '600',
	},
	bossName: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#fff',
	},
	rewardSection: {
		alignItems: 'center',
		marginBottom: scaleHeight(8),
		paddingVertical: scaleHeight(8),
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	rewardLabel: {
		fontSize: scaledSize(12),
		color: '#bdc3c7',
		marginBottom: scaleHeight(6),
		fontWeight: '600',
	},
	rewardBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(10),
	},
	rewardImage: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(14),
		marginRight: scaleWidth(6),
	},
	rewardName: {
		fontSize: scaledSize(13),
		fontWeight: '600',
		color: '#fff',
	},
	rewardLocked: {
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		paddingHorizontal: scaleWidth(24),
		paddingVertical: scaleHeight(8),
		borderRadius: scaleWidth(12),
	},
	rewardLockedText: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		fontWeight: '600',
	},
	challengeButtonWrapper: {
		borderRadius: scaleWidth(12),
		overflow: 'hidden',
	},
	bottomPadding: {
		height: scaleHeight(20),
	},

	challengeButton: {
		paddingVertical: scaleHeight(14),
		minHeight: 48,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: scaleWidth(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
	},
	challengeButtonCompleted: {
		backgroundColor: '#27ae60',
	},
	challengeButtonLocked: {
		backgroundColor: '#7f8c8d',
	},
	challengeButtonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		letterSpacing: 0.5,
	},
	descriptionText: {
		fontSize: scaledSize(14),
		color: '#ecf0f1',
		textAlign: 'center',
		fontWeight: '600',
		marginBottom: scaleHeight(4),
	},
	descriptionSubText: {
		fontSize: scaledSize(11),
		color: '#95a5a6',
		textAlign: 'center',
	},
	descriptionSection: {
		paddingHorizontal: scaleWidth(20),
		paddingVertical: scaleHeight(10),
		marginBottom: scaleHeight(4),
	},
	descriptionTitle: {
		fontSize: scaledSize(15),
		color: '#fff',
		fontWeight: 'bold',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},
	descriptionBox: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(14),
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	descriptionBullet: {
		fontSize: scaledSize(12),
		color: '#ecf0f1',
		lineHeight: scaledSize(18),
		marginBottom: scaleHeight(4),
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(6),
	},
	challengeButtonAd: {
		backgroundColor: '#3498db',
	},
	devButton: {
		position: 'absolute',   // ← 추가
		top: scaleHeight(8),    // ← 추가
		right: scaleWidth(16),  // ← 추가
		zIndex: 10,             // ← 추가
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		backgroundColor: 'rgba(243, 156, 18, 0.2)',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: 'rgba(243, 156, 18, 0.5)',
	},
	devButtonText: {
		fontSize: scaledSize(11),
		color: '#f39c12',
		fontWeight: 'bold',
	},
});
