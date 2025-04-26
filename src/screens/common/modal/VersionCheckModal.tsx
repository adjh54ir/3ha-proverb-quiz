// components/VersionCheckModal.tsx
import { RootState } from '@/store/RootReducer';
import { setCurrentAppVerion } from '@/store/slice/UserDeviceInfoSlice';
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Redux 내에 현재 버전을 넣어두고, 비교하여서 버전이 맞지 않는 경우 팝업 제공
 * @returns
 */
const VersionCheckModal = () => {
	const dispatch = useDispatch();
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [currAppVer, setCurrAppVer] = useState('');
	const userDeviceInfoRedux = useSelector((state: RootState) => state.userDeviceInfo);

	useEffect(() => {
		checkVersion();
	}, []);

	/**
	 * 버전 비교 함수
	 * @return {Promise<void>}
	 */
	const checkVersion = async (): Promise<void> => {
		try {
			const latestVersion = await VersionCheck.getLatestVersion();
			const currentVersion = VersionCheck.getCurrentVersion();
			setCurrAppVer(currentVersion);

			// 1. Redux에 앱 버전이 없으면 현재 버전을 앱버전으로 지정
			if (userDeviceInfoRedux.appVer === '' || userDeviceInfoRedux.appVer === undefined) {
				dispatch(setCurrentAppVerion(currentVersion));
			}

			// 2. 앱의 출시를 한 경우에만 수행합니다.
			if (latestVersion) {
				// 2. Redux의 버전과 현재 버전이 다르면 업데이트 팝업을 출력
				if (userDeviceInfoRedux.appVer !== currentVersion) {
					const [latestMajor, latestMinor] = latestVersion.split('.').map(Number);
					const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);

					// 마이너 버전만 비교
					if (latestMajor === currentMajor && latestMinor > currentMinor) {
						setShowUpdateModal(true);
					}
				}
			}
		} catch (error) {
			console.log('Version check failed:', error);
		}
	};

	/**
	 * 버전 업데이트 수행
	 * @return {Promise<void>}
	 */
	const handleUpdate = () => {
		VersionCheck.needUpdate().then(async (res) => {
			if (res.isNeeded) {
				VersionCheck.getStoreUrl().then((url) => {
					Linking.openURL(url);
				});
			}
		});
	};

	return (
		<Modal visible={showUpdateModal} transparent={true} animationType='fade' onRequestClose={() => {}}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<Text style={styles.title}>업데이트 필요</Text>
						<Text style={styles.message}>
							새로운 버전이 출시되었습니다.{'\n'}
							업데이트가 필요합니다.
							{'\n\n'}
							현재 버전: {currAppVer}
						</Text>
						<TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
							<Text style={styles.buttonText}>업데이트</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: 'white',
		borderRadius: 10,
		padding: 20,
		width: '80%',
		alignItems: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	message: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 22,
	},
	updateButton: {
		backgroundColor: '#007AFF',
		paddingVertical: 12,
		paddingHorizontal: 30,
		borderRadius: 8,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
});

export default VersionCheckModal;
