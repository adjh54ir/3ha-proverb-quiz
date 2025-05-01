import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '@/screens/Home';
import { Paths } from './conf/Paths';
import SettingScreen from '@/screens/SettingScreen';
import IconComponent from '@/screens/common/atomic/IconComponent';
import ProverbListScreen from '@/screens/ProverbListScreen';
import MyScoreScreen from '@/screens/MyScoreScreen';

const BottomTabNavigator = () => {
	const Tab = createBottomTabNavigator();

	return (
		<Tab.Navigator initialRouteName={Paths.HOME}>
			<Tab.Screen
				name={Paths.PROVERB_LIST}
				component={ProverbListScreen}
				options={{
					unmountOnBlur: true,
					title: '속담 정보',
					tabBarLabel: '속담 정보',
					tabBarIcon: ({ color, size }) => <IconComponent type='materialIcons' name='menu-book' size={size} color={color} />,
				}}
			/>

			<Tab.Screen
				name={Paths.HOME}
				component={Home}
				options={{
					unmountOnBlur: true,
					title: '홈',
					tabBarLabel: '홈',
					tabBarIcon: ({ color, size }) => <IconComponent type='materialIcons' name='home' size={size} color={color} />,
				}}
			/>

			<Tab.Screen
				name={Paths.MY_SCORE}
				component={MyScoreScreen}
				options={{
					unmountOnBlur: true,
					title: '나의 활동',
					tabBarLabel: '나의 활동',
					tabBarIcon: ({ color, size }) => (
						<IconComponent type='materialIcons' name='emoji-events' size={size} color={color} />
					),
				}}
			/>

			<Tab.Screen
				name={Paths.SETTING}
				component={SettingScreen}
				options={{
					unmountOnBlur: true,
					title: '설정',
					tabBarLabel: '설정',
					tabBarIcon: ({ color, size }) => <IconComponent type='materialIcons' name='settings' size={size} color={color} />,
				}}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;
