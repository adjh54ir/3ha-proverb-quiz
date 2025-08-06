import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { GOOGLE_ADMOV_ANDROID_FRONT, GOOGLE_ADMOV_IOS_FRONT } from '@env';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { InterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import analytics from '@react-native-firebase/analytics'; // Firebase Analytics
import DeviceInfo from 'react-native-device-info';

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
  const adRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
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
          timestamp: new Date().toISOString(),       // 🕒 이벤트 발생 시각 (ISO 형식, 예: "2025-08-04T06:21:00Z")
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

    console.log('📦 전면 광고 로드 시작');
    logEvent('ad_interstitial_request');
    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeFailed();
    };
  }, []);

  return (
    <View style={styles.adOverlay}>
      <View style={styles.container}>
        <ActivityIndicator size='large' color='#3498db' />
        <Text style={styles.loadingTxt}>광고를 준비 중이에요…</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scaleHeight(24),
    backgroundColor: '#fff',
    borderRadius: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },

  adOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', // 더 어둡게
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  loadingTxt: {
    marginTop: scaleHeight(12),
    fontSize: scaledSize(16),
    color: '#2c3e50',
    fontWeight: '600',
  },

  subTxt: {
    marginTop: scaleHeight(4),
    fontSize: scaledSize(13),
    color: '#7f8c8d',
  },

  mascotImage: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    marginBottom: scaleHeight(16),
    opacity: 0.9,
  },
});

export default AdmobFrontAd;
