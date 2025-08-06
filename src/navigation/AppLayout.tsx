import React, { useRef } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import { GOOGLE_ADMOV_ANDROID_BANNER, GOOGLE_ADMOV_IOS_BANNER } from '@env';
import analytics from '@react-native-firebase/analytics'; // Firebase Analytics
import DeviceInfo from 'react-native-device-info';

type AdUnitIdType = string;

const AD_UNIT_ID: AdUnitIdType = Platform.select({
    ios: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_IOS_BANNER!,
    android: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_ANDROID_BANNER!,
}) as AdUnitIdType;

interface AdmobBannerAdProps {
    paramMarginTop?: number;
    paramMarginBottom?: number;
    visible?: boolean; // 👈 추가
}


const AdmobBannerAd: React.FC<AdmobBannerAdProps> = ({
    paramMarginTop = 0,
    paramMarginBottom = 20,
    visible = true,
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
                ad_platform: 'admob', // 📌 광고 플랫폼 이름 (예: admob, facebook 등)
                ad_format: 'banner', // 📌 광고 형식 (전면광고, 배너, 리워드 등)
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
            });
        } catch (error) {
            console.error('🔥 Failed to log ad click:', error);
        }
    };

    if (!visible) {
        // 광고를 유지하되, 렌더링에서 제외하거나 공간만 확보
        return <View style={{ height: 0 }} />;
    }

    return (
        <View style={[styles.container, { marginTop: paramMarginTop, marginBottom: paramMarginBottom }]}>
            <BannerAd
                ref={bannerRef}
                unitId={AD_UNIT_ID}
                size={getBannerSize()}
                onAdOpened={handleAdOpened} // 📌 광고 클릭 시 로그
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
});

export default AdmobBannerAd;