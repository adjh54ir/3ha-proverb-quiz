/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, LayoutChangeEvent, StyleSheet, View } from 'react-native';
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
 * 배너 래퍼(absolute)가 화면 위에서 떨어진 거리.
 *
 * 상태바/노치는 이미 SafeAreaView(edges: top)가 밀어 준다 —
 * 안드로이드도 edge-to-edge(MainActivity.setDecorFitsSystemWindows(false))라 인셋이 항상 들어온다.
 * 예전에는 여기서 android 28 / ios 14 를 또 더해 배너 위아래로 죽은 공간이 생겼다.
 */
const AD_WRAPPER_TOP = SPACING_H.xs;

/** 배너 래퍼의 위/아래 안쪽 여백 (styles.adWrapperAbsolute.paddingVertical 과 동일해야 한다) */
const AD_WRAPPER_PADDING = SPACING_H.xs;

/** 배너 래퍼를 실측하기 전 한 프레임 동안 쓰는 값 (표준 앵커 배너 높이 + 래퍼 여백) */
const AD_FALLBACK_HEIGHT = scaleHeight(50) + AD_WRAPPER_PADDING * 2;

/**
 * 배너와 그 아래 콘텐츠 사이의 숨 쉴 틈 — 배너 하단 간격은 이 값 하나로만 조절한다.
 *
 * 실제로 배너 아래에 보이는 흰 여백은 `AD_WRAPPER_PADDING + AD_BOTTOM_GAP` 이다.
 * xl(20) 일 때는 래퍼 여백까지 더해 24dp 가 비어 광고와 본문 사이가 뚝 끊겨 보였다.
 * sm(8) 이면 합계 12dp — 경계는 남기고 죽은 공간만 덜어낸다.
 */
const AD_BOTTOM_GAP = SPACING_H.sm;

/**
 * 배너 영역의 실측값 묶음. 화면은 `contentTopOffset` 만 쓰고, 테스트는 이 값들로
 * "콘텐츠가 배너를 파고들지 않는다"를 검증한다.
 *
 * 인자는 래퍼(paddingVertical 포함)의 onLayout 실측 높이다. onSizeChange 가 알려주는
 * 광고 높이는 실제 렌더 높이와 어긋날 때가 있어(테스트 광고 등) 그만큼 하단 여백이 벌어졌다.
 */
export const AD_LAYOUT = {
	wrapperTop: AD_WRAPPER_TOP,
	wrapperPadding: AD_WRAPPER_PADDING,
	fallbackHeight: AD_FALLBACK_HEIGHT,
	bottomGap: AD_BOTTOM_GAP,
	/** 배너 래퍼의 아래쪽 끝 (컨테이너 상단 기준) */
	bannerBottom: (adBoxHeight: number) => AD_WRAPPER_TOP + (adBoxHeight || AD_FALLBACK_HEIGHT),
	/** 콘텐츠가 시작해야 하는 위치 */
	contentTopOffset: (adBoxHeight: number) => AD_WRAPPER_TOP + (adBoxHeight || AD_FALLBACK_HEIGHT) + AD_BOTTOM_GAP,
};

const AppLayout = () => {
	const themeMode = useThemeMode(); // 모드 변경 시 배경색 재계산
	const navigationRef = useRef<NavigationContainerRef<any>>(null);
	const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);
	// 배너 래퍼의 실측 높이(래퍼 여백 포함). 광고가 알려주는 높이 대신 래퍼를 그대로 재는 편이 정확하다.
	const [adBoxHeight, setAdBoxHeight] = useState(0);

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
		return AD_LAYOUT.contentTopOffset(adBoxHeight);
	}, [shouldShowAd, adBoxHeight]);

	// 배너를 숨긴 경로에서는 래퍼 높이가 0 이라 측정하지 않는다 (다시 보일 때 폴백으로 되돌아가지 않게)
	const handleAdBoxLayout = useCallback(
		(e: LayoutChangeEvent) => {
			if (shouldShowAd) {
				setAdBoxHeight(e.nativeEvent.layout.height);
			}
		},
		[shouldShowAd],
	);

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
					<View style={[styles.adWrapperAbsolute, !shouldShowAd && { height: 0, opacity: 0 }]} onLayout={handleAdBoxLayout}>
						<AdmobBannerAd visible={shouldShowAd} />
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
