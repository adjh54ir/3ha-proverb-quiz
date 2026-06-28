/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import IconComponent from '../common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { getCategoryColor, getLevelColor } from '../common/CommonProverbModule';

interface Props {
	visible: boolean;
	book: MainDataType.ProverbBook | null;
	onClose: () => void;
	onAdd: (book: MainDataType.ProverbBook, ids: number[]) => void;
}

const LEVEL_ITEMS = [
	{ label: '전체', value: '전체', icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color="#64748B" /> },
	{ label: '아주 쉬움', value: '아주 쉬움', icon: () => <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(16)} color="#22C55E" /> },
	{ label: '쉬움', value: '쉬움', icon: () => <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(16)} color="#FCD34D" /> },
	{ label: '보통', value: '보통', icon: () => <IconComponent type="FontAwesome6" name="tree" size={scaledSize(16)} color="#FB923C" /> },
	{ label: '어려움', value: '어려움', icon: () => <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(16)} color="#EF4444" /> },
];

const LEVEL_ICON_MAP: Record<string, string> = { '아주 쉬움': 'seedling', 쉬움: 'leaf', 보통: 'tree', 어려움: 'trophy' };

const AddProverbModal = ({ visible, book, onClose, onAdd }: Props) => {
	const emptyImage = require('@/assets/images/no-data.png');

	const [keyword, setKeyword] = useState('');
	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	const [levelOpen, setLevelOpen] = useState(false);
	const [levelValue, setLevelValue] = useState('전체');
	const [levelItems, setLevelItems] = useState(LEVEL_ITEMS.map((v) => ({ ...v, labelStyle: { marginLeft: scaleWidth(6), fontSize: scaledSize(14) } })));

	const [categoryOpen, setCategoryOpen] = useState(false);
	const [categoryValue, setCategoryValue] = useState('전체');
	const [categoryItems, setCategoryItems] = useState<any[]>([]);

	useEffect(() => {
		const cats = ProverbServices.selectCategoryList();
		setCategoryItems([
			{ label: '전체', value: '전체', icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color="#64748B" />, labelStyle: { marginLeft: scaleWidth(6), fontSize: scaledSize(14) } },
			...cats.map((c) => ({ label: c, value: c, icon: () => <IconComponent type="FontAwesome6" name="tag" size={scaledSize(16)} color={getCategoryColor(c)} />, labelStyle: { marginLeft: scaleWidth(6), fontSize: scaledSize(14) } })),
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

	const existingIds = book?.proverbIds ?? [];
	const baseList = useMemo(() => ProverbServices.selectProverbList().filter((p) => !existingIds.includes(p.id)), [book, visible]);

	const filteredList = useMemo(() => {
		let list = [...baseList];
		if (keyword.trim()) {
			const lower = keyword.toLowerCase();
			list = list.filter((item) => item.proverb?.toLowerCase().includes(lower) || item.longMeaning?.toLowerCase().includes(lower) || item.meaning?.toLowerCase().includes(lower));
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
		setTimeout(() => {
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
			<TouchableOpacity style={[styles.itemCard, { marginBottom: isLast ? scaleHeight(20) : scaleHeight(10) }, isSelected && styles.itemCardSelected]} activeOpacity={0.75} onPress={() => toggleSelection(item.id)}>
				<View style={styles.itemHeader}>
					<View style={styles.badgeRow}>
						<View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.levelName) }]}>
							<IconComponent type="FontAwesome6" name={LEVEL_ICON_MAP[item.levelName] ?? 'circle'} size={scaledSize(10)} color="#fff" />
							<Text style={styles.badgeText}>{item.levelName}</Text>
						</View>
						<View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
							<Text style={styles.badgeText}>{item.category || '미지정'}</Text>
						</View>
					</View>
					<View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>{isSelected && <Icon name="check" size={scaledSize(11)} color="#fff" />}</View>
				</View>
				<Text style={styles.hanjaText}>{item.proverb}</Text>
				<Text style={styles.meaningText} numberOfLines={2}>{item.longMeaning || item.meaning}</Text>
			</TouchableOpacity>
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
								<IconComponent type="materialIcons" name="add-circle-outline" size={scaledSize(18)} color="#22C55E" />
								<Text style={styles.headerTitle} numberOfLines={1}>{book?.title ? `${book.title}에 추가` : '속담 추가'}</Text>
							</View>
							<TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
								<Icon name="xmark" size={scaledSize(20)} color="#64748B" />
							</TouchableOpacity>
						</View>
						<Text style={styles.headerSubText}>추가할 속담을 선택해주세요 <Text style={styles.headerCount}>({selectedIds.length})</Text></Text>
					</View>

					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={styles.body}>
							<View style={styles.filterWrap}>
								<View style={styles.searchRow}>
									<View style={styles.searchBox}>
										<Icon name="magnifying-glass" size={scaledSize(14)} color="#94A3B8" style={styles.searchIcon} />
										<TextInput style={styles.searchInput} placeholder="속담이나 의미를 검색해보세요" placeholderTextColor="#9CA3AF" value={keyword} onChangeText={(t) => { setKeyword(t); setLevelOpen(false); setCategoryOpen(false); }} />
										{keyword.length > 0 && (
											<TouchableOpacity onPress={() => setKeyword('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
												<Icon name="circle-xmark" size={scaledSize(15)} color="#94A3B8" />
											</TouchableOpacity>
										)}
									</View>
									<TouchableOpacity style={styles.resetButton} onPress={handleReset}>
										<Icon name="rotate-right" size={scaledSize(15)} color="#64748B" />
									</TouchableOpacity>
								</View>

								<View style={styles.dropdownRow}>
									<View style={[styles.dropdownWrapper, { zIndex: levelOpen ? 3000 : 1000 }]}>
										<DropDownPicker open={levelOpen} value={levelValue} items={levelItems} setOpen={setLevelOpen} setValue={setLevelValue} setItems={setLevelItems} style={styles.dropdown} dropDownContainerStyle={styles.dropdownList} labelStyle={styles.dropdownLabel} listItemLabelStyle={{ marginLeft: scaleWidth(6), fontSize: scaledSize(13) }} iconContainerStyle={{ marginRight: scaleWidth(8) }} showTickIcon={false} onOpen={() => setCategoryOpen(false)} />
									</View>
									<View style={[styles.dropdownWrapper, { zIndex: categoryOpen ? 3000 : 1000 }]}>
										<DropDownPicker
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
											iconContainerStyle={{ marginRight: scaleWidth(8) }}
											showTickIcon={false}
											renderListItem={({ item, onPress }) => (
												<TouchableOpacity
													//@ts-ignore
													onPress={() => onPress(item)}
													style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: scaleHeight(14), paddingHorizontal: scaleWidth(16), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: scaleWidth(12) }}>{typeof item.icon === 'function' ? item.icon() : item.icon}</View>
													<Text style={{ fontSize: scaledSize(15), color: '#334155', flex: 1 }}>{item.label}</Text>
												</TouchableOpacity>
											)}
											modalProps={{ animationType: 'fade', presentationStyle: 'overFullScreen', transparent: true }}
											modalContentContainerStyle={{ marginTop: '25%', width: '85%', alignSelf: 'center', maxHeight: scaleHeight(500), backgroundColor: '#fff', borderRadius: scaleWidth(20), paddingVertical: scaleHeight(20) }}
											modalTitleStyle={{ fontSize: scaledSize(16), fontWeight: 'bold', color: '#334155', textAlign: 'center', paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(16) }}
										/>
									</View>
								</View>

								<View style={styles.listCountRow}>
									{filteredList.length > 0 && (
										<TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll} activeOpacity={0.7}>
											<View style={[styles.miniCheckbox, isAllSelected && styles.miniCheckboxChecked]}>{isAllSelected && <Icon name="check" size={scaledSize(9)} color="#fff" />}</View>
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
										<Text style={styles.emptyTitle}>{baseList.length === 0 ? '추가할 수 있는 속담이 없어요' : '검색 결과가 없어요'}</Text>
										<Text style={styles.emptyDesc}>{baseList.length === 0 ? '이미 모든 속담이 담겨 있어요' : '다른 검색어나 필터를 사용해보세요'}</Text>
									</View>
								)}
							/>
						</View>
					</TouchableWithoutFeedback>

					<View style={styles.footer}>
						<TouchableOpacity style={[styles.confirmBtn, selectedIds.length === 0 && styles.confirmBtnDisabled]} disabled={selectedIds.length === 0} onPress={handleConfirm} activeOpacity={0.85}>
							<IconComponent type="materialIcons" name="add" size={scaledSize(16)} color="#fff" />
							<Text style={styles.confirmBtnText}>{selectedIds.length > 0 ? `${selectedIds.length}개 추가하기` : '속담을 선택해주세요'}</Text>
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
};

export default AddProverbModal;

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	sheet: { height: '92%', backgroundColor: '#F8FAFC', borderTopLeftRadius: scaleWidth(24), borderTopRightRadius: scaleWidth(24), overflow: 'hidden' },
	modalHeader: { backgroundColor: '#fff', paddingHorizontal: scaleWidth(20), paddingTop: scaleHeight(10), paddingBottom: scaleHeight(14), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
	handleBar: { width: scaleWidth(40), height: scaleHeight(4), borderRadius: scaleWidth(2), backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: scaleHeight(12) },
	headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(4) },
	headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8), flex: 1, marginRight: scaleWidth(10) },
	headerTitle: { fontSize: scaledSize(18), fontWeight: '800', color: '#334155', letterSpacing: -0.3, flexShrink: 1 },
	headerSubText: { fontSize: scaledSize(13), color: '#64748B' },
	headerCount: { fontWeight: '700', color: '#22C55E' },
	body: { flex: 1 },
	filterWrap: { backgroundColor: '#fff', paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(12), paddingBottom: scaleHeight(10), marginBottom: scaleHeight(6), borderBottomWidth: 1, borderBottomColor: '#F1F5F9', zIndex: 10 },
	searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(10) },
	searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: scaleWidth(10), paddingHorizontal: scaleWidth(12), height: scaleHeight(42) },
	searchIcon: { marginRight: scaleWidth(8) },
	searchInput: { flex: 1, fontSize: scaledSize(14), color: '#334155', paddingVertical: 0 },
	resetButton: { marginLeft: scaleWidth(8), backgroundColor: '#F1F5F9', paddingHorizontal: scaleWidth(12), height: scaleHeight(42), borderRadius: scaleWidth(8), justifyContent: 'center', alignItems: 'center' },
	dropdownRow: { flexDirection: 'row', gap: scaleWidth(8), marginBottom: scaleHeight(8) },
	dropdownWrapper: { flex: 1 },
	dropdown: { backgroundColor: '#fff', borderColor: '#E2E8F0', minHeight: scaleHeight(42), paddingHorizontal: scaleWidth(12) },
	dropdownList: { backgroundColor: '#fff', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: scaleWidth(10) },
	dropdownLabel: { fontSize: scaledSize(13), color: '#334155' },
	listCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: scaleHeight(4) },
	selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6), paddingVertical: scaleHeight(4) },
	selectAllText: { fontSize: scaledSize(13), color: '#334155', fontWeight: '600' },
	miniCheckbox: { width: scaleWidth(16), height: scaleWidth(16), borderRadius: scaleWidth(4), borderWidth: 1.5, borderColor: '#94A3B8', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
	miniCheckboxChecked: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
	listCountText: { fontSize: scaledSize(13), color: '#64748B' },
	listContent: { paddingTop: scaleHeight(10), paddingHorizontal: scaleWidth(16), paddingBottom: scaleHeight(30), flexGrow: 1 },
	itemCard: { backgroundColor: '#fff', borderRadius: scaleWidth(14), padding: scaleWidth(14), borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: scaleHeight(1) }, shadowOpacity: 0.04, shadowRadius: scaleWidth(4) },
	itemCardSelected: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
	itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(8) },
	badgeRow: { flexDirection: 'row', gap: scaleWidth(6) },
	levelBadge: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4), paddingHorizontal: scaleWidth(7), paddingVertical: scaleHeight(3), borderRadius: scaleWidth(9) },
	categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4), paddingHorizontal: scaleWidth(7), paddingVertical: scaleHeight(3), borderRadius: scaleWidth(9) },
	badgeText: { color: '#fff', fontSize: scaledSize(10), fontWeight: '600' },
	checkbox: { width: scaleWidth(22), height: scaleWidth(22), borderRadius: scaleWidth(6), borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
	checkboxChecked: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
	hanjaText: { fontSize: scaledSize(16), fontWeight: '700', color: '#334155', marginBottom: scaleHeight(4) },
	meaningText: { fontSize: scaledSize(12.5), color: '#64748B', lineHeight: scaleHeight(19) },
	emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: scaleHeight(40) },
	emptyImage: { width: scaleWidth(140), height: scaleWidth(140), marginBottom: scaleHeight(14) },
	emptyTitle: { fontSize: scaledSize(15), fontWeight: '700', color: '#334155', marginBottom: scaleHeight(6) },
	emptyDesc: { fontSize: scaledSize(13), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(20) },
	footer: { backgroundColor: '#fff', paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(12), paddingBottom: Platform.OS === 'ios' ? scaleHeight(30) : scaleHeight(16), borderTopWidth: 1, borderTopColor: '#F1F5F9' },
	confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(8), height: scaleHeight(50), borderRadius: scaleWidth(12), backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOffset: { width: 0, height: scaleHeight(3) }, shadowOpacity: 0.25, shadowRadius: scaleWidth(6) },
	confirmBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
	confirmBtnText: { color: '#fff', fontSize: scaledSize(15), fontWeight: '700' },
});
