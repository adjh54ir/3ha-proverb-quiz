import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	RefreshControl,
	TouchableOpacity,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	FlatList,
	Modal,
	ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import FastImage from 'react-native-fast-image';

const PAGE_SIZE = 30;

const ProverbListScreen = () => {
	const scrollRef = useRef<FlatList>(null);
	const searchInputRef = useRef<TextInput>(null);

	const emptyImage = require('@/assets/images/emptyList.png')
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

	const [fieldItems, setFieldItems] = useState([
		{ label: '전체', value: '전체' },
		{ label: '배움', value: '배움' },
		{ label: '우정', value: '우정' },
		{ label: '생활', value: '생활' },
		{ label: '가족', value: '가족' },
		{ label: '사회', value: '사회' },
	]);
	const [levelItems, setLevelItems] = useState([
		{ label: '전체', value: '전체' },
		{ label: '초등', value: '초등' },
		{ label: '중등', value: '중등' },
		{ label: '고등', value: '고등' },
	]);

	const fetchData = () => {
		const allData = ProverbServices.selectProverbList();
		let filtered = allData;

		if (keyword.trim()) {
			const lowerKeyword = keyword.trim().toLowerCase();
			filtered = filtered.filter((item) =>
				(item.proverb && item.proverb.toLowerCase().includes(lowerKeyword)) ||
				(item.meaning && item.meaning.toLowerCase().includes(lowerKeyword))
			);
		}
		if (fieldValue !== '전체') {
			filtered = filtered.filter((item) => item.category && item.category.trim() === fieldValue);
		}
		if (levelValue !== '전체') {
			filtered = filtered.filter((item) => item.levelName && item.levelName.trim() === levelValue);
		}

		setProverbList(filtered);
		setPage(1);
		setVisibleList(filtered.slice(0, PAGE_SIZE));
	};

	useFocusEffect(
		useCallback(() => {
			const allData = ProverbServices.selectProverbList();

			// ✅ "필드" 항목 자동 세팅
			const uniqueFields = Array.from(new Set(allData.map((item) => item.category).filter(Boolean)));
			setFieldItems([{ label: '전체', value: '전체' }, ...uniqueFields.map((field) => ({ label: field, value: field }))]);

			// ✅ "레벨" 항목 자동 세팅
			const uniqueLevels = Array.from(new Set(allData.map((item) => item.levelName).filter(Boolean)));
			setLevelItems([{ label: '전체', value: '전체' }, ...uniqueLevels.map((level) => ({ label: level, value: level }))]);

			fetchData();
		}, [keyword, fieldValue, levelValue]),
	);
	useEffect(() => {
		fetchData();
	}, [keyword, fieldValue, levelValue]);

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
		switch (field) {
			case '배움':
				return '#0984e3';
			case '우정':
				return '#00cec9';
			case '생활':
				return '#fab1a0';
			case '가족':
				return '#fdcb6e';
			case '사회':
				return '#a29bfe';
			default:
				return '#b2bec3';
		}
	};

	const getLevelColor = (levelName: string) => {
		switch (levelName) {
			case '초등':
				return '#74b9ff'; // 연파랑 (맑고 가벼운 느낌)
			case '중등':
				return '#a29bfe'; // 연보라 (조금 진지하면서 부드러운 느낌)
			case '고등':
				return '#fd79a8'; // 핑크 (활동적이고 강한 느낌)
			default:
				return '#b2bec3'; // 기본 회색 (분류가 안된 경우)
		}
	};
	const handleReset = () => {
		setKeyword('');
		setFieldValue('전체');
		setLevelValue('전체');
		Keyboard.dismiss(); // 키보드도 닫아줌
	};

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={{ flex: 1 }}>
					{/* 필터 + 드롭다운 영역 */}
					<View style={{ zIndex: 10, paddingHorizontal: 16, paddingTop: 16 }}>
						<View style={styles.filterCard}>
							<TextInput
								ref={searchInputRef}
								style={styles.input}
								placeholder='속담이나 의미를 입력해주세요'
								placeholderTextColor='#666'
								onChangeText={setKeyword}
								value={keyword}
							/>
							<View style={styles.filterDropdownRow}>
								<View style={[styles.dropdownWrapper, { zIndex: fieldOpen ? 2000 : 1000 }]}>
									<DropDownPicker
										open={fieldOpen}
										value={fieldValue}
										items={fieldItems}
										setOpen={setFieldOpen}
										setValue={setFieldValue}
										setItems={setFieldItems}
										placeholder="분야 선택"
										placeholderStyle={styles.dropdownPlaceholder}
										style={styles.dropdown}
										iconContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
										dropDownContainerStyle={styles.dropdownList}
										zIndex={fieldOpen ? 2000 : 1000}
										zIndexInverse={fieldOpen ? 1000 : 2000}
									/>
								</View>

								<View style={[styles.dropdownWrapperLast, { zIndex: levelOpen ? 2000 : 1000 }]}>
									<DropDownPicker
										open={levelOpen}
										value={levelValue}
										items={levelItems}
										setOpen={setLevelOpen}
										setValue={setLevelValue}
										setItems={setLevelItems}
										placeholder="수준 선택"
										placeholderStyle={styles.dropdownPlaceholder}
										style={styles.dropdown}
										iconContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
										dropDownContainerStyle={styles.dropdownList}
										zIndex={levelOpen ? 2000 : 1000}
										zIndexInverse={levelOpen ? 1000 : 2000}
									/>
								</View>

								{/* 초기화 버튼 */}
								<TouchableOpacity style={styles.resetButton} onPress={handleReset}>
									<Icon name="rotate-right" size={20} color="#555" />
								</TouchableOpacity>
							</View>
							{/* 리스트 개수 표시 */}
							<View style={styles.listCountWrapper}>
								<Text style={styles.listCountText}>
									총 {proverbList.length}개의 속담이 있어요
								</Text>
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
								<View style={styles.emptyWrapper}>
									<FastImage source={emptyImage} style={styles.emptyImage} resizeMode="contain" />
									<Text style={styles.emptyText}>앗! 조건에 맞는 속담이 없어요.{"\n"}다른 검색어나 필터를 사용해보세요!</Text>
								</View>
							)}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.itemBox}
									onPress={() => {
										setSelectedProverb(item);
										setShowDetailModal(true);
									}}
								>
									<Text style={styles.proverbText}>{item.proverb}</Text>
									<Text style={styles.meaningText}>{item.meaning}</Text>
									<View style={styles.badgeRow}>
										<View style={[styles.badge, { backgroundColor: getFieldColor(item.category) }]}>
											<Text style={styles.badgeText}>{item.category}</Text>
										</View>
										<View style={[styles.badge, { backgroundColor: getLevelColor(item.levelName) }]}>
											<Text style={styles.badgeText}>{item.levelName}</Text>
										</View>
									</View>
								</TouchableOpacity>
							)}
							contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
						/>
					</View>

					{/* 스크롤 최상단 이동 버튼 */}
					{showScrollTop && (
						<TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
							<Icon name='arrow-up' size={20} color='#fff' />
						</TouchableOpacity>
					)}

					{/* 상세 모달 */}
					<Modal
						visible={showDetailModal}
						animationType="slide"
						transparent={true}
						onRequestClose={() => setShowDetailModal(false)}
					>
						<View style={styles.modalOverlay}>
							<View style={styles.modalContainer}>
								<View style={styles.modalHeader}>
									<Text style={styles.modalTitle}>{selectedProverb?.proverb}</Text>
								</View>

								{/* ✅ 스크롤 가능한 영역 */}
								<ScrollView contentContainerStyle={styles.modalBody}>
									<View style={styles.modalSection}>
										<Text style={styles.modalLabel}>의미</Text>
										<Text style={styles.modalText}>{selectedProverb?.meaning}</Text>
									</View>

									<View style={styles.modalSection}>
										<Text style={styles.modalLabel}>예시</Text>
										<Text style={styles.modalText}>{selectedProverb?.example}</Text>
									</View>

									<View style={styles.modalSection}>
										<Text style={styles.modalLabel}>유래</Text>
										<Text style={styles.modalText}>{selectedProverb?.origin}</Text>
									</View>

									<View style={styles.modalSection}>
										<Text style={styles.modalLabel}>사용 팁</Text>
										<Text style={styles.modalText}>{selectedProverb?.usageTip}</Text>
									</View>

									{selectedProverb?.synonym && (
										<View style={styles.modalHighlightBox}>
											<Text style={styles.modalHighlightTitle}>비슷한 속담</Text>
											<Text style={styles.modalHighlightText}>{selectedProverb.synonym}</Text>
										</View>
									)}

									{selectedProverb?.antonym && (
										<View style={styles.modalHighlightBox}>
											<Text style={styles.modalHighlightTitle}>반대 속담</Text>
											<Text style={styles.modalHighlightText}>{selectedProverb.antonym}</Text>
										</View>
									)}

									<View style={styles.modalSection}>
										<Text style={styles.modalLabel}>난이도 점수</Text>
										<Text style={styles.modalText}>{selectedProverb?.difficultyScore} / 100</Text>
									</View>
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
		</KeyboardAvoidingView>
	);
};

