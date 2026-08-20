/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { matchesKeyword } from '@/utils/SearchUtils';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	RefreshControl,
	TouchableOpacity,
	Keyboard,
	TouchableWithoutFeedback,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, HERO, themedStyles, themedValue, getPickerTheme } from '@/const/common/Theme';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { getCategoryColor, getLevelColor, getFieldIcon, getFieldIconName, getLevelIconName } from './common/CommonProverbModule';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import { useToast } from '@/hooks/useToast';


const PAGE_SIZE = 30;

// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const COMMON_ALL_OPTION = themedValue(() => ({
	label: '전체',
	value: '전체',
	iconType: 'FontAwesome6',
	iconName: 'clipboard-list',
	iconColor: COLORS.textSecondary,
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color={COLORS.textSecondary} />,
	labelStyle: {
		marginLeft: SPACING_W.xsPlus,
		fontSize: FONT_SIZES.md,
	},
}));

// 공통 아이콘(CommonProverbModule)을 실제 데이터 값 기준으로 불러와 드롭다운 좌측 아이콘 구성
const buildLevelItems = (levels: string[]) => [
	COMMON_ALL_OPTION,
	...levels.map((lv) => ({
		label: lv,
		value: lv,
		icon: () => <IconComponent type="FontAwesome6" name={getLevelIconName(lv)} size={scaledSize(15)} color={getLevelColor(lv)} />,
	})),
];
const buildFieldItems = (fields: string[]) => [
	COMMON_ALL_OPTION,
	...fields.map((f) => ({
		label: f,
		value: f,
		icon: () => <IconComponent type="materialIcons" name={getFieldIconName(f)} size={scaledSize(16)} color={getCategoryColor(f)} />,
	})),
];

/**
 * FlatList 아이템 fade+slide-up 진입 애니메이션 래퍼
 */
const AnimatedListItem = React.memo(({ children, index }: { children: React.ReactNode; index: number }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(scaleHeight(16))).current;

	useEffect(() => {
		// 처음 6개만 stagger, 이후는 즉시 표시 (스크롤 성능 보호)
		const delay = index < 6 ? index * 40 : 0;
		const anim = Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 250,
				delay,
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: 0,
				duration: 250,
				delay,
				useNativeDriver: true,
			}),
		]);
		anim.start();
		return () => anim.stop();
	}, []);

	return (
		<Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
			{children}
		</Animated.View>
	);
});

