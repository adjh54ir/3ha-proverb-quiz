import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles, displayFontSize } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from './common/atomic/IconComponent';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import BottomHomeButton from './common/BottomHomeButton';
import DateUtils from '@/utils/DateUtils';
import CharacterGuide, { useCharacterGuideOnce, FloatingGuideButton } from '@/screens/common/CharacterGuide';
import { useAppNavigation } from '@/navigation/conf/Types';
import { read } from '@/services/StorageService';

// 규칙 한 줄 행 (아이콘 + 한 줄 텍스트)
const RuleRow = ({ iconType, iconName, iconColor, chipColor, text }: { iconType: string; iconName: string; iconColor: string; chipColor: string; text: string }) => (
	<View style={styles.ruleItem}>
		<View style={[styles.ruleIcon, { backgroundColor: chipColor }]}>
			<IconComponent type={iconType} name={iconName} size={scaledSize(13)} color={iconColor} />
		</View>
		<Text style={styles.ruleText} numberOfLines={1}>
			{text}
		</Text>
	</View>
);

const InitTimeChallengeScreen = () => {
	// 첫 실행 안내는 홈에서 한 번만 띄운다 — 화면마다 뜨면 성가시다. 여기선 물음표 버튼으로만 연다
	const guide = useCharacterGuideOnce('initTimeChallenge', false);
	const STORAGE_KEY = MainStorageKeyType.TIME_CHALLENGE_HISTORY;
	const navigation = useAppNavigation();
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(scaleHeight(12))).current;
	const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [count, setCount] = useState(3);
	const [showAllRules, setShowAllRules] = useState(false);
	const [isCountingDown, setIsCountingDown] = useState(false);
	const [top5History, setTop5History] = useState<MainDataType.TimeChallengeResult[]>([]);

	const [showAd, setShowAd] = useState(false);
	const [adWatched, setAdWatched] = useState(false);
	const shouldShowAdRef = useRef(Math.random() < 0.5);

	// 챌린지를 마치고 돌아오면 방금 기록이 랭킹에 바로 보여야 한다 → 포커스마다 다시 읽는다.
	useFocusEffect(
		useCallback(() => {
			fetchTopHistory();
		}, []),
	);

	// 화면 진입 애니메이션 (fade + slide-up)
	useEffect(() => {
		const entrance = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
			Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
		]);
		entrance.start();
		return () => entrance.stop();
	}, [fadeAnim, slideAnim]);

	// 언마운트 시 카운트다운 타이머 정리
	useEffect(() => {
		return () => {
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
			}
			if (countdownTimeoutRef.current) {
				clearTimeout(countdownTimeoutRef.current);
			}
			scaleAnim.stopAnimation();
		};
	}, [scaleAnim]);

	const fetchTopHistory = async () => {
		const history = await read<MainDataType.TimeChallengeResult[]>(STORAGE_KEY, []);
		const sorted = [...history].sort((a, b) => b.finalScore - a.finalScore);
		setTop5History(sorted.slice(0, 3));
	};

	const getRelativeDateLabel = (isoString: string): string => {
		try {
			const inputDate = new Date(isoString);
			const now = DateUtils.now();

			const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const startOfInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

			const diffMs = startOfToday.getTime() - startOfInput.getTime();
			// 서머타임이 있는 지역에서는 자정~자정 간격이 23h/25h 가 되므로 floor 대신 round
			const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

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

		if (countdownTimerRef.current) {
			clearInterval(countdownTimerRef.current);
		}
		const timer = setInterval(() => {
			countdown--;

			if (countdown < 0) {
				clearInterval(timer);
				countdownTimeoutRef.current = setTimeout(() => {
					setIsCountingDown(false);
					navigation.navigate(Paths.TIME_CHANLLENGE);
				}, 800);
				return;
			}

			setCount(countdown);
			animateScale();
		}, 1000);
		countdownTimerRef.current = timer;
	};

	const handleStartChallenge = () => {
		// 타임 챌린지 시작 시 광고 미노출
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
		<FloatingGuideButton onPress={guide.open} />
			<Animated.View style={[styles.contentWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
				<ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
					{/* 🎯 대표 이미지 영역 */}
					<View style={styles.heroImageContainer}>
						<Image source={require('@/assets/images/feature-states/time-challenge-hero.png')} style={styles.heroImage} resizeMode="contain" />
						<View style={styles.heroOverlay}>
							<Text style={styles.heroTitle}>⏱️ 타임 챌린지</Text>
							<Text style={styles.heroSubtitle}>180초 안에 최대한 많이 맞혀보세요!</Text>
						</View>
					</View>

					{/* 📋 규칙 박스 */}
					<View style={styles.challengeRuleBox}>
						<View style={styles.ruleHeader}>
							<IconComponent name="info-circle" type="FontAwesome" size={scaledSize(20)} color={COLORS.dangerLight} />
							<Text style={styles.ruleHeaderText}>게임 규칙</Text>
						</View>

						{showAllRules ? (
							<>
								<RuleRow iconType="FontAwesome6" iconName="bullseye" iconColor={COLORS.primary} chipColor={COLORS.primarySoft} text="180초 안에 속담 의미를 최대한 많이 맞히기" />
								<RuleRow iconType="FontAwesome6" iconName="heart" iconColor={COLORS.dangerLight} chipColor={COLORS.dangerBg} text="오답 시 하트 1개 감소 (총 5개)" />
								<RuleRow iconType="FontAwesome6" iconName="forward" iconColor={COLORS.secondary} chipColor={COLORS.secondarySoft} text="스킵 1회 — 어려운 문제 건너뛰기" />
								<RuleRow iconType="FontAwesome6" iconName="lightbulb" iconColor={COLORS.warning} chipColor={COLORS.warningBg} text="찬스 1회 — 활용 팁·예문 확인" />
								<RuleRow iconType="FontAwesome6" iconName="ban" iconColor={COLORS.textLight} chipColor={COLORS.surfaceAlt} text="중간 종료 시 기록 미저장" />

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
									<IconComponent name="alert-circle" type="Feather" size={scaledSize(16)} color={COLORS.dangerLight} />
									<Text style={styles.warningText}>시작 버튼을 누르면 3초 뒤에 퀴즈가 시작됩니다!</Text>
								</View>

								<TouchableOpacity onPress={() => setShowAllRules(false)} style={styles.toggleButton} activeOpacity={0.7}>
									<Text style={styles.toggleText}>간단히 보기</Text>
									<IconComponent name="chevron-up" type="Feather" size={scaledSize(16)} color={COLORS.primary} />
								</TouchableOpacity>
							</>
						) : (
							<>
								<RuleRow iconType="FontAwesome6" iconName="bullseye" iconColor={COLORS.primary} chipColor={COLORS.primarySoft} text="180초 안에 속담 의미를 최대한 많이 맞히기" />
								<RuleRow iconType="FontAwesome6" iconName="heart" iconColor={COLORS.dangerLight} chipColor={COLORS.dangerBg} text="오답 시 하트 1개 감소 (총 5개)" />

								<View style={styles.warningBox}>
									<IconComponent name="alert-circle" type="Feather" size={scaledSize(16)} color={COLORS.dangerLight} />
									<Text style={styles.warningText}>시작 버튼을 누르면 3초 뒤에 퀴즈가 시작됩니다!</Text>
								</View>

								<TouchableOpacity onPress={() => setShowAllRules(true)} style={styles.toggleButton} activeOpacity={0.7}>
									<Text style={styles.toggleText}>자세히 보기</Text>
									<IconComponent name="chevron-down" type="Feather" size={scaledSize(16)} color={COLORS.primary} />
								</TouchableOpacity>
							</>
						)}
					</View>

					{/* 🏆 TOP 3 랭킹 */}
					<View style={styles.rankingBox}>
						<View style={styles.rankingHeader}>
							<IconComponent name="trophy" type="FontAwesome" size={scaledSize(20)} color={COLORS.gold} />
							<Text style={styles.rankingTitle}>나의 베스트 기록</Text>
						</View>

						{top5History.length === 0 ? (
							<View style={styles.emptyState}>
								<IconComponent name="emoji-events" type="MaterialIcons" size={scaledSize(48)} color={COLORS.border} />
								<Text style={styles.emptyText}>아직 기록이 없습니다</Text>
								<Text style={styles.emptySubtext}>첫 챌린지를 시작해보세요!</Text>
							</View>
						) : (
							top5History.map((item, index) => {
								const medals = ['🥇', '🥈', '🥉'];
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

					<TouchableOpacity style={styles.startButton} onPress={handleStartChallenge} activeOpacity={0.85}>
						<Text style={styles.startButtonText}>챌린지 시작하기</Text>
						<IconComponent
							name="play-circle"
							type="Feather"
							size={scaledSize(22)}
							color={COLORS.textWhite}
							style={{ marginLeft: SPACING_W.sm }}
						/>
					</TouchableOpacity>
				</ScrollView>
			</Animated.View>
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
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'타임 챌린지는 제한 시간 안에 최대한 많이 맞히는 도전입니다.',
					'오답이 쌓이면 하트가 줄고, 하트가 없으면 종료됩니다.',
					'규칙을 확인했다면 아래 버튼으로 도전을 시작하세요!',
				]}
				title="타임 챌린지 준비하기"
			/>
		</SafeAreaView>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	contentWrapper: {
		flex: 1,
	},
	scrollContainer: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.lg,
		paddingBottom: SPACING_H.xxxxl,
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
		borderColor: COLORS.primary,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden', // ✅ 사각형 그림자 잘라냄
	},
	countdownText: {
		fontSize: displayFontSize(72),
		fontWeight: '700',
		color: COLORS.textWhite,
		textAlign: 'center',
		includeFontPadding: false,
		textAlignVertical: 'center',
		lineHeight: scaledSize(80),
	},
	countdownMessageWrapper: {
		marginTop: SPACING_H.xxxl,
		paddingHorizontal: SPACING_W.xxl,
		paddingVertical: SPACING_H.smPlus,
		backgroundColor: 'rgba(255,255,255,0.12)',
		borderRadius: RADIUS.xl,
		minWidth: scaleWidth(180),
		alignItems: 'center',
	},
	countdownMessage: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.textWhite,
		fontWeight: '700',
		textAlign: 'center',
		letterSpacing: 0.3,
	},

	// 히어로 이미지
	heroImageContainer: {
		width: '100%',
		height: scaleHeight(200),
		borderRadius: RADIUS.lg,
		overflow: 'hidden',
		marginBottom: SPACING_H.xl,
		backgroundColor: COLORS.accentOrangeBg,
	},
	heroImage: {
		width: '100%',
		height: '78%',
	},
	heroOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: COLORS.dim,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
	},
	heroTitle: {
		fontSize: FONT_SIZES.title,
		fontWeight: '700',
		color: COLORS.textWhite,
		marginBottom: SPACING_H.xs,
	},
	heroSubtitle: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textWhite,
		opacity: 0.9,
	},

	// 규칙 박스
	challengeRuleBox: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginBottom: SPACING_H.xl,
	},
	ruleHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING_H.lg,
	},
	ruleHeaderText: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.text,
		marginLeft: SPACING_W.sm,
	},
	ruleItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.sm,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.sm,
	},
	ruleIcon: {
		width: scaleWidth(26),
		height: scaleWidth(26),
		borderRadius: scaleWidth(13),
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.smPlus,
	},
	ruleText: {
		flex: 1,
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textMuted,
		fontWeight: '500',
	},

	// 보너스 섹션
	bonusSection: {
		marginTop: SPACING_H.xl,
		paddingTop: SPACING_H.lg,
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
	},
	bonusTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.md,
	},
	bonusSummaryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.primaryBg,
		borderRadius: RADIUS.sm,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.mdPlus,
		borderWidth: 1,
		borderColor: COLORS.primarySoft,
		marginBottom: SPACING_H.sm,
		gap: SPACING_W.smPlus,
	},
	bonusSummaryIcon: {
		fontSize: FONT_SIZES.lg,
	},
	bonusSummaryText: {
		flex: 1,
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textMuted,
	},
	bonusSummaryStrong: {
		fontWeight: '700',
		color: COLORS.primaryDeep,
	},

	// 콤보 리스트
	comboList: {
		gap: SPACING_H.sm,
	},
	comboItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: COLORS.accentOrangeBg,
		borderRadius: RADIUS.sm,
		padding: SPACING_W.md,
		borderWidth: 1,
		borderColor: COLORS.accentOrangeSoft,
	},
	comboCount: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.dangerLight,
	},
	comboReward: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.accentOrangeLight,
	},

	// 경고 박스
	warningBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.dangerSoftBg,
		borderRadius: RADIUS.sm,
		padding: SPACING_W.md,
		marginTop: SPACING_H.lg,
		borderWidth: 1,
		borderColor: COLORS.dangerBorderSoft,
	},
	warningText: {
		flex: 1,
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.dangerLight,
		fontWeight: '600',
		marginLeft: SPACING_W.sm,
	},

	// 토글 버튼
	toggleButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: SPACING_H.md,
		paddingVertical: SPACING_H.sm,
	},
	toggleText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.primary,
		fontWeight: '600',
		marginRight: SPACING_W.xs,
	},

	// 랭킹 박스
	rankingBox: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginBottom: SPACING_H.xl,
	},
	rankingHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING_H.lg,
	},
	rankingTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.text,
		marginLeft: SPACING_W.sm,
	},

	// 빈 상태
	emptyState: {
		alignItems: 'center',
		paddingVertical: SPACING_H.xxxl,
	},
	emptyText: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '600',
		color: COLORS.textLight,
		marginTop: SPACING_H.md,
	},
	emptySubtext: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
		marginTop: SPACING_H.xs,
	},

	// 랭킹 카드
	rankCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	rankCardFirst: {
		backgroundColor: COLORS.warningSoft,
		borderColor: COLORS.gold,
		borderWidth: 2,
	},
	rankCardSecond: {
		backgroundColor: COLORS.surfaceAlt,
		borderColor: COLORS.borderDark,
	},
	rankCardThird: {
		backgroundColor: COLORS.accentOrangeBg,
		borderColor: COLORS.accentOrangeLight,
	},
	rankLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	medalIcon: {
		fontSize: FONT_SIZES.display,
		marginRight: SPACING_W.md,
	},
	rankInfo: {
		flex: 1,
	},
	rankScore: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: SPACING_H.xxs,
	},
	rankScoreFirst: {
		fontSize: FONT_SIZES.xxl,
		color: COLORS.accentOrangeLight,
	},
	rankDate: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
	},
	rankBadge: {
		backgroundColor: COLORS.border,
		borderRadius: RADIUS.md,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.md,
	},
	rankNumber: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
		color: COLORS.textSecondary,
	},

	// 시작 버튼
	startButton: {
		flexDirection: 'row',
		backgroundColor: COLORS.secondary,
		paddingVertical: SPACING_H.lg,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	startButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},

	// 카운트다운
}));

export default InitTimeChallengeScreen;
