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
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { getFavorites, toggleFavorite } from '@/utils/favoriteUtils';
import SuccessToast from './SuccessToast';

const PAGE_SIZE = 30;

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={16} color="#555" />,
	labelStyle: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
	},
};

const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '아주 쉬움',
		value: '아주 쉬움',
		icon: () => <IconComponent type="FontAwesome6" name="seedling" size={16} color="#85C1E9" />,
	},
	{
		label: '쉬움',
		value: '쉬움',
		icon: () => <IconComponent type="FontAwesome6" name="leaf" size={16} color="#F4D03F" />,
	},
	{
		label: '보통',
		value: '보통',
		icon: () => <IconComponent type="FontAwesome6" name="tree" size={16} color="#EB984E" />,
	},
	{
		label: '어려움',
		value: '어려움',
		icon: () => <IconComponent type="FontAwesome6" name="trophy" size={16} color="#E74C3C" />,
	},
];
const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '운/우연',
		value: '운/우연',
		icon: () => <IconComponent type="FontAwesome6" name="dice" size={16} color="#81ecec" />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		icon: () => <IconComponent type="FontAwesome6" name="users" size={16} color="#a29bfe" />,
	},
	{
		label: '세상 이치',
		value: '세상 이치',
		icon: () => <IconComponent type="fontawesome5" name="globe" size={16} color="#fdcb6e" />,
	},
	{
		label: '근면/검소',
		value: '근면/검소',
		icon: () => <IconComponent type="fontawesome5" name="hammer" size={16} color="#fab1a0" />,
	},
	{
		label: '노력/성공',
		value: '노력/성공',
		icon: () => <IconComponent type="fontawesome5" name="medal" size={16} color="#55efc4" />,
	},
	{
		label: '경계/조심',
		value: '경계/조심',
		icon: () => <IconComponent type="fontawesome5" name="exclamation-triangle" size={16} color="#ff7675" />,
	},
	{
		label: '욕심/탐욕',
		value: '욕심/탐욕',
		icon: () => <IconComponent type="fontawesome5" name="hand-holding-usd" size={16} color="#fd79a8" />,
	},
	{
		label: '배신/불신',
		value: '배신/불신',
		icon: () => <IconComponent type="fontawesome5" name="user-slash" size={16} color="#b2bec3" />,
	},
];

