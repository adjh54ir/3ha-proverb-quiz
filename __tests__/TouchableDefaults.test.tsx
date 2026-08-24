/**
 * TouchableDefaults 회귀 테스트
 * - activeOpacity 를 빠뜨린 버튼이 RN 기본값 0.2 로 확 꺼지면 안 된다.
 * - 화면에서 명시한 값은 기본값보다 우선해야 한다(오버레이 닫기 영역의 1 등).
 *
 * 패치된 forwardRef.render 를 직접 호출해, 원본 구현에 실제로 어떤 props 가
 * 넘어가는지(= 렌더된 엘리먼트의 props)를 확인한다.
 */
import { TouchableOpacity } from 'react-native';
import { DEFAULT_ACTIVE_OPACITY } from '../src/utils/TouchableDefaults';

const renderedProps = (props: Record<string, unknown>) => {
	const element = (TouchableOpacity as any).render(props, null);
	return element.props as Record<string, unknown>;
};

test('activeOpacity 를 지정하지 않으면 앱 공통값이 들어간다', () => {
	expect(renderedProps({})).toMatchObject({ activeOpacity: DEFAULT_ACTIVE_OPACITY });
	// RN 기본값 0.2 는 눌림이 과해서 쓰지 않는다.
	expect(DEFAULT_ACTIVE_OPACITY).toBeGreaterThan(0.2);
});

test('화면에서 지정한 activeOpacity 가 기본값을 덮는다', () => {
	expect(renderedProps({ activeOpacity: 1 })).toMatchObject({ activeOpacity: 1 });
});

test('나머지 props 는 그대로 전달된다', () => {
	const onPress = () => {};
	expect(renderedProps({ onPress, disabled: true })).toMatchObject({ onPress, disabled: true });
});
