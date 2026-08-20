/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Easing, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, HERO, themedStyles } from '@/const/common/Theme';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MainDataType } from '@/types/MainDataType';

import { RouteProp, useRoute } from '@react-navigation/native';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { FIELD_DROPDOWN_ITEMS, LEVELS, QUIZ_MODES, QuizLevelKey } from '@/const/common/CommonMainData';
import ProverbServices from '@/services/ProverbServices';
import IconComponent from './common/atomic/IconComponent';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import BottomHomeButton from './common/BottomHomeButton';
import DateUtils from '@/utils/DateUtils';
import FastImage from 'react-native-fast-image';

type QuizModeScreenRouteParams = {
	QuizModeScreen: { mode: 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank' };
};

/** 난이도별 설명 (카드 서브텍스트) */
const LEVEL_DESC: Record<string, string> = {
	beginner: '아주 쉬운 속담으로 가볍게 시작해요',
	intermediate: '한 단계 높은 속담에 도전해요',
	advanced: '익숙하지 않은 속담까지 풀어봐요',
	expert: '어려운 속담으로 실력을 확인해요',
	all: '모든 난이도의 속담을 풀어보기',
	comingsoon: '새로운 문제가 준비 중입니다',
};

const QuizModeScreen = () => {
	const navigation = useNavigation();

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;
	const shouldShowAd = true; // 20% 확률
	const route = useRoute<RouteProp<QuizModeScreenRouteParams, 'QuizModeScreen'>>();
	const passedMode = route.params?.mode; // 예: 'meaning'

	const [proverbList, setProverbList] = useState<MainDataType.Proverb[]>([]);
	const [quizHistory, setQuizHistory] = useState<MainDataType.UserQuizHistory>();

	const [showAd, setShowAd] = useState(false);
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedLevelKey, setSelectedLevelKey] = useState<QuizLevelKey | null>(null);
	const [tab, setTab] = useState<'level' | 'category'>('level');

	const CATEGORIES = FIELD_DROPDOWN_ITEMS.filter((item) => item.label && item.value).map((item) => ({
		key: item.value,
		label: item.label,
		icon: item.iconName ?? '', // 혹은 기본값
		type: item.iconType ?? 'FontAwesome6',
		color: item.iconColor ?? COLORS.borderDark,
	}));

	// 🎞 화면 진입 / 탭 전환 시 페이드 + 슬라이드 업
	const enterAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		initData();
	}, []);

	useEffect(() => {
		enterAnim.setValue(0);
		const animation = Animated.timing(enterAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true });
		animation.start();
		return () => {
			animation.stop();
			enterAnim.stopAnimation();
		};
	}, [tab, enterAnim]);

	const initData = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		setProverbList(allProverbs);
		const stored = await AsyncStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed: MainDataType.UserQuizHistory = JSON.parse(stored);
			const safeParsed: MainDataType.UserQuizHistory = {
				correctProverbId: parsed.correctProverbId || [],
				wrongProverbId: parsed.wrongProverbId || [],
				lastAnsweredAt: parsed.lastAnsweredAt ? new Date(parsed.lastAnsweredAt) : DateUtils.now(),
				quizCounts: parsed.quizCounts || {},
				badges: parsed.badges || [],
				totalScore: parsed.totalScore || 0,
				bestCombo: parsed.bestCombo || 0,
			};
			setQuizHistory(safeParsed);
		}
	};

	const convertKeyToLevel = (key: QuizLevelKey): number | 'all' | null => {
		switch (key) {
			case 'all':
				return 'all';
			case 'beginner':
				return 1;
			case 'intermediate':
				return 2;
			case 'advanced':
				return 3;
			case 'expert':
				return 4;
			default:
				return null;
		}
	};

	const moveToLevelQuiz = (level: QuizLevelKey) => {
		const titleMap = {
			all: '전체 퀴즈',
			beginner: '초급 퀴즈',
			intermediate: '중급 퀴즈',
			advanced: '고급 퀴즈',
			expert: '특급 퀴즈',
		};

		const selectedLevel = convertKeyToLevel(level);

		let filteredQuestions: MainDataType.Proverb[] = [];

		if (selectedLevel === 'all') {
			// ✅ 전체 문제를 전부 포함
			filteredQuestions = proverbList;
		} else {
			// 난이도별 문제 필터링
			filteredQuestions = proverbList.filter((item) => item.level === selectedLevel);
		}
		//@ts-ignore
		navigation.push(Paths.QUIZ, {
			questionPool: filteredQuestions,
			isWrongReview: false,
			title: titleMap[level],
			mode: passedMode,
			selectedLevel,
			levelKey: level,
		});
	};

	const moveToCategoryQuiz = (categoryLabel: string) => {
		const filteredQuestions = categoryLabel === '전체' ? proverbList : proverbList.filter((p) => p.category === categoryLabel);

		//@ts-ignore
		navigation.push(Paths.QUIZ, {
			questionPool: filteredQuestions,
			isWrongReview: false,
			title: categoryLabel + ' 퀴즈',
			mode: passedMode,
			selectedCategory: categoryLabel,
		});
	};

	const selectedMode = QUIZ_MODES.find((mode) => mode.key === passedMode);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={['top', 'bottom']}>
			<View style={styles.container}>
				<View style={styles.centerWrapper}>
					<View style={styles.tabRow}>
						<TouchableOpacity activeOpacity={0.8} onPress={() => setTab('level')} style={[styles.tabButton, tab === 'level' && styles.tabActive]}>
							<Text style={[styles.tabText, tab === 'level' && styles.tabTextActive]}>난이도</Text>
						</TouchableOpacity>
						<TouchableOpacity activeOpacity={0.8} onPress={() => setTab('category')} style={[styles.tabButton, tab === 'category' && styles.tabActive]}>
							<Text style={[styles.tabText, tab === 'category' && styles.tabTextActive]}>카테고리</Text>
						</TouchableOpacity>
					</View>
					<Animated.ScrollView
						style={{
							opacity: enterAnim,
							transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) }],
						}}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}>
						<View style={styles.quizPathHero}>
							<View style={styles.quizPathCopy}>
								<Text style={styles.title}>{tab === 'level' ? '도전할 난이도를 골라보세요' : '관심 있는 주제를 골라보세요'}</Text>
								<Text style={styles.quizPathDescription}>나에게 맞는 길에서 속담 모험을 시작해요.</Text>
							</View>
							<FastImage source={require('@/assets/images/screen-heroes/quiz-path.png')} style={styles.quizPathImage} resizeMode="contain" />
						</View>
						{selectedMode && (
							<View style={[styles.selectedModeBoxEnhanced, { backgroundColor: selectedMode.color + '20' }]}>
								<View style={styles.selectedModeRow}>
									<IconComponent type={selectedMode.type} name={selectedMode.icon} size={scaledSize(20)} color={selectedMode.color} style={{ marginRight: SPACING_W.sm }} />
									<Text style={styles.selectedModeTextEnhanced}>
										현재 선택한 모드: <Text style={[styles.selectedModeHighlight, { color: selectedMode.color }]}>{selectedMode.label}</Text>
									</Text>
								</View>
							</View>
						)}
						<FastImage source={require('@/assets/images/screen-heroes/quiz-path-emblems.png')} style={styles.quizPathEmblems} resizeMode="contain" />
						<View style={styles.levelListWrap}>
							{tab === 'level' &&
								LEVELS.map((item) => {
									// @ts-ignore
									const isComingSoon = item.key === 'comingsoon';
									if (isComingSoon) {
										return (
											<TouchableOpacity
												key={item.key}
												style={[styles.levelCardFull, styles.levelCardDisabled]}
												activeOpacity={1}
												onPress={() => {
													Alert.alert('준비중..', '새로운 문제를 준비 중입니다. 조금만 기다려 주세요!');
												}}>
												<View style={[styles.levelIconChip, { backgroundColor: COLORS.borderDark }]}>
													<IconComponent type={item.type} name={item.icon} size={scaledSize(24)} color={COLORS.textWhite} />
												</View>
												<View style={styles.levelTextWrap}>
													<Text style={[styles.levelLabelFull, { color: COLORS.textLight }]} numberOfLines={1}>
														{item.label}
													</Text>
													<Text style={styles.levelDescFull} numberOfLines={2}>
														Coming Soon
													</Text>
												</View>
												<IconComponent type="materialIcons" name="lock" size={scaledSize(22)} color={COLORS.borderDark} />
											</TouchableOpacity>
										);
									}

									const levelKey = item.key;
									const selectedLevel = convertKeyToLevel(levelKey);
									const filteredProverbs = selectedLevel === 'all' ? proverbList : proverbList.filter((p) => p.level === selectedLevel);
									const total = filteredProverbs.length;

									const correctSet = new Set(quizHistory?.correctProverbId ?? []);
									const wrongSet = new Set(quizHistory?.wrongProverbId ?? []);
									const solvedSet = new Set([...correctSet, ...wrongSet]);

									const solved = filteredProverbs.filter((p) => solvedSet.has(p.id)).length;

									return (
										<TouchableOpacity
											key={item.key}
											style={styles.levelCardFull}
											activeOpacity={0.85}
											onPress={() => {
												if (shouldShowAd) {
													setSelectedLevelKey(item.key as QuizLevelKey);
													setShowAd(true);
												} else {
													moveToLevelQuiz(item.key as QuizLevelKey);
												}
											}}>
											<View style={[styles.levelIconChip, { backgroundColor: item.color }]}>
												<IconComponent type={item.type} name={item.icon} size={scaledSize(24)} color={COLORS.textWhite} />
											</View>
											<View style={styles.levelTextWrap}>
												<Text style={[styles.levelLabelFull, { color: item.color }]} numberOfLines={1}>
													{item.label}
												</Text>
												<Text style={styles.levelDescFull} numberOfLines={2}>
													{LEVEL_DESC[item.key] ?? '난이도를 선택해 퀴즈를 시작하세요'}
												</Text>
											</View>
											<View style={styles.levelProgressPill}>
												<Text style={[styles.levelProgressText, { color: item.color }]}>{`${solved}/${total}`}</Text>
											</View>
											<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color={COLORS.borderDark} />
										</TouchableOpacity>
									);
								})}
						</View>
						<View>
							{tab === 'category' && (
								<View style={styles.categoryGridWrap}>
									{CATEGORIES.map((item) => {
										const filteredProverbs = item.label === '전체' ? proverbList : proverbList.filter((p) => p.category === item.label);
										const total = filteredProverbs.length;

										const correctSet = new Set(quizHistory?.correctProverbId ?? []);
										const wrongSet = new Set(quizHistory?.wrongProverbId ?? []);
										const solvedSet = new Set([...correctSet, ...wrongSet]);

										const solved = filteredProverbs.filter((p) => solvedSet.has(p.id)).length;

										return (
											<TouchableOpacity
												key={item.key}
												style={[styles.categoryRowButton, { backgroundColor: item.color }]}
												activeOpacity={0.85}
												onPress={() => {
													if (shouldShowAd) {
														setSelectedCategory(item.label);
														setShowAd(true);
													} else {
														moveToCategoryQuiz(item.label);
													}
												}}>
												<View style={styles.categoryCardTitleRow}>
													<IconComponent type={item.type} name={item.icon} size={scaledSize(22)} color={COLORS.textWhite} />
													<Text style={styles.categoryRowText}>{item.label}</Text>
												</View>

												<View style={styles.progressWrapper}>
													<View style={styles.progressBarBackground}>
														<View style={[styles.progressBarFill, { width: `${total > 0 ? (solved / total) * 100 : 0}%` }]} />
													</View>
													<Text style={styles.categoryRowProgress}>{`${solved}/${total}`}</Text>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
							)}
						</View>
					</Animated.ScrollView>
				</View>
			</View>
			<BottomHomeButton backgroundColor={COLORS.surface} />

			{/* 안내 팝업: 화면 안 절대배치 View 로 두면 SafeAreaView 안쪽까지만 딤이 깔려
			    상태바/네비게이션바 영역이 비어 보인다 → RN Modal 로 띄워 화면 끝까지 채운다 */}
			<Modal visible={showInfoModal} transparent animationType="fade" onRequestClose={() => setShowInfoModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<TouchableOpacity style={styles.modalCloseIcon} hitSlop={HIT_SLOP} onPress={() => setShowInfoModal(false)}>
							<IconComponent type="materialIcons" name="close" size={scaledSize(24)} color={COLORS.textSecondary} />
						</TouchableOpacity>
						<Text style={styles.modalTitle}>난이도별 퀴즈 안내</Text>
						<Text style={styles.modalText}>전체, 초급, 중급, 고급, 특급으로 나뉘며 난이도에 따라 퀴즈 문제가 달라집니다.</Text>
						<TouchableOpacity style={styles.modalCloseButton} activeOpacity={0.85} onPress={() => setShowInfoModal(false)}>
							<Text style={styles.modalCloseText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{showAd && (
				<AdmobFrontAd
					onAdClosed={() => {
						setShowAd(false);
						if (selectedLevelKey) {
							moveToLevelQuiz(selectedLevelKey);
							setSelectedLevelKey(null);
						} else if (selectedCategory) {
							moveToCategoryQuiz(selectedCategory);
							setSelectedCategory(null);
						}
					}}
				/>
			)}
		</SafeAreaView>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.surface,
	},
	centerWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	// ===== 탭 =====
	tabRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: SPACING_H.xl,
	},
	tabButton: {
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xl,
		// ponytail: 터치 영역 44 이상 보장을 위한 고정 최소 높이
		minHeight: 44,
		justifyContent: 'center',
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
		marginHorizontal: SPACING_W.sm,
	},
	tabActive: {
		borderBottomColor: COLORS.primary,
	},
	tabText: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.textSecondary,
		fontWeight: '500',
		textAlign: 'center',
	},
	tabTextActive: {
		color: COLORS.primary,
		fontWeight: '700',
	},
	// ===== 스크롤 영역 =====
	scrollContent: {
		rowGap: SPACING_H.md,
		paddingBottom: SPACING_H.xxxxl,
	},
	quizPathHero: {
		minHeight: scaleHeight(116),
		marginTop: SPACING_H.lg,
		paddingLeft: SPACING_W.lg,
		backgroundColor: HERO.bg,
		borderTopWidth: 3,
		borderTopColor: HERO.accent,
		borderRadius: RADIUS.lg,
		flexDirection: 'row',
		alignItems: 'center',
		overflow: 'hidden',
	},
	quizPathCopy: { flex: 1, paddingVertical: SPACING_H.lg, zIndex: 1 },
	quizPathImage: { width: scaleWidth(136), height: scaleHeight(112), marginRight: scaleWidth(-6) },
	quizPathDescription: { fontSize: FONT_SIZES.sm, lineHeight: scaledSize(18), color: HERO.description, marginTop: SPACING_H.xs },
	quizPathEmblems: { alignSelf: 'center', width: scaleWidth(190), height: scaleHeight(54), marginVertical: scaleHeight(-4) },
	title: {
		fontSize: FONT_SIZES.lg,
		lineHeight: scaledSize(23),
		color: HERO.title,
		fontWeight: '800',
	},
	// ===== 선택된 모드 안내 =====
	selectedModeBoxEnhanced: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: RADIUS.md,
		marginVertical: SPACING_H.sm,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	selectedModeRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	selectedModeTextEnhanced: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.text,
		fontWeight: '500',
	},
	selectedModeHighlight: {
		fontWeight: '700',
	},
	// ===== 난이도 카드 =====
	levelListWrap: {
		width: '100%',
		rowGap: SPACING_H.md,
	},
	levelCardFull: {
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
	levelCardDisabled: {
		opacity: 0.7,
	},
	levelIconChip: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: RADIUS.md,
		justifyContent: 'center',
		alignItems: 'center',
	},
	levelTextWrap: {
		flex: 1,
	},
	levelLabelFull: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		marginBottom: SPACING_H.xs,
	},
	levelDescFull: {
		color: COLORS.textSecondary,
		fontSize: FONT_SIZES.sm,
		lineHeight: scaledSize(18),
	},
	levelProgressPill: {
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
	},
	levelProgressText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
	// ===== 카테고리 카드 =====
	categoryGridWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		width: '100%',
		rowGap: SPACING_H.md,
	},
	categoryRowButton: {
		width: '48%',
		minHeight: scaleHeight(92),
		justifyContent: 'space-between',
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.lg,
		backgroundColor: COLORS.primary,
	},
	categoryCardTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	categoryRowText: {
		flex: 1,
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		marginLeft: SPACING_W.sm,
	},
	progressWrapper: {
		flexDirection: 'column',
		alignItems: 'stretch',
		width: '100%',
		marginTop: SPACING_H.sm,
	},
	progressBarBackground: {
		width: '100%',
		height: scaleHeight(10),
		backgroundColor: 'rgba(255,255,255,0.25)',
		borderRadius: RADIUS.round,
		overflow: 'hidden',
		marginBottom: SPACING_H.xs,
	},
	progressBarFill: {
		height: '100%',
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.textWhite,
	},
	categoryRowProgress: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
	},
	// ===== 안내 모달 =====
	modalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
		zIndex: 99,
	},
	modalContent: {
		width: '100%',
		maxWidth: scaleWidth(420),
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.xl,
		paddingVertical: SPACING_H.xl,
		borderRadius: RADIUS.xl,
	},
	modalCloseIcon: {
		position: 'absolute',
		top: SPACING_H.md,
		right: SPACING_W.md,
		zIndex: 2,
		padding: SPACING_W.xs,
	},
	modalTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.md,
		textAlign: 'center',
	},
	modalText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(22),
		textAlign: 'left',
		marginBottom: SPACING_H.xl,
	},
	modalCloseButton: {
		alignSelf: 'center',
		backgroundColor: COLORS.secondary,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xxl,
		// ponytail: 터치 영역 44 이상 보장을 위한 고정 최소 높이
		minHeight: 48,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: RADIUS.md,
	},
	modalCloseText: {
		color: COLORS.textWhite,
		fontWeight: '600',
		fontSize: FONT_SIZES.lg,
	},
}));
export default QuizModeScreen;
