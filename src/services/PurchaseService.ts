import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IAP_REMOVE_AD_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

/**
 * 광고 제거 구독 서비스 (react-native-iap v13, 자동 갱신 구독) — 3ha-four-idioms 와 같은 구조
 * - iOS·Android 공통 상품 2개: com.tha.proverbquiz.remove_ad.monthly / .yearly
 *   (iOS 는 같은 구독 그룹, Android 는 구독마다 기본 요금제(base plan) 1개)
 * - 앱의 모든 기능은 계속 무료다. 구독은 광고만 없앤다.
 * - 1.3~1.4 에서 팔던 평생 광고 제거(com.tha.iap.remove_ad, 비소모성) 구매자는 구독 없이도 영구히 광고 제거.
 *   스토어 구매 이력 또는 당시 저장한 PURCHASE_INFO 플래그 중 하나만 있어도 인정한다.
 * - 권한의 진실 원천은 스토어(getAvailablePurchases = 현재 유효한 구독 + 보유 비소모성).
 *   AsyncStorage 플래그는 오프라인·앱 시작 직후용 캐시일 뿐이다.
 * - 구매 기록은 공용 Supabase Edge Function(purchases, 소스는 3ha-hanpick) → tb_purchases 에 남긴다. 실패해도 권한엔 영향 없음.
 *
 * [버전] RN 0.78 이라 react-native-iap 13.x 고정 (14+ 는 Kotlin 2.2 요구). Billing 8 패치는 .yarn/patches 참고
 */

export type PlanKey = 'monthly' | 'yearly';

const BUNDLE = 'com.tha.proverbquiz';
export const SKUS: Record<PlanKey, string> = {
	monthly: `${BUNDLE}.remove_ad.monthly`,
	yearly: `${BUNDLE}.remove_ad.yearly`,
};
const SUB_SKUS = Object.values(SKUS);
/** 예전 평생 광고 제거 상품 — 새로 팔지 않고 보유자만 인정한다 */
export const LIFETIME_SKU = IAP_REMOVE_AD_KEY || 'com.tha.iap.remove_ad';

/** 스토어 조회 실패(시뮬레이터·심사 전) 시 화면에 보여줄 기본 가격 */
export const FALLBACK_PRICES: Record<PlanKey, string> = { monthly: '₩3,900', yearly: '₩19,800' };

// ─── 광고 제거 플래그 (동기 캐시 + 구독) ───────────────────────
let adsRemovedCache = false;
/** 평생 광고 제거 보유자 — 구독 재검증이 이 사용자를 해제하지 않는다 */
let lifetimeOwner = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const isAdsRemoved = (): boolean => adsRemovedCache;
export const isLifetimeOwner = (): boolean => lifetimeOwner;

/** useSyncExternalStore 호환 구독 */
export const subscribeAdsRemoved = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

/** 마지막 구매 반영 시각 — 결제 직후 재검증이 아직 반영 전 목록으로 되돌리지 않게 */
let lastGrantAt = 0;

const persistAdsRemoved = async (removed: boolean) => {
	const next = removed || lifetimeOwner;
	if (removed) lastGrantAt = Date.now();
	if (adsRemovedCache !== next) {
		adsRemovedCache = next;
		notify();
	}
	try {
		await AsyncStorage.setItem(MainStorageKeyType.AD_REMOVED, next ? 'true' : 'false');
	} catch {}
};

/** 평생 구매자 표시 — 예전 앱과 같은 키·모양으로 남겨 두어 오프라인에서도 유지된다 */
const markLifetime = async () => {
	if (lifetimeOwner) return;
	lifetimeOwner = true;
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
const isRemoveAdSku = (productId?: string) => isSubSku(productId) || productId === LIFETIME_SKU;

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
 * - Android: 구매 시각부터 요금제 기간(상품 ID 로 판별)을 now 이후가 될 때까지 더한 값
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
		const months = p.productId === SKUS.yearly ? 12 : 1;
		const d = new Date(p.transactionDate);
		while (d.getTime() <= Date.now()) d.setMonth(d.getMonth() + months);
		return d.getTime();
	} catch {
		return undefined;
	}
};

