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
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import FastImage from 'react-native-fast-image';
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import DeviceInfo from 'react-native-device-info';

const PAGE_SIZE = 30;

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	icon: () => <IconComponent type="FontAwesome6" name="clipboard-list" size={16} color="#555" />,
	labelStyle: {
		marginLeft: scaleWidth(6), fontSize: scaledSize(14),
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

	const isTablet = DeviceInfo.isTablet();

	const fetchData = () => {
		const allData = ProverbServices.selectProverbList(); // 이미 필드에 있음
		let filtered = [...allData];

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
	}, [keyword, fieldValue, levelValue]);

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
			setFieldValue('전체');
			setLevelValue('전체');

			// ✅ 리스트 상태 초기화
			setPage(1);
			setVisibleList([]);
			setProverbList([]);

			// ✅ 드롭다운 항목 새로 세팅
			const fieldList = ProverbServices.selectCategoryList();
			setFieldItems([{ label: '전체', value: '전체' }, ...fieldList.map((field) => ({ label: field, value: field }))]);

			const levelList = ProverbServices.selectLevelNameList();
			setLevelItems([{ label: '전체', value: '전체' }, ...levelList.map((level) => ({ label: level, value: level }))]);
			// ✅ 데이터 새로 불러오기
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

	const scrollToTop = () => {
		scrollRef.current?.scrollToOffset({ animated: true, offset: 0 });
	};

	const getFieldColor = (field: string) => {
		const categoryColorMap: Record<string, string> = {
			'운/우연': '#00cec9', // 청록
			인간관계: '#6c5ce7', // 보라
			'세상 이치': '#fdcb6e', // 연노랑
			'근면/검소': '#e17055', // 주황
			'노력/성공': '#00b894', // 짙은 청록
			'경계/조심': '#d63031', // 빨강
			'욕심/탐욕': '#e84393', // 핫핑크
			'배신/불신': '#2d3436', // 짙은 회색
		};

		return categoryColorMap[field] || '#b2bec3'; // 기본 회색
	};
	const getLevelColor = (levelName: string) => {
		const levelColorMap: Record<string, string> = {
			'아주 쉬움': '#dfe6e9',
			쉬움: '#74b9ff',
			보통: '#0984e3',
			어려움: '#2d3436',
		};

		return levelColorMap[levelName] || '#b2bec3'; // 기본 회색
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
			setFieldValue('전체');
			setLevelValue('전체');

			// 필터 목록 초기화
			const fieldList = ProverbServices.selectCategoryList();
			setFieldItems([{ label: '전체', value: '전체' }, ...fieldList.map((field) => ({ label: field, value: field }))]);

			const levelList = ProverbServices.selectLevelNameList();
			setLevelItems([{ label: '전체', value: '전체' }, ...levelList.map((level) => ({ label: level, value: level }))]);

			scrollToTop(); // 스크롤 이동은 마지막에
		}, 50);
	};

	const handleSetLevelOpen = (open: boolean) => {
		setLevelOpen(open);
		if (open) {scrollToTop();}
	};

	const handleSetFieldOpen = (open: boolean) => {
		setFieldOpen(open);
		if (open) {scrollToTop();}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['top']}>
			<TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
				<View style={{ flex: 1 }}>
					{/* 필터 + 드롭다운 영역 */}
					<View style={styles.container}>
						<View style={styles.filterCard}>
							<View style={styles.bannerContainer}>
								<AdmobBannerAd paramMarginBottom={8} />
							</View>
							<View style={styles.searchRow}>
								<TextInput
									ref={searchInputRef}
									style={styles.input}
									placeholder="속담이나 의미를 입력해주세요"
									placeholderTextColor="#666"
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
										setOpen={setLevelOpen}
										setValue={setLevelValue}
										setItems={setLevelItems}
										style={styles.dropdownLevel}
										scrollViewProps={{
											nestedScrollEnabled: true,
										}}
										dropDownContainerStyle={{
											...styles.dropdownListLevel,
											overflow: 'visible', // 🟢 부모와 같이 설정
											zIndex: 3000,
											elevation: 10,
										}}
										listItemLabelStyle={{ marginLeft: scaleWidth(6), fontSize: scaledSize(14) }}
										labelStyle={{ fontSize: scaledSize(14), color: '#2c3e50' }}
										iconContainerStyle={{ marginRight: scaleWidth(8) }}
										showArrowIcon={true} // 드롭다운 화살표
										showTickIcon={false} // 선택 시 오른쪽 체크 표시 제거
									/>
								</View>
								<View style={[styles.dropdownWrapperLast, { zIndex: levelOpen ? 2000 : 1000, overflow: 'visible' }]}>
									<DropDownPicker
										listMode="MODAL"
										open={fieldOpen}
										value={fieldValue}
										items={FIELD_DROPDOWN_ITEMS}
										setOpen={setFieldOpen}
										setValue={setFieldValue}
										setItems={setFieldItems}
										dropDownDirection="BOTTOM" // ✅ 추가
										scrollViewProps={{
											nestedScrollEnabled: true,
										}}
										style={styles.dropdownField}
										dropDownContainerStyle={{
											overflow: 'visible', // 중요
											zIndex: 3000,
											...styles.dropdownListField,
											elevation: 1000, // Android에서 zIndex처럼 동작
											maxHeight: scaleHeight(200), // 또는 250~300 등 충분한 높이
										}}
										zIndex={5000} // DropDownPicker 자체에 zIndex 주기
										zIndexInverse={4000} // 다른 Picker와 겹치지 않게
										containerStyle={{
											zIndex: 5000,
										}}
										labelStyle={{ fontSize: scaledSize(14), color: '#2c3e50' }}
										iconContainerStyle={{ marginRight: scaleWidth(8) }}
										showArrowIcon={true}
										showTickIcon={false}
										modalProps={{
											animationType: 'fade', // slide → fade로 부드럽게
											presentationStyle: 'overFullScreen', // 배경 흐림 없이 띄움
											transparent: true,
										}}
										modalContentContainerStyle={{
											width: '85%',
											alignContent: 'center',
											maxHeight: scaleHeight(500), // ✅ 높이 증가로 스크롤 확보
											backgroundColor: '#fff',
											borderRadius: scaleWidth(20),
											alignSelf: 'center',
											paddingHorizontal: scaleWidth(16),
											paddingVertical: scaleHeight(20),
											shadowColor: '#000',
											shadowOpacity: 0.15,
											shadowOffset: { width: 0, height: 6 },
											shadowRadius: scaleWidth(8),
											elevation: 10,
											alignItems: 'stretch', // ✅ 추가
											flex: 1, // ✅ 반드시 필요
											justifyContent: 'center',
										}}
										listItemLabelStyle={{
											flex: 1,
											fontSize: scaledSize(15),
											color: '#2c3e50',
											fontWeight: '500',
											lineHeight: scaleHeight(22),
											flexShrink: 1, // ✅ 텍스트 줄바꿈을 위해
											flexWrap: 'wrap', // ✅ 줄바꿈 허용
										}}
										listItemContainerStyle={{
											paddingVertical: scaleHeight(14), // 충분한 위아래 여백
											minHeight: scaleHeight(48),       // iOS에서 텍스트 짤림 방지
											alignItems: 'stretch', // ✅ 핵심 추가
										}}
									/>
								</View>

								{/* 초기화 버튼 */}
								{/* <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
									<Icon name='rotate-right' size={20} color='#555' />
								</TouchableOpacity> */}
							</View>
							{/* 리스트 개수 표시 */}
							<View style={styles.listCountWrapper}>
								<Text style={styles.listCountText}>🔍 총 {proverbList.length}개 속담이 검색되었어요!</Text>
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
									<Text style={styles.emptyText}>앗! 조건에 맞는 속담이 없어요.{'\n'}다른 검색어나 필터를 사용해보세요!</Text>
								</View>
							)}
							contentContainerStyle={styles.flatListCotent}
							renderItem={({ item, index }) => {
								const isLast = index === visibleList.length - 1;
								return (
									<TouchableOpacity
										style={[
											styles.itemBox,
											{ marginBottom: isLast ? scaleHeight(24) : scaleHeight(12) }, // 마지막은 좀 더 크게, 그 외는 일정
										]}
										onPress={() => {
											setSelectedProverb(item);
											setShowDetailModal(true);
										}}>
										<View style={styles.proverbBlock}>
											<View style={styles.badgeInlineRow}>
												<View style={[styles.badge, { backgroundColor: getLevelColor(item.levelName) }]}>
													<Text style={styles.badgeText}>{item.levelName}</Text>
												</View>
												<View style={[styles.badge, { backgroundColor: getFieldColor(item.category) }]}>
													<Text style={styles.badgeText}>{item.category}</Text>
												</View>
											</View>
											<Text style={styles.proverbTextMulti}>{item.proverb}</Text>
										</View>

										<Text style={styles.meaningText}>- {item.longMeaning}</Text>

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
								);
							}}
						/>
					</View>

					{/* 스크롤 최상단 이동 버튼 */}
					{showScrollTop && (
						<TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
							<IconComponent type="fontawesome6" name="arrow-up" size={20} color="#ffffff" />
						</TouchableOpacity>
					)}

					{/* 상세 모달 */}
					<Modal visible={showDetailModal} animationType="slide" transparent={true} onRequestClose={() => setShowDetailModal(false)}>
						<View style={styles.modalOverlay}>
							<View style={styles.modalContainer}>
								<View style={styles.modalHeader}>
									<Text style={styles.modalHeaderTitle}>속담 상세</Text>
									<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowDetailModal(false)}>
										<Icon name="xmark" size={20} color="#0984e3" />
									</TouchableOpacity>
								</View>

								{/* ✅ 스크롤 가능한 영역 */}
								<ScrollView contentContainerStyle={styles.modalBody}>
									{/* 속담 본문 크게 강조 */}

									{selectedProverb && (
										<>
											<View style={[styles.badgeRow, { marginBottom: scaleHeight(12) }]}>
												<View style={[styles.badge, { backgroundColor: getLevelColor(selectedProverb.levelName) }]}>
													<Text style={styles.badgeText}>{selectedProverb.levelName}</Text>
												</View>
												<View style={[styles.badge, { backgroundColor: getFieldColor(selectedProverb.category) }]}>
													<Text style={styles.badgeText}>{selectedProverb.category}</Text>
												</View>
											</View>
											<View style={styles.modalProverbBox}>
												<Text style={styles.modalProverbText}>{selectedProverb.proverb}</Text>
											</View>



											<View style={styles.modalSection}>
												<Text style={styles.modalLabel}>의미</Text>
												<Text style={styles.modalText}>- {selectedProverb?.longMeaning}</Text>
											</View>

											<View style={styles.modalSection}>
												<Text style={styles.modalLabel}>예시</Text>
												<Text style={styles.modalText}>- {selectedProverb?.example}</Text>
											</View>

											{Array.isArray(selectedProverb.sameProverb) && selectedProverb.sameProverb.filter((p) => p.trim()).length > 0 && (
												<View style={styles.modalSection}>
													<Text style={styles.modalLabel}>비슷한 속담</Text>
													{selectedProverb.sameProverb.map((p, idx) => (
														<Text key={idx} style={styles.modalText}>
															- {p}
														</Text>
													))}
												</View>
											)}
										</>
									)}
								</ScrollView>

								{/* ✅ 닫기 버튼을 모달 맨 하단에 고정 */}
								<TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDetailModal(false)}>
									<Text style={styles.modalCloseButtonText}>닫기</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>
				</View>
			</TouchableWithoutFeedback>
		</SafeAreaView>
	);
};

export default ProverbListScreen;

const styles = StyleSheet.create({
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
	filterRow: {
		flexDirection: 'row',
	},
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
	listCountWrapper: {
		marginTop: scaleHeight(10),
		alignItems: 'flex-end',
		paddingHorizontal: scaleWidth(16),
		marginBottom: scaleHeight(3),
	},
	listCountText: {
		fontSize: scaledSize(14),
		color: '#666',
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
		fontSize: scaledSize(14),
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
	badgeInlineRow: {
		flexDirection: 'row',
		flexShrink: 0,
		gap: scaleWidth(6),
		marginBottom: scaleHeight(10),
	},
	proverbBlock: {
		marginBottom: scaleHeight(6),
	},
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
