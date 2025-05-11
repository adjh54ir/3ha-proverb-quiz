import React, { useRef } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import { GOOGLE_ADMOV_ANDROID_BANNER, GOOGLE_ADMOV_IOS_BANNER } from '@env';
type AdUnitIdType = string;

const AD_UNIT_ID: AdUnitIdType = Platform.select({
	ios: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_IOS_BANNER!,
	android: __DEV__ ? TestIds.BANNER : GOOGLE_ADMOV_ANDROID_BANNER!,
}) as AdUnitIdType;

interface AdmobBannerAdProps {
	paramMarginTop?: number;
	paramMarginBottom?: number;
}
/**
 * [공통] 배너 광고
 * @returns
 */
const AdmobBannerAd: React.FC<AdmobBannerAdProps> = ({ paramMarginTop = 0, paramMarginBottom = 20 }) => {
	const bannerRef = useRef<BannerAd | null>(null);

	const screenWidth = Dimensions.get('window').width;

	/**
	 * 플랫폼 iOS에 대해서만 이를 적용합니다.
	 * - 앱이 "suspended state"(백그라운드 상태)에 있을 때 WKWebView가 종료될 수 있음
	 * - 이로 인해 앱이 포그라운드로 돌아올 때 배너 광고가 비어있을 수 있음
	 * - 이 문제를 해결하기 위해 앱이 포그라운드로 돌아올 때 수동으로 새로운 광고를 요청하는 것이 권장됨
	 */
	useForeground(() => {
		if (Platform.OS === 'ios') {
			bannerRef.current?.load();
		}
	});

	// 태블릿 기준 너비 600 이상
	const getBannerSize = () => {
		if (screenWidth >= 600) return BannerAdSize.FULL_BANNER; // 468x60
		if (screenWidth >= 480) return BannerAdSize.LARGE_BANNER; // 320x100
		return BannerAdSize.BANNER; // 320x50
	};

	return (
		<View style={[styles.container, { marginTop: paramMarginTop, marginBottom: paramMarginBottom }]}>
			<BannerAd
				ref={bannerRef}
				unitId={AD_UNIT_ID}
				size={getBannerSize()} // 환경에 따라 유동적인 변경
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
