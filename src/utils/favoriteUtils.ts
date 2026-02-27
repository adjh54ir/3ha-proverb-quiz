// @/utils/favoriteUtils.ts
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = MainStorageKeyType.FAVORITES_STORAGE_KEY;

export interface FavoriteItem {
	id: number;
	addedAt: number; // timestamp
}

/**
 * 즐겨찾기 목록 전체 조회
 */
export const getFavorites = async (): Promise<number[]> => {
	try {
		const jsonValue = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
		if (jsonValue) {
			const favorites: FavoriteItem[] = JSON.parse(jsonValue);
			return favorites.map((item) => item.id);
		}
		return [];
	} catch (error) {
		console.error('즐겨찾기 조회 실패:', error);
		return [];
	}
};

/**
 * 즐겨찾기 추가
 */
export const addFavorite = async (id: number): Promise<boolean> => {
	try {
		const jsonValue = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
		let favorites: FavoriteItem[] = jsonValue ? JSON.parse(jsonValue) : [];

		// 이미 존재하는지 확인
		if (favorites.some((item) => item.id === id)) {
			return false;
		}

		favorites.push({ id, addedAt: Date.now() });
		await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
		return true;
	} catch (error) {
		console.error('즐겨찾기 추가 실패:', error);
		return false;
	}
};

/**
 * 즐겨찾기 제거
 */
export const removeFavorite = async (id: number): Promise<boolean> => {
	try {
		const jsonValue = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
		if (!jsonValue) {
			return false;
		}

		let favorites: FavoriteItem[] = JSON.parse(jsonValue);
		const filtered = favorites.filter((item) => item.id !== id);

		if (filtered.length === favorites.length) {
			return false; // 제거할 항목이 없었음
		}

		await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered));
		return true;
	} catch (error) {
		console.error('즐겨찾기 제거 실패:', error);
		return false;
	}
};

/**
 * 특정 ID가 즐겨찾기에 있는지 확인
 */
export const isFavorite = async (id: number): Promise<boolean> => {
	try {
		const favorites = await getFavorites();
		return favorites.includes(id);
	} catch (error) {
		console.error('즐겨찾기 확인 실패:', error);
		return false;
	}
};

/**
 * 즐겨찾기 토글 (추가/제거)
 */
export const toggleFavorite = async (id: number): Promise<boolean> => {
	try {
		const favorites = await getFavorites();

		if (favorites.includes(id)) {
			await removeFavorite(id);
			return false; // 제거됨
		} else {
			await addFavorite(id);
			return true; // 추가됨
		}
	} catch (error) {
		console.error('즐겨찾기 토글 실패:', error);
		return false;
	}
};
