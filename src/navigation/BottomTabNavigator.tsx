import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '@/screens/Home';
import { Paths } from './conf/Paths';
import SettingScreen from '@/screens/SettingScreen';
import IconComponent from '@/screens/common/atomic/IconComponent';
import ProverbListScreen from '@/screens/ProverbListScreen';
import MyScoreScreen from '@/screens/MyScoreScreen';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomTabNavigator = () => {
	const Tab = createBottomTabNavigator();
	const isTablet = DeviceInfo.isTablet();
	const insets = useSafeAreaInsets();

	// 📌 공통 스타일 함수
	const getScreenOptions = (isTablet: boolean, insets: any) => ({
		tabBarStyle: {
			height: scaleWidth(50) + insets.bottom,
			paddingTop: isTablet ? scaleHeight(8) : 0,
			backgroundColor: '#fff',
		},
		tabBarLabelStyle: {
			fontSize: isTablet ? scaledSize(11) : scaledSize(11),
			marginLeft: scaleWidth(2),
			marginTop: isTablet ? scaleHeight(10) : scaleHeight(2.5),
		},
	});

	const getTabBarIcon = (iconName: string) => {
		return ({ color, size }: { color: string; size: number }) => (
			<IconComponent
				type='materialicons'
				name={iconName}
				color={color}
				style={
					isTablet
						? {
							height: scaleHeight(32),
							width: scaleWidth(26),
							marginLeft: 4,
							justifyContent: "center",
							alignContent: "center",
							// backgroundColor: "red"
						}
						: {
							height: scaleHeight(22),
							width: scaleWidth(22),
						}
				}
			/>
		);
	};
	return (
		<Tab.Navigator
			initialRouteName={Paths.HOME}
			screenOptions={{
				headerTitleAlign: 'center',
				tabBarLabelPosition: 'below-icon',
				...getScreenOptions(isTablet, insets),
			}}>
			<Tab.Screen
				name={Paths.PROVERB_LIST}
				component={ProverbListScreen}
				options={{
					title: '속담 정보',
					tabBarLabel: '속담 정보',
					tabBarIcon: getTabBarIcon('menu-book'),
					headerShown: false, // 헤더 숨김
				}}
			/>

			<Tab.Screen
				name={Paths.HOME}
				component={Home}
				options={{
					title: '홈',
					tabBarLabel: '홈',
					tabBarIcon: getTabBarIcon('home'),
					headerShown: false, // 헤더 숨김
				}}
			/>

			<Tab.Screen
				name={Paths.MY_SCORE}
				component={MyScoreScreen}
				options={{
					title: '나의 활동',
					tabBarLabel: '나의 활동',
					tabBarIcon: getTabBarIcon('emoji-events'),
					headerShown: false, // 헤더 숨김
				}}
			/>

			<Tab.Screen
				name={Paths.SETTING}
				component={SettingScreen}
				options={{
					title: '설정',
					tabBarLabel: '설정',
					tabBarIcon: getTabBarIcon('settings'),
					headerShown: false, // 헤더 숨김
				}}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;
