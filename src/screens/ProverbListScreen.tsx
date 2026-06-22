/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl, TouchableOpacity, Keyboard, TouchableWithoutFeedback, FlatList, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { getCategoryColor, getLevelColor } from './common/CommonProverbModule';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import FavoriteToast from './common/FavoriteToast';

const PAGE_SIZE = 30;

const LEVEL_NAME_MAP: Record<number, string> = { 1: '아주 쉬움', 2: '쉬움', 3: '보통', 4: '어려움' };
const LEVEL_ICON_MAP: Record<number, string> = { 1: 'seedling', 2: 'leaf', 3: 'tree', 4: 'trophy' };

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

const AnimatedListItem = React.memo(({ children, index }: { children: React.ReactNode; index: number }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(scaleHeight(16))).current;

	useEffect(() => {
		const delay = Math.min(index, 30) * 30;
		const anim = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay, useNativeDriver: true }),
			Animated.timing(translateY, { toValue: 0, duration: 250, delay, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, []);

	return <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>{children}</Animated.View>;
});

const ProverbListScreen = () => {
	const scrollRef = useRef<FlatList>(null);
	const searchInputRef = useRef<TextInput>(null);

	const emptyImage = require('@/assets/images/no-data.png');
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
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');

	const [levelItems, setLevelItems] = useState(LEVEL_DROPDOWN_ITEMS);
	const [categoryItems, setCategoryItems] = useState(FIELD_DROPDOWN_ITEMS);

	useBlockBackHandler(true);

	const fetchData = () => {
		const allData = ProverbServices.selectProverbList();
		let filtered = [...allData];

		if (keyword.trim()) {
			const lowerKeyword = keyword.trim().toLowerCase();
			filtered = filtered.filter((item) => item.proverb?.toLowerCase().includes(lowerKeyword) || item.meaning?.toLowerCase().includes(lowerKeyword) || item.longMeaning?.toLowerCase().includes(lowerKeyword));
		}
		if (categoryValue !== '전체') {
			filtered = filtered.filter((item) => item.category?.trim() === categoryValue);
		}
		if (levelValue !== '전체') {
			filtered = filtered.filter((item) => item.levelName?.trim() === levelValue);
		}
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

	useFocusEffect(
		useCallback(() => {
			setKeyword('');
			setCategoryValue('전체');
			setLevelValue('전체');
			setShowFavoritesOnly(false);
			setPage(1);
			setVisibleList([]);
			setMainList([]);
			loadFavorites();
			fetchData();
		}, []),
	);

	const loadFavorites = async () => {
		const favorites = await getFavorites();
		setFavoriteIds(favorites);
	};

	const handleToggleFavorite = async (id: number) => {
		const isNowFavorite = await toggleFavorite(id);
		await loadFavorites();
		if (isNowFavorite) {
			setToastMessage('즐겨찾기 추가');
			setShowToast(true);
		}
	};

	const onRefresh = () => {
		setRefreshing(true);
		fetchData();
		setRefreshing(false);
	};

	const loadMoreData = () => {
		const nextPage = page + 1;
		const end = nextPage * PAGE_SIZE;
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
		setFieldOpen(false);
		setLevelOpen(false);
		Keyboard.dismiss();
		setTimeout(() => {
			setKeyword('');
			setCategoryValue('전체');
			setLevelValue('전체');
			scrollToTop();
		}, 50);
	};

	const getLevelIcon = (level: number) => {
		const name = LEVEL_ICON_MAP[level];
		return name ? <IconComponent type="FontAwesome6" name={name} size={scaledSize(14)} color="#fff" /> : null;
	};

	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
				<TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
					<View style={{ flex: 1 }}>
						<View style={styles.container}>
							<View style={styles.filterCard}>
								<View style={styles.searchRow}>
									<TextInput
										ref={searchInputRef}
										style={styles.input}
										placeholder="속담이나 의미를 입력해주세요"
										placeholderTextColor="#94A3B8"
										onChangeText={(text) => {
											setKeyword(text);
											setFieldOpen(false);
											setLevelOpen(false);
										}}
										value={keyword}
									/>
									{(keyword.trim() !== '' || levelValue !== '전체' || categoryValue !== '전체') && (
										<TouchableOpacity style={styles.resetButtonInline} onPress={handleReset}>
											<Icon name="rotate-right" size={scaledSize(18)} color="#64748B" />
										</TouchableOpacity>
									)}
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
											listMode="SCROLLVIEW"
											maxHeight={scaleHeight(200)}
											scrollViewProps={{ nestedScrollEnabled: true }}
											dropDownContainerStyle={{ ...styles.dropdownListLevel, maxHeight: scaleHeight(200), overflow: 'visible', zIndex: 3000 }}
											onChangeValue={() => scrollToTop()}
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
											onChangeValue={() => scrollToTop()}
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
													style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: scaleHeight(14), paddingHorizontal: scaleWidth(16), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
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
											modalTitleStyle={{ fontSize: scaledSize(16), fontWeight: 'bold', color: '#334155', textAlign: 'center', paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(16), paddingRight: scaleWidth(40) }}
											closeIconStyle={{ marginTop: scaleHeight(3), width: scaleWidth(24), height: scaleWidth(24) }}
											closeIconContainerStyle={{ position: 'absolute', right: scaleWidth(12), top: scaleHeight(12), padding: scaleWidth(4), zIndex: 1 }}
										/>
									</View>
								</View>
								<View style={styles.listCountWrapper}>
									<TouchableOpacity
										style={[styles.favoriteFilterButton, showFavoritesOnly && styles.favoriteFilterButtonActive]}
										onPress={() => {
											setShowFavoritesOnly(!showFavoritesOnly);
											scrollToTop();
										}}>
										<Icon name="star" solid={showFavoritesOnly} size={scaledSize(14)} color={showFavoritesOnly ? '#FBBF24' : '#94A3B8'} />
										<Text style={[styles.favoriteFilterText, showFavoritesOnly && styles.favoriteFilterTextActive]}>즐겨찾기</Text>
									</TouchableOpacity>
									<Text style={styles.listCountText}>총 {mainList.length}개가 검색되었어요!</Text>
								</View>
							</View>
						</View>

						<View style={{ flex: 1, zIndex: 0 }}>
							<FlatList
								ref={scrollRef}
								data={visibleList}
								scrollEnabled={!fieldOpen && !levelOpen}
								keyExtractor={(item) => item.id.toString()}
								refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
								onEndReached={loadMoreData}
								onEndReachedThreshold={0.5}
								onScroll={(event) => {
									const offsetY = event.nativeEvent.contentOffset.y;
									setShowScrollTop(offsetY > 100);
								}}
								scrollEventThrottle={16}
								keyboardShouldPersistTaps="handled"
								ListEmptyComponent={() => (
									<View style={[styles.emptyWrapper, { height: '100%', marginTop: scaleHeight(40) }]}>
										<FastImage source={emptyImage} style={styles.emptyImage} resizeMode="contain" />
										<Text style={styles.emptyText}>앗! 조건에 맞는 속담이 없어요.{'\n'}다른 검색어나 필터를 사용해보세요!</Text>
									</View>
								)}
								contentContainerStyle={styles.flatListCotent}
								renderItem={({ item, index }) => {
									const isLast = index === visibleList.length - 1;
									const matchedItem = FIELD_DROPDOWN_ITEMS.find((i) => i.value === item.category) as { iconType?: string; iconName?: string } | undefined;
									return (
										<AnimatedListItem index={index}>
											<TouchableOpacity
												style={[styles.itemBox, { marginBottom: isLast ? scaleHeight(24) : scaleHeight(12) }]}
												onPress={() => {
													setSelectedProverb(item);
													setShowDetailModal(true);
												}}>
												<View style={styles.proverbBlock}>
													<View style={styles.badgeInlineRow}>
														<View style={{ flexDirection: 'row', gap: scaleWidth(6) }}>
															<View style={[styles.badge, { backgroundColor: getLevelColor(item.level), flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(4) }]}>
																{getLevelIcon(item.level)}
																<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>{LEVEL_NAME_MAP[item.level] ?? item.levelName}</Text>
															</View>
															<View style={[styles.badge2, { backgroundColor: getCategoryColor(item.category), flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleWidth(8) }]}>
																{matchedItem?.iconType && matchedItem?.iconName && <IconComponent type={matchedItem.iconType} name={matchedItem.iconName} size={scaledSize(14)} color="#fff" />}
																<Text style={[styles.badgeText, { marginLeft: scaleWidth(4) }]}>{item.category || '미지정'}</Text>
															</View>
														</View>

														<TouchableOpacity
															onPress={(e) => {
																e.stopPropagation();
																handleToggleFavorite(item.id);
															}}
															hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
															<Icon name="star" solid={favoriteIds.includes(item.id)} size={scaledSize(18)} color={favoriteIds.includes(item.id) ? '#FBBF24' : '#CBD5E1'} />
														</TouchableOpacity>
													</View>

													<View style={styles.rowWithArrow}>
														<View style={{ flex: 1 }}>
															<Text style={styles.proverbTextMulti}>{item.proverb}</Text>
															<Text style={styles.listMeaningText}>- {item.longMeaning}</Text>
														</View>
														<Icon name="chevron-right" size={scaledSize(16)} color="#CBD5E1" />
													</View>
												</View>

												{Array.isArray(item.sameProverb) && item.sameProverb.filter((p) => p.trim()).length > 0 && (
													<View style={styles.sameProverbBox}>
														<Text style={styles.sameProverbTitle}>비슷한 속담</Text>
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

						{showScrollTop && (
							<Animated.View style={[styles.scrollTopButton, { opacity: showScrollTop ? 1 : 0 }]}>
								<TouchableOpacity onPress={scrollToTop} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
									<IconComponent type="fontawesome6" name="arrow-up" size={scaledSize(20)} color="#fff" />
								</TouchableOpacity>
							</Animated.View>
						)}

						<ProverbDetailModal visible={showDetailModal} proverb={selectedProverb} onClose={() => setShowDetailModal(false)} onFavoriteChange={() => loadFavorites()} />
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
			<FavoriteToast visible={showToast} message={toastMessage} onHide={() => setShowToast(false)} />
		</SafeAreaView>
	);
};

export default ProverbListScreen;

const styles = StyleSheet.create({
	main: { flex: 1, backgroundColor: '#F8FAFC' },
	filterCard: { backgroundColor: '#fff', padding: scaleWidth(16), borderRadius: scaleWidth(16), marginBottom: scaleHeight(8), shadowColor: '#000', shadowOffset: { width: 0, height: scaleHeight(2) }, shadowOpacity: 0.05, shadowRadius: scaleWidth(8), overflow: 'visible' },
	input: { flex: 1, height: scaleHeight(44), borderWidth: 1, borderColor: '#CBD5E1', borderRadius: scaleWidth(8), fontSize: scaledSize(14), paddingHorizontal: scaleWidth(12), paddingVertical: 0, marginBottom: scaleHeight(12), textAlignVertical: 'center' },
	scrollTopButton: { position: 'absolute', right: scaleWidth(16), bottom: scaleHeight(16), backgroundColor: '#3B82F6', width: scaleWidth(40), height: scaleWidth(40), borderRadius: scaleWidth(20), justifyContent: 'center', alignItems: 'center' },
	itemBox: { backgroundColor: '#fff', padding: scaleWidth(20), borderRadius: scaleWidth(16), marginBottom: scaleHeight(16), borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: scaleHeight(2) }, shadowOpacity: 0.05, shadowRadius: scaleWidth(8) },
	badge: { paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4), borderRadius: scaleWidth(12), backgroundColor: '#F1F5F9' },
	badge2: { paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4), borderRadius: scaleWidth(12), backgroundColor: '#F1F5F9' },
	badgeText: { color: '#fff', marginTop: scaleHeight(1), fontSize: scaledSize(12), fontWeight: '600' },
	filterDropdownRow: { flexDirection: 'row', marginBottom: scaleHeight(8) },
	dropdownWrapper: { flex: 1, marginBottom: scaleHeight(6), marginRight: scaleWidth(6) },
	dropdownWrapperLast: { flex: 1, marginBottom: scaleHeight(6), marginRight: scaleWidth(6) },
	listCountWrapper: { marginTop: scaleHeight(4), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scaleHeight(3) },
	listCountText: { fontSize: scaledSize(14), color: '#64748B' },
	emptyWrapper: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: scaleWidth(20) },
	emptyImage: { width: scaleWidth(200), height: scaleWidth(200), marginBottom: scaleHeight(20) },
	emptyText: { fontSize: scaledSize(16), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(22) },
	dropdownLevel: { backgroundColor: '#fff', borderColor: '#CBD5E1', height: scaleHeight(44), paddingHorizontal: scaleWidth(12) },
	dropdownField: { backgroundColor: '#fff', borderColor: '#CBD5E1', height: scaleHeight(44), paddingHorizontal: scaleWidth(12) },
	dropdownListLevel: { backgroundColor: '#fff', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: scaleWidth(12) },
	dropdownListField: { backgroundColor: '#fff', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: scaleWidth(12) },
	sameProverbBox: { marginTop: scaleHeight(10), padding: scaleWidth(10), backgroundColor: '#F1F5F9', borderRadius: scaleWidth(10) },
	sameProverbTitle: { fontSize: scaledSize(14), color: '#22C55E', fontWeight: '600', marginBottom: scaleHeight(6) },
	sameProverbText: { fontSize: scaledSize(13), color: '#334155', fontWeight: '500', lineHeight: scaleHeight(22) },
	badgeInlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(10) },
	proverbBlock: { marginBottom: scaleHeight(6) },
	proverbTextMulti: { fontSize: scaledSize(18), fontWeight: 'bold', color: '#334155', lineHeight: scaleHeight(26), marginBottom: scaleHeight(8) },
	container: { zIndex: 10, paddingHorizontal: scaleWidth(16), overflow: 'visible' },
	flatListCotent: { paddingTop: scaleHeight(12), paddingHorizontal: scaleWidth(16), paddingBottom: scaleHeight(60) },
	searchRow: { flexDirection: 'row', alignItems: 'center' },
	resetButtonInline: { marginLeft: scaleWidth(8), backgroundColor: '#F1F5F9', paddingHorizontal: scaleWidth(12), height: scaleHeight(44), borderRadius: scaleWidth(8), justifyContent: 'center', alignItems: 'center', marginBottom: scaleHeight(10) },
	listMeaningText: { fontSize: scaledSize(14), color: '#334155', lineHeight: scaleHeight(20), marginTop: scaleHeight(2) },
	rowWithArrow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	favoriteFilterButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(6), borderRadius: scaleWidth(20), borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', gap: scaleWidth(6) },
	favoriteFilterButtonActive: { backgroundColor: '#FFFBEB', borderColor: '#FBBF24' },
	favoriteFilterText: { fontSize: scaledSize(13), color: '#94A3B8', fontWeight: '600' },
	favoriteFilterTextActive: { color: '#F97316' },
});
