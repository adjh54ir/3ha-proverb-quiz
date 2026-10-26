import { useEffect, useRef } from 'react';
import { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } from 'react-native';

/**
 * 외장 키보드(아이패드 매직 키보드·안드로이드 태블릿 키보드) 단축키.
 *
 * 네이티브가 퀴즈 보기 1~4 와 Enter 만 보낸다 — iOS `AppDelegate.swift` 의 HardwareKeyViewController
 * (+ `HardwareKeyEmitter.m`), Android `MainActivity.onKeyUp`. 입력창이 포커스면 글자는 입력창으로 가고
 * 여기로 오지 않는다.
 *
 * 받는 쪽은 스택 하나다 — **맨 위 등록 하나만** 키를 받는다. 열린 모달(AppModal)은 null 을 올려
 * 뒤 화면이 키를 받지 못하게 막는다(iOS 는 모달이 떠도 키가 루트 화면까지 올라온다).
 * 모달 안에서 키를 받으려면 모달 컴포넌트가 직접 등록한다 — 자식(AppModal) effect 가 먼저 돌아
 * 모달 쪽 등록이 그 위에 쌓인다.
 */
export type HardwareKey = '1' | '2' | '3' | '4' | 'enter';

type Handler = (key: HardwareKey) => void;

const stack: Array<{ handler: Handler | null }> = [];

/** 맨 위 등록에 키를 넘긴다 (테스트에서 네이티브 없이 부를 수 있게 export) */
export const dispatchHardwareKey = (key: HardwareKey) => stack[stack.length - 1]?.handler?.(key);

const emitter =
	Platform.OS === 'ios'
		? NativeModules.HardwareKeyEmitter
			? new NativeEventEmitter(NativeModules.HardwareKeyEmitter)
			: null
		: DeviceEventEmitter;
emitter?.addListener('hardwareKey', dispatchHardwareKey);

/** 숫자 키 '1'~'4' → 보기 인덱스 0~3 (Enter 면 null) */
export const optionIndexOf = (key: HardwareKey) => (key === 'enter' ? null : Number(key) - 1);

/**
 * 단축키 받기. handler 가 null 이면 키를 막기만 한다(모달).
 *
 * enabled 는 '화면 포커스'·'모달 열림'처럼 드물게 바뀌는 값만 준다 — 바뀔 때마다 스택 맨 위로
 * 다시 올라가므로, 정답 잠금 같은 자주 바뀌는 조건은 handler 안에서 거른다.
 */
export const useHardwareKeys = (handler: Handler | null, enabled = true) => {
	const handlerRef = useRef(handler);
	handlerRef.current = handler;
	const blocksOnly = handler === null;

	useEffect(() => {
		if (!enabled) {
			return;
		}
		const entry = { handler: blocksOnly ? null : (key: HardwareKey) => handlerRef.current?.(key) };
		stack.push(entry);
		return () => {
			stack.splice(stack.indexOf(entry), 1);
		};
	}, [enabled, blocksOnly]);
};
