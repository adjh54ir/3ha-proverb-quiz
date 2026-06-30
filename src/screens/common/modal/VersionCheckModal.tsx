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
					<View style={styles.iconWrap}>
						<Image source={require('@/assets/images/update.png')} style={styles.image} />
					</View>
					<Text style={styles.badge}>새로운 버전 출시</Text>
					<Text style={styles.title}>업데이트가 필요해요</Text>
					<Text style={styles.message}>더 편리해진 기능과 개선 사항이 준비됐어요.{'\n'}최신 버전으로 업데이트해 주세요.</Text>
					<TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.85}>
						<Text style={styles.buttonText}>지금 업데이트</Text>
					</TouchableOpacity>
					<Text style={styles.subtle}>업데이트 후 모든 기능을 정상적으로 이용할 수 있어요.</Text>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(15, 23, 42, 0.55)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: scaleWidth(24),
	},
	modalContent: {
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(24),
		paddingTop: scaleHeight(24),
		paddingBottom: scaleHeight(20),
		paddingHorizontal: scaleWidth(22),
		width: '100%',
		maxWidth: scaleWidth(340),
		maxHeight: '85%',
		alignItems: 'center',
	},
	iconWrap: {
		width: scaleWidth(92),
		height: scaleWidth(92),
		borderRadius: scaleWidth(46),
		backgroundColor: '#EFF6FF',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(14),
	},
	image: {
		width: scaleWidth(58),
		height: scaleWidth(58),
		resizeMode: 'contain',
	},
	badge: {
		fontSize: scaledSize(11.5),
		fontWeight: '800',
		color: '#2563EB',
		backgroundColor: '#DBEAFE',
		borderRadius: scaleWidth(20),
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(5),
		overflow: 'hidden',
		marginBottom: scaleHeight(10),
	},
	title: {
		fontSize: scaledSize(19),
		fontWeight: '800',
		color: '#1E293B',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},
	message: {
		fontSize: scaledSize(14),
		textAlign: 'center',
		color: '#64748B',
		marginBottom: scaleHeight(20),
		lineHeight: Math.round(scaledSize(14) * 1.5),
		includeFontPadding: false,
	},
	updateButton: {
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(14),
		borderRadius: scaleWidth(14),
		width: '100%',
		alignItems: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontSize: scaledSize(15),
		fontWeight: '800',
	},
	subtle: {
		fontSize: scaledSize(11.5),
		color: '#94A3B8',
		textAlign: 'center',
		marginTop: scaleHeight(12),
		lineHeight: Math.round(scaledSize(11.5) * 1.5),
	},
});

export default VersionCheckModal;
