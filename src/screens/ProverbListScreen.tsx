/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
	Modal,
	ScrollView,
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
import DeviceInfo from 'react-native-device-info';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { getCategoryColor, getLevelColor, getFieldIcon } from './common/CommonProverbModule';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import FavoriteToast from './common/FavoriteToast';


const PAGE_SIZE = 30;

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color="#64748B" />,
	labelStyle: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
	},
};

const COMMON_ALL_OPTION2 = {
	label: '전체',
	value: '전체',
	iconType: 'FontAwesome6',
	iconName: 'clipboard-list',
	iconColor: '#64748B',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={scaledSize(16)} color="#64748B" />,
	labelStyle: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
	},
};

// '초급': '#22C55E',
//    '중급': '#93C5FD',
//    '고급': '#22C55E',
//    '특급': '#334155',

const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION2,
	{
		label: '초급',
		value: '초급',
		icon: () => <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(16)} color="#22C55E" />,
	},
	{
		label: '중급',
		value: '중급',
		icon: () => <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(16)} color="#FCD34D" />,
	},
	{
		label: '고급',
		value: '고급',
		icon: () => <IconComponent type="FontAwesome6" name="tree" size={scaledSize(16)} color="#FB923C" />,
	},
	{
		label: '특급',
		value: '특급',
		icon: () => <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(16)} color="#EF4444" />,
	},
];
const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '감정/심리',
		value: '감정/심리',
		iconType: 'FontAwesome6',
		iconName: 'heart',
		iconColor: '#F87171',
		icon: () => <IconComponent type="FontAwesome6" name="heart" size={scaledSize(16)} color="#F87171" />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		iconType: 'FontAwesome6',
		iconName: 'users',
		iconColor: '#93C5FD',
		icon: () => <IconComponent type="FontAwesome6" name="users" size={scaledSize(16)} color="#93C5FD" />,
	},
	{
		label: '도덕/교훈',
		value: '도덕/교훈',
		iconType: 'FontAwesome6',
		iconName: 'scale-balanced',
		iconColor: '#93C5FD',
		icon: () => <IconComponent type="FontAwesome6" name="scale-balanced" size={scaledSize(16)} color="#93C5FD" />,
	},
	{
		label: '지혜/판단',
		value: '지혜/판단',
		iconType: 'FontAwesome6',
		iconName: 'brain',
		iconColor: '#FCD34D',
		icon: () => <IconComponent type="FontAwesome6" name="brain" size={scaledSize(16)} color="#FCD34D" />,
	},
	{
		label: '성공/의지',
		value: '성공/의지',
		iconType: 'FontAwesome6',
		iconName: 'medal',
		iconColor: '#BFDBFE',
		icon: () => <IconComponent type="FontAwesome6" name="medal" size={scaledSize(16)} color="#BFDBFE" />,
	},
	{
		label: '위기/고난',
		value: '위기/고난',
		iconType: 'FontAwesome',
		iconName: 'exclamation-triangle',
		iconColor: '#F87171',
		icon: () => <IconComponent type="FontAwesome" name="exclamation-triangle" size={scaledSize(16)} color="#F87171" />,
	},
	{
		label: '언어/표현',
		value: '언어/표현',
		iconType: 'FontAwesome6',
		iconName: 'comment-dots',
		iconColor: '#BFDBFE',
		icon: () => <IconComponent type="FontAwesome6" name="comment-dots" size={scaledSize(16)} color="#BFDBFE" />,
	},
	{
		label: '생활/사회',
		value: '생활/사회',
		iconType: 'FontAwesome6',
		iconName: 'globe',
		iconColor: '#FCA5A5',
		icon: () => <IconComponent type="FontAwesome6" name="globe" size={scaledSize(16)} color="#FCA5A5" />,
	},
	{
		label: '성격/결함',
		value: '성격/결함',
		iconType: 'FontAwesome6',
		iconName: 'user-slash',
		iconColor: '#94A3B8',
		icon: () => <IconComponent type="FontAwesome6" name="user-slash" size={scaledSize(16)} color="#94A3B8" />,
	},
	{
		label: '성격/덕목',
		value: '성격/덕목',
		iconType: 'FontAwesome6',
		iconName: 'handshake',
		iconColor: '#22C55E',
		icon: () => <IconComponent type="FontAwesome6" name="handshake" size={scaledSize(16)} color="#22C55E" />,
	},
	{
		label: '인생/운명',
		value: '인생/운명',
		iconType: 'FontAwesome6',
		iconName: 'dice',
		iconColor: '#FDE68A',
		icon: () => <IconComponent type="FontAwesome6" name="dice" size={scaledSize(16)} color="#FDE68A" />,
	},
	{
		label: '학습/성장',
		value: '학습/성장',
		iconType: 'FontAwesome6',
		iconName: 'book-open',
		iconColor: '#22C55E',
		icon: () => <IconComponent type="FontAwesome6" name="book-open" size={scaledSize(16)} color="#22C55E" />,
	},
	{
		label: '결단/선택',
		value: '결단/선택',
		iconType: 'FontAwesome6',
		iconName: 'toggle-on',
		iconColor: '#22C55E',
		icon: () => <IconComponent type="FontAwesome6" name="toggle-on" size={scaledSize(16)} color="#22C55E" />,
	},
	{
		label: '전략/경쟁',
		value: '전략/경쟁',
		iconType: 'FontAwesome6',
		iconName: 'chess-knight',
		iconColor: '#DC2626',
		icon: () => <IconComponent type="FontAwesome6" name="chess-knight" size={scaledSize(16)} color="#DC2626" />,
	},
	{
		label: '생존/현실',
		value: '생존/현실',
		iconType: 'FontAwesome6',
		iconName: 'person-digging',
		iconColor: '#F97316',
		icon: () => <IconComponent type="FontAwesome6" name="person-digging" size={scaledSize(16)} color="#F97316" />,
	},
	{
		label: '사랑/가정',
		value: '사랑/가정',
		iconType: 'FontAwesome6',
		iconName: 'people-roof',
		iconColor: '#F87171',
		icon: () => <IconComponent type="FontAwesome6" name="people-roof" size={scaledSize(16)} color="#F87171" />,
	},
	{
		label: '기타',
		value: '기타',
		iconType: 'FontAwesome6',
		iconName: 'circle-question',
		iconColor: '#E2E8F0',
		icon: () => <IconComponent type="FontAwesome6" name="circle-question" size={scaledSize(16)} color="#E2E8F0" />,
	},
];

