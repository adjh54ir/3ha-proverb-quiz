/**
 * Jest 공통 셋업 — RN 네이티브 모듈 목(mock).
 * App 전체를 렌더하는 스모크 테스트가 네이티브 브리지 없이 돌아가도록 한다.
 */
require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-device-info', () => ({
	getVersion: () => '1.0.0',
	getBuildNumber: () => '1',
	getBundleId: () => 'com.test.app',
	hasNotch: () => false,
	isTablet: () => false,
}));

jest.mock('react-native-sound', () => {
	class SoundMock {
		static setCategory() {}
		constructor(_file, _basePath, cb) {
			cb?.(null);
		}
		play(cb) {
			cb?.(true);
		}
		stop(cb) {
			cb?.();
		}
		release() {}
		setVolume() {}
		setNumberOfLoops() {}
	}
	return SoundMock;
	// 로컬에 미설치여도 테스트가 돌도록 virtual mock 으로 등록한다.
}, { virtual: true });

jest.mock('react-native-google-mobile-ads', () => ({
	__esModule: true,
	default: () => ({ initialize: jest.fn().mockResolvedValue([]) }),
	BannerAd: () => null,
	BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
	InterstitialAd: { createForAdRequest: () => ({ load: jest.fn(), show: jest.fn(), addAdEventListener: () => jest.fn() }) },
	RewardedAd: { createForAdRequest: () => ({ load: jest.fn(), show: jest.fn(), addAdEventListener: () => jest.fn() }) },
	TestIds: { BANNER: 'banner', INTERSTITIAL: 'interstitial', REWARDED: 'rewarded' },
	AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' },
	RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' },
	MaxAdContentRating: { G: 'G' },
}));

jest.mock('@notifee/react-native', () => ({
	__esModule: true,
	default: {
		requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
		createTriggerNotification: jest.fn().mockResolvedValue('id'),
		cancelNotification: jest.fn().mockResolvedValue(undefined),
		getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
		createChannel: jest.fn().mockResolvedValue('channel'),
		onForegroundEvent: jest.fn(() => jest.fn()),
	},
	TriggerType: { TIMESTAMP: 0 },
	AndroidImportance: { HIGH: 4 },
	EventType: { PRESS: 1 },
	RepeatFrequency: { DAILY: 2 },
}));

jest.mock('@react-native-firebase/analytics', () => () => ({
	logEvent: jest.fn().mockResolvedValue(undefined),
	setUserProperty: jest.fn().mockResolvedValue(undefined),
	logScreenView: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/slider', () => 'Slider', { virtual: true });

jest.mock('react-native-fast-image', () => {
	const RN = require('react-native');
	const FastImage = RN.Image;
	FastImage.resizeMode = { contain: 'contain', cover: 'cover', stretch: 'stretch', center: 'center' };
	FastImage.priority = { low: 'low', normal: 'normal', high: 'high' };
	return FastImage;
});

jest.mock('react-native-version-check', () => ({
	__esModule: true,
	default: {
		getCurrentVersion: () => '1.0.0',
		getLatestVersion: jest.fn().mockResolvedValue('1.0.0'),
		needUpdate: jest.fn().mockResolvedValue({ isNeeded: false, storeUrl: '' }),
		getStoreUrl: jest.fn().mockResolvedValue(''),
	},
}));

jest.mock('react-native-permissions', () => ({
	PERMISSIONS: { ANDROID: {}, IOS: {} },
	RESULTS: { GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked', UNAVAILABLE: 'unavailable' },
	check: jest.fn().mockResolvedValue('granted'),
	request: jest.fn().mockResolvedValue('granted'),
	checkNotifications: jest.fn().mockResolvedValue({ status: 'granted', settings: {} }),
	requestNotifications: jest.fn().mockResolvedValue({ status: 'granted', settings: {} }),
	openSettings: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-bootsplash', () => ({ hide: jest.fn().mockResolvedValue(undefined), isVisible: jest.fn().mockResolvedValue(false) }));
