/**
 * @format
 */

// react-native-gesture-handler 초기화 (반드시 최상단 첫 줄 — Android 모달/팝업 터치 사망 방지)
import 'react-native-gesture-handler';

// 전역 Text/TextInput 기본 폰트 설정 (App 보다 먼저 적용되어야 함)
import './src/utils/TextDefaults';

// 전역 TouchableOpacity 기본 프롭 (누름 강도를 앱 전체에서 통일)
import './src/utils/TouchableDefaults';

import notifee, {EventType} from '@notifee/react-native';
import {setPendingRoute} from './src/utils/PendingNotification';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

/**
 * 알림 백그라운드 이벤트 핸들러.
 * 등록하지 않으면 앱이 백그라운드일 때 알림을 눌러도 notifee 가 경고만 남기고 이벤트를 버린다.
 * 실제 화면 이동은 앱이 살아나면서 AppLayout 의 포그라운드 핸들러가 이어받는다.
 */
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) {
    // 여기서는 네비게이션에 접근할 수 없다. 이동할 화면만 적어두고,
    // 앱이 활성화될 때 AppLayout 이 꺼내서 이동시킨다.
    await setPendingRoute(detail.notification?.data?.moveToScreen);
  }
});

AppRegistry.registerComponent(appName, () => App);
