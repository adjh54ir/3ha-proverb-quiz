import React from 'react';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '@/screens/Home';
import { Paths } from './conf/Paths';
import SettingScreen from '@/screens/SettingScreen';
import IconComponent from '@/screens/common/atomic/IconComponent';
import ProverbListScreen from '@/screens/ProverbListScreen';
import MyScoreScreen from '@/screens/MyScoreScreen';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TodayQuizScreen from '@/screens/TodayQuizScreen';

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
			fontSize: isTablet ? scaledSize(12) : scaledSize(11),
			marginTop: isTablet ? scaleHeight(10) : 0,
		},
	});

	// materialicons

	/**
	 * 반응형 태블릿 처리에 대한 Helper
	 * @param iconName
	 * @param isTablet
	 * @returns
	 */
	const getTabBarIcon = (iconType: Parameters<typeof IconComponent>[0]['type'], iconName: string, isTablet: boolean) => {
		return ({ color }: { color: string; size: number }) => (
			<IconComponent
				type={iconType}
				name={iconName}
				color={color}
				style={isTablet ? { marginTop: scaleHeight(25), height: scaleHeight(45), width: scaleWidth(16) } : undefined}
			/>
		);
	};
	/**
	 * 현재 탭을 다시 눌렀을 때 Stack을 초기화하는 리스너 반환 함수
	 * @param navigation
	 * @param routeName
	 * @returns
	 */
	const getTabPressResetListener = (navigation: any, routeName: string) => ({
		tabPress: (e: any) => {
			const state = navigation.getState();
			const currentTab = state.routes[state.index];

			if (currentTab.name === routeName) {
				navigation.reset({
					index: 0,
					routes: [{ name: routeName }],
				});
			}
		},
	});
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
					title: '속담 사전',
					tabBarLabel: '속담 사전',
					tabBarIcon: getTabBarIcon('materialicons', 'menu-book', isTablet),
					headerShown: false, // 헤더 숨김
				}}
				listeners={({ navigation, route }) => getTabPressResetListener(navigation, route.name)}
			/>

			<Tab.Screen
				name={Paths.TODAY_QUIZ}
				component={TodayQuizScreen}
				options={{
					title: '오늘의 퀴즈',
					tabBarLabel: '오늘의 퀴즈',
					headerShown: false, // 헤더 숨김
					tabBarIcon: getTabBarIcon('MaterialCommunityIcons', 'calendar-question', isTablet),
				}}
				listeners={({ navigation, route }) => getTabPressResetListener(navigation, route.name)}
			/>

			<Tab.Screen
				name={Paths.HOME}
				component={Home}
				options={{
					title: '홈',
					tabBarLabel: '홈',
					tabBarIcon: getTabBarIcon('materialicons', 'home', isTablet),
					headerShown: false, // 헤더 숨김
				}}
				listeners={({ navigation, route }) => getTabPressResetListener(navigation, route.name)}
			/>

			<Tab.Screen
				name={Paths.MY_SCORE}
				component={MyScoreScreen}
				options={{
					title: '나의 활동',
					tabBarLabel: '나의 활동',
					tabBarIcon: getTabBarIcon('materialicons', 'emoji-events', isTablet),
					headerShown: false, // 헤더 숨김
				}}
				listeners={({ navigation, route }) => getTabPressResetListener(navigation, route.name)}
			/>

			<Tab.Screen
				name={Paths.SETTING}
				component={SettingScreen}
				options={{
					title: '설정',
					tabBarLabel: '설정',
					tabBarIcon: getTabBarIcon('materialicons', 'settings', isTablet),
					headerShown: false, // 헤더 숨김
				}}
				listeners={({ navigation, route }) => getTabPressResetListener(navigation, route.name)}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;
