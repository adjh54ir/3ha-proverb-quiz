import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { BottomTabNavigationProp, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ParamListBase, useFocusEffect, useNavigation } from '@react-navigation/native';
import Home from '@/screens/Home';
import { Paths } from './conf/Paths';
import SettingScreen from '@/screens/SettingScreen';
import IconComponent from '@/screens/common/atomic/IconComponent';
import ProverbListScreen from '@/screens/ProverbListScreen';
import MyScoreScreen from '@/screens/MyScoreScreen';
import { isTablet, scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, SPACING_H } from '@/const/common/Theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TodayQuizScreen from '@/screens/TodayQuizScreen';
import { withThemedScreen } from './withThemedScreen';
import { useThemeMode } from '@/hooks/useThemeMode';

/**
 * 탭 선택 시 아이콘에 가벼운 scale pop 을 주는 래퍼
 * - Animated.Value 는 ref 로 1회 생성, 애니메이션은 cleanup 에서 stop
 */
const TabIconPop = ({ focused, children }: { focused: boolean; children: React.ReactNode }) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (!focused) {
			return;
		}
		const anim = Animated.sequence([
			Animated.timing(scaleAnim, { toValue: 1.18, duration: 120, useNativeDriver: true }),
			Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, [focused, scaleAnim]);

	return <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>{children}</Animated.View>;
};

/**
 * 탭 화면을 감싸서 "탭에 다시 들어올 때마다 최초 상태"로 만들어 주는 HOC
 * - key 를 바꿔 화면을 강제 리마운트하므로 화면별 코드 수정 없이 모든 state(스크롤/아코디언/필터/검색어)가 초기화된다.
 * - tabPress 는 focus 보다 먼저, 그리고 네비게이션 dispatch 와 같은 이벤트 배치에서 발생하므로 이전 상태가 한 프레임 노출되지 않는다.
 * - 이미 선택된 탭을 다시 눌러도 tabPress 가 발생하므로 동일하게 초기화된다.
 * - 최초 진입(첫 마운트)에는 리마운트하지 않는다 → 진입 애니메이션 중복 실행 방지.
 * - 모듈 스코프에서 1회만 생성해야 한다(렌더마다 새 컴포넌트가 되면 무한 리마운트).
 */
const withFreshMount = (Screen: React.ComponentType<any>) => {
	const FreshMountScreen = (props: any) => {
		const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
		const [remountKey, setRemountKey] = useState(0);
		// 첫 마운트는 이미 "초기 상태"이므로 처리 완료로 시작
		const handledRef = useRef(true);

		const remount = useCallback(() => {
			handledRef.current = true;
			setRemountKey((prev) => prev + 1);
		}, []);

		// 탭 버튼을 눌러 들어오는 경우 (같은 탭 재선택 포함)
		useEffect(() => navigation.addListener('tabPress', remount), [navigation, remount]);

		// navigation.navigate(MAIN_TAB, { screen }) 처럼 탭 버튼을 거치지 않고 들어오는 경우의 보완
		useFocusEffect(
			useCallback(() => {
				if (!handledRef.current) {
					remount();
				}
				return () => {
					handledRef.current = false;
				};
			}, [remount]),
		);

		return <Screen key={remountKey} {...props} />;
	};
	return FreshMountScreen;
};

// 탭 재진입 초기화(withFreshMount) + 테마 전환 시 재적용(withThemedScreen)을 함께 감싼다.
const FreshProverbListScreen = withThemedScreen(withFreshMount(ProverbListScreen));
const FreshTodayQuizScreen = withThemedScreen(withFreshMount(TodayQuizScreen));
const FreshHome = withThemedScreen(withFreshMount(Home));
const FreshMyScoreScreen = withThemedScreen(withFreshMount(MyScoreScreen));
const FreshSettingScreen = withThemedScreen(withFreshMount(SettingScreen));

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
	useThemeMode(); // 모드 변경 시 탭바 색상 재적용
	const insets = useSafeAreaInsets();

	// 📌 공통 스타일 함수 — 태블릿 여부는 공용 판정(DementionUtils.isTablet)을 그대로 읽는다.
	const getScreenOptions = (insets: any) => ({
		tabBarActiveTintColor: COLORS.primary,
		tabBarInactiveTintColor: COLORS.textLight,
		tabBarStyle: {
			height: scaleHeight(50) + insets.bottom,
			paddingTop: isTablet ? scaleHeight(8) : 0,
			backgroundColor: COLORS.surface,
			borderTopColor: COLORS.borderLight,
		},
		tabBarLabelStyle: {
			fontSize: isTablet ? FONT_SIZES.sm : FONT_SIZES.xs,
			marginTop: isTablet ? scaleHeight(10) : 0,
			fontWeight: '600' as const,
		},
	});

	// materialicons

	/**
	 * 반응형 태블릿 처리에 대한 Helper
	 * @param iconName
	 * @returns
	 */
	const getTabBarIcon = (iconType: Parameters<typeof IconComponent>[0]['type'], iconName: string) => {
		return ({ color, focused }: { color: string; size: number; focused: boolean }) => (
			<TabIconPop focused={focused}>
				<IconComponent
					type={iconType}
					name={iconName}
					size={scaledSize(24)}
					color={color}
					style={isTablet ? { marginTop: SPACING_H.xxl, height: scaleHeight(45), width: scaleWidth(16) } : undefined}
				/>
			</TabIconPop>
		);
	};
	return (
		<Tab.Navigator
			initialRouteName={Paths.HOME}
			screenOptions={{
				headerTitleAlign: 'center',
				tabBarLabelPosition: 'below-icon',
				...getScreenOptions(insets),
			}}>
			<Tab.Screen
				name={Paths.PROVERB_LIST}
				component={FreshProverbListScreen}
				options={{
					title: '속담 사전',
					tabBarLabel: '속담 사전',
					tabBarIcon: getTabBarIcon('materialicons', 'menu-book'),
					headerShown: false, // 헤더 숨김
				}}
			/>

			<Tab.Screen
				name={Paths.TODAY_QUIZ}
				component={FreshTodayQuizScreen}
				options={{
					title: '오늘의 퀴즈',
					tabBarLabel: '오늘의 퀴즈',
					headerShown: false, // 헤더 숨김
					tabBarIcon: getTabBarIcon('MaterialCommunityIcons', 'calendar-question'),
				}}
			/>

			<Tab.Screen
				name={Paths.HOME}
				component={FreshHome}
				options={{
					title: '홈',
					tabBarLabel: '홈',
					tabBarIcon: getTabBarIcon('materialicons', 'home'),
					headerShown: false, // 헤더 숨김
				}}
			/>

			<Tab.Screen
				name={Paths.MY_SCORE}
				component={FreshMyScoreScreen}
				options={{
					title: '나의 활동',
					tabBarLabel: '나의 활동',
					tabBarIcon: getTabBarIcon('materialicons', 'emoji-events'),
					headerShown: false, // 헤더 숨김
				}}
			/>

			<Tab.Screen
				name={Paths.SETTING}
				component={FreshSettingScreen}
				options={{
					title: '설정',
					tabBarLabel: '설정',
					tabBarIcon: getTabBarIcon('materialicons', 'settings'),
					headerShown: false, // 헤더 숨김
				}}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;
