/**
 * ScrollDefaults 회귀 테스트
 * - 키보드가 떠 있을 때 목록 항목을 두 번 눌러야 눌리는 문제(keyboardShouldPersistTaps: 'never').
 * - 스크롤해도 키보드가 안 닫히는 문제(keyboardDismissMode: 'none').
 * 두 기본값을 화면마다 붙이는 대신 전역으로 바꿨다.
 *
 * TouchableDefaults 테스트와 같은 방식으로, 패치된 forwardRef.render 를 직접 호출해
 * 원본 구현에 실제로 어떤 props 가 넘어가는지 확인한다.
 */
import { ScrollView } from 'react-native';
import { DEFAULT_KEYBOARD_DISMISS_MODE, DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS } from '../src/utils/ScrollDefaults';

const renderedProps = (props: Record<string, unknown>) => {
	const element = (ScrollView as any).render({ children: null, ...props }, null);
	return element.props as Record<string, unknown>;
};

test('지정하지 않으면 키보드를 내리는 기본값이 들어간다', () => {
	expect(renderedProps({})).toMatchObject({
		keyboardShouldPersistTaps: DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS,
		keyboardDismissMode: DEFAULT_KEYBOARD_DISMISS_MODE,
	});
});

test('undefined 로 명시돼 들어와도 기본값이 살아남는다', () => {
	// FlatList/VirtualizedList 는 지정하지 않은 키까지 undefined 값으로 ScrollView 에 실어 보낸다.
	// `{ 기본값, ...props }` 스프레드로 구현하면 여기서 undefined 에 덮여 버린다.
	expect(
		renderedProps({ keyboardShouldPersistTaps: undefined, keyboardDismissMode: undefined }),
	).toMatchObject({
		keyboardShouldPersistTaps: DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS,
		keyboardDismissMode: DEFAULT_KEYBOARD_DISMISS_MODE,
	});
});

test('화면에서 지정한 값이 기본값을 덮는다', () => {
	expect(renderedProps({ keyboardShouldPersistTaps: 'always', keyboardDismissMode: 'none' })).toMatchObject({
		keyboardShouldPersistTaps: 'always',
		keyboardDismissMode: 'none',
	});
});

test('나머지 props 는 그대로 전달된다', () => {
	const onScroll = () => {};
	expect(renderedProps({ onScroll, horizontal: true })).toMatchObject({ onScroll, horizontal: true });
});
