/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, NavigationContainerRef, Theme } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaleHeight } from '@/utils';
import { COLORS, SPACING_H, themedStyles } from '@/const/common/Theme';
import DeviceInfo from 'react-native-device-info';
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
 * 배너와 화면 콘텐츠 사이 숨 쉴 공간. 배너 래퍼가 absolute 라 이 값이 실제 하단 여백이 된다.
 * xs(4) 는 배너와 콘텐츠가 붙어 보여 광고와 화면의 경계가 흐렸다 — 한 단계 올린다.
 */
const AD_BOTTOM_GAP = SPACING_H.sm;
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

		// adaptive 배너 높이는 기기별로 50~90dp까지 갈린다. 고정값을 쓰면 어떤 기기에선 남고
		// 어떤 기기에선 모자라 배너가 화면을 덮는다 — 실측 높이가 오면 그 값을 그대로 쓴다.
		if (DeviceInfo.isTablet()) {
			return bannerHeight || scaleHeight(60); // 태블릿 (로드 전엔 기존값)
		}
		if (Platform.OS === 'android') {
			return bannerHeight || scaleHeight(50); // 안드로이드 폰 (로드 전엔 기존값)
		}
		// iOS 는 배너를 상단 세이프에어리어(노치) 영역에 얹는 구조라 실측 높이를 그대로 더하면
		// 여백이 두 번 들어간다. 폴백보다 실제 배너가 더 클 때만 그 차이를 반영한다.
		if (bannerHeight) {
			const iosFallback = screenHeight < DESIGN_HEIGHT ? scaleHeight(40) : 0;
			return Math.max(iosFallback, bannerHeight - scaleHeight(50));
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
			// 배너 바로 아래에 화면이 붙지 않도록 여백을 둔다
			switch (Platform.OS) {
				case 'android':
					return scaleHeight(38) + AD_BOTTOM_GAP;
				case 'ios':
					return scaleHeight(32) + AD_BOTTOM_GAP;
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
		// 배너가 화면 상단에 바짝 붙어 보이던 문제 — 화면 기준으로 더 띄운다
		top: Platform.OS === 'android' ? scaleHeight(28) : scaleHeight(14),
		left: 0,
		right: 0,
		zIndex: 10,
		paddingVertical: SPACING_H.xs,
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
