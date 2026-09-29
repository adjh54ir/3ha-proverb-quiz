import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IAP_REMOVE_AD_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

/**
 * 광고 제거 서비스 (react-native-iap v13) — 3ha-four-idioms 와 같은 구조
 * - 판매 상품 2개: 1개월 자동 갱신 구독(com.tha.proverbquiz.remove_ad.monthly, ₩2,900)
 *   + 평생 이용권(com.tha.proverbquiz.remove_ad, 비소모성, ₩18,900)
 * - 앱의 모든 기능은 계속 무료다. 광고만 없앤다.
 * - 1.3~1.4 에서 팔던 평생 광고 제거(com.tha.iap.remove_ad) 구매자도 평생 보유자로 인정한다.
 *   스토어 구매 이력 또는 당시 저장한 PURCHASE_INFO 플래그 중 하나만 있어도 인정한다.
 * - 권한의 진실 원천은 스토어(getAvailablePurchases = 현재 유효한 구독 + 보유 비소모성).
 *   AsyncStorage 플래그는 오프라인·앱 시작 직후용 캐시일 뿐이다.
 * - 구매 기록은 공용 Supabase Edge Function(purchases, 소스는 3ha-hanpick) → tb_purchases 에 남긴다. 실패해도 권한엔 영향 없음.
 *
 * [버전] RN 0.78 이라 react-native-iap 13.x 고정 (14+ 는 Kotlin 2.2 요구). Billing 8 패치는 .yarn/patches 참고
 */

export type PlanKey = 'monthly' | 'lifetime';

const BUNDLE = 'com.tha.proverbquiz';
export const SKUS = { monthly: `${BUNDLE}.remove_ad.monthly` };
const SUB_SKUS = Object.values(SKUS);
/** 평생 광고 제거(비소모성) */
export const LIFETIME_SKU = `${BUNDLE}.remove_ad`;
/** 1.3~1.4 에 팔던 평생 광고 제거 — 새로 팔지 않고 보유자만 인정한다 */
export const LEGACY_LIFETIME_SKU = IAP_REMOVE_AD_KEY || 'com.tha.iap.remove_ad';
const isLifetimeSku = (productId?: string) => productId === LIFETIME_SKU || productId === LEGACY_LIFETIME_SKU;

/** 스토어 조회 실패(시뮬레이터·심사 전) 시 화면에 보여줄 기본 가격 */
export const FALLBACK_PRICES: Record<PlanKey, string> = { monthly: '₩2,900', lifetime: '₩18,900' };

// ─── 광고 제거 플래그 (동기 캐시 + 구독) ───────────────────────
/** null = 캐시를 아직 못 읽음. 이때도 광고를 띄우지 않는다 — 구매자에게 앱 시작 직후 광고가 먼저 뜨지 않게 */
let adsRemovedCache: boolean | null = null;
/** 평생 광고 제거 보유자 — 구독 재검증이 이 사용자를 해제하지 않는다 */
let lifetimeOwner = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const isAdsRemoved = (): boolean => adsRemovedCache !== false;
export const isLifetimeOwner = (): boolean => lifetimeOwner;

/** useSyncExternalStore 호환 구독 */
export const subscribeAdsRemoved = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

/**
 * 권한 만료 시각(ms) — AsyncStorage(AD_REMOVED)에 이 값을 저장한다.
 * 스토어가 빈 목록을 돌려줘도 이 시각 전에는 해제하지 않는다. 빈 목록은 "구매 없음"만 뜻하지 않는다:
 *   - StoreKit 2: 콜드 스타트 직후 currentEntitlements 가 동기화 전이면 비어 있다
 *   - Play: 백그라운드 복귀 직후 결제 연결이 끊겨 조회가 실패해도 빈 배열로 resolve 한다
 * 예전엔 이 빈 목록 한 번에 권한을 해제해, 앱을 다시 켜면 광고가 나오고 포그라운드 복귀 때 다시 사라졌다.
 */
let adsRemovedUntil = 0;
const DAY = 24 * 60 * 60 * 1000;

