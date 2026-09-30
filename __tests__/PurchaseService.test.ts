import AsyncStorage from '@react-native-async-storage/async-storage';

const mockIap = {
	setup: jest.fn(),
	initConnection: jest.fn(async () => true),
	flushFailedPurchasesCachedAsPendingAndroid: jest.fn(async () => true),
	purchaseUpdatedListener: jest.fn(),
	purchaseErrorListener: jest.fn(),
	finishTransaction: jest.fn(async () => undefined),
	getAvailablePurchases: jest.fn(async (): Promise<any[]> => []),
	getProducts: jest.fn(async (): Promise<any[]> => [{ productId: 'com.tha.proverbquiz.remove_ad', localizedPrice: '₩18,900' }]),
	getSubscriptions: jest.fn(async (): Promise<any[]> => []),
	requestPurchase: jest.fn(async () => undefined),
};
jest.mock('react-native-iap', () => mockIap);

// 구매 기록 업로드는 네트워크로 나가지 않게 막는다
global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) })) as any;

const load = () => {
	let mod: typeof import('@/services/PurchaseService');
	jest.isolateModules(() => {
		mod = require('@/services/PurchaseService');
	});
	return mod!;
};

describe('PurchaseService', () => {
	beforeEach(async () => {
		await AsyncStorage.clear();
		jest.clearAllMocks();
	});

	it('스토어에 활성 월 구독이 있으면 광고 제거, 재시작 후 캐시로 복원', async () => {
		const s = load();
		await s.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockResolvedValueOnce([{ productId: s.SKUS.monthly, transactionId: 't1', transactionDate: Date.now() }]);
		expect(await s.checkStore()).toBe(true);
		expect(s.isAdsRemoved()).toBe(true);

		const s2 = load();
		await s2.loadCachedAdsRemoved();
		expect(s2.isAdsRemoved()).toBe(true);
	});

	it('캐시를 읽기 전에는 광고를 띄우지 않는다', () => {
		expect(load().isAdsRemoved()).toBe(true);
	});

	it('콜드 스타트 직후 스토어가 빈 목록이어도 만료 전이면 유지 (이전 버전 true 캐시 포함)', async () => {
		for (const saved of ['true', String(Date.now() + 10 * 864e5)]) {
			await AsyncStorage.setItem('AD_REMOVED', saved);
			const s = load();
			await s.loadCachedAdsRemoved();
			mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
			expect(await s.checkStore()).toBe(true);
			expect(s.isAdsRemoved()).toBe(true);
		}
	});

	it('구독이 끝나면(만료 시각 지남 + 스토어에 없음) 해제', async () => {
		await AsyncStorage.setItem('AD_REMOVED', String(Date.now() - 1000));
		const s = load();
		await s.loadCachedAdsRemoved();
		expect(s.isAdsRemoved()).toBe(false);
		mockIap.getAvailablePurchases.mockResolvedValueOnce([{ productId: 'other.sku' }]);
		expect(await s.checkStore()).toBe(false);
		expect(s.isAdsRemoved()).toBe(false);
	});

	it('스토어 조회 실패 시 캐시 유지', async () => {
		await AsyncStorage.setItem('AD_REMOVED', 'true');
		const s = load();
		await s.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockRejectedValueOnce(new Error('offline'));
		expect(await s.checkStore()).toBeNull();
		expect(s.isAdsRemoved()).toBe(true);
	});

	it('예전 평생 구매자(PURCHASE_INFO)는 스토어에 구독이 없어도 광고 제거 유지', async () => {
		await AsyncStorage.setItem('PURCHASE_INFO', JSON.stringify({ isRemoveAds: true }));
		const s = load();
		await s.loadCachedAdsRemoved();
		expect(s.isAdsRemoved()).toBe(true);
		mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
		expect(await s.checkStore()).toBe(true);
		expect(s.isAdsRemoved()).toBe(true);
		expect(s.isLifetimeOwner()).toBe(true);
	});

	it('스토어에서 평생 상품이 발견되면 평생 구매자로 저장 → 이후 스토어가 비어도 유지', async () => {
		const s = load();
		await s.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockResolvedValueOnce([{ productId: s.LEGACY_LIFETIME_SKU, transactionId: 'old1' }]);
		expect(await s.checkStore()).toBe(true);

		const s2 = load();
		await s2.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
		expect(await s2.checkStore()).toBe(true);
	});

	it('평생 이용권은 비소모성 구매로 요청하고 스토어 가격을 쓴다', async () => {
		const s = load();
		expect(await s.subscribeRemoveAds('lifetime')).toEqual({ ok: true });
		expect(mockIap.requestPurchase).toHaveBeenCalledWith({ sku: s.LIFETIME_SKU }); // jest 기본 Platform.OS = ios
		expect(await s.getPlanPrices()).toEqual({ monthly: s.FALLBACK_PRICES.monthly, lifetime: '₩18,900' });
	});

	it('만료일: 평생 상품은 없음, Android 월간은 다음 갱신일', () => {
		const s = load();
		expect(s.expiresAtOf({ productId: s.LIFETIME_SKU, transactionDate: Date.now() })).toBeUndefined();
		const exp = s.expiresAtOf({ productId: s.SKUS.monthly, transactionDate: Date.now() - 45 * 864e5 })!;
		expect(exp).toBeGreaterThan(Date.now());
		expect(exp - Date.now()).toBeLessThan(32 * 864e5);
	});
});
