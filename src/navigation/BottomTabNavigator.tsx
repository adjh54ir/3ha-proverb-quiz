import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '@/screens/Home';
import { Paths } from './conf/Paths';
import SettingScreen from '@/screens/SettingScreen';
import IconComponent from '@/screens/common/atomic/IconComponent';
import ProverbListScreen from '@/screens/ProverbListScreen';

/**
 * BottomTab Navigator : 하단의 메뉴를 구성하는 경우
 * @returns
 */
const BottomTabNavigator = (appStateType: any) => {
	const Tab = createBottomTabNavigator();

	useEffect(() => {}, []);

	return (
		<Tab.Navigator initialRouteName={Paths.HOME}>
			{/* 홈 화면 */}

			<Tab.Screen
				name={Paths.PROVERB_LIST}
				component={ProverbListScreen}
				options={({ navigation }) => ({
					unmountOnBlur: true,
					title: '속담 리스트',
					tabBarLabel: '속담 리스트',
					tabBarIcon: ({ color, size }) => <IconComponent type='materialIcons' name='public' size={size} color={color} />,
				})}
			/>
			<Tab.Screen
				name={Paths.HOME}
				component={Home}
				options={({ navigation }) => ({
					unmountOnBlur: true,
					title: '홈',
					tabBarLabel: '홈',
					tabBarIcon: ({ color, size }) => <IconComponent type='materialIcons' name='home' size={size} color={color} />,
				})}
			/>

			<Tab.Screen
				name={Paths.SETTING}
				component={SettingScreen}
				options={({ navigation }) => ({
					unmountOnBlur: true,
					title: '설정',
					tabBarLabel: '설정',
					tabBarIcon: ({ color, size }) => <IconComponent type='materialIcons' name='settings' size={size} color={color} />,
				})}
			/>
		</Tab.Navigator>
	);
};
export default BottomTabNavigator;
