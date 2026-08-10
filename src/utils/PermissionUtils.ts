import { AppState, NativeEventSubscription, Platform } from 'react-native';
import { PERMISSIONS, RESULTS, check, checkNotifications, request } from 'react-native-permissions';

/**
 * 앱이 실제로 사용하는 권한
 * - notifications : 오늘의 퀴즈 / 학습 리마인더 (notifee)
 * - tracking      : iOS ATT (광고 식별자, AdMob·LevelPlay 용) — iOS 14+ 전용
 */
export type AppPermissionKey = 'notifications' | 'tracking';

/** 화면 표시용으로 단순화한 상태 */
export type AppPermissionState = 'granted' | 'blocked' | 'undetermined';

export interface AppPermissionInfo {
	key: AppPermissionKey;
	label: string;
	description: string;
	state: AppPermissionState;
}

const ATT = PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY;

/**
 * react-native-permissions 의 PermissionStatus 를 화면 표시용 3분류로 변환합니다.
 * - granted / limited : 허용
 * - blocked           : 거부 (설정 앱에서만 변경 가능)
 * - denied / unavailable : 미설정
 */
const toState = (status: string): AppPermissionState => {
	if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
		return 'granted';
	}
	if (status === RESULTS.BLOCKED) {
		return 'blocked';
	}
	return 'undetermined';
};

/**
 * iOS ATT(App Tracking Transparency) 권한을 요청합니다.
 *
 * ATT 프롬프트는 앱이 active 상태일 때만 노출되고, 그 외 상태에서 요청하면 조용히 무시됩니다.
 * 따라서 active 가 아니면 AppState 리스너로 active 전환을 기다렸다가 한 번만 요청하고 리스너를 제거합니다.
 * iOS 14 미만 / Android 에서는 아무 것도 하지 않습니다.
 */
export const requestTrackingPermission = async (): Promise<void> => {
	if (Platform.OS !== 'ios') {
		return;
	}

	try {
		// notDetermined 만 DENIED 로 내려온다. granted/blocked(=결정 완료), unavailable(=iOS 14 미만)은 재요청 불필요
		const status = await check(ATT);
		if (status !== RESULTS.DENIED) {
			return;
		}

		if (AppState.currentState === 'active') {
			await request(ATT);
			return;
		}

		const subscription: NativeEventSubscription = AppState.addEventListener('change', (nextState) => {
			if (nextState !== 'active') {
				return;
			}
			subscription.remove(); // 한 번만 요청하고 즉시 해제
			request(ATT).catch(() => {});
		});
	} catch {
		// 권한 요청 실패는 앱 동작에 영향이 없으므로 무시한다
	}
};

/**
 * 설정 화면에 노출할 권한 목록과 현재 상태를 읽어옵니다.
 * 지원하지 않는 권한(iOS 14 미만의 ATT 등)은 목록에서 제외됩니다.
 */
export const loadAppPermissions = async (): Promise<AppPermissionInfo[]> => {
	const list: AppPermissionInfo[] = [];

	try {
		const { status } = await checkNotifications();
		list.push({
			key: 'notifications',
			label: '알림',
			description: '오늘의 퀴즈와 학습 리마인더를 받아요',
			state: toState(status),
		});
	} catch {
		// 조회 실패 시 항목을 숨긴다
	}

	if (Platform.OS === 'ios') {
		try {
			const status = await check(ATT);
			if (status !== RESULTS.UNAVAILABLE) {
				list.push({
					key: 'tracking',
					label: '추적 허용',
					description: '더 관련성 높은 광고를 제공하는 데 사용돼요',
					state: toState(status),
				});
			}
		} catch {
			// 조회 실패 시 항목을 숨긴다
		}
	}

	return list;
};
