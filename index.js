/**
 * @format
 */

// 전역 Text/TextInput 기본 폰트 설정 (App 보다 먼저 적용되어야 함)
import './src/utils/TextDefaults';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
