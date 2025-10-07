/* eslint-disable react-native/no-inline-styles */
import { scaleHeight } from '@/utils';
import {
	LevelPlay,
	LevelPlayAdError,
	LevelPlayAdInfo,
	LevelPlayAdSize,
	LevelPlayBannerAdView,
	LevelPlayBannerAdViewListener,
	LevelPlayBannerAdViewMethods,
	LevelPlayConfiguration,
	LevelPlayInitError,
	LevelPlayInitListener,
	LevelPlayInitRequest,
} from 'ironsource-mediation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

interface AdmobBannerAdProps {
	paramMarginTop?: number;
	paramMarginBottom?: number;
	visible?: boolean;
	isLoadSdk?: boolean; // ✅ init 성공 후 true
}

const BANNER_AD_UNIT_ID = Platform.select({
	android: 'b2nribimhuo2qbhe',
	ios: 'kzoao5fa7ulxqfox',
});

const APP_KEY = Platform.select({
	android: '2397b5575',
	ios: '23a5d305d',
	default: '',
});

const PLACEMENT_NAME = 'BANNER';

const LevelPlayBannerAd: React.FC<AdmobBannerAdProps> = ({ paramMarginTop = 6, paramMarginBottom = 6, visible = true, isLoadSdk }) => {
	const adSize = LevelPlayAdSize.BANNER;
	const bannerAdRef = useRef<LevelPlayBannerAdViewMethods>(null);
	const [isSdkReady, setIsSdkReady] = useState(false);

	useEffect(() => {
		console.log('🧭 useEffect mount, bannerAdRef.current:', APP_KEY, BANNER_AD_UNIT_ID);
	}, [bannerAdRef.current]);

	useEffect(() => {
		initIronSourceSDK();
	}, []);
	useEffect(() => {
		if (isSdkReady && bannerAdRef.current) {
			console.log('📡 SDK ready + bannerRef OK → loading ad');
			bannerAdRef.current?.loadAd();
		}
	}, [isSdkReady, bannerAdRef.current]);

	const initIronSourceSDK = async () => {
		if (!APP_KEY) {
			console.error('❌ No APP_KEY found, skipping init');
			return;
		}
		try {
			const initRequest = LevelPlayInitRequest.builder(APP_KEY).build();
			const initListener: LevelPlayInitListener = {
				onInitSuccess: (config: LevelPlayConfiguration) => {
					console.log('✅ IronSource Init Success:', config);
					console.log('🔍 bannerAdRef at init success:', bannerAdRef.current);
					bannerAdRef.current?.loadAd();
					// LevelPlay.launchTestSuite();
					setIsSdkReady(true); // ✅ 여기서 플래그 세움
				},
				onInitFailed: (error: LevelPlayInitError) => {
					console.error('❌ IronSource Init Failed:', error);
				},
			};
			// 디버깅용
			// LevelPlay.setAdaptersDebug(true);
			// LevelPlay.setMetaData('is_test_suite', ['enable']);

			// App mount 안정화 후 실행
			LevelPlay.init(initRequest, initListener);
		} catch (e) {
			console.error('🔥 JS Exception before init:', e);
		}
	};

	const listener: LevelPlayBannerAdViewListener = {
		onAdLoaded: (info: LevelPlayAdInfo) => {
			console.log('✅ Banner loaded:', info);
			console.log('✅ Banner loaded:', info);
		},
		onAdLoadFailed: (error) => {
			console.log('❌ Banner load failed:', error);
			// setTimeout(() => bannerAdRef.current?.loadAd(), 3000); // 3초 후 재시도
		},
		onAdDisplayed: (info: LevelPlayAdInfo) => {
			console.log('📡 Banner displayed:', info);
		},
		onAdDisplayFailed: (adInfo: LevelPlayAdInfo, error: LevelPlayAdError) => {
			// Implement your logic here
			console.log('✅ Banner onAdDisplayFailed:', adInfo);
		},
		onAdClicked: (info: LevelPlayAdInfo) => {
			console.log('🖱️ Banner clicked:', info);
		},
		onAdExpanded: (adInfo: LevelPlayAdInfo) => {
			// Implement your logic here
			console.log('✅ Banner onAdExpanded:', adInfo);
		},
		onAdCollapsed: (adInfo: LevelPlayAdInfo) => {
			// Implement your logic here
			console.log('✅ Banner onAdCollapsed:', adInfo);
		},
		onAdLeftApplication: (adInfo: LevelPlayAdInfo) => {
			// Implement your logic here
			console.log('✅ Banner onAdLeftApplication:', adInfo);
		},
	};

	const onLayout = (e) => {
		const { width, height } = e.nativeEvent.layout;
		console.log('Banner Layout:', width, height);
		if (width > 0 && height > 0) {
			bannerAdRef.current?.loadAd();
		}
	};
	return (
		<View
			style={[
				styles.container,
				{
					marginTop: scaleHeight(paramMarginTop),
					marginBottom: scaleHeight(paramMarginBottom),
					opacity: visible ? 1 : 0, // 렌더링 유지 + 가시성만 제어
					height: visible ? undefined : 0,
				},
			]}>
			<LevelPlayBannerAdView
				ref={bannerAdRef}
				adUnitId={BANNER_AD_UNIT_ID!}
				adSize={adSize}
				placementName={PLACEMENT_NAME}
				listener={listener}
				style={{ width: adSize.width, height: adSize.height, alignSelf: 'center', backgroundColor: '#ff000022' }}
				onLayout={(e) => {
					onLayout(e);
					console.log('onLayout :: ', e);
					bannerAdRef.current?.loadAd();

					console.log('onLayout :: ', bannerAdRef.current?.loadAd());
				}}
			/>
		</View>
	);
};

export default React.memo(LevelPlayBannerAd);

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'transparent',
	},
	bannerAd: {
		width: 320,
		height: 50,
		alignSelf: 'center',
		position: 'absolute',
		zIndex: 10,
		bottom: 0,
	},
});