const ProverbListScreen = () => {
	const scrollRef = useRef<FlatList>(null);
	const searchInputRef = useRef<TextInput>(null);
	const headerAnim = useRef(new Animated.Value(0)).current;
	const scrollTopAnim = useRef(new Animated.Value(0)).current;

	const emptyImage = require('@/assets/images/feature-states/empty-search.png');
	const [refreshing, setRefreshing] = useState(false);
	const [keyword, setKeyword] = useState('');
	const [mainList, setMainList] = useState<MainDataType.Proverb[]>([]);
	const [visibleList, setVisibleList] = useState<MainDataType.Proverb[]>([]);
	const [page, setPage] = useState(1);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [fieldOpen, setFieldOpen] = useState(false);
	const [levelOpen, setLevelOpen] = useState(false);
	const [categoryValue, setCategoryValue] = useState('전체');
	const [levelValue, setLevelValue] = useState('전체');
	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	// 주요 CRUD 피드백은 공통 토스트 훅으로 통일한다.
	const { showToast, ToastView } = useToast();

	const [levelItems, setLevelItems] = useState([{ label: '', value: '' }]);
	const [categoryItems, setCategoryItems] = useState([{ label: '', value: '' }]);

	useBlockBackHandler(true); // 뒤로가기 모션 막기
	/**
	 * 최초 페이지 로드
	 */
	/**
	 * 최초 페이지 로드
	 */
	const fetchData = () => {
		const allData = ProverbServices.selectProverbList();
		let filtered = [...allData];

		if (keyword.trim()) {
			// 초성 검색 지원: 'ㄱㅇㅁ' 로도 '가는 말이…' 가 걸린다.
			filtered = filtered.filter((item) => matchesKeyword(keyword, item.proverb, item.meaning, item.longMeaning));
		}
		if (categoryValue !== '전체') {
			filtered = filtered.filter((item) => item.category?.trim() === categoryValue);
		}
		if (levelValue !== '전체') {
			filtered = filtered.filter((item) => item.levelName?.trim() === levelValue);
		}
		// ✅ 즐겨찾기 필터 추가
		if (showFavoritesOnly) {
			filtered = filtered.filter((item) => favoriteIds.includes(item.id));
		}

		setMainList(filtered);
		setPage(1);
		setVisibleList(filtered.slice(0, PAGE_SIZE));
	};

	useEffect(() => {
		fetchData();
	}, [keyword, categoryValue, levelValue, showFavoritesOnly, favoriteIds]);

	// 화면 진입 fade + slide-up
	useEffect(() => {
		const anim = Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true });
		anim.start();
		return () => anim.stop();
	}, []);

	// 최상단 이동 버튼 fade + scale
	useEffect(() => {
		const anim = Animated.timing(scrollTopAnim, {
			toValue: showScrollTop ? 1 : 0,
			duration: 200,
			useNativeDriver: true,
		});
		anim.start();
		return () => anim.stop();
	}, [showScrollTop]);

	// 🔄 화면 포커스 시 초기화 + 데이터 로드
	// (handleReset() 만 부르던 중복 useFocusEffect 는 제거. 아래 블록이 같은 상태를 모두 리셋하면서
	//  드롭다운 항목/즐겨찾기 로드까지 하는 상위 집합이고, BottomTabNavigator 의 withFreshMount 가
	//  탭 진입마다 화면을 리마운트하므로 handleReset 의 키보드 닫기/스크롤 상단 이동은 무의미했다.)
	useFocusEffect(
		useCallback(() => {
			// ✅ 필터 상태 초기화
			setKeyword('');
			setCategoryValue('전체');
			setLevelValue('전체');
			setShowFavoritesOnly(false); // ✅ 즐겨찾기 필터 초기화

			// ✅ 리스트 상태 초기화
			setPage(1);
			setVisibleList([]);
			setMainList([]);

			// ✅ 드롭다운 항목 새로 세팅 (아이콘 포함)
			const fieldList = ProverbServices.selectCategoryList();
			setCategoryItems(buildFieldItems(fieldList));

			const levelList = ProverbServices.selectLevelNameList();
			setLevelItems(buildLevelItems(levelList));
			loadFavorites(); // ✅ 즐겨찾기 로드

			// ✅ 데이터 새로 불러오기
			fetchData();
		}, []),
	);

	// ✅ 즐겨찾기 로드
	const loadFavorites = async () => {
		const favorites = await getFavorites();
		setFavoriteIds(favorites);
	};

	// ✅ 즐겨찾기 토글
	const handleToggleFavorite = async (id: number) => {
		const isNowFavorite = await toggleFavorite(id);
		await loadFavorites();

		showToast(isNowFavorite ? '즐겨찾기 추가' : '즐겨찾기 해제', isNowFavorite ? '즐겨찾기 목록에서 다시 볼 수 있어요' : '즐겨찾기 목록에서 제거했어요');
	};

	const onRefresh = () => {
		setRefreshing(true);
		fetchData();
		setRefreshing(false);
	};

	const loadMoreData = () => {
		const nextPage = page + 1;
		const start = (nextPage - 1) * PAGE_SIZE;
		const end = start + PAGE_SIZE;
		const newData = mainList.slice(0, end);

		if (newData.length > visibleList.length) {
			setVisibleList(newData);
			setPage(nextPage);
		}
	};

	const scrollToTop = () => {
		scrollRef.current?.scrollToOffset({ animated: true, offset: 0 });
	};

	const handleReset = () => {
		// 1. 드롭다운을 먼저 닫음
		setFieldOpen(false);
		setLevelOpen(false);

		// 2. 키보드 닫기
		Keyboard.dismiss();

		// 3. 약간의 지연 후 값 초기화 (포커싱 이슈 방지)
		setTimeout(() => {
			setKeyword('');
			setCategoryValue('전체');
			setLevelValue('전체');

			// 필터 목록 초기화 (아이콘 포함)
			const fieldList = ProverbServices.selectCategoryList();
			setCategoryItems(buildFieldItems(fieldList));

			const levelList = ProverbServices.selectLevelNameList();
			setLevelItems(buildLevelItems(levelList));

			scrollToTop(); // 스크롤 이동은 마지막에
		}, 50);
	};

	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 2:
				return <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 3:
				return <IconComponent type="FontAwesome6" name="tree" size={scaledSize(14)} color={COLORS.textWhite} />;
			case 4:
				return <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(14)} color={COLORS.textWhite} />;
			default:
				return null;
		}
	};

	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
				<TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
					<View style={{ flex: 1 }}>
						{/* 필터 + 드롭다운 영역 */}
						<Animated.View
							style={[
								styles.container,
								{
									opacity: headerAnim,
									transform: [
										{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) },
									],
								},
							]}>
							<View style={styles.dictionaryHero}>
								<View style={styles.dictionaryHeroCopy}>
									<Text style={styles.dictionaryHeroTitle}>오늘의 지혜를 찾아보세요</Text>
									<Text style={styles.dictionaryHeroDescription}>속담과 뜻을 한곳에서 빠르게 살펴볼 수 있어요.</Text>
								</View>
								<FastImage
									source={require('@/assets/images/screen-heroes/proverb-dictionary.png')}
									style={styles.dictionaryHeroImage}
									resizeMode="contain"
								/>
							</View>
							<View style={styles.filterCard}>
								<View style={styles.searchRow}>
									<View style={styles.searchInputWrapper}>
										<Icon name="magnifying-glass" size={scaledSize(16)} color={COLORS.textLight} style={styles.searchIcon} />
										<TextInput
											ref={searchInputRef}
											style={[styles.input, styles.searchInput]}
											placeholder="속담·의미 또는 초성(ㄱㄴㄷ) 검색"
											placeholderTextColor={COLORS.textLight}
											onChangeText={(text) => {
												setKeyword(text);
												setFieldOpen(false);
												setLevelOpen(false);
											}}
											value={keyword}
										/>
									</View>
									{(keyword.trim() !== '' || levelValue !== '전체' || categoryValue !== '전체') && (
										<TouchableOpacity style={styles.resetButtonInline} onPress={handleReset}>
											<Icon name="rotate-right" size={scaledSize(18)} color={COLORS.textSecondary} />
										</TouchableOpacity>
									)}
								</View>
								<View style={styles.filterDropdownRow}>
									<View style={[styles.dropdownWrapper, { zIndex: fieldOpen ? 2000 : 1000 }]}>
										<DropDownPicker
											theme={getPickerTheme()}
											open={levelOpen}
											value={levelValue}
											items={levelItems}
											setOpen={setLevelOpen}
											setValue={setLevelValue}
											setItems={setLevelItems}
											style={styles.dropdownLevel}
											listMode="SCROLLVIEW"
											maxHeight={scaleHeight(200)}
											scrollViewProps={{
												nestedScrollEnabled: true,
											}}
											dropDownContainerStyle={{
												...styles.dropdownListLevel,
												maxHeight: scaleHeight(200),
												overflow: 'visible', // 🟢 부모와 같이 설정
												zIndex: 3000,
											}}
											onChangeValue={(value) => {
												scrollToTop();
											}}
											listItemLabelStyle={{ marginLeft: SPACING_W.xsPlus, fontSize: FONT_SIZES.md }}
											labelStyle={{ fontSize: FONT_SIZES.md, color: COLORS.text }}
											iconContainerStyle={{ marginRight: SPACING_W.sm }}
											showArrowIcon={true} // 드롭다운 화살표
											showTickIcon={false} // 선택 시 오른쪽 체크 표시 제거
										/>
									</View>
									<View style={[styles.dropdownWrapperLast, { zIndex: levelOpen ? 2000 : 1000, overflow: 'visible' }]}>
										<DropDownPicker
											theme={getPickerTheme()}
											listMode="MODAL"
											open={fieldOpen}
											modalTitle="카테고리 선택"
											value={categoryValue}
											items={categoryItems}
											setOpen={setFieldOpen}
											setValue={setCategoryValue}
											setItems={setCategoryItems}
											dropDownDirection="BOTTOM"
											scrollViewProps={{ nestedScrollEnabled: true }}
											style={styles.dropdownField}
											dropDownContainerStyle={{
												overflow: 'visible',
												zIndex: 3000,
												...styles.dropdownListField,
												maxHeight: scaleHeight(200),
											}}
											onChangeValue={(value) => {
												scrollToTop();
											}}
											zIndex={5000}
											zIndexInverse={4000}
											containerStyle={{ zIndex: 5000 }}
											labelStyle={{ fontSize: FONT_SIZES.md, color: COLORS.text }}
											iconContainerStyle={{ marginRight: SPACING_W.sm }}
											showArrowIcon={true}
											showTickIcon={false}
											renderListItem={({ item, onPress }) => (
												<TouchableOpacity
													//@ts-ignore
													onPress={() => onPress(item)}
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														paddingVertical: SPACING_H.mdPlus,
														paddingHorizontal: SPACING_W.lg,
														borderBottomWidth: 1,
														borderBottomColor: COLORS.surfaceAlt,
													}}>
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: SPACING_W.md }}>
														{typeof item.icon === 'function' ? item.icon() : item.icon}
													</View>
													<Text style={{ fontSize: FONT_SIZES.mdPlus, color: COLORS.text, flex: 1 }}>{item.label}</Text>
												</TouchableOpacity>
											)}
											modalProps={{
												animationType: 'fade',
												presentationStyle: 'overFullScreen',
												transparent: true,
											}}
											modalContentContainerStyle={{
												marginTop: '25%',
												width: '85%',
												alignSelf: 'center',
												maxHeight: scaleHeight(500),
												backgroundColor: COLORS.surface,
												borderWidth: 1,
												borderColor: COLORS.borderDark,
												borderRadius: RADIUS.xl,
												paddingHorizontal: 0,
												paddingVertical: SPACING_H.xl,
												position: 'relative',
											}}
											modalTitleStyle={{
												fontSize: FONT_SIZES.lg,
												fontWeight: '700',
												color: COLORS.text,
												textAlign: 'center',
												paddingVertical: SPACING_H.md,
												paddingHorizontal: SPACING_W.lg,
												paddingRight: SPACING_W.xxxxl,
											}}
											closeIconStyle={{
												marginTop: SPACING_H.xs,
												width: scaleWidth(24),
												height: scaleWidth(24),
											}}
											closeIconContainerStyle={{
												position: 'absolute',
												right: scaleWidth(12),
												top: scaleHeight(12),
												padding: SPACING_W.xs,
												zIndex: 1,
											}}
										/>
									</View>

									{/* 초기화 버튼 */}
									{/* <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                  <Icon name='rotate-right' size={scaledSize(20)} color={COLORS.textSecondary} />
                </TouchableOpacity> */}
								</View>
								{/* ✅ 즐겨찾기 버튼 + 리스트 개수 */}
								<View style={styles.listCountWrapper}>
									<TouchableOpacity
										style={[styles.favoriteFilterButton, showFavoritesOnly && styles.favoriteFilterButtonActive]}
										onPress={() => {
											setShowFavoritesOnly(!showFavoritesOnly);
											scrollToTop();
										}}>
										<Icon name="star" solid={showFavoritesOnly} size={scaledSize(14)} color={showFavoritesOnly ? COLORS.gold : COLORS.textLight} />
										<Text style={[styles.favoriteFilterText, showFavoritesOnly && styles.favoriteFilterTextActive]}>
											즐겨찾기
										</Text>
									</TouchableOpacity>
									<Text style={styles.listCountText}>총 {mainList.length}개가 검색되었어요!</Text>
								</View>
							</View>
						</Animated.View>

						{/* 리스트 영역 */}
						<View style={{ flex: 1, zIndex: 0 }}>
							<FlatList
								ref={scrollRef}
								data={visibleList}
								scrollEnabled={!fieldOpen && !levelOpen} // ⛔ 드롭다운 열려 있으면 스크롤 막기
								keyExtractor={(item) => item.id.toString()}
								refreshControl={<RefreshControl
										refreshing={refreshing}
										onRefresh={onRefresh}
										tintColor={COLORS.textSecondary}
										colors={[COLORS.primary]}
										progressBackgroundColor={COLORS.surface}
									/>}
								onEndReached={loadMoreData}
								onEndReachedThreshold={0.5}
								onScroll={(event) => {
									const offsetY = event.nativeEvent.contentOffset.y;
									setShowScrollTop(offsetY > 100);
								}}
								scrollEventThrottle={16}
								keyboardShouldPersistTaps="handled"
								keyboardDismissMode="on-drag"
								ListEmptyComponent={() => (
									<View style={[styles.emptyWrapper, { height: '100%', marginTop: SPACING_H.xxxxl }]}>
										<FastImage source={emptyImage} style={styles.emptyImage} resizeMode="contain" />
										<Text style={styles.emptyText}>
											앗! 조건에 맞는 속담가 없어요.{'\n'}다른 검색어나 필터를 사용해보세요!
										</Text>
									</View>
								)}
								contentContainerStyle={styles.flatListCotent}
								renderItem={({ item, index }) => {
									return (
										<AnimatedListItem index={index}>
										<TouchableOpacity
											style={styles.itemBox}
											activeOpacity={0.8}
											onPress={() => {
												setSelectedProverb(item);
												setShowDetailModal(true);
											}}>
											<View style={styles.proverbBlock}>
												<View style={styles.badgeInlineRow}>
													<View style={styles.badgeGroup}>
														<View style={[styles.badge, { backgroundColor: getLevelColor(item.levelName) }]}>
															{getLevelIcon(item.level)}
															<Text style={styles.badgeText}>{item.levelName}</Text>
														</View>
														<View style={[styles.badge, { backgroundColor: getCategoryColor(item.category) }]}>
															{item?.category && getFieldIcon(item.category)}
															<Text style={styles.badgeText}>{item.category || '미지정'}</Text>
														</View>
													</View>

													{/* ✅ 즐겨찾기 아이콘 */}
													<TouchableOpacity
														onPress={(e) => {
															e.stopPropagation();
															handleToggleFavorite(item.id);
														}}
														hitSlop={HIT_SLOP}>
														<Icon
															name="star"
															solid={favoriteIds.includes(item.id)}
															size={scaledSize(18)}
															color={favoriteIds.includes(item.id) ? COLORS.gold : COLORS.borderDark}
														/>
													</TouchableOpacity>
												</View>

												<View style={styles.rowWithArrow}>
													<View style={{ flex: 1 }}>
														<Text style={styles.proverbTextMulti}>
															{item.proverb}
														</Text>
														<Text style={styles.listMeaningText}>- {item.longMeaning || item.meaning}</Text>
													</View>
													<Icon name="chevron-right" size={scaledSize(16)} color={COLORS.borderDark} />
												</View>
											</View>

											{Array.isArray(item.sameProverb) && item.sameProverb.filter((p) => p.trim()).length > 0 && (
												<View style={styles.sameProverbBox}>
													<View style={styles.sameProverbTitleRow}>
														<IconComponent type="FontAwesome6" name="equals" size={scaledSize(13)} color={COLORS.primary} />
														<Text style={styles.sameProverbTitle}>동의속담</Text>
													</View>
													{item.sameProverb
														.filter((p) => p.trim())
														.map((p, idx) => (
															<Text key={idx} style={styles.sameProverbText}>
																- {p}
															</Text>
														))}
												</View>
											)}
										</TouchableOpacity>
									</AnimatedListItem>
									);
								}}
							/>
						</View>

						{/* 스크롤 최상단 이동 버튼 - fade + scale 애니메이션 */}
						<Animated.View
							pointerEvents={showScrollTop ? 'auto' : 'none'}
							style={[styles.scrollTopButton, { opacity: scrollTopAnim, transform: [{ scale: scrollTopAnim }] }]}>
							<TouchableOpacity onPress={scrollToTop} activeOpacity={0.8} style={styles.scrollTopButtonInner}>
								<IconComponent type="fontawesome6" name="arrow-up" size={scaledSize(20)} color={COLORS.textWhite} />
							</TouchableOpacity>
						</Animated.View>

						<ProverbDetailModal
							visible={showDetailModal}
							proverb={selectedProverb}
							onClose={() => setShowDetailModal(false)}
							onFavoriteChange={() => {
								// ✅ 모달에서 즐겨찾기 변경 시 리스트 갱신
								loadFavorites(); // ✅ 즐겨찾기 로드
							}}
						/>
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
			<ToastView />
		</SafeAreaView>
	);
};

