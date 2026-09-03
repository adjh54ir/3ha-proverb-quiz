import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import FastImage from 'react-native-fast-image';
import { CONTENT_MAX_WIDTH, scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles, displayFontSize } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import useModalSafePadding from '@/hooks/useModalSafePadding';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TowerReward {
	name: string;
	description?: string;
	image: any;
}

interface TowerLevel {
	id: number;
	name: string;
	bossImage: any;
	reward: TowerReward;
	questions: any[];
}

interface TowerResultModalProps {
	visible: boolean;
	isVictory: boolean;
	correctCount: number;
	totalQuestions: number;
	towerLevel: TowerLevel;
	onRetry: () => void;
	onHome: () => void;
	onNext?: () => void;
}

const TowerResultModal: React.FC<TowerResultModalProps> = ({
	visible,
	isVictory,
	correctCount,
	totalQuestions,
	towerLevel,
	onRetry,
	onHome,
	onNext,
}) => {
	// 회전/폴더블 대응: 화면 크기가 바뀌면 모달 크기도 따라간다.
	const { width, height } = useWindowDimensions();
	// 오버레이는 시스템 바를 포함한 screen 크기라 카드가 그 밑까지 파고든다(CLAUDE.md 모달 규칙 1·4).
	const safePadding = useModalSafePadding();
	const reducedMotion = useReducedMotion();
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const starAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
	const scoreCountAnim = useRef(new Animated.Value(0)).current;
	const glowAnim = useRef(new Animated.Value(0.4)).current;
	const bossAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		let glowLoop: Animated.CompositeAnimation | null = null;
		if (visible && reducedMotion) {
			// '애니메이션 줄이기': 결과는 즉시 최종 상태로 보여주고 글로우 루프는 돌리지 않는다.
			scaleAnim.setValue(1);
			fadeAnim.setValue(1);
			bossAnim.setValue(1);
			scoreCountAnim.setValue(correctCount);
			glowAnim.setValue(1);
			starAnims.forEach((anim) => anim.setValue(isVictory ? 1 : 0));
			return;
		}
		if (visible) {
			glowLoop = Animated.loop(
				Animated.sequence([
					Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
					Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
				]),
			);
			glowLoop.start();

			Animated.parallel([
				Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
				Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
				Animated.timing(bossAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
			]).start();

			Animated.timing(scoreCountAnim, {
				toValue: correctCount,
				duration: 800,
				delay: 300,
				useNativeDriver: false,
			}).start();

			if (isVictory) {
				starAnims.forEach((anim, index) => {
					Animated.sequence([
						Animated.delay(400 + index * 150),
						Animated.spring(anim, { toValue: 1, tension: 120, friction: 5, useNativeDriver: true }),
					]).start();
				});
			}
		} else {
			scaleAnim.setValue(0);
			fadeAnim.setValue(0);
			scoreCountAnim.setValue(0);
			bossAnim.setValue(0);
			glowAnim.setValue(0.4);
			starAnims.forEach((anim) => anim.setValue(0));
		}
		// ✅ 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
		return () => {
			glowLoop?.stop();
			scaleAnim.stopAnimation();
			fadeAnim.stopAnimation();
			scoreCountAnim.stopAnimation();
			bossAnim.stopAnimation();
			glowAnim.stopAnimation();
			starAnims.forEach((anim) => anim.stopAnimation());
		};
	}, [visible, isVictory, reducedMotion]);

	const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
	const accentColor = isVictory ? COLORS.gold : COLORS.dangerLight;
	const bgColor = isVictory ? COLORS.towerVictoryBg : COLORS.towerDefeatBg;
	const headerBgColor = isVictory ? COLORS.primary : COLORS.dangerDeep;
	const borderColor = isVictory ? COLORS.primary : COLORS.danger;

	const renderScoreDots = () =>
		Array.from({ length: totalQuestions }).map((_, i) => (
			<View
				key={i}
				style={[
					styles.scoreDot,
					{
						backgroundColor: i < correctCount ? accentColor : 'rgba(255,255,255,0.15)',
						borderColor: i < correctCount ? accentColor : 'rgba(255,255,255,0.1)',
					},
				]}>
				{i < correctCount && <IconComponent type="materialIcons" name="check" size={scaledSize(10)} color={COLORS.darkBg} />}
			</View>
		));

	return (
		<Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onHome}>
			{/* 오버레이 */}
			<Animated.View style={[styles.overlay, safePadding, { opacity: fadeAnim }]}>
				{/* 모달 전체 컨테이너: 화면 높이의 일정 비율로 고정 */}
				<Animated.View
					style={[
						styles.modalContainer,
						{
							// 태블릿에서 화면의 90% 는 지나치게 넓다 — 본문 기둥 폭을 넘지 않게 묶는다(폰은 상한에 닿지 않음).
							width: Math.min(width * 0.9, CONTENT_MAX_WIDTH),
							// 화면 높이의 80%로 고정 → 버튼이 항상 화면 안에 들어옴
							height: height * 0.8,
							transform: [{ scale: scaleAnim }],
							backgroundColor: bgColor,
							borderColor,
						},
					]}>
					{/* 헤더 - 고정 */}
					<View style={[styles.titleBanner, { backgroundColor: headerBgColor }]}>
						<Text style={styles.resultTitle}>{isVictory ? '⚔️  VICTORY  ⚔️' : '💀  DEFEAT  💀'}</Text>
					</View>

					{/* 보스 이미지 - 헤더 바로 아래, 스크롤 밖 */}
					<Animated.View style={[styles.bossContainer, { opacity: bossAnim, transform: [{ scale: bossAnim }] }]}>
						<Animated.View style={[styles.bossGlowRing, { opacity: glowAnim, borderColor: accentColor }]} />
						<View style={[styles.bossImageWrapper, { borderColor: accentColor }]}>
							<FastImage
								source={towerLevel.bossImage}
								style={[styles.bossImage, !isVictory && styles.bossImageDefeated]}
								resizeMode="contain"
							/>
							{!isVictory && (
								<View style={styles.defeatOverlay}>
									<Text style={styles.defeatOverlayText}>✗</Text>
								</View>
							)}
						</View>
						{isVictory && (
							<View style={styles.crownBadge}>
								<Text style={styles.crownText}>👑</Text>
							</View>
						)}
						<Text style={styles.levelName}>{towerLevel.name}</Text>
					</Animated.View>

					{/* 스크롤 가능한 본문 */}
					<ScrollView
						style={styles.scrollArea}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}>
						{/* 점수 */}
						<View style={styles.scoreMainBox}>
							<Text style={styles.scoreLabel}>SCORE</Text>
							<View style={styles.scoreRow}>
								<Text style={[styles.scoreCorrect, { color: accentColor }]}>{correctCount}</Text>
								<Text style={styles.scoreSlash}> / </Text>
								<Text style={styles.scoreTotal}>{totalQuestions}</Text>
							</View>
							<View style={styles.scoreDotsRow}>{renderScoreDots()}</View>
							<View style={styles.percentBarBg}>
								<Animated.View
									style={[
										styles.percentBarFill,
										{
											width: scoreCountAnim.interpolate({
												inputRange: [0, totalQuestions],
												outputRange: ['0%', '100%'],
											}),
											backgroundColor: accentColor,
										},
									]}
								/>
							</View>
							<Text style={[styles.percentText, { color: accentColor }]}>{scorePercentage}%</Text>
						</View>

						{/* 승리 별 */}
						{isVictory && (
							<View style={styles.starsContainer}>
								{starAnims.map((anim, i) => (
									<Animated.View
										key={i}
										style={{
											transform: [
												{ scale: anim },
												{
													rotate: anim.interpolate({
														inputRange: [0, 1],
														outputRange: ['0deg', '360deg'],
													}),
												},
											],
										}}>
										<IconComponent type="materialIcons" name="star" size={scaledSize(36)} color={COLORS.gold} />
									</Animated.View>
								))}
							</View>
						)}

						{/* 보상 */}
						{isVictory && (
							<View style={styles.rewardSection}>
								<View
									style={[
										styles.rewardHeader,
										{ backgroundColor: 'rgba(250,204,21,0.15)', borderBottomColor: 'rgba(250,204,21,0.3)' },
									]}>
									<Text style={styles.rewardHeaderText}>🎁 REWARD UNLOCKED</Text>
								</View>
								<View style={styles.rewardBody}>
									<FastImage source={towerLevel.reward.image} style={styles.rewardImage} resizeMode="contain" />
									<View style={styles.rewardInfo}>
										<Text style={styles.rewardName}>{towerLevel.reward.name}</Text>
										{!!towerLevel.reward.description && <Text style={styles.rewardDescription}>{towerLevel.reward.description}</Text>}
									</View>
								</View>
							</View>
						)}

						{/* 패배 메시지 */}
						{!isVictory && (
							<View style={styles.failSection}>
								<Text style={styles.failLabel}>MISSION FAILED</Text>
								<Text style={styles.failText}>모든 문제를 맞춰야 클리어됩니다.{'\n'}포기하지 말고 다시 도전하세요!</Text>
							</View>
						)}
					</ScrollView>

					{/* 버튼 - 항상 하단 고정 */}
					<View style={styles.buttonsContainer}>
						<TouchableOpacity onPress={onHome} style={styles.btnSecondary} activeOpacity={0.8}>
							<IconComponent type="materialIcons" name="home" size={scaledSize(20)} color={COLORS.textWhite} />
							<Text style={styles.btnSecondaryText}>홈</Text>
						</TouchableOpacity>

						{isVictory ? (
							onNext && (
								<TouchableOpacity onPress={onNext} style={[styles.btnPrimary, { backgroundColor: COLORS.warning }]} activeOpacity={0.8}>
									<Text style={[styles.btnPrimaryText, { color: COLORS.darkBg }]}>NEXT LEVEL</Text>
									<IconComponent type="materialIcons" name="arrow-forward" size={scaledSize(20)} color={COLORS.darkBg} />
								</TouchableOpacity>
							)
						) : (
							<TouchableOpacity onPress={onRetry} style={[styles.btnPrimary, { backgroundColor: COLORS.danger }]} activeOpacity={0.8}>
								<IconComponent type="materialIcons" name="refresh" size={scaledSize(20)} color={COLORS.textWhite} />
								<Text style={[styles.btnPrimaryText, { color: COLORS.textWhite }]}>RETRY</Text>
							</TouchableOpacity>
						)}
					</View>
				</Animated.View>
			</Animated.View>
		</Modal>
	);
};

