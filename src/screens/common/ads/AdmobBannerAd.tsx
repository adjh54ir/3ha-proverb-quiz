import React, { useRef } from "react";
import { Platform, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";
import { GOOGLE_ADMOV_ANDROID_BANNER, GOOGLE_ADMOV_IOS_BANNER } from "@env";
type AdUnitIdType = string;

const AD_UNIT_ID: AdUnitIdType = Platform.select({
  ios: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_IOS_BANNER!,
  android: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_ANDROID_BANNER!,
}) as AdUnitIdType;

/**
 * [공통] 배너 광고
 * @returns
 */
interface AdmobBannerAdProps {
  marginBottom?: number;
}

const AdmobBannerAd: React.FC<AdmobBannerAdProps> = ({ marginBottom = 20 }) => {
  const bannerRef = useRef<BannerAd | null>(null);

  useForeground(() => {
    if (Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  return (
    <View style={{ alignItems: "center", marginBottom }}>
      <BannerAd
        ref={bannerRef}
        unitId={AD_UNIT_ID}
        size={BannerAdSize.BANNER}
      />
    </View>
  );
};

export default AdmobBannerAd;
