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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';
import FastImage from 'react-native-fast-image';
import AdmobBannerAd from './common/ads/AdmobBannerAd';

const PAGE_SIZE = 30;

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
		const allData = ProverbServices.selectProverbList();
		let filtered = allData;

		if (keyword.trim()) {
			const lowerKeyword = keyword.trim().toLowerCase();
			filtered = filtered.filter(
				(item) =>
					(item.proverb && item.proverb.toLowerCase().includes(lowerKeyword)) ||
					(item.meaning && item.meaning.toLowerCase().includes(lowerKeyword)),
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
			const fieldList = ProverbServices.selectCategoryList();
			setFieldItems([{ label: '전체', value: '전체' }, ...fieldList.map((field) => ({ label: field, value: field }))]);

			const levelList = ProverbServices.selectLevelNameList();
			setLevelItems([{ label: '전체', value: '전체' }, ...levelList.map((level) => ({ label: level, value: level }))]);

			fetchData();
		}, [keyword, fieldValue, levelValue]),
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
		setKeyword('');
		setFieldValue('전체');
		setLevelValue('전체');
		Keyboard.dismiss(); // 키보드도 닫아줌
		setTimeout(() => {
			scrollToTop();
		}, 100); // 상태 반영 후 스크롤 실행
	};

	return (
		<TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
			<View style={{ flex: 1 }}>
				<View style={styles.bannerContainer}>
					<AdmobBannerAd />
				</View>
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
									placeholder='분야 선택'
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
									placeholder='수준 선택'
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
								<Icon name='rotate-right' size={20} color='#555' />
							</TouchableOpacity>
						</View>
						{/* 리스트 개수 표시 */}
						<View style={styles.listCountWrapper}>
							<Text style={styles.listCountText}>총 {proverbList.length}개의 속담이 있어요</Text>
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
						renderItem={({ item }) => (
							<TouchableOpacity
								style={styles.itemBox}
								onPress={() => {
									setSelectedProverb(item);
									setShowDetailModal(true);
								}}>
								<Text style={styles.proverbText}>{item.proverb}</Text>
								<Text style={styles.meaningText}>- {item.meaning}</Text>
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
					animationType='slide'
					transparent={true}
					onRequestClose={() => setShowDetailModal(false)}>
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
								{selectedProverb?.proverb && (
									<View style={styles.modalProverbBox}>
										<Text style={styles.modalProverbText}>{selectedProverb.proverb}</Text>
									</View>
								)}
								<View style={styles.modalSection}>
									<Text style={styles.modalLabel}>의미</Text>
									<Text style={styles.modalText}>- {selectedProverb?.meaning}</Text>
								</View>

								<View style={styles.modalSection}>
									<Text style={styles.modalLabel}>예시</Text>
									<Text style={styles.modalText}>- {selectedProverb?.example}</Text>
								</View>

								{selectedProverb?.synonym && (
									<View style={styles.modalHighlightBox}>
										<Text style={styles.modalHighlightTitle}>비슷한 속담</Text>
										<Text style={styles.modalHighlightText}>- {selectedProverb.synonym}</Text>
									</View>
								)}

								{selectedProverb?.antonym && (
									<View style={styles.modalHighlightBox}>
										<Text style={styles.modalHighlightTitle}>반대 속담</Text>
										<Text style={styles.modalHighlightText}>- {selectedProverb.antonym}</Text>
									</View>
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
		elevation: 2,
	},

	modalLabel: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#0984e3',
		marginBottom: 6,
	},
	modalText: {
		fontSize: 15,
		color: '#2d3436',
		lineHeight: 22,
	},

	modalHighlightBox: {
		backgroundColor: '#f1f8ff',
		borderLeftWidth: 4,
		borderLeftColor: '#0984e3',
		padding: 12,
		borderRadius: 10,
		marginBottom: 16,
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
		fontSize: 18,
		marginTop: 5,
		fontWeight: 'bold',
		color: '#2d3436',
		textAlign: 'center',
	},
	bannerContainer: {
		backgroundColor: '#fff',
		alignItems: 'center',
		paddingVertical: 6,
		borderBottomWidth: 1, // ← 상단 배치 시 하단 구분선
		borderColor: '#ccc',
		zIndex: 999,
	},
});
