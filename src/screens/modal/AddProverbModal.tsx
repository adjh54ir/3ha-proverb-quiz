/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { matchesKeyword } from '@/utils/SearchUtils';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconComponent from '../common/atomic/IconComponent';
import FadeInView from '@/components/animation/FadeInView';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles, themedValue, getPickerTheme } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { getCategoryColor, getLevelColor, getFieldIcon, getFieldIconName } from '../common/CommonProverbModule';

interface Props {
	visible: boolean;
	book: MainDataType.ProverbBook | null;
	onClose: () => void;
	onAdd: (book: MainDataType.ProverbBook, ids: number[]) => void;
}

// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const LEVEL_ITEMS = themedValue(() => ([
	{ label: '전체', value: '전체', icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color={COLORS.textSecondary} /> },
	{ label: '초급', value: '초급', icon: () => <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(16)} color={getLevelColor('초급')} /> },
	{ label: '중급', value: '중급', icon: () => <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(16)} color={COLORS.warning} /> },
	{ label: '고급', value: '고급', icon: () => <IconComponent type="FontAwesome6" name="tree" size={scaledSize(16)} color={getLevelColor('고급')} /> },
	{ label: '특급', value: '특급', icon: () => <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(16)} color={getLevelColor('특급')} /> },
]));

const LEVEL_ICON_MAP: Record<string, string> = { '초급': 'seedling', 중급: 'leaf', 고급: 'tree', 특급: 'trophy' };

