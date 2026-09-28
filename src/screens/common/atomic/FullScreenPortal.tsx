import React, { useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { isTablet } from '@/utils/DementionUtils';

/**
 * 태블릿에서 본문 기둥(CONTENT_MAX_WIDTH) 밖까지 덮어야 하는 오버레이를 앱 루트로 올린다.
 *
 * 화면은 AppLayout 의 기둥 안에 그려지고, 스택 카드·탭 뷰가 `overflow: 'hidden'` 이라
 * 화면 안에서 음수 left/right 로 넓혀도 기둥 경계에서 잘린다. 그래서 광고 준비 딤은 좌우 여백이
 * 밝게 남고, 컨페티는 기둥 왼쪽 끝부터 화면 폭만큼 퍼져 오른쪽 밖으로 떨어졌다.
 *
 * 폰은 기둥 = 화면이라 제자리에 그대로 그린다(폰 레이아웃 불변). 태블릿에서만 루트 host 로 보낸다.
 * RN Modal 을 쓰지 않는 이유 — 광고 로딩 중 네이티브 창이 떠 있으면 전면 광고가 그 위로 못 뜰 수 있다.
 *
 * ```tsx
 * <FullScreenPortal>
 *   <View style={styles.adOverlay}>…</View>
 * </FullScreenPortal>
 * ```
 * host 는 앱 루트(AppLayout)에 **한 번만** 둔다.
 */
type Entry = [number, React.ReactNode];

let entries: Entry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = (next: Entry[]) => {
	entries = next;
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getEntries = () => entries;

const upsert = (id: number, node: React.ReactNode) => {
	const index = entries.findIndex(([entryId]) => entryId === id);
	emit(index === -1 ? [...entries, [id, node]] : entries.map((entry) => (entry[0] === id ? [id, node] : entry)));
};

const remove = (id: number) => emit(entries.filter(([entryId]) => entryId !== id));

export const FullScreenPortal = ({ children }: { children: React.ReactNode }): React.ReactElement | null => {
	const [id] = useState(() => nextId++);

	// 렌더마다 최신 children 으로 갈아 끼운다 — 같은 자리·같은 타입이라 host 쪽 상태(컨페티 애니메이션)는 유지된다.
	useLayoutEffect(() => {
		if (isTablet) {
			upsert(id, children);
		}
	});

	useLayoutEffect(() => () => remove(id), [id]);

	return isTablet ? null : <>{children}</>;
};

export const FullScreenPortalHost = (): React.ReactElement | null => {
	const current = useSyncExternalStore(subscribe, getEntries, getEntries);
	if (current.length === 0) {
		return null;
	}
	return (
		<>
			{current.map(([id, node]) => (
				// box-none — 컨페티처럼 터치를 막지 않는 내용은 아래로 통과시키고, 딤처럼 막는 내용은 스스로 막는다
				<View key={id} style={StyleSheet.absoluteFill} pointerEvents="box-none">
					{node}
				</View>
			))}
		</>
	);
};
