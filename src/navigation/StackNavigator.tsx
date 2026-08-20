import { createStackNavigator } from '@react-navigation/stack';

import { Paths } from '@/navigation/conf/Paths';
import SettingScreen from '@/screens/SettingScreen';
import FavoriteScreen from '@/screens/FavoriteScreen';
import MyProverbBook from '@/screens/MyProverbBook';
import MyProverbBookDetail from '@/screens/MyProverbBookDetail';
import Home from '@/screens/Home';
import BottomTabNavigator from './BottomTabNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import ProverbStudyScreen from '@/screens/ProverbStudyScreen';
import WrongReviewScreen from '@/screens/WrongReviewScreen';
import { scaledSize } from '@/utils';
import { COLORS, FONT_SIZES, SPACING_W } from '@/const/common/Theme';
import InitTimeChallengeScreen from '@/screens/InitTimeChallengeScreen';
import TimeChanllengeScreen from '@/screens/TimeChanllengeScreen';
import QuizModeScreen from '@/screens/QuizModeScreen';
import InitQuizModeScreen from '@/screens/InitQuizModeScreen';
import QuizScreen from '@/screens/QuizScreen';
import IconComponent from '@/screens/common/atomic/IconComponent';
import TowerChallengeScreen from '@/screens/TowerChallengeScreen';
import TowerQuizScreen from '@/screens/TowerQuizScreen';
import { withThemedScreen } from './withThemedScreen';
import { useThemeMode } from '@/hooks/useThemeMode';

/**
 * 화이트/다크 전환 시 각 화면만 새 팔레트로 다시 그린다.
 * 모듈 스코프에서 1회만 감싸야 한다(렌더마다 새 컴포넌트가 되면 무한 리마운트).
 */
const ThemedTimeChallenge = withThemedScreen(TimeChanllengeScreen);
const ThemedInitTimeChallenge = withThemedScreen(InitTimeChallengeScreen);
const ThemedQuiz = withThemedScreen(QuizScreen);
const ThemedInitQuizMode = withThemedScreen(InitQuizModeScreen);
const ThemedQuizMode = withThemedScreen(QuizModeScreen);
const ThemedProverbStudy = withThemedScreen(ProverbStudyScreen);
const ThemedWrongReview = withThemedScreen(WrongReviewScreen);
const ThemedTowerChallenge = withThemedScreen(TowerChallengeScreen);
const ThemedTowerQuiz = withThemedScreen(TowerQuizScreen);
const ThemedHome = withThemedScreen(Home);
const ThemedSetting = withThemedScreen(SettingScreen);
const ThemedFavorite = withThemedScreen(FavoriteScreen);
const ThemedMyProverbBook = withThemedScreen(MyProverbBook);
const ThemedMyProverbBookDetail = withThemedScreen(MyProverbBookDetail);

/**
 * Stack Navigator : 일반적인 화면만 출력을 하는 경우
 * @returns
 */
