import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { getThemeMode, setThemeMode, subscribeThemeMode, ThemeMode } from '@/const/common/Theme';

/**
 * 화이트/다크 모드 상태 훅.
 *
 * - 시스템(OS) 다크모드는 따르지 않는다. 저장값이 없으면 항상 라이트로 시작한다.
 * - 팔레트 자체는 Theme.ts 의 모듈 스코프에 있고(StyleSheet 도 읽어야 하므로),
 *   이 훅은 "모드가 바뀌면 리렌더" 역할만 한다.
 */
export const useThemeMode = (): ThemeMode => useSyncExternalStore(subscribeThemeMode, getThemeMode, getThemeMode);

/** 저장된 모드를 불러와 적용한다. 앱 시작 시 1회. */
export const loadThemeMode = async (): Promise<ThemeMode> => {
	try {
		const stored = await AsyncStorage.getItem(MainStorageKeyType.THEME_MODE);
		if (stored === 'dark' || stored === 'light') {
			setThemeMode(stored);
			return stored;
		}
	} catch (e) {
		console.warn('테마 모드 불러오기 실패:', e);
	}
	return getThemeMode();
};

/** 모드를 변경하고 저장한다. */
export const changeThemeMode = async (mode: ThemeMode): Promise<void> => {
	setThemeMode(mode);
	try {
		await AsyncStorage.setItem(MainStorageKeyType.THEME_MODE, mode);
	} catch (e) {
		console.warn('테마 모드 저장 실패:', e);
	}
};
