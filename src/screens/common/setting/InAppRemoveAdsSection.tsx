import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IconComponent from '../atomic/IconComponent';
import AppAlert from '../modal/AppAlert';
import useAdsRemoved from '@/hooks/useAdsRemoved';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
	FALLBACK_PRICE,
	getRemoveAdsPrice,
	isFromSubscription,
	openManageSubscriptions,
	purchaseRemoveAds,
	restorePurchases,
	subscribePurchaseError,
} from '@/services/PurchaseService';
import { scaledSize, scaleWidth } from '@/utils/DementionUtils';
import { FONT_SIZES, RADIUS, SPACING_H, SPACING_W, displayFontSize, themedStyles } from '@/const/common/Theme';

/*
  광고 제거 카드(평생 이용권 하나) — 설정 화면 '앱이 마음에 드셨습니까?' 바로 아래.
  테마와 무관하게 남색 먹빛 + 금박 톤으로 고정한다(라이트/다크 어디서든 '프리미엄'으로 읽히도록).
  구조·결제 흐름은 3ha-four-idioms 의 같은 이름 컴포넌트와 같다.
*/
const INK = ['#141A2E', '#1C2340', '#2A2440'];
const GOLD = '#D9B77A';
const GOLD_SOFT = 'rgba(217,183,122,0.16)';
const GOLD_LINE = 'rgba(217,183,122,0.38)';
const GOLD_BTN = ['#F3DDAB', '#D9B77A', '#B58B4A'];
const SEAL = '#B8322A';
const IVORY = '#F5EEDF';
const IVORY_DIM = 'rgba(245,238,223,0.64)';
const SERIF = Platform.select({ ios: 'AppleMyungjo', default: 'serif' });

const BENEFITS = [
	'배너·전면 광고가 앱 전체에서 사라져요',
	'광고 시청 없이 타워 보너스 도전을 바로 받아요',
	'흐름이 끊기지 않는 온전한 속담 공부',
];

