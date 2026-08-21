/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { matchesKeyword } from '@/utils/SearchUtils';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Keyboard,
	TouchableWithoutFeedback,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	RefreshControl,
	Modal,
	Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome6';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles, themedValue, getPickerTheme } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { getCategoryColor, getLevelColor } from './common/CommonProverbModule';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { useToast } from '@/hooks/useToast';
import BottomHomeButton from './common/BottomHomeButton';
import FavoriteAddModal from './modal/FavoriteAddModal';

// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const COMMON_ALL_OPTION = themedValue(() => ({
	label: '전체',
	value: '전체',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color={COLORS.textSecondary} />,
	labelStyle: { marginLeft: SPACING_W.xs, fontSize: FONT_SIZES.md },
}));

const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{ label: '초급', value: '초급', icon: () => <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(16)} color={getLevelColor('초급')} /> },
	{ label: '중급', value: '중급', icon: () => <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(16)} color={getLevelColor('중급')} /> },
	{ label: '고급', value: '고급', icon: () => <IconComponent type="FontAwesome6" name="tree" size={scaledSize(16)} color={getLevelColor('고급')} /> },
	{ label: '특급', value: '특급', icon: () => <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(16)} color={getLevelColor('특급')} /> },
];

/**
 * FlatList 아이템 fade + slide-up 진입 애니메이션 래퍼
 */
const AnimatedListItem = React.memo(({ children, index }: { children: React.ReactNode; index: number }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(scaleHeight(12))).current;

	useEffect(() => {
		// 처음 6개만 stagger, 이후는 즉시 표시 (스크롤 성능 보호)
		const delay = index < 6 ? index * 40 : 0;
		const anim = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay, useNativeDriver: true }),
			Animated.timing(translateY, { toValue: 0, duration: 250, delay, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, []);

	return <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>{children}</Animated.View>;
});