export default ProverbListScreen;

const styles = themedStyles(() => StyleSheet.create({
	dictionaryHero: {
		minHeight: scaleHeight(112),
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
	dictionaryHeroCopy: { flex: 1, paddingVertical: SPACING_H.lg, zIndex: 1 },
	dictionaryHeroTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: HERO.title, marginBottom: SPACING_H.xs },
	dictionaryHeroDescription: { fontSize: FONT_SIZES.sm, lineHeight: scaledSize(18), color: HERO.description },
	dictionaryHeroImage: { width: scaleWidth(132), height: scaleHeight(108), marginRight: scaleWidth(-4) },
	main: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	filterCard: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.sm,
		overflow: 'visible',
	},
	input: {
		flex: 1,
		height: scaleHeight(44),
		borderWidth: 1,
		borderColor: COLORS.borderDark,
		borderRadius: RADIUS.md,
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: 0,
		marginBottom: SPACING_H.md,
		textAlignVertical: 'center',
	},
	scrollTopButton: {
		position: 'absolute',
		right: SPACING_W.lg,
		bottom: SPACING_H.lg,
		backgroundColor: COLORS.secondary,
		width: scaleWidth(44),
		height: scaleWidth(44),
		borderRadius: scaleWidth(44) / 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scrollTopButtonInner: {
		flex: 1,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemBox: {
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.surfaceAlt,
	},
	badgeGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
	},
	badgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.sm,
		fontWeight: '600',
	},
	filterDropdownRow: {
		flexDirection: 'row',
		columnGap: SPACING_W.sm,
		marginBottom: SPACING_H.sm,
	},
	dropdownWrapper: {
		flex: 1,
	},
	dropdownWrapperLast: {
		flex: 1,
	},
	listCountWrapper: {
		marginTop: SPACING_H.xs,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	listCountText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		fontWeight: '500',
	},
	resetButton: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: COLORS.surfaceAlt,
		height: scaleHeight(44),
		width: scaleWidth(44),
		borderRadius: RADIUS.md,
	},
	emptyWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.xl,
	},
	emptyImage: {
		width: scaleWidth(200),
		height: scaleWidth(200),
		marginBottom: SPACING_H.xl,
	},
	emptyText: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.textSecondary,
		textAlign: 'center',
		lineHeight: scaledSize(24),
	},
	dropdownLevel: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.borderDark,
		borderRadius: RADIUS.md,
		height: scaleHeight(44),
		paddingHorizontal: SPACING_W.md,
	},
	dropdownField: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.borderDark,
		borderRadius: RADIUS.md,
		height: scaleHeight(44),
		paddingHorizontal: SPACING_W.md,
	},
	dropdownListLevel: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.borderDark,
		borderWidth: 1,
		borderRadius: RADIUS.md,
	},
	dropdownListField: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.borderDark,
		borderWidth: 1,
		borderRadius: RADIUS.md,
	},
	sameProverbBox: {
		marginTop: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
	},
	sameProverbTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		marginBottom: SPACING_H.xs,
	},
	sameProverbTitle: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.primary,
		fontWeight: '700',
	},
	sameProverbText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
		fontWeight: '400',
		lineHeight: scaledSize(20),
	},
	badgeInlineRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	proverbBlock: {
		marginBottom: 0,
	},
	proverbTextMulti: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
		lineHeight: scaledSize(24),
		marginBottom: SPACING_H.xs,
	},
	container: {
		zIndex: 10,
		paddingHorizontal: SPACING_W.lg,
		overflow: 'visible',
	},
	flatListCotent: {
		paddingTop: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		paddingBottom: SPACING_H.xxxxl,
	},
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
	},
	searchInputWrapper: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		marginBottom: SPACING_H.md,
	},
	searchIcon: {
		position: 'absolute',
		left: SPACING_W.md,
		zIndex: 1,
	},
	searchInput: {
		flex: 0,
		width: '100%',
		paddingLeft: SPACING_W.xxxxl,
		marginBottom: 0,
	},
	resetButtonInline: {
		backgroundColor: COLORS.surfaceAlt,
		width: scaleWidth(44),
		height: scaleHeight(44),
		borderRadius: RADIUS.md,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	listMeaningText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		lineHeight: scaledSize(21),
		marginTop: SPACING_H.xs,
	},
	rowWithArrow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		columnGap: SPACING_W.sm,
	},
	favoriteFilterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		columnGap: SPACING_W.xs,
	},
	favoriteFilterButtonActive: {
		backgroundColor: HERO.bg,
		borderColor: COLORS.gold,
	},
	favoriteFilterText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
		fontWeight: '600',
	},
	favoriteFilterTextActive: {
		color: COLORS.accentFlame,
	},
}));
