import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native/types';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import EditModal from '../modal/EditModal';

interface MainInfoType {
	id: number; // 구분아이디 (자동 증가)
	name: string; // 고정지출명
	createdAt: Date; // 등록일 (숨김, 연월일 시분초 기준)
	updatedAt: Date; // 수정일 (숨김, 연월일 시분초 기준)
}

interface MainStateType {
	initList: MainInfoType[];
	filteredList: MainInfoType[];
	selectedItem: MainInfoType | null;
	showMenu: boolean;
}

const HamberBottonComponent = () => {
	const STORAGE_KEY = 'test';
	const isFocused = useIsFocused();
	const naivgation = useNavigation();

	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

	const [isVisibleEditModal, setIsVisibleEditModal] = useState(false);

	const [mainState, setMainState] = useState<MainStateType>({
		initList: [],
		filteredList: [],
		selectedItem: null,
		showMenu: false,
	});
	useEffect(() => {
		if (isFocused) {
			loadMainData();
		}
	}, [isFocused]);

	const loadMainData = () => {};

	const menuStyles = {
		position: 'absolute',
		top: menuPosition.y + 40,
		right: 20,
		backgroundColor: 'white',
		borderRadius: 8,
		padding: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		zIndex: 100, // zIndex 값 낮춤
	};

	// 메뉴 버튼 클릭 핸들러 수정
	const handleMenuPress = (event, item) => {
		const layout = event.nativeEvent;
		setMenuPosition({ x: layout.pageX, y: layout.pageY });
		setMainState((prev) => ({
			...prev,
			showMenu: true,
			selectedItem: item,
		}));
	};

	/**
	 * 햄버거 수정 팝업
	 */
	const handleEdit = (item) => {
		// setEditingItem(item);
		// setState((prev) => ({
		//   ...prev,
		//   showMenu: false,
		// }));
	};

	/**
	 * 햄버거 버튼의 삭제 기능
	 * @param id
	 */
	const handleDelete = async (id: number) => {
		Alert.alert('삭제 확인', '이 항목을 삭제하시겠습니까?', [
			{ text: '취소', style: 'cancel' },
			{
				text: '삭제',
				style: 'destructive',
				onPress: async () => {
					try {
						if (mainState.selectedItem) {
							const newList = mainState.filteredList.filter((item: MainInfoType) => item.id !== id);
							await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
							setMainState((prev) => ({ ...prev, filteredList: newList }));
							Alert.alert('성공', '항목이 삭제되었습니다.');
						}
					} catch (error) {
						Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
					}
				},
			},
		]);
	};

	const handleEditModal = (() => {
		return {
			closeModal: () => {
				setIsVisibleEditModal(false);
			},
		};
	})();

	const HambergerModalComponent = () => {
		return (
			<Modal
				visible={mainState.showMenu}
				transparent={true}
				animationType='fade'
				onRequestClose={() => setMainState((prev) => ({ ...prev, showMenu: false }))}>
				<TouchableOpacity style={styles.menuOverlay} onPress={() => setMainState((prev) => ({ ...prev, showMenu: false }))}>
					{mainState.showMenu && (
						// @ts-ignore
						<View style={menuStyles}>
							<TouchableOpacity
								style={styles.menuItem}
								onPress={() => {
									if (mainState.selectedItem) handleEdit(mainState.selectedItem);
									setMainState((prev) => ({ ...prev, showMenu: false }));
								}}>
								<FontAwesome6Icon name='edit' size={24} color='#007AFF' />
								<Text style={styles.menuText}>수정</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.menuItem}
								onPress={() => {
									if (mainState.selectedItem) handleDelete(mainState.selectedItem.id);
									setMainState((prev) => ({ ...prev, showMenu: false }));
								}}>
								<IconMaterialIcons name='delete' size={24} color='#FF3B30' />
								<Text style={styles.menuText}>삭제</Text>
							</TouchableOpacity>
						</View>
					)}
				</TouchableOpacity>
			</Modal>
		);
	};

	/**
	 * 데이터가 없을때 보여주는 컴포넌트
	 * @param param0
	 * @returns
	 */
	const EmptyStateComponent = ({ navigation }: { navigation: any }) => (
		<View style={styles.emptyStateContainer}>
			<Text style={styles.emptyStateText}>등록된 고정지출이 없습니다.</Text>
			<TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate(Paths.EXAMPLE)}>
				<FontAwesome6Icon name='plus' size={20} color='#fff' />
				<Text style={styles.addButtonText}>고정지출 등록하기</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<View>
			{mainState.filteredList.length === 0 ? (
				<EmptyStateComponent navigation={naivgation} />
			) : (
				<>
					{mainState.filteredList.map((item) => (
						<TouchableOpacity style={styles.iconButton} onPress={(e) => handleMenuPress(e, item)}>
							<FontAwesome6Icon name='ellipsis' size={20} color='#6B7280' />
						</TouchableOpacity>
					))}

					<HambergerModalComponent />
				</>
			)}

			{isVisibleEditModal && (
				<EditModal
					visible={isVisibleEditModal}
					onClose={handleEditModal.closeModal}
					item={mainState.selectedItem}
					onUpdate={(updatedItem) => {
						loadMainData();
						handleEditModal.closeModal();
					}}
				/>
			)}
		</View>
	);
};
export default HamberBottonComponent;

const styles = StyleSheet.create({
	// 빈 화면
	emptyStateContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40,
	},
	emptyStateText: {
		fontSize: 16,
		color: '#666',
		marginBottom: 20,
		textAlign: 'center',
	},
	addButton: {
		backgroundColor: '#007AFF',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	addButtonText: {
		color: '#fff',
		fontSize: 16,
		marginLeft: 8,
	},

	// 햄버거 버튼
	menuOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		gap: 8,
	},
	menuText: {
		marginLeft: 12,
		fontSize: 16,
	},
	iconButton: {
		padding: 8,
		borderRadius: 8,
		backgroundColor: '#F3F4F6',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
	},
});