const FavoriteScreen = () => {
	const emptyFavoritesImage = require('@/assets/images/feature-states/empty-favorites.png');
	const emptySearchImage = require('@/assets/images/feature-states/empty-search.png');
	const flatListRef = useRef<FlatList>(null);
	const headerAnim = useRef(new Animated.Value(0)).current;

	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	const [allFavorites, setAllFavorites] = useState<MainDataType.Proverb[]>([]);
	const [filteredList, setFilteredList] = useState<MainDataType.Proverb[]>([]);
	const [keyword, setKeyword] = useState('');
	const [refreshing, setRefreshing] = useState(false);

	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	// 주요 CRUD 피드백은 공통 토스트 훅으로 통일한다.
	const { showToast, ToastView } = useToast();
	const [showAddModal, setShowAddModal] = useState(false);

	// ─── 다중 선택 모드 상태 ─────────────────────────────────
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

	// ─── 드롭다운 상태 ─────────────────────────────────────────
	const [fieldOpen, setFieldOpen] = useState(false);
	const [levelOpen, setLevelOpen] = useState(false);
	const [categoryValue, setCategoryValue] = useState('전체');
	const [levelValue, setLevelValue] = useState('전체');
	const [levelItems, setLevelItems] = useState(LEVEL_DROPDOWN_ITEMS);
	const [categoryItems, setCategoryItems] = useState<any[]>([COMMON_ALL_OPTION]);

	// 화면 진입 fade + slide-up
	useEffect(() => {
		const anim = Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true });
		anim.start();
		return () => anim.stop();
	}, []);

	// 카테고리 항목을 데이터에서 동적 구성
	useEffect(() => {
		const cats = ProverbServices.selectCategoryList();
		setCategoryItems([
			COMMON_ALL_OPTION,
			...cats.map((c) => ({
				label: c,
				value: c,
				icon: () => <IconComponent type="FontAwesome6" name="tag" size={scaledSize(16)} color={getCategoryColor(c)} />,
			})),
		]);
	}, []);

	// ─── 데이터 로드 ────────────────────────────────────────────
	const loadFavorites = async () => {
		const ids = await getFavorites();
		setFavoriteIds(ids);
		const list = ProverbServices.selectProverbList().filter((p) => ids.includes(p.id));
		setAllFavorites(list);
		applyFilters(keyword, categoryValue, levelValue, list);
	};

	const handleAddFavorites = async (ids: number[]) => {
		for (const id of ids) {
			await toggleFavorite(id);
		}
		showToast(`${ids.length}개를 즐겨찾기에 추가했습니다`);
		loadFavorites();
	};

	// ─── 통합 필터 적용 ─────────────────────────────────────────
	const applyFilters = (kw: string, category: string, level: string, base?: MainDataType.Proverb[]) => {
		const source = base ?? allFavorites;
		let filtered = [...source];

		if (kw.trim()) {
			// 초성 검색 지원
			filtered = filtered.filter((item) => matchesKeyword(kw, item.proverb, item.longMeaning, item.meaning));
		}
		if (category !== '전체') {
			filtered = filtered.filter((item) => item.category?.trim() === category);
		}
		if (level !== '전체') {
			filtered = filtered.filter((item) => item.levelName?.trim() === level);
		}
		setFilteredList(filtered);
	};

	useEffect(() => {
		applyFilters(keyword, categoryValue, levelValue);
	}, [keyword, categoryValue, levelValue, allFavorites]);

	useFocusEffect(
		useCallback(() => {
			setKeyword('');
			setCategoryValue('전체');
			setLevelValue('전체');
			setIsSelectionMode(false);
			setSelectedIds([]);
			// 열려 있던 드롭다운/키보드를 닫고 목록을 맨 위로 돌린다
			setFieldOpen(false);
			setLevelOpen(false);
			setShowDeleteConfirmModal(false);
			Keyboard.dismiss();
			flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
			loadFavorites();
		}, []),
	);

	const handleReset = () => {
		setFieldOpen(false);
		setLevelOpen(false);
		Keyboard.dismiss();
		setTimeout(() => {
			setKeyword('');
			setCategoryValue('전체');
			setLevelValue('전체');
		}, 50);
	};

	const handleToggleFavorite = async (id: number) => {
		await toggleFavorite(id);
		showToast('즐겨찾기에서 제거했습니다');
		loadFavorites();
	};

	useEffect(() => {
		if (filteredList.length > 0) {
			flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
		}
	}, [keyword, categoryValue, levelValue]);

	const enterSelectionMode = () => {
		setIsSelectionMode(true);
		setSelectedIds([]);
		setFieldOpen(false);
		setLevelOpen(false);
		Keyboard.dismiss();
		setKeyword('');
		setCategoryValue('전체');
		setLevelValue('전체');
	};

	const exitSelectionMode = () => {
		setIsSelectionMode(false);
		setSelectedIds([]);
	};

	const toggleSelection = (id: number) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
	};

	const handleSelectAll = () => {
		if (selectedIds.length === filteredList.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(filteredList.map((item) => item.id));
		}
	};

	const handleMultiDelete = async () => {
		for (const id of selectedIds) {
			await toggleFavorite(id);
		}
		const deletedCount = selectedIds.length;
		setShowDeleteConfirmModal(false);
		exitSelectionMode();
		showToast(`${deletedCount}개를 즐겨찾기에서 제거했습니다`);
		loadFavorites();
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadFavorites();
		setRefreshing(false);
	};

	const getLevelIcon = (levelName: string) => {
		const iconMap: Record<string, string> = {
			'초급': 'seedling',
			중급: 'leaf',
			고급: 'tree',
			특급: 'trophy',
		};
		return iconMap[levelName] ?? 'circle';
	};

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const isSelected = selectedIds.includes(item.id);

		return (
			<AnimatedListItem index={index}>
				<TouchableOpacity
					style={[styles.itemCard, isSelectionMode && isSelected && styles.itemCardSelected]}
					activeOpacity={0.8}
					onPress={() => {
						if (isSelectionMode) {
							toggleSelection(item.id);
						} else {
							setSelectedProverb(item);
							setShowDetailModal(true);
						}
					}}
					onLongPress={() => {
						if (!isSelectionMode) {
							enterSelectionMode();
							toggleSelection(item.id);
						}
					}}>
					<View style={styles.proverbBlock}>
						<View style={styles.badgeInlineRow}>
							<View style={styles.badgeGroup}>
								<View style={[styles.badge, { backgroundColor: getLevelColor(item.levelName) }]}>
									<IconComponent
										type="FontAwesome6"
										name={getLevelIcon(item.levelName)}
										size={scaledSize(14)}
										color={COLORS.textWhite}
									/>
									<Text style={styles.badgeText}>{item.levelName}</Text>
								</View>
								<View style={[styles.badge, { backgroundColor: getCategoryColor(item.category) }]}>
									<Text style={styles.badgeText}>{item.category || '미지정'}</Text>
								</View>
							</View>

							{isSelectionMode ? (
								<View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
									{isSelected && <Icon name="check" size={scaledSize(12)} color={COLORS.textWhite} />}
								</View>
							) : (
								<TouchableOpacity
									onPress={(e) => {
										e.stopPropagation();
										handleToggleFavorite(item.id);
									}}
									hitSlop={HIT_SLOP}>
									<Icon name="star" solid size={scaledSize(18)} color={COLORS.warning} />
								</TouchableOpacity>
							)}
						</View>

						<View style={styles.rowWithArrow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.proverbTextMulti}>{item.proverb}</Text>
								<Text style={styles.listMeaningText} numberOfLines={2}>
									- {item.longMeaning || item.meaning}
								</Text>
							</View>
							{!isSelectionMode && <Icon name="chevron-right" size={scaledSize(16)} color={COLORS.borderDark} />}
						</View>
					</View>
				</TouchableOpacity>
			</AnimatedListItem>
		);
	};

	const isAllSelected = filteredList.length > 0 && selectedIds.length === filteredList.length;

	return (
		<SafeAreaView style={styles.main} edges={['top', 'bottom']}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={{ flex: 1 }}>
						<Animated.View
							style={[
								styles.filterContainer,
								{
									opacity: headerAnim,
									transform: [
										{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) },
									],
								},
							]}>
							<View style={styles.filterCard}>
								<View style={styles.headerTopRow}>
									<View style={styles.headerTitleRow}>
										{allFavorites.length > 0 && (
											<FastImage source={require('@/assets/images/screen-heroes/favorites-collection.png')} style={styles.favoriteHeroImage} resizeMode="contain" />
										)}
										<Text style={styles.headerTitle}>즐겨찾기</Text>
									</View>

									{!isSelectionMode ? (
										<View style={styles.headerActions}>
											<TouchableOpacity
												style={styles.headerActionBtn}
												onPress={() => setShowAddModal(true)}
												hitSlop={HIT_SLOP}>
												<Icon name="plus" size={scaledSize(14)} color={COLORS.warning} />
												<Text style={styles.headerActionText}>추가</Text>
											</TouchableOpacity>
											{allFavorites.length > 0 && (
												<TouchableOpacity
													style={[styles.headerActionBtn, styles.headerActionBtnDelete]}
													onPress={enterSelectionMode}
													hitSlop={HIT_SLOP}>
													<Icon name="trash-can" size={scaledSize(13)} color={COLORS.danger} />
													<Text style={styles.headerActionTextDelete}>선택 삭제</Text>
												</TouchableOpacity>
											)}
										</View>
									) : (
										<TouchableOpacity
											style={styles.cancelBtn}
											onPress={exitSelectionMode}
											hitSlop={HIT_SLOP}>
											<Text style={styles.cancelBtnText}>취소</Text>
										</TouchableOpacity>
									)}
								</View>

								<View style={styles.searchRow}>
									<View style={styles.searchBox}>
										<Icon name="magnifying-glass" size={scaledSize(15)} color={COLORS.textLight} style={styles.searchIcon} />
										<TextInput
											style={styles.searchInput}
											placeholder="속담·의미 또는 초성(ㄱㄴㄷ) 검색"
											placeholderTextColor={COLORS.textLight}
											value={keyword}
											onChangeText={(text) => {
												setKeyword(text);
												setFieldOpen(false);
												setLevelOpen(false);
											}}
										/>
									</View>
									<TouchableOpacity style={styles.resetButtonInline} onPress={handleReset}>
										<Icon name="rotate-right" size={scaledSize(16)} color={COLORS.textSecondary} />
									</TouchableOpacity>
								</View>

								<View style={styles.filterDropdownRow}>
									<View style={[styles.dropdownWrapper, { zIndex: levelOpen ? 3000 : 1000 }]}>
										<DropDownPicker
											theme={getPickerTheme()}
											open={levelOpen}
											value={levelValue}
											items={levelItems}
											setOpen={setLevelOpen}
											setValue={setLevelValue}
											setItems={setLevelItems}
											style={styles.dropdownLevel}
											scrollViewProps={{ nestedScrollEnabled: true }}
											dropDownContainerStyle={{ ...styles.dropdownListLevel, overflow: 'visible', zIndex: 3000 }}
											listItemLabelStyle={{ marginLeft: SPACING_W.xs, fontSize: FONT_SIZES.md }}
											labelStyle={{ fontSize: FONT_SIZES.md, color: COLORS.text }}
											iconContainerStyle={{ marginRight: SPACING_W.sm }}
											showArrowIcon={true}
											showTickIcon={false}
										/>
									</View>
									<View style={[styles.dropdownWrapperLast, { zIndex: fieldOpen ? 3000 : 1000, overflow: 'visible' }]}>
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
											dropDownContainerStyle={{ overflow: 'visible', zIndex: 3000, ...styles.dropdownListField, maxHeight: scaleHeight(200) }}
											zIndex={5000}
											zIndexInverse={4000}
											containerStyle={{ zIndex: 5000 }}
											labelStyle={{ fontSize: FONT_SIZES.md, color: COLORS.text }}
											iconContainerStyle={{ marginRight: SPACING_W.sm }}
											showArrowIcon={true}
											showTickIcon={false}
											modalProps={{ animationType: 'fade', presentationStyle: 'overFullScreen', transparent: true }}
											modalContentContainerStyle={{
												marginTop: '25%',
												width: '85%',
												alignSelf: 'center',
												maxHeight: scaleHeight(500),
												backgroundColor: COLORS.surface,
												borderWidth: 1,
												borderColor: COLORS.borderDark,
												borderRadius: RADIUS.xl,
												paddingVertical: SPACING_H.xl,
											}}
											modalTitleStyle={{
												fontSize: FONT_SIZES.lg,
												fontWeight: '700',
												color: COLORS.text,
												textAlign: 'center',
												paddingVertical: SPACING_H.md,
												paddingHorizontal: SPACING_W.lg,
											}}
										/>
									</View>
								</View>

								<View style={styles.listCountWrapper}>
									{isSelectionMode && filteredList.length > 0 && (
										<TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
											<View style={[styles.miniCheckbox, isAllSelected && styles.miniCheckboxChecked]}>
												{isAllSelected && <Icon name="check" size={scaledSize(9)} color={COLORS.textWhite} />}
											</View>
											<Text style={styles.selectAllText}>전체 선택</Text>
										</TouchableOpacity>
									)}
								</View>

								<View style={styles.resultSummaryRow}>
									{!isSelectionMode ? (
										<Text style={styles.headerSubText}>
											총 <Text style={styles.headerCount}>{allFavorites.length}</Text>개가 저장되었습니다!
										</Text>
									) : (
										<Text style={styles.headerSubText}>
											<Text style={styles.headerCountDelete}>{selectedIds.length}</Text>개 선택됨
										</Text>
									)}
								</View>
							</View>
						</Animated.View>

						<FlatList
							ref={flatListRef}
							data={filteredList}
							scrollEnabled={!fieldOpen && !levelOpen}
							keyExtractor={(item) => item.id.toString()}
							renderItem={renderItem}
							contentContainerStyle={[styles.listContent, isSelectionMode && { paddingBottom: scaleHeight(120) }]}
							keyboardShouldPersistTaps="handled"
							keyboardDismissMode="on-drag"
							refreshControl={<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
									tintColor={COLORS.textSecondary}
									colors={[COLORS.primary]}
									progressBackgroundColor={COLORS.surface}
								/>}
							ListEmptyComponent={() => (
								<View style={styles.emptyWrapper}>
									{allFavorites.length === 0 ? (
										<>
											<FastImage source={emptyFavoritesImage} style={styles.emptyImage} resizeMode="contain" />
											<Text style={styles.emptyTitle}>아직 즐겨찾기가 없습니다</Text>
											<Text style={styles.emptyDesc}>속담 목록에서 ★를 눌러{'\n'}원하는 속담을 저장해보세요!</Text>
											<TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
												<Icon name="plus" size={scaledSize(14)} color={COLORS.textWhite} />
												<Text style={styles.emptyAddBtnText}>즐겨찾기 추가하기</Text>
											</TouchableOpacity>
										</>
									) : (
										<>
											<FastImage source={emptySearchImage} style={styles.emptyImage} resizeMode="contain" />
											<Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
											<Text style={styles.emptyDesc}>다른 검색어나 필터를 사용해보세요</Text>
										</>
									)}
								</View>
							)}
						/>

						{isSelectionMode && (
							<View style={styles.bottomActionBar}>
								<TouchableOpacity
									style={[styles.deleteActionBtn, selectedIds.length === 0 && styles.deleteActionBtnDisabled]}
									disabled={selectedIds.length === 0}
									onPress={() => setShowDeleteConfirmModal(true)}
									activeOpacity={0.85}>
									<Icon name="trash-can" size={scaledSize(16)} color={COLORS.textWhite} />
									<Text style={styles.deleteActionBtnText}>
										{selectedIds.length > 0 ? `${selectedIds.length}개 삭제` : '항목을 선택해주세요'}
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>

			<FavoriteAddModal visible={showAddModal} existingIds={favoriteIds} onClose={() => setShowAddModal(false)} onAdd={handleAddFavorites} />
			<ProverbDetailModal visible={showDetailModal && !!selectedProverb} proverb={selectedProverb} onClose={() => setShowDetailModal(false)} onFavoriteChange={loadFavorites} />

			<Modal visible={showDeleteConfirmModal} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirmModal(false)}>
				<View style={styles.confirmOverlay}>
					<View style={styles.confirmBox}>
						<View style={styles.confirmIconWrapper}>
							<Icon name="triangle-exclamation" size={scaledSize(28)} color={COLORS.danger} />
						</View>
						<Text style={styles.confirmTitle}>정말 삭제하시겠습니까?</Text>
						<Text style={styles.confirmDesc}>
							선택한 <Text style={styles.confirmCount}>{selectedIds.length}</Text>개의 속담을{'\n'}
							즐겨찾기에서 제거합니다.
						</Text>
						<View style={styles.confirmBtnRow}>
							<TouchableOpacity style={[styles.confirmBtn, styles.confirmBtnCancel]} onPress={() => setShowDeleteConfirmModal(false)} activeOpacity={0.85}>
								<Text style={styles.confirmBtnCancelText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.confirmBtn, styles.confirmBtnDelete]} onPress={handleMultiDelete} activeOpacity={0.85}>
								<Text style={styles.confirmBtnDeleteText}>삭제</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<ToastView />
			{!isSelectionMode && <BottomHomeButton skipConfirm />}
		</SafeAreaView>
	);
};

