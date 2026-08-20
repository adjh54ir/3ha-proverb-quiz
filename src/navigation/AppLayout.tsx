/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, NavigationContainerRef, Theme } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaleHeight } from '@/utils';
import { COLORS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import DeviceInfo from 'react-native-device-info';
import StackNavigator from './StackNavigator';
import AdmobBannerAd from '@/screens/common/ads/AdmobBannerAd';
import BootSplash from 'react-native-bootsplash'; // 추가
import notifee, { EventType } from '@notifee/react-native';
import { takePendingRoute } from '@/utils/PendingNotification';
import { useThemeMode } from '@/hooks/useThemeMode';

const AD_ALLOWED_ROUTES = [
	Paths.TODAY_QUIZ,
	Paths.PROVERB_LIST,
	Paths.HOME,
	Paths.SETTING,
	Paths.MY_SCORE,
	Paths.FAVORITE,
	Paths.MY_PROVERB_BOOK,
	Paths.MY_PROVERB_BOOK_DETAIL
	// 필요하면 추가
];

const DESIGN_HEIGHT = 812;
const AppLayout = () => {
	const themeMode = useThemeMode(); // 모드 변경 시 배경색 재계산
	const navigationRef = useRef<NavigationContainerRef<any>>(null);
	const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);
	const [bannerHeight, setBannerHeight] = useState(0);
	const { height: screenHeight } = useWindowDimensions();

	const shouldShowAd = useMemo(() => AD_ALLOWED_ROUTES.includes(currentRoute as Paths), [currentRoute]);
	// const shouldShowAd = false

	// ✅ 라우트별 배경색 지정
	const backgroundColor = useMemo(() => {
		switch (currentRoute) {
			case Paths.SETTING:
				return COLORS.background;
			case Paths.MY_SCORE:
				return COLORS.surface;
			case Paths.TODAY_QUIZ:
				return COLORS.background;
			case Paths.PROVERB_LIST:
				return COLORS.background;
			default:
				return COLORS.surface; // 기본값
		}
		// themeMode 가 바뀌면 COLORS 가 다른 팔레트를 가리키므로 다시 계산해야 한다.
	}, [currentRoute, themeMode]);

	/**
	 * 배너 높이에 따른 패딩 계산 함수
	 * @returns
	 */
	const getAdPaddingTop = () => {
		if (!shouldShowAd) {
			return 0;
		}

		// ponytail: 태블릿만 배너 실측 높이 사용. adaptive 배너 높이가 기기별 50~90dp로 갈려 고정값이 안 맞음.
		//           폰은 adaptive가 사실상 50dp 고정이라 기존 튜닝값 유지.
		if (DeviceInfo.isTablet()) {
			return bannerHeight || scaleHeight(60); // 태블릿 (로드 전엔 기존값)
		}
		if (Platform.OS === 'android') {
			return scaleHeight(50); // 안드로이드
		}
		if (screenHeight < DESIGN_HEIGHT) {
			return scaleHeight(40); // 작은 화면
		}
		return 0; // 기본
	};

	// 👇 광고 유무 + 플랫폼별 패딩 계산 함수
	const getNavigatorPaddingTop = (shouldShowAd: boolean): number => {
		// [CASE1] 광고가 있는 경우
		if (shouldShowAd) {
			switch (Platform.OS) {
				case 'android':
					return scaleHeight(20);
				case 'ios':
					return scaleHeight(12);
				default:
					return 0;
			}
		}
		// [CASE2] 광고가 없는 경우
		else {
			const isAdAllowed = AD_ALLOWED_ROUTES.includes(currentRoute as Paths);
			// 광고가 없고 허용된 경로일 때만 패딩 적용
			if (isAdAllowed) {
				switch (Platform.OS) {
					case 'android':
						return scaleHeight(40);
					case 'ios':
						return scaleHeight(0);
					default:
						return 0;
				}
			}
		}
		return 0;
	};

	const handleBannerHeight = useCallback((height: number) => setBannerHeight(height), []);

	/**
	 * 알림 탭 → 지정 화면 이동.
	 *
	 * 화면(Home)에 두면 그 화면이 마운트돼 있을 때만 동작해서, 퀴즈 중에 알림을 누르면
	 * 아무 일도 일어나지 않는다. 네비게이션 컨테이너를 들고 있는 여기(앱 루트)에서 처리한다.
	 */
	useEffect(() => {
		const goTo = (screen?: unknown) => {
			if (typeof screen === 'string' && screen.length > 0) {
				navigationRef.current?.navigate(screen as never);
			}
		};

		// 앱이 떠 있는 동안 누른 경우
		const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
			if (type === EventType.PRESS) {
				goTo(detail.notification?.data?.moveToScreen);
			}
		});

		// 앱이 완전히 종료된 상태에서 누른 경우 (네비게이터 준비 후 이동)
		notifee.getInitialNotification().then((initial) => {
			if (!initial) {
				return;
			}
			const screen = initial.notification?.data?.moveToScreen;
			if (navigationRef.current?.isReady()) {
				goTo(screen);
			} else {
				// onReady 전이면 한 틱 뒤에 다시 시도한다
				setTimeout(() => goTo(screen), 0);
			}
		});

		/**
		 * 백그라운드에서 누른 알림은 index.js 의 백그라운드 핸들러가 이동 대상만 적어둔다.
		 * 앱이 활성화되는 시점에 꺼내서 이동시킨다(첫 진입 + 이후 복귀 모두).
		 */
		const consumePending = () => {
			takePendingRoute().then((screen) => screen && goTo(screen));
		};
		consumePending();
		const appStateSub = AppState.addEventListener('change', (state) => {
			if (state === 'active') {
				consumePending();
			}
		});

		return () => {
			unsubscribe();
			appStateSub.remove();
		};
	}, []);

	/**
	 * 네비게이션 자체 테마.
	 * 지정하지 않으면 화면 전환 카드/헤더 뒤 기본 배경이 라이트(회백색)로 남아
	 * 다크모드에서 전환 중 흰 배경이 번쩍인다.
	 */
	const navigationTheme = useMemo<Theme>(() => {
		const base = themeMode === 'dark' ? DarkTheme : DefaultTheme;
		return {
			...base,
			colors: {
				...base.colors,
				primary: COLORS.primary,
				background: COLORS.background,
				card: COLORS.surface,
				text: COLORS.text,
				border: COLORS.border,
				notification: COLORS.danger,
			},
		};
	}, [themeMode]);

	return (
		<NavigationContainer
			theme={navigationTheme}
			ref={navigationRef}
			onReady={() => {
				setCurrentRoute(navigationRef.current?.getCurrentRoute()?.name || '');
				BootSplash.hide({ fade: true }); // 추가
			}}
			onStateChange={() => {
				const routeName = navigationRef.current?.getCurrentRoute()?.name;
				if (routeName) {
					setCurrentRoute(routeName);
				}
			}}>
			<SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={shouldShowAd ? ['top'] : []}>
				<View style={styles.container}>
					<View style={[styles.adWrapperAbsolute, !shouldShowAd && { height: 0, opacity: 0 }]}>
						<AdmobBannerAd visible={shouldShowAd} paramMarginTop={0} paramMarginBottom={0} onHeightChange={handleBannerHeight} />
					</View>
					{shouldShowAd && <View style={{ paddingTop: getAdPaddingTop() }} />}
					<View style={[styles.navigatorWrapper, { paddingTop: getNavigatorPaddingTop(shouldShowAd), backgroundColor }]}>
						<StackNavigator />
					</View>
				</View>
			</SafeAreaView>
		</NavigationContainer>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.surface,
	},
	adWrapperAbsolute: {
		position: 'absolute',
		top: Platform.OS === 'android' ? scaleHeight(20) : scaleHeight(6),
		left: 0,
		right: 0,
		zIndex: 10,
		paddingVertical: SPACING_H.xs,
		marginHorizontal: SPACING_W.lg,
		alignItems: 'center',
		// borderWidth: 1,
		// borderColor: '#bdc3c7',
		// borderRadius: scaleWidth(6),
	},
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	navigatorWrapper: {
		flex: 1,
	},
}));

export default AppLayout;
