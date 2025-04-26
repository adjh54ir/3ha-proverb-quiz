import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Clipboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';

/**
 * AsyncStorage의 내보내기/ 들여오기 기능
 */
const AsyncStorageImportExportComponent = () => {
	const MAIN_KEY = 'test';
	const [importData, setImportData] = useState('');

	/**
	 * 데이터 내보내기 함수
	 */
	const exportData = async () => {
		try {
			const data = await AsyncStorage.getItem('fixedExpenses');
			if (data) {
				await Clipboard.setString(data);
				Alert.alert('성공', '데이터가 클립보드에 복사되었습니다.');
			} else {
				Alert.alert('알림', '내보낼 데이터가 없습니다.');
			}
		} catch (error) {
			Alert.alert('오류', '데이터 내보내기 중 오류가 발생했습니다.');
		}
	};

	const importJsonData = async () => {
		try {
			if (!importData.trim()) {
				Alert.alert('알림', '가져올 데이터를 입력해주세요.');
				return;
			}

			let parsedData;
			try {
				parsedData = JSON.parse(importData);
				if (!Array.isArray(parsedData)) {
					throw new Error('Invalid data format');
				}
			} catch (error) {
				Alert.alert('오류', '올바른 JSON 배열 형식이 아닙니다.');
				return;
			}

			/**
			 * 컬럼에 대한 유효성 검증을 수행합니다.
			 */
			const isValidData = parsedData.every((entry) => {
				return (
					typeof entry.id === 'string' &&
					typeof entry.date === 'string' &&
					typeof entry.time === 'string' &&
					typeof entry.seconds === 'string' &&
					typeof entry.text === 'string' &&
					typeof entry.emoji === 'string' &&
					typeof entry.isFavorite === 'boolean'
				);
			});

			if (!isValidData) {
				Alert.alert('오류', '데이터 형식이 올바르지 않습니다.');
				return;
			}

			await AsyncStorage.setItem(MAIN_KEY, JSON.stringify(parsedData));
			Alert.alert('성공', '데이터가 성공적으로 가져와졌습니다.');
			setImportData(''); // 입력 필드 초기화
		} catch (error) {
			Alert.alert('오류', '데이터 가져오기 중 오류가 발생했습니다.');
		}
	};

	<View style={styles.section}>
		<Text style={styles.subHeader}>데이터 백업/가져오기</Text>

		<View style={styles.adminButtons}>
			<TouchableOpacity style={styles.adminButton} onPress={exportData}>
				<FeatherIcon name='copy' size={20} color='#fff' />
				<Text style={[styles.adminButtonText, { textAlign: 'center' }]}>데이터 내보내기</Text>
			</TouchableOpacity>
			<Text style={styles.description}>
				아래 입력창에 이전에 백업한 JSON 데이터를 붙여넣으세요. 기존 데이터는 덮어쓰기 됩니다.
				{'\n'}
				⚠️ 주의: 사진 데이터는 복구가 불가능합니다. JSON 데이터에는 텍스트 정보만 포함되어 있으며, 이전에 저장된 사진들은
				복원되지 않습니다.
			</Text>
			<TextInput
				style={styles.textInput}
				multiline
				placeholder='가져올 JSON 데이터를 입력하세요'
				value={importData}
				onChangeText={setImportData}
			/>
			<TouchableOpacity style={[styles.adminButton, styles.adminButtonSecondary]} onPress={importJsonData}>
				<FeatherIcon name='download' size={20} color='#fff' />
				<Text style={styles.adminButtonText}>데이터 가져오기</Text>
			</TouchableOpacity>
		</View>
	</View>;
};

export default AsyncStorageImportExportComponent;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	section: {
		backgroundColor: '#f8f9fa',
		borderRadius: 12,
		padding: 16,
		margin: 16,
	},
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 16,
		marginBottom: 10,
	},
	adminButtons: {
		marginTop: 12,
		gap: 8,
	},
	adminButton: {
		backgroundColor: '#ff6b6b',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 8,
		flexDirection: 'row',
		justifyContent: 'center', // 이 줄 추가
	},
	adminButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
		flex: 1,
	},
	adminButtonSecondary: {
		backgroundColor: '#4dabf7',
	},
	description: {
		fontSize: 14,
		color: '#666',
		marginTop: 8,
		marginBottom: 12,
		lineHeight: 20,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
		height: 100,
		textAlignVertical: 'top',
	},
});
