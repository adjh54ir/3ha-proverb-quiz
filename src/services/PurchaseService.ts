import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IAP_REMOVE_AD_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

/**
 * 광고 제거 서비스 (react-native-iap v13) — 3ha-four-idioms 와 같은 구조
 * - 판매 상품은 하나: 평생 이용권(com.tha.proverbquiz.remove_ad, 비소모성, ₩3,900)
 * - 앱의 모든 기능은 계속 무료다. 광고만 없앤다.
 * - 평생 보유자로 인정하는 경우 (한 번 인정되면 LEGACY_PURCHASE_INFO 에 남겨 영구 유지)
 *   - 평생 이용권 또는 1.3~1.4 의 평생 광고 제거(com.tha.iap.remove_ad) 구매
 *   - 1.5 에서 팔던 1개월 구독(com.tha.proverbquiz.remove_ad.monthly) 결제자 — 판매는 끝났고,
 *     스토어에서 보이거나(유효 구독·iOS 구매 이력) 구독 시절 권한 캐시(AD_REMOVED)가 있으면
 *     평생으로 전환한다(fromSubscription). 해지·만료돼도 광고는 다시 나오지 않는다.
 * - 스토어 조회는 보유 여부를 '찾을' 때만 쓴다. 빈 목록으로는 해제하지 않는다 — StoreKit 2 콜드 스타트·
 *   Play 연결 끊김 때도 빈 목록이 오기 때문이고, 평생 상품이라 해제할 일도 환불 말고는 없다.
 * - 구매 기록은 공용 Supabase Edge Function(purchases, 소스는 3ha-hanpick) → tb_purchases 에 남긴다. 실패해도 권한엔 영향 없음.
 *
 * [버전] RN 0.78 이라 react-native-iap 13.x 고정 (14+ 는 Kotlin 2.2 요구). Billing 8 패치는 .yarn/patches 참고
 */

const BUNDLE = 'com.tha.proverbquiz';
/** 평생 광고 제거(비소모성) — 유일한 판매 상품 */
export const LIFETIME_SKU = `${BUNDLE}.remove_ad`;
/** 1.3~1.4 에 팔던 평생 광고 제거 — 새로 팔지 않고 보유자만 인정한다 */
export const LEGACY_LIFETIME_SKU = IAP_REMOVE_AD_KEY || 'com.tha.iap.remove_ad';
/** 1.5 에 팔던 1개월 구독 — 판매 종료. 결제한 적이 있으면 평생 보유자로 인정한다 */
export const LEGACY_MONTHLY_SKU = `${BUNDLE}.remove_ad.monthly`;
const isRemoveAdSku = (productId?: string) =>
	productId === LIFETIME_SKU || productId === LEGACY_LIFETIME_SKU || productId === LEGACY_MONTHLY_SKU;

/** 스토어 조회 실패(시뮬레이터·심사 전) 시 화면에 보여줄 기본 가격 */
export const FALLBACK_PRICE = '₩3,900';

// ─── 광고 제거 플래그 (동기 캐시 + 구독) ───────────────────────
/** null = 캐시를 아직 못 읽음. 이때도 광고를 띄우지 않는다 — 구매자에게 앱 시작 직후 광고가 먼저 뜨지 않게 */
let owner: boolean | null = null;
/** 월 구독 결제자가 평생으로 전환된 경우 — 화면에서 안내·구독 해지 버튼을 보여준다 */
let fromSubscription = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const isAdsRemoved = (): boolean => owner !== false;
export const isFromSubscription = (): boolean => fromSubscription;

/** useSyncExternalStore 호환 구독 */
export const subscribeAdsRemoved = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

const setOwner = (v: boolean) => {
	if (owner === v) return;
	owner = v;
	notify();
};

/** 평생 구매자 표시 — 예전 앱과 같은 키·모양으로 남겨 두어 오프라인에서도 유지된다 */
const markLifetime = async (sub = false) => {
	if (owner && (fromSubscription || !sub)) return;
	fromSubscription ||= sub;
	owner = true;
	notify();
	try {
		await AsyncStorage.setItem(
			MainStorageKeyType.LEGACY_PURCHASE_INFO,
			JSON.stringify({ isRemoveAds: true, fromSubscription, purchaseDate: new Date().toISOString(), platform: Platform.OS }),
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
	/** StoreKit 2 서명 트랜잭션 — 구매 기록에 영수증 대신 남긴다 */
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

/** 마지막으로 서버에 남긴 기록 — 앱을 켤 때마다 같은 영수증을 다시 보내지 않게 */
const RECORDED_KEY = 'IAP_RECORDED';

const recordPurchase = async (p: PurchaseLike) => {
	// 판매 중인 평생 이용권만 남긴다 — 예전 평생 상품(LEGACY_LIFETIME_SKU)은 접두사가 달라 공용 함수가 400 으로 거절한다
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !p.transactionId || p.productId !== LIFETIME_SKU) return;
	try {
		if ((await AsyncStorage.getItem(RECORDED_KEY)) === p.transactionId) return;
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
			}),
		});
		// 실패하면 표시를 남기지 않아 다음 실행 때 다시 보낸다
		if (r.ok) await AsyncStorage.setItem(RECORDED_KEY, p.transactionId);
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
				// 판매 종료된 월 구독의 자동 갱신도 여기로 온다 — 평생으로 전환하고 승인은 그대로 한다
				await markLifetime(p.productId === LEGACY_MONTHLY_SKU);
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
 * 스토어 보유 목록(getAvailablePurchases = 보유 비소모성 + 현재 유효한 구독)에서 광고 제거 상품을 찾으면 평생 보유자로 저장
 * - 못 찾아도 이미 보유자면 해제하지 않는다 (빈 목록은 "구매 없음"만 뜻하지 않는다 — 머리 주석 참고)
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
		if (owned.length) await markLifetime(owned.some((p) => p.productId === LEGACY_MONTHLY_SKU));
		else setOwner(!!owner);
		for (const p of owned) {
			recordPurchase(p);
			// 리스너를 놓친 구매(결제 직후 앱 종료 등)도 여기서 승인 — Google Play 는 3일 안에 승인 안 되면 자동 환불한다
			if (p.isAcknowledgedAndroid === false) {
				mod.finishTransaction({ purchase: p as never, isConsumable: false }).catch(() => {});
			}
		}
		return !!owner;
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
		const info = legacy ? JSON.parse(legacy) : null;
		fromSubscription = info?.fromSubscription === true;
		if (info?.isRemoveAds === true) return setOwner(true);
		// 월 구독 시절 권한 캐시('true' 또는 만료 시각 ms). 0 이 아닌 값은 결제한 적이 있다는 뜻 → 만료됐어도 평생으로 전환
		if (removed === 'true' || Number(removed) > 0) return await markLifetime(true);
	} catch {}
	setOwner(!!owner);
};

