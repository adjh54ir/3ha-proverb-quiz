import React, { useEffect, useState } from "react";
import { Image, Platform, Text } from "react-native";
import {
  NativeAd,
  TestIds,
  AdEventType,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";
import {
  GOOGLE_ADMOV_ANDROID_NATIVE_ADVANCED,
  GOOGLE_ADMOV_IOS_NATIVE_ADVANCED,
} from "@env";

type AdUnitIdType = string;

const AD_UNIT_ID: AdUnitIdType = Platform.select({
  ios: __DEV__ ? TestIds.NATIVE : GOOGLE_ADMOV_IOS_NATIVE_ADVANCED!,
  android: __DEV__ ? TestIds.NATIVE : GOOGLE_ADMOV_ANDROID_NATIVE_ADVANCED!,
}) as AdUnitIdType;

/**
 * [공통] 네이티브 고급 광고
 * @returns
 */
const AdmobNativeAd: React.FC = () => {
  const [nativeAd, setNativeAd] = useState<NativeAd>();

  useEffect(() => {
    NativeAd.createForAdRequest(AD_UNIT_ID)
      .then(setNativeAd)
      .catch(console.error);
  }, []);

  if (!nativeAd) {
    return null;
  }

  return (
    // Wrap all the ad assets in the NativeAdView component, and register the view with the nativeAd prop
    <NativeAdView nativeAd={nativeAd}>
      // Display the icon asset with Image component, and use NativeAsset to
      register the view
      {nativeAd.icon && (
        <NativeAsset assetType={NativeAssetType.ICON}>
          <Image source={{ uri: nativeAd.icon.url }} width={24} height={24} />
        </NativeAsset>
      )}
      // Display the headline asset with Text component, and use NativeAsset to
      register the view
      <NativeAsset assetType={NativeAssetType.HEADLINE}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          {nativeAd.headline}
        </Text>
      </NativeAsset>
      // Always display an ad attribution to denote that the view is an
      advertisement
      <Text>Sponsored</Text>
      // Display the media asset
      <NativeMediaView />
      // Repeat the process for the other assets in the NativeAd.
    </NativeAdView>
  );
};

export default AdmobNativeAd;
