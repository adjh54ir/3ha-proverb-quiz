/**
 * ScrollDefaults 회귀 테스트
 * - 키보드가 떠 있을 때 목록 항목을 두 번 눌러야 눌리는 문제(keyboardShouldPersistTaps: 'never').
 * - 스크롤해도 키보드가 안 닫히는 문제(keyboardDismissMode: 'none').
 * - iOS 에서 키보드가 입력창을 덮는 문제(automaticallyAdjustKeyboardInsets: false).
 * 세 기본값을 화면마다 붙이는 대신 전역으로 바꿨다.
 *
 * TouchableDefaults 테스트와 같은 방식으로, 패치된 forwardRef.render 를 직접 호출해
 * 원본 구현에 실제로 어떤 props 가 넘어가는지 확인한다.
 */
import { ScrollView } from 'react-native';
import { DEFAULT_AUTO_KEYBOARD_INSETS, DEFAULT_KEYBOARD_DISMISS_MODE, DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS } from '../src/utils/ScrollDefaults';

const renderedProps = (props: Record<string, unknown>) => {
	const element = (ScrollView as any).render({ children: null, ...props }, null);
	return element.props as Record<string, unknown>;
};

test('지정하지 않으면 키보드를 내리는 기본값이 들어간다', () => {
	expect(renderedProps({})).toMatchObject({
		keyboardShouldPersistTaps: DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS,
		keyboardDismissMode: DEFAULT_KEYBOARD_DISMISS_MODE,
		automaticallyAdjustKeyboardInsets: DEFAULT_AUTO_KEYBOARD_INSETS,
	});
});

test('undefined 로 명시돼 들어와도 기본값이 살아남는다', () => {
	// FlatList/VirtualizedList 는 지정하지 않은 키까지 undefined 값으로 ScrollView 에 실어 보낸다.
	// `{ 기본값, ...props }` 스프레드로 구현하면 여기서 undefined 에 덮여 버린다.
	expect(
		renderedProps({ keyboardShouldPersistTaps: undefined, keyboardDismissMode: undefined, automaticallyAdjustKeyboardInsets: undefined }),
	).toMatchObject({
		keyboardShouldPersistTaps: DEFAULT_KEYBOARD_SHOULD_PERSIST_TAPS,
		keyboardDismissMode: DEFAULT_KEYBOARD_DISMISS_MODE,
		automaticallyAdjustKeyboardInsets: DEFAULT_AUTO_KEYBOARD_INSETS,
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

/**
 * KeyboardAvoidingView 규칙.
 *
 * 이 앱은 edge-to-edge(MainActivity 의 setDecorFitsSystemWindows(false))라 매니페스트의
 * adjustResize 로 창이 줄지 않는다. `behavior` 를 android 에서 비워 두면 키보드 회피가
 * 아예 동작하지 않고, `'height'` 는 바텀시트를 짧게만 만들어 하단 버튼이 계속 덮인다.
 * 그래서 두 플랫폼 모두 `'padding'` 으로 통일한다(common/modal/README.md 참고).
 */
describe('KeyboardAvoidingView behavior', () => {
	const fs = require('fs') as typeof import('fs');
	const path = require('path') as typeof import('path');
	const SOURCE_DIR = path.join(__dirname, '..', 'src');

	const walk = (dir: string): string[] =>
		fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const full = path.join(dir, entry.name);
			return entry.isDirectory() ? walk(full) : full.endsWith('.tsx') ? [full] : [];
		});

	test('behavior 를 플랫폼 분기로 주는 곳이 없다', () => {
		const offenders = walk(SOURCE_DIR)
			.filter((file) => /behavior=\{Platform\.OS/.test(fs.readFileSync(file, 'utf8')))
			.map((file) => path.relative(SOURCE_DIR, file));
		expect(offenders).toEqual([]);
	});

	test('모든 KeyboardAvoidingView 가 behavior="padding" 이다', () => {
		const uses = walk(SOURCE_DIR).flatMap((file) => {
			const source = fs.readFileSync(file, 'utf8');
			return [...source.matchAll(/<KeyboardAvoidingView([^>]*)>/g)].map((m) => ({
				file: path.relative(SOURCE_DIR, file),
				ok: /behavior="padding"/.test(m[1]),
			}));
		});
		expect(uses.length).toBeGreaterThan(0);
		expect(uses.filter((use) => !use.ok)).toEqual([]);
	});
});
