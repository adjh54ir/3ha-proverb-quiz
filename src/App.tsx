import React, { useEffect } from "react";

import { Store, persistor } from "./store/Store";
import { PersistGate } from "redux-persist/integration/react";

import { Provider } from "react-redux";
import { LogBox } from "react-native";
import ApplicationNavigator from "./navigation/ApplicationNavigator";
import VersionCheckModal from "./screens/common/modal/VersionCheckModal";
import { REACT_NATIVE_APP_MODE } from "@env";
import i18n from '@/translations';
import { I18nextProvider } from "react-i18next";
import crashlytics from '@react-native-firebase/crashlytics';
/**
 * Init App
 */
const App = () => {


  useEffect(() => {
    LogBox.ignoreAllLogs(); // 로그박스 끄기
    console.log("Now env mode : [", REACT_NATIVE_APP_MODE, "]");
  }, []);

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

