/**
 * ScrollDefaults 회귀 테스트
 *
 * TextInput 이 있는 화면마다 키보드 프롭을 손으로 붙이면 새 화면에서 또 빠진다.
 * 기본값을 전역으로 바꿨으니 (1) 실제로 붙는지, (2) 화면에서 준 값이 우선하는지를 못박는다.
 *
 * 세 번째 테스트는 "화면에서 KeyboardAvoidingView 를 쓸 때 android 만 빼놓지 않는다"는
 * 규칙을 소스로 확인한다 — 이 앱은 edge-to-edge 라 behavior 를 비우면 안드로이드에서
 * 키보드 회피가 아예 동작하지 않는다(common/modal/README.md 참고).
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { FlatList, ScrollView } from 'react-native';
import { act, create } from 'react-test-renderer';

import '@/utils/ScrollDefaults';

const defaults = () => (ScrollView as any).defaultProps as Record<string, unknown>;

/**
 * 네이티브 뷰(RCTScrollView)에 실제로 넘어간 props.
 *
 * `defaultProps` 를 확인하는 것만으로는 부족하다 — React 19 는 함수 컴포넌트의
 * defaultProps 지원을 없앴고, 클래스는 엘리먼트가 아니라 렌더 시점에 채워진다.
 * 그래서 렌더 트리에서 직접 읽어 "정말 적용됐는지"를 본다.
 */
const nativeProps = (element: React.ReactElement): Record<string, unknown> => {
	let tree: ReturnType<typeof create>;
	act(() => {
		tree = create(element);
	});
	const findScroll = (node: any): any => {
		if (!node) {
			return null;
		}
		if (node.type === 'RCTScrollView') {
			return node;
		}
		return (node.children ?? []).reduce((found: any, child: any) => found ?? findScroll(child), null);
	};
	const scroll = findScroll(tree!.toJSON());
	expect(scroll).not.toBeNull();
	return scroll.props;
};

test('아무 프롭도 주지 않은 ScrollView 에 세 기본값이 모두 적용된다', () => {
	expect(nativeProps(<ScrollView />)).toMatchObject({
		// 스크롤을 움직이면 키보드가 닫힌다
		keyboardDismissMode: 'on-drag',
		// RN 기본값 'never' 는 첫 탭을 삼켜 버튼을 두 번 눌러야 한다
		keyboardShouldPersistTaps: 'handled',
		// iOS 는 키보드와 겹치는 만큼만 인셋을 넣는다
		automaticallyAdjustKeyboardInsets: true,
	});
});

test('화면에서 지정한 값이 기본값을 덮는다', () => {
	expect(nativeProps(<ScrollView keyboardDismissMode="none" />)).toMatchObject({ keyboardDismissMode: 'none' });
});

test('FlatList 도 같은 기본값을 받는다 (내부적으로 ScrollView 로 렌더된다)', () => {
	expect(nativeProps(<FlatList data={[]} renderItem={() => null} />)).toMatchObject({
		keyboardDismissMode: 'on-drag',
		keyboardShouldPersistTaps: 'handled',
		automaticallyAdjustKeyboardInsets: true,
	});
});

test('전역 기본값은 ScrollView 자체에 박혀 있다 (화면마다 붙일 필요가 없다)', () => {
	expect(defaults()).toMatchObject({
		keyboardDismissMode: 'on-drag',
		keyboardShouldPersistTaps: 'handled',
		automaticallyAdjustKeyboardInsets: true,
	});
});

describe('KeyboardAvoidingView behavior', () => {
	const SOURCE_DIR = path.join(__dirname, '..', 'src');

	const walk = (dir: string): string[] =>
		fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const full = path.join(dir, entry.name);
			return entry.isDirectory() ? walk(full) : full.endsWith('.tsx') ? [full] : [];
		});

	test('behavior 를 플랫폼 분기로 주는 곳이 없다', () => {
		const offenders = walk(SOURCE_DIR).filter((file) => /behavior=\{Platform\.OS/.test(fs.readFileSync(file, 'utf8')));
		expect(offenders).toEqual([]);
	});

	test('모든 KeyboardAvoidingView 가 behavior="padding" 이다', () => {
		const uses = walk(SOURCE_DIR).flatMap((file) => {
			const source = fs.readFileSync(file, 'utf8');
			return [...source.matchAll(/<KeyboardAvoidingView([^>]*)>/g)].map((m) => ({
				file: path.relative(SOURCE_DIR, file),
				behavior: /behavior="padding"/.test(m[1]),
			}));
		});
		expect(uses.length).toBeGreaterThan(0);
		expect(uses.filter((use) => !use.behavior)).toEqual([]);
	});
});
