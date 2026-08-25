import React, { useEffect, useMemo, useRef, useState } from 'react';
import ScrollTopButton, { SCROLL_TOP_THRESHOLD } from '@/screens/common/atomic/ScrollTopButton';
import Skeleton from '@/screens/common/atomic/Skeleton';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Paths } from '@/navigation/conf/Paths';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import ProverbDetailModal from './modal/ProverbDetailModal';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import CharacterGuide, { useCharacterGuideOnce } from '@/screens/common/CharacterGuide';
import { useAppNavigation } from '@/navigation/conf/Types';
import QuizHistoryService from '@/services/QuizHistoryService';
import { LEVEL_NAME_BY_NUMBER, getLevelColorByNumber, getCategoryColor } from '@/screens/common/CommonProverbModule';
import { withAlpha, ALPHA } from '@/utils/ColorAlphaUtils';

const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;

/** 필터 '전체' 값 — 난이도(숫자)·카테고리(문자열) 어느 쪽과도 겹치지 않게 심볼 대신 상수 하나만 쓴다 */
const ALL = 'all' as const;
type ALL = typeof ALL;

type FilterChip<T> = { value: T | ALL; label: string; count: number; color: string };

/**
 * 필터 칩 한 줄 (난이도 / 주제).
 * 두 줄이 같은 모양이어야 "같은 성격의 선택지" 로 읽힌다 — 그리는 곳을 하나로 둔다.
 * 선택된 칩만 자기 색(난이도 램프·카테고리 팔레트)을 옅게 입어 어느 축을 좁혔는지 한눈에 보인다.
 */
