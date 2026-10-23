import { Platform } from 'react-native';

import { CommonType } from '@/types/CommonType';
import DateUtils from '@/utils/DateUtils';

/**
 * 개발자의 다른 앱 목록 — Supabase Storage 공개 버킷(common-apps)에서 받는다.
 * -------------------------------------------------
 * 앱이 하나 늘 때마다 모든 앱을 다시 빌드해 올리지 않으려고 목록·아이콘을 앱 밖에 둔다.
 */
const BASE_URL = 'https://hsnyhvcezyavsrgqazup.supabase.co/storage/v1/object/public/common-apps';
const APP_CATEGORIES: CommonType.AppCategory[] = ['quiz', 'calculator', 'utility'];

// ponytail: 앱이 떠 있는 동안만 들고 있는다 — 껐다 켜면 다시 받는다. 오프라인에서도 보여야 하면 AsyncStorage 에 남긴다
let cache: Promise<CommonType.AppItem[]> | null = null;

/** 목록을 받는다. 실패하면 들고 있지 않는다 — 다시 열거나 '다시 시도' 를 누르면 새로 묻는다 */
export const fetchCommonApps = (): Promise<CommonType.AppItem[]> => {
	cache ??= fetch(`${BASE_URL}/apps.json`)
		.then((res) => {
			if (!res.ok) throw new Error(`apps.json ${res.status}`);
			return res.json() as Promise<{ apps: CommonType.AppItem[] }>;
		})
		// 이 앱이 모르는 분류가 JSON 에 먼저 생겨도 색·라벨 조회에서 터지지 않게 걸러 낸다
		.then(({ apps }) => apps.filter((app) => APP_CATEGORIES.includes(app.category)))
		.catch((e) => {
			cache = null;
			throw e;
		});
	return cache;
};

/** apps.json 에는 파일 이름만 적는다 — 버킷 주소가 바뀌어도 JSON 은 그대로 둔다 */
export const appIconUrl = (app: CommonType.AppItem): string => `${BASE_URL}/icons/${app.icon}`;

/**
 * 지금 기기에서 열 수 있는 스토어 주소. 없으면 null.
 * 반대 플랫폼 링크로 대체하지 않는다 — 한쪽에만 출시된 앱에서 안드로이드 사용자를
 * 앱스토어 페이지로 보내면 설치가 아예 불가능한 화면만 보게 된다.
 */
export const appStoreUrl = (app: CommonType.AppItem): string | null =>
	(Platform.OS === 'android' ? app.android : app.ios) || null;

/** NEW 배지가 붙는 기간 */
const NEW_APP_DAYS = 60;

/**
 * 갓 나온 앱인지.
 * -------------------------------------------------
 * 예전에는 "id 가 가장 큰 두 개" 를 NEW 로 봤다. 그러면 새 앱을 한참 안 올린 동안에도
 * 같은 앱에 NEW 가 영영 붙어 있어, 배지가 아무 뜻도 없는 장식이 된다.
 * 출시일이 적힌 앱만, 그것도 최근 것만 배지를 단다(안 적힌 앱은 붙지 않는다).
 */
export const isNewApp = (app: CommonType.AppItem, now = DateUtils.nowTime()): boolean => {
	if (!app.releasedAt || !/^\d{4}-\d{2}-\d{2}$/.test(app.releasedAt)) return false;
	// 기기 타임존의 날짜 단위로 센다 — UTC 자정으로 세면 한국에서는 배지가 오전 9시에 바뀌었다
	const toUtcDay = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
	const days = (toUtcDay(DateUtils.getLocalDateString(new Date(now))) - toUtcDay(app.releasedAt)) / 86_400_000;
	return days >= 0 && days <= NEW_APP_DAYS;
};
