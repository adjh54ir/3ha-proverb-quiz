import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import DateUtils from '@/utils/DateUtils';
import { GOOGLE_ADMOV_ANDROID_FRONT, GOOGLE_ADMOV_IOS_FRONT } from '@env';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { InterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import analytics from '@react-native-firebase/analytics'; // Firebase Analytics
import DeviceInfo from 'react-native-device-info';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { isInterstitialBlocked, recordAdClick } from '@/utils/AdGuardUtils';

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

		const logEvent = async (name: string, additionalParams = {}) => {

			const instanceId = await analytics().getAppInstanceId();
			try {
				await analytics().logEvent(name, {
					ad_platform: 'admob', // 📌 광고 플랫폼 이름 (예: admob, facebook 등)
					ad_format: 'interstitial', // 📌 광고 형식 (전면광고, 배너, 리워드 등)
					ad_unit_id: AD_UNIT_ID, // 📌 실제 사용 중인 광고 유닛 ID (식별/필터링용)
					app_name: DeviceInfo.getApplicationName(), // 📱 앱 이름 (예: "MyApp")
					app_version: DeviceInfo.getVersion(),      // 🏷️ 앱 버전 (예: "1.0.3")
					build_number: DeviceInfo.getBuildNumber(), // 🏗️ 빌드 번호 (예: "100")
					device_platform: Platform.OS,              // 💻 디바이스 플랫폼 ('ios' 또는 'android')
					device_model: DeviceInfo.getModel(),       // 📱 기기 모델명 (예: "iPhone 15 Pro")
					device_brand: DeviceInfo.getBrand(),       // 🏷️ 제조사 (예: "Apple", "Samsung")
					system_version: DeviceInfo.getSystemVersion(), // 🧪 OS 버전 (예: "17.5")
					app_instance_id: instanceId,               // 🆔 Firebase 고유 사용자 식별자 (익명 추적 ID)
					timestamp: DateUtils.now().toISOString(),       // 🕒 이벤트 발생 시각 (ISO 형식, 예: "2025-08-04T06:21:00Z")
					...additionalParams,                       // 🧩 기타 추가 파라미터 (사용자 정의 값)
				});
			} catch (error) {
				console.error(`❌ Failed to log ${name}:`, error);
			}
		};

		const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
			console.log('✅ 전면 광고 로딩 완료');
			logEvent('ad_interstitial_loaded');
			setLoaded(true);
			ad.show();
		});

		const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
			console.log('✅ 전면 광고 닫힘');
			logEvent('ad_interstitial_closed');
			setLoaded(false);
			onAdClosed?.();
		});

		const unsubscribeFailed = ad.addAdEventListener(AdEventType.ERROR, (error) => {
			console.warn('❌ 광고 로딩 실패:', error?.message ?? error);
			logEvent('ad_interstitial_failed', { error_message: error?.message ?? String(error) });
			setLoaded(false);
			onAdClosed?.();
		});

		// 클릭을 기록해 하루 한도를 넘으면 그날은 전면 광고를 멈춘다(무효 트래픽 방지)
		const unsubscribeClicked = ad.addAdEventListener(AdEventType.CLICKED, () => {
			logEvent('ad_interstitial_clicked');
			recordAdClick();
		});

		console.log('📦 전면 광고 로드 시작');
		logEvent('ad_interstitial_request');
		ad.load();

		return () => {
			unsubscribeLoaded();
			unsubscribeClosed();
			unsubscribeFailed();
			unsubscribeClicked();
		};
	};

	useEffect(() => {
		// 개발 빌드에서는 전면 광고를 띄우지 않는다 — 바로 닫힌 것으로 처리해 다음 흐름을 이어간다
		if (__DEV__) {
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


	if (__DEV__ || skipped) return null;

	return (
		<View style={styles.adOverlay}>
			<View style={styles.container}>
				<ActivityIndicator size='large' color={COLORS.primary} />
				<Text style={styles.loadingTxt}>광고를 준비 중입니다…</Text>
			</View>
		</View>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	container: {
		padding: SPACING_H.xxl,
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

	subTxt: {
		marginTop: SPACING_H.xs,
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
	},

	mascotImage: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		marginBottom: SPACING_H.lg,
		opacity: 0.9,
	},
}));

export default AdmobFrontAd;
