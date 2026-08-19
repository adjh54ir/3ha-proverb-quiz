import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppLayout from './AppLayout';

/**
 * 모든 네비게이션에 대해 일괄 메인으로 관리합니다.
 *
 * GestureHandlerRootView 로 루트를 감싸야 Android 에서 RN Modal(별도 윈도우)의
 * 내부 터치가 죽거나 레이아웃이 깨지는 문제가 발생하지 않는다.
 * @returns
 */
const ApplicationNavigator = () => {
	return (
		<GestureHandlerRootView style={styles.root}>
			<SafeAreaProvider>
				{/* 앱은 항상 화이트 모드 기준이므로 상태바 아이콘은 dark-content 로 고정한다. */}
				<StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
				{/* 아래의 각각 Navigation 내의 Path는 중복이 발생하면 안됩니다. */}
				<AppLayout />
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	root: { flex: 1 },
});

export default ApplicationNavigator;