const setAdsRemoved = (removed: boolean) => {
	if (adsRemovedCache === removed) return;
	adsRemovedCache = removed;
	notify();
};

const persistAdsRemovedUntil = async (until: number) => {
	adsRemovedUntil = until;
	setAdsRemoved(lifetimeOwner || until > Date.now());
	try {
		await AsyncStorage.setItem(MainStorageKeyType.AD_REMOVED, String(until));
	} catch {}
};

/**
 * 유효한 구매를 확인할 때마다 만료 시각을 늘려 둔다.
 * 최소 하루는 보장 — 만료일을 모를 때(JWS 없음·평생 상품)나 스토어 시계 오차에도 광고가 끼어들지 않게.
 */
const grantAdsRemoved = (p: PurchaseLike) =>
	persistAdsRemovedUntil(Math.max(expiresAtOf(p) ?? 0, Date.now() + DAY));

/** 평생 구매자 표시 — 예전 앱과 같은 키·모양으로 남겨 두어 오프라인에서도 유지된다 */
const markLifetime = async () => {
	if (lifetimeOwner) return;
	lifetimeOwner = true;
	setAdsRemoved(true);
	try {
		await AsyncStorage.setItem(
			MainStorageKeyType.LEGACY_PURCHASE_INFO,
			JSON.stringify({ isRemoveAds: true, purchaseDate: new Date().toISOString(), platform: Platform.OS }),
		);
	} catch {}
};

// ─── IAP 모듈 lazy 로드 (pod install 전에도 앱이 죽지 않게) ─────
type IapModule = typeof import('react-native-iap');
type PurchaseLike = {
	productId?: string;
	transactionId?: string;
	transactionDate?: number;
	purchaseToken?: string;
	purchaseStateAndroid?: number;
	isAcknowledgedAndroid?: boolean;
	/** StoreKit 2 서명 트랜잭션 — payload 에 만료일(expiresDate)이 들어 있다 */
	jwsRepresentationIos?: string;
};

/** Google Play 결제 대기(PENDING) — 편의점 결제 등. 권한 부여 금지 */
const ANDROID_PURCHASE_PENDING = 2;

let iap: IapModule | null = null;
const getIap = (): IapModule | null => {
	if (iap) return iap;
	try {
		iap = require('react-native-iap') as IapModule;
		return iap;
	} catch (e) {
		console.warn('[IAP] module load failed:', e);
		return null;
	}
};

const isSubSku = (productId?: string) => !!productId && SUB_SKUS.includes(productId);
const isRemoveAdSku = (productId?: string) => isSubSku(productId) || isLifetimeSku(productId);

// ─── 구매 기록 (Supabase Edge Function → tb_purchases) ──────────
/*
  tb_purchases.user_id 는 auth.users 의 uid 다. 이 앱은 로그인이 없으므로 익명 로그인으로 uid 를 받고,
  refresh token 을 저장해 재실행해도 같은 uid 를 쓴다. (Supabase 의 Anonymous sign-ins 가 켜져 있어야 함)
*/
const authFetch = async (path: string, body: object) => {
	const r = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
		body: JSON.stringify(body),
	});
	return r.ok ? ((await r.json()) as { access_token?: string; refresh_token?: string }) : null;
};

/** 익명 세션의 access token (저장된 refresh token 우선, 없거나 만료면 새 익명 사용자) */
const getAccessToken = async (): Promise<string | null> => {
	const saved = await AsyncStorage.getItem(MainStorageKeyType.SUPABASE_REFRESH_TOKEN);
	const session =
		(saved && (await authFetch('token?grant_type=refresh_token', { refresh_token: saved }))) ||
		(await authFetch('signup', { data: {} }));
	if (!session?.access_token || !session.refresh_token) return null;
	await AsyncStorage.setItem(MainStorageKeyType.SUPABASE_REFRESH_TOKEN, session.refresh_token);
	return session.access_token;
};

/**
 * 구독 만료 시각(ms). 모르면(평생 상품 포함) undefined → expires_at 은 null 로 남는다.
 * - iOS: JWS payload 의 expiresDate (정확)
 * - Android: 구매 시각부터 1개월씩 now 이후가 될 때까지 더한 값
 *   ponytail: 자동 갱신 가정의 추정치. 정확히 하려면 Play Developer API 로 서버 검증
 */
