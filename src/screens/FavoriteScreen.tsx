/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, FlatList, KeyboardAvoidingView, Platform, RefreshControl, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome6';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';
import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import ProverbDetailModal from './modal/ProverbDetailModal';
import FavoriteToast from './common/FavoriteToast';
import BottomHomeButton from './common/BottomHomeButton';
import FavoriteAddModal from './modal/FavoriteAddModal';

const LEVEL_NAME_MAP: Record<number, string> = { 1: '아주 쉬움', 2: '쉬움', 3: '보통', 4: '어려움' };
const LEVEL_COLOR_MAP: Record<number, string> = { 1: '#2ecc71', 2: '#F4D03F', 3: '#EB984E', 4: '#E74C3C' };
const LEVEL_ICON_MAP: Record<number, string> = { 1: 'seedling', 2: 'leaf', 3: 'tree', 4: 'trophy' };
const CATEGORY_COLOR_MAP: Record<string, string> = {
	'운/우연': '#00cec9',
	인간관계: '#6c5ce7',
	'세상 이치': '#fdcb6e',
	'근면/검소': '#e17055',
	'노력/성공': '#00b894',
	'경계/조심': '#d63031',
	'욕심/탐욕': '#e84393',
	'배신/불신': '#2d3436',
};

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color="#64748B" />,
	labelStyle: { marginLeft: scaleWidth(6), fontSize: scaledSize(14) },
};

const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{ label: '아주 쉬움', value: '아주 쉬움', icon: () => <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(16)} color="#85C1E9" /> },
	{ label: '쉬움', value: '쉬움', icon: () => <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(16)} color="#F4D03F" /> },
	{ label: '보통', value: '보통', icon: () => <IconComponent type="FontAwesome6" name="tree" size={scaledSize(16)} color="#EB984E" /> },
	{ label: '어려움', value: '어려움', icon: () => <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(16)} color="#E74C3C" /> },
];

const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{ label: '운/우연', value: '운/우연', iconType: 'FontAwesome6', iconName: 'dice', iconColor: '#81ecec', icon: () => <IconComponent type="FontAwesome6" name="dice" size={scaledSize(16)} color="#81ecec" /> },
	{ label: '인간관계', value: '인간관계', iconType: 'FontAwesome6', iconName: 'users', iconColor: '#a29bfe', icon: () => <IconComponent type="FontAwesome6" name="users" size={scaledSize(16)} color="#a29bfe" /> },
	{ label: '세상 이치', value: '세상 이치', iconType: 'fontawesome5', iconName: 'globe', iconColor: '#fdcb6e', icon: () => <IconComponent type="fontawesome5" name="globe" size={scaledSize(16)} color="#fdcb6e" /> },
	{ label: '근면/검소', value: '근면/검소', iconType: 'fontawesome5', iconName: 'hammer', iconColor: '#fab1a0', icon: () => <IconComponent type="fontawesome5" name="hammer" size={scaledSize(16)} color="#fab1a0" /> },
	{ label: '노력/성공', value: '노력/성공', iconType: 'fontawesome5', iconName: 'medal', iconColor: '#55efc4', icon: () => <IconComponent type="fontawesome5" name="medal" size={scaledSize(16)} color="#55efc4" /> },
	{ label: '경계/조심', value: '경계/조심', iconType: 'fontawesome5', iconName: 'exclamation-triangle', iconColor: '#ff7675', icon: () => <IconComponent type="fontawesome5" name="exclamation-triangle" size={scaledSize(16)} color="#ff7675" /> },
	{ label: '욕심/탐욕', value: '욕심/탐욕', iconType: 'fontawesome5', iconName: 'hand-holding-usd', iconColor: '#fd79a8', icon: () => <IconComponent type="fontawesome5" name="hand-holding-usd" size={scaledSize(16)} color="#fd79a8" /> },
	{ label: '배신/불신', value: '배신/불신', iconType: 'fontawesome5', iconName: 'user-slash', iconColor: '#b2bec3', icon: () => <IconComponent type="fontawesome5" name="user-slash" size={scaledSize(16)} color="#b2bec3" /> },
];

