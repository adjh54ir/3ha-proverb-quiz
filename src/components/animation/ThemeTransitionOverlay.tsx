import React, { useLayoutEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { PALETTES } from '@/const/common/Theme';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** 전환 길이 — 짧아야 토글을 연달아 눌러도 답답하지 않다 */
const FADE_MS = 280;

/**
 * 라이트/다크 전환 시 화면이 한 번에 뒤집혀 번쩍이는 것을 부드럽게 만든다.
 *
 * 스냅샷 없이 하는 크로스페이드 — 모드가 바뀐 그 커밋에 **이전 모드의 배경색** 막을 화면 위에
 * 덮고, 그 막을 걷어내면서 새 팔레트로 이미 그려진 화면이 드러나게 한다.
 * 터치는 막지 않는다(pointerEvents none). OS '애니메이션 줄이기'면 그리지 않는다 — 전환 자체는
 * 그대로 일어나므로 정보 손실이 없다.
 *
 * 앱 루트(AppLayout)에 한 번만 둔다. RN Modal(설정 모달 등)은 네이티브 창이라 이 막 위에 있다.
 */
const ThemeTransitionOverlay = (): React.ReactElement | null => {
	const mode = useThemeMode();
	const reducedMotion = useReducedMotion();
	const opacity = useRef(new Animated.Value(0)).current;
	const lastMode = useRef(mode);
	const fromColor = useRef(PALETTES[mode].background);

	// 모드가 바뀐 렌더에서 '이전' 배경색을 잡아 둔다 (effect 에서 lastMode 를 갱신하기 전)
	if (lastMode.current !== mode) {
		fromColor.current = PALETTES[lastMode.current].background;
	}

	// 페인트 전에 막을 불투명하게 세워야 새 화면이 한 프레임 먼저 보이지 않는다
	useLayoutEffect(() => {
		if (lastMode.current === mode) {
			return;
		}
		lastMode.current = mode;
		if (reducedMotion) {
			return;
		}
		opacity.setValue(1);
		const animation = Animated.timing(opacity, {
			toValue: 0,
			duration: FADE_MS,
			easing: Easing.out(Easing.quad),
			useNativeDriver: true,
		});
		animation.start();
		return () => animation.stop();
	}, [mode, reducedMotion, opacity]);

	if (reducedMotion) {
		return null;
	}

	return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fromColor.current, opacity }]} />;
};

export default ThemeTransitionOverlay;
