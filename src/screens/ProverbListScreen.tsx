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

const PAGE_SIZE = 30;

const COMMON_ALL_OPTION = {
	label: '전체',
	value: '전체',
	icon: () => <IconComponent type='FontAwesome6' name='clipboard-list' size={16} color='#555' />,
};

const LEVEL_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '아주 쉬움',
		value: '아주 쉬움',
		icon: () => <IconComponent type='FontAwesome6' name='seedling' size={16} color='#85C1E9' />,
	},
	{
		label: '쉬움',
		value: '쉬움',
		icon: () => <IconComponent type='FontAwesome6' name='leaf' size={16} color='#F4D03F' />,
	},
	{
		label: '보통',
		value: '보통',
		icon: () => <IconComponent type='FontAwesome6' name='tree' size={16} color='#EB984E' />,
	},
	{
		label: '어려움',
		value: '어려움',
		icon: () => <IconComponent type='FontAwesome6' name='trophy' size={16} color='#E74C3C' />,
	},
];
const FIELD_DROPDOWN_ITEMS = [
	COMMON_ALL_OPTION,
	{
		label: '운/우연',
		value: '운/우연',
		icon: () => <IconComponent type='FontAwesome6' name='dice' size={16} color='#81ecec' />,
	},
	{
		label: '인간관계',
		value: '인간관계',
		icon: () => <IconComponent type='FontAwesome6' name='users' size={16} color='#a29bfe' />,
	},
	{
		label: '세상 이치',
		value: '세상 이치',
		icon: () => <IconComponent type='fontawesome5' name='globe' size={16} color='#fdcb6e' />,
	},
	{
		label: '근면/검소',
		value: '근면/검소',
		icon: () => <IconComponent type='fontawesome5' name='hammer' size={16} color='#fab1a0' />,
	},
	{
		label: '노력/성공',
		value: '노력/성공',
		icon: () => <IconComponent type='fontawesome5' name='medal' size={16} color='#55efc4' />,
	},
	{
		label: '경계/조심',
		value: '경계/조심',
		icon: () => <IconComponent type='fontawesome5' name='exclamation-triangle' size={16} color='#ff7675' />,
	},
	{
		label: '욕심/탐욕',
		value: '욕심/탐욕',
		icon: () => <IconComponent type='fontawesome5' name='hand-holding-usd' size={16} color='#fd79a8' />,
	},
	{
		label: '배신/불신',
		value: '배신/불신',
		icon: () => <IconComponent type='fontawesome5' name='user-slash' size={16} color='#b2bec3' />,
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
		if (open) scrollToTop();
	};

	const handleSetFieldOpen = (open: boolean) => {
		setFieldOpen(open);
		if (open) scrollToTop();
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['top']}>
			<TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
				<View style={{ flex: 1 }}>
					{/* 필터 + 드롭다운 영역 */}
					<View style={{ zIndex: 10, paddingHorizontal: 16, paddingTop: 16 }}>
						<View style={styles.filterCard}>
							<View style={styles.bannerContainer}>
								<AdmobBannerAd paramMarginBottom={8} />
							</View>
							<TextInput
								ref={searchInputRef}
								style={styles.input}
								placeholder='속담이나 의미를 입력해주세요'
								placeholderTextColor='#666'
								onChangeText={(text) => {
									setKeyword(text);
									setFieldOpen(false); // 🔽 드롭다운 닫기
									setLevelOpen(false); // 🔽 드롭다운 닫기
								}}
								value={keyword}
							/>
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
										dropDownContainerStyle={styles.dropdownListLevel}
										listItemLabelStyle={{ marginLeft: 6, fontSize: 14 }}
										labelStyle={{ fontSize: 14, color: '#2c3e50' }}
										iconContainerStyle={{ marginRight: 8 }}
										showArrowIcon={true} // 드롭다운 화살표
										showTickIcon={false} // 선택 시 오른쪽 체크 표시 제거
									/>
								</View>
								<View style={[styles.dropdownWrapperLast, { zIndex: levelOpen ? 2000 : 1000, overflow: 'visible' }]}>
									<DropDownPicker
										open={fieldOpen}
										value={fieldValue}
										items={FIELD_DROPDOWN_ITEMS}
										setOpen={setFieldOpen}
										setValue={setFieldValue}
										setItems={setFieldItems}
										listMode='SCROLLVIEW'
										scrollViewProps={{
											nestedScrollEnabled: true,
										}}
										style={styles.dropdownField}
										dropDownContainerStyle={{
											...styles.dropdownListField,
											elevation: 1000, // Android에서 zIndex처럼 동작
										}}
										zIndex={5000} // DropDownPicker 자체에 zIndex 주기
										zIndexInverse={4000} // 다른 Picker와 겹치지 않게
										containerStyle={{
											zIndex: 5000,
										}}
										listItemLabelStyle={{ marginLeft: 6, fontSize: 14 }}
										labelStyle={{ fontSize: 14, color: '#2c3e50' }}
										iconContainerStyle={{ marginRight: 8 }}
										showArrowIcon={true}
										showTickIcon={false}
									/>
								</View>

								{/* 초기화 버튼 */}
								<TouchableOpacity style={styles.resetButton} onPress={handleReset}>
									<Icon name='rotate-right' size={20} color='#555' />
								</TouchableOpacity>
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
							keyExtractor={(item) => item.id.toString()}
							refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
							onEndReached={loadMoreData}
							onEndReachedThreshold={0.5}
							onScroll={(event) => {
								const offsetY = event.nativeEvent.contentOffset.y;
								setShowScrollTop(offsetY > 100);
							}}
							scrollEventThrottle={16}
							keyboardShouldPersistTaps='handled'
							ListEmptyComponent={() => (
								<View style={[styles.emptyWrapper, { height: '100%', marginTop: 40 }]}>
									<FastImage source={emptyImage} style={styles.emptyImage} resizeMode='contain' />
									<Text style={styles.emptyText}>앗! 조건에 맞는 속담이 없어요.{'\n'}다른 검색어나 필터를 사용해보세요!</Text>
								</View>
							)}
							contentContainerStyle={{
								paddingTop: 12, // ✅ 적당한 여백으로 조정
								paddingHorizontal: 16,
								paddingBottom: 60,
							}}
							renderItem={({ item, index }) => {
								const isLast = index === visibleList.length - 1;
								return (
									<TouchableOpacity
										style={[
											styles.itemBox,
											{ marginBottom: isLast ? 24 : 12 }, // 마지막은 좀 더 크게, 그 외는 일정
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
							<Icon name='arrow-up' size={20} color='#fff' />
						</TouchableOpacity>
					)}

					{/* 상세 모달 */}
					<Modal visible={showDetailModal} animationType='slide' transparent={true} onRequestClose={() => setShowDetailModal(false)}>
						<View style={styles.modalOverlay}>
							<View style={styles.modalContainer}>
								<View style={styles.modalHeader}>
									<Text style={styles.modalHeaderTitle}>속담 상세</Text>
									<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowDetailModal(false)}>
										<Icon name='xmark' size={20} color='#0984e3' />
									</TouchableOpacity>
								</View>

								{/* ✅ 스크롤 가능한 영역 */}
								<ScrollView contentContainerStyle={styles.modalBody}>
									{/* 속담 본문 크게 강조 */}

									{selectedProverb && (
										<>
											<View style={[styles.badgeRow, { marginBottom: 12 }]}>
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
		padding: 16,
		borderRadius: 16,
		// marginBottom: 20, ❌ 제거 또는 줄이기
		marginBottom: 8, // ✅ 줄이기
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
	},
	input: {
		height: 44, // 드롭다운과 똑같이!
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		fontSize: 16,
		paddingHorizontal: 12, // 좌우 패딩만
		paddingVertical: 0, // 위아래 패딩 없애야 높이 딱 맞아
		marginBottom: 12,
		textAlignVertical: 'center', // 텍스트 수직 중앙 정렬
	},
	filterRow: {
		flexDirection: 'row',
	},
	dropdown: {
		backgroundColor: '#fff',
		borderColor: '#ccc',
		height: 44,
	},
	scrollTopButton: {
		position: 'absolute',
		right: 20,
		bottom: 30,
		backgroundColor: '#3b5998',
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	itemBox: {
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#eee',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
	},
	modalContainer: {
		width: '90%',
		backgroundColor: '#fff',
		borderRadius: 20,
		overflow: 'hidden',
		maxHeight: '85%',
	},

	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2d3436',
		flexShrink: 1,
	},

	modalBody: {
		paddingHorizontal: 20,
		paddingVertical: 16,
	},

	modalSection: {
		marginBottom: 16,
		backgroundColor: '#f9f9f9',
		padding: 12,
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},

	modalLabel: {
		fontSize: 17,
		fontWeight: 'bold',
		color: '#0984e3',
		marginBottom: 6,
	},
	modalText: {
		fontSize: 15,
		color: '#2d3436',
		lineHeight: 24,
	},

	modalHighlightTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#0984e3',
		marginBottom: 4,
	},
	modalHighlightText: {
		fontSize: 15,
		color: '#2d3436',
		lineHeight: 22,
	},

	modalCloseButton: {
		backgroundColor: '#0984e3',
		paddingVertical: 14,
		alignItems: 'center',
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
	},
	modalCloseButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	proverbText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2d3436',
		marginBottom: 8,
	},
	meaningText: {
		fontSize: 15,
		color: '#2d3436',
		fontWeight: '400', // 강조 추가
		lineHeight: 24,
		marginBottom: 12,
	},
	badgeRow: {
		flexDirection: 'row',
		gap: 8,
		justifyContent: "center",
	},
	badge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		backgroundColor: '#f1f2f6', // 연한 회색 배경 추가
	},
	badgeText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	filterDropdownRow: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	dropdownWrapper: {
		flex: 1,
		marginBottom: 6, // ✅ 여백 조정
		marginRight: 6, // ← 드롭다운 간의 간격
	},
	dropdownPlaceholder: {
		textAlign: 'center',
		color: '#999', // 선택 전 컬러도 부드럽게
	},
	dropdownList: {
		backgroundColor: '#fff',
		borderColor: '#dfe6e9',
		borderWidth: 1.2,
		borderRadius: 12,
	},
	dropdownWrapperLast: {
		flex: 1,
		marginBottom: 6,
		marginRight: 6, // ✅ 초기화 버튼과 여백 추가!
	},
	listCountWrapper: {
		marginTop: 10,
		alignItems: 'flex-end', // ✅ 오른쪽 정렬
		paddingHorizontal: 16, // ✅ 양쪽 여백 추가 (리스트랑 맞추기)
		marginBottom: 3,
	},
	listCountText: {
		fontSize: 14,
		color: '#666',
	},
	resetButton: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#eee',
		height: 50,
		width: 44, // ✅ 정사각형으로 통일
		borderRadius: 8,
	},
	resetButtonText: {
		color: '#555',
		fontSize: 14,
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
		paddingHorizontal: 20,
	},
	emptyImage: {
		width: 200,
		height: 200,
		marginBottom: 20,
	},
	emptyText: {
		fontSize: 16,
		color: '#636e72',
		textAlign: 'center',
		lineHeight: 22,
	},
	modalCloseIcon: {
		position: 'absolute',
		top: 16,
		right: 16,
		padding: 4,
		zIndex: 10,
	},
	modalHeader: {
		backgroundColor: '#fff',
		paddingVertical: 16,
		paddingHorizontal: 20,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},

	modalProverbText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2d3436',
		textAlign: 'center',
		lineHeight: 30,
	},
	modalProverbBox: {
		backgroundColor: '#f1f2f6', // 회색 배경
		borderRadius: 12,
		paddingVertical: 16,
		paddingHorizontal: 20,
		marginBottom: 20,
		alignItems: 'center',
	},
	modalHeaderTitle: {
		fontSize: 22,
		marginTop: 5,
		fontWeight: 'bold',
		color: '#2d3436',
		textAlign: 'center',
	},
	bannerContainer: {
		backgroundColor: '#fff',
		alignItems: 'center',
		paddingVertical: 6,
		borderColor: '#ccc',
		zIndex: 999,
	},
	dropdownLevel: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		height: 44,
		paddingHorizontal: 12,
	},
	dropdownField: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		height: 44,
		paddingHorizontal: 12,
	},
	dropdownListLevel: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 12,
	},
	dropdownListField: {
		backgroundColor: '#ffffff',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 12,
	},
	sameProverbBox: {
		marginTop: 10,
		padding: 10,
		backgroundColor: '#f4f6f8', // 회색톤으로 변경
		borderRadius: 10,
	},
	sameProverbTitle: {
		fontSize: 14,
		color: '#0984e3', // 더 진한 텍스트 색상
		fontWeight: '600',
		marginBottom: 6,
	},

	sameProverbText: {
		fontSize: 13,
		color: '#34495e', // 더 진한 회색
		fontWeight: '500', // 기존보다 더 강조
		lineHeight: 22,
	},
	modalHighlightBox: {
		backgroundColor: '#f1f8ff',
		borderLeftWidth: 4,
		borderLeftColor: '#0984e3',
		padding: 12,
		borderRadius: 10,
		marginBottom: 16,
		marginTop: 12, // 👈 간격 추가
	},
	proverbRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6,
	},

	proverbTextSingle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2d3436',
		flex: 1,
		marginRight: 8,
	},
	badgeInlineRow: {
		flexDirection: 'row',
		flexShrink: 0,
		gap: 6,
		marginBottom: 10,
	},
	proverbBlock: {
		marginBottom: 6,
	},

	proverbTextMulti: {
		fontSize: 18, // 기존 16 → 18로 키움
		fontWeight: 'bold',
		color: '#2d3436',
		lineHeight: 26, // 더 넓은 줄 간격
		marginBottom: 8, // 뱃지와 간격 확보
	},
	// 모달 영역에서 사용하는 스타일 복구
	sameProverbBoxModal: {
		marginTop: 10,
		padding: 12,
		backgroundColor: '#eaf6ff', // 밝은 파랑 원래값
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#d0eaff',
	},
	sameProverbTitleModal: {
		fontSize: 13,
		color: '#2980b9', // 파란 강조
		fontWeight: '700',
		marginBottom: 6,
	},
	sameProverbTextModal: {
		fontSize: 13,
		color: '#34495e',
		paddingVertical: 2,
		paddingLeft: 10,
	},
});