// 라벨 → 아이콘 포함 드롭다운 아이템 매핑 (항목 재설정 시 아이콘 유지)
const LEVEL_ITEM_MAP: Record<string, any> = Object.fromEntries(LEVEL_DROPDOWN_ITEMS.map((i) => [i.value, i]));
const FIELD_ITEM_MAP: Record<string, any> = Object.fromEntries(FIELD_DROPDOWN_ITEMS.map((i) => [i.value, i]));

const buildLevelItems = (levels: string[]) => [COMMON_ALL_OPTION2, ...levels.map((lv) => LEVEL_ITEM_MAP[lv] ?? { label: lv, value: lv })];
const buildFieldItems = (fields: string[]) => [COMMON_ALL_OPTION, ...fields.map((f) => FIELD_ITEM_MAP[f] ?? { label: f, value: f })];

/**
 * FlatList 아이템 fade+slide-up 진입 애니메이션 래퍼
 */
const AnimatedListItem = React.memo(({ children, index }: { children: React.ReactNode; index: number }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(scaleHeight(16))).current;

	useEffect(() => {
		// 처음 30개만 stagger, 이후는 즉시 표시 (스크롤 성능 보호)
		const delay = Math.min(index, 30) * 30;
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
	const [showFavoriteModal, setShowFavoriteModal] = useState(false);
	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	const [favoriteProverbs, setFavoriteProverbs] = useState<MainDataType.Proverb[]>([]);
	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');

	const [levelItems, setLevelItems] = useState([{ label: '', value: '' }]);
	const [categoryItems, setCategoryItems] = useState([{ label: '', value: '' }]);

	const isTablet = DeviceInfo.isTablet();

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
			const lowerKeyword = keyword.trim().toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.proverb?.toLowerCase().includes(lowerKeyword) ||
					item.meaning?.toLowerCase().includes(lowerKeyword) ||
					item.longMeaning?.toLowerCase().includes(lowerKeyword),
			);
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

	// 🔄 화면 포커스 시 최초 1회 초기화 (필터 상태도 리셋)
	useFocusEffect(
		useCallback(() => {
			handleReset(); // keyword, fieldValue 등 초기화
		}, []),
	);
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
				return <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(14)} color="#fff" />;
			case 2:
				return <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(14)} color="#fff" />;
			case 3:
				return <IconComponent type="FontAwesome6" name="tree" size={scaledSize(14)} color="#fff" />;
			case 4:
				return <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(14)} color="#fff" />;
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
						<View style={styles.container}>
							<View style={styles.filterCard}>
								<View style={styles.searchRow}>
									<View style={styles.searchInputWrapper}>
										<Icon name="magnifying-glass" size={scaledSize(16)} color="#94A3B8" style={styles.searchIcon} />
										<TextInput
											ref={searchInputRef}
											style={[styles.input, styles.searchInput]}
											placeholder="속담이나 의미를 입력해주세요"
											placeholderTextColor="#94A3B8"
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
											listItemLabelStyle={{ marginLeft: scaleWidth(6), fontSize: scaledSize(14) }}
											labelStyle={{ fontSize: scaledSize(14), color: '#334155' }}
											iconContainerStyle={{ marginRight: scaleWidth(8) }}
											showArrowIcon={true} // 드롭다운 화살표
											showTickIcon={false} // 선택 시 오른쪽 체크 표시 제거
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
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: scaleWidth(12) }}>
														{typeof item.icon === 'function' ? item.icon() : item.icon}
													</View>
													<Text style={{ fontSize: scaledSize(15), color: '#334155', flex: 1 }}>{item.label}</Text>
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
											closeIconStyle={{
												marginTop: scaleHeight(3),
												width: scaleWidth(24),
												height: scaleWidth(24),
											}}
											closeIconContainerStyle={{
												position: 'absolute',
												right: scaleWidth(12),
												top: scaleHeight(12),
												padding: scaleWidth(4),
												zIndex: 1,
											}}
										/>
									</View>

									{/* 초기화 버튼 */}
									{/* <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                  <Icon name='rotate-right' size={scaledSize(20)} color='#64748B' />
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
										<Icon name="star" solid={showFavoritesOnly} size={scaledSize(14)} color={showFavoritesOnly ? '#FBBF24' : '#94A3B8'} />
										<Text style={[styles.favoriteFilterText, showFavoritesOnly && styles.favoriteFilterTextActive]}>
											즐겨찾기
										</Text>
									</TouchableOpacity>
									<Text style={styles.listCountText}>총 {mainList.length}개가 검색되었어요!</Text>
								</View>
							</View>
						</View>

						{/* 리스트 영역 */}
						<View style={{ flex: 1, zIndex: 0 }}>
							<FlatList
								ref={scrollRef}
								data={visibleList}
								scrollEnabled={!fieldOpen && !levelOpen} // ⛔ 드롭다운 열려 있으면 스크롤 막기
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
										<Text style={styles.emptyText}>
											앗! 조건에 맞는 속담가 없어요.{'\n'}다른 검색어나 필터를 사용해보세요!
										</Text>
									</View>
								)}
								contentContainerStyle={styles.flatListCotent}
								renderItem={({ item, index }) => {
									const isLast = index === visibleList.length - 1;
									return (
										<AnimatedListItem index={index}>
										<TouchableOpacity
											style={[
												styles.itemBox,
												{ marginBottom: isLast ? scaleHeight(24) : scaleHeight(12) },
											]}
											onPress={() => {
												setSelectedProverb(item);
												setShowDetailModal(true);
											}}>
											<View style={styles.proverbBlock}>
												<View style={styles.badgeInlineRow}>
													<View style={{ flexDirection: 'row', gap: scaleWidth(6) }}>
														<View
															style={[
																styles.badge,
																{
																	backgroundColor: getLevelColor(item.levelName),
																	flexDirection: 'row',
																	alignItems: 'center',
																	paddingHorizontal: scaleWidth(8),
																	paddingVertical: scaleHeight(4),
																},
															]}>
															{getLevelIcon(item.level)}
															<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>{item.levelName}</Text>
														</View>
														<View
															style={[
																styles.badge2,
																{
																	backgroundColor: getCategoryColor(item.category),
																	flexDirection: 'row',
																	alignItems: 'center',
																	paddingHorizontal: scaleWidth(8),
																},
															]}>
															{item?.category && getFieldIcon(item.category)}
															<Text style={[styles.badgeText, { marginLeft: scaleWidth(4) }]}>{item.category || '미지정'}</Text>
														</View>
													</View>

													{/* ✅ 즐겨찾기 아이콘 */}
													<TouchableOpacity
														onPress={(e) => {
															e.stopPropagation();
															handleToggleFavorite(item.id);
														}}
														hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
														<Icon
															name="star"
															solid={favoriteIds.includes(item.id)}
															size={scaledSize(18)}
															color={favoriteIds.includes(item.id) ? '#FBBF24' : '#CBD5E1'}
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
													<Icon name="chevron-right" size={scaledSize(16)} color="#CBD5E1" />
												</View>
											</View>

											{Array.isArray(item.sameProverb) && item.sameProverb.filter((p) => p.trim()).length > 0 && (
												<View style={styles.sameProverbBox}>
													<View style={styles.sameProverbTitleRow}>
														<IconComponent type="FontAwesome6" name="equals" size={scaledSize(13)} color="#22C55E" />
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

						{/* 스크롤 최상단 이동 버튼 - fade 애니메이션 */}
						{showScrollTop && (
							<Animated.View style={[styles.scrollTopButton, { opacity: showScrollTop ? 1 : 0 }]}>
								<TouchableOpacity onPress={scrollToTop} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
									<IconComponent type="fontawesome6" name="arrow-up" size={scaledSize(20)} color="#fff" />
								</TouchableOpacity>
							</Animated.View>
						)}

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
			<FavoriteToast visible={showToast} message={toastMessage} onHide={() => setShowToast(false)} />
		</SafeAreaView>
	);
};

export default ProverbListScreen;

const styles = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: '#F8FAFC',
	},
	filterCard: {
		backgroundColor: '#fff',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(16),
		marginBottom: scaleHeight(8),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(8),
		overflow: 'visible', // ✅ 추가
	},
	input: {
		flex: 1,
		height: scaleHeight(44),
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: scaleWidth(8),
		fontSize: scaledSize(14), // ⬅️ 이 값이 placeholder에도 적용됩니다
		paddingHorizontal: scaleWidth(12),
		paddingVertical: 0,
		marginBottom: scaleHeight(12),
		textAlignVertical: 'center',
	},
	filterRow: {
		flexDirection: 'row',
	},
	dropdown: {
		backgroundColor: '#fff',
		borderColor: '#CBD5E1',
		height: scaleHeight(44),
	},
	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(16),
		bottom: scaleHeight(16),
		backgroundColor: '#3B82F6',
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemBox: {
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(16),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#F1F5F9',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(8),
	},
	modalContainer: {
		width: '90%',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		overflow: 'hidden',
		maxHeight: '85%',
	},

	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		flexShrink: 1,
	},

	modalBody: {
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(16),
		paddingBottom: scaleHeight(16),
	},

	modalSection: {
		marginBottom: scaleHeight(16),
		backgroundColor: '#F8FAFC',
		padding: scaleWidth(12),
		borderRadius: scaleWidth(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(4),
	},

	modalLabel: {
		fontSize: scaledSize(17),
		fontWeight: 'bold',
		color: '#22C55E',
		marginBottom: scaleHeight(8),
	},
	modalText: {
		fontSize: scaledSize(17), // ⬆️ 기존 15에서 증가
		color: '#334155',
		lineHeight: scaleHeight(26),
	},

	modalText2: {
		fontSize: scaledSize(14), // ⬆️ 기존 15에서 증가
		color: '#334155',
		lineHeight: scaleHeight(26),
	},
	modalHighlightTitle: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#22C55E',
		marginBottom: scaleHeight(4),
	},
	modalHighlightText: {
		fontSize: scaledSize(15),
		color: '#334155',
		lineHeight: scaleHeight(22),
	},

	modalCloseButton: {
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(14),
		alignItems: 'center',
		borderBottomLeftRadius: scaleWidth(20),
		borderBottomRightRadius: scaleWidth(20),
	},
	modalCloseButtonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	proverbText: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(8),
	},
	badgeRow: {
		flexDirection: 'row',
		gap: scaleWidth(8),
		justifyContent: 'center',
		alignItems: 'center',
	},
	badge: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		backgroundColor: '#F1F5F9',
	},
	badge2: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		backgroundColor: '#F1F5F9',
	},
	badgeText: {
		color: '#fff',
		marginTop: scaleHeight(1),
		fontSize: scaledSize(12),
		fontWeight: '600',
	},
	filterDropdownRow: {
		flexDirection: 'row',
		marginBottom: scaleHeight(8),
	},
	dropdownWrapper: {
		flex: 1,
		marginBottom: scaleHeight(6),
		marginRight: scaleWidth(6),
	},
	dropdownPlaceholder: {
		textAlign: 'center',
		color: '#94A3B8',
	},
	dropdownList: {
		backgroundColor: '#fff',
		borderColor: '#E2E8F0',
		borderWidth: 1.2,
		borderRadius: scaleWidth(12),
	},
	dropdownWrapperLast: {
		flex: 1,
		marginBottom: scaleHeight(6),
		marginRight: scaleWidth(6),
	},
	listCountWrapper: {
		marginTop: scaleHeight(4),
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(3),
	},
	listCountText: {
		fontSize: scaledSize(14),
		color: '#64748B',
	},
	resetButton: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F1F5F9',
		height: scaleHeight(50),
		width: scaleWidth(44),
		borderRadius: scaleWidth(8),
	},
	resetButtonText: {
		color: '#64748B',
		fontSize: scaledSize(14),
		fontWeight: 'bold',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(20),
	},
	emptyImage: {
		width: scaleWidth(200),
		height: scaleWidth(200),
		marginBottom: scaleHeight(20),
	},
	emptyText: {
		fontSize: scaledSize(16),
		color: '#64748B',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	modalProverbText: {
		fontSize: scaledSize(25),
		fontWeight: 'bold',
		color: '#334155',
		textAlign: 'center',
		lineHeight: scaleHeight(30),
	},
	modalProverbBox: {
		backgroundColor: '#F1F5F9',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		marginBottom: scaleHeight(20),
		alignItems: 'center',
	},
	modalHeaderTitle: {
		fontSize: scaledSize(22),
		marginTop: scaleHeight(5),
		fontWeight: 'bold',
		color: '#334155',
		textAlign: 'center',
	},
	bannerContainer: {
		backgroundColor: '#fff',
		alignItems: 'center',
		paddingVertical: scaleHeight(6),
		borderColor: '#CBD5E1',
		zIndex: 999,
	},
	dropdownLevel: {
		backgroundColor: '#fff',
		borderColor: '#CBD5E1',
		height: scaleHeight(44),
		paddingHorizontal: scaleWidth(12),
	},
	dropdownField: {
		backgroundColor: '#fff',
		borderColor: '#CBD5E1',
		height: scaleHeight(44),
		paddingHorizontal: scaleWidth(12),
	},
	dropdownListLevel: {
		backgroundColor: '#fff',
		borderColor: '#CBD5E1',
		borderWidth: 1,
		borderRadius: scaleWidth(12),
	},
	dropdownListField: {
		backgroundColor: '#fff',
		borderColor: '#CBD5E1',
		borderWidth: 1,
		borderRadius: scaleWidth(12),
	},
	sameProverbBox: {
		marginTop: scaleHeight(10),
		padding: scaleWidth(10),
		backgroundColor: '#F1F5F9',
		borderRadius: scaleWidth(10),
	},
	sameProverbTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		marginBottom: scaleHeight(6),
	},
	sameProverbTitle: {
		fontSize: scaledSize(14),
		color: '#22C55E',
		fontWeight: '600',
	},
	sameProverbText: {
		fontSize: scaledSize(13),
		color: '#334155',
		fontWeight: '500',
		lineHeight: scaleHeight(22),
	},
	modalHighlightBox: {
		backgroundColor: '#EFF6FF',
		borderWidth: 1,
		borderColor: '#DBEAFE',
		padding: scaleWidth(12),
		borderRadius: scaleWidth(10),
		marginBottom: scaleHeight(16),
		marginTop: scaleHeight(12),
	},
	proverbRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(6),
	},
	proverbTextSingle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		flex: 1,
		marginRight: scaleWidth(8),
	},
	badgeInlineRow: {
		flexDirection: 'row',
		justifyContent: 'space-between', // ✅ 추가
		alignItems: 'center', // ✅ 추가
		marginBottom: scaleHeight(10),
	},
	proverbBlock: {
		marginBottom: scaleHeight(6),
	},
	proverbTextMulti: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		lineHeight: scaleHeight(26),
		marginBottom: scaleHeight(8),
	},
	sameProverbBoxModal: {
		marginTop: scaleHeight(10),
		padding: scaleWidth(12),
		backgroundColor: '#EFF6FF',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#DBEAFE',
	},
	sameProverbTitleModal: {
		fontSize: scaledSize(13),
		color: '#22C55E',
		fontWeight: '700',
		marginBottom: scaleHeight(6),
	},
	sameProverbTextModal: {
		fontSize: scaledSize(13),
		color: '#334155',
		paddingVertical: scaleHeight(2),
		paddingLeft: scaleWidth(10),
	},
	container: {
		zIndex: 10,
		paddingHorizontal: scaleWidth(16),
		overflow: 'visible', // ✅ 추가
	},
	flatListCotent: {
		paddingTop: scaleHeight(12),
		paddingHorizontal: scaleWidth(16),
		paddingBottom: scaleHeight(60),
	},
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	searchInputWrapper: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		marginBottom: scaleHeight(12),
	},
	searchIcon: {
		position: 'absolute',
		left: scaleWidth(12),
		top: scaleHeight(14),
		zIndex: 1,
	},
	searchInput: {
		flex: 0,
		width: '100%',
		paddingLeft: scaleWidth(36),
		marginBottom: 0,
	},
	resetButtonInline: {
		marginLeft: scaleWidth(8),
		backgroundColor: '#F1F5F9',
		paddingHorizontal: scaleWidth(12),
		height: scaleHeight(44),
		borderRadius: scaleWidth(8),
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	modalHangulText: {
		fontSize: scaledSize(17),
		color: '#334155',
		marginBottom: scaleHeight(8),
	},
	modalCharBreakdown: {
		fontSize: scaledSize(15),
		color: '#334155',
		marginBottom: scaleHeight(8),
		lineHeight: scaleHeight(22),
	},
	modalCharRadicals: {
		fontSize: scaledSize(14),
		color: '#64748B',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(4),
	},
	charMeaningWrapper: {
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(8),
	},
	modalCharMeaning: {
		fontSize: scaledSize(14),
		color: '#334155',
		lineHeight: scaleHeight(22),
	},
	charRadicalWrapper: {
		marginTop: scaleHeight(8),
	},
	meaningRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		flexWrap: 'nowrap',
		width: '100%',
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(4),
	},
	meaningItem: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#334155',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},

	radicalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		flexWrap: 'nowrap',
		width: '100%',
	},
	radicalItem: {
		flex: 1,
		fontSize: scaledSize(12),
		color: '#64748B',
		textAlign: 'center',
		lineHeight: scaleHeight(18),
	},
	modalCharacterGrid: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: scaleHeight(5),
		marginBottom: scaleHeight(20),
		gap: scaleWidth(8),
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(10),
		backgroundColor: '#F1F5F9', // 밝은 회색 배경
		borderRadius: scaleWidth(12),
	},

	characterColumn: {
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: scaleWidth(60), // 한 글자 너비 고정 (조정 가능)
	},

	charText: {
		fontSize: scaledSize(28), // ⬆️ 기존 24에서 증가
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(4),
	},

	meaningText: {
		fontSize: scaledSize(15), // ⬆️ 기존 13에서 증가
		color: '#334155',
		textAlign: 'center',
		marginBottom: scaleHeight(2),
	},

	radicalText: {
		fontSize: scaledSize(12), // ⬆️ 기존 11에서 증가
		color: '#64748B',
		textAlign: 'center',
	},
	hangulText: {
		fontSize: scaledSize(16), // ⬆️ 기존 13에서 증가
		color: '#22C55E',
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: scaleHeight(4),
	},
	listMeaningText: {
		fontSize: scaledSize(14),
		color: '#334155',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(2),
	},

	modalSubTitle: {
		fontSize: scaledSize(14),
		color: '#64748B',
		textAlign: 'center',
	},
	modalHeader: {
		backgroundColor: '#fff',
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		borderBottomWidth: 1,
		borderColor: '#F1F5F9',
	},

	modalHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'center', // 중앙 정렬
		alignItems: 'center',
		position: 'relative',
	},

	modalProverbTitle: {
		fontSize: scaledSize(20),
		marginTop: scaleHeight(3),
		fontWeight: 'bold',
		color: '#334155',
		textAlign: 'center',
	},

	modalCloseIcon: {
		position: 'absolute',
		right: 0,
		marginTop: scaleHeight(3),
		padding: scaleWidth(8),
	},
	rowWithArrow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	tagsWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: scaleWidth(8),
		marginTop: scaleHeight(4),
	},
	tagItem: {
		borderWidth: 1,
		borderColor: '#334155', // ✅ 테두리 검정
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		backgroundColor: '#F1F5F9', // ✅ 연한 회색 배경
	},

	tagText: {
		color: '#334155',
		fontSize: scaledSize(13),
		fontWeight: '600',
	},
	favoriteFilterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		backgroundColor: '#fff',
		gap: scaleWidth(6),
	},
	favoriteFilterButtonActive: {
		backgroundColor: '#FFFBEB',
		borderColor: '#FBBF24',
	},
	favoriteFilterText: {
		fontSize: scaledSize(13),
		color: '#94A3B8',
		fontWeight: '600',
	},
	favoriteFilterTextActive: {
		color: '#F97316',
	},
	favoriteIconWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: scaleWidth(8),
	},
	badgeAndFavoriteRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	listHangulText: {
		fontSize: scaledSize(13),
		color: '#22C55E',
		fontWeight: '600',
		marginTop: scaleHeight(2),
		marginBottom: scaleHeight(4),
	},
});