const AddProverbModal = ({ visible, book, onClose, onAdd }: Props) => {
	const emptyImage = require('@/assets/images/feature-states/empty-search.png');
	const insets = useSafeAreaInsets();

	const [keyword, setKeyword] = useState('');
	const [searchFocused, setSearchFocused] = useState(false);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	const [levelOpen, setLevelOpen] = useState(false);
	const [levelValue, setLevelValue] = useState('전체');
	const [levelItems, setLevelItems] = useState(LEVEL_ITEMS.map((v) => ({ ...v, labelStyle: { marginLeft: SPACING_W.xsPlus, fontSize: FONT_SIZES.md } })));

	const [categoryOpen, setCategoryOpen] = useState(false);
	const [categoryValue, setCategoryValue] = useState('전체');
	const [categoryItems, setCategoryItems] = useState<any[]>([]);

	const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
		};
	}, []);

	useEffect(() => {
		const cats = ProverbServices.selectCategoryList();
		setCategoryItems([
			{ label: '전체', value: '전체', icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color={COLORS.textSecondary} />, labelStyle: { marginLeft: SPACING_W.xsPlus, fontSize: FONT_SIZES.md } },
			...cats.map((c) => ({ label: c, value: c, icon: () => <IconComponent type="materialIcons" name={getFieldIconName(c)} size={scaledSize(16)} color={getCategoryColor(c)} />, labelStyle: { marginLeft: SPACING_W.xsPlus, fontSize: FONT_SIZES.md } })),
		]);
	}, []);

	useEffect(() => {
		if (visible) {
			setKeyword('');
			setSelectedIds([]);
			setLevelValue('전체');
			setCategoryValue('전체');
			setLevelOpen(false);
			setCategoryOpen(false);
		}
	}, [visible]);

	// existingIds 는 매 렌더 새 배열이라 deps 로 쓸 수 없다. 내용 기반 키로 비교한다.
	const existingKey = (book?.proverbIds ?? []).join(',');
	const baseList = useMemo(() => {
		const exclude = new Set(existingKey ? existingKey.split(',').map(Number) : []);
		return ProverbServices.selectProverbList().filter((p) => !exclude.has(p.id));
	}, [existingKey]);

	const filteredList = useMemo(() => {
		let list = [...baseList];
		if (keyword.trim()) {
			// 초성 검색 지원
			list = list.filter((item) => matchesKeyword(keyword, item.proverb, item.longMeaning, item.meaning));
		}
		if (levelValue !== '전체') {
			list = list.filter((item) => item.levelName?.trim() === levelValue);
		}
		if (categoryValue !== '전체') {
			list = list.filter((item) => item.category?.trim() === categoryValue);
		}
		return list;
	}, [baseList, keyword, levelValue, categoryValue]);

	const toggleSelection = (id: number) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
	};

	const handleSelectAll = () => {
		if (filteredList.length === 0) return;
		const allSelected = filteredList.every((item) => selectedIds.includes(item.id));
		const ids = filteredList.map((i) => i.id);
		if (allSelected) {
			setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
		} else {
			setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
		}
	};

	const handleReset = () => {
		setCategoryOpen(false);
		setLevelOpen(false);
		Keyboard.dismiss();
		if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
		resetTimerRef.current = setTimeout(() => {
			setKeyword('');
			setLevelValue('전체');
			setCategoryValue('전체');
		}, 50);
	};

	const handleConfirm = () => {
		if (!book || selectedIds.length === 0) return;
		onAdd(book, selectedIds);
	};

	const isAllSelected = filteredList.length > 0 && filteredList.every((item) => selectedIds.includes(item.id));

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const isLast = index === filteredList.length - 1;
		const isSelected = selectedIds.includes(item.id);

		return (
			<FadeInView delay={index < 6 ? index * 40 : 0} duration={240} offsetY={10}>
			<TouchableOpacity style={[styles.itemCard, { marginBottom: isLast ? SPACING_H.xl : SPACING_H.md }, isSelected && styles.itemCardSelected]} activeOpacity={0.75} onPress={() => toggleSelection(item.id)}>
				<View style={styles.itemHeader}>
					<View style={styles.badgeRow}>
						<View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.levelName) }]}>
							<IconComponent type="FontAwesome6" name={LEVEL_ICON_MAP[item.levelName] ?? 'circle'} size={scaledSize(10)} color={COLORS.textWhite} />
							<Text style={styles.badgeText}>{item.levelName}</Text>
						</View>
						<View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
							{getFieldIcon(item.category)}
							<Text style={styles.badgeText}>{item.category || '미지정'}</Text>
						</View>
					</View>
					<View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>{isSelected && <Icon name="check" size={scaledSize(11)} color={COLORS.textWhite} />}</View>
				</View>
				<Text style={styles.hanjaText}>{item.proverb}</Text>
				<Text style={styles.meaningText} numberOfLines={2}>{item.longMeaning || item.meaning}</Text>
			</TouchableOpacity>
			</FadeInView>
		);
	};

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<View style={styles.overlay}>
				<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
					<View style={styles.modalHeader}>
						<View style={styles.handleBar} />
						<View style={styles.headerRow}>
							<View style={styles.headerTitleRow}>
								<IconComponent type="materialIcons" name="add-circle-outline" size={scaledSize(18)} color={COLORS.primary} />
								<Text style={styles.headerTitle} numberOfLines={1}>{book?.title ? `${book.title}에 추가` : '속담 추가'}</Text>
							</View>
							<TouchableOpacity onPress={onClose} hitSlop={HIT_SLOP} activeOpacity={0.7}>
								<Icon name="xmark" size={scaledSize(20)} color={COLORS.textSecondary} />
							</TouchableOpacity>
						</View>
						<Text style={styles.headerSubText}>추가할 속담을 선택해주세요 <Text style={styles.headerCount}>({selectedIds.length})</Text></Text>
					</View>

					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={styles.body}>
							<View style={styles.filterWrap}>
								<View style={styles.searchRow}>
									<View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
										<Icon name="magnifying-glass" size={scaledSize(14)} color={COLORS.textLight} style={styles.searchIcon} />
										<TextInput
											style={styles.searchInput}
											placeholder="속담·의미 또는 초성(ㄱㄴㄷ) 검색"
											placeholderTextColor={COLORS.textLight}
											value={keyword}
											onFocus={() => setSearchFocused(true)}
											onBlur={() => setSearchFocused(false)}
											onChangeText={(t) => { setKeyword(t); setLevelOpen(false); setCategoryOpen(false); }}
										/>
										{keyword.length > 0 && (
											<TouchableOpacity onPress={() => setKeyword('')} hitSlop={HIT_SLOP}>
												<Icon name="circle-xmark" size={scaledSize(15)} color={COLORS.textLight} />
											</TouchableOpacity>
										)}
									</View>
									<TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
										<Icon name="rotate-right" size={scaledSize(15)} color={COLORS.textSecondary} />
									</TouchableOpacity>
								</View>

								<View style={styles.dropdownRow}>
									<View style={[styles.dropdownWrapper, { zIndex: levelOpen ? 3000 : 1000 }]}>
										<DropDownPicker theme={getPickerTheme()} open={levelOpen} value={levelValue} items={levelItems} setOpen={setLevelOpen} setValue={setLevelValue} setItems={setLevelItems} style={styles.dropdown} dropDownContainerStyle={styles.dropdownList} labelStyle={styles.dropdownLabel} listItemLabelStyle={{ marginLeft: SPACING_W.xsPlus, fontSize: FONT_SIZES.smPlus }} iconContainerStyle={{ marginRight: SPACING_W.sm }} showTickIcon={false} onOpen={() => setCategoryOpen(false)} />
									</View>
									<View style={[styles.dropdownWrapper, { zIndex: categoryOpen ? 3000 : 1000 }]}>
										<DropDownPicker
											theme={getPickerTheme()}
											listMode="MODAL"
											open={categoryOpen}
											modalTitle="카테고리 선택"
											value={categoryValue}
											items={categoryItems}
											setOpen={setCategoryOpen}
											setValue={setCategoryValue}
											setItems={setCategoryItems}
											style={styles.dropdown}
											dropDownContainerStyle={styles.dropdownList}
											labelStyle={styles.dropdownLabel}
											iconContainerStyle={{ marginRight: SPACING_W.sm }}
											showTickIcon={false}
											renderListItem={({ item, onPress }) => (
												<TouchableOpacity
													//@ts-ignore
													onPress={() => onPress(item)}
													style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING_H.md, paddingHorizontal: SPACING_W.lg, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt }}>
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: SPACING_W.md }}>{typeof item.icon === 'function' ? item.icon() : item.icon}</View>
													<Text style={{ fontSize: FONT_SIZES.mdPlus, color: COLORS.text, flex: 1 }}>{item.label}</Text>
												</TouchableOpacity>
											)}
											modalProps={{ animationType: 'fade', presentationStyle: 'overFullScreen', transparent: true }}
											modalContentContainerStyle={{ marginTop: '25%', width: '85%', alignSelf: 'center', maxHeight: scaleHeight(500), backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, paddingVertical: SPACING_H.xl }}
											modalTitleStyle={{ fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong, textAlign: 'center', paddingVertical: SPACING_H.md, paddingHorizontal: SPACING_W.lg }}
										/>
									</View>
								</View>

								<View style={styles.listCountRow}>
									{filteredList.length > 0 && (
										<TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll} activeOpacity={0.7}>
											<View style={[styles.miniCheckbox, isAllSelected && styles.miniCheckboxChecked]}>{isAllSelected && <Icon name="check" size={scaledSize(9)} color={COLORS.textWhite} />}</View>
											<Text style={styles.selectAllText}>전체 선택</Text>
										</TouchableOpacity>
									)}
									<Text style={styles.listCountText}>총 {filteredList.length}개</Text>
								</View>
							</View>

							<FlatList
								data={filteredList}
								keyExtractor={(item) => item.id.toString()}
								renderItem={renderItem}
								scrollEnabled={!levelOpen && !categoryOpen}
								keyboardShouldPersistTaps="handled"
								keyboardDismissMode="on-drag"
								contentContainerStyle={styles.listContent}
								showsVerticalScrollIndicator={false}
								ListEmptyComponent={() => (
									<View style={styles.emptyWrap}>
										<FastImage source={emptyImage} style={styles.emptyImage} resizeMode="contain" />
										<Text style={styles.emptyTitle}>{baseList.length === 0 ? '추가할 수 있는 속담이 없습니다' : '검색 결과가 없습니다'}</Text>
										<Text style={styles.emptyDesc}>{baseList.length === 0 ? '이미 모든 속담이 담겨 있습니다' : '다른 검색어나 필터를 사용해보세요'}</Text>
									</View>
								)}
							/>
						</View>
					</TouchableWithoutFeedback>

					<View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING_H.lg) }]}>
						<TouchableOpacity style={[styles.confirmBtn, selectedIds.length === 0 && styles.confirmBtnDisabled]} disabled={selectedIds.length === 0} onPress={handleConfirm} activeOpacity={0.85}>
							<IconComponent type="materialIcons" name="add" size={scaledSize(16)} color={COLORS.textWhite} />
							<Text style={styles.confirmBtnText}>{selectedIds.length > 0 ? `${selectedIds.length}개 추가하기` : '속담을 선택해주세요'}</Text>
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
};

