import React from 'react';

import { useThemeMode } from '@/hooks/useThemeMode';

/**
 * 화이트/다크 모드 전환 시 화면을 새 팔레트로 다시 그리게 하는 HOC.
 *
 * 스타일시트는 `themedStyles` 가 모드별로 만들어 주지만, 화면이 리렌더되지 않으면
 * 이전 팔레트가 그대로 남는다. 그래서 각 화면이 모드 변경을 구독하게 감싼다.
 *
 * 리마운트(key 교체) 대신 **리렌더**만 한다.
 * - 색을 useMemo/useRef/Animated 에 담아두는 화면이 없어 리렌더만으로 충분하다.
 * - 리마운트하면 스크롤 위치·필터·아코디언 상태가 초기화되는데, 테마 토글이 설정 화면
 *   안에 있어 누르자마자 화면이 맨 위로 튀어 오르는 것처럼 보인다.
 *
 * 예외적으로 props 동등성으로 렌더를 건너뛰는 자식(React.memo)은 스스로 갱신되지
 * 않으므로 그 자리에서 `key={getThemeMode()}` 로 처리한다. (예: <Markdown>)
 */
export const withThemedScreen = (Screen: React.ComponentType<any>): React.ComponentType<any> => {
	const ThemedScreen = (props: any) => {
		useThemeMode();
		return <Screen {...props} />;
	};
	ThemedScreen.displayName = `withThemedScreen(${Screen.displayName || Screen.name || 'Screen'})`;
	return ThemedScreen;
};