/** Apple 표준 EULA — 1회 결제 상품이라 필수는 아니지만(자동 갱신 구독만 3.1.2 요구) 결제 화면의 약관 안내로 남겨 둔다 */
const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const InAppRemoveAdsSection = ({ onOpenPolicy }: { onOpenPolicy: () => void }) => {
	const adsRemoved = useAdsRemoved();
	const reducedMotion = useReducedMotion();
	const [price, setPrice] = useState(FALLBACK_PRICE);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		getRemoveAdsPrice().then(setPrice);
		// 실패 안내는 onPurchase 가 맡는다 — Android 는 같은 실패가 이벤트와 reject 로 두 번 와서 알림이 겹친다
		return subscribePurchaseError(() => setBusy(false));
	}, []);

	// 구매 완료는 리스너가 전역 상태로 알려준다 → 여기서 로딩 해제
	useEffect(() => {
		if (adsRemoved) setBusy(false);
	}, [adsRemoved]);

	// CTA 금박 위로 빛이 한 번씩 지나간다 — '애니메이션 줄이기' 사용자는 정지 (정보 손실 없음)
	const shine = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		if (reducedMotion || adsRemoved) return;
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(shine, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
				Animated.delay(2200),
				Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true }),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [shine, reducedMotion, adsRemoved]);

	const onPurchase = async () => {
		setBusy(true);
		const r = await purchaseRemoveAds();
		// 결제창이 닫히면 로딩 해제 — Android 결제 대기(편의점 결제 등)에서 버튼이 영영 잠기지 않게. 성공은 카드 전환으로 보인다
		setBusy(false);
		if (!r.ok) {
			if (r.reason === 'no-product' || r.reason === 'not-connected' || r.reason === 'no-module') {
				AppAlert.alert('알림', '지금은 스토어에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
			} else if (r.reason === 'failed') {
				AppAlert.alert('결제 실패', '결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.');
			}
		}
	};

	const onRestore = async () => {
		setBusy(true);
		const owned = await restorePurchases();
		setBusy(false);
		AppAlert.alert(
			'구매 복원',
			owned === null
				? '스토어에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
				: owned
					? '광고 제거가 복원되었어요.'
					: '복원할 구매 내역이 없어요.',
		);
	};

	return (
		<View style={styles.card}>
			<LinearGradient colors={INK} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
			<View pointerEvents="none" style={styles.glow} />

			{/* 머리: 라벨 + 낙관 */}
			<View style={styles.headRow}>
				<View style={styles.badge}>
					<IconComponent type="MaterialCommunityIcons" name="crown" size={scaledSize(12)} color={GOLD} />
					<Text style={styles.badgeText}>PREMIUM</Text>
				</View>
				<View style={styles.seal}>
					<Text style={styles.sealText}>속</Text>
					<Text style={styles.sealText}>픽</Text>
				</View>
			</View>

			{adsRemoved ? (
				<>
					<Text style={styles.title}>평생 광고 제거 이용 중</Text>
					<Text style={styles.subtitle}>응원해 주셔서 감사합니다.{'\n'}광고 없이 오롯이 속담에만 집중하세요.</Text>
					{/* 예전 월 구독 결제자 — 스토어 자동 갱신은 앱이 멈출 수 없어 직접 해지하도록 안내한다 */}
					{isFromSubscription() && (
						<>
							<View style={styles.note}>
								<IconComponent type="MaterialCommunityIcons" name="information-outline" size={scaledSize(16)} color={GOLD} />
								<Text style={styles.noteText}>
									월 구독이 평생 이용권으로 전환되었어요. 구독을 해지해도 광고는 다시 나오지 않아요.
								</Text>
							</View>
							<Pressable style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]} onPress={openManageSubscriptions}>
								<Text style={styles.ghostBtnText}>구독 해지하기</Text>
							</Pressable>
						</>
					)}
				</>
			) : (
				<>
					<Text style={styles.title}>광고 없이,{'\n'}속담에만 집중.</Text>
					<Text style={styles.subtitle}>한 번의 결제로 앱 속 모든 광고를 제거합니다.</Text>

					<View style={styles.divider} />

					{BENEFITS.map((b) => (
						<View key={b} style={styles.benefitRow}>
							<IconComponent type="MaterialCommunityIcons" name="check-decagram" size={scaledSize(16)} color={GOLD} />
							<Text style={styles.benefitText}>{b}</Text>
						</View>
					))}

					{/* 단일 상품 — 큰 가격 하나로 결정 부담을 없앤다 */}
					<View style={styles.offer}>
						<View style={styles.offerHead}>
							<Text style={styles.offerLabel}>평생 이용권</Text>
							<View style={styles.offerChip}>
								<Text style={styles.offerChipText}>1회 결제</Text>
							</View>
						</View>
						<Text style={styles.offerPrice} numberOfLines={1} adjustsFontSizeToFit>
							{price}
						</Text>
						<Text style={styles.offerCaption}>한 번 결제로 평생 광고 제거 · 자동 갱신 없음</Text>
					</View>

					<Pressable disabled={busy} onPress={onPurchase} style={({ pressed }) => [styles.ctaWrap, pressed && styles.pressed]}>
						<LinearGradient colors={GOLD_BTN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
							{!reducedMotion && (
								<Animated.View
									pointerEvents="none"
									style={[
										styles.shine,
										{
											transform: [
												{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-scaleWidth(80), scaleWidth(380)] }) },
												{ rotate: '20deg' },
											],
										},
									]}
								/>
							)}
							{busy ? (
								<View style={styles.busyRow}>
									<ActivityIndicator size="small" color={INK[0]} />
									<Text style={styles.ctaText}>결제 진행 중…</Text>
								</View>
							) : (
								<Text style={styles.ctaText}>평생 이용권 구매하기</Text>
							)}
						</LinearGradient>
					</Pressable>

					<View style={styles.linkRow}>
						<Text style={styles.link} onPress={busy ? undefined : onRestore}>
							구매 복원
						</Text>
					</View>
					<View style={styles.linkRow}>
						{Platform.OS === 'ios' && (
							<>
								<Text style={styles.link} onPress={() => Linking.openURL(APPLE_EULA_URL).catch(() => {})}>
									이용약관(EULA)
								</Text>
								<Text style={styles.linkDot}>·</Text>
							</>
						)}
						<Text style={styles.link} onPress={onOpenPolicy}>
							개인정보 처리방침
						</Text>
					</View>

					<Text style={styles.legal}>
						평생 이용권은 1회 결제이며 자동 갱신되지 않습니다. 결제 금액은 스토어 계정으로 청구됩니다.
					</Text>
				</>
			)}
		</View>
	);
};

