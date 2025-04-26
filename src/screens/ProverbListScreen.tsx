import React, { useCallback, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	RefreshControl,
	TouchableOpacity,
	Alert,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import ProverbServices from '@/services/ProverbServices';

const ProverbListScreen = () => {
	const navigation = useNavigation();
	const scrollRef = useRef<ScrollView>(null);
	const searchInputRef = useRef<TextInput>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [keyword, setKeyword] = useState('');
	const [proverbList, setProverbList] = useState(ProverbServices.selectProverbList());
	const [showScrollTop, setShowScrollTop] = useState(false);

	const fetchData = () => {
		const allData = ProverbServices.selectProverbList();
		if (keyword.trim()) {
			const filtered = ProverbServices.selectProverbsByKeyword(keyword);
			setProverbList(filtered);
		} else {
			setProverbList(allData);
		}
	};

	useFocusEffect(
		useCallback(() => {
			fetchData();
		}, [keyword]),
	);

	const onRefresh = () => {
		setRefreshing(true);
		fetchData();
		setRefreshing(false);
	};

	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 100);
	};

	const scrollToTop = () => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	const handleEmptyRegister = () => {
		Alert.alert('등록 화면으로 이동');
		// navigation.navigate('등록화면') 처럼 연결 가능
	};

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<TouchableOpacity style={styles.wrapper} activeOpacity={1} onPress={Keyboard.dismiss}>
				<Text style={styles.title} onPress={() => searchInputRef.current?.focus()}>
					속담 검색
				</Text>
				<TextInput
					ref={searchInputRef}
					style={styles.input}
					placeholder='속담을 입력해주세요'
					placeholderTextColor='#666'
					onChangeText={setKeyword}
					value={keyword}
				/>

				<ScrollView
					ref={scrollRef}
					style={styles.listWrapper}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					onScroll={handleScroll}
					scrollEventThrottle={16}>
					{proverbList.length === 0 ? (
						<View style={styles.emptyWrapper}>
							<Text style={styles.emptyText}>등록된 속담이 없습니다.</Text>
							<TouchableOpacity style={styles.registerButton} onPress={handleEmptyRegister}>
								<Text style={styles.registerButtonText}>등록하러 가기</Text>
							</TouchableOpacity>
						</View>
					) : (
						proverbList.map((item) => (
							<View key={item.id} style={styles.itemBox}>
								<Text style={styles.proverbText}>{item.proverb}</Text>
								<Text style={styles.meaningText}>{item.easyMeaning}</Text>
							</View>
						))
					)}
				</ScrollView>

				{showScrollTop && (
					<TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
						<Icon name='arrow-up' size={20} color='white' />
					</TouchableOpacity>
				)}
			</TouchableOpacity>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	wrapper: { flex: 1, backgroundColor: 'white', padding: 16 },
	title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		borderRadius: 8,
		marginBottom: 16,
	},
	listWrapper: { flex: 1 },
	emptyWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
	emptyText: { fontSize: 16, marginBottom: 12 },
	registerButton: { backgroundColor: 'blue', padding: 10, borderRadius: 8 },
	registerButtonText: { color: 'white', fontWeight: 'bold' },
	itemBox: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
	proverbText: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
	meaningText: { fontSize: 14, color: '#666' },
	scrollTopButton: {
		position: 'absolute',
		bottom: 30,
		right: 20,
		backgroundColor: 'black',
		padding: 10,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default ProverbListScreen;
