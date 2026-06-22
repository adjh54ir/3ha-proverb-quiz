/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import IconComponent from '../common/atomic/IconComponent';
import { getCategoryColor, getLevelColor } from '../common/CommonProverbModule';
import { MainDataType } from '@/types/MainDataType';

const ALL_PROVERBS = CONST_MAIN_DATA.PROVERB;
const LEVELS = ['전체', '아주 쉬움', '쉬움', '보통', '어려움'];

interface Props {
	visible: boolean;
	book: MainDataType.ProverbBook;
	onClose: () => void;
	onAdd: (ids: number[]) => void;
}

const AddProverbModal = ({ visible, book, onClose, onAdd }: Props) => {
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [search, setSearch] = useState('');
	const [level, setLevel] = useState('전체');
	const [category, setCategory] = useState('전체');
	const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
	const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

	const categories = useMemo(() => {
		const set = new Set(ALL_PROVERBS.map((p) => p.category));
		return ['전체', ...Array.from(set)];
	}, []);

	const filtered = useMemo(() => {
		return ALL_PROVERBS.filter((p) => {
			const lv = level === '전체' || p.levelName === level;
			const ct = category === '전체' || p.category === category;
			const sq = !search || p.proverb.includes(search) || p.meaning.includes(search) || (p.longMeaning ?? '').includes(search);
			return lv && ct && sq;
		});
	}, [level, category, search]);

	const handleClose = () => {
		setSelectedIds([]);
		setSearch('');
		setLevel('전체');
		setCategory('전체');
		setLevelDropdownOpen(false);
		setCategoryDropdownOpen(false);
		onClose();
	};

	const handleAdd = () => {
		if (selectedIds.length === 0) {
			return;
		}
		onAdd(selectedIds);
		handleClose();
	};

	const addable = filtered.filter((p) => !book.proverbIds.includes(p.id));
	const allSelected = addable.length > 0 && addable.every((p) => selectedIds.includes(p.id));

	const toggleSelectAll = () => {
		const allIds = addable.map((p) => p.id);
		setSelectedIds(allSelected ? selectedIds.filter((id) => !allIds.includes(id)) : [...new Set([...selectedIds, ...allIds])]);
	};

	const handleLevelSelect = (l: string) => {
		setLevel(l);
		setLevelDropdownOpen(false);
	};

	const handleCategorySelect = (c: string) => {
		setCategory(c);
		setCategoryDropdownOpen(false);
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
				<TouchableOpacity
					style={styles.overlay}
					activeOpacity={1}
					onPress={() => {
						if (levelDropdownOpen) {
							setLevelDropdownOpen(false);
						}
						if (categoryDropdownOpen) {
							setCategoryDropdownOpen(false);
						}
					}}>
					<TouchableOpacity activeOpacity={1} style={styles.modal} onPress={(e) => e.stopPropagation()}>
						<View style={styles.header}>
							<Text style={styles.title}>속담 추가</Text>
							<TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
								<IconComponent type="materialIcons" name="close" size={scaledSize(24)} color="#0F172A" />
							</TouchableOpacity>
						</View>

						<View style={styles.searchBox}>
							<IconComponent type="materialIcons" name="search" size={scaledSize(20)} color="#94A3B8" />
							<TextInput style={styles.searchInput} placeholder="속담, 뜻으로 검색" placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch} />
							{!!search && (
								<TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
									<IconComponent type="materialIcons" name="close" size={scaledSize(18)} color="#94A3B8" />
								</TouchableOpacity>
							)}
						</View>

						<View style={styles.filterRow}>
							<View style={styles.filterBox}>
								<TouchableOpacity
									style={[styles.dropdownButton, levelDropdownOpen && styles.dropdownButtonActive]}
									onPress={() => {
										setCategoryDropdownOpen(false);
										setLevelDropdownOpen(!levelDropdownOpen);
									}}
									activeOpacity={0.7}>
									<Text style={[styles.dropdownButtonText, level !== '전체' && styles.dropdownButtonTextActive]}>{level}</Text>
									{level !== '전체' && <View style={[styles.levelDot, { backgroundColor: getLevelColor(level) }]} />}
									<IconComponent type="materialIcons" name={levelDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={scaledSize(20)} color={level !== '전체' ? '#0F172A' : '#64748B'} />
								</TouchableOpacity>

								{levelDropdownOpen && (
									<View style={styles.dropdown}>
										{LEVELS.map((l) => (
											<TouchableOpacity key={l} style={[styles.dropdownItem, level === l && styles.dropdownItemActive]} onPress={() => handleLevelSelect(l)} activeOpacity={0.7}>
												{l !== '전체' && <View style={[styles.levelDot, { backgroundColor: getLevelColor(l) }]} />}
												<Text style={[styles.dropdownItemText, level === l && styles.dropdownItemTextActive]}>{l}</Text>
												{level === l && <IconComponent type="materialIcons" name="check" size={scaledSize(18)} color="#22C55E" />}
											</TouchableOpacity>
										))}
									</View>
								)}
							</View>

							<View style={styles.filterBox}>
								<TouchableOpacity
									style={[styles.dropdownButton, categoryDropdownOpen && styles.dropdownButtonActive]}
									onPress={() => {
										setLevelDropdownOpen(false);
										setCategoryDropdownOpen(!categoryDropdownOpen);
									}}
									activeOpacity={0.7}>
									<Text style={[styles.dropdownButtonText, category !== '전체' && styles.dropdownButtonTextActive]} numberOfLines={1}>
										{category}
									</Text>
									{category !== '전체' && <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />}
									<IconComponent type="materialIcons" name={categoryDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={scaledSize(20)} color={category !== '전체' ? '#0F172A' : '#64748B'} />
								</TouchableOpacity>

								{categoryDropdownOpen && (
									<View style={styles.dropdown}>
										<ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
											{categories.map((c) => (
												<TouchableOpacity key={c} style={[styles.dropdownItem, category === c && styles.dropdownItemActive]} onPress={() => handleCategorySelect(c)} activeOpacity={0.7}>
													{c !== '전체' && <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(c) }]} />}
													<Text style={[styles.dropdownItemText, category === c && styles.dropdownItemTextActive]}>{c}</Text>
													{category === c && <IconComponent type="materialIcons" name="check" size={scaledSize(18)} color="#22C55E" />}
												</TouchableOpacity>
											))}
										</ScrollView>
									</View>
								)}
							</View>

							{(level !== '전체' || category !== '전체') && (
								<TouchableOpacity
									style={styles.resetButton}
									onPress={() => {
										setLevel('전체');
										setCategory('전체');
									}}
									activeOpacity={0.7}>
									<IconComponent type="materialIcons" name="refresh" size={scaledSize(20)} color="#EF4444" />
								</TouchableOpacity>
							)}
						</View>

						<View style={styles.selectBar}>
							<View style={styles.selectCount}>
								<Text style={styles.selectCountNumber}>{selectedIds.length}</Text>
								<Text style={styles.selectCountText}>개 선택</Text>
							</View>
							<TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.7}>
								<Text style={styles.selectAllText}>{allSelected ? '전체 해제' : '전체 선택'}</Text>
							</TouchableOpacity>
						</View>

						<FlatList
							data={filtered}
							keyExtractor={(item) => String(item.id)}
							style={styles.list}
							showsVerticalScrollIndicator={false}
							renderItem={({ item }) => {
								const isSelected = selectedIds.includes(item.id);
								const alreadyIn = book.proverbIds.includes(item.id);
								return (
									<TouchableOpacity
										style={[styles.item, isSelected && styles.itemSelected, alreadyIn && styles.itemAlready]}
										onPress={() => {
											if (alreadyIn) {
												return;
											}
											setSelectedIds((prev) => (prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]));
										}}
										activeOpacity={alreadyIn ? 1 : 0.7}>
										<View style={styles.itemContent}>
											<View style={[styles.levelDot, { backgroundColor: getLevelColor(item.level) }]} />
											<View style={styles.itemText}>
												<View style={styles.itemHeader}>
													<Text style={styles.proverbTitle}>{item.proverb}</Text>
												</View>
												<Text style={styles.meaning} numberOfLines={2}>
													{item.meaning}
												</Text>
												<View style={[styles.catTag, { backgroundColor: getCategoryColor(item.category) }]}>
													<Text style={styles.catTagText}>{item.category}</Text>
												</View>
											</View>
										</View>
										{alreadyIn ? (
											<View style={styles.alreadyBadge}>
												<Text style={styles.alreadyBadgeText}>추가됨</Text>
											</View>
										) : (
											<View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>{isSelected && <IconComponent type="materialIcons" name="check" size={scaledSize(16)} color="#fff" />}</View>
										)}
									</TouchableOpacity>
								);
							}}
						/>

						<View style={styles.footer}>
							<TouchableOpacity style={[styles.addBtn, selectedIds.length === 0 && styles.addBtnDisabled]} onPress={handleAdd} disabled={selectedIds.length === 0} activeOpacity={0.8}>
								<Text style={styles.addBtnText}>{selectedIds.length > 0 ? `${selectedIds.length}개 추가하기` : '선택된 항목 없음'}</Text>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</Modal>
	);
};

