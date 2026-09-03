import AsyncStorage from '@react-native-async-storage/async-storage';

import DateUtils from '@/utils/DateUtils';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { __resetQueues } from '@/services/StorageService';
import { DAILY_AD_CLICK_LIMIT, getTodayAdClickCount, isInterstitialBlocked, recordAdClick } from '@/utils/AdGuardUtils';

/**
 * 광고 클릭 가드 회귀 테스트.
 *
 * 한 기기에서 하루에 광고를 여러 번 클릭하면 AdMob 이 무효 트래픽으로 보고, 누적되면
 * 수익 차감을 넘어 계정 정지까지 간다. 한도에 닿으면 그날은 전면 광고를 띄우지 않는다.
 *
 * 날짜 경계가 핵심이다 — UTC 로 세면 KST 사용자는 오전 9시에 카운터가 리셋돼 하루가 두 번 시작한다.
 */
beforeEach(async () => {
	await AsyncStorage.clear();
	__resetQueues();
});

const setStoredRecord = async (date: string, count: number): Promise<void> => {
	await AsyncStorage.setItem(MainStorageKeyType.AD_CLICK_GUARD, JSON.stringify({ date, count }));
};

test('기록이 없으면 0 회, 차단되지 않는다', async () => {
	expect(await getTodayAdClickCount()).toBe(0);
	expect(await isInterstitialBlocked()).toBe(false);
});

test('클릭할 때마다 오늘 카운트가 올라간다', async () => {
	expect(await recordAdClick()).toBe(1);
	expect(await recordAdClick()).toBe(2);
	expect(await getTodayAdClickCount()).toBe(2);
});

test('한도에 닿으면 전면 광고가 차단된다', async () => {
	for (let i = 0; i < DAILY_AD_CLICK_LIMIT - 1; i += 1) {
		await recordAdClick();
	}
	// 한도 직전까지는 계속 노출한다
	expect(await isInterstitialBlocked()).toBe(false);

	await recordAdClick();
	expect(await isInterstitialBlocked()).toBe(true);
	// 넘어가도 계속 차단
	await recordAdClick();
	expect(await isInterstitialBlocked()).toBe(true);
});

test('날짜가 바뀌면 카운터가 리셋된다', async () => {
	await setStoredRecord('2020-01-01', DAILY_AD_CLICK_LIMIT + 3);

	expect(await getTodayAdClickCount()).toBe(0);
	expect(await isInterstitialBlocked()).toBe(false);
	// 리셋 후 첫 클릭은 어제 값을 이어받지 않는다
	expect(await recordAdClick()).toBe(1);
});

test('오늘 날짜는 기기 타임존 기준이다 (UTC 아님)', async () => {
	await recordAdClick();
	const raw = await AsyncStorage.getItem(MainStorageKeyType.AD_CLICK_GUARD);
	expect(JSON.parse(raw!).date).toBe(DateUtils.getLocalDateString());
});

test('동시에 눌린 클릭이 한 번으로 뭉개지지 않는다', async () => {
	// StorageService.update 가 키 단위로 줄 세워 주므로 읽기-수정-쓰기가 겹치지 않는다.
	await Promise.all([recordAdClick(), recordAdClick(), recordAdClick()]);
	expect(await getTodayAdClickCount()).toBe(3);
});
