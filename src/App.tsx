import React, { useEffect } from 'react';

import { Store, persistor } from './store/Store';
import { PersistGate } from 'redux-persist/integration/react';

import { Provider } from 'react-redux';
import { LogBox } from 'react-native';
import ApplicationNavigator from './navigation/ApplicationNavigator';
import VersionCheckModal from './screens/common/modal/VersionCheckModal';
import { REACT_NATIVE_APP_MODE } from '@env';
import i18n from '@/translations';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from './types/MainDataType';
import ProverbServices from './services/ProverbServices';
import { MainStorageKeyType } from './types/MainStorageKeyType';
/**
 * Init App
 */
const App = () => {
	const TODAY_QUIZ_LIST = MainStorageKeyType.TODAY_QUIZ_LIST;

	useEffect(() => {
		LogBox.ignoreAllLogs(); // 로그박스 끄기
		console.log('Now env mode : [', REACT_NATIVE_APP_MODE, ']');
		checkTodayQuiz();
	}, []);

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
			// 퀴즈 생성
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
		// Redux Stroe
		<Provider store={Store}>
			{/* Redux-Persist */}
			<PersistGate persistor={persistor}>
				{/* 다국어 적용 */}
				<I18nextProvider i18n={i18n}>
					{/* Main Navigation */}
					<ApplicationNavigator />
				</I18nextProvider>
				{/* 필수 : 버전 관리 및 체크를 수행 */}
				<VersionCheckModal />
			</PersistGate>
		</Provider>
	);
};

export default App;
