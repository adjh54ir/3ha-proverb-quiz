/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/App';

test('renders correctly', async () => {
	let tree!: ReactTestRenderer.ReactTestRenderer;
	await ReactTestRenderer.act(() => {
		tree = ReactTestRenderer.create(<App />);
	});

	// 마운트만 확인하는 스모크 테스트라도 반드시 정리한다.
	// 홈에서 자동으로 뜨는 화면 안내(CharacterGuide)가 28ms 타이핑 타이머를 돌리는데,
	// 언마운트하지 않으면 그 타이머가 테스트가 끝난 뒤에도 살아남아
	// "Jest environment has been torn down" 오류로 다른 스위트를 흔든다.
	await ReactTestRenderer.act(() => {
		tree.unmount();
	});
});
