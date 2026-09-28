// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * 속담 퀴즈 앱 구매 기록 → 공용 tb_purchases (여러 앱이 app_id 로 나눠 쓰는 테이블)
 * -------------------------------------------------
 *   POST { platform, transactionId, productId, purchaseToken?, purchasedAt?(ms), expiresAt?(ms) }  → { ok: true }
 *   Authorization: Bearer <앱의 익명 로그인 access token>  — user_id 는 이 토큰의 uid 로만 정한다
 *
 * APP_ID 는 고정 — 이 함수로는 다른 앱의 app_id 에 쓰지 못한다.
 * 같은 영수증이 다른 uid 로 들어오면(기기 변경 = 새 익명 uid) 소유자를 이관한다 — tb_purchases 의 claim 정책과 같은 규칙.
 *
 * 배포:
 *   supabase functions deploy proverbquiz-purchases
 *
 * ponytail: 클라이언트가 보낸 영수증을 그대로 믿는다(App Store Server API / Play Developer API 검증 없음).
 *   위조가 문제되면 purchaseToken 을 서버에서 검증 — 키는 PROVERBQUIZ_* secret 으로 둔다.
 */

const APP_ID = "com.tha.proverbquiz";
// 1.3~1.4 에 팔던 평생 광고 제거(비소모성) — 앱 도메인 접두사가 없는 예전 ID 라 따로 허용한다
const LEGACY_LIFETIME_SKU = "com.tha.iap.remove_ad";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

// iOS 는 purchaseToken 자리에 JWS(수 KB)가 온다
const str = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 16384;
const ms = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

Deno.serve(async (req) => {
	if (req.method !== "POST") return json({ error: "method" }, 405);

	const token = req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
	const { data: auth } = await db.auth.getUser(token);
	if (!auth?.user) return json({ error: "auth" }, 401);

	let b: Record<string, unknown>;
	try {
		b = await req.json();
	} catch {
		return json({ error: "body" }, 400);
	}
	if (b.platform !== "ios" && b.platform !== "android") return json({ error: "platform" }, 400);
	if (!str(b.transactionId)) return json({ error: "transactionId" }, 400);
	if (!str(b.productId) || !(b.productId.startsWith(`${APP_ID}.`) || b.productId === LEGACY_LIFETIME_SKU)) return json({ error: "productId" }, 400);
	if (b.purchaseToken != null && !str(b.purchaseToken)) return json({ error: "purchaseToken" }, 400);
	if (b.expiresAt != null && ms(b.expiresAt) == null) return json({ error: "expiresAt" }, 400);
	const expires = ms(b.expiresAt);

	const now = new Date().toISOString();
	const { error } = await db.from("tb_purchases").upsert(
		{
			app_id: APP_ID,
			transaction_id: b.transactionId,
			user_id: auth.user.id,
			product_id: b.productId,
			platform: b.platform,
			purchase_token: b.purchaseToken ?? null,
			purchased_at: new Date(ms(b.purchasedAt) ?? Date.now()).toISOString(),
			// 갱신마다 트랜잭션 ID 가 새로 나와 행이 쌓인다 — 현재 만료일은 가장 늦은 expires_at
			expires_at: expires == null ? null : new Date(expires).toISOString(),
			updated_at: now,
		},
		{ onConflict: "app_id,transaction_id" },
	);
	if (error) return json({ error: error.message }, 500);
	return json({ ok: true });
});
