import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, HERO, themedStyles } from '@/const/common/Theme';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconComponent from './common/atomic/IconComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import FastImage from 'react-native-fast-image';
import { QUIZ_MODES, getLevelByScore } from '@/const/ConstInfoData';
import BottomHomeButton from './common/BottomHomeButton';
import CharacterGuide, { useCharacterGuideOnce, FloatingGuideButton } from '@/screens/common/CharacterGuide';

/** 모드별 설명 (카드 서브텍스트) */
const MODE_DESC: Record<string, string> = {
	meaning: '속담을 보고 올바른 뜻을 고르세요',
	proverb: '뜻을 보고 알맞은 속담을 고르세요',
	blank: '속담의 빠진 부분을 채워보세요',
	example: '예문을 보고 어울리는 속담을 고르세요',
	exampleBlank: '예문 속 빈칸에 들어갈 속담을 고르세요',
};

/**
 * 퀴즈 모드 선택
 */
const InitQuizModeScreen = () => {
	// 첫 실행 안내는 홈에서 한 번만 띄운다 — 화면마다 뜨면 성가시다. 여기선 물음표 버튼으로만 연다
	const guide = useCharacterGuideOnce('initQuizMode', false);
	const navigation = useNavigation();
	const USER_QUIZ_HISTORY = MainStorageKeyType.USER_QUIZ_HISTORY;

	const [accordionOpen, setAccordionOpen] = useState(false);
	const [totalScore, setTotalScore] = useState<number>(0);

	const scrollRef = useRef<ScrollView>(null);
	const enterAnim = useRef(new Animated.Value(0)).current;
	// 모드 카드 stagger 진입 (최대 6개까지만 지연)
	const cardAnims = useRef(QUIZ_MODES.map(() => new Animated.Value(0))).current;

	// 퀴즈를 풀고 돌아오면 점수가 달라져 있으므로 포커스마다 다시 읽고,
	// 아코디언은 접은 채 맨 위에서 시작한다.
	useFocusEffect(
		useCallback(() => {
			loadData();
			setAccordionOpen(false);
			scrollRef.current?.scrollTo({ y: 0, animated: false });
		}, []),
	);

	useEffect(() => {
		const animation = Animated.timing(enterAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true });
		animation.start();
		return () => {
			animation.stop();
			enterAnim.stopAnimation();
		};
	}, [enterAnim]);

	useEffect(() => {
		const animation = Animated.stagger(
			60,
			cardAnims.map((value) => Animated.timing(value, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true })),
		);
		animation.start();
		return () => {
			animation.stop();
			cardAnims.forEach((value) => value.stopAnimation());
		};
	}, [cardAnims]);

	const loadData = async () => {
		const quizRaw = await AsyncStorage.getItem(USER_QUIZ_HISTORY);
		const quiz = quizRaw ? JSON.parse(quizRaw) : {};
		const totalScoreFromQuiz = typeof quiz.totalScore === 'number' ? quiz.totalScore : 0;
		setTotalScore(totalScoreFromQuiz);
	};

	const handleSelectMode = (mode: 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank') => {
		// @ts-ignore
		navigation.navigate(Paths.QUIZ_MODE, { mode });
	};

	const levelInfo = useMemo(() => getLevelByScore(totalScore), [totalScore]);

	return (
		<SafeAreaView style={styles.main} edges={['bottom']}>
		<FloatingGuideButton onPress={guide.open} />
			<View style={styles.container}>
				<Animated.View style={[styles.animatedWrap, { opacity: enterAnim }]}>
					<ScrollView ref={scrollRef} style={styles.scrollArea} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
						<View style={styles.mascotSection}>
							<FastImage
								source={require('@/assets/images/screen-heroes/quiz-mode.png')}
								style={styles.mascotImage}
								resizeMode={FastImage.resizeMode.contain}
							/>
							<View style={styles.levelBadgeRow}>
								<IconComponent type="FontAwesome5" name={levelInfo.icon} size={scaledSize(16)} color={COLORS.warning} />
								<Text style={styles.levelBadgeText}>{levelInfo.label}</Text>
							</View>
						</View>

						<View style={styles.titleWrap}>
							<Text style={styles.titleLine}>🧩 퀴즈 준비되셨습니까?</Text>
							<Text style={styles.titleLine}>도전하려는 퀴즈 모드를 선택하세요!</Text>
						</View>

						<View style={styles.gridWrap}>
							{QUIZ_MODES.map((mode, index) => {
								const isComingSoon = mode.key === 'comingsoon';
								const cardAnim = cardAnims[Math.min(index, cardAnims.length - 1)];
								return (
									<Animated.View
										key={mode.key}
										style={{
											opacity: cardAnim,
											transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) }],
										}}>
										<TouchableOpacity
											style={[styles.modeCardFull, isComingSoon && styles.modeCardDisabled]}
											activeOpacity={isComingSoon ? 1 : 0.85}
											onPress={() => {
												if (isComingSoon) {
													Alert.alert('새로운 퀴즈 준비 중', '새로운 퀴즈를 준비 중에 있습니다.');
													return;
												}
												handleSelectMode(mode.key as 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank');
											}}>
											<View style={[styles.modeIconChipFull, { backgroundColor: isComingSoon ? COLORS.borderDark : mode.color }]}>
												<IconComponent type={mode.type} name={mode.icon} size={scaledSize(24)} color={COLORS.textWhite} />
											</View>
											<View style={styles.modeTextWrap}>
												<Text style={[styles.modeLabelFull, { color: isComingSoon ? COLORS.textLight : mode.color }]} numberOfLines={1}>
													{mode.label}
												</Text>
												<Text style={styles.modeDescFull} numberOfLines={2}>
													{MODE_DESC[mode.key] ?? '새로운 퀴즈가 준비 중입니다'}
												</Text>
											</View>
											<IconComponent type="materialIcons" name={isComingSoon ? 'lock' : 'chevron-right'} size={scaledSize(22)} color={COLORS.borderDark} />
										</TouchableOpacity>
									</Animated.View>
								);
							})}
						</View>

						<TouchableOpacity style={styles.accordionHeader} activeOpacity={0.8} onPress={() => setAccordionOpen((prev) => !prev)}>
							<Text style={styles.accordionHeaderText}>❓ 틀린 문제는 어떻게 다시 풀 수 있습니까?</Text>
							<IconComponent type="MaterialIcons" name={accordionOpen ? 'expand-less' : 'expand-more'} size={scaledSize(20)} color={COLORS.text} />
						</TouchableOpacity>

						{accordionOpen && (
							<View style={styles.accordionContent}>
								<View style={styles.accordionDescBox}>
									<View style={styles.accordionRow}>
										<IconComponent type="FontAwesome5" name="book" size={scaledSize(16)} color={COLORS.accentFlame} />
										<Text style={styles.accordionText}>틀린 문제는 오답 복습에서 다시 확인할 수 있습니다.</Text>
									</View>
									<View style={styles.accordionRow}>
										<IconComponent type="MaterialCommunityIcons" name="reload" size={scaledSize(18)} color={COLORS.primary} />
										<Text style={[styles.accordionText, styles.warningText]}>다시 풀기는 설정 탭에서 '퀴즈 다시 풀기'에서 할 수 있지만, 이전 기록이 초기화되니 꼭 참고하세요!</Text>
									</View>
								</View>
								<View style={styles.accordionButtonsRow}>
									<TouchableOpacity
										style={[styles.accordionButton, { backgroundColor: COLORS.accentFlame }]}
										activeOpacity={0.85}
										// @ts-ignore
										onPress={() => navigation.navigate(Paths.QUIZ_WRONG_REVIEW)}>
										<IconComponent type="FontAwesome5" name="book" size={scaledSize(16)} color={COLORS.textWhite} />
										<Text style={styles.accordionButtonText}>오답 복습</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.accordionButton, { backgroundColor: COLORS.secondary }]}
										activeOpacity={0.85}
										// @ts-ignore
										onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.SETTING })}>
										<IconComponent type="MaterialCommunityIcons" name="reload" size={scaledSize(18)} color={COLORS.textWhite} />
										<Text style={styles.accordionButtonText}>다시 풀기</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</ScrollView>
				</Animated.View>
			</View>
			<BottomHomeButton backgroundColor={COLORS.background} />
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'풀어볼 퀴즈 모드를 고르는 화면입니다.',
					'모드마다 문제가 나오는 방식이 다릅니다.',
					'고른 뒤에는 난이도나 카테고리를 정하면 바로 시작합니다!',
				]}
				title="퀴즈 모드 고르기"
			/>
		</SafeAreaView>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	main: { flex: 1, backgroundColor: COLORS.background },
	container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING_W.lg, alignItems: 'center' },
	animatedWrap: { flex: 1, width: '100%' },
	scrollArea: { flex: 1 },
	scrollContent: { flexGrow: 1, justifyContent: 'center', paddingTop: SPACING_H.sm, paddingBottom: SPACING_H.xxxxl },

	// ===== 마스코트 / 레벨 =====
	mascotSection: {
		width: '100%',
		alignItems: 'center',
		marginTop: SPACING_H.sm,
		marginBottom: SPACING_H.xl,
		backgroundColor: HERO.bg,
		borderTopWidth: 3,
		borderTopColor: HERO.accent,
		borderRadius: RADIUS.lg,
		paddingVertical: SPACING_H.md,
	},
	mascotImage: {
		width: scaleWidth(190),
		height: scaleHeight(128),
	},
	levelBadgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		marginTop: SPACING_H.sm,
		backgroundColor: HERO.bg,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.warningBorder,
	},
	levelBadgeText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.warningDeep },

	// ===== 타이틀 =====
	titleWrap: { marginBottom: SPACING_H.xl, alignItems: 'center' },
	titleLine: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: SPACING_H.xs },

	// ===== 모드 카드 =====
	gridWrap: { width: '100%', rowGap: SPACING_H.md, marginBottom: SPACING_H.xl },
	modeCardFull: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.md,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	modeIconChipFull: { width: scaleWidth(48), height: scaleWidth(48), borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
	modeCardDisabled: { opacity: 0.7 },
	modeTextWrap: { flex: 1 },
	modeLabelFull: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: SPACING_H.xs },
	modeDescFull: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: scaledSize(18) },

	// ===== 아코디언 =====
	accordionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		// ponytail: 터치 영역 44 이상 보장을 위한 고정 최소 높이
		minHeight: 48,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.surfaceAlt,
		borderWidth: 1,
		borderColor: COLORS.border,
		marginBottom: SPACING_H.md,
	},
	accordionHeaderText: { flex: 1, fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.text },
	accordionContent: {
		width: '100%',
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginBottom: SPACING_H.xl,
	},
	accordionDescBox: { width: '100%', rowGap: SPACING_H.sm, marginBottom: SPACING_H.md },
	accordionRow: { flexDirection: 'row', alignItems: 'flex-start', columnGap: SPACING_W.sm },
	accordionText: { flex: 1, fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, lineHeight: scaledSize(20) },
	warningText: { color: COLORS.dangerDark, fontWeight: '600' },
	accordionButtonsRow: { flexDirection: 'row', columnGap: SPACING_W.md, justifyContent: 'center', alignItems: 'center' },
	accordionButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.xs,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		// ponytail: 터치 영역 44 이상 보장을 위한 고정 최소 높이
		minHeight: 48,
		borderRadius: RADIUS.md,
	},
	accordionButtonText: { color: COLORS.textWhite, fontSize: FONT_SIZES.md, fontWeight: '600' },
}));

export default InitQuizModeScreen;
