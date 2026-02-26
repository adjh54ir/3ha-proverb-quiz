import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { GOOGLE_ADMOV_ANDROID_REWARD, GOOGLE_ADMOV_IOS_REWARD } from '@env';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { RewardedAd, TestIds, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = Platform.select({
  ios: __DEV__ ? TestIds.REWARDED : GOOGLE_ADMOV_IOS_REWARD!,
  android: __DEV__ ? TestIds.REWARDED : GOOGLE_ADMOV_ANDROID_REWARD!,
})!;

const AdmobRewardAd: React.FC<{
  onRewarded: () => void;   // 광고 완주 → 보상 지급
  onFailed: () => void;     // 로드 실패
  onClosed: () => void;     // 광고 닫힘 (보상 없이 닫은 경우 포함)
}> = ({ onRewarded, onFailed, onClosed }) => {
  const adRef = useRef<RewardedAd | null>(null);
  const rewardedRef = useRef(false); // 보상 중복 방지

  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;
    rewardedRef.current = false;

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ 리워드 광고 로딩 완료');
      ad.show();
    });

    // 광고 끝까지 시청 완료 → 보상 지급
    const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      console.log('🎁 리워드 획득');
      rewardedRef.current = true;
      onRewarded();
    });

    // 광고 닫힘 (시청 완료 or 중간에 닫음)
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('✅ 리워드 광고 닫힘');
      if (!rewardedRef.current) {
        // 보상 없이 닫은 경우
        onClosed();
      }
    });

    const unsubscribeFailed = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('❌ 리워드 광고 실패:', error?.message ?? error);
      onFailed();
    });

    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeFailed();
    };
  }, []);

  return (
    <View style={styles.adOverlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingTxt}>광고를 준비 중이에요…</Text>
        <Text style={styles.subTxt}>시청 완료 시 도전 기회 +1회</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  adOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
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
});

export default AdmobRewardAd;