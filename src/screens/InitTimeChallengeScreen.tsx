
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Image, Alert } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from './common/atomic/IconComponent';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import BottomHomeButton from '@/components/BottomHomeButton';

const RANK_CONFIG = [
	{ trophy: '#F59E0B', label: (styles) => styles.firstRankLabel, score: (styles) => styles.firstRankScore, trophySize: 22 },
	{ trophy: '#9CA3AF', label: (styles) => styles.secondRankLabel, score: (styles) => styles.secondRankScore, trophySize: 19 },
	{ trophy: '#CD7F32', label: (styles) => styles.thirdRankLabel, score: (styles) => styles.thirdRankScore, trophySize: 17 },
];

const InitTimeChallengeScreen = () => {
	const STORAGE_KEY = MainStorageKeyType.TIME_CHALLENGE_HISTORY;
	const navigation = useNavigation();
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;

	const [count, setCount] = useState(3);
	const [showAllRules, setShowAllRules] = useState(false);
	const [isCountingDown, setIsCountingDown] = useState(false);
	const [top5History, setTop5History] = useState<MainDataType.TimeChallengeResult[]>([]);
	const [showAd, setShowAd] = useState(false);
	const [adWatched, setAdWatched] = useState(false);

	const isDev = __DEV__;
	const shouldShowAd = !isDev && Math.random() < 0.5;

	useEffect(() => {
		fetchTopHistory();
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 500,
			useNativeDriver: true,
		}).start();
	}, []);

	const fetchTopHistory = async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY);
			const history: MainDataType.TimeChallengeResult[] = raw ? JSON.parse(raw) : [];
			const sorted = history.sort((a, b) => b.finalScore - a.finalScore);
			setTop5History(sorted.slice(0, 5));
		} catch (e) {
			console.error('기록 불러오기 실패', e);
		}
	};

	const getRelativeDateLabel = (isoString: string): string => {
		try {
			const inputDate = new Date(isoString);
			const now = new Date();
			const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const startOfInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
			const diffMs = startOfToday.getTime() - startOfInput.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
			const hour = inputDate.getHours();
			const minute = inputDate.getMinutes();
			const timeStr = `${hour}:${String(minute).padStart(2, '0')}`;

			if (diffDays === 0) {return `오늘 ${timeStr}`;}
			if (diffDays === 1) {return `어제 ${timeStr}`;}
			if (diffDays === 2) {return `그제 ${timeStr}`;}
			if (diffDays < 7) {return `${diffDays}일 전`;}
			if (diffDays < 30) {return `${Math.floor(diffDays / 7)}주 전`;}

			const y = inputDate.getFullYear();
			const m = String(inputDate.getMonth() + 1).padStart(2, '0');
			const d = String(inputDate.getDate()).padStart(2, '0');
			return `${y}.${m}.${d}`;
		} catch {
			return isoString;
		}
	};

	const handleStartChallenge = () => {
		if (!adWatched && shouldShowAd) {
			setShowAd(true);
			return;
		}
		setIsCountingDown(true);
		setShowAllRules(false);

		let countdown = 3;
		setCount(countdown);
		animateScale();

		const timer = setInterval(() => {
			countdown--;
			if (countdown < 0) {
				clearInterval(timer);
				setTimeout(() => {
					setIsCountingDown(false);
					// @ts-ignore
					navigation.navigate(Paths.TIME_CHANLLENGE);
				}, 800);
				return;
			}
			setCount(countdown);
			animateScale();
		}, 1000);
	};

	const animateScale = () => {
		scaleAnim.setValue(1.6);
		Animated.spring(scaleAnim, {
			toValue: 1,
			useNativeDriver: true,
			friction: 4,
		}).start();
	};

	const COUNTDOWN_MESSAGES: Record<number, string> = {
		3: '심호흡하고 준비하세요 🌬️',
		2: '집중! 곧 시작됩니다 👀',
		1: '손가락을 올려두세요 ☝️',
		0: '지금 시작! 🔥',
	};

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
				<ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
					{/* 헤더 이미지 */}
					<View style={styles.imageContainer}>
						<View style={styles.imageGlow}>
							<Image source={require('@/assets/images/timeChanllenge.jpg')} style={styles.challengeImage} resizeMode="cover" />
						</View>
						<Text style={styles.heroTitle}>타임 챌린지</Text>
						<Text style={styles.heroSubtitle}>180초 안에 속담을 최대한 많이 맞혀보세요!</Text>
					</View>

					{/* 규칙 카드 */}
					<View style={styles.sectionCard}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionIcon}>📋</Text>
							<Text style={styles.sectionTitle}>게임 규칙</Text>
						</View>

						<View style={styles.ruleItem}>
							<Text style={styles.ruleDot}>•</Text>
							<Text style={styles.ruleText}>
								<Text style={styles.ruleBold}>제한 시간 180초</Text> 동안 속담의 의미를 최대한 많이 맞혀보세요.
							</Text>
						</View>
						<View style={styles.ruleItem}>
							<Text style={styles.ruleDot}>•</Text>
							<Text style={styles.ruleText}>오답 시 하트(❤️ 최대 5개)가 1개 차감됩니다. 하트가 모두 소진되면 게임이 종료됩니다.</Text>
						</View>

						{showAllRules ? (
							<>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleDot}>•</Text>
									<Text style={styles.ruleText}>
										어려운 문제는 <Text style={styles.ruleBold}>스킵(1회)</Text>으로 건너뛸 수 있습니다.
									</Text>
								</View>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleDot}>•</Text>
									<Text style={styles.ruleText}>
										<Text style={styles.ruleBold}>찬스(1회)</Text>를 사용하면 잠시 동안 한자 뜻과 예문이 공개됩니다.
									</Text>
								</View>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleDot}>•</Text>
									<Text style={styles.ruleText}>게임 중 종료 시 해당 회차 기록은 저장되지 않습니다.</Text>
								</View>

								<View style={styles.bonusDivider} />
								<Text style={styles.bonusTitle}>🎁 점수 달성 보너스</Text>

								<View style={styles.bonusRow}>
									<Text style={styles.bonusPoints}>100 / 300 / 400점</Text>
									<View style={styles.bonusBadge}>
										<Text style={styles.bonusBadgeText}>⏱ +10초</Text>
									</View>
								</View>
								<View style={styles.bonusRow}>
									<Text style={styles.bonusPoints}>200 / 500점</Text>
									<View style={[styles.bonusBadge, styles.bonusBadgeSpecial]}>
										<Text style={styles.bonusBadgeText}>⏱ +10초 ❤️ +1</Text>
									</View>
								</View>

								<TouchableOpacity style={styles.toggleBtn} onPress={() => setShowAllRules(false)}>
									<Text style={styles.toggleText}>간단히 보기 ▲</Text>
								</TouchableOpacity>
							</>
						) : (
							<TouchableOpacity style={styles.toggleBtn} onPress={() => setShowAllRules(true)}>
								<Text style={styles.toggleText}>전체 규칙 보기 ▼</Text>
							</TouchableOpacity>
						)}

						<View style={styles.startNotice}>
							<Text style={styles.startNoticeText}>🚀 시작 버튼을 누르면 3초 카운트다운 후 게임이 시작됩니다!</Text>
						</View>
					</View>

					{/* 내 기록 */}
					<View style={styles.sectionCard}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionIcon}>🏆</Text>
							<Text style={styles.sectionTitle}>나의 베스트 기록</Text>
						</View>

						{top5History.length === 0 ? (
							<View style={styles.emptyBox}>
								<Text style={styles.emptyIcon}>📭</Text>
								<Text style={styles.emptyText}>아직 기록이 없어요</Text>
								<Text style={styles.emptySubText}>첫 번째 챌린지에 도전해보세요!</Text>
							</View>
						) : (
							top5History.slice(0, 3).map((item, index) => (
								<View key={index} style={[styles.recordCard, index === 0 && styles.recordCardFirst]}>
									<View style={styles.recordLeft}>
										<IconComponent name="trophy" type="FontAwesome" size={RANK_CONFIG[index].trophySize} color={RANK_CONFIG[index].trophy} />
										<Text style={[styles.rankLabel, index === 0 && styles.rankLabelFirst]}>{index + 1}등</Text>
									</View>
									<View style={styles.recordRight}>
										<Text style={[styles.rankScore, index === 0 && styles.rankScoreFirst]}>{item.finalScore}점</Text>
										<Text style={styles.rankDate}>{getRelativeDateLabel(item.quizDate)}</Text>
									</View>
								</View>
							))
						)}
					</View>

					{/* 시작 버튼 */}
					<TouchableOpacity style={styles.startButton} onPress={handleStartChallenge} activeOpacity={0.85}>
						<Text style={styles.startButtonText}>⚡ 챌린지 시작</Text>
					</TouchableOpacity>
				</ScrollView>
				<BottomHomeButton marginBottom={scaleHeight(12)} />
			</Animated.View>

			{/* 카운트다운 오버레이 */}
			{isCountingDown && (
				<View style={styles.countdownOverlay}>
					<Animated.Text style={[styles.countdownText, { transform: [{ scale: scaleAnim }] }]}>{count === 0 ? '🔥' : count}</Animated.Text>
					<Text style={styles.countdownMessage}>{COUNTDOWN_MESSAGES[count] ?? ''}</Text>
				</View>
			)}

			{showAd && (
				<AdmobFrontAd
					onAdClosed={() => {
						setShowAd(false);
						setAdWatched(true);
						handleStartChallenge();
					}}
				/>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8F9FB',
	},
	contentWrapper: {
		flex: 1,
	},
	scrollContainer: {
		paddingHorizontal: scaleWidth(20),
		paddingBottom: scaleHeight(20),
	},

	// ── 헤더 이미지 ──────────────────────────
	imageContainer: {
		alignItems: 'center',
		paddingTop: scaleHeight(32),
		marginBottom: scaleHeight(20),
	},
	imageGlow: {
		shadowColor: '#4A90E2',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 16,
		elevation: 8,
		borderRadius: scaleWidth(72),
		marginBottom: scaleHeight(16),
	},
	challengeImage: {
		width: scaleWidth(144),
		height: scaleWidth(144),
		borderRadius: scaleWidth(72),
		borderWidth: 3,
		borderColor: '#fff',
	},
	heroTitle: {
		fontSize: scaledSize(24),
		fontWeight: '800',
		color: '#1A1D23',
		letterSpacing: -0.5,
	},
	heroSubtitle: {
		fontSize: scaledSize(13),
		color: '#6B7280',
		marginTop: scaleHeight(4),
	},

	// ── 공통 섹션 카드 ──────────────────────────
	sectionCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: scaleWidth(18),
		marginBottom: scaleHeight(14),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(14),
	},
	sectionIcon: {
		fontSize: scaledSize(17),
		marginRight: scaleWidth(6),
	},
	sectionTitle: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#1A1D23',
	},

	// ── 규칙 ──────────────────────────
	ruleItem: {
		flexDirection: 'row',
		marginBottom: scaleHeight(8),
	},
	ruleDot: {
		fontSize: scaledSize(13),
		color: '#9CA3AF',
		marginRight: scaleWidth(6),
		marginTop: 1,
	},
	ruleText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#4B5563',
		lineHeight: scaleHeight(21),
	},
	ruleBold: {
		fontWeight: '700',
		color: '#1A1D23',
	},
	bonusDivider: {
		height: 1,
		backgroundColor: '#F3F4F6',
		marginVertical: scaleHeight(12),
	},
	bonusTitle: {
		fontSize: scaledSize(13),
		fontWeight: '700',
		color: '#374151',
		marginBottom: scaleHeight(8),
	},
	bonusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	bonusPoints: {
		fontSize: scaledSize(13),
		color: '#6B7280',
		width: scaleWidth(120),
	},
	bonusBadge: {
		backgroundColor: '#EFF6FF',
		borderRadius: 6,
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(3),
	},
	bonusBadgeSpecial: {
		backgroundColor: '#FEF3C7',
	},
	bonusBadgeText: {
		fontSize: scaledSize(12),
		fontWeight: '600',
		color: '#1D4ED8',
	},
	toggleBtn: {
		marginTop: scaleHeight(10),
		alignItems: 'center',
	},
	toggleText: {
		fontSize: scaledSize(13),
		color: '#4A90E2',
		fontWeight: '600',
	},
	startNotice: {
		marginTop: scaleHeight(14),
		backgroundColor: '#FFF7ED',
		borderRadius: 8,
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(8),
	},
	startNoticeText: {
		fontSize: scaledSize(12),
		color: '#D97706',
		fontWeight: '600',
		lineHeight: scaleHeight(18),
	},

	// ── 기록 카드 ──────────────────────────
	emptyBox: {
		alignItems: 'center',
		paddingVertical: scaleHeight(20),
	},
	emptyIcon: {
		fontSize: scaledSize(28),
		marginBottom: scaleHeight(8),
	},
	emptyText: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#374151',
	},
	emptySubText: {
		fontSize: scaledSize(13),
		color: '#9CA3AF',
		marginTop: scaleHeight(4),
	},
	recordCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#F9FAFB',
		borderRadius: 12,
		paddingHorizontal: scaleWidth(14),
		paddingVertical: scaleHeight(10),
		marginBottom: scaleHeight(8),
		borderWidth: 1,
		borderColor: '#F3F4F6',
	},
	recordCardFirst: {
		backgroundColor: '#FFFBEB',
		borderColor: '#FDE68A',
	},
	recordLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
	},
	rankLabel: {
		fontSize: scaledSize(14),
		fontWeight: '700',
		color: '#6B7280',
		marginLeft: scaleWidth(8),
	},
	rankLabelFirst: {
		color: '#1A1D23',
	},
	recordRight: {
		alignItems: 'flex-end',
	},
	rankScore: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#374151',
	},
	rankScoreFirst: {
		color: '#D97706',
		fontSize: scaledSize(17),
	},
	rankDate: {
		fontSize: scaledSize(11),
		color: '#9CA3AF',
		marginTop: scaleHeight(2),
	},

	// ── 시작 버튼 ──────────────────────────
	startButton: {
		marginTop: scaleHeight(6),
		marginBottom: scaleHeight(16),
		backgroundColor: '#4A90E2',
		paddingVertical: scaleHeight(15),
		borderRadius: 14,
		alignItems: 'center',
		shadowColor: '#4A90E2',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 12,
		elevation: 5,
	},
	startButtonText: {
		color: '#FFFFFF',
		fontSize: scaledSize(16),
		fontWeight: '800',
		letterSpacing: 0.3,
	},

	// ── 카운트다운 ──────────────────────────
	countdownOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(10, 12, 20, 0.75)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999,
	},
	countdownText: {
		fontSize: scaledSize(90),
		fontWeight: '900',
		color: '#FFFFFF',
		letterSpacing: -2,
	},
	countdownMessage: {
		fontSize: scaledSize(16),
		marginTop: scaleHeight(16),
		color: 'rgba(255,255,255,0.75)',
		fontWeight: '500',
	},
});

export default InitTimeChallengeScreen;
