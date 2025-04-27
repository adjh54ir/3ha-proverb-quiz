import { createStackNavigator } from '@react-navigation/stack';

import { Paths } from '@/navigation/conf/Paths';
import SettingScreen from '@/screens/SettingScreen';
import Home from '@/screens/Home';
import BottomTabNavigator from './BottomTabNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import ProverbQuizModeSelectScreen from '@/screens/ProverbQuizModeScreen';
import ProverbMeaningQuizScreen from '@/screens/ProverbMeaningQuizScreen';
import ProverbFindQuizScreen from '@/screens/ProverbFindQuizScreen';
import ProverbFillBlankQuizScreen from '@/screens/ProverbFillBlankQuizScreen';
import ProverbStudyScreen from '@/screens/ProverbStudyScreen';

/**
 * Stack Navigator : 일반적인 화면만 출력을 하는 경우
 * @returns
 */
const StackNavigator = () => {
	const Stack = createStackNavigator(); // Stack Navigator 이름을 정의합니다.

	return (
		<Stack.Navigator
			screenOptions={{
				headerTitleAlign: 'center', // 타이틀 가운데 정렬
				headerStyle: {
					backgroundColor: '#f9f9f9',
				},
				headerTitleStyle: {
					fontSize: 18,
					fontWeight: 'bold',
					color: '#2c3e50',
				},
			}}
			initialRouteName={Paths.MAIN_TAB}
			detachInactiveScreens={true}>
			<Stack.Screen
				name={Paths.MAIN_TAB}
				component={BottomTabNavigator}
				options={{ headerShown: false }} // 탭 화면은 헤더 숨김
			/>
			<Stack.Screen
				name={Paths.PROVERB_MEANING_QUIZ}
				component={ProverbMeaningQuizScreen}
				options={({ navigation }) => ({
					headerShown: true,
					title: '뜻 맞추기',
					headerLeft: () => (
						<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
							<Icon name='arrow-back' size={24} color='#2c3e50' />
						</TouchableOpacity>
					),
				})}
			/>

			<Stack.Screen
				name={Paths.PROVERB_FIND_QUIZ}
				component={ProverbFindQuizScreen}
				options={({ navigation }) => ({
					headerShown: true,
					title: '속담 찾기',
					headerLeft: () => (
						<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
							<Icon name='arrow-back' size={24} color='#2c3e50' />
						</TouchableOpacity>
					),
				})}
			/>

			<Stack.Screen
				name={Paths.PROVERB_BLANK_QUIZ}
				component={ProverbFillBlankQuizScreen}
				options={({ navigation }) => ({
					headerShown: true,
					title: '빈칸 채우기',
					headerLeft: () => (
						<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
							<Icon name='arrow-back' size={24} color='#2c3e50' />
						</TouchableOpacity>
					),
				})}
			/>

			<Stack.Screen
				name={Paths.PROVERB_QUIZ_MODE_SELECT}
				component={ProverbQuizModeSelectScreen}
				options={({ navigation }) => ({
					headerShown: true,
					title: '퀴즈모드 선택',
					headerLeft: () => (
						<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
							<Icon name='arrow-back' size={24} color='#2c3e50' />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name={Paths.PROVERB_STUDY}
				component={ProverbStudyScreen}
				options={({ navigation }) => ({
					headerShown: true,
					title: '속담 학습',
					headerLeft: () => (
						<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
							<Icon name='arrow-back' size={24} color='#2c3e50' />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen name={Paths.HOME} component={Home} />
			<Stack.Screen name={Paths.SETTING} component={SettingScreen} />
		</Stack.Navigator>
	);
};
export default StackNavigator;
