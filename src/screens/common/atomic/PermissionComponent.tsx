import react from 'react';
import { Alert, Linking } from 'react-native';
import { check, Permission, request, RESULTS } from 'react-native-permissions';

// 권한 체크를 위한 타입 정의
type PermissionType = {
	permission: Permission;
	title: string;
	message: string;
};

/**
 * 단일 권한 요청
 * @param permissionType
 * @returns
 */
const checkSinglePermission = async (permissionType: PermissionType): Promise<boolean> => {
	try {
		// 권한 상태 확인
		const status = await check(permissionType.permission);

		// 권한이 차단된 경우
		if (status === RESULTS.BLOCKED) {
			Alert.alert('권한 설정 필요', `${permissionType.title} 권한이 차단되어 있습니다. 설정에서 권한을 허용해주세요.`, [
				{
					text: '설정으로 이동',
					onPress: () => Linking.openSettings(),
				},
				{
					text: '취소',
					style: 'cancel',
				},
			]);
			return false;
		}

		// 권한이 거부된 경우 요청
		if (status === RESULTS.DENIED) {
			const result = await request(permissionType.permission);
			return result === RESULTS.GRANTED;
		}

		return status === RESULTS.GRANTED;
	} catch (error) {
		console.error('Permission check error:', error);
		Alert.alert('오류 발생', '권한 확인 중 문제가 발생했습니다.');
		return false;
	}
};

/**
 * 여러 권한을 한번에 체크하고 요청하는 함수
 * @param permissions
 * @returns
 */
const checkMultiplePermissions = async (permissions: PermissionType[]): Promise<boolean> => {
	try {
		// 모든 권한의 현재 상태 확인
		const statuses = await Promise.all(permissions.map(({ permission }) => check(permission)));

		// 거부된 권한들 필터링
		const deniedPermissions = permissions.filter((_, index) => statuses[index] === RESULTS.DENIED);

		// 차단된 권한들 필터링
		const blockedPermissions = permissions.filter((_, index) => statuses[index] === RESULTS.BLOCKED);

		// 차단된 권한이 있는 경우
		if (blockedPermissions.length > 0) {
			Alert.alert('권한 설정 필요', '일부 권한이 차단되어 있습니다. 설정에서 권한을 허용해주세요.', [
				{
					text: '설정으로 이동',
					onPress: () => Linking.openSettings(),
				},
				{
					text: '취소',
					style: 'cancel',
				},
			]);
			return false;
		}

		// 거부된 권한에 대해 요청
		if (deniedPermissions.length > 0) {
			const requestResults = await Promise.all(deniedPermissions.map(({ permission }) => request(permission)));

			// 하나라도 거부되면 false 반환
			if (requestResults.some((result) => result !== RESULTS.GRANTED)) {
				return false;
			}
		}

		// 모든 권한이 허용된 경우
		return true;
	} catch (error) {
		console.error('Permissions check error:', error);
		Alert.alert('오류 발생', '권한 확인 중 문제가 발생했습니다.');
		return false;
	}
};

export {
	checkSinglePermission, // 단일 권한 요청
	checkMultiplePermissions, // 다중 권한 요청
};
