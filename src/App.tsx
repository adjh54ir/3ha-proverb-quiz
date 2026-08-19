import React, { useEffect } from 'react';

import { Store, persistor } from './store/Store';
import { PersistGate } from 'redux-persist/integration/react';

import { Provider } from 'react-redux';
import { LogBox } from 'react-native';
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
import { loadSoundSetting, preloadSounds } from './utils/SoundUtils';
import notifee from '@notifee/react-native';
import { scheduleDailyQuizReminder } from './utils/NotifactionHelper';
import { Paths } from './navigation/conf/Paths';
import { loadBgmSetting } from './utils/BgmUtils';
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
		requestTrackingPermission(); // iOS ATT (내부에서 플랫폼/AppState 가드)
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
			const json = await AsyncStorage.getItem(MainStorageKeyType.SETTING_INFO);
			if (!json) {
				return;
			}
			const setting: MainDataType.SettingInfo = JSON.parse(json);
			if (!setting.isUseAlarm) {
				return;
			}

			// 권한이 없으면 예약해도 울리지 않는다 — 조용히 건너뛴다.
			const settings = await notifee.getNotificationSettings();
			if (settings.authorizationStatus !== 1) {
				return;
			}

			// 'HH:mm' 신규 포맷 우선, 구버전 ISO 문자열도 로컬 시각으로 환산해 읽는다.
			const stored = setting.alarmTime;
			const hhmm = /^(\d{1,2}):(\d{2})$/.exec(stored ?? '');
			const hour = hhmm ? Number(hhmm[1]) : new Date(stored).getHours();
			if (!Number.isFinite(hour)) {
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
			const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 5);

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
		<Provider store={Store}>
			<PersistGate persistor={persistor}>
				<I18nextProvider i18n={i18n}>
					<ApplicationNavigator />
				</I18nextProvider>
				<VersionCheckModal />
			</PersistGate>
		</Provider>
	);
};

export default App;