export const expiresAtOf = (p: PurchaseLike): number | undefined => {
	if (!isSubSku(p.productId)) return undefined;
	try {
		if (p.jwsRepresentationIos) {
			const b64 = p.jwsRepresentationIos.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
			return JSON.parse(atob(b64)).expiresDate || undefined;
		}
		if (!p.transactionDate) return undefined;
		const d = new Date(p.transactionDate);
		while (d.getTime() <= Date.now()) d.setMonth(d.getMonth() + 1);
		return d.getTime();
	} catch {
		return undefined;
	}
};

/** 마지막으로 서버에 남긴 기록 — 앱을 켤 때마다 같은 영수증을 다시 보내지 않게 */
const RECORDED_KEY = 'IAP_RECORDED';

const recordPurchase = async (p: PurchaseLike) => {
	// 예전 평생 상품(LEGACY_LIFETIME_SKU)은 접두사가 달라 공용 함수가 400 으로 거절한다 — 보내면 실행마다 재시도만 쌓인다
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !p.transactionId || !isRemoveAdSku(p.productId) || p.productId === LEGACY_LIFETIME_SKU) return;
	try {
		const expiresAt = expiresAtOf(p);
		const sig = `${p.transactionId}|${expiresAt ?? ''}`;
		if ((await AsyncStorage.getItem(RECORDED_KEY)) === sig) return;
		const token = await getAccessToken();
		if (!token) return;
		const r = await fetch(`${SUPABASE_URL}/functions/v1/purchases`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
			body: JSON.stringify({
				appId: BUNDLE,
				platform: Platform.OS,
				transactionId: p.transactionId,
				productId: p.productId,
				// iOS 는 purchaseToken 이 비어 있어 서명 트랜잭션(JWS)을 대신 남긴다 — 추후 서버 검증용
				purchaseToken: p.purchaseToken || p.jwsRepresentationIos || undefined,
				purchasedAt: p.transactionDate || undefined,
				expiresAt,
			}),
		});
		// 실패하면 표시를 남기지 않아 다음 실행 때 다시 보낸다
		if (r.ok) await AsyncStorage.setItem(RECORDED_KEY, sig);
		else console.warn('[IAP] purchase record rejected:', r.status, await r.text());
	} catch (e) {
		console.warn('[IAP] purchase record failed:', e);
	}
};

// ─── 연결 / 리스너 ────────────────────────────────────────────
let connecting: Promise<boolean> | null = null;
let connected = false;

export interface IapError {
	code?: string;
	message?: string;
}
const errorListeners = new Set<(e: IapError) => void>();
export const subscribePurchaseError = (cb: (e: IapError) => void): (() => void) => {
	errorListeners.add(cb);
	return () => errorListeners.delete(cb);
};
export const isCancelError = (code?: string): boolean => /cancel/i.test(String(code ?? ''));

const attachListeners = (mod: IapModule) => {
	mod.purchaseUpdatedListener(async (purchase) => {
		const p = purchase as PurchaseLike;
		// 결제 대기는 승인(acknowledge)도 불가 — 결제가 끝나면 리스너가 PURCHASED 로 다시 불린다
		if (p.purchaseStateAndroid === ANDROID_PURCHASE_PENDING) return;
		try {
			if (isRemoveAdSku(p.productId)) {
				if (isLifetimeSku(p.productId)) await markLifetime();
				await grantAdsRemoved(p);
				recordPurchase(p);
			}
			await mod.finishTransaction({ purchase, isConsumable: false });
		} catch (e) {
			console.warn('[IAP] purchase handling failed:', e);
		}
	});
	mod.purchaseErrorListener((e) => {
		const payload: IapError = { code: String(e.code ?? ''), message: e.message };
		errorListeners.forEach((cb) => cb(payload));
	});
};