/** 마지막으로 서버에 남긴 기록 — 앱을 켤 때마다 같은 영수증을 다시 보내지 않게 */
const RECORDED_KEY = 'IAP_RECORDED';

const recordPurchase = async (p: PurchaseLike) => {
	// 평생 광고 제거는 더 팔지 않는 예전 상품이라 기록하지 않는다 — 권한은 스토어·PURCHASE_INFO 로 유지
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !p.transactionId || !isSubSku(p.productId)) return;
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
				if (p.productId === LIFETIME_SKU) await markLifetime();
				await persistAdsRemoved(true);
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
		if (owned.some((p) => p.productId === LIFETIME_SKU)) await markLifetime();
		const active = owned.find((p) => isSubSku(p.productId)) ?? owned[0];
		// 결제창이 닫히며 포그라운드 복귀 재검증이 겹칠 수 있다 — 1분 안의 구매는 해제하지 않는다
		if (!active && Date.now() - lastGrantAt < 60_000) return true;
		await persistAdsRemoved(!!active);
		if (active) {
			recordPurchase(active);
			// 리스너를 놓친 구매(결제 직후 앱 종료 등)도 여기서 승인 — Google Play 는 3일 안에 승인 안 되면 자동 환불한다
			if (active.isAcknowledgedAndroid === false) {
				mod.finishTransaction({ purchase: active as never, isConsumable: false }).catch(() => {});
			}
		}
		return adsRemovedCache;
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
		adsRemovedCache = removed === 'true' || lifetimeOwner;
		notify();
	} catch {}
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

/** Android 기본 요금제(프로모션 offer 가 아닌 것) */
const basePlanOffer = (subs: SubLike[], plan: PlanKey) =>
	subs.find((s) => s.productId === SKUS[plan])?.subscriptionOfferDetails?.find((o) => !o.offerId);

/** 스토어 표시 가격 (못 가져온 항목은 FALLBACK_PRICES) */
export const getPlanPrices = async (): Promise<PlanPrices> => {
	const mod = getIap();
	if (!mod || !(await ensureConnected())) return FALLBACK_PRICES;
	const subs = await fetchSubs(mod);
	const price = (plan: PlanKey) =>
		Platform.OS === 'ios'
			? subs.find((s) => s.productId === SKUS[plan])?.localizedPrice
			: basePlanOffer(subs, plan)?.pricingPhases.pricingPhaseList.slice(-1)[0]?.formattedPrice;
	return { monthly: price('monthly') ?? FALLBACK_PRICES.monthly, yearly: price('yearly') ?? FALLBACK_PRICES.yearly };
};

export type PurchaseFailReason = 'no-module' | 'not-connected' | 'no-product' | 'cancelled' | 'failed';
export interface PurchaseRequestResult {
	ok: boolean;
	reason?: PurchaseFailReason;
	message?: string;
}

/** 구독 요청 (성공 처리는 purchaseUpdatedListener) */
export const subscribeRemoveAds = async (plan: PlanKey): Promise<PurchaseRequestResult> => {
	const mod = getIap();
	if (!mod) return { ok: false, reason: 'no-module' };
	if (!(await ensureConnected())) return { ok: false, reason: 'not-connected' };
	const subs = await fetchSubs(mod);
	try {
		if (Platform.OS === 'ios') {
			if (!subs.some((s) => s.productId === SKUS[plan])) return { ok: false, reason: 'no-product' };
			await mod.requestSubscription({ sku: SKUS[plan] });
		} else {
			const offer = basePlanOffer(subs, plan);
			if (!offer) return { ok: false, reason: 'no-product' };
			await mod.requestSubscription({ subscriptionOffers: [{ sku: SKUS[plan], offerToken: offer.offerToken }] });
		}
		return { ok: true };
	} catch (e) {
		const err = e as IapError;
		if (isCancelError(err?.code)) return { ok: false, reason: 'cancelled' };
		console.warn('[IAP] requestSubscription failed:', err?.code, err?.message);
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
