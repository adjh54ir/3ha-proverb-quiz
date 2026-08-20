/**
 * 알림 탭 → 화면 이동을 위한 임시 보관소.
 *
 * 앱이 백그라운드에 있을 때 알림을 누르면 이벤트는 `notifee.onBackgroundEvent`(index.js)로 간다.
 * 그 시점에는 네비게이션에 접근할 수 없고, 앱이 다시 올라와도 포그라운드 이벤트가 새로 오지 않는다.
 * 그래서 백그라운드 핸들러가 이동할 화면을 여기에 적어두고, 앱이 활성화될 때 꺼내서 이동한다.
 *
 * AsyncStorage 를 쓰는 이유: 백그라운드 핸들러가 별도 JS 컨텍스트에서 돌 수 있어
 * 모듈 전역 변수로는 값이 건너오지 않는 경우가 있다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

const KEY = MainStorageKeyType.PENDING_NOTIFICATION_ROUTE;

/** 이동할 화면을 기억해 둔다. 값이 없으면 아무 것도 하지 않는다. */
export const setPendingRoute = async (screen?: unknown): Promise<void> => {
	if (typeof screen !== 'string' || screen.length === 0) {
		return;
	}
	try {
		await AsyncStorage.setItem(KEY, screen);
	} catch {
		// 저장 실패는 이동을 못 할 뿐이라 앱 동작에 영향이 없다
	}
};

/** 기억해 둔 화면을 꺼내면서 지운다. 두 번 이동하지 않도록 항상 소비형으로 읽는다. */
export const takePendingRoute = async (): Promise<string | null> => {
	try {
		const screen = await AsyncStorage.getItem(KEY);
		if (screen) {
			await AsyncStorage.removeItem(KEY);
		}
		return screen;
	} catch {
		return null;
	}
};
