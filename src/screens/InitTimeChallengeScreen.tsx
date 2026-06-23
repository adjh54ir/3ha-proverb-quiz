import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Image, Modal } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from './common/atomic/IconComponent';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import BottomHomeButton from './common/BottomHomeButton';

const InitTimeChallengeScreen = () => {
	const STORAGE_KEY = MainStorageKeyType.TIME_CHALLENGE_HISTORY;
	const navigation = useNavigation();
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const [count, setCount] = useState(3);
	const [showAllRules, setShowAllRules] = useState(false);
	const [isCountingDown, setIsCountingDown] = useState(false);
	const [top5History, setTop5History] = useState<MainDataType.TimeChallengeResult[]>([]);

	const [showAd, setShowAd] = useState(false);
	const [adWatched, setAdWatched] = useState(false);
	const shouldShowAdRef = useRef(Math.random() < 0.5);

	useEffect(() => {
		fetchTopHistory();
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

			if (diffDays === 0) {
				return `오늘, ${timeStr}`;
			}
			if (diffDays === 1) {
				return `어제, ${timeStr}`;
			}
			if (diffDays === 2) {
				return `그제, ${timeStr}`;
			}
			if (diffDays < 7) {
				return `${diffDays}일 전`;
			}
			if (diffDays < 30) {
				return `${Math.floor(diffDays / 7)}주 전`;
			}

			const y = inputDate.getFullYear();
			const m = String(inputDate.getMonth() + 1).padStart(2, '0');
			const d = String(inputDate.getDate()).padStart(2, '0');
			return `${y}. ${m}. ${d}. ${timeStr}`;
		} catch {
			return isoString;
		}
	};

	const startCountdown = () => {
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

	const handleStartChallenge = () => {
		if (!adWatched && shouldShowAdRef.current) {
			setShowAd(true);
			return;
		}
		startCountdown();
	};

	const animateScale = () => {
		scaleAnim.setValue(1.5);
		Animated.spring(scaleAnim, {
			toValue: 1,
			useNativeDriver: true,
			friction: 4,
		}).start();
	};

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<View style={styles.contentWrapper}>
				<ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
					{/* 🎯 대표 이미지 영역 */}
					<View style={styles.heroImageContainer}>
						<Image source={require('@/assets/images/timeChanllenge.jpg')} style={styles.heroImage} resizeMode="cover" />
						<View style={styles.heroOverlay}>
							<Text style={styles.heroTitle}>⏱️ 타임 챌린지</Text>
							<Text style={styles.heroSubtitle}>180초 안에 최대한 많이 맞혀보세요!</Text>
						</View>
					</View>

					{/* 📋 규칙 박스 */}
					<View style={styles.challengeRuleBox}>
						<View style={styles.ruleHeader}>
							<IconComponent name="info-circle" type="FontAwesome" size={scaledSize(20)} color="#F87171" />
							<Text style={styles.ruleHeaderText}>게임 규칙</Text>
						</View>

						{showAllRules ? (
							<>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleBullet}>•</Text>
									<Text style={styles.ruleText}>
										<Text style={styles.ruleBold}>180초 안에 속담의 의미를 최대한 많이 맞히는 게임입니다.</Text>
									</Text>
								</View>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleBullet}>•</Text>
									<Text style={styles.ruleText}>문제를 틀릴 경우 하트(❤️ 총 5개)가 1개씩 줄어듭니다.</Text>
								</View>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleBullet}>•</Text>
									<Text style={styles.ruleText}>1회 스킵 기능으로 어려운 문제를 건너뛸 수 있습니다.</Text>
								</View>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleBullet}>•</Text>
									<Text style={styles.ruleText}>1회 찬스 기능으로 활용 팁과 예문을 확인할 수 있습니다.</Text>
								</View>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleBullet}>•</Text>
									<Text style={styles.ruleText}>중간에 종료하면 기록이 저장되지 않습니다.</Text>
								</View>

								<View style={styles.bonusSection}>
									<Text style={styles.bonusTitle}>💎 점수별 보너스</Text>
									<View style={styles.bonusSummaryRow}>
										<Text style={styles.bonusSummaryIcon}>⏱</Text>
										<Text style={styles.bonusSummaryText}>
											<Text style={styles.bonusSummaryStrong}>100점</Text>마다 시간{' '}
											<Text style={styles.bonusSummaryStrong}>+10초</Text>
										</Text>
									</View>
									<View style={styles.bonusSummaryRow}>
										<Text style={styles.bonusSummaryIcon}>❤️</Text>
										<Text style={styles.bonusSummaryText}>
											<Text style={styles.bonusSummaryStrong}>200 · 500점</Text> 달성 시 하트{' '}
											<Text style={styles.bonusSummaryStrong}>+1</Text>
										</Text>
									</View>
								</View>

								<View style={styles.bonusSection}>
									<Text style={styles.bonusTitle}>🔥 콤보 보너스</Text>
									<View style={styles.comboList}>
										<View style={styles.comboItem}>
											<Text style={styles.comboCount}>3콤보</Text>
											<Text style={styles.comboReward}>+5점</Text>
										</View>
										<View style={styles.comboItem}>
											<Text style={styles.comboCount}>4콤보</Text>
											<Text style={styles.comboReward}>+10점</Text>
										</View>
										<View style={styles.comboItem}>
											<Text style={styles.comboCount}>5콤보</Text>
											<Text style={styles.comboReward}>+20점</Text>
										</View>
										<View style={styles.comboItem}>
											<Text style={styles.comboCount}>6콤보+</Text>
											<Text style={styles.comboReward}>+30점</Text>
										</View>
									</View>
								</View>

								<View style={styles.warningBox}>
									<IconComponent name="alert-circle" type="Feather" size={scaledSize(16)} color="#F87171" />
									<Text style={styles.warningText}>시작 버튼을 누르면 3초 뒤에 퀴즈가 시작됩니다!</Text>
								</View>

								<TouchableOpacity onPress={() => setShowAllRules(false)} style={styles.toggleButton}>
									<Text style={styles.toggleText}>간단히 보기</Text>
									<IconComponent name="chevron-up" type="Feather" size={scaledSize(16)} color="#22C55E" />
								</TouchableOpacity>
							</>
						) : (
							<>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleBullet}>•</Text>
									<Text style={styles.ruleText}>
										<Text style={styles.ruleBold}>180초 안에 속담의 의미를 최대한 많이 맞히는 게임입니다.</Text>
									</Text>
								</View>
								<View style={styles.ruleItem}>
									<Text style={styles.ruleBullet}>•</Text>
									<Text style={styles.ruleText}>문제를 틀릴 경우 하트(❤️ 총 5개)가 1개씩 줄어듭니다.</Text>
								</View>

								<View style={styles.warningBox}>
									<IconComponent name="alert-circle" type="Feather" size={scaledSize(16)} color="#F87171" />
									<Text style={styles.warningText}>시작 버튼을 누르면 3초 뒤에 퀴즈가 시작됩니다!</Text>
								</View>

								<TouchableOpacity onPress={() => setShowAllRules(true)} style={styles.toggleButton}>
									<Text style={styles.toggleText}>자세히 보기</Text>
									<IconComponent name="chevron-down" type="Feather" size={scaledSize(16)} color="#22C55E" />
								</TouchableOpacity>
							</>
						)}
					</View>

					{/* 🏆 TOP 3 랭킹 */}
					<View style={styles.rankingBox}>
						<View style={styles.rankingHeader}>
							<IconComponent name="trophy" type="FontAwesome" size={scaledSize(20)} color="#FBBF24" />
							<Text style={styles.rankingTitle}>나의 베스트 기록</Text>
						</View>

						{top5History.length === 0 ? (
							<View style={styles.emptyState}>
								<IconComponent name="emoji-events" type="MaterialIcons" size={scaledSize(48)} color="#E2E8F0" />
								<Text style={styles.emptyText}>아직 기록이 없습니다</Text>
								<Text style={styles.emptySubtext}>첫 챌린지를 시작해보세요!</Text>
							</View>
						) : (
							top5History.slice(0, 3).map((item, index) => {
								const medals = ['🥇', '🥈', '🥉'];
								const gradients = [
									{ from: '#FBBF24', to: '#F59E0B' },
									{ from: '#CBD5E1', to: '#94A3B8' },
									{ from: '#FB923C', to: '#9A3412' },
								];

								return (
									<View
										key={index}
										style={[
											styles.rankCard,
											index === 0 && styles.rankCardFirst,
											index === 1 && styles.rankCardSecond,
											index === 2 && styles.rankCardThird,
										]}>
										<View style={styles.rankLeft}>
											<Text style={styles.medalIcon}>{medals[index]}</Text>
											<View style={styles.rankInfo}>
												<Text style={[styles.rankScore, index === 0 && styles.rankScoreFirst]}>{item.finalScore}점</Text>
												<Text style={styles.rankDate}>{getRelativeDateLabel(item.quizDate)}</Text>
											</View>
										</View>
										<View style={styles.rankBadge}>
											<Text style={styles.rankNumber}>{index + 1}등</Text>
										</View>
									</View>
								);
							})
						)}
					</View>

					<TouchableOpacity style={styles.startButton} onPress={handleStartChallenge}>
						<Text style={styles.startButtonText}>챌린지 시작하기</Text>
						<IconComponent
							name="play-circle"
							type="Feather"
							size={scaledSize(22)}
							color="#fff"
							style={{ marginLeft: scaleWidth(8) }}
						/>
					</TouchableOpacity>
				</ScrollView>
			</View>
			<BottomHomeButton />

			<Modal visible={isCountingDown} transparent animationType="fade" statusBarTranslucent>
				<View style={styles.countdownOverlay}>
					<Animated.View style={[styles.countdownCircle, { transform: [{ scale: scaleAnim }] }]}>
						<Text style={styles.countdownText}>{count === 0 ? '시작!' : String(count)}</Text>
					</Animated.View>
					<View style={styles.countdownMessageWrapper}>
						<Text style={styles.countdownMessage}>
							{count === 3 ? '심호흡 하세요' : count === 2 ? '준비하세요!' : count === 1 ? '곧 시작됩니다!' : '화이팅!'}
						</Text>
					</View>
				</View>
			</Modal>

			{showAd && (
				<AdmobFrontAd
					onAdClosed={() => {
						setShowAd(false);
						setAdWatched(true);
						startCountdown(); // ✅ handleStartChallenge 대신 카운트다운 직접 호출
					}}
				/>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8FAFC',
	},
	contentWrapper: {
		flex: 1,
	},
	scrollContainer: {
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(16),
		paddingBottom: scaleHeight(24),
	},

	// 카운트다운
	// 카운트다운
	countdownOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.92)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	countdownCircle: {
		width: scaleWidth(160),
		height: scaleWidth(160),
		borderRadius: scaleWidth(80),
		backgroundColor: 'rgba(20, 184, 166, 0.2)',
		borderWidth: 4,
		borderColor: '#22C55E',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden', // ✅ 사각형 그림자 잘라냄
	},
	countdownText: {
		fontSize: scaledSize(72),
		fontWeight: 'bold',
		color: '#fff',
		textAlign: 'center',
		includeFontPadding: false,
		textAlignVertical: 'center',
		lineHeight: scaledSize(80),
	},
	countdownMessageWrapper: {
		marginTop: scaleHeight(32),
		paddingHorizontal: scaleWidth(24),
		paddingVertical: scaleHeight(10),
		backgroundColor: 'rgba(255,255,255,0.12)',
		borderRadius: scaledSize(20),
		minWidth: scaleWidth(180),
		alignItems: 'center',
	},
	countdownMessage: {
		fontSize: scaledSize(17),
		color: '#fff',
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.3,
	},

	// 히어로 이미지
	heroImageContainer: {
		width: '100%',
		height: scaleHeight(200),
		borderRadius: scaledSize(16),
		overflow: 'hidden',
		marginBottom: scaleHeight(20),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
	},
	heroImage: {
		width: '100%',
		height: '100%',
	},
	heroOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: 'rgba(0,0,0,0.5)',
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
	},
	heroTitle: {
		fontSize: scaledSize(24),
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: scaleHeight(4),
	},
	heroSubtitle: {
		fontSize: scaledSize(14),
		color: '#fff',
		opacity: 0.9,
	},

	// 규칙 박스
	challengeRuleBox: {
		backgroundColor: '#fff',
		borderRadius: scaledSize(16),
		padding: scaleWidth(20),
		marginBottom: scaleHeight(20),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	ruleHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	ruleHeaderText: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginLeft: scaleWidth(8),
	},
	ruleItem: {
		flexDirection: 'row',
		marginBottom: scaleHeight(10),
	},
	ruleBullet: {
		fontSize: scaledSize(14),
		color: '#22C55E',
		marginRight: scaleWidth(8),
		marginTop: scaleHeight(2),
	},
	ruleText: {
		flex: 1,
		fontSize: scaledSize(14),
		color: '#64748B',
		lineHeight: scaleHeight(22),
	},
	ruleBold: {
		fontWeight: '600',
		color: '#334155',
	},

	// 보너스 섹션
	bonusSection: {
		marginTop: scaleHeight(20),
		paddingTop: scaleHeight(16),
		borderTopWidth: 1,
		borderTopColor: '#E2E8F0',
	},
	bonusTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(12),
	},
	bonusSummaryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F0FDF4',
		borderRadius: scaledSize(10),
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(14),
		borderWidth: 1,
		borderColor: '#DCFCE7',
		marginBottom: scaleHeight(8),
		gap: scaleWidth(10),
	},
	bonusSummaryIcon: {
		fontSize: scaledSize(16),
	},
	bonusSummaryText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#475569',
	},
	bonusSummaryStrong: {
		fontWeight: 'bold',
		color: '#15803D',
	},

	// 콤보 리스트
	comboList: {
		gap: scaleHeight(8),
	},
	comboItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#FFF7ED',
		borderRadius: scaledSize(8),
		padding: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#FFEDD5',
	},
	comboCount: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#F87171',
	},
	comboReward: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#FB923C',
	},

	// 경고 박스
	warningBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FEF2F2',
		borderRadius: scaledSize(8),
		padding: scaleWidth(12),
		marginTop: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#FECACA',
	},
	warningText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#F87171',
		fontWeight: '600',
		marginLeft: scaleWidth(8),
	},

	// 토글 버튼
	toggleButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: scaleHeight(12),
		paddingVertical: scaleHeight(8),
	},
	toggleText: {
		fontSize: scaledSize(14),
		color: '#22C55E',
		fontWeight: '600',
		marginRight: scaleWidth(4),
	},

	// 랭킹 박스
	rankingBox: {
		backgroundColor: '#fff',
		borderRadius: scaledSize(16),
		padding: scaleWidth(20),
		marginBottom: scaleHeight(20),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	rankingHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	rankingTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginLeft: scaleWidth(8),
	},

	// 빈 상태
	emptyState: {
		alignItems: 'center',
		paddingVertical: scaleHeight(32),
	},
	emptyText: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#94A3B8',
		marginTop: scaleHeight(12),
	},
	emptySubtext: {
		fontSize: scaledSize(13),
		color: '#94A3B8',
		marginTop: scaleHeight(4),
	},

	// 랭킹 카드
	rankCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#F8FAFC',
		borderRadius: scaledSize(12),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	rankCardFirst: {
		backgroundColor: '#FFFBEB',
		borderColor: '#FBBF24',
		borderWidth: 2,
	},
	rankCardSecond: {
		backgroundColor: '#F1F5F9',
		borderColor: '#CBD5E1',
	},
	rankCardThird: {
		backgroundColor: '#FFF7ED',
		borderColor: '#FB923C',
	},
	rankLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	medalIcon: {
		fontSize: scaledSize(28),
		marginRight: scaleWidth(12),
	},
	rankInfo: {
		flex: 1,
	},
	rankScore: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(2),
	},
	rankScoreFirst: {
		fontSize: scaledSize(20),
		color: '#FB923C',
	},
	rankDate: {
		fontSize: scaledSize(12),
		color: '#94A3B8',
	},
	rankBadge: {
		backgroundColor: '#E2E8F0',
		borderRadius: scaledSize(12),
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(12),
	},
	rankNumber: {
		fontSize: scaledSize(12),
		fontWeight: '600',
		color: '#64748B',
	},

	// 시작 버튼
	startButton: {
		flexDirection: 'row',
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(16),
		borderRadius: scaledSize(12),
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#22C55E',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	startButtonText: {
		color: '#fff',
		fontSize: scaledSize(17),
		fontWeight: 'bold',
	},

	// 카운트다운
});

export default InitTimeChallengeScreen;
