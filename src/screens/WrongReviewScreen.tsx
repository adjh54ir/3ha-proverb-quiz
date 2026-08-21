import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import ProverbDetailModal from './modal/ProverbDetailModal';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, HERO, themedStyles } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';

const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;

const WrongReviewScreen = () => {
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const [loading, setLoading] = useState(true);
	const scrollViewRef = useRef<ScrollView>(null);
	const [wrongProverbIds, setWrongProverbIds] = useState<MainDataType.Proverb[]>([]);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [totalSolvedCount, setTotalSolvedCount] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [showWrongList, setShowWrongList] = useState(false);
	const [detailProverb, setDetailProverb] = useState<MainDataType.Proverb | null>(null);
	const [detailVisible, setDetailVisible] = useState(false);

	// ✅ 화면 진입 애니메이션 (fade + slide-up)
	const contentFade = useRef(new Animated.Value(0)).current;
	const contentSlide = useRef(new Animated.Value(scaleHeight(12))).current;
	// ✅ 오답 목록 펼침 애니메이션
	const listFade = useRef(new Animated.Value(0)).current;

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	useEffect(() => {
		if (!isFocused) {
			return;
		}
		fetchWrongData();
		// 다시 들어올 때는 목록을 접고 맨 위에서 시작한다
		setShowWrongList(false);
		setDetailVisible(false);
		setShowScrollTop(false);
		scrollViewRef.current?.scrollTo({ y: 0, animated: false });
	}, [isFocused]);

	useEffect(() => {
		if (loading) {
			return;
		}
		contentFade.setValue(0);
		contentSlide.setValue(scaleHeight(12));
		const anim = Animated.parallel([
			Animated.timing(contentFade, { toValue: 1, duration: 280, useNativeDriver: true }),
			Animated.timing(contentSlide, { toValue: 0, duration: 280, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, [loading, contentFade, contentSlide]);

	useEffect(() => {
		if (!showWrongList) {
			listFade.setValue(0);
			return;
		}
		const anim = Animated.timing(listFade, { toValue: 1, duration: 250, useNativeDriver: true });
		anim.start();
		return () => anim.stop();
	}, [showWrongList, listFade]);

	const fetchWrongData = async () => {
		setLoading(true);
		try {
			const stored = await AsyncStorage.getItem(STORAGE_KEY);
			if (!stored) {
				setWrongProverbIds([]);
				return;
			}
			const parsed: MainDataType.UserQuizHistory = JSON.parse(stored);
			const wrongCca3List: number[] = parsed.wrongProverbId ?? [];
			const correctCca3List: number[] = parsed.correctProverbId ?? [];
			setTotalSolvedCount(wrongCca3List.length + correctCca3List.length);
			setCorrectCount(correctCca3List.length);

			const fullList = ProverbServices.selectProverbList();
			const result = fullList.filter((c) => wrongCca3List.includes(c.id));
			setWrongProverbIds(result);
		} catch (e) {
			console.error('오답 로딩 실패:', e);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * 스크롤을 움직일때 동작을 합니다. 하단으로 스크롤을 내릴때 아이콘 생성
	 * @param event
	 */
	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 100);
	};

	const startWrongReview = () => {
		if (wrongProverbIds.length === 0) {
			return;
		}

		// @ts-ignore
		navigation.push(Paths.QUIZ, {
			questionPool: wrongProverbIds,
			isWrongReview: true,
			title: '오답 복습',
			mode: 'meaning',
			selectedLevel: '전체',
			levelKey: 'all',
		});
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color={COLORS.primary} />
			</View>
		);
	}

	if (wrongProverbIds.length === 0) {
		return (
			<View style={styles.emptyWrap}>
				<Animated.View style={[styles.emptyCard, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
					<FastImage
						source={require('@/assets/images/correct_mascote.png')}
						style={styles.emptyMascot}
						resizeMode="contain"
					/>
					<Text style={styles.emptyTitle}>틀린 문제가 없습니다! 🎉</Text>
					<Text style={styles.emptyDesc}>
						아직 오답으로 기록된 속담이 없습니다.{'\n'}
						퀴즈를 풀다가 틀린 문제가 생기면{'\n'}
						이곳에서 모아 다시 복습할 수 있습니다.
					</Text>
				</Animated.View>
			</View>
		);
	}

	const accuracy = totalSolvedCount > 0 ? Math.round((correctCount / totalSolvedCount) * 100) : 0;

	return (
		<SafeAreaView style={styles.safeArea} edges={['bottom']}>
			<ScrollView
				contentContainerStyle={styles.scrollContainer}
				ref={scrollViewRef}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}>
				<Animated.View style={{ width: '100%', opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
					<View style={styles.reviewHero}>
						<View style={styles.reviewHeroCopy}>
							<Text style={styles.reviewHeroTitle}>실수는 지혜가 자라는 순간입니다</Text>
							<Text style={styles.reviewHeroDescription}>천천히 다시 보면 이번에는 분명 맞힐 수 있습니다.</Text>
						</View>
						<FastImage
							source={require('@/assets/images/screen-heroes/wrong-review.png')}
							style={styles.reviewHeroImage}
							resizeMode="contain"
						/>
					</View>
					{/* ✅ 컴팩트 통계 카드 */}
					<View style={styles.statsCard}>
						<View style={styles.statsItem}>
							<Text style={styles.statsValue}>{totalSolvedCount}</Text>
							<Text style={styles.statsLabel}>푼 문제</Text>
						</View>
						<View style={styles.statsDivider} />
						<View style={styles.statsItem}>
							<Text style={[styles.statsValue, { color: COLORS.danger }]}>{wrongProverbIds.length}</Text>
							<Text style={styles.statsLabel}>오답</Text>
						</View>
						<View style={styles.statsDivider} />
						<View style={styles.statsItem}>
							<Text style={[styles.statsValue, { color: COLORS.success }]}>{accuracy}%</Text>
							<Text style={styles.statsLabel}>정답률</Text>
						</View>
					</View>

					{/* ✅ 격려 메시지 */}
					<Text style={styles.encourageText}>
						지금까지 <Text style={styles.encourageHighlight}>{totalSolvedCount}</Text>문제를 풀었고,{' '}
						<Text style={styles.encourageHighlight}>{wrongProverbIds.length}</Text>문제가 남았습니다.{'\n'}한 번 더 도전해 보시겠습니까? 💪
					</Text>

					{/* ✅ 안내 */}
					<View style={styles.guideCard}>
						<Text style={styles.guideCardTitle}>📘 오답 복습이란?</Text>
						<Text style={styles.guideCardContent}>
							• 틀린 문제를 다시 풀고, <Text style={styles.guideHighlight}>정답</Text>을 맞히면 목록에서 자동으로 사라집니다.{'\n'}•
							항상 <Text style={styles.guideHighlight}>뜻 맞추기</Text>로 출제되며, 정답 시 <Text style={styles.guideHighlight}>10점</Text>을
							받습니다 🎯{'\n'}• 다시 틀려도 걱정 마세요. 반복하며 실력을 쌓을 수 있습니다! 🔄
						</Text>
					</View>

					<TouchableOpacity style={styles.startButton} onPress={startWrongReview} activeOpacity={0.8}>
						<IconComponent type="MaterialIcons" name="refresh" size={scaledSize(18)} color={COLORS.textWhite} />
						<Text style={styles.buttonText}>오답 다시 풀기</Text>
					</TouchableOpacity>
				</Animated.View>

				{/* ✅ 펼치기/접기 */}
				<TouchableOpacity style={styles.toggleButton} onPress={() => setShowWrongList((prev) => !prev)} activeOpacity={0.8}>
					<View style={styles.toggleLeft}>
						<IconComponent type="MaterialIcons" name="format-list-bulleted" size={scaledSize(18)} color={COLORS.text} />
						<Text style={styles.toggleButtonText}>오답 목록</Text>
						<View style={styles.toggleCountBadge}>
							<Text style={styles.toggleCountText}>{wrongProverbIds.length}</Text>
						</View>
					</View>
					<IconComponent
						type="MaterialIcons"
						name={showWrongList ? 'expand-less' : 'expand-more'}
						size={scaledSize(22)}
						color={COLORS.textSecondary}
					/>
				</TouchableOpacity>

				{showWrongList && (
					<Animated.View style={[styles.reviewCardList, { opacity: listFade }]}>
						{wrongProverbIds.map((proverb, idx) => (
							<TouchableOpacity
								key={proverb.id}
								style={styles.reviewCard}
								activeOpacity={0.8}
								onPress={() => {
									setDetailProverb(proverb);
									setDetailVisible(true);
								}}>
								<View style={styles.reviewCardBody}>
									<View style={styles.reviewCardHeader}>
										<View style={styles.reviewIndexBadge}>
											<Text style={styles.reviewIndexText}>{idx + 1}</Text>
										</View>
										<Text style={styles.reviewProverbText}>{proverb.proverb}</Text>
									</View>
									<Text style={styles.reviewMeaningText}>{proverb.longMeaning || proverb.meaning}</Text>
								</View>
								<IconComponent type="MaterialIcons" name="chevron-right" size={scaledSize(22)} color={COLORS.borderDark} />
							</TouchableOpacity>
						))}
					</Animated.View>
				)}
			</ScrollView>

			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity
					style={styles.scrollTopButton}
					activeOpacity={0.8}
					onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}>
					<IconComponent type="MaterialIcons" name="arrow-upward" size={scaledSize(24)} color={COLORS.textWhite} />
				</TouchableOpacity>
			)}

			<ProverbDetailModal visible={detailVisible && !!detailProverb} proverb={detailProverb} onClose={() => setDetailVisible(false)} />
		</SafeAreaView>
	);
};

export default WrongReviewScreen;

const styles = themedStyles(() => StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: COLORS.background,
	},
	scrollContainer: {
		paddingTop: SPACING_H.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingBottom: SPACING_H.xxxxl,
		alignItems: 'center',
		backgroundColor: COLORS.background,
	},
	reviewHero: {
		width: '100%',
		minHeight: scaleHeight(124),
		marginBottom: SPACING_H.md,
		paddingLeft: SPACING_W.lg,
		backgroundColor: HERO.bg,
		borderTopWidth: 3,
		borderTopColor: HERO.accent,
		borderRadius: RADIUS.lg,
		flexDirection: 'row',
		alignItems: 'center',
		overflow: 'hidden',
	},
	reviewHeroCopy: { flex: 1, paddingVertical: SPACING_H.lg, zIndex: 1 },
	reviewHeroTitle: { fontSize: FONT_SIZES.lg, lineHeight: scaledSize(22), fontWeight: '800', color: HERO.title, marginBottom: SPACING_H.xs },
	reviewHeroDescription: { fontSize: FONT_SIZES.sm, lineHeight: scaledSize(18), color: HERO.description },
	reviewHeroImage: { width: scaleWidth(138), height: scaleHeight(118), marginRight: scaleWidth(-8) },
	// ===== 통계 카드 =====
	statsCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		width: '100%',
		marginBottom: SPACING_H.md,
	},
	statsItem: {
		flex: 1,
		alignItems: 'center',
	},
	statsValue: {
		fontSize: FONT_SIZES.xxl,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.xs,
	},
	statsLabel: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		fontWeight: '500',
	},
	statsDivider: {
		width: 1,
		height: scaleHeight(28),
		backgroundColor: COLORS.border,
	},
	// ===== 격려 문구 =====
	encourageText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		textAlign: 'center',
		lineHeight: scaledSize(21),
		fontWeight: '500',
		marginBottom: SPACING_H.lg,
	},
	encourageHighlight: {
		color: COLORS.danger,
		fontWeight: '700',
	},
	// ===== 안내 카드 =====
	guideCard: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginBottom: SPACING_H.lg,
		width: '100%',
	},
	guideCardTitle: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.sm,
	},
	guideCardContent: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(21),
	},
	guideHighlight: {
		fontWeight: '700',
		color: COLORS.primaryDark,
	},
	// ===== 주요 액션 =====
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		backgroundColor: COLORS.primary,
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		marginBottom: SPACING_H.lg,
		width: '100%',
	},
	buttonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		textAlign: 'center',
	},
	// ===== 오답 목록 토글 =====
	toggleButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		width: '100%',
	},
	toggleLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
	},
	toggleButtonText: {
		color: COLORS.textStrong,
		fontSize: FONT_SIZES.lg,
		fontWeight: '600',
	},
	toggleCountBadge: {
		minWidth: scaleWidth(22),
		height: scaleWidth(22),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.dangerBg,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: SPACING_W.sm,
	},
	toggleCountText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
		color: COLORS.danger,
	},
	// ===== 오답 카드 =====
	reviewCardList: {
		width: '100%',
		marginTop: SPACING_H.md,
	},
	reviewCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingVertical: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	reviewCardBody: {
		flex: 1,
	},
	reviewCardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		marginBottom: SPACING_H.sm,
	},
	reviewIndexBadge: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: scaleWidth(24) / 2,
		backgroundColor: COLORS.surfaceAlt,
		alignItems: 'center',
		justifyContent: 'center',
	},
	reviewIndexText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
		color: COLORS.textSecondary,
	},
	reviewProverbText: {
		flex: 1,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	reviewMeaningText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		lineHeight: scaledSize(20),
	},
	// ===== 빈 상태 =====
	emptyWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: COLORS.background,
		paddingHorizontal: SPACING_W.lg,
	},
	emptyCard: {
		width: '100%',
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingVertical: SPACING_H.xxl,
		paddingHorizontal: SPACING_W.lg,
	},
	emptyMascot: {
		width: scaleWidth(96),
		height: scaleWidth(96),
		marginBottom: SPACING_H.md,
	},
	emptyTitle: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.sm,
		textAlign: 'center',
	},
	emptyDesc: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		textAlign: 'center',
		lineHeight: scaledSize(21),
	},
	// ===== 최상단 이동 버튼 =====
	scrollTopButton: {
		position: 'absolute',
		right: SPACING_W.xl,
		bottom: scaleHeight(32),
		backgroundColor: COLORS.secondary,
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(48) / 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
}));