const FilterChipRow = <T extends number | string>({
	label,
	chips,
	selected,
	total,
	onSelect,
}: {
	label: string;
	chips: FilterChip<T>[];
	selected: T | ALL;
	total: number;
	onSelect: (value: T | ALL) => void;
}) => (
	<View style={styles.chipRow}>
		<Text style={styles.chipRowLabel}>{label}</Text>
		<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRowScroll}>
			{[{ value: ALL, label: '전체', count: total, color: COLORS.textSecondary } as FilterChip<T>, ...chips].map((chip) => {
				const active = selected === chip.value;
				return (
					<TouchableOpacity
						key={String(chip.value)}
						style={[styles.chip, active && { backgroundColor: withAlpha(chip.color, ALPHA.faint), borderColor: withAlpha(chip.color, ALPHA.border) }]}
						onPress={() => onSelect(chip.value)}
						activeOpacity={0.8}
						accessibilityRole="button"
						accessibilityState={{ selected: active }}
						accessibilityLabel={`${label} ${chip.label} ${chip.count}개`}>
						<Text style={[styles.chipText, active && { color: chip.color, fontWeight: '700' }]} numberOfLines={1}>
							{chip.label}
						</Text>
						<Text style={[styles.chipCount, active && { color: chip.color }]}>{chip.count}</Text>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	</View>
);

const WrongReviewScreen = () => {
	// 안내 정책: 화면에 처음 들어갈 때 1회 자동 노출. 다시 보려면 설정 > 화면 안내.
	const guide = useCharacterGuideOnce('wrongReview');
	const navigation = useAppNavigation();
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
	// 복습 범위 — 오답이 쌓일수록 '전부 다시 풀기'는 부담이 커진다. 약한 구간만 골라 풀 수 있게 한다.
	const [levelFilter, setLevelFilter] = useState<number | ALL>(ALL);
	const [categoryFilter, setCategoryFilter] = useState<string | ALL>(ALL);

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
		// 다시 들어올 때는 목록을 접고 필터를 풀고 맨 위에서 시작한다
		setShowWrongList(false);
		setLevelFilter(ALL);
		setCategoryFilter(ALL);
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
			const parsed = await QuizHistoryService.getQuizHistoryOrEmpty();
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

	/** 난이도 칩 — 오답이 하나도 없는 난이도는 아예 만들지 않는다(누를 수 없는 칩은 소음이다) */
	const levelChips = useMemo(() => {
		const counts = new Map<number, number>();
		wrongProverbIds.forEach((p) => counts.set(p.level, (counts.get(p.level) ?? 0) + 1));
		return [...counts.entries()]
			.sort((a, b) => a[0] - b[0])
			.map(([level, count]) => ({
				value: level as number | ALL,
				label: LEVEL_NAME_BY_NUMBER[level] ?? '기타',
				count,
				color: getLevelColorByNumber(level),
			}));
	}, [wrongProverbIds]);

	/** 난이도로 한 번 거른 목록 — 카테고리 칩 개수도 이 기준으로 세야 빈 조합이 생기지 않는다 */
	const levelFiltered = useMemo(
		() => (levelFilter === ALL ? wrongProverbIds : wrongProverbIds.filter((p) => p.level === levelFilter)),
		[wrongProverbIds, levelFilter],
	);

	const categoryChips = useMemo(() => {
		const counts = new Map<string, number>();
		levelFiltered.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([category, count]) => ({
				value: category as string | ALL,
				label: category,
				count,
				color: getCategoryColor(category),
			}));
	}, [levelFiltered]);

	const filteredWrong = useMemo(
		() => (categoryFilter === ALL ? levelFiltered : levelFiltered.filter((p) => p.category === categoryFilter)),
		[levelFiltered, categoryFilter],
	);

	const isFiltered = levelFilter !== ALL || categoryFilter !== ALL;

	/** 난이도를 바꾸면 이전 카테고리가 그 난이도에 없을 수 있다 — 같이 풀어 빈 목록을 막는다 */
	const handleLevelPress = (value: number | ALL) => {
		setLevelFilter(value);
		setCategoryFilter(ALL);
	};

	const resetFilters = () => {
		setLevelFilter(ALL);
		setCategoryFilter(ALL);
	};

	/**
	 * 스크롤을 움직일때 동작을 합니다. 하단으로 스크롤을 내릴때 아이콘 생성
	 * @param event
	 */
	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > SCROLL_TOP_THRESHOLD);
	};

	const startWrongReview = () => {
		if (filteredWrong.length === 0) {
			return;
		}

		navigation.push(Paths.QUIZ, {
			questionPool: filteredWrong,
			isWrongReview: true,
			title: '오답 복습',
			mode: 'meaning',
			selectedLevel: levelFilter === ALL ? '전체' : levelFilter,
			levelKey: 'all',
		});
	};

	if (loading) {
		// 들어올 내용(통계 카드 → 안내 카드 → 버튼)과 같은 형태를 미리 깔아 둔다.
		return (
			<SafeAreaView style={styles.safeArea} edges={['bottom']}>
				<View style={styles.skeletonWrap}>
					<Skeleton height={scaleHeight(72)} radius={RADIUS.lg} />
					<Skeleton width="80%" height={scaleHeight(14)} style={styles.skeletonGap} />
					<Skeleton height={scaleHeight(140)} radius={RADIUS.lg} style={styles.skeletonGap} />
					<Skeleton height={scaleHeight(48)} radius={RADIUS.md} style={styles.skeletonGap} />
				</View>
			</SafeAreaView>
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

					{/* ✅ 복습 범위 — 난이도/카테고리로 좁혀서 약한 구간만 집중 복습 */}
					{(levelChips.length > 1 || categoryChips.length > 1) && (
						<View style={styles.filterCard}>
							<View style={styles.filterHeadRow}>
								<Text style={styles.filterTitle}>복습 범위</Text>
								{isFiltered && (
									<TouchableOpacity onPress={resetFilters} hitSlop={HIT_SLOP} activeOpacity={0.7} style={styles.filterResetButton}>
										<IconComponent type="MaterialIcons" name="restart-alt" size={scaledSize(14)} color={COLORS.textSecondary} />
										<Text style={styles.filterResetText}>전체</Text>
									</TouchableOpacity>
								)}
							</View>

							{levelChips.length > 1 && (
								<FilterChipRow
									label="난이도"
									chips={levelChips}
									selected={levelFilter}
									total={wrongProverbIds.length}
									onSelect={handleLevelPress}
								/>
							)}
							{categoryChips.length > 1 && (
								<FilterChipRow
									label="주제"
									chips={categoryChips}
									selected={categoryFilter}
									total={levelFiltered.length}
									onSelect={setCategoryFilter}
								/>
							)}
						</View>
					)}

					<TouchableOpacity
						style={[styles.startButton, filteredWrong.length === 0 && styles.startButtonDisabled]}
						onPress={startWrongReview}
						disabled={filteredWrong.length === 0}
						activeOpacity={0.8}>
						<IconComponent type="MaterialIcons" name="refresh" size={scaledSize(18)} color={COLORS.textWhite} />
						<Text style={styles.buttonText}>
							{isFiltered ? `선택한 ${filteredWrong.length}문제 다시 풀기` : '오답 다시 풀기'}
						</Text>
					</TouchableOpacity>
				</Animated.View>

				{/* ✅ 펼치기/접기 */}
				<TouchableOpacity style={styles.toggleButton} onPress={() => setShowWrongList((prev) => !prev)} activeOpacity={0.8}>
					<View style={styles.toggleLeft}>
						<IconComponent type="MaterialIcons" name="format-list-bulleted" size={scaledSize(18)} color={COLORS.text} />
						<Text style={styles.toggleButtonText}>오답 목록</Text>
						<View style={styles.toggleCountBadge}>
							<Text style={styles.toggleCountText}>{filteredWrong.length}</Text>
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
						{filteredWrong.map((proverb, idx) => (
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
			<ScrollTopButton visible={showScrollTop} onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })} />

			<ProverbDetailModal visible={detailVisible && !!detailProverb} proverb={detailProverb} onClose={() => setDetailVisible(false)} />
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'틀린 문제만 모아 다시 도전하는 화면입니다.',
					'위 카드에서 푼 문제 수와 정답률을 확인할 수 있습니다.',
					'다시 맞히면 오답 목록에서 사라집니다!',
				]}
				title="오답 복습, 이렇게 씁니다"
			/>
		</SafeAreaView>
	);
};

