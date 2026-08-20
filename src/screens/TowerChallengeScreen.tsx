// @/screens/TowerChallenge.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth, screenWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Carousel from 'react-native-reanimated-carousel';
import AdmobRewardAd from './common/ads/AdmobRewardAd';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';
import CompleteOverlay from './common/CompleteOverlay';
import BottomHomeButton from './common/BottomHomeButton';
import DateUtils from '@/utils/DateUtils';

const TOWER_STORAGE_KEY = 'TOWER_CHALLENGE_PROGRESS';
const SCREEN_WIDTH = screenWidth;

const TowerChallengeScreen = () => {
	const navigation = useNavigation();
	const [progress, setProgress] = useState<TowerProgress>({
		level: 1,
		attempts: 1,
		adRewardUsed: 0,
		completedLevels: [],
		currentQuestion: 0,
		correctAnswers: 0,
		lastAttemptDate: DateUtils.getLocalDateString(),
		unlockedRewards: [], // 이 줄 추가
	});

	// state
	const [showAd, setShowAd] = useState(false);

	// 진입 애니메이션 (헤더 → 하단 안내 순서로 fade + slide-up)
	const headerAnim = useRef(new Animated.Value(0)).current;
	const infoAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		loadProgress();
	}, []);

	useEffect(() => {
		const anim = Animated.stagger(120, [
			Animated.timing(headerAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
			Animated.timing(infoAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, []);

	const loadProgress = async () => {
		try {
			const saved = await AsyncStorage.getItem(TOWER_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				const today = DateUtils.getLocalDateString();

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
						lastAttemptDate: DateUtils.getLocalDateString(),
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
					{isCompleted && <CompleteOverlay />}
					{/* 레벨 배지 */}
					<View style={[styles.levelBadge, { backgroundColor: tower.color }]}>
						<Text style={styles.levelText}>LV.{tower.level}</Text>
						{isCompleted && (
							<IconComponent type="materialIcons" name="check-circle" size={scaledSize(18)} color={COLORS.textWhite} style={styles.badgeIcon} />
						)}
						{isLocked && <IconComponent type="materialIcons" name="lock" size={scaledSize(18)} color={COLORS.textWhite} style={styles.badgeIcon} />}
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
								<IconComponent type="materialIcons" name="lock" size={scaledSize(48)} color={COLORS.textSecondary} />
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
											<IconComponent type="materialIcons" name="favorite" size={scaledSize(18)} color={COLORS.textWhite} />
											<Text style={styles.challengeButtonText}>도전하기 (하트 -1)</Text>
										</>
									) : (
										<>
											<IconComponent type="materialIcons" name="play-circle-filled" size={scaledSize(18)} color={COLORS.textWhite} />
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
			{/* 배경 그라디언트 (드라큘라 컨셉) */}
			<LinearGradient colors={COLORS.darkGradient} style={StyleSheet.absoluteFillObject} />

			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				{/* 타워 메인 헤더 */}
				<Animated.View
					style={[
						styles.headerSection,
						{
							opacity: headerAnim,
							transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) }],
						},
					]}>
					{__DEV__ && (
						<TouchableOpacity onPress={handleDevReset} style={styles.devButton}>
							<IconComponent type="materialIcons" name="build" size={scaledSize(18)} color={COLORS.warning} />
							<Text style={styles.devButtonText}>DEV</Text>
						</TouchableOpacity>
					)}
					<Text style={styles.mainTitle}>타워 챌린지</Text>
					<Text style={styles.subTitle}>정상을 향한 여정</Text>
					<FastImage source={require('@/assets/images/screen-heroes/tower-adventure.png')} style={styles.towerGuideImage} resizeMode="contain" />
				</Animated.View>

				{/* 도전 횟수 표시 */}

				{/* 캐러셀 */}
				<View style={styles.carouselContainer}>
					<Carousel
						loop={false}
						width={SCREEN_WIDTH * 0.9}
						height={scaleHeight(480)} // 620 → 480
						data={TOWER_LEVELS}
						renderItem={renderTowerCard}
						mode="parallax"
						modeConfig={{
							parallaxScrollingScale: 0.92,
							parallaxScrollingOffset: 45,
						}}
					/>
				</View>
				<Animated.View
					style={[
						styles.descriptionSection,
						{
							opacity: infoAnim,
							transform: [{ translateY: infoAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) }],
						},
					]}>
					{/* 남은 도전 + 광고 카드 */}
					<View style={styles.attemptsRow}>
						{/* 남은 도전 횟수 */}
						<View style={styles.attemptCard}>
							<View style={styles.heartIconWrap}>
								{Array.from({ length: progress.attempts }).map((_, i) => (
									<IconComponent key={i} type="materialIcons" name="favorite" size={scaledSize(18)} color={COLORS.danger} />
								))}
							</View>
							<Text style={styles.attemptLabel}>오늘 남은 도전</Text>
							<Text style={styles.attemptCount}>
								{progress.attempts}
								<Text style={styles.attemptUnit}>회</Text>
							</Text>
						</View>

						<TouchableOpacity
							style={[styles.adCard, progress.adRewardUsed >= 3 && styles.adCardDisabled]}
							onPress={handleWatchAd}
							activeOpacity={0.8}>
							<IconComponent type="materialIcons" name="play-circle-filled" size={scaledSize(22)} color={COLORS.textWhite} />
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
				</Animated.View>

				<View style={styles.bottomPadding} />
				<BottomHomeButton
					backgroundColor="transparent"
					borderColor="rgba(255,255,255,0.1)"
					textColor={COLORS.darkText}
					iconColor={COLORS.darkTextSecondary}
				/>

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

const styles = themedStyles(() => StyleSheet.create({
	container: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	headerSection: {
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.sm,
		paddingBottom: SPACING_H.xs,
	},
	towerGuideImage: { position: 'absolute', right: SPACING_W.lg, top: 0, width: scaleWidth(78), height: scaleHeight(82) },
	mainTitle: {
		fontSize: FONT_SIZES.title,
		fontWeight: '700',
		color: COLORS.textWhite,
		marginTop: SPACING_H.xs,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	subTitle: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.darkTextSecondary,
		marginTop: SPACING_H.xs,
		letterSpacing: 1,
	},
	attemptsRow: {
		flexDirection: 'row',
		gap: SPACING_W.md,
		marginBottom: SPACING_H.md,
		height: scaleHeight(90), // alignItems: 'stretch' 제거, 고정 높이
	},
	attemptCard: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(239, 68, 68, 0.1)',
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.md,
		borderWidth: 1.5,
		borderColor: 'rgba(239, 68, 68, 0.35)',
		gap: SPACING_H.xs,
	},
	adCard: {
		flex: 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: SPACING_W.md,
		borderRadius: RADIUS.lg,
		borderWidth: 1.5,
		borderColor: 'rgba(59, 130, 246, 0.5)',
		backgroundColor: COLORS.secondary, // LinearGradient 대신 단색
		paddingHorizontal: SPACING_W.lg,
	},
	adCardDisabled: {
		borderColor: 'rgba(100, 116, 139, 0.4)',
		backgroundColor: COLORS.textSecondary,
	},
	adTextContainer: {
		flexShrink: 1,
	},
	adButtonTitle: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.textWhite,
	},
	adButtonSub: {
		fontSize: FONT_SIZES.xxs,
		color: 'rgba(255,255,255,0.7)',
		marginTop: SPACING_H.xs,
	},
	heartIconWrap: {
		flexDirection: 'row',
		gap: SPACING_W.xs,
		marginBottom: SPACING_H.xs,
	},
	attemptLabel: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.darkTextSecondary,
		fontWeight: '500',
	},
	attemptCount: {
		fontSize: scaledSize(26),
		fontWeight: '700',
		color: COLORS.textWhite,
		lineHeight: scaledSize(30),
	},
	attemptUnit: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.darkTextSecondary,
	},
	carouselContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	carouselItem: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: SPACING_W.sm,
	},
	towerCard: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
		overflow: 'hidden', // ← 추가
	},
	towerCardCompleted: {
		backgroundColor: 'rgba(34, 197, 94, 0.12)',
		borderColor: 'rgba(34, 197, 94, 0.3)',
	},
	towerCardLocked: {
		backgroundColor: 'rgba(52, 73, 94, 0.12)',
		borderColor: 'rgba(52, 73, 94, 0.2)',
	},
	levelBadge: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		marginBottom: SPACING_H.sm,
	},
	levelText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
		color: COLORS.textWhite,
	},
	badgeIcon: {
		marginLeft: SPACING_W.xs,
	},
	towerName: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		color: COLORS.textWhite,
		marginBottom: SPACING_H.sm,
		textAlign: 'center',
	},
	bossContainer: {
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	bossWrapper: {
		position: 'relative',
		marginBottom: SPACING_H.xs,
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
		marginBottom: SPACING_H.sm,
	},
	lockedText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.sm,
		fontWeight: '600',
	},
	bossName: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textWhite,
	},
	rewardSection: {
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
		paddingVertical: SPACING_H.sm,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	rewardLabel: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.darkTextSecondary,
		marginBottom: SPACING_H.xs,
		fontWeight: '600',
	},
	rewardBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	rewardImage: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(28) / 2,
		marginRight: SPACING_W.sm,
	},
	rewardName: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '600',
		color: COLORS.textWhite,
	},
	rewardLocked: {
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		paddingHorizontal: SPACING_W.xxl,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.round,
	},
	rewardLockedText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		fontWeight: '600',
	},
	bottomPadding: {
		height: SPACING_H.md,
	},
	challengeButton: {
		paddingVertical: SPACING_H.md,
		minHeight: scaleHeight(48),
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: RADIUS.md,
	},
	challengeButtonCompleted: {
		backgroundColor: COLORS.secondary,
	},
	challengeButtonLocked: {
		backgroundColor: COLORS.textSecondary,
	},
	challengeButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		letterSpacing: 0.5,
	},
	descriptionSection: {
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.xs,
	},
	descriptionBox: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	descriptionBullet: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.darkText,
		lineHeight: scaledSize(18),
		marginBottom: SPACING_H.xs,
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: SPACING_W.sm,
	},
	challengeButtonAd: {
		backgroundColor: COLORS.secondary,
	},
	devButton: {
		position: 'absolute',
		top: SPACING_H.sm,
		right: SPACING_W.lg,
		zIndex: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		backgroundColor: 'rgba(245, 158, 11, 0.2)',
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: 'rgba(245, 158, 11, 0.5)',
	},
	devButtonText: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.warning,
		fontWeight: '700',
	},
}));
