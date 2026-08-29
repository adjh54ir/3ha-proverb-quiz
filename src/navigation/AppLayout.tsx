/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, NavigationContainerRef, Theme } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaleHeight } from '@/utils';
import { COLORS, SPACING_H, themedStyles } from '@/const/common/Theme';
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

/**
 * 배너 래퍼(absolute)가 화면 상단에서 떨어지는 거리. 스타일과 오프셋 계산이 같은 값을 봐야 하므로
 * 상수로 빼서 한 곳에서만 정의한다.
 */
const AD_WRAPPER_TOP = Platform.OS === 'android' ? scaleHeight(28) : scaleHeight(14);

/** 배너 래퍼의 위/아래 안쪽 여백 (styles.adWrapperAbsolute.paddingVertical 과 동일해야 한다) */
const AD_WRAPPER_PADDING = SPACING_H.xs;

/** onSizeChange 로 실측 높이가 오기 전에 쓸 임시 높이 (adaptive 배너 최소치) */
const AD_FALLBACK_HEIGHT = scaleHeight(50);

/**
 * 배너와 화면 콘텐츠 사이 숨 쉴 공간. 배너 래퍼가 absolute 라 이 값이 실제 하단 여백이 된다.
 * xs(4) → sm(8) 로도 배너와 콘텐츠가 붙어 보였다. xl(20) 로 광고와 화면의 경계를 확실히 띄운다.
 * (플랫폼별 고정값을 쓰던 시절 안드로이드에서 우연히 나오던 18~23dp 여백보다 좁아지지 않는 값)
 */
const AD_BOTTOM_GAP = SPACING_H.xl;

/**
 * 배너 영역의 실측값 묶음. 화면은 `contentTopOffset` 만 쓰고, 테스트는 이 값들로
 * "콘텐츠가 배너를 파고들지 않는다"를 검증한다.
 */
export const AD_LAYOUT = {
	wrapperTop: AD_WRAPPER_TOP,
	wrapperPadding: AD_WRAPPER_PADDING,
	fallbackHeight: AD_FALLBACK_HEIGHT,
	bottomGap: AD_BOTTOM_GAP,
	/** 배너 래퍼의 아래쪽 끝 (컨테이너 상단 기준) */
	bannerBottom: (bannerHeight: number) =>
		AD_WRAPPER_TOP + AD_WRAPPER_PADDING + (bannerHeight || AD_FALLBACK_HEIGHT) + AD_WRAPPER_PADDING,
	/** 콘텐츠가 시작해야 하는 위치 */
	contentTopOffset: (bannerHeight: number) =>
		AD_WRAPPER_TOP + AD_WRAPPER_PADDING * 2 + (bannerHeight || AD_FALLBACK_HEIGHT) + AD_BOTTOM_GAP,
};

const AppLayout = () => {
	const themeMode = useThemeMode(); // 모드 변경 시 배경색 재계산
	const navigationRef = useRef<NavigationContainerRef<any>>(null);
	const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);
	const [bannerHeight, setBannerHeight] = useState(0);

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
	 * 배너 아래에서 콘텐츠가 시작해야 하는 위치.
	 *
	 * 예전에는 플랫폼·태블릿별 고정값을 더해 맞췄는데, adaptive 배너 높이가 기기마다 50~90dp 로
	 * 갈리는 탓에 어떤 기기에선 여백이 남고 어떤 기기에선 콘텐츠가 배너를 파고들었다
	 * (iPhone 14/15/16 계열에서 약 20dp 겹침). 실측 높이 하나로 계산하면 분기 없이 항상 맞는다.
	 */
	const contentTopOffset = useMemo(() => {
		if (!shouldShowAd) {
			return 0;
		}
		return AD_LAYOUT.contentTopOffset(bannerHeight);
	}, [shouldShowAd, bannerHeight]);

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
						<AdmobBannerAd visible={shouldShowAd} onHeightChange={handleBannerHeight} />
					</View>
					<View style={[styles.navigatorWrapper, { paddingTop: contentTopOffset, backgroundColor }]}>
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
		top: AD_WRAPPER_TOP,
		left: 0,
		right: 0,
		zIndex: 10,
		paddingVertical: AD_WRAPPER_PADDING,
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