export default FavoriteScreen;

const styles = themedStyles(() => StyleSheet.create({
	main: { flex: 1, backgroundColor: COLORS.background },
	headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING_H.md },
	headerTitleRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm },
	favoriteHeroImage: { width: scaleWidth(70), height: scaleHeight(58) },
	headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.textStrong, letterSpacing: -0.3 },
	headerSubText: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, textAlign: 'right' },
	headerCount: { fontWeight: '700', color: COLORS.warning, fontSize: FONT_SIZES.smPlus },
	headerCountDelete: { fontWeight: '700', color: COLORS.danger, fontSize: FONT_SIZES.smPlus },
	headerActions: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm },
	headerActionBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.warningSoft,
		borderWidth: 1,
		borderColor: COLORS.warningBorder,
	},
	headerActionText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.warning },
	headerActionBtnDelete: { backgroundColor: COLORS.dangerBg, borderColor: COLORS.dangerBorder },
	headerActionTextDelete: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.danger },
	cancelBtn: {
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surfaceAlt,
	},
	cancelBtnText: { fontSize: FONT_SIZES.smPlus, fontWeight: '600', color: COLORS.textSecondary },
	filterContainer: { zIndex: 10, paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, overflow: 'visible' },
	resultSummaryRow: { paddingTop: SPACING_H.xs, alignItems: 'flex-end' },
	filterCard: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.md,
		overflow: 'visible',
	},
	searchRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm, marginBottom: SPACING_H.md },
	searchBox: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
		height: scaleHeight(44),
	},
	searchIcon: { marginRight: SPACING_W.sm },
	searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: 0 },
	resetButtonInline: {
		backgroundColor: COLORS.surfaceAlt,
		width: scaleWidth(44),
		height: scaleHeight(44),
		borderRadius: RADIUS.md,
		justifyContent: 'center',
		alignItems: 'center',
	},
	filterDropdownRow: { flexDirection: 'row', columnGap: SPACING_W.sm, marginBottom: SPACING_H.sm },
	dropdownWrapper: { flex: 1 },
	dropdownWrapperLast: { flex: 1 },
	dropdownLevel: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.borderDark,
		borderRadius: RADIUS.md,
		height: scaleHeight(44),
		minHeight: scaleHeight(44),
		paddingHorizontal: SPACING_W.md,
	},
	dropdownField: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.borderDark,
		borderRadius: RADIUS.md,
		height: scaleHeight(44),
		minHeight: scaleHeight(44),
		paddingHorizontal: SPACING_W.md,
	},
	dropdownListLevel: { backgroundColor: COLORS.surface, borderColor: COLORS.borderDark, borderWidth: 1, borderRadius: RADIUS.md },
	dropdownListField: { backgroundColor: COLORS.surface, borderColor: COLORS.borderDark, borderWidth: 1, borderRadius: RADIUS.md },
	listCountWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	selectAllBtn: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm, paddingVertical: SPACING_H.xs },
	selectAllText: { fontSize: FONT_SIZES.smPlus, color: COLORS.text, fontWeight: '600' },
	miniCheckbox: {
		width: scaleWidth(18),
		height: scaleWidth(18),
		borderRadius: RADIUS.sm / 2,
		borderWidth: 1.5,
		borderColor: COLORS.textLight,
		backgroundColor: COLORS.surface,
		justifyContent: 'center',
		alignItems: 'center',
	},
	miniCheckboxChecked: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
	listContent: { paddingTop: SPACING_H.xs, paddingHorizontal: SPACING_W.lg, paddingBottom: SPACING_H.xxxxl, flexGrow: 1 },
	itemCard: {
		backgroundColor: COLORS.surface,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.surfaceAlt,
	},
	itemCardSelected: { borderColor: COLORS.warning, backgroundColor: COLORS.warningSoft },
	badgeGroup: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.xs },
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	badgeText: { color: COLORS.textWhite, fontSize: FONT_SIZES.sm, fontWeight: '600' },
	badgeInlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING_H.sm },
	proverbBlock: { marginBottom: 0 },
	proverbTextMulti: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textStrong,
		lineHeight: scaledSize(24),
		marginBottom: SPACING_H.xs,
	},
	listMeaningText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, lineHeight: scaledSize(21), marginTop: SPACING_H.xs },
	rowWithArrow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: SPACING_W.sm },
	checkbox: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: RADIUS.sm,
		borderWidth: 2,
		borderColor: COLORS.borderDark,
		backgroundColor: COLORS.surface,
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxChecked: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
	emptyWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING_W.xl, paddingTop: SPACING_H.xxxxl },
	emptyImage: { width: scaleWidth(160), height: scaleWidth(160), marginBottom: SPACING_H.lg },
	emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong, marginBottom: SPACING_H.sm },
	emptyDesc: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, textAlign: 'center', lineHeight: scaledSize(20) },
	emptyAddBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		marginTop: SPACING_H.xl,
		paddingHorizontal: SPACING_W.xl,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.warning,
	},
	emptyAddBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.md, fontWeight: '700' },
	bottomActionBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.md,
		paddingBottom: SPACING_H.xl,
		borderTopWidth: 1,
		borderTopColor: COLORS.surfaceAlt,
	},
	deleteActionBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		height: scaleHeight(52),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.danger,
	},
	deleteActionBtnDisabled: { backgroundColor: COLORS.borderDark },
	deleteActionBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.lg, fontWeight: '700' },
	confirmOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.xxxl,
	},
	confirmBox: {
		width: '100%',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		paddingTop: SPACING_H.xxl,
		paddingBottom: SPACING_H.lg,
		paddingHorizontal: SPACING_W.xl,
		alignItems: 'center',
	},
	confirmIconWrapper: {
		width: scaleWidth(60),
		height: scaleWidth(60),
		borderRadius: scaleWidth(60) / 2,
		backgroundColor: COLORS.dangerBg,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	confirmTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textStrong, marginBottom: SPACING_H.sm },
	confirmDesc: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		textAlign: 'center',
		lineHeight: scaledSize(21),
		marginBottom: SPACING_H.xl,
	},
	confirmCount: { fontWeight: '700', color: COLORS.danger },
	confirmBtnRow: { flexDirection: 'row', width: '100%', columnGap: SPACING_W.md },
	confirmBtn: { flex: 1, height: scaleHeight(48), borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
	confirmBtnCancel: { backgroundColor: COLORS.surfaceAlt },
	confirmBtnCancelText: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.textSecondary },
	confirmBtnDelete: { backgroundColor: COLORS.danger },
	confirmBtnDeleteText: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.textWhite },
}));
