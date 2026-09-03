import React, { useRef } from 'react';
import DateUtils from '@/utils/DateUtils';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import { GOOGLE_ADMOV_ANDROID_BANNER, GOOGLE_ADMOV_IOS_BANNER } from '@env';
import analytics from '@react-native-firebase/analytics';
import DeviceInfo from 'react-native-device-info';
import { recordAdClick } from '@/utils/AdGuardUtils';

type AdUnitIdType = string;

const AD_UNIT_ID: AdUnitIdType = Platform.select({
	ios: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_IOS_BANNER!,
	android: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_ANDROID_BANNER!,
}) as AdUnitIdType;

interface AdmobBannerAdProps {
	visible?: boolean;
}

const AdmobBannerAd: React.FC<AdmobBannerAdProps> = ({
	visible = true, // 표시 여부
}) => {
	const bannerRef = useRef<BannerAd | null>(null);

	useForeground(() => {
		if (Platform.OS === 'ios') {
			bannerRef.current?.load();
		}
	});

	const handleAdOpened = async () => {
		// onAdOpened 는 배너를 눌러 광고가 화면을 덮은 순간이다 = 클릭 1회.
		// 하루 한도를 넘으면 전면 광고가 멈춘다(배너는 오클릭 확률이 낮아 계속 노출).
		recordAdClick();
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
				timestamp: DateUtils.now().toISOString(),
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
					opacity: visible ? 1 : 0, // 렌더링 유지 + 가시성만 제어
					height: visible ? undefined : 0,
				},
			]}>
			<BannerAd
				ref={bannerRef}
				unitId={AD_UNIT_ID}
				size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
				onAdOpened={handleAdOpened}
				onAdLoaded={() => console.log('Banner ad loaded:', AD_UNIT_ID)}
				onAdFailedToLoad={(error) => console.warn('Banner ad failed to load:', error?.message ?? error)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
});

export default React.memo(AdmobBannerAd);
