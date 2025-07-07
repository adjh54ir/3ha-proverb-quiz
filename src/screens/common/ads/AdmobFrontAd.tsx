import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { GOOGLE_ADMOV_ANDROID_FRONT, GOOGLE_ADMOV_IOS_FRONT } from '@env';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { InterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';

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
  const hasClosed = useRef(false); // ✅ 이미 닫힘 처리됐는지 여부
  const adRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID);
    adRef.current = ad;
    hasClosed.current = false; // 새 광고 시작 시 초기화

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ 전면 광고 로딩 완료');
      setLoaded(true);
      ad.show();
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (hasClosed.current) return; // ✅ 중복 방지
      hasClosed.current = true;
      console.log('✅ 전면 광고 닫힘');
      setLoaded(false);
      onAdClosed?.();
    });

    const unsubscribeFailed = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      if (hasClosed.current) return;
      hasClosed.current = true;
      console.warn('❌ 광고 로딩 실패:', error?.message ?? error);
      setLoaded(false);
      onAdClosed?.();
    });

    console.log('📦 전면 광고 로드 시작');
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