let appStateSub: { remove: () => void } | null = null;

/** 앱 시작 시 1회: 캐시 로드 → 스토어 재검증 */
export const initPurchase = async (): Promise<void> => {
	await loadCachedAdsRemoved();
	await checkStore();
	// 포그라운드 복귀마다 재검증 — 다른 기기에서 산 구매를 앱 재시작 없이 반영
	appStateSub ??= AppState.addEventListener('change', (s) => {
		if (s === 'active') checkStore();
	});
};

// ─── 상품 조회 / 구매 ─────────────────────────────────────────
const fetchLifetime = async (mod: IapModule): Promise<{ localizedPrice?: string } | undefined> => {
	try {
		return (await mod.getProducts({ skus: [LIFETIME_SKU] }))[0];
	} catch (e) {
		console.warn('[IAP] getProducts failed:', e);
		return undefined;
	}
};

/** 평생 이용권 스토어 표시 가격 (못 가져오면 FALLBACK_PRICE) */
export const getRemoveAdsPrice = async (): Promise<string> => {
	const mod = getIap();
	if (!mod || !(await ensureConnected())) return FALLBACK_PRICE;
	return (await fetchLifetime(mod))?.localizedPrice ?? FALLBACK_PRICE;
};

export type PurchaseFailReason = 'no-module' | 'not-connected' | 'no-product' | 'cancelled' | 'failed';
export interface PurchaseRequestResult {
	ok: boolean;
	reason?: PurchaseFailReason;
	message?: string;
}

/** 평생 이용권 구매 요청 (성공 처리는 purchaseUpdatedListener) */
export const purchaseRemoveAds = async (): Promise<PurchaseRequestResult> => {
	const mod = getIap();
	if (!mod) return { ok: false, reason: 'no-module' };
	if (!(await ensureConnected())) return { ok: false, reason: 'not-connected' };
	try {
		// getProducts 를 먼저 불러야 Android 결제창이 상품을 찾는다
		if (!(await fetchLifetime(mod))) return { ok: false, reason: 'no-product' };
		await mod.requestPurchase(Platform.OS === 'ios' ? { sku: LIFETIME_SKU } : { skus: [LIFETIME_SKU] });
		return { ok: true };
	} catch (e) {
		const err = e as IapError;
		if (isCancelError(err?.code)) return { ok: false, reason: 'cancelled' };
		console.warn('[IAP] purchase request failed:', err?.code, err?.message);
		return { ok: false, reason: 'failed', message: err?.message };
	}
};

/**
 * 구매 복원 — 기기 변경·재설치, 해지된 예전 월 구독 결제자
 * iOS 는 구매 이력(StoreKit 2 는 만료된 구독도 돌려준다)까지 본다.
 * Android 는 Billing 8 에서 구매 이력 API 가 없어져, 해지·만료된 구독은 앱에서 확인할 길이 없다(유효 구독만 보인다).
 */
export const restorePurchases = async (): Promise<boolean | null> => {
	const owned = await checkStore();
	if (owned !== false || Platform.OS !== 'ios') return owned;
	try {
		const history = ((await getIap()?.getPurchaseHistory()) ?? []) as PurchaseLike[];
		const found = history.filter((p) => isRemoveAdSku(p.productId));
		if (found.length) await markLifetime(found.some((p) => p.productId === LEGACY_MONTHLY_SKU));
	} catch (e) {
		console.warn('[IAP] purchase history failed:', e);
	}
	return !!owner;
};

/** 스토어 구독 관리 화면 — 판매는 끝났지만 예전 월 구독이 아직 자동 갱신 중일 수 있다(판매 중단은 기존 갱신을 멈추지 않는다) */
export const openManageSubscriptions = () => {
	const url =
		Platform.OS === 'ios'
			? 'https://apps.apple.com/account/subscriptions'
			: `https://play.google.com/store/account/subscriptions?package=${BUNDLE}`;
	Linking.openURL(url).catch(() => {});
};