export const ensureConnected = async (): Promise<boolean> => {
	if (connected) return true;
	const mod = getIap();
	if (!mod) return false;
	connecting ??= (async () => {
		try {
			// StoreKit 2: 권한 재검증 시 App Store 로그인 팝업이 뜨지 않는다 (최소 iOS 16)
			mod.setup({ storekitMode: 'STOREKIT2_MODE' });
			await mod.initConnection();
			connected = true;
			attachListeners(mod);
			if (Platform.OS === 'android') {
				await mod.flushFailedPurchasesCachedAsPendingAndroid().catch(() => {});
			}
			return true;
		} catch (e) {
			console.warn('[IAP] initConnection failed:', e);
			return false;
		} finally {
			connecting = null;
		}
	})();
	return connecting;
};

/**
 * 스토어의 현재 유효 구독(+ 평생 상품)으로 권한 재검증
 * - 보이면 만료 시각 갱신
 * - 안 보이면 저장된 만료 시각이 지났을 때만 해제 (빈 목록 한 번으로는 해제하지 않는다 — adsRemovedUntil 참고)
 * @returns 광고 제거 여부, 확인 불가(오프라인·모듈 없음)면 null
 */
export const checkStore = async (): Promise<boolean | null> => {
	const mod = getIap();
	if (!mod || !(await ensureConnected())) return null;
	try {
		const purchases = (await mod.getAvailablePurchases()) as PurchaseLike[];
		const owned = purchases.filter(
			(p) => isRemoveAdSku(p.productId) && p.purchaseStateAndroid !== ANDROID_PURCHASE_PENDING,
		);
		if (owned.some((p) => isLifetimeSku(p.productId))) await markLifetime();
		const active = owned.find((p) => isSubSku(p.productId)) ?? owned[0];
		if (!active) {
			if (lifetimeOwner || adsRemovedUntil > Date.now()) return true;
			if (adsRemovedCache !== false) await persistAdsRemovedUntil(0);
			return false;
		}
		await grantAdsRemoved(active);
		recordPurchase(active);
		// 리스너를 놓친 구매(결제 직후 앱 종료 등)도 여기서 승인 — Google Play 는 3일 안에 승인 안 되면 자동 환불한다
		if (active.isAcknowledgedAndroid === false) {
			mod.finishTransaction({ purchase: active as never, isConsumable: false }).catch(() => {});
		}
		return true;
	} catch (e) {
		console.warn('[IAP] entitlement check failed:', e);
		return null;
	}
};

/** 저장된 플래그 복원 (광고 판단이 늦지 않게 스토어보다 먼저) */
export const loadCachedAdsRemoved = async (): Promise<void> => {
	try {
		const [[, removed], [, legacy]] = await AsyncStorage.multiGet([
			MainStorageKeyType.AD_REMOVED,
			MainStorageKeyType.LEGACY_PURCHASE_INFO,
		]);
		lifetimeOwner = !!legacy && JSON.parse(legacy)?.isRemoveAds === true;
		// 이전 버전은 'true'/'false' 를 저장했다 — 'true' 는 하루 유예를 주고 스토어 재검증이 실제 만료일로 바꾼다
		adsRemovedUntil = removed === 'true' ? Date.now() + DAY : Number(removed) || 0;
	} catch {}
	setAdsRemoved(lifetimeOwner || adsRemovedUntil > Date.now());
};

let appStateSub: { remove: () => void } | null = null;

/** 앱 시작 시 1회: 캐시 로드 → 스토어 재검증 */
export const initPurchase = async (): Promise<void> => {
	await loadCachedAdsRemoved();
	await checkStore();
	// 포그라운드 복귀마다 재검증 — 구독 관리에서 해지·만료, 다른 기기 구매를 앱 재시작 없이 반영
	appStateSub ??= AppState.addEventListener('change', (s) => {
		if (s === 'active') checkStore();
	});
};

// ─── 상품 조회 / 구매 ─────────────────────────────────────────
export type PlanPrices = Record<PlanKey, string>;
type AndroidOffer = {
	basePlanId: string;
	offerId?: string | null;
	offerToken: string;
	pricingPhases: { pricingPhaseList: { formattedPrice: string }[] };
};
type SubLike = { productId: string; localizedPrice?: string; subscriptionOfferDetails?: AndroidOffer[] };

