/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { matchesKeyword } from '@/utils/SearchUtils';
import { Animated, Dimensions, Easing, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Keyboard, TouchableWithoutFeedback, Pressable, KeyboardAvoidingView } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import Icon from 'react-native-vector-icons/FontAwesome6';
import FastImage from 'react-native-fast-image';
import DropDownPicker from 'react-native-dropdown-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconComponent from '../common/atomic/IconComponent';
import FadeInView, { staggerDelay } from '@/components/animation/FadeInView';
import { CONTENT_MAX_WIDTH, scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles, themedValue, getPickerTheme } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { getCategoryColor, getLevelColor, getFieldIcon, getFieldIconName } from '../common/CommonProverbModule';
import { getLevelIconName } from '@/screens/common/CommonProverbModule';
import { DROPDOWN_MODAL_CONTENT_STYLE, DROPDOWN_MODAL_PROPS } from '@/const/common/DropdownModal';
import useReducedMotion from '@/hooks/useReducedMotion';

// 시트가 아래에서 올라오는 거리. 시트 높이보다 크기만 하면 되므로 화면 높이를 쓴다(세로 고정 앱).
const SHEET_SLIDE_FROM = Dimensions.get('screen').height;
const SHEET_SLIDE_DURATION = 260;

// behavior="padding" 을 유지하면서 transform 을 얹으려면 애니메이션 컴포넌트로 감싸야 한다.
const AnimatedKeyboardAvoidingView = Animated.createAnimatedComponent(KeyboardAvoidingView);

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

	// 시트 등장 모션. animationType="slide" 는 딤까지 함께 밀어 올려 전환 내내 화면 위쪽이
	// 딤 없이 비친다. 그래서 모달은 animationType="fade" 로 딤을 화면 전체에 고르게 깔고
	// (닫을 때도 같은 페이드로 사라진다), 시트만 여기서 아래에서 위로 올린다.
	const reducedMotion = useReducedMotion();
	const slideAnim = useRef(new Animated.Value(SHEET_SLIDE_FROM)).current;

	useEffect(() => {
		// 닫힐 때 값을 되돌려 둬야 다음에 열릴 때 첫 프레임이 화면 밖에서 시작한다(잔상 방지).
		slideAnim.setValue(SHEET_SLIDE_FROM);
		if (!visible) {
			return;
		}
		const anim = Animated.timing(slideAnim, {
			toValue: 0,
			duration: reducedMotion ? 0 : SHEET_SLIDE_DURATION,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		});
		anim.start();
		// 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
		return () => anim.stop();
	}, [visible, slideAnim, reducedMotion]);

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
			<FadeInView delay={staggerDelay(index)} duration={240} offsetY={10}>
			<TouchableOpacity style={[styles.itemCard, { marginBottom: isLast ? SPACING_H.xl : SPACING_H.md }, isSelected && styles.itemCardSelected]} activeOpacity={0.75} onPress={() => toggleSelection(item.id)}>
				<View style={styles.itemHeader}>
					<View style={styles.badgeRow}>
						<View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.levelName) }]}>
							<IconComponent type="FontAwesome6" name={getLevelIconName(item.levelName)} size={scaledSize(10)} color={COLORS.textWhite} />
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
		<Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
			{/* AppModal 은 딤이 잘리지 않도록 화면(screen) 실측 크기로 깔린다. 그래서 오버레이에
			    상단 안전 여백을 직접 줘야 시트가 상태바 밑으로 파고들지 않는다(CLAUDE.md 규칙 1).
			    ⚠️ paddingBottom 은 주지 않는다 — 아래에 붙는 시트라 여백을 주면 시트와 화면 하단
			    사이에 딤 띠가 생긴다. 하단 시스템 바는 footer 의 insets.bottom 이 이미 피한다. */}
			<View style={[styles.overlay, { paddingTop: insets.top }]}>
				{/* 시트 위쪽 딤 영역. 여기를 눌러도 키보드가 닫혀야 한다(헤더/푸터는 아래 래퍼 밖이다). */}
				<Pressable style={styles.dimArea} onPress={Keyboard.dismiss} accessible={false} />
				{/* 모달은 Activity 가 아닌 별도 Dialog 윈도우라 매니페스트의 adjustResize 가 적용되지 않는다.
				    화면(Screen)과 달리 안드로이드도 behavior 를 직접 줘야 키보드가 입력창을 가리지 않는다.

				    ⚠️ 'height' 를 쓰면 안 된다. 이 시트는 overlay 의 justifyContent:'flex-end' 로
				    아래쪽에 붙어 있어서, height 를 줄이면 아래가 아니라 **위쪽**이 깎인다.
				    시트 하단의 확인 버튼은 그대로 키보드 밑에 남는다. 'padding' 은 paddingBottom 을
				    키보드 높이만큼 넣어 내용 전체를 위로 밀어 올리므로 두 플랫폼 모두 이 값을 쓴다. */}
				<AnimatedKeyboardAvoidingView behavior="padding" style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
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

					<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
									<TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8} hitSlop={HIT_SLOP}>
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
											modalProps={DROPDOWN_MODAL_PROPS}
											modalContentContainerStyle={DROPDOWN_MODAL_CONTENT_STYLE}
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
								contentContainerStyle={[styles.listContent, filteredList.length === 0 && styles.listContentEmpty]}
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
				</AnimatedKeyboardAvoidingView>
			</View>
		</Modal>
	);
};

export default AddProverbModal;

const styles = themedStyles(() => StyleSheet.create({
	// paddingTop 은 useSafeAreaInsets 로 런타임 주입 (시트가 상태바 밑으로 파고드는 것 방지)
	overlay: { flex: 1, backgroundColor: COLORS.dim, justifyContent: 'flex-end' },
	dimArea: { flex: 1 },
	// 92% 는 오버레이의 '안전 여백을 뺀' 높이 기준이다(퍼센트는 부모 content box 로 계산된다).
	// 그래서 전체 화면 92% 였던 예전과 달리 상태바를 침범하지 않고, 남는 8% 는 위쪽 딤 영역이 된다.
	// 태블릿에서 시트가 화면 폭을 다 쓰면 한 줄이 지나치게 길어진다. 본문 기둥 폭으로 묶고 가운데 정렬.
	// 폰은 화면 폭이 CONTENT_MAX_WIDTH 보다 좁아 아무 영향이 없다.
	sheet: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', height: '92%', maxHeight: '100%', backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
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
	// 위아래 여백은 스크롤되는 목록을 위한 것이라, 비었을 때는 중앙 정렬만 어긋나게 한다.
	listContentEmpty: { paddingTop: 0, paddingBottom: 0 },
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
	// 빈 영역 전체를 채우고 그 정중앙에 놓인다. 위쪽 여백을 따로 주면 그만큼 아래로 밀린다.
	emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	emptyImage: { width: scaleWidth(140), height: scaleWidth(140), marginBottom: SPACING_H.md },
	emptyTitle: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.textStrong, marginBottom: SPACING_H.xs },
	emptyDesc: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, textAlign: 'center', lineHeight: scaledSize(20) },
	// paddingBottom 은 useSafeAreaInsets 로 런타임 주입 (제스처/3버튼 네비게이션 바 회피)
	footer: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, borderTopWidth: 1, borderTopColor: COLORS.surfaceAlt },
	confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING_W.sm, height: scaleHeight(48), borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
	confirmBtnDisabled: { backgroundColor: COLORS.borderDark },
	confirmBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.mdPlus, fontWeight: '700' },
}));