export default WrongReviewScreen;

const styles = themedStyles(() => StyleSheet.create({
	skeletonWrap: { flex: 1, paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.xl },
	skeletonGap: { marginTop: SPACING_H.lg },
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	scrollContainer: {
		paddingTop: SPACING_H.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingBottom: SPACING_H.xxxxl,
		alignItems: 'center',
		backgroundColor: COLORS.background,
	},
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
	// ===== 복습 범위 필터 =====
	filterCard: {
		width: '100%',
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.md,
		paddingBottom: SPACING_H.sm,
		marginBottom: SPACING_H.lg,
		rowGap: SPACING_H.sm,
	},
	filterHeadRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	filterTitle: {
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	filterResetButton: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xxs,
	},
	filterResetText: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '600',
		color: COLORS.textSecondary,
	},
	chipRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
	},
	chipRowLabel: {
		width: scaleWidth(38),
		fontSize: FONT_SIZES.xs,
		fontWeight: '600',
		color: COLORS.textLight,
	},
	chipRowScroll: {
		columnGap: SPACING_W.xs,
		paddingVertical: SPACING_H.xs,
		paddingRight: SPACING_W.lg,
	},
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.background,
	},
	chipText: {
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
		color: COLORS.textSecondary,
	},
	chipCount: {
		fontSize: FONT_SIZES.xxs,
		fontWeight: '700',
		color: COLORS.textLight,
	},
	startButtonDisabled: {
		backgroundColor: COLORS.borderDark,
	},
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
}));