const fetchSubs = async (mod: IapModule): Promise<SubLike[]> => {
	try {
		return (await mod.getSubscriptions({ skus: SUB_SKUS })) as SubLike[];
	} catch (e) {
		console.warn('[IAP] getSubscriptions failed:', e);
		return [];
	}
};

const fetchLifetime = async (mod: IapModule): Promise<{ localizedPrice?: string } | undefined> => {
	try {
		return (await mod.getProducts({ skus: [LIFETIME_SKU] }))[0];
	} catch (e) {
		console.warn('[IAP] getProducts failed:', e);
		return undefined;
	}
};

/** Android 월 구독 기본 요금제(프로모션 offer 가 아닌 것) */
const basePlanOffer = (subs: SubLike[]) =>
	subs.find((s) => s.productId === SKUS.monthly)?.subscriptionOfferDetails?.find((o) => !o.offerId);

/** 스토어 표시 가격 (못 가져온 항목은 FALLBACK_PRICES) */
export const getPlanPrices = async (): Promise<PlanPrices> => {
	const mod = getIap();
	if (!mod || !(await ensureConnected())) return FALLBACK_PRICES;
	const [subs, lifetime] = await Promise.all([fetchSubs(mod), fetchLifetime(mod)]);
	const monthly =
		Platform.OS === 'ios'
			? subs.find((s) => s.productId === SKUS.monthly)?.localizedPrice
			: basePlanOffer(subs)?.pricingPhases.pricingPhaseList.slice(-1)[0]?.formattedPrice;
	return { monthly: monthly ?? FALLBACK_PRICES.monthly, lifetime: lifetime?.localizedPrice ?? FALLBACK_PRICES.lifetime };
};

export type PurchaseFailReason = 'no-module' | 'not-connected' | 'no-product' | 'cancelled' | 'failed';
export interface PurchaseRequestResult {
	ok: boolean;
	reason?: PurchaseFailReason;
	message?: string;
}

/** 구독·평생 이용권 구매 요청 (성공 처리는 purchaseUpdatedListener) */
export const subscribeRemoveAds = async (plan: PlanKey): Promise<PurchaseRequestResult> => {
	const mod = getIap();
	if (!mod) return { ok: false, reason: 'no-module' };
	if (!(await ensureConnected())) return { ok: false, reason: 'not-connected' };
	try {
		if (plan === 'lifetime') {
			// getProducts 를 먼저 불러야 Android 결제창이 상품을 찾는다
			if (!(await fetchLifetime(mod))) return { ok: false, reason: 'no-product' };
			await mod.requestPurchase(Platform.OS === 'ios' ? { sku: LIFETIME_SKU } : { skus: [LIFETIME_SKU] });
			return { ok: true };
		}
		const subs = await fetchSubs(mod);
		if (Platform.OS === 'ios') {
			if (!subs.some((s) => s.productId === SKUS.monthly)) return { ok: false, reason: 'no-product' };
			await mod.requestSubscription({ sku: SKUS.monthly });
		} else {
			const offer = basePlanOffer(subs);
			if (!offer) return { ok: false, reason: 'no-product' };
			await mod.requestSubscription({ subscriptionOffers: [{ sku: SKUS.monthly, offerToken: offer.offerToken }] });
		}
		return { ok: true };
	} catch (e) {
		const err = e as IapError;
		if (isCancelError(err?.code)) return { ok: false, reason: 'cancelled' };
		console.warn('[IAP] purchase request failed:', err?.code, err?.message);
		return { ok: false, reason: 'failed', message: err?.message };
	}
};

/** 구매 복원 — 기기 변경·재설치 */
export const restorePurchases = checkStore;

/** 스토어 구독 관리 화면 (해지·플랜 변경) */
export const openManageSubscriptions = () => {
	const url =
		Platform.OS === 'ios'
			? 'https://apps.apple.com/account/subscriptions'
			: `https://play.google.com/store/account/subscriptions?package=${BUNDLE}`;
	Linking.openURL(url).catch(() => {});
};
