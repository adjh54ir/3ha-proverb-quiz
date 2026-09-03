/**
 * 전역 ScrollView 기본 프롭 (부수효과 모듈)
 *
 * TextInput 이 있는 화면마다 아래 세 프롭을 손으로 붙이면 새로 만드는 화면에서 또 빠진다.
 * 기본값 자체를 바꿔 앱 전체에서 같은 키보드 동작을 보장한다.
 * 호출부에서 값을 준 곳은 그대로 우선한다(React 가 undefined 일 때만 기본값을 채운다).
 *
 * - `keyboardDismissMode: 'on-drag'`
 *   스크롤을 움직이면 키보드가 닫힌다.
 *
 * - `keyboardShouldPersistTaps: 'handled'`
 *   RN 기본값 `'never'` 는 키보드가 떠 있을 때의 첫 탭을 '키보드 닫기'로 삼켜서 버튼이
 *   한 번 더 눌러야 동작한다. `'handled'` 는 버튼 탭은 그대로 전달하고, 아무것도 처리하지
 *   않는 빈 영역 탭에서만 키보드를 닫는다 → "다른 영역을 선택하면 닫힌다"가 성립한다.
 *
 * - `automaticallyAdjustKeyboardInsets: true` (iOS)
 *   스크롤뷰와 키보드가 실제로 겹치는 만큼만 contentInset 을 넣고, 포커스된 입력창을
 *   보이는 영역으로 끌어올린다(RCTScrollView 의 `_keyboardWillChangeFrame`).
 *   겹치는 양을 네이티브가 계산하므로 KeyboardAvoidingView 와 같이 써도 이중으로
 *   밀리지 않는다(컨테이너가 이미 줄었으면 겹침이 0 이라 아무 일도 하지 않는다).
 *   안드로이드는 이 프롭이 없어 무시된다 — 그쪽은 KeyboardAvoidingView 가 담당한다.
 *
 * 가로 스크롤(탭 바 등)은 네이티브가 먼저 걸러내므로 인셋이 붙지 않는다.
 *
 * ScrollView 는 클래스 컴포넌트라 `defaultProps` 가 그대로 동작한다
 * (React 19 에서 없어진 건 함수 컴포넌트의 defaultProps 다).
 * FlatList / SectionList / Animated.ScrollView 는 내부에서 이 ScrollView 로 렌더되고,
 * 지정하지 않은 프롭은 undefined 로 넘어오므로 이 기본값을 함께 받는다.
 *
 * index.js 최상단에서 App 보다 먼저 import 할 것.
 */
import { ScrollView } from 'react-native';

const ScrollViewAny = ScrollView as any;

ScrollViewAny.defaultProps = {
	...ScrollViewAny.defaultProps,
	keyboardDismissMode: 'on-drag',
	keyboardShouldPersistTaps: 'handled',
	automaticallyAdjustKeyboardInsets: true,
};

export {};
