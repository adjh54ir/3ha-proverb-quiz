import React, { useRef } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import analytics from '@react-native-firebase/analytics';
import DeviceInfo from 'react-native-device-info';

type AdUnitIdType = string;

const AD_UNIT_ID = Platform.select({
  ios: __DEV__ ? TestIds.BANNER : process.env.GOOGLE_ADMOV_IOS!,
  android: __DEV__ ? TestIds.BANNER : process.env.GOOGLE_ADMOV_ANDROID!,
});
interface AdmobBannerAdProps {
  paramMarginTop?: number;
  paramMarginBottom?: number;
  visible?: boolean;
}

const AdmobBannerAd: React.FC<AdmobBannerAdProps> = ({
  paramMarginTop = 0,
  paramMarginBottom = 20,
  visible = true, // 표시 여부
}) => {
  const bannerRef = useRef<BannerAd | null>(null);
  const screenWidth = Dimensions.get('window').width;

  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
    }
  });

  const getBannerSize = () => {
    if (screenWidth >= 600) return BannerAdSize.FULL_BANNER;
    if (screenWidth >= 480) return BannerAdSize.LARGE_BANNER;
    return BannerAdSize.BANNER;
  };

  const handleAdOpened = async () => {
    try {
      const instanceId = await analytics().getAppInstanceId();
      await analytics().logEvent('ad_banner_opened', {
        ad_platform: 'admob',
        ad_format: 'banner',
        ad_unit_id: AD_UNIT_ID,
        app_name: DeviceInfo.getApplicationName(),
        app_version: DeviceInfo.getVersion(),
        build_number: DeviceInfo.getBuildNumber(),
        device_platform: Platform.OS,
        device_model: DeviceInfo.getModel(),
        device_brand: DeviceInfo.getBrand(),
        system_version: DeviceInfo.getSystemVersion(),
        app_instance_id: instanceId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('🔥 Failed to log ad click:', error);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: paramMarginTop,
          marginBottom: paramMarginBottom,
          opacity: visible ? 1 : 0,      // 렌더링 유지 + 가시성만 제어
          height: visible ? undefined : 0
        },
      ]}
    >
      <BannerAd
        ref={bannerRef}
        unitId={AD_UNIT_ID!}
        size={getBannerSize()}
        onAdOpened={handleAdOpened}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default React.memo(AdmobBannerAd);