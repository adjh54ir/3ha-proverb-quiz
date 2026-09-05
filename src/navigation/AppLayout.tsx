/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Dimensions, Platform, StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, NavigationContainerRef, Theme } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, isTablet, scaleHeight } from '@/utils';
import { COLORS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import StackNavigator from './StackNavigator';
import AdmobBannerAd from '@/screens/common/ads/AdmobBannerAd';
import BootSplash from 'react-native-bootsplash'; // 추가
import notifee, { EventType } from '@notifee/react-native';
import { takePendingRoute } from '@/utils/PendingNotification';
import { useThemeMode } from '@/hooks/useThemeMode';
import { AppAlertHost } from '@/screens/common/modal/AppAlert';

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

/**
 * 태블릿에서 앵커드 어댑티브 배너가 실제로 차지하는 높이(dp).
 *
 * 구글은 기기의 세로 길이로 배너 높이를 정한다(720dp 초과 = 90dp). 태블릿은 항상 이 구간이라
 * 값이 고정이다. scaleHeight 로 계산하면 배율 상한(MAX_SCALE)에 걸려 배너보다 작은 여백이
 * 나와 본문이 배너에 가린다. 그래서 실측값을 그대로 쓴다.
 */
const TABLET_BANNER_HEIGHT = 90;

const AppLayout = () => {
	const themeMode = useThemeMode(); // 모드 변경 시 배경색 재계산
	const navigationRef = useRef<NavigationContainerRef<any>>(null);
	const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);
	const { height: screenHeight } = Dimensions.get('window');

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

	const getAdPaddingTop = () => {
		if (!shouldShowAd) {
			return 0;
		}
		if (isTablet) {
			return TABLET_BANNER_HEIGHT + SPACING_H.sm;
		}
		if (Platform.OS === 'android') {
			return scaleHeight(50);
		}
		if (screenHeight < DESIGN_HEIGHT) {
			return 40;
		}
		return 0;
	};

	const getNavigatorPaddingTop = (shouldShowAd: boolean): number => {
		if (shouldShowAd) {
			// 배너와 본문이 맞붙어 보이지 않게 한 칸 띄운다 — 배너는 absolute 라 본문이 직접 밀어내지 못한다.
			return SPACING_H.xxl;
		} else {
			const isAdAllowed = AD_ALLOWED_ROUTES.includes(currentRoute as Paths);
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
				<View style={[styles.container, { backgroundColor }]}>
					{/*
						배너는 본문 기둥(CONTENT_MAX_WIDTH)에 맞추지 않는다.
						앵커드 어댑티브 배너의 네이티브 뷰는 컨테이너가 아니라 '기기 폭'으로 크기를 정해
						래퍼를 씌워도 그대로 삐져나온다. 좁히면 더 작은 광고 규격이 잡혀 손해만 본다.
					*/}
					<View style={[styles.adWrapperAbsolute, !shouldShowAd && { height: 0, opacity: 0 }]}>
						<AdmobBannerAd visible={shouldShowAd} paramMarginTop={0} paramMarginBottom={0} />
					</View>
					{shouldShowAd && <View style={{ paddingTop: getAdPaddingTop() }} />}
					<View style={[styles.navigatorWrapper, { paddingTop: getNavigatorPaddingTop(shouldShowAd), backgroundColor }]}>
						<StackNavigator />
					</View>
				</View>
			</SafeAreaView>
			{/* 앱 테마를 따르는 공용 알림창. 화면이 바뀌어도 살아 있도록 루트에 한 번만 둔다. */}
			<AppAlertHost />
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
	},
	container: {
		flex: 1,
	},
	navigatorWrapper: {
		flex: 1,
		// 태블릿에서 화면 폭을 다 쓰면 한 줄이 지나치게 길고 카드가 늘어져 읽기 어렵다.
		// 본문을 가운데 기둥으로 묶고 남는 좌우는 배경색으로 둔다.
		// 폰은 화면 폭이 CONTENT_MAX_WIDTH 보다 좁아 아무 영향이 없다.
		width: '100%',
		maxWidth: CONTENT_MAX_WIDTH,
		alignSelf: 'center',
	},
}));

export default AppLayout;