export default TowerResultModal;

const styles = themedStyles(() => StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.9)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		// 크기(width/height)는 useWindowDimensions 값으로 호출부에서 지정한다.
		// 오버레이 안전 여백을 뺀 높이를 넘지 않도록 상한을 둔다(고정 height 만으로는 잘린다).
		maxHeight: '100%',
		borderRadius: RADIUS.xl,
		overflow: 'hidden',
		borderWidth: 1.5,
		// flex 구조: 헤더(고정) + 보스(고정) + 스크롤 + 버튼(고정)
		flexDirection: 'column',
	},
	titleBanner: {
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		alignItems: 'center',
		// flex 없음 → 컨텐츠 크기만큼만 차지
	},
	resultTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textWhite,
		letterSpacing: 3,
		textShadowColor: 'rgba(0,0,0,0.4)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	bossContainer: {
		alignItems: 'center',
		paddingVertical: SPACING_H.lg,
		// flex 없음 → 고정 높이
	},
	bossGlowRing: {
		position: 'absolute',
		top: SPACING_H.md,
		width: scaleWidth(110),
		height: scaleWidth(110),
		borderRadius: scaleWidth(110) / 2,
		borderWidth: 2,
	},
	bossImageWrapper: {
		width: scaleWidth(90),
		height: scaleWidth(90),
		borderRadius: scaleWidth(90) / 2,
		borderWidth: 3,
		overflow: 'hidden',
		backgroundColor: 'rgba(0,0,0,0.3)',
	},
	bossImage: {
		width: '100%',
		height: '100%',
	},
	bossImageDefeated: {
		opacity: 0.4,
	},
	defeatOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.3)',
	},
	defeatOverlayText: {
		fontSize: displayFontSize(42),
		color: COLORS.danger,
		fontWeight: '700',
	},
	crownBadge: {
		position: 'absolute',
		top: SPACING_H.xs,
	},
	crownText: {
		fontSize: FONT_SIZES.heading,
	},
	levelName: {
		marginTop: SPACING_H.sm,
		textAlign: 'center',
		fontSize: FONT_SIZES.sm,
		color: 'rgba(255,255,255,0.5)',
		letterSpacing: 2,
		textTransform: 'uppercase',
	},
	// 스크롤 영역이 남은 공간 전부 차지
	scrollArea: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.xs,
		paddingBottom: SPACING_H.lg,
	},
	scoreMainBox: {
		backgroundColor: 'rgba(0,0,0,0.3)',
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	scoreLabel: {
		fontSize: FONT_SIZES.xs,
		color: 'rgba(255,255,255,0.4)',
		letterSpacing: 3,
		marginBottom: SPACING_H.xs,
	},
	scoreRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	scoreCorrect: {
		fontSize: displayFontSize(52),
		fontWeight: '700',
	},
	scoreSlash: {
		fontSize: FONT_SIZES.display,
		color: 'rgba(255,255,255,0.3)',
		fontWeight: '400',
	},
	scoreTotal: {
		fontSize: displayFontSize(32),
		fontWeight: '700',
		color: 'rgba(255,255,255,0.6)',
	},
	scoreDotsRow: {
		flexDirection: 'row',
		gap: SPACING_W.sm,
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.md,
	},
	scoreDot: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: scaleWidth(24) / 2,
		borderWidth: 1.5,
		justifyContent: 'center',
		alignItems: 'center',
	},
	percentBarBg: {
		width: '100%',
		height: scaleHeight(6),
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: RADIUS.round,
		overflow: 'hidden',
	},
	percentBarFill: {
		height: '100%',
		borderRadius: RADIUS.round,
	},
	percentText: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '700',
		marginTop: SPACING_H.xs,
		letterSpacing: 1,
	},
	starsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: SPACING_W.md,
		marginTop: SPACING_H.md,
	},
	rewardSection: {
		marginTop: SPACING_H.md,
		borderRadius: RADIUS.lg,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(250,204,21,0.35)',
		backgroundColor: 'rgba(0,0,0,0.2)',
	},
	rewardHeader: {
		paddingVertical: SPACING_H.sm,
		alignItems: 'center',
		borderBottomWidth: 1,
	},
	rewardHeaderText: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		color: COLORS.gold,
		letterSpacing: 2,
	},
	rewardBody: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		gap: SPACING_W.lg,
	},
	rewardImage: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(52) / 2,
		borderWidth: 2,
		borderColor: 'rgba(250,204,21,0.4)',
	},
	rewardInfo: {
		flex: 1,
	},
	rewardName: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.textWhite,
		marginBottom: SPACING_H.xs,
	},
	rewardDescription: {
		fontSize: FONT_SIZES.sm,
		color: 'rgba(255,255,255,0.6)',
		lineHeight: scaledSize(18),
	},
	failSection: {
		marginTop: SPACING_H.md,
		backgroundColor: 'rgba(0,0,0,0.25)',
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		borderWidth: 1,
		borderColor: 'rgba(255,100,100,0.25)',
		alignItems: 'center',
	},
	failLabel: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		color: COLORS.dangerLight,
		letterSpacing: 3,
		marginBottom: SPACING_H.sm,
	},
	failText: {
		fontSize: FONT_SIZES.smPlus,
		color: 'rgba(255,255,255,0.65)',
		textAlign: 'center',
		lineHeight: scaledSize(22),
	},
	// 버튼: flex 없음 → 항상 하단에 고정
	buttonsContainer: {
		flexDirection: 'row',
		gap: SPACING_W.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.08)',
	},
	btnSecondary: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: SPACING_W.sm,
		minHeight: scaleHeight(48),
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: 'rgba(255,255,255,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
	},
	btnSecondaryText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.textWhite,
	},
	btnPrimary: {
		flex: 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: SPACING_W.sm,
		minHeight: scaleHeight(48),
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
	},
	btnPrimaryText: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		letterSpacing: 1,
	},
}));
