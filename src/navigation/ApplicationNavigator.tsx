import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, StatusBar } from 'react-native';
import BottomTabNavigator from './BottomTabNavigator';
import DrawerNavigator from './DrawerNavigator';
import StackNavigator from './StackNavigator';
import TopNavigator from './TopNavigator';
import ZTemplateDradwerNavigator from './ZTemplateDradwerNavigator';
import { scaleHeight } from '@/utils';

/**
 * 모든 네비게이션에 대해 일괄 메인으로 관리합니다.
 * @returns
 */
const ApplicationNavigator = () => {
	return (
		<SafeAreaProvider>
			<StatusBar translucent backgroundColor='transparent' barStyle='dark-content' />
			{/* <StatusBar backgroundColor='#ffffff' translucent={false} /> */}
			<NavigationContainer>
				{/* 키보드가 텍스트를 가리는 증상 방지 */}
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				>
					{/* 키보드 외 영역을 누르는 경우 제외 */}
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						{/* 아래의 각각 Navigation 내의 Path는 중복이 발생하면 안됩니다. */}
						{/* <ZTemplateDradwerNavigator /> */}
						{/* <DrawerNavigator /> */}
						{/* <BottomTabNavigator /> */}
						<StackNavigator />
						{/* <TopNavigator /> */}
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</NavigationContainer>
		</SafeAreaProvider >
	);
};
export default ApplicationNavigator;