export default ProverbListScreen;

const styles = StyleSheet.create({
	filterCard: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 16,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 3,
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
		elevation: 6,
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
		elevation: 3,
	},
	proverbText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2d3436',
		marginBottom: 8,
	},
	meaningText: {
		fontSize: 14,
		color: '#636e72',
		lineHeight: 20,
		marginBottom: 12,
	},
	badgeRow: {
		flexDirection: 'row',
		gap: 8,
	},
	badge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
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
		marginBottom: 8,
	},
	listCountText: {
		fontSize: 14,
		color: '#666',
	},
	resetButton: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#eee',
		height: 44,
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
	modalContainer: {
		width: '90%',
		backgroundColor: '#fff',
		borderRadius: 20,
		overflow: 'hidden',
		maxHeight: '85%',
		justifyContent: 'space-between', // ✅ 상단-스크롤-하단 분리
	},
	modalBody: {
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	modalHeader: {
		backgroundColor: '#4a90e2',
		paddingVertical: 16,
		paddingHorizontal: 20,
		alignItems: 'center',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
	},
	modalScrollContent: {
		paddingVertical: 20,
	},
	modalSection: {
		marginBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
		paddingBottom: 12,
	},
	modalLabel: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#555',
		marginBottom: 4,
	},
	modalText: {
		fontSize: 14,
		color: '#333',
	},
	modalHighlightBox: {
		backgroundColor: '#dfe6e9',
		borderRadius: 12,
		padding: 12,
		marginBottom: 16,
	},
	modalHighlightTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 4,
		color: '#2d3436',
	},
	modalHighlightText: {
		fontSize: 14,
		color: '#2d3436',
	},
	modalCloseButton: {
		backgroundColor: '#4a90e2',
		paddingVertical: 14,
		alignItems: 'center',
	},
	modalCloseButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	emptyWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 100,
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

});
