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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import DropDownPicker from 'react-native-dropdown-picker';
import ProverbServices from '@/services/ProverbServices';
import { MainDataType } from '@/types/MainDataType';

const PAGE_SIZE = 30;

const ProverbListScreen = () => {
	const scrollRef = useRef<FlatList>(null);
	const searchInputRef = useRef<TextInput>(null);
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
			filtered = filtered.filter((item) => item.proverb.includes(keyword) || item.meaning.includes(keyword));
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

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
					ListHeaderComponent={
						<View style={styles.filterCard}>
							<TextInput
								ref={searchInputRef}
								style={styles.input}
								placeholder='속담을 입력해주세요'
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
										style={[styles.dropdown, { justifyContent: 'center' }]}
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
							</View>
						</View>
					}
					renderItem={({ item }) => (
						<View style={styles.itemBox}>
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
						</View>
					)}
					contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
				/>
			</TouchableWithoutFeedback>
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
					<Icon name='arrow-up' size={20} color='#fff' />
				</TouchableOpacity>
			)}
		</KeyboardAvoidingView>
	);
};

export default ProverbListScreen;

const styles = StyleSheet.create({
	filterCard: {
		flex: 1,
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
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 12,
		borderRadius: 8,
		fontSize: 16,
		marginBottom: 12,
	},
	filterRow: {
		flexDirection: 'row',
	},
	dropdown: {
		backgroundColor: '#fff',
		borderColor: '#ccc',
		height: 44,
	},
	emptyWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
	emptyText: { fontSize: 16, color: '#777' },
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
	},
});
