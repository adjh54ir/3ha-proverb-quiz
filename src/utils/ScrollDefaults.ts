/**
 * 전역 ScrollView 기본 프롭 (부수효과 모듈)
 *
 * TextInput 에 포커스가 있는 상태에서 목록을 스크롤하거나 다른 항목을 누르면
 * 키보드가 닫혀야 한다. RN 기본값은 그 반대다.
 *  - keyboardShouldPersistTaps: 'never'  → 키보드가 떠 있으면 **첫 탭이 키보드 닫기로 먹힌다**.
 *    버튼/목록 항목을 두 번 눌러야 눌리는 문제(특히 DropDownPicker 리스트).
 *  - keyboardDismissMode: 'none'         → 스크롤해도 키보드가 그대로 화면을 덮는다.
 *
 * 화면마다 프롭을 붙여 메우는 방식은 이미 절반쯤 누락돼 있었고(라이브러리 내부
 * ScrollView/FlatList 는 손댈 수도 없다), 새 화면에서 또 빠진다. 그래서 기본값을 바꾼다.
 * FlatList / SectionList / VirtualizedList 도 내부적으로 이 ScrollView 를 쓰므로 함께 적용된다.
 *
 * ⚠️ `{ 기본값, ...props }` 스프레드로는 안 된다. VirtualizedList 는 props 를 그대로
 *    ScrollView 로 넘기면서 지정하지 않은 키도 `undefined` 값으로 실어 보낸다.
 *    그러면 스프레드가 기본값을 undefined 로 덮어쓴다. `?? 기본값` 으로 채운다.
 *
 * index.js 최상단에서 App 보다 먼저 import 할 것.
 */
import { ScrollView } from 'react-native';

/** 키보드가 떠 있어도 자식이 처리한 탭은 그대로 전달한다(두 번 눌러야 하는 문제 방지). */
export const DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS = 'handled';
/** 목록을 끌면 키보드를 내린다. */
export const DEFAULT_KEYBOARD_DISMISS_MODE = 'on-drag';

// forwardRef 객체의 render 는 타입상 노출되지 않아 any 캐스팅이 필요하다.
const ScrollAny = ScrollView as any;
const baseRender = ScrollAny.render;

ScrollAny.render = function patchedScrollViewRender(props: any, ref: any) {
	return baseRender.call(
		this,
		{
			...props,
			keyboardShouldPersistTaps: props.keyboardShouldPersistTaps ?? DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS,
			keyboardDismissMode: props.keyboardDismissMode ?? DEFAULT_KEYBOARD_DISMISS_MODE,
		},
		ref,
	);
};

export {};