export default AddProverbModal;

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	modal: { width: '90%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: scaleWidth(24), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scaleWidth(20), paddingTop: scaleHeight(20), paddingBottom: scaleHeight(16) },
	title: { fontSize: scaledSize(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
	closeBtn: { padding: scaleWidth(4) },
	searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: scaleWidth(20), marginBottom: scaleHeight(16), borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(14), backgroundColor: '#F8FAFC', height: scaleHeight(48) },
	searchInput: { flex: 1, paddingHorizontal: scaleWidth(10), fontSize: scaledSize(15), color: '#0F172A' },
	clearBtn: { padding: scaleWidth(4) },
	filterRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: scaleWidth(20), marginBottom: scaleHeight(12), gap: scaleWidth(8), zIndex: 10 },
	filterBox: { flex: 1, position: 'relative' },
	dropdownButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: scaleWidth(12), paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(14), gap: scaleWidth(6) },
	dropdownButtonActive: { backgroundColor: '#fff', borderColor: '#22C55E' },
	dropdownButtonText: { flex: 1, fontSize: scaledSize(14), fontWeight: '600', color: '#64748B' },
	dropdownButtonTextActive: { color: '#0F172A' },
	levelDot: { width: scaleWidth(8), height: scaleWidth(8), borderRadius: scaleWidth(4) },
	categoryDot: { width: scaleWidth(8), height: scaleWidth(8), borderRadius: scaleWidth(4) },
	dropdown: { position: 'absolute', top: scaleHeight(48), left: 0, right: 0, backgroundColor: '#fff', borderRadius: scaleWidth(12), borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, zIndex: 100, maxHeight: scaleHeight(240) },
	dropdownScroll: { maxHeight: scaleHeight(240) },
	dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(14), gap: scaleWidth(8), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
	dropdownItemActive: { backgroundColor: '#EFF6FF' },
	dropdownItemText: { flex: 1, fontSize: scaledSize(14), fontWeight: '500', color: '#0F172A' },
	dropdownItemTextActive: { fontWeight: '700', color: '#22C55E' },
	resetButton: { backgroundColor: '#FEE2E2', borderRadius: scaleWidth(12), width: scaleWidth(44), height: scaleHeight(44), justifyContent: 'center', alignItems: 'center' },
	selectBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scaleWidth(20), paddingVertical: scaleHeight(12), backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9', marginTop: scaleHeight(4) },
	selectCount: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4) },
	selectCountNumber: { fontSize: scaledSize(16), fontWeight: '700', color: '#22C55E' },
	selectCountText: { fontSize: scaledSize(14), color: '#64748B' },
	selectAllText: { fontSize: scaledSize(14), color: '#22C55E', fontWeight: '600' },
	list: { height: scaleHeight(420) },
	item: { flexDirection: 'row', alignItems: 'center', paddingVertical: scaleHeight(14), paddingHorizontal: scaleWidth(20), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
	itemSelected: { backgroundColor: '#EFF6FF' },
	itemAlready: { backgroundColor: '#F8FAFC', opacity: 0.7 },
	itemContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: scaleWidth(12) },
	itemText: { flex: 1, gap: scaleHeight(4) },
	itemHeader: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) },
	proverbTitle: { fontSize: scaledSize(15), fontWeight: '700', color: '#0F172A', flex: 1 },
	meaning: { fontSize: scaledSize(12), color: '#64748B', lineHeight: scaledSize(16) },
	catTag: { alignSelf: 'flex-start', paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(3), borderRadius: scaleWidth(6), marginTop: scaleHeight(2) },
	catTagText: { fontSize: scaledSize(10), color: '#fff', fontWeight: '600' },
	alreadyBadge: { backgroundColor: '#DBEAFE', borderRadius: scaleWidth(8), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4), marginLeft: scaleWidth(8) },
	alreadyBadgeText: { fontSize: scaledSize(11), color: '#22C55E', fontWeight: '600' },
	checkCircle: { width: scaleWidth(24), height: scaleWidth(24), borderRadius: scaleWidth(12), borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
	checkCircleActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
	footer: { padding: scaleWidth(20), paddingTop: scaleHeight(16), borderTopWidth: 1, borderTopColor: '#F1F5F9' },
	addBtn: { backgroundColor: '#3B82F6', paddingVertical: scaleHeight(16), borderRadius: scaleWidth(14), alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
	addBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
	addBtnText: { color: '#fff', fontWeight: '700', fontSize: scaledSize(16) },
});
