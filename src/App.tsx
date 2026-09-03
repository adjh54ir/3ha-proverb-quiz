import React, { useEffect } from 'react';

import { Store, persistor } from './store/Store';
import { PersistGate } from 'redux-persist/integration/react';

import { Provider } from 'react-redux';
import { LogBox, StyleSheet } from 'react-native';
import ApplicationNavigator from './navigation/ApplicationNavigator';
import VersionCheckModal from './screens/common/modal/VersionCheckModal';
import { IAP_REMOVE_AD_KEY, REACT_NATIVE_APP_MODE } from '@env';
import i18n from '@/translations';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from './types/MainDataType';
import ProverbServices from './services/ProverbServices';
import { MainStorageKeyType } from './types/MainStorageKeyType';
import { requestTrackingPermission } from './utils/PermissionUtils';
import DateUtils from './utils/DateUtils';
import { sampleSize } from './utils/ArrayUtils';
import { loadSoundSetting, preloadSounds } from './utils/SoundUtils';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { deleteLegacyVibrationChannels, parseAlarmHour, scheduleDailyQuizReminder } from './utils/NotifactionHelper';
import { Paths } from './navigation/conf/Paths';
import { loadBgmSetting } from './utils/BgmUtils';
import mobileAds from 'react-native-google-mobile-ads';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import * as RNIap from 'react-native-iap';

/**
 * Init App
 */
