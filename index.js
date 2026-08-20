/**
 * @format
 */

// react-native-gesture-handler 초기화 (반드시 최상단 첫 줄 — Android 모달/팝업 터치 사망 방지)
import 'react-native-gesture-handler';

// 전역 Text/TextInput 기본 폰트 설정 (App 보다 먼저 적용되어야 함)
import './src/utils/TextDefaults';

// 전역 Modal 기본 프롭 (Android 팝업 배경이 화면 끝까지 채워지도록)
import './src/utils/ModalDefaults';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
