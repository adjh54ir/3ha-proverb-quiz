/**
 * 오픈소스 고지 데이터 — scripts/genOpenSource.js 가 package.json 기준으로 생성한다.
 * ⚠️ 직접 수정하지 말 것. 의존성이 바뀌면 `node scripts/genOpenSource.js` 를 다시 실행한다.
 */
export interface OpenSourceLib {
	name: string;
	license: string;
	version: string;
	url: string;
}

export const OPEN_SOURCE_LIBS: OpenSourceLib[] = [
	{ name: '@notifee/react-native', license: 'Apache-2.0', version: '9.1.8', url: 'https://github.com/invertase/notifee' },
	{ name: '@react-native-async-storage/async-storage', license: 'MIT', version: '2.2.0', url: 'https://github.com/react-native-async-storage/async-storage' },
	{ name: '@react-native-community/slider', license: 'MIT', version: '5.2.0', url: 'https://github.com/callstack/react-native-slider' },
	{ name: '@react-native-firebase/analytics', license: 'Apache-2.0', version: '22.4.0', url: 'https://github.com/invertase/react-native-firebase/tree/main/packages/analytics' },
	{ name: '@react-native-firebase/app', license: 'Apache-2.0', version: '22.4.0', url: 'https://github.com/invertase/react-native-firebase/tree/main/packages/app' },
	{ name: '@react-native-firebase/crashlytics', license: 'Apache-2.0', version: '22.4.0', url: 'https://github.com/invertase/react-native-firebase/tree/main/packages/crashlytics' },
	{ name: '@react-navigation/bottom-tabs', license: 'MIT', version: '7.18.0', url: 'https://github.com/react-navigation/react-navigation' },
	{ name: '@react-navigation/native', license: 'MIT', version: '7.3.1', url: 'https://github.com/react-navigation/react-navigation' },
	{ name: '@react-navigation/stack', license: 'MIT', version: '7.10.3', url: 'https://github.com/react-navigation/react-navigation' },
	{ name: '@reduxjs/toolkit', license: 'MIT', version: '2.12.0', url: 'https://github.com/reduxjs/redux-toolkit' },
	{ name: 'i18next', license: 'MIT', version: '24.2.3', url: 'https://github.com/i18next/i18next' },
	{ name: 'intl-pluralrules', license: 'ISC', version: '2.0.1', url: 'https://github.com/eemeli/intl-pluralrules#readme' },
	{ name: 'moment', license: 'MIT', version: '2.30.1', url: 'https://github.com/moment/moment' },
	{ name: 'react', license: 'MIT', version: '19.0.0', url: 'https://github.com/facebook/react' },
	{ name: 'react-i18next', license: 'MIT', version: '15.7.4', url: 'https://github.com/i18next/react-i18next' },
	{ name: 'react-native', license: 'MIT', version: '0.78.0', url: 'https://github.com/facebook/react-native' },
	{ name: 'react-native-animated-numbers', license: 'MIT', version: '0.6.3', url: 'https://github.com/heyman333/react-native-animated-numbers' },
	{ name: 'react-native-bootsplash', license: 'MIT', version: '7.3.2', url: 'https://github.com/zoontek/react-native-bootsplash' },
	{ name: 'react-native-calendars', license: 'MIT', version: '1.1314.0', url: 'https://github.com/wix/react-native-calendars' },
	{ name: 'react-native-circular-progress', license: 'MIT', version: '1.4.1', url: 'https://github.com/bgryszko/react-native-circular-progress' },
	{ name: 'react-native-confetti-cannon', license: 'UNKNOWN', version: '1.5.2', url: 'https://github.com/vincentcatillon/react-native-confetti-cannon' },
	{ name: 'react-native-device-info', license: 'MIT', version: '14.1.1', url: 'https://github.com/react-native-device-info/react-native-device-info' },
	{ name: 'react-native-dotenv', license: 'MIT', version: '3.4.11', url: 'https://github.com/goatandsheep/react-native-dotenv' },
	{ name: 'react-native-dropdown-picker', license: 'MIT', version: '5.4.6', url: 'https://github.com/hossein-zare/react-native-dropdown-picker' },
	{ name: 'react-native-fast-image', license: '(MIT AND Apache-2.0)', version: '8.6.3', url: 'https://github.com/DylanVann/react-native-fast-image' },
	{ name: 'react-native-gesture-handler', license: 'MIT', version: '2.32.0', url: 'https://github.com/software-mansion/react-native-gesture-handler' },
	{ name: 'react-native-google-mobile-ads', license: 'Apache-2.0', version: '14.11.0', url: 'https://github.com/invertase/react-native-google-mobile-ads' },
	{ name: 'react-native-linear-gradient', license: 'MIT', version: '2.8.3', url: 'https://github.com/react-native-linear-gradient/react-native-linear-gradient' },
	{ name: 'react-native-markdown-display', license: 'MIT', version: '7.0.2', url: 'https://github.com/iamacup/react-native-markdown-display' },
	{ name: 'react-native-permissions', license: 'MIT', version: '5.5.3', url: 'https://github.com/zoontek/react-native-permissions' },
	{ name: 'react-native-reanimated', license: 'MIT', version: '3.19.5', url: 'https://github.com/software-mansion/react-native-reanimated' },
	{ name: 'react-native-reanimated-carousel', license: 'MIT', version: '4.0.3', url: 'https://github.com/dohooo/react-native-reanimated-carousel' },
	{ name: 'react-native-safe-area-context', license: 'MIT', version: '5.8.0', url: 'https://github.com/AppAndFlow/react-native-safe-area-context' },
	{ name: 'react-native-sound', license: 'MIT', version: '0.13.0', url: 'https://github.com/zmxv/react-native-sound' },
	{ name: 'react-native-svg', license: 'MIT', version: '15.15.5', url: 'https://github.com/software-mansion/react-native-svg' },
	{ name: 'react-native-vector-icons', license: 'MIT', version: '10.3.0', url: 'https://github.com/oblador/react-native-vector-icons' },
	{ name: 'react-native-version-check', license: 'MIT', version: '3.5.0', url: 'https://github.com/kimxogus/react-native-version-check' },
	{ name: 'react-redux', license: 'MIT', version: '9.3.0', url: 'https://github.com/reduxjs/react-redux' },
	{ name: 'zod', license: 'MIT', version: '3.25.76', url: 'https://github.com/colinhacks/zod' },
];
