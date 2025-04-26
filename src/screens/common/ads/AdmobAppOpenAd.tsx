import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  AppOpenAd,
  TestIds,
  AdEventType,
} from "react-native-google-mobile-ads";

import { GOOGLE_ADMOV_IOS_OPEN_APP, GOOGLE_ADMOV_ANDROID_OPEN_APP } from "@env";

type AdUnitIdType = string;

const AD_UNIT_ID: AdUnitIdType = Platform.select({
  ios: __DEV__ ? TestIds.APP_OPEN : GOOGLE_ADMOV_IOS_OPEN_APP!,
  android: __DEV__ ? TestIds.APP_OPEN : GOOGLE_ADMOV_ANDROID_OPEN_APP!,
}) as AdUnitIdType;

/**
 * [공통] 앱 열기 광고
 * @returns
 */
const AdmobAppOpenAd: React.FC = () => {
  const [appOpenAd, setAppOpenAd] = useState<AppOpenAd | null>(null);

  useEffect(() => {
    // 앱 열기 광고 인스턴스 생성
    const newAppOpen = AppOpenAd.createForAdRequest(AD_UNIT_ID, {
      keywords: ["fashion", "clothing"],
    });

    // 광고 로드 이벤트 리스너
    const unsubscribeLoaded = newAppOpen.addAdEventListener(
      AdEventType.LOADED,
      () => {
        newAppOpen.show();
      }
    );

    // 광고 에러 이벤트 리스너
    const unsubscribeError = newAppOpen.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error("App open ad error:", error);
      }
    );

    // 광고 로드 시작
    newAppOpen.load();
    setAppOpenAd(newAppOpen);

    // Clean up
    return () => {
      unsubscribeLoaded();
      unsubscribeError();
    };
  }, []);

  return null;
};

export default AdmobAppOpenAd;