const ProverbListScreen = () => {
	const scrollRef = useRef<FlatList>(null);
	const searchInputRef = useRef<TextInput>(null);

	const emptyImage = require('@/assets/images/emptyList.png');
	const [refreshing, setRefreshing] = useState(false);
	const [keyword, setKeyword] = useState('');
	const [proverbList, setProverbList] = useState(ProverbServices.selectProverbList());
	const [visibleList, setVisibleList] = useState<MainDataType.Proverb[]>([]);
	const [page, setPage] = useState(1);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [fieldOpen, setFieldOpen] = useState(false);
	const [levelOpen, setLevelOpen] = useState(false);
	const [fieldValue, setFieldValue] = useState('전체');
	const [levelValue, setLevelValue] = useState('전체');
	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	const [fieldItems, setFieldItems] = useState([{ label: '', value: '' }]);
	const [levelItems, setLevelItems] = useState([{ label: '', value: '' }]);

	// ✅ 즐겨찾기 관련 state
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');

	useBlockBackHandler(true);

	const fetchData = () => {
		const allData = ProverbServices.selectProverbList();
		let filtered = [...allData];

		// ✅ 즐겨찾기 필터링 (최우선)
		if (showFavoritesOnly) {
			filtered = filtered.filter((item) => favoriteIds.includes(item.id));
		}

		if (keyword.trim()) {
			const lowerKeyword = keyword.trim().toLowerCase();
			filtered = filtered.filter((item) => item.proverb?.toLowerCase().includes(lowerKeyword) || item.longMeaning?.toLowerCase().includes(lowerKeyword));
		}
		if (fieldValue !== '전체') {
			filtered = filtered.filter((item) => item.category?.trim() === fieldValue);
		}
		if (levelValue !== '전체') {
			filtered = filtered.filter((item) => item.levelName?.trim() === levelValue);
		}

		setProverbList(filtered);
		setPage(1);
		setVisibleList(filtered.slice(0, PAGE_SIZE));
	};

	// 🔄 필터 변경 시 데이터만 다시 가져오기
	useEffect(() => {
		fetchData();
	}, [keyword, fieldValue, levelValue, showFavoritesOnly, favoriteIds]); // ✅ 즐겨찾기 의존성 추가

	// 🔄 화면 포커스 시 최초 1회 초기화
	useFocusEffect(
		useCallback(() => {
			setFieldOpen(false);
			setLevelOpen(false);

			setKeyword('');
			setFieldValue('전체');
			setLevelValue('전체');
			setShowFavoritesOnly(false); // ✅ 즐겨찾기 필터 초기화

			setPage(1);
			setVisibleList([]);
			setProverbList([]);

			const fieldList = ProverbServices.selectCategoryList();
			setFieldItems([{ label: '전체', value: '전체' }, ...fieldList.map((field) => ({ label: field, value: field }))]);

			const levelList = ProverbServices.selectLevelNameList();
			setLevelItems([{ label: '전체', value: '전체' }, ...levelList.map((level) => ({ label: level, value: level }))]);

			loadFavorites(); // ✅ 즐겨찾기 로드
			fetchData();
		}, []),
	);

	const onRefresh = () => {
		setRefreshing(true);
		fetchData();
		setRefreshing(false);
	};

	const loadMoreData = () => {
		const nextPage = page + 1;
		const start = (nextPage - 1) * PAGE_SIZE;
		const end = start + PAGE_SIZE;
		const newData = proverbList.slice(0, end);

		if (newData.length > visibleList.length) {
			setVisibleList(newData);
			setPage(nextPage);
		}
	};

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

	const scrollToTop = () => {
		scrollRef.current?.scrollToOffset({ animated: true, offset: 0 });
	};

	const getFieldColor = (field: string) => {
		const categoryColorMap: Record<string, string> = {
			'운/우연': '#00cec9',
			인간관계: '#6c5ce7',
			'세상 이치': '#fdcb6e',
			'근면/검소': '#e17055',
			'노력/성공': '#00b894',
			'경계/조심': '#d63031',
			'욕심/탐욕': '#e84393',
			'배신/불신': '#2d3436',
		};
		return categoryColorMap[field] || '#b2bec3';
	};

	const getLevelColor = (levelName: number) => {
		const levelColorMap: Record<string, string> = {
			1: '#2ecc71',
			2: '#F4D03F',
			3: '#EB984E',
			4: '#E74C3C',
		};
		return levelColorMap[levelName] || '#b2bec3';
	};

	const handleReset = () => {
		setFieldOpen(false);
		setLevelOpen(false);
		Keyboard.dismiss();

		setTimeout(() => {
			setKeyword('');
			setFieldValue('전체');
			setLevelValue('전체');
			setShowFavoritesOnly(false); // ✅ 즐겨찾기 필터도 초기화

			const fieldList = ProverbServices.selectCategoryList();
			setFieldItems([{ label: '전체', value: '전체' }, ...fieldList.map((field) => ({ label: field, value: field }))]);

			const levelList = ProverbServices.selectLevelNameList();
			setLevelItems([{ label: '전체', value: '전체' }, ...levelList.map((level) => ({ label: level, value: level }))]);

			scrollToTop();
		}, 50);
	};

	const getLevelIcon = (level: number) => {
		switch (level) {
			case 1:
				return <IconComponent type="FontAwesome6" name="seedling" size={14} color="#fff" />;
			case 2:
				return <IconComponent type="FontAwesome6" name="leaf" size={14} color="#fff" />;
			case 3:
				return <IconComponent type="FontAwesome6" name="tree" size={14} color="#fff" />;
			case 4:
				return <IconComponent type="FontAwesome6" name="trophy" size={14} color="#fff" />;
			default:
				return null;
		}
	};

	const getFieldIcon = (field: string) => {
		switch (field) {
			case '운/우연':
				return <IconComponent type="FontAwesome6" name="dice" size={12} color="#fff" />;
			case '인간관계':
				return <IconComponent type="FontAwesome6" name="users" size={12} color="#fff" />;
			case '세상 이치':
				return <IconComponent type="fontawesome5" name="globe" size={12} color="#fff" />;
			case '근면/검소':
				return <IconComponent type="fontawesome5" name="hammer" size={12} color="#fff" />;
			case '노력/성공':
				return <IconComponent type="fontawesome5" name="medal" size={12} color="#fff" />;
			case '경계/조심':
				return <IconComponent type="fontawesome5" name="exclamation-triangle" size={12} color="#fff" />;
			case '욕심/탐욕':
				return <IconComponent type="fontawesome5" name="hand-holding-usd" size={12} color="#fff" />;
			case '배신/불신':
				return <IconComponent type="fontawesome5" name="user-slash" size={12} color="#fff" />;
			default:
				return <IconComponent type="FontAwesome6" name="tag" size={12} color="#fff" />;
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
									<TextInput
										ref={searchInputRef}
										style={styles.input}
										placeholder="속담이나 의미를 입력해주세요"
										placeholderTextColor="#9CA3AF"
										onChangeText={(text) => {
											setKeyword(text);
											setFieldOpen(false);
											setLevelOpen(false);
										}}
										value={keyword}
									/>
									<TouchableOpacity style={styles.resetButtonInline} onPress={handleReset}>
										<Icon name="rotate-right" size={18} color="#555" />
									</TouchableOpacity>
								</View>
								<View style={styles.filterDropdownRow}>
									<View style={[styles.dropdownWrapper, { zIndex: fieldOpen ? 2000 : 1000 }]}>
										<DropDownPicker
											open={levelOpen}
											value={levelValue}
											items={LEVEL_DROPDOWN_ITEMS}
											setOpen={(open) => {
												setLevelOpen(open);
												if (open) {
													setFieldOpen(false);
												}
											}}
											setValue={setLevelValue}
											setItems={setLevelItems}
											style={styles.dropdownLevel}
											scrollViewProps={{ nestedScrollEnabled: true }}
											dropDownContainerStyle={{
												...styles.dropdownListLevel,
												overflow: 'visible',
												zIndex: 3000,
											}}
											listItemLabelStyle={{ marginLeft: scaleWidth(6), fontSize: scaledSize(14) }}
											labelStyle={{ fontSize: scaledSize(14), color: '#2c3e50' }}
											iconContainerStyle={{ marginRight: scaleWidth(8) }}
											showArrowIcon={true}
											showTickIcon={false}
											onChangeValue={() => scrollToTop()}
										/>
									</View>
									<View style={[styles.dropdownWrapperLast, { zIndex: levelOpen ? 2000 : 1000, overflow: 'visible' }]}>
										<DropDownPicker
											listMode="MODAL"
											modalTitle="카테고리 선택"
											open={fieldOpen}
											value={fieldValue}
											items={FIELD_DROPDOWN_ITEMS}
											setOpen={(open) => {
												setFieldOpen(open);
												if (open) {
													setLevelOpen(false);
												}
											}}
											setValue={setFieldValue}
											setItems={setFieldItems}
											onChangeValue={() => scrollToTop()}
											dropDownDirection="BOTTOM"
											scrollViewProps={{ nestedScrollEnabled: true }}
											style={styles.dropdownField}
											dropDownContainerStyle={{
												overflow: 'visible',
												zIndex: 3000,
												...styles.dropdownListField,
												maxHeight: scaleHeight(200),
											}}
											zIndex={5000}
											zIndexInverse={4000}
											containerStyle={{ zIndex: 5000 }}
											labelStyle={{ fontSize: scaledSize(14), color: '#2c3e50' }}
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
														borderBottomColor: '#f0f0f0',
													}}>
													<View style={{ width: scaleWidth(28), alignItems: 'center', marginRight: scaleWidth(12) }}>
														{typeof item.icon === 'function' ? item.icon() : item.icon}
													</View>
													<Text style={{ fontSize: scaledSize(15), color: '#2c3e50', flex: 1 }}>{item.label}</Text>
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
												borderColor: '#ccc',
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
												color: '#2d3436',
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
								</View>

								{/* ✅ 즐겨찾기 버튼 + 리스트 개수 */}
								<View style={styles.listCountWrapper}>
									<TouchableOpacity
										style={[styles.favoriteFilterButton, showFavoritesOnly && styles.favoriteFilterButtonActive]}
										onPress={() => {
											setShowFavoritesOnly(!showFavoritesOnly);
											scrollToTop();
										}}>
										<Icon name="star" solid={showFavoritesOnly} size={14} color={showFavoritesOnly ? '#FFD700' : '#999'} />
										<Text style={[styles.favoriteFilterText, showFavoritesOnly && styles.favoriteFilterTextActive]}>즐겨찾기</Text>
									</TouchableOpacity>
									<Text style={styles.listCountText}>총 {proverbList.length}개가 검색되었어요!</Text>
								</View>
							</View>
						</View>
						{/* 리스트 영역 */}
						<View style={{ flex: 1, zIndex: 0 }}>
							<FlatList
								ref={scrollRef}
								data={visibleList}
								scrollEnabled={!fieldOpen && !levelOpen}
								keyExtractor={(item) => item.id.toString()}
								refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
								onEndReached={loadMoreData}
								onEndReachedThreshold={0.5}
								keyboardShouldPersistTaps="handled"
								keyboardDismissMode="on-drag"
								onScroll={(event) => {
									const offsetY = event.nativeEvent.contentOffset.y;
									setShowScrollTop(offsetY > 100);
								}}
								scrollEventThrottle={16}
								ListEmptyComponent={() => (
									<View style={[styles.emptyWrapper, { height: '100%', marginTop: scaleHeight(40) }]}>
										<FastImage source={emptyImage} style={styles.emptyImage} resizeMode="contain" />
										<Text style={styles.emptyText}>앗! 조건에 맞는 속담이 없어요.{'\n'}다른 검색어나 필터를 사용해보세요!</Text>
									</View>
								)}
								contentContainerStyle={styles.flatListCotent}
								renderItem={({ item, index }) => {
									const isLast = index === visibleList.length - 1;
									return (
										<TouchableOpacity
											style={[styles.itemBox, { marginBottom: isLast ? scaleHeight(24) : scaleHeight(12) }]}
											onPress={() => {
												setSelectedProverb(item);
												setShowDetailModal(true);
											}}>
											{/* ✅ 배지 + 즐겨찾기 한 줄 */}
											<View style={styles.badgeAndFavoriteRow}>
												<View style={styles.badgeInlineRow}>
													<View
														style={[
															styles.badge,
															{
																backgroundColor: getLevelColor(item.level),
																flexDirection: 'row',
																alignItems: 'center',
																paddingHorizontal: scaleWidth(8),
																paddingVertical: scaleHeight(4),
															},
														]}>
														{getLevelIcon(item.level)}
														<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>
															{{ 1: '아주 쉬움', 2: '쉬움', 3: '보통', 4: '어려움' }[item.level] || '알 수 없음'}
														</Text>
													</View>
													<View
														style={[
															styles.badge2,
															{
																backgroundColor: getFieldColor(item.category),
																flexDirection: 'row',
																alignItems: 'center',
																paddingHorizontal: scaleWidth(8),
															},
														]}>
														{getFieldIcon(item.category)}
														<Text style={[styles.badgeText, { marginLeft: scaleWidth(6) }]}>{item.category || '미지정'}</Text>
													</View>
												</View>

												{/* ✅ 즐겨찾기 아이콘 - 오른쪽 끝 */}
												<TouchableOpacity
													onPress={(e) => {
														e.stopPropagation();
														handleToggleFavorite(item.id);
													}}
													style={styles.favoriteIconWrapper}
													hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
													<Icon name="star" solid={favoriteIds.includes(item.id)} size={20} color={favoriteIds.includes(item.id) ? '#FFD700' : '#ccc'} />
												</TouchableOpacity>
											</View>

											{/* 텍스트 */}
											<Text style={styles.proverbTextMulti}>{item.proverb}</Text>
											<Text style={styles.meaningText}>- {item.longMeaning}</Text>

											{Array.isArray(item.sameProverb) && item.sameProverb.filter((p) => p.trim()).length > 0 && (
												<View style={styles.sameProverbBox}>
													<Text style={styles.sameProverbTitle}>🔗 비슷한 속담</Text>
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
									);
								}}
							/>
						</View>
						{/* ✅ 토스트 */}
						<SuccessToast visible={showToast} message={toastMessage} onHide={() => setShowToast(false)} />
						{/* 스크롤 최상단 이동 버튼 */}
						{showScrollTop && (
							<TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
								<IconComponent type="fontawesome6" name="arrow-up" size={20} color="#ffffff" />
							</TouchableOpacity>
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
		</SafeAreaView>
	);
};

export default ProverbListScreen;

const styles = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: '#f8f9fa',
		marginTop: scaleHeight(-18),
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
		overflow: 'visible',
	},
	input: {
		width: '80%',
		height: scaleHeight(44),
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: scaleWidth(8),
		fontSize: scaledSize(16),
		paddingHorizontal: scaleWidth(12),
		paddingVertical: 0,
		marginBottom: scaleHeight(12),
		textAlignVertical: 'center',
	},
	filterRow: { flexDirection: 'row' },
	dropdown: {
		backgroundColor: '#fff',
		borderColor: '#ccc',
		height: scaleHeight(44),
	},
	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(16),
		bottom: scaleHeight(16),
		backgroundColor: '#2196F3',
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
		borderColor: '#eee',
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
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2d3436',
		flexShrink: 1,
	},
	modalBody: {
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(8),
		paddingBottom: scaleHeight(16),
	},
	modalSection: {
		marginBottom: scaleHeight(16),
		backgroundColor: '#f9f9f9',
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
		color: '#0984e3',
		marginBottom: scaleHeight(6),
	},
	modalText: {
		fontSize: scaledSize(15),
		color: '#2d3436',
		lineHeight: scaleHeight(24),
	},
	modalHighlightTitle: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#0984e3',
		marginBottom: scaleHeight(4),
	},
	modalHighlightText: {
		fontSize: scaledSize(15),
		color: '#2d3436',
		lineHeight: scaleHeight(22),
	},
	modalCloseButton: {
		backgroundColor: '#0984e3',
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
		color: '#2d3436',
		marginBottom: scaleHeight(8),
	},
	meaningText: {
		fontSize: scaledSize(15),
		color: '#2d3436',
		fontWeight: '400',
		lineHeight: scaleHeight(24),
		marginBottom: scaleHeight(12),
	},
	badgeRow: {
		flexDirection: 'row',
		gap: scaleWidth(8),
		justifyContent: 'center',
	},
	badge: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		backgroundColor: '#f1f2f6',
	},
	badge2: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		backgroundColor: '#f1f2f6',
	},
	badgeText: {
		color: '#fff',
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
		color: '#999',
	},
	dropdownList: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1.2,
		borderRadius: scaleWidth(12),
	},
	dropdownWrapperLast: {
		flex: 1,
		marginBottom: scaleHeight(6),
		marginRight: scaleWidth(6),
	},
	// ✅ 즐겨찾기 + 카운트 한 줄
	listCountWrapper: {
		marginTop: scaleHeight(4),
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(3),
	},
	listCountText: {
		fontSize: scaledSize(14),
		color: '#666',
	},
	favoriteFilterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#ddd',
		backgroundColor: '#fff',
		gap: scaleWidth(6),
	},
	favoriteFilterButtonActive: {
		backgroundColor: '#FFF9E6',
		borderColor: '#FFD700',
	},
	favoriteFilterText: {
		fontSize: scaledSize(13),
		color: '#999',
		fontWeight: '600',
	},
	favoriteFilterTextActive: {
		color: '#FF8C00',
	},
	favoriteIconWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: scaleWidth(8),
	},
	// ✅ 배지 + 즐겨찾기 한 줄
	badgeAndFavoriteRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	badgeInlineRow: {
		flexDirection: 'row',
		flexShrink: 0,
		gap: scaleWidth(6),
	},
	resetButton: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#eee',
		height: scaleHeight(50),
		width: scaleWidth(44),
		borderRadius: scaleWidth(8),
	},
	resetButtonText: {
		color: '#555',
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
		color: '#636e72',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(16),
		right: scaleWidth(16),
		padding: scaleWidth(4),
		zIndex: 10,
	},
	modalHeader: {
		backgroundColor: '#fff',
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	modalProverbText: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2d3436',
		textAlign: 'center',
		lineHeight: scaleHeight(30),
	},
	modalProverbBox: {
		backgroundColor: '#f1f2f6',
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
		color: '#2d3436',
		textAlign: 'center',
	},
	bannerContainer: {
		backgroundColor: '#fff',
		alignItems: 'center',
		paddingVertical: scaleHeight(6),
		borderColor: '#ccc',
		zIndex: 999,
	},
	dropdownLevel: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		height: scaleHeight(44),
		paddingHorizontal: scaleWidth(12),
	},
	dropdownField: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		height: scaleHeight(44),
		paddingHorizontal: scaleWidth(12),
	},
	dropdownListLevel: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: scaleWidth(12),
	},
	dropdownListField: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: scaleWidth(12),
	},
	sameProverbBox: {
		marginTop: scaleHeight(10),
		padding: scaleWidth(10),
		backgroundColor: '#f4f6f8',
		borderRadius: scaleWidth(10),
	},
	sameProverbTitle: {
		fontSize: scaledSize(13),
		color: '#0984e3',
		fontWeight: '600',
		marginBottom: scaleHeight(6),
	},
	sameProverbText: {
		fontSize: scaledSize(13),
		color: '#34495e',
		fontWeight: '500',
		lineHeight: scaleHeight(22),
	},
	modalHighlightBox: {
		backgroundColor: '#f1f8ff',
		borderLeftWidth: scaleWidth(4),
		borderLeftColor: '#0984e3',
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
		color: '#2d3436',
		flex: 1,
		marginRight: scaleWidth(8),
	},
	proverbBlock: { marginBottom: scaleHeight(6) },
	proverbTextMulti: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2d3436',
		lineHeight: scaleHeight(26),
		marginBottom: scaleHeight(8),
	},
	sameProverbBoxModal: {
		marginTop: scaleHeight(10),
		padding: scaleWidth(12),
		backgroundColor: '#eaf6ff',
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#d0eaff',
	},
	sameProverbTitleModal: {
		fontSize: scaledSize(13),
		color: '#2980b9',
		fontWeight: '700',
		marginBottom: scaleHeight(6),
	},
	sameProverbTextModal: {
		fontSize: scaledSize(13),
		color: '#34495e',
		paddingVertical: scaleHeight(2),
		paddingLeft: scaleWidth(10),
	},
	container: {
		zIndex: 10,
		paddingHorizontal: scaleWidth(16),
		paddingTop: scaleHeight(16),
		overflow: 'visible',
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
	resetButtonInline: {
		marginLeft: scaleWidth(8),
		backgroundColor: '#eee',
		paddingHorizontal: scaleWidth(12),
		height: scaleHeight(44),
		borderRadius: scaleWidth(8),
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
});