const App = () => {
	const TODAY_QUIZ_LIST = MainStorageKeyType.TODAY_QUIZ_LIST;
	// const PURCHASE_INFO_KEY = 'PURCHASE_INFO'; // ✅ 구매 정보 저장 키
	// const itemSkus: string[] = [IAP_REMOVE_AD_KEY];

	useEffect(() => {
		LogBox.ignoreAllLogs();
		console.log('Now env mode : [', REACT_NATIVE_APP_MODE, ']');

		checkTodayQuiz();
		// iOS 는 ATT 응답 전에 광고 SDK 를 초기화하면 그 세션 동안 광고 식별자를 못 쓴다.
		// requestTrackingPermission 은 요청을 예약만 하고 즉시 반환하므로 await 해도 멈추지 않는다.
		// (Android / iOS 14 미만은 내부에서 바로 통과)
		const initAds = async () => {
			await requestTrackingPermission();
			try {
				// AdMob SDK 초기화. 전면/리워드 광고는 초기화 완료 후에만 load() 동작함
				await mobileAds().initialize();

				/**
				 * 광고 소리를 끈다 — 다른 앱의 오디오를 끊지 않기 위한 조치다.
				 *
				 * 효과음 쪽은 이미 세션을 공유하도록 맞춰 뒀다(SoundUtils.applyAudioCategory:
				 * iOS 'Ambient', Android mixWithOthers). 그런데 소리가 있는 동영상 광고가 뜨면
				 * GMA SDK 가 자기 세션을 활성화해(iOS non-mixing playback / Android audio focus)
				 * 사용자가 듣고 있던 음악·영상이 그 시점에 끊긴다. 앱을 열자마자 배너/전면 광고가
				 * 붙는 구조라 "앱에 들어오면 영상이 꺼진다"로 보였다.
				 * 음소거 상태에서는 SDK 가 오디오 세션을 잡지 않는다.
				 *
				 * ⚠️ 반드시 initialize() 가 끝난 **뒤에** 부를 것.
				 *    안드로이드는 초기화 전에 부르면 네이티브에서 IllegalStateException 이 나면서
				 *    앱이 그대로 죽는다(JS try/catch 로 못 잡는다). 첫 배너/전면 광고는 이 초기화
				 *    프로미스 이후에 요청되므로 첫 광고부터 음소거가 적용된다.
				 */
				mobileAds().setAppMuted(true);
				mobileAds().setAppVolume(0);
				console.log('✅ AdMob SDK 초기화 완료');
			} catch (e) {
				console.warn('❌ AdMob SDK 초기화 실패:', e);
			}
		};
		initAds();
		// 🔊 사운드 설정 로드 후 효과음 미리 로드(첫 재생 지연 방지)
		loadSoundSetting().then(preloadSounds);
		loadBgmSetting();
		rearmDailyQuizReminder(); // ⏰ 저장된 시각 기준 재예약(알림 시간 드리프트 보정)
		// initIAP();

		// initPurchaseInfo(); // ✅ 구매정보 초기 세팅
		// return () => {
		// 	RNIap.endConnection();
		// };
	}, []);

	/** ✅ 로컬 기본값 + 구매 복구까지 */
	// const initPurchaseInfo = async () => {
	// 	try {
	// 		const stored = await AsyncStorage.getItem(PURCHASE_INFO_KEY);

	// 		let current: CommonType.PurchaseInfoType = stored ? JSON.parse(stored) : { isRemoveAds: false };

	// 		const purchases = await RNIap.getAvailablePurchases();
	// 		const hasRemoveAds = purchases.some((p) => p.productId === IAP_REMOVE_AD_KEY);

	// 		if (hasRemoveAds && !current.isRemoveAds) {
	// 			current = {
	// 				isRemoveAds: true,
	// 				purchaseDate: new Date().toISOString(),
	// 				platform: Platform.OS === 'ios' ? 'ios' : 'android',
	// 			};
	// 			await AsyncStorage.setItem(PURCHASE_INFO_KEY, JSON.stringify(current));
	// 			console.log('✅ 저장값이 없었지만 구매 내역 발견 → 복원 완료!');
	// 		}
	// 	} catch (e) {
	// 		console.warn('PurchaseInfo Init Error:', e);
	// 	}
	// };

	/** ✅ IAP 초기 세팅 */
	// const initIAP = async () => {
	// 	try {
	// 		await RNIap.initConnection();

	// 		const products = await RNIap.getProducts({ skus: itemSkus });
	// 		console.log('상품 리스트:', products);

	// 		const purchases = await RNIap.getAvailablePurchases();
	// 		console.log('구매한 상품:', purchases);

	// 		// ✅ 이미 구매 기록이 있다면 광고 제거 자동 적용
	// 		const hasRemoveAds = purchases.some((p) => p.productId === IAP_REMOVE_AD_KEY);
	// 		if (hasRemoveAds) {
	// 			const newData: CommonType.PurchaseInfoType = {
	// 				isRemoveAds: true,
	// 				purchaseDate: new Date().toISOString(),
	// 				platform: Platform.OS === 'ios' ? 'ios' : 'android',
	// 			};
	// 			await AsyncStorage.setItem(PURCHASE_INFO_KEY, JSON.stringify(newData));
	// 			console.log('✅ 광고 제거 자동 복원 완료');
	// 		}

	// 		return { products, purchases };
	// 	} catch (e) {
	// 		console.warn('IAP Init Error:', e);
	// 		return null;
	// 	}
	// };

	/**
	 * 저장된 알림 시각으로 오늘의 퀴즈 리마인더를 매번 재예약한다.
	 *
	 * notifee 의 DAILY 반복은 '실제로 울린 시각' 기준으로 다음 회차를 잡는다.
	 * Doze 로 알림이 늦게 울리면 그 지연이 매일 누적돼 지정한 시각에서 점점 밀린다.
	 * 앱이 뜰 때마다 저장값으로 다시 계산해 예약하면 드리프트가 0 으로 돌아온다.
	 * (고정 ID 라 멱등 — 중복 예약이 쌓이지 않는다)
	 */
	const rearmDailyQuizReminder = async () => {
		try {
			// 진동이 켜진 구버전 채널 제거. 안드로이드 채널은 생성 후 설정이 불변이라
			// 새 ID(-v2)로 다시 만들고 옛 채널을 지워야 기존 사용자에게도 진동이 사라진다.
			await deleteLegacyVibrationChannels();

			const json = await AsyncStorage.getItem(MainStorageKeyType.SETTING_INFO);
			if (!json) {
				return;
			}
			const setting: MainDataType.SettingInfo = JSON.parse(json);
			if (!setting.isUseAlarm) {
				return;
			}

			// 권한이 없으면 예약해도 울리지 않는다 — 조용히 건너뛴다.
			// === 1(AUTHORIZED) 로 비교하면 안 된다. iOS 의 PROVISIONAL(2) 도 알림이 배달되는데
			// 등호 비교 때문에 권한이 있는 사용자에게 예약이 조용히 스킵됐다.
			const settings = await notifee.getNotificationSettings();
			if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
				return;
			}

			// 'HH:mm' 신규 포맷 + 구버전 ISO 문자열을 모두 받고 0~23 범위까지 검사한다.
			// (예전에는 여기에 같은 파서를 따로 두고 범위 검사가 없어서, 저장값이 '99:00' 으로
			//  깨지면 setHours(99) 가 알람을 4일 뒤로 밀어 버렸다 — "시간이 계속 바뀐다"의 한 원인)
			const hour = parseAlarmHour(setting.alarmTime);
			if (hour === null) {
				return;
			}

			await scheduleDailyQuizReminder(hour, Paths.TODAY_QUIZ);
		} catch (e) {
			console.error('알림 재예약 실패:', e);
		}
	};

	/**
	 * 최초 앱을 접근하면 오늘의 퀴즈를 발급합니다.
	 */
	const checkTodayQuiz = async () => {
		const todayStr = DateUtils.getLocalDateString();
		const storedJson = await AsyncStorage.getItem(TODAY_QUIZ_LIST);
		const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];

		const alreadyExists = storedArr.some((q) => DateUtils.toLocalDateKey(q.quizDate) === todayStr);

		console.log('alreadyExists :: ', alreadyExists);
		if (!alreadyExists) {
			const all = ProverbServices.selectProverbList();
			const shuffled = sampleSize(all, 5);

			const newQuizData: MainDataType.TodayQuizList = {
				quizDate: DateUtils.now().toISOString(),
				isCheckedIn: false,
				todayQuizIdArr: shuffled.map((q) => q.id),
				correctQuizIdArr: [],
				worngQuizIdArr: [],
				answerResults: {},
				selectedAnswers: {},
			};

			const updated = [...storedArr, newQuizData];
			await AsyncStorage.setItem(TODAY_QUIZ_LIST, JSON.stringify(updated));
			console.log('✅ 오늘의 퀴즈 자동 발급 완료');
		}
	};

	return (
		<GestureHandlerRootView style={styles.root}>
			{/*
			  initialMetrics 를 주면 첫 렌더부터 실측 인셋으로 그린다. 없으면 provider 가 값을
			  받기 전 한 프레임을 비우고, 그 사이에 만들어진 트리(모달 포함)가 측정 전 Dimensions
			  기준으로 잡혀 첫 표시에서 딤이 시스템 바 영역을 못 덮는 일이 생긴다.
			*/}
			<SafeAreaProvider initialMetrics={initialWindowMetrics}>
				<Provider store={Store}>
					<PersistGate persistor={persistor}>
						<I18nextProvider i18n={i18n}>
							<ApplicationNavigator />
						</I18nextProvider>
						<VersionCheckModal />
					</PersistGate>
				</Provider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	root: { flex: 1 },
});

export default App;
