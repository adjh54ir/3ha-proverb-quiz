import { useEffect, useRef, useState } from 'react';
import { Keyboard, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ScrollViewComponent = () => {
	const scrollViewRef = useRef<ScrollView>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const inputRef = useRef<TextInput>(null);
	const [inputValue, setInputValue] = useState('');
	/**
	 * 마지막 항목에 대해서 자연스럽게 스크롤이 내려가는 동작
	 */
	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
			if (inputRef.current?.isFocused()) {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}
		});

		return () => {
			keyboardDidShowListener.remove();
		};
	}, []);

	/**
	 * 스크롤을 움직일때 동작을 합니다. 하단으로 스크롤을 내릴때 아이콘 생성
	 * @param event
	 */
	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 100);
	};

	const scrollHandler = (() => {
		return {
			/**
			 * 스크롤 최상단으로 이동
			 * @return {void}
			 */
			toTop: (): void => {
				scrollViewRef.current?.scrollTo({ y: 0, animated: true });
			},

			/**
			 * 스크롤 뷰 최하단으로 이동
			 * @return {void}
			 */
			toBottom: (): void => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			},
		};
	})();

	/**
	 * 스크롤 최상단으로 이동 시 Refresh
	 */
	const handleRefresh = async () => {};

	return (
		<ScrollView
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
			onScroll={handleScroll}
			ref={scrollViewRef}>
			<View>
				<TextInput
					ref={inputRef}
					style={styles.customInput}
					multiline={true}
					value={inputValue}
					onChangeText={setInputValue}
					onPress={scrollHandler.toBottom}
					placeholderTextColor='#666'
				/>
			</View>

			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop}>
					<MaterialIcons name='arrow-upward' size={24} color='#ffffff' />
				</TouchableOpacity>
			)}
		</ScrollView>
	);
};
export default ScrollViewComponent;

const styles = StyleSheet.create({
	scrollTopButton: {
		position: 'absolute',
		right: 16,
		bottom: 16,
		backgroundColor: '#007AFF',
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
	},
	customInput: {
		height: 100,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 14,
		marginBottom: 5,
		textAlignVertical: 'top',
	},
});
