import { createStackNavigator } from '@react-navigation/stack';

import { Paths } from '@/navigation/conf/Paths';
import FavoriteScreen from '@/screens/FavoriteScreen';
import MyProverbBook from '@/screens/MyProverbBook';
import MyProverbBookDetail from '@/screens/MyProverbBookDetail';
import BottomTabNavigator from './BottomTabNavigator';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import ProverbStudyScreen from '@/screens/ProverbStudyScreen';
import WrongReviewScreen from '@/screens/WrongReviewScreen';
import { scaledSize } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, SPACING_W } from '@/const/common/Theme';
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
 * 헤더 좌측 뒤로가기 버튼 — 화면마다 똑같이 반복되던 블록을 한 곳으로 모았다.
 * (터치 반경/여백/아이콘 색이 화면마다 어긋나지 않도록)
 */
const headerBackButton = (navigation: { goBack: () => void }) => () => (
	<TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack} hitSlop={HIT_SLOP}>
		<IconComponent type="MaterialIcons" name="arrow-back" size={scaledSize(24)} color={COLORS.textStrong} />
	</TouchableOpacity>
);

/** 헤더 좌/우를 비워 둘 때 (버튼 자리만 없앤다) */
const headerEmpty = () => <></>;

const styles = StyleSheet.create({
	headerBack: { marginLeft: SPACING_W.lg },
});

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
				options={{
					headerShown: false,
					title: '타임 챌린지',
					headerLeft: headerEmpty,
				}}
			/>
			<Stack.Screen
				name={Paths.INIT_TIME_CHANLLENGE}
				component={ThemedInitTimeChallenge}
				options={{
					headerShown: true,
					title: '타임 챌린지',
					headerLeft: headerEmpty,
				}}
			/>

			<Stack.Screen
				name={Paths.QUIZ}
				component={ThemedQuiz}
				options={{
					headerShown: false,
					title: '속담 찾기',
					headerLeft: headerEmpty,
				}}
			/>

			<Stack.Screen
				name={Paths.PROVERB_QUIZ_MODE_SELECT}
				component={ThemedInitQuizMode}
				options={({ navigation }) => ({
					headerShown: true,
					title: '퀴즈 모드 선택',
					headerLeft: headerBackButton(navigation),
					headerRight: headerEmpty,
				})}
			/>

			<Stack.Screen
				name={Paths.QUIZ_MODE}
				component={ThemedQuizMode}
				options={{
					headerShown: false,
					gestureEnabled: false, // ✅ 제스처로 뒤로 가기 방지
					title: '카테고리 선택',
					headerLeft: headerEmpty,
				}}
			/>
			<Stack.Screen
				name={Paths.PROVERB_STUDY}
				component={ThemedProverbStudy}
				options={{
					headerShown: false,
					title: '속담 학습',
					headerLeft: headerEmpty,
				}}
			/>
			<Stack.Screen
				name={Paths.QUIZ_WRONG_REVIEW}
				component={ThemedWrongReview}
				options={({ navigation }) => ({
					headerShown: true,
					title: '오답 복습',
					headerLeft: headerBackButton(navigation),
				})}
			/>
			<Stack.Screen
				name={Paths.TOWER_CHANLLENGE}
				component={ThemedTowerChallenge}
				options={({ navigation }) => ({
					headerShown: false,
					title: '타워 챌린지',
					gestureEnabled: false, // ✅ 제스처로 뒤로 가기 방지
					headerLeft: headerBackButton(navigation),
				})}
			/>
			<Stack.Screen
				name={Paths.TOWER_QUIZ}
				component={ThemedTowerQuiz}
				options={({ navigation }) => ({
					headerShown: false,
					title: '타워퀴즈',
					gestureEnabled: false, // ✅ 제스처로 뒤로 가기 방지
					headerLeft: headerBackButton(navigation),
				})}
			/>
			{/*
			  ⚠️ HOME / SETTING 은 여기에 등록하지 않는다.
			  두 화면은 BottomTabNavigator 소유다(탭 바와 함께, withFreshMount 로 감싸져
			  탭을 누를 때마다 상태가 초기화된다). 스택에도 같은 이름으로 등록해 두면
			  navigate(Paths.HOME) 한 번으로 탭 바도 없고 초기화도 안 되는 '두 번째 홈'이
			  스택 위에 쌓인다. 이동은 항상 navigate(Paths.MAIN_TAB, { screen: Paths.HOME }) 로 한다.
			*/}
			<Stack.Screen name={Paths.FAVORITE} component={ThemedFavorite} options={{ headerShown: false }} />
			<Stack.Screen name={Paths.MY_PROVERB_BOOK} component={ThemedMyProverbBook} options={{ headerShown: false }} />
			<Stack.Screen name={Paths.MY_PROVERB_BOOK_DETAIL} component={ThemedMyProverbBookDetail} options={{ headerShown: false }} />
		</Stack.Navigator>
	);
};
export default StackNavigator;