const FavoriteScreen = () => {
	const emptyImage = require('@/assets/images/no-data.png');
	const flatListRef = useRef<FlatList>(null);

	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	const [allFavorites, setAllFavorites] = useState<MainDataType.Proverb[]>([]);
	const [filteredList, setFilteredList] = useState<MainDataType.Proverb[]>([]);
	const [keyword, setKeyword] = useState('');
	const [refreshing, setRefreshing] = useState(false);

	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);

	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

	const [fieldOpen, setFieldOpen] = useState(false);
	const [levelOpen, setLevelOpen] = useState(false);
	const [categoryValue, setCategoryValue] = useState('전체');
	const [levelValue, setLevelValue] = useState('전체');
	const [levelItems, setLevelItems] = useState(LEVEL_DROPDOWN_ITEMS);
	const [categoryItems, setCategoryItems] = useState(FIELD_DROPDOWN_ITEMS);

	const loadFavorites = async () => {
		const ids = await getFavorites();
		setFavoriteIds(ids);
		const list = CONST_MAIN_DATA.PROVERB.filter((p) => ids.includes(p.id));
		setAllFavorites(list);
		applyFilters(keyword, categoryValue, levelValue, list);
	};

	const handleAddFavorites = async (ids: number[]) => {
		for (const id of ids) {
			await toggleFavorite(id);
		}
		setToastMessage(`${ids.length}개를 즐겨찾기에 추가했어요`);
		setShowToast(true);
		loadFavorites();
	};

	const applyFilters = (kw: string, category: string, level: string, base?: MainDataType.Proverb[]) => {
		const source = base ?? allFavorites;
		let filtered = [...source];

		if (kw.trim()) {
			const lower = kw.toLowerCase();
			filtered = filtered.filter((item) => item.proverb?.toLowerCase().includes(lower) || item.meaning?.toLowerCase().includes(lower) || item.longMeaning?.toLowerCase().includes(lower));
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
		setToastMessage('즐겨찾기에서 제거됐어요');
		setShowToast(true);
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
		setToastMessage(`${deletedCount}개를 즐겨찾기에서 제거했어요`);
		setShowToast(true);
		loadFavorites();
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadFavorites();
		setRefreshing(false);
	};

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const isLast = index === filteredList.length - 1;
		const isSelected = selectedIds.includes(item.id);
		const matchedItem = FIELD_DROPDOWN_ITEMS.find((i) => i.value === item.category) as { iconType?: string; iconName?: string } | undefined;

		return (
			<TouchableOpacity
				style={[styles.itemCard, { marginBottom: isLast ? scaleHeight(24) : scaleHeight(12) }, isSelectionMode && isSelected && styles.itemCardSelected]}
				activeOpacity={0.75}
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
						<View style={{ flexDirection: 'row', gap: scaleWidth(6) }}>
							<View style={[styles.levelBadge, { backgroundColor: LEVEL_COLOR_MAP[item.level] ?? '#b2bec3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(4) }]}>
								<IconComponent type="FontAwesome6" name={LEVEL_ICON_MAP[item.level] ?? 'circle'} size={scaledSize(14)} color="#fff" />
								<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>{LEVEL_NAME_MAP[item.level] ?? item.levelName}</Text>
							</View>
							<View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLOR_MAP[item.category] ?? '#b2bec3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleWidth(8) }]}>
								{matchedItem?.iconType && matchedItem?.iconName && <IconComponent type={matchedItem.iconType} name={matchedItem.iconName} size={scaledSize(14)} color="#fff" />}
								<Text style={[styles.badgeText, { marginLeft: scaleWidth(4) }]}>{item.category || '미지정'}</Text>
							</View>
						</View>

						{isSelectionMode ? (
							<View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>{isSelected && <Icon name="check" size={scaledSize(12)} color="#fff" />}</View>
						) : (
							<TouchableOpacity
								onPress={(e) => {
									e.stopPropagation();
									handleToggleFavorite(item.id);
								}}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
								<Icon name="star" solid size={scaledSize(18)} color="#F59E0B" />
							</TouchableOpacity>
						)}
					</View>

					<View style={styles.rowWithArrow}>
						<View style={{ flex: 1 }}>
							<Text style={styles.proverbTextMulti}>{item.proverb}</Text>
							<Text style={styles.listMeaningText} numberOfLines={2}>
								- {item.meaning}
							</Text>
						</View>
						{!isSelectionMode && <Icon name="chevron-right" size={scaledSize(16)} color="#CBD5E1" />}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	const isAllSelected = filteredList.length > 0 && selectedIds.length === filteredList.length;

	return (
		<SafeAreaView style={styles.main} edges={['top', 'bottom']}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={{ flex: 1 }}>
						<View style={styles.filterContainer}>
							<View style={styles.filterCard}>
								<View style={styles.headerTopRow}>
									<View style={styles.headerTitleRow}>
										<Text style={styles.headerTitle}>즐겨찾기</Text>
									</View>

									{!isSelectionMode ? (
										<View style={styles.headerActions}>
											<TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowAddModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
												<Icon name="plus" size={scaledSize(14)} color="#F59E0B" />
												<Text style={styles.headerActionText}>추가</Text>
											</TouchableOpacity>
											{allFavorites.length > 0 && (
												<TouchableOpacity style={[styles.headerActionBtn, styles.headerActionBtnDelete]} onPress={enterSelectionMode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
													<Icon name="trash-can" size={scaledSize(13)} color="#EF4444" />
													<Text style={styles.headerActionTextDelete}>선택 삭제</Text>
												</TouchableOpacity>
											)}
										</View>
									) : (
										<TouchableOpacity style={styles.cancelBtn} onPress={exitSelectionMode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
											<Text style={styles.cancelBtnText}>취소</Text>
										</TouchableOpacity>
									)}
								</View>

								<View style={styles.searchRow}>
									<View style={styles.searchBox}>
										<Icon name="magnifying-glass" size={scaledSize(15)} color="#94A3B8" style={styles.searchIcon} />
										<TextInput
											style={styles.searchInput}
											placeholder="속담이나 의미를 입력해주세요"
											placeholderTextColor="#94A3B8"
											value={keyword}
											onChangeText={(text) => {
												setKeyword(text);
												setFieldOpen(false);
												setLevelOpen(false);
											}}
										/>
									</View>
									<TouchableOpacity style={styles.resetButtonInline} onPress={handleReset}>
										<Icon name="rotate-right" size={scaledSize(16)} color="#64748B" />
									</TouchableOpacity>
								</View>

								<View style={styles.filterDropdownRow}>
									<View style={[styles.dropdownWrapper, { zIndex: fieldOpen ? 2000 : 1000 }]}>
										<DropDownPicker
											open={levelOpen}
											value={levelValue}
											items={levelItems}
											setOpen={setLevelOpen}
											setValue={setLevelValue}
											setItems={setLevelItems}
											style={styles.dropdownLevel}
											scrollViewProps={{ nestedScrollEnabled: true }}
											dropDownContainerStyle={{ ...styles.dropdownListLevel, overflow: 'visible', zIndex: 3000 }}
											listItemLabelStyle={{ marginLeft: scaleWidth(6), fontSize: scaledSize(14) }}
											labelStyle={{ fontSize: scaledSize(14), color: '#334155' }}
											iconContainerStyle={{ marginRight: scaleWidth(8) }}
											showArrowIcon={true}
											showTickIcon={false}
										/>
									</View>
									<View style={[styles.dropdownWrapperLast, { zIndex: levelOpen ? 2000 : 1000, overflow: 'visible' }]}>
										<DropDownPicker
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
											labelStyle={{ fontSize: scaledSize(14), color: '#334155' }}
											iconContainerStyle={{ marginRight: scaleWidth(8) }}
											showArrowIcon={true}
											showTickIcon={false}
											renderListItem={({ item, onPress }) => (
												<TouchableOpacity
													//@ts-ignore
													onPress={() => onPress(item)}
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														paddingVertical: scaleHeight(14),
														paddingHorizontal: scaleWidth(16),
														borderBottomWidth: 1,
														borderBottomColor: '#F1F5F9',
													}}>
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: scaleWidth(12) }}>{typeof item.icon === 'function' ? item.icon() : item.icon}</View>
													<Text style={{ fontSize: scaledSize(15), color: '#334155', flex: 1 }}>{item.label}</Text>
												</TouchableOpacity>
											)}
											modalProps={{ animationType: 'fade', presentationStyle: 'overFullScreen', transparent: true }}
											modalContentContainerStyle={{
												marginTop: '25%',
												width: '85%',
												alignSelf: 'center',
												maxHeight: scaleHeight(500),
												backgroundColor: '#fff',
												borderWidth: 1,
												borderColor: '#CBD5E1',
												borderRadius: scaleWidth(20),
												paddingHorizontal: 0,
												paddingVertical: scaleHeight(20),
												shadowColor: '#000',
												shadowOpacity: 0.15,
												shadowOffset: { width: 0, height: 6 },
												shadowRadius: scaleWidth(8),
												position: 'relative',
											}}
											modalTitleStyle={{
												fontSize: scaledSize(16),
												fontWeight: 'bold',
												color: '#334155',
												textAlign: 'center',
												paddingVertical: scaleHeight(12),
												paddingHorizontal: scaleWidth(16),
												paddingRight: scaleWidth(40),
											}}
											closeIconStyle={{ marginTop: scaleHeight(3), width: scaleWidth(24), height: scaleWidth(24) }}
											closeIconContainerStyle={{ position: 'absolute', right: scaleWidth(12), top: scaleHeight(12), padding: scaleWidth(4), zIndex: 1 }}
										/>
									</View>
								</View>

								<View style={styles.listCountWrapper}>
									{isSelectionMode && filteredList.length > 0 && (
										<TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
											<View style={[styles.miniCheckbox, isAllSelected && styles.miniCheckboxChecked]}>{isAllSelected && <Icon name="check" size={scaledSize(9)} color="#fff" />}</View>
											<Text style={styles.selectAllText}>전체 선택</Text>
										</TouchableOpacity>
									)}
								</View>

								<View style={styles.resultSummaryRow}>
									{!isSelectionMode ? (
										<Text style={styles.headerSubText}>
											총 <Text style={styles.headerCount}>{allFavorites.length}</Text>개가 저장되었어요!
										</Text>
									) : (
										<Text style={styles.headerSubText}>
											<Text style={styles.headerCountDelete}>{selectedIds.length}</Text>개 선택됨
										</Text>
									)}
								</View>
							</View>
						</View>

						<FlatList
							ref={flatListRef}
							data={filteredList}
							scrollEnabled={!fieldOpen && !levelOpen}
							keyExtractor={(item) => item.id.toString()}
							renderItem={renderItem}
							contentContainerStyle={[styles.listContent, isSelectionMode && { paddingBottom: scaleHeight(120) }]}
							keyboardShouldPersistTaps="handled"
							refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
							ListEmptyComponent={() => (
								<View style={styles.emptyWrapper}>
									{allFavorites.length === 0 ? (
										<>
											<FastImage source={emptyImage} style={styles.emptyImage} resizeMode="contain" />
											<Text style={styles.emptyTitle}>아직 즐겨찾기가 없어요</Text>
											<Text style={styles.emptyDesc}>속담 목록에서 ★를 눌러{'\n'}원하는 속담을 저장해보세요!</Text>
											<TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
												<Icon name="plus" size={scaledSize(14)} color="#fff" />
												<Text style={styles.emptyAddBtnText}>즐겨찾기 추가하기</Text>
											</TouchableOpacity>
										</>
									) : (
										<>
											<FastImage source={emptyImage} style={styles.emptyImage} resizeMode="contain" />
											<Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
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
									<Icon name="trash-can" size={scaledSize(16)} color="#fff" />
									<Text style={styles.deleteActionBtnText}>{selectedIds.length > 0 ? `${selectedIds.length}개 삭제` : '항목을 선택해주세요'}</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>

			<FavoriteAddModal visible={showAddModal} existingIds={favoriteIds} onClose={() => setShowAddModal(false)} onAdd={handleAddFavorites} />
			<ProverbDetailModal visible={showDetailModal} proverb={selectedProverb} onClose={() => setShowDetailModal(false)} onFavoriteChange={loadFavorites} />

			<Modal visible={showDeleteConfirmModal} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirmModal(false)}>
				<View style={styles.confirmOverlay}>
					<View style={styles.confirmBox}>
						<View style={styles.confirmIconWrapper}>
							<Icon name="triangle-exclamation" size={scaledSize(28)} color="#EF4444" />
						</View>
						<Text style={styles.confirmTitle}>정말 삭제하시겠어요?</Text>
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

			<FavoriteToast visible={showToast} message={toastMessage} onHide={() => setShowToast(false)} />
			{!isSelectionMode && <BottomHomeButton />}
		</SafeAreaView>
	);
};

export default FavoriteScreen;

const styles = StyleSheet.create({
	main: { flex: 1, backgroundColor: '#F8FAFC' },
	headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: scaleHeight(6), marginBottom: scaleHeight(14) },
	headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) },
	headerTitle: { fontSize: scaledSize(20), fontWeight: '800', color: '#334155', letterSpacing: -0.3 },
	headerSubText: { fontSize: scaledSize(13), color: '#64748B', textAlign: 'right' },
	headerCount: { fontWeight: '700', color: '#F59E0B', fontSize: scaledSize(13) },
	headerCountDelete: { fontWeight: '700', color: '#EF4444', fontSize: scaledSize(13) },
	headerActions: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6) },
	headerActionBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(8),
		backgroundColor: '#FFFBEB',
		borderWidth: 1,
		borderColor: '#FDE68A',
	},
	headerActionText: { fontSize: scaledSize(12), fontWeight: '700', color: '#F59E0B' },
	headerActionBtnDelete: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
	headerActionTextDelete: { fontSize: scaledSize(12), fontWeight: '700', color: '#EF4444' },
	cancelBtn: { paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(6), borderRadius: scaleWidth(8), backgroundColor: '#F1F5F9' },
	cancelBtnText: { fontSize: scaledSize(13), fontWeight: '600', color: '#64748B' },
	filterContainer: { zIndex: 10, paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(12), overflow: 'visible' },
	resultSummaryRow: { marginTop: scaleHeight(10), paddingTop: scaleHeight(4), alignItems: 'flex-end' },
	filterCard: {
		backgroundColor: '#fff',
		padding: scaleWidth(12),
		borderRadius: scaleWidth(16),
		marginBottom: scaleHeight(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(8),
		overflow: 'visible',
	},
	searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(10) },
	searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: scaleWidth(10), paddingHorizontal: scaleWidth(12), height: scaleHeight(40) },
	searchIcon: { marginRight: scaleWidth(8) },
	searchInput: { flex: 1, fontSize: scaledSize(14), color: '#334155', paddingVertical: 0 },
	resetButtonInline: { marginLeft: scaleWidth(8), backgroundColor: '#F1F5F9', paddingHorizontal: scaleWidth(12), height: scaleHeight(40), borderRadius: scaleWidth(8), justifyContent: 'center', alignItems: 'center' },
	filterDropdownRow: { flexDirection: 'row', marginBottom: scaleHeight(8) },
	dropdownWrapper: { flex: 1, marginRight: scaleWidth(6) },
	dropdownWrapperLast: { flex: 1, marginLeft: scaleWidth(6) },
	dropdownLevel: { backgroundColor: '#fff', borderColor: '#CBD5E1', height: scaleHeight(40), paddingHorizontal: scaleWidth(12) },
	dropdownField: { backgroundColor: '#fff', borderColor: '#CBD5E1', height: scaleHeight(40), paddingHorizontal: scaleWidth(12) },
	dropdownListLevel: { backgroundColor: '#fff', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: scaleWidth(12) },
	dropdownListField: { backgroundColor: '#fff', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: scaleWidth(12) },
	listCountWrapper: { marginTop: scaleHeight(4), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6), paddingVertical: scaleHeight(4) },
	selectAllText: { fontSize: scaledSize(13), color: '#334155', fontWeight: '600' },
	miniCheckbox: { width: scaleWidth(16), height: scaleWidth(16), borderRadius: scaleWidth(4), borderWidth: 1.5, borderColor: '#94A3B8', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
	miniCheckboxChecked: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
	listContent: { paddingTop: scaleHeight(4), paddingHorizontal: scaleWidth(16), paddingBottom: scaleHeight(60), flexGrow: 1 },
	itemCard: {
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#F1F5F9',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(8),
	},
	itemCardSelected: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
	levelBadge: { paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4), borderRadius: scaleWidth(12) },
	categoryBadge: { paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4), borderRadius: scaleWidth(12) },
	badgeText: { color: '#fff', marginTop: scaleHeight(1), fontSize: scaledSize(12), fontWeight: '600' },
	badgeInlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(10) },
	proverbBlock: { marginBottom: scaleHeight(6) },
	proverbTextMulti: { fontSize: scaledSize(18), fontWeight: 'bold', color: '#334155', lineHeight: scaleHeight(26), marginBottom: scaleHeight(8) },
	listMeaningText: { fontSize: scaledSize(14), color: '#334155', lineHeight: scaleHeight(20), marginTop: scaleHeight(2) },
	rowWithArrow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	checkbox: { width: scaleWidth(22), height: scaleWidth(22), borderRadius: scaleWidth(6), borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
	checkboxChecked: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
	emptyWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: scaleHeight(60) },
	emptyImage: { width: scaleWidth(160), height: scaleWidth(160), marginBottom: scaleHeight(16) },
	emptyTitle: { fontSize: scaledSize(16), fontWeight: '700', color: '#334155', marginBottom: scaleHeight(8) },
	emptyDesc: { fontSize: scaledSize(13), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(20) },
	emptyAddBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		marginTop: scaleHeight(20),
		paddingHorizontal: scaleWidth(18),
		paddingVertical: scaleHeight(10),
		borderRadius: scaleWidth(10),
		backgroundColor: '#F59E0B',
		shadowColor: '#F59E0B',
		shadowOffset: { width: 0, height: scaleHeight(3) },
		shadowOpacity: 0.25,
		shadowRadius: scaleWidth(6),
	},
	emptyAddBtnText: { color: '#fff', fontSize: scaledSize(13), fontWeight: '700' },
	bottomActionBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(16),
		paddingTop: scaleHeight(12),
		paddingBottom: scaleHeight(20),
		borderTopWidth: 1,
		borderTopColor: '#F1F5F9',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(8),
	},
	deleteActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(8), height: scaleHeight(50), borderRadius: scaleWidth(12), backgroundColor: '#EF4444' },
	deleteActionBtnDisabled: { backgroundColor: '#CBD5E1' },
	deleteActionBtnText: { color: '#fff', fontSize: scaledSize(15), fontWeight: '700' },
	confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scaleWidth(32) },
	confirmBox: { width: '100%', backgroundColor: '#fff', borderRadius: scaleWidth(20), paddingTop: scaleHeight(24), paddingBottom: scaleHeight(18), paddingHorizontal: scaleWidth(20), alignItems: 'center' },
	confirmIconWrapper: { width: scaleWidth(60), height: scaleWidth(60), borderRadius: scaleWidth(30), backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: scaleHeight(14) },
	confirmTitle: { fontSize: scaledSize(17), fontWeight: '800', color: '#334155', marginBottom: scaleHeight(10) },
	confirmDesc: { fontSize: scaledSize(14), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(21), marginBottom: scaleHeight(22) },
	confirmCount: { fontWeight: '800', color: '#EF4444' },
	confirmBtnRow: { flexDirection: 'row', width: '100%', gap: scaleWidth(10) },
	confirmBtn: { flex: 1, height: scaleHeight(46), borderRadius: scaleWidth(12), justifyContent: 'center', alignItems: 'center' },
	confirmBtnCancel: { backgroundColor: '#F1F5F9' },
	confirmBtnCancelText: { fontSize: scaledSize(14), fontWeight: '700', color: '#64748B' },
	confirmBtnDelete: { backgroundColor: '#EF4444' },
	confirmBtnDeleteText: { fontSize: scaledSize(14), fontWeight: '700', color: '#fff' },
});
