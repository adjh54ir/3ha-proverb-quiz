import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import {
	LevelPlay,
	LevelPlayAdError,
	LevelPlayAdInfo,
	LevelPlayConfiguration,
	LevelPlayInitError,
	LevelPlayInitListener,
	LevelPlayInitRequest,
	LevelPlayInterstitialAd,
	LevelPlayInterstitialAdListener,
} from 'ironsource-mediation';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
	onAdClosed?: () => void;
};

const BANNER_FRONT_UNIT_ID = Platform.select({
	android: 'jgvjyvwbxp9i0gsy',
	ios: '9m14ek8489c4k23q',
});

const APP_KEY = Platform.select({
	android: '2397b5575',
	ios: '23a5d305d',
	default: '',
});

const PLACEMENT_NAME = 'FRONT';

const LevelPlayFrontAd = ({ onAdClosed }: Props) => {
	const [interstitialAd, setInterstitialAd] = useState<LevelPlayInterstitialAd>(
		new LevelPlayInterstitialAd(BANNER_FRONT_UNIT_ID!),
	);
	const [isVisible, setIsVisible] = useState(true); // 처음에는 보이도록

	useEffect(() => {
		console.log('[+] 전면 광고 출력 ');
		initIronSource();
	}, []);

	const initIronSource = async () => {
		try {
			const initRequest = LevelPlayInitRequest.builder(APP_KEY!).build();

			const initListener: LevelPlayInitListener = {
				onInitSuccess: (config: LevelPlayConfiguration) => {
					console.log('✅ IronSource Init Success:', config);
					interstitialAd.setListener(listener);
					interstitialAd.loadAd();
				},
				onInitFailed: (error: LevelPlayInitError) => {
					console.error('❌ IronSource Init Failed:', error);
				},
			};
			LevelPlay.init(initRequest, initListener);
		} catch (e) {
			console.error('🔥 Init Exception:', e);
		}
	};

	const listener: LevelPlayInterstitialAdListener = {
		onAdLoaded: (adInfo: LevelPlayAdInfo) => {
			// Implement your logic here, for example showing the ad
			// Show ad with placement

			console.log('✅ IronSource Init Success:', adInfo);
			interstitialAd.showAd(PLACEMENT_NAME);
		},
		onAdLoadFailed: (error: LevelPlayAdError) => {
			// Implement your logic here...
			console.log('✅ IronSource Init Fail:', error);
		},
		onAdInfoChanged: (adInfo: LevelPlayAdInfo) => {
			// Implement your logic here...
		},
		onAdDisplayed: (adInfo: LevelPlayAdInfo) => {
			// Implement your logic here...
		},
		onAdDisplayFailed: (error: LevelPlayAdError, adInfo: LevelPlayAdInfo) => {
			// Implement your logic here...
		},
		onAdClicked: (adInfo: LevelPlayAdInfo) => {
			// Implement your logic here...
		},
		onAdClosed: (adInfo: LevelPlayAdInfo) => {
			console.log('광고 닫힘:', adInfo);
			setIsVisible(false); // 광고 닫힘 시 오버레이 숨김
			onAdClosed?.(); // ✅ 외부에서 전달한 콜백 실행
		},
	};

	return isVisible ? (
		<View style={styles.adOverlay}>
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#3498db" />
				<Text style={styles.loadingTxt}>광고를 준비 중이에요…</Text>
			</View>
		</View>
	) : null;
};
export default LevelPlayFrontAd;

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
