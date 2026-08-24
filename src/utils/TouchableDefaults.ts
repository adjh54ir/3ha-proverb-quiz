/**
 * 전역 TouchableOpacity 기본 프롭 (부수효과 모듈)
 *
 * RN 의 TouchableOpacity 는 activeOpacity 를 지정하지 않으면 0.2 로 눌린다.
 * 이 앱은 대부분의 버튼에 0.8 을 명시해 두었는데, 빠뜨린 곳만 20% 까지 확 꺼져서
 * 같은 화면 안에서도 누름 반응 세기가 제각각으로 보인다.
 *
 * 화면마다 프롭을 붙여 메우면 새로 추가되는 버튼에서 또 누락되므로 기본값 자체를 바꾼다.
 * 호출부에서 activeOpacity 를 준 곳은 그대로 우선한다(오버레이 닫기 영역의 1 등).
 *
 * Modal 과 달리 TouchableOpacity 의 export 는 React.forwardRef(...) 객체라
 * defaultProps 가 먹지 않는다. TextDefaults 와 같은 방식으로 render 를 감싼다.
 *
 * index.js 최상단에서 App 보다 먼저 import 할 것.
 */
import { TouchableOpacity } from 'react-native';

/** 앱 공통 누름 강도. 화면에서 값을 바꾸고 싶을 때만 activeOpacity 를 직접 준다. */
export const DEFAULT_ACTIVE_OPACITY = 0.8;

// forwardRef 객체의 render 는 타입상 노출되지 않아 any 캐스팅이 필요하다.
const TouchableAny = TouchableOpacity as any;
const baseRender = TouchableAny.render;

TouchableAny.render = function patchedTouchableRender(props: any, ref: any) {
	return baseRender.call(this, { activeOpacity: DEFAULT_ACTIVE_OPACITY, ...props }, ref);
};

export {};
