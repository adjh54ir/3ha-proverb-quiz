import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppLayout from './AppLayout';
import { COLORS, STATUS_BAR_STYLE } from '@/const/common/Theme';
import { loadTextSizeMode, loadThemeMode, useThemeMode } from '@/hooks/useThemeMode';

/**
 * 모든 네비게이션에 대해 일괄 메인으로 관리합니다.
 *
 * GestureHandlerRootView 로 루트를 감싸야 Android 에서 RN Modal(별도 윈도우)의
 * 내부 터치가 죽거나 레이아웃이 깨지는 문제가 발생하지 않는다.
 *
 * 저장된 화이트/다크 모드와 글자 크기 모드를 먼저 적용한 뒤에 화면을 그린다.
 * (부트스플래시가 떠 있는 동안 처리되므로 라이트 → 다크로 번쩍이는 현상이 없다)
 * @returns
 */
const ApplicationNavigator = () => {
	const mode = useThemeMode();
	const [themeReady, setThemeReady] = useState(false);

	useEffect(() => {
		let mounted = true;
		// 테마와 글자 크기를 함께 복원한 뒤 첫 화면을 그린다.
		Promise.all([loadThemeMode(), loadTextSizeMode()]).finally(() => {
			if (mounted) {
				setThemeReady(true);
			}
		});
		return () => {
			mounted = false;
		};
	}, []);

	return (
		<GestureHandlerRootView style={styles.root}>
			<SafeAreaProvider>
				{/* 시스템 설정이 아니라 앱에서 고른 모드 기준으로 상태바 아이콘 색을 맞춘다. */}
				<StatusBar translucent backgroundColor="transparent" barStyle={STATUS_BAR_STYLE[mode]} />
				{/* 아래의 각각 Navigation 내의 Path는 중복이 발생하면 안됩니다. */}
				{themeReady ? <AppLayout /> : <View style={[styles.root, { backgroundColor: COLORS.background }]} />}
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	root: { flex: 1 },
});

export default ApplicationNavigator;