export default AddProverbModal;

const styles = themedStyles(() => StyleSheet.create({
	overlay: { flex: 1, backgroundColor: COLORS.dim, justifyContent: 'flex-end' },
	sheet: { height: '92%', backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
	modalHeader: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.sm, paddingBottom: SPACING_H.md, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt },
	handleBar: { width: scaleWidth(40), height: scaleHeight(4), borderRadius: RADIUS.round, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING_H.md },
	headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING_H.xs },
	headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.sm, flex: 1, marginRight: SPACING_W.md },
	headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textStrong, letterSpacing: -0.3, flexShrink: 1 },
	headerSubText: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary },
	headerCount: { fontWeight: '700', color: COLORS.primary },
	body: { flex: 1 },
	filterWrap: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, paddingBottom: SPACING_H.md, marginBottom: SPACING_H.xs, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt, zIndex: 10 },
	searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING_H.sm },
	searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING_W.md, height: scaleHeight(48) },
	searchBoxFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.surface },
	searchIcon: { marginRight: SPACING_W.sm },
	searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: 0 },
	resetButton: { marginLeft: SPACING_W.sm, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING_W.md, height: scaleHeight(48), borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
	dropdownRow: { flexDirection: 'row', gap: SPACING_W.sm, marginBottom: SPACING_H.sm },
	dropdownWrapper: { flex: 1 },
	dropdown: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADIUS.md, minHeight: scaleHeight(48), paddingHorizontal: SPACING_W.md },
	dropdownList: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.md },
	dropdownLabel: { fontSize: FONT_SIZES.smPlus, color: COLORS.text },
	listCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING_H.xs },
	selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xs, paddingVertical: SPACING_H.xs },
	selectAllText: { fontSize: FONT_SIZES.smPlus, color: COLORS.text, fontWeight: '600' },
	miniCheckbox: { width: scaleWidth(16), height: scaleWidth(16), borderRadius: scaleWidth(4), borderWidth: 1.5, borderColor: COLORS.textLight, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
	miniCheckboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
	listCountText: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary },
	listContent: { paddingTop: SPACING_H.md, paddingHorizontal: SPACING_W.lg, paddingBottom: SPACING_H.xxxxl, flexGrow: 1 },
	itemCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING_W.lg, paddingVertical: SPACING_H.md, borderWidth: 1, borderColor: COLORS.surfaceAlt, },
	itemCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
	itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING_H.sm },
	badgeRow: { flexDirection: 'row', gap: SPACING_W.xs },
	levelBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xs, paddingHorizontal: SPACING_W.sm, paddingVertical: SPACING_H.xs, borderRadius: RADIUS.round },
	categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.xs, paddingHorizontal: SPACING_W.sm, paddingVertical: SPACING_H.xs, borderRadius: RADIUS.round },
	badgeText: { color: COLORS.textWhite, fontSize: FONT_SIZES.xxs, fontWeight: '600' },
	checkbox: { width: scaleWidth(22), height: scaleWidth(22), borderRadius: RADIUS.sm, borderWidth: 2, borderColor: COLORS.borderDark, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
	checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
	hanjaText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong, marginBottom: SPACING_H.xs },
	meaningText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: scaledSize(19) },
	emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING_H.xxxxl },
	emptyImage: { width: scaleWidth(140), height: scaleWidth(140), marginBottom: SPACING_H.md },
	emptyTitle: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.textStrong, marginBottom: SPACING_H.xs },
	emptyDesc: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, textAlign: 'center', lineHeight: scaledSize(20) },
	// paddingBottom 은 useSafeAreaInsets 로 런타임 주입 (제스처/3버튼 네비게이션 바 회피)
	footer: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, borderTopWidth: 1, borderTopColor: COLORS.surfaceAlt },
	confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING_W.sm, height: scaleHeight(48), borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
	confirmBtnDisabled: { backgroundColor: COLORS.borderDark },
	confirmBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.mdPlus, fontWeight: '700' },
}));
