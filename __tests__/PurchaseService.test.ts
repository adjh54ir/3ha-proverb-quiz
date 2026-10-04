import AsyncStorage from '@react-native-async-storage/async-storage';

const mockIap = {
	setup: jest.fn(),
	initConnection: jest.fn(async () => true),
	flushFailedPurchasesCachedAsPendingAndroid: jest.fn(async () => true),
	purchaseUpdatedListener: jest.fn(),
	purchaseErrorListener: jest.fn(),
	finishTransaction: jest.fn(async () => undefined),
	getAvailablePurchases: jest.fn(async (): Promise<any[]> => []),
	getProducts: jest.fn(async (): Promise<any[]> => [{ productId: 'com.tha.proverbquiz.remove_ad', localizedPrice: '₩3,900' }]),
	getPurchaseHistory: jest.fn(async (): Promise<any[]> => []),
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

	it('스토어에 월 구독이 보이면 평생 보유자로 전환 → 재시작 후 스토어가 비어도 유지', async () => {
		const s = load();
		await s.loadCachedAdsRemoved();
		expect(s.isAdsRemoved()).toBe(false);
		mockIap.getAvailablePurchases.mockResolvedValueOnce([{ productId: s.LEGACY_MONTHLY_SKU, transactionId: 't1' }]);
		expect(await s.checkStore()).toBe(true);
		expect(s.isFromSubscription()).toBe(true);

		const s2 = load();
		await s2.loadCachedAdsRemoved();
		expect(s2.isAdsRemoved()).toBe(true);
		expect(s2.isFromSubscription()).toBe(true);
		mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
		expect(await s2.checkStore()).toBe(true);
	});

	it('캐시를 읽기 전에는 광고를 띄우지 않는다', () => {
		expect(load().isAdsRemoved()).toBe(true);
	});

	it('구독 시절 캐시(AD_REMOVED)가 있던 사용자는 만료 여부와 무관하게 평생 보유자로 전환', async () => {
		for (const saved of ['true', String(Date.now() + 10 * 864e5), String(Date.now() - 1000)]) {
			await AsyncStorage.clear();
			await AsyncStorage.setItem('AD_REMOVED', saved);
			const s = load();
			await s.loadCachedAdsRemoved();
			expect(s.isAdsRemoved()).toBe(true);
			expect(s.isFromSubscription()).toBe(true);
			expect(JSON.parse((await AsyncStorage.getItem('PURCHASE_INFO'))!)).toMatchObject({ isRemoveAds: true, fromSubscription: true });
			mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
			expect(await s.checkStore()).toBe(true);
		}
	});

	it('구매한 적 없으면(캐시 0) 광고 노출', async () => {
		await AsyncStorage.setItem('AD_REMOVED', '0');
		const s = load();
		await s.loadCachedAdsRemoved();
		expect(s.isAdsRemoved()).toBe(false);
		mockIap.getAvailablePurchases.mockResolvedValueOnce([{ productId: 'other.sku' }]);
		expect(await s.checkStore()).toBe(false);
		expect(s.isAdsRemoved()).toBe(false);
	});

	it('결제 대기(PENDING)는 권한을 주지 않는다', async () => {
		const s = load();
		await s.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockResolvedValueOnce([{ productId: s.LIFETIME_SKU, purchaseStateAndroid: 2 }]);
		expect(await s.checkStore()).toBe(false);
	});

	it('스토어 조회 실패 시 캐시 유지', async () => {
		await AsyncStorage.setItem('PURCHASE_INFO', JSON.stringify({ isRemoveAds: true }));
		const s = load();
		await s.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockRejectedValueOnce(new Error('offline'));
		expect(await s.checkStore()).toBeNull();
		expect(s.isAdsRemoved()).toBe(true);
	});

	it('예전 평생 구매자(PURCHASE_INFO)는 스토어가 비어도 광고 제거 유지', async () => {
		await AsyncStorage.setItem('PURCHASE_INFO', JSON.stringify({ isRemoveAds: true }));
		const s = load();
		await s.loadCachedAdsRemoved();
		expect(s.isAdsRemoved()).toBe(true);
		expect(s.isFromSubscription()).toBe(false);
		mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
		expect(await s.checkStore()).toBe(true);
	});

	it('스토어에서 평생 상품이 발견되면 평생 구매자로 저장 → 이후 스토어가 비어도 유지', async () => {
		const s = load();
		await s.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockResolvedValueOnce([{ productId: s.LEGACY_LIFETIME_SKU, transactionId: 'old1' }]);
		expect(await s.checkStore()).toBe(true);
		expect(s.isFromSubscription()).toBe(false);

		const s2 = load();
		await s2.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
		expect(await s2.checkStore()).toBe(true);
	});

	it('iOS 구매 복원은 구매 이력에서 해지된 월 구독도 찾는다', async () => {
		const s = load();
		await s.loadCachedAdsRemoved();
		mockIap.getAvailablePurchases.mockResolvedValueOnce([]);
		mockIap.getPurchaseHistory.mockResolvedValueOnce([{ productId: s.LEGACY_MONTHLY_SKU, transactionId: 'old-sub' }]);
		expect(await s.restorePurchases()).toBe(true);
		expect(s.isFromSubscription()).toBe(true);
	});

	it('평생 이용권은 비소모성 구매로 요청하고 스토어 가격을 쓴다', async () => {
		const s = load();
		expect(await s.purchaseRemoveAds()).toEqual({ ok: true });
		expect(mockIap.requestPurchase).toHaveBeenCalledWith({ sku: s.LIFETIME_SKU }); // jest 기본 Platform.OS = ios
		expect(await s.getRemoveAdsPrice()).toBe('₩3,900');
		mockIap.getProducts.mockRejectedValueOnce(new Error('x'));
		expect(await s.getRemoveAdsPrice()).toBe(s.FALLBACK_PRICE);
	});
});