const StackNavigator = () => {
	useThemeMode(); // 모드 변경 시 헤더 색상 재적용
	const Stack = createStackNavigator(); // Stack Navigator 이름을 정의합니다.

	return (
		<Stack.Navigator
			screenOptions={{
				headerTitleAlign: 'center', // 타이틀 가운데 정렬
				headerStyle: {
					backgroundColor: COLORS.background,
				},
				headerTitleStyle: {
					fontSize: FONT_SIZES.xl,
					fontWeight: '700',
					color: COLORS.text,
				},
				headerShadowVisible: false,
			}}
			initialRouteName={Paths.MAIN_TAB}
			detachInactiveScreens={true}>
			<Stack.Screen
				name={Paths.MAIN_TAB}
				component={BottomTabNavigator}
				options={{ headerShown: false }} // 탭 화면은 헤더 숨김
			/>
			<Stack.Screen
				name={Paths.TIME_CHANLLENGE}
				component={ThemedTimeChallenge}
				options={({ navigation }) => ({
					headerShown: false,
					title: '타임 챌린지',
					headerLeft: () => <></>,
				})}
			/>
			<Stack.Screen
				name={Paths.INIT_TIME_CHANLLENGE}
				component={ThemedInitTimeChallenge}
				options={({ navigation }) => ({
					headerShown: true,
					title: '타임 챌린지',
					headerLeft: () => <></>,
					// headerLeft: () => (
					// 	<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: SPACING_W.lg }}>
					// 		<IconComponent type="MaterialIcons" name="arrow-back" size={scaledSize(24)} color="#2c3e50" />
					// 	</TouchableOpacity>
					// ),
				})}
			/>

			<Stack.Screen
				name={Paths.QUIZ}
				component={ThemedQuiz}
				options={({ navigation }) => ({
					headerShown: false,
					title: '속담 찾기',
					headerLeft: () => <></>,
				})}
			/>

			<Stack.Screen
				name={Paths.PROVERB_QUIZ_MODE_SELECT}
				component={ThemedInitQuizMode}
				options={({ navigation }) => ({
					headerShown: true,
					title: '퀴즈 모드 선택',
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => navigation.goBack()}
							style={{ marginLeft: SPACING_W.lg }}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
							<Icon name="arrow-back" size={scaledSize(24)} color={COLORS.textStrong} />
						</TouchableOpacity>
					),
					headerRight: () => <></>,
					// headerRight: () => (
					// 	//@ts-ignore
					// 	<TouchableOpacity onPress={() => navigation.navigate(Paths.HOME, { showGuide: true })} style={{ marginRight: SPACING_W.lg }}>
					// 		<IconComponent type='materialIcons' name='info-outline' size={scaledSize(24)} color='#3498db' />
					// 	</TouchableOpacity>
					// ),
				})}
			/>

			<Stack.Screen
				name={Paths.QUIZ_MODE}
				component={ThemedQuizMode}
				options={({ navigation }) => ({
					headerShown: false,
					gestureEnabled: false, // ✅ 제스처로 뒤로 가기 방지
					title: '카테고리 선택',
					headerLeft: () => <></>,
				})}
			/>
			<Stack.Screen
				name={Paths.PROVERB_STUDY}
				component={ThemedProverbStudy}
				options={({ navigation }) => ({
					headerShown: false,
					title: '속담 학습',
					headerLeft: () => (
						<></>
						// <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: SPACING_W.lg }}>
						// 	<Icon name='arrow-back' size={24} color='#2c3e50' />
						// </TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name={Paths.QUIZ_WRONG_REVIEW}
				component={ThemedWrongReview}
				options={({ navigation }) => ({
					headerShown: true,
					title: '오답 복습',
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => navigation.goBack()}
							style={{ marginLeft: SPACING_W.lg }}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
							<Icon name="arrow-back" size={scaledSize(24)} color={COLORS.textStrong} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name={Paths.TOWER_CHANLLENGE}
				component={ThemedTowerChallenge}
				options={({ navigation }) => ({
					headerShown: false,
					title: '타워 챌린지',
					gestureEnabled: false, // ✅ 제스처로 뒤로 가기 방지
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => navigation.goBack()}
							style={{ marginLeft: SPACING_W.lg }}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
							<IconComponent type="MaterialIcons" name="arrow-back" size={scaledSize(24)} color={COLORS.textStrong} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name={Paths.TOWER_QUIZ}
				component={ThemedTowerQuiz}
				options={({ navigation }) => ({
					headerShown: false,
					title: '타워퀴즈',
					gestureEnabled: false, // ✅ 제스처로 뒤로 가기 방지
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => navigation.goBack()}
							style={{ marginLeft: SPACING_W.lg }}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
							<IconComponent type="MaterialIcons" name="arrow-back" size={scaledSize(24)} color={COLORS.textStrong} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen name={Paths.HOME} component={ThemedHome} />
			<Stack.Screen name={Paths.SETTING} component={ThemedSetting} />
			<Stack.Screen name={Paths.FAVORITE} component={ThemedFavorite} options={{ headerShown: false }} />
			<Stack.Screen name={Paths.MY_PROVERB_BOOK} component={ThemedMyProverbBook} options={{ headerShown: false }} />
			<Stack.Screen name={Paths.MY_PROVERB_BOOK_DETAIL} component={ThemedMyProverbBookDetail} options={{ headerShown: false }} />
		</Stack.Navigator>
	);
};
export default StackNavigator;
