// components/VersionCheckModal.tsx
import { RootState } from '@/store/RootReducer';
import { setCurrentAppVerion } from '@/store/slice/UserDeviceInfoSlice';
import { moderateScale, scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Redux 내에 현재 버전을 넣어두고, 비교하여서 버전이 맞지 않는 경우 팝업 제공
 * @returns
 */
const VersionCheckModal = () => {
	const dispatch = useDispatch();
	const [showUpdateModal, setShowUpdateModal] = useState(false);
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
			const platformProvider = Platform.OS === 'android' ? 'playStore' : 'appStore';
			const latestVersion = await VersionCheck.getLatestVersion({
				provider: platformProvider,
			});
			const currentVersion = VersionCheck.getCurrentVersion();

			// 아직 앱을 출시하지 않은 경우
			if (latestVersion === undefined) {
				console.log('[-] 아직 앱이 출시되지 않았습니다.');
				return;
			}
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
	const handleUpdate = async (): Promise<void> => {
		const provider = Platform.OS === 'android' ? 'playStore' : 'appStore';
		const res = await VersionCheck.needUpdate({ provider });

		if (res === undefined) {
			console.log('[-] 앱이 미 출시 상태입니다.');
			return;
		}

		if (res?.isNeeded && res.storeUrl) {
			Linking.openURL(res.storeUrl);
		}
	};

	return (
		<Modal
			visible={showUpdateModal}
			transparent
			animationType="fade"
			statusBarTranslucent // ✅ 안드로이드에서 전체 화면 덮게
			presentationStyle="overFullScreen" // ✅ iOS에서도 안정적
			onRequestClose={() => {}}>
			<View style={styles.modalContainer}>
				<View style={styles.modalContent}>
					<Text style={styles.title}>업데이트 알림</Text>
					<Image source={require('@/assets/images/update.png')} style={styles.image} />
					<Text style={styles.message}>
						🎉 새로운 버전이 출시되었습니다 🎉{'\n'}더 편리해진 기능을 만나보세요!
						{'\n\n'}
					</Text>
					<TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
						<Text style={styles.buttonText}>지금 업데이트</Text>
					</TouchableOpacity>
				</View>
			</View>
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
		borderRadius: moderateScale(10),
		padding: scaleWidth(20),
		width: scaleWidth(300),
		maxWidth: '90%', // ✅ 작은 기기 대비
		maxHeight: '85%', // ✅ 텍스트가 길어도 안전
		alignItems: 'center',
	},
	title: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginBottom: scaleHeight(10),
	},
	message: {
		fontSize: scaledSize(16),
		textAlign: 'center',
		marginBottom: scaleHeight(6),
		// lineHeight: scaleHeight(20),  // ❌ 제거
		lineHeight: Math.round(scaledSize(16) * 1.4), // ✅ 쓰려면 최소 1.3~1.5배
		includeFontPadding: false, // ✅ 안드로이드 폰트 패딩 이슈 완화
	},
	updateButton: {
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(10), // ✅ 버튼 높이도 살짝 낮춤
		paddingHorizontal: scaleWidth(30),
		borderRadius: moderateScale(8),
	},
	buttonText: {
		color: 'white',
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	image: {
		width: scaleWidth(100),
		height: scaleWidth(100),
		marginBottom: scaleHeight(15),
		resizeMode: 'contain',
	},
});

export default VersionCheckModal;
