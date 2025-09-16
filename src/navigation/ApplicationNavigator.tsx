import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppLayout from './AppLayout';

/**
 * 모든 네비게이션에 대해 일괄 메인으로 관리합니다.
 * @returns
 */
const ApplicationNavigator = () => {
	return (
		<SafeAreaProvider>
			<StatusBar translucent backgroundColor='transparent' barStyle='dark-content' />
			{/* <StatusBar backgroundColor='#ffffff' translucent={false} /> */}
			{/* 아래의 각각 Navigation 내의 Path는 중복이 발생하면 안됩니다. */}
			{/* <ZTemplateDradwerNavigator /> */}
			{/* <DrawerNavigator /> */}
			{/* <BottomTabNavigator /> */}
			<AppLayout />
			{/* <TopNavigator /> */}
		</SafeAreaProvider >
	);
};
export default ApplicationNavigator;