// 글자 크기 모드가 바뀌면 FONT_SIZES 가 달라지므로 themedStyles 로 지연 생성한다
const styles = themedStyles(() =>
	StyleSheet.create({
		card: {
			marginHorizontal: SPACING_W.lg,
			marginTop: SPACING_H.md,
			paddingHorizontal: SPACING_W.xl,
			paddingVertical: SPACING_H.xl,
			borderRadius: RADIUS.lg,
			borderWidth: 1,
			borderColor: GOLD_LINE,
			overflow: 'hidden',
		},
		glow: {
			position: 'absolute',
			top: -scaleWidth(110),
			right: -scaleWidth(80),
			width: scaleWidth(240),
			height: scaleWidth(240),
			borderRadius: scaleWidth(120),
			backgroundColor: 'rgba(217,183,122,0.10)',
		},
		headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
		badge: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: SPACING_W.xs,
			paddingHorizontal: SPACING_W.sm,
			paddingVertical: SPACING_H.xxs,
			borderRadius: RADIUS.round,
			borderWidth: 1,
			borderColor: GOLD_LINE,
			backgroundColor: GOLD_SOFT,
		},
		badgeText: { color: GOLD, fontSize: FONT_SIZES.xxs, fontWeight: '700', letterSpacing: 2 },
		seal: {
			width: scaleWidth(32),
			paddingVertical: SPACING_H.xxs,
			borderRadius: 4,
			backgroundColor: SEAL,
			alignItems: 'center',
			transform: [{ rotate: '4deg' }],
		},
		sealText: { color: IVORY, fontFamily: SERIF, fontSize: FONT_SIZES.lg, lineHeight: FONT_SIZES.lg * 1.2, fontWeight: '700' },
		title: {
			marginTop: SPACING_H.md,
			color: IVORY,
			fontFamily: SERIF,
			fontSize: FONT_SIZES.title,
			lineHeight: FONT_SIZES.title * 1.32,
			fontWeight: '700',
		},
		subtitle: {
			marginTop: SPACING_H.sm,
			color: IVORY_DIM,
			fontSize: FONT_SIZES.smPlus,
			lineHeight: FONT_SIZES.smPlus * 1.55,
		},
		divider: { height: 1, backgroundColor: GOLD_LINE, marginVertical: SPACING_H.lg, opacity: 0.6 },
		benefitRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.sm, marginBottom: SPACING_H.sm },
		benefitText: { color: IVORY, fontSize: FONT_SIZES.md, flexShrink: 1 },
		offer: {
			marginTop: SPACING_H.xl,
			paddingHorizontal: SPACING_W.lg,
			paddingVertical: SPACING_H.lg,
			borderRadius: RADIUS.md,
			borderWidth: 1.5,
			borderColor: GOLD,
			backgroundColor: GOLD_SOFT,
		},
		offerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
		offerLabel: { color: GOLD, fontFamily: SERIF, fontSize: FONT_SIZES.lg, fontWeight: '700', letterSpacing: 0.5 },
		offerChip: {
			paddingHorizontal: SPACING_W.sm,
			paddingVertical: SPACING_H.xxs,
			borderRadius: RADIUS.round,
			backgroundColor: SEAL,
		},
		offerChipText: { color: IVORY, fontSize: FONT_SIZES.xxs, fontWeight: '700' },
		offerPrice: {
			marginTop: SPACING_H.sm,
			color: IVORY,
			fontSize: displayFontSize(36),
			fontWeight: '800',
			letterSpacing: -0.5,
		},
		offerCaption: { marginTop: SPACING_H.xs, color: IVORY_DIM, fontSize: FONT_SIZES.sm },
		ctaWrap: { marginTop: SPACING_H.xl, borderRadius: RADIUS.md, overflow: 'hidden' },
		cta: {
			height: scaledSize(52),
			borderRadius: RADIUS.md,
			alignItems: 'center',
			justifyContent: 'center',
			overflow: 'hidden',
		},
		shine: {
			position: 'absolute',
			top: -scaledSize(20),
			bottom: -scaledSize(20),
			left: 0,
			width: scaleWidth(36),
			backgroundColor: 'rgba(255,255,255,0.38)',
		},
		ctaText: { color: INK[0], fontSize: FONT_SIZES.lg, fontWeight: '800', letterSpacing: 0.5 },
		ghostBtn: {
			marginTop: SPACING_H.lg,
			height: scaledSize(46),
			borderRadius: RADIUS.md,
			borderWidth: 1,
			borderColor: GOLD,
			alignItems: 'center',
			justifyContent: 'center',
		},
		note: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: SPACING_W.sm,
			marginTop: SPACING_H.lg,
			paddingHorizontal: SPACING_W.md,
			paddingVertical: SPACING_H.md,
			borderRadius: RADIUS.md,
			backgroundColor: GOLD_SOFT,
		},
		noteText: { flex: 1, color: IVORY, fontSize: FONT_SIZES.smPlus, lineHeight: FONT_SIZES.smPlus * 1.55 },
		ghostBtnText: { color: GOLD, fontSize: FONT_SIZES.lg, fontWeight: '700' },
		// 테두리 뷰에 scale 을 걸면 iOS 배경 서브레이어 버그를 탄다(CLAUDE.md 모달 규칙 7) — 눌림은 투명도만
		pressed: { opacity: 0.82 },
		busyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.sm },
		linkRow: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			gap: SPACING_W.sm,
			marginTop: SPACING_H.md,
		},
		link: { color: IVORY_DIM, fontSize: FONT_SIZES.sm, textDecorationLine: 'underline', padding: SPACING_W.xs },
		linkDot: { color: IVORY_DIM, fontSize: FONT_SIZES.sm },
		legal: {
			marginTop: SPACING_H.sm,
			color: 'rgba(245,238,223,0.42)',
			fontSize: FONT_SIZES.xxs,
			lineHeight: FONT_SIZES.xxs * 1.6,
			textAlign: 'center',
		},
	}),
);

export default InAppRemoveAdsSection;
