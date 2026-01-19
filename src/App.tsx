import React, { useEffect } from 'react';

import { Store, persistor } from './store/Store';
import { PersistGate } from 'redux-persist/integration/react';

import { Provider } from 'react-redux';
import { LogBox, Platform } from 'react-native';
import ApplicationNavigator from './navigation/ApplicationNavigator';
import VersionCheckModal from './screens/common/modal/VersionCheckModal';
import { IAP_REMOVE_AD_KEY, REACT_NATIVE_APP_MODE } from '@env';
import i18n from '@/translations';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from './types/MainDataType';
import ProverbServices from './services/ProverbServices';
import { MainStorageKeyType } from './types/MainStorageKeyType';
import * as RNIap from 'react-native-iap';
import { CommonType } from './types/CommonType'; // ✅ 추가

/**
 * Init App
 */
const App = () => {
	const TODAY_QUIZ_LIST = MainStorageKeyType.TODAY_QUIZ_LIST;
	const PURCHASE_INFO_KEY = 'PURCHASE_INFO'; // ✅ 구매 정보 저장 키
	const itemSkus: string[] = [IAP_REMOVE_AD_KEY];

	useEffect(() => {
		LogBox.ignoreAllLogs();
		console.log('Now env mode : [', REACT_NATIVE_APP_MODE, ']');

		checkTodayQuiz();
		// initIAP();

		// initPurchaseInfo(); // ✅ 구매정보 초기 세팅
		// return () => {
		// 	RNIap.endConnection();
		// };
	}, []);

	/** ✅ 로컬 기본값 + 구매 복구까지 */
	const initPurchaseInfo = async () => {
		try {
			const stored = await AsyncStorage.getItem(PURCHASE_INFO_KEY);

			let current: CommonType.PurchaseInfoType = stored ? JSON.parse(stored) : { isRemoveAds: false };

			const purchases = await RNIap.getAvailablePurchases();
			const hasRemoveAds = purchases.some((p) => p.productId === IAP_REMOVE_AD_KEY);

			if (hasRemoveAds && !current.isRemoveAds) {
				current = {
					isRemoveAds: true,
					purchaseDate: new Date().toISOString(),
					platform: Platform.OS === 'ios' ? 'ios' : 'android',
				};
				await AsyncStorage.setItem(PURCHASE_INFO_KEY, JSON.stringify(current));
				console.log('✅ 저장값이 없었지만 구매 내역 발견 → 복원 완료!');
			}
		} catch (e) {
			console.warn('PurchaseInfo Init Error:', e);
		}
	};

	/** ✅ IAP 초기 세팅 */
	const initIAP = async () => {
		try {
			await RNIap.initConnection();

			const products = await RNIap.getProducts({ skus: itemSkus });
			console.log('상품 리스트:', products);

			const purchases = await RNIap.getAvailablePurchases();
			console.log('구매한 상품:', purchases);

			// ✅ 이미 구매 기록이 있다면 광고 제거 자동 적용
			const hasRemoveAds = purchases.some((p) => p.productId === IAP_REMOVE_AD_KEY);
			if (hasRemoveAds) {
				const newData: CommonType.PurchaseInfoType = {
					isRemoveAds: true,
					purchaseDate: new Date().toISOString(),
					platform: Platform.OS === 'ios' ? 'ios' : 'android',
				};
				await AsyncStorage.setItem(PURCHASE_INFO_KEY, JSON.stringify(newData));
				console.log('✅ 광고 제거 자동 복원 완료');
			}

			return { products, purchases };
		} catch (e) {
			console.warn('IAP Init Error:', e);
			return null;
		}
	};

	/**
	 * 최초 앱을 접근하면 오늘의 퀴즈를 발급합니다.
	 */
	const checkTodayQuiz = async () => {
		const todayStr = new Date().toISOString().slice(0, 10);
		const storedJson = await AsyncStorage.getItem(TODAY_QUIZ_LIST);
		const storedArr: MainDataType.TodayQuizList[] = storedJson ? JSON.parse(storedJson) : [];

		const alreadyExists = storedArr.some((q) => q.quizDate.slice(0, 10) === todayStr);

		console.log('alreadyExists :: ', alreadyExists);
		if (!alreadyExists) {
			const all = ProverbServices.selectProverbList();
			const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 5);

			const newQuizData: MainDataType.TodayQuizList = {
				quizDate: new Date().toISOString(),
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
