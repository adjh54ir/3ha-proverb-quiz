import { Button, Platform, StyleSheet, View } from 'react-native';
import { Permission, PERMISSIONS } from 'react-native-permissions';
import { checkSinglePermission } from '../atomic/PermissionComponent';

// 권한 체크를 위한 타입 정의
type PermissionType = {
	permission: Permission;
	title: string;
	message: string;
};

/**
 * 사용자 권한 관리를 담당하는 화면
 * @returns
 */
const PermissionScreens = () => {
	/**
	 * 권한 체크 함수
	 * @param permissionType - 체크할 권한 타입
	 */
	const checkPermission = async (permissionType: Permission) => {
		const permissionConfig: PermissionType = {
			permission: Platform.OS === 'ios' ? PERMISSIONS.IOS[permissionType] : PERMISSIONS.ANDROID[permissionType],
			title: permissionType,
			message: `${permissionType} 권한이 필요합니다`,
		};
		const hasPermission = await checkSinglePermission(permissionConfig);
		if (hasPermission) {
			console.log(`${permissionType} 권한 허용됨`);
			return true;
		} else {
			console.log(`${permissionType} 권한 거부됨`);
			return false;
		}
	};

	// 카메라 권한 요청
	const handleCameraPermission = async () => {
		if (Platform.OS === 'android') {
			await checkPermission(PERMISSIONS.ANDROID.CAMERA);
		} else if (Platform.OS === 'ios') {
			await checkPermission(PERMISSIONS.IOS.CAMERA);
		}
	};

	// 위치 권한 요청
	const handleLocationPermission = async () => {
		if (Platform.OS === 'android') {
			await checkPermission(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
		} else if (Platform.OS === 'ios') {
			await checkPermission(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
		}
	};

	// 마이크 권한 요청
	const handleMicrophonePermission = async () => {
		if (Platform.OS === 'android') {
			await checkPermission(PERMISSIONS.ANDROID.RECORD_AUDIO);
		} else if (Platform.OS === 'ios') {
			await checkPermission(PERMISSIONS.IOS.MICROPHONE);
		}
	};

	// 사진 접근 권한 요청
	const handlePhotoPermission = async () => {
		if (Platform.OS === 'android') {
			await checkPermission(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
		} else if (Platform.OS === 'ios') {
			await checkPermission(PERMISSIONS.IOS.PHOTO_LIBRARY);
		}
	};

	return (
		<View style={styles.container}>
			<Button title='카메라 권한 요청' onPress={handleCameraPermission} />
			<Button title='위치 권한 요청' onPress={handleLocationPermission} />
			<Button title='마이크 권한 요청' onPress={handleMicrophonePermission} />
			<Button title='사진 접근 권한 요청' onPress={handlePhotoPermission} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 20,
		gap: 10,
	},
});

export default PermissionScreens;
