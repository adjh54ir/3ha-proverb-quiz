import { GOOGLE_ADMOV_ANDROID_FRONT, GOOGLE_ADMOV_IOS_FRONT } from '@env';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { InterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { isInterstitialBlocked, recordAdClick } from '@/utils/AdGuardUtils';
import { FullScreenPortal } from '@/screens/common/atomic/FullScreenPortal';
import { isAdsRemoved } from '@/services/PurchaseService';
import { logAdClick } from './logAdClick';

const AD_UNIT_ID = Platform.select({
	ios: __DEV__ ? TestIds.INTERSTITIAL : GOOGLE_ADMOV_IOS_FRONT!,
	android: __DEV__ ? TestIds.INTERSTITIAL : GOOGLE_ADMOV_ANDROID_FRONT!,
})!;

/**
 * 일반 전면 광고 (보상 없음)
 * 
 * 
 * 
	const shouldShowAd = Math.random() < 0.2; // 20% 확률
	const [showAd, setShowAd] = useState(false);
  const [nextContinent, setNextContinent] = useState<ContinentType | null>(null);
 
  onPress={() => {
  if (item.key === 'all') {
	if (shouldShowAd) {
	  setShowAd(true);
	} else {
	  moveToHandler.quizMain(); // 바로 퀴즈로 이동
	}
  }
  if (item.key === 'region') moveToHandler.quizRegin();

  {showAd && (
	<AdmobFrontAd
	  onAdClosed={() => {
		setShowAd(false);
		const allCountries = CountryServices.selectCountryRandomList();
		//@ts-ignore
		navigation.push(Paths.QUIZ_MAIN, {
		  questionPool: allCountries,
		  title: '전체 퀴즈',
		});
	  }}
	/>
  )}

}}>
 * 
 * 
 */
const AdmobFrontAd: React.FC<{ onAdClosed?: () => void }> = ({ onAdClosed }) => {
	const [loaded, setLoaded] = useState(false);
	/** 하루 클릭 한도에 걸려 광고를 건너뛴 상태 — 로딩 오버레이도 그리지 않는다. */
	const [skipped, setSkipped] = useState(false);
	const adRef = useRef<InterstitialAd | null>(null);

	/** 전면 광고 요청 + 이벤트 구독. 구독 해제 함수를 돌려준다. */
	const setupAd = () => {
		const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID);
		adRef.current = ad;

		const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
			console.log('✅ 전면 광고 로딩 완료');
			setLoaded(true);
			ad.show();
		});

		const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
			console.log('✅ 전면 광고 닫힘');
			setLoaded(false);
			onAdClosed?.();
		});

		const unsubscribeFailed = ad.addAdEventListener(AdEventType.ERROR, (error) => {
			console.warn('❌ 광고 로딩 실패:', error?.message ?? error);
			setLoaded(false);
			onAdClosed?.();
		});

		// 클릭을 기록해 하루 한도를 넘으면 그날은 전면 광고를 멈춘다(무효 트래픽 방지)
		const unsubscribeClicked = ad.addAdEventListener(AdEventType.CLICKED, () => {
			void logAdClick('interstitial', AD_UNIT_ID);
			recordAdClick();
		});

		console.log('📦 전면 광고 로드 시작');
		ad.load();

		return () => {
			unsubscribeLoaded();
			unsubscribeClosed();
			unsubscribeFailed();
			unsubscribeClicked();
		};
	};

	useEffect(() => {
		// 개발 빌드·광고 제거 이용 중에는 전면 광고를 띄우지 않는다 — 바로 닫힌 것으로 처리해 다음 흐름을 이어간다
		if (__DEV__ || isAdsRemoved()) {
			onAdClosed?.();
			return;
		}

		let cancelled = false;
		let teardown = () => {};

		/**
		 * 오늘 광고 클릭이 한도를 넘었으면 전면 광고를 아예 요청하지 않는다.
		 * 요청 자체를 막아야 노출도 클릭도 발생하지 않아 무효 트래픽 신호가 더 쌓이지 않는다.
		 * 사용자 입장에서는 광고 없이 다음 화면으로 넘어갈 뿐이라 흐름이 끊기지 않는다.
		 */
		isInterstitialBlocked().then((blocked) => {
			if (cancelled) {
				return;
			}
			if (blocked) {
				console.log('🛡️ 광고 클릭 한도 도달 — 전면 광고 건너뜀');
				setSkipped(true);
				onAdClosed?.();
				return;
			}
			teardown = setupAd();
		});

		return () => {
			cancelled = true;
			teardown();
		};
	}, []);


	if (__DEV__ || skipped || isAdsRemoved()) return null;

	// 태블릿은 루트로 올려 좌우 여백까지 딤을 덮는다(화면 안에 두면 본문 기둥 경계에서 잘린다)
	return (
		<FullScreenPortal>
			<View style={styles.adOverlay}>
				<View style={styles.container}>
					<ActivityIndicator size='large' color={COLORS.primary} />
					<Text style={styles.loadingTxt}>광고를 준비 중입니다…</Text>
				</View>
			</View>
		</FullScreenPortal>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	container: {
		paddingHorizontal: SPACING_W.xxl,
		paddingVertical: SPACING_H.xxl,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		alignItems: 'center',
		justifyContent: 'center',
		// 그림자 대신 테두리로 구분한다(앱 전역 규칙).
		// shadowColor 로 쓰던 textDeep 은 다크 팔레트에서 흰색이라 그림자가 흰 광선으로 보였다.
		borderWidth: 1,
		borderColor: COLORS.border,
	},

	adOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999,
	},

	loadingTxt: {
		marginTop: SPACING_H.md,
		fontSize: FONT_SIZES.lg,
		color: COLORS.textStrong,
		fontWeight: '600',
	},
}));

export default AdmobFrontAd;
