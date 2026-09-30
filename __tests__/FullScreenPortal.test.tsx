import React from 'react';
import { Text, View } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';

/**
 * 전체 화면 포털 회귀 테스트.
 *
 * 태블릿에서는 광고 준비 딤·컨페티가 본문 기둥(overflow hidden) 밖까지 덮어야 해서 루트 host 로
 * 올라가고, 폰은 제자리에 그대로 그려져야 한다(폰 레이아웃 불변).
 */
let mockTablet = false;
jest.mock('@/utils/DementionUtils', () => {
	const actual = jest.requireActual('@/utils/DementionUtils');
	// 컴포넌트가 렌더 때마다 isTablet 을 읽으므로 getter 로 테스트마다 기기를 바꾼다
	return new Proxy(actual, { get: (target, key) => (key === 'isTablet' ? mockTablet : target[key]) });
});

const { FullScreenPortal, FullScreenPortalHost } = require('@/screens/common/atomic/FullScreenPortal');

let mounted: ReactTestRenderer | null = null;

const renderWith = async (tablet: boolean) => {
	mockTablet = tablet;
	const Screen = ({ show, label }: { show: boolean; label: string }) => (
		<View testID="column">
			{show && (
				<FullScreenPortal>
					<Text>{label}</Text>
				</FullScreenPortal>
			)}
		</View>
	);
	const App = (props: { show: boolean; label: string }) => (
		<>
			<Screen {...props} />
			<View testID="host">
				<FullScreenPortalHost />
			</View>
		</>
	);

	let tree!: ReactTestRenderer;
	await act(async () => {
		tree = create(<App show label="딤" />);
	});
	mounted = tree;
	const textsIn = (testID: string) =>
		tree.root
			.findByProps({ testID })
			.findAllByType(Text)
			.map((node) => node.props.children);
	return { tree, App, textsIn };
};

afterEach(() => {
	act(() => mounted?.unmount());
	mounted = null;
});

test('태블릿: 내용은 화면(기둥)이 아니라 루트 host 에 그려진다', async () => {
	const { textsIn } = await renderWith(true);
	expect(textsIn('column')).toEqual([]);
	expect(textsIn('host')).toEqual(['딤']);
});

test('태블릿: 화면이 다시 그려지면 host 도 최신 내용으로 바뀌고, 사라지면 host 에서도 빠진다', async () => {
	const { tree, App, textsIn } = await renderWith(true);
	await act(async () => {
		tree.update(<App show label="딤2" />);
	});
	expect(textsIn('host')).toEqual(['딤2']);

	await act(async () => {
		tree.update(<App show={false} label="딤2" />);
	});
	expect(textsIn('host')).toEqual([]);
});

test('폰: 제자리에 그대로 그리고 host 는 비어 있다', async () => {
	const { textsIn } = await renderWith(false);
	expect(textsIn('column')).toEqual(['딤']);
	expect(textsIn('host')).toEqual([]);
});
