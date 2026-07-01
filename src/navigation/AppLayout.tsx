/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaleHeight, scaleWidth } from '@/utils';
import DeviceInfo from 'react-native-device-info';
import StackNavigator from './StackNavigator';
import AdmobBannerAd from '@/screens/common/ads/AdmobBannerAd';
import BootSplash from 'react-native-bootsplash'; // 추가

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
	const navigationRef = useRef<NavigationContainerRef<any>>(null);
	const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);
	const { height: screenHeight } = Dimensions.get('window');

	const shouldShowAd = useMemo(() => AD_ALLOWED_ROUTES.includes(currentRoute as Paths), [currentRoute]);
	// const shouldShowAd = false

	// ✅ 라우트별 배경색 지정
	const backgroundColor = useMemo(() => {
		switch (currentRoute) {
			case Paths.SETTING:
				return '#f8f9fa';
			case Paths.MY_SCORE:
				return '#ffffff';
			case Paths.TODAY_QUIZ:
				return '#f8f9fa';
			case Paths.PROVERB_LIST:
				return '#f8f9fa';
			default:
				return '#ffffff'; // 기본값
		}
	}, [currentRoute]);

	/**
	 * 배너 높이에 따른 패딩 계산 함수
	 * @returns
	 */
	const getAdPaddingTop = () => {
		if (!shouldShowAd) {
			return 0;
		}

		// 테블릿인 경우
		if (DeviceInfo.isTablet()) {
			return scaleHeight(60); // 태블릿
		}
		if (Platform.OS === 'android') {
			return scaleHeight(50); // 안드로이드
		}
		if (screenHeight < DESIGN_HEIGHT) {
			return 40; // 작은 화면
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

	return (
		<NavigationContainer
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
						<AdmobBannerAd visible={shouldShowAd} paramMarginTop={0} paramMarginBottom={0} />
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

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	adWrapperAbsolute: {
		position: 'absolute',
		top: Platform.OS === 'android' ? scaleHeight(20) : scaleHeight(6),
		left: 0,
		right: 0,
		zIndex: 10,
		paddingVertical: scaleHeight(4),
		marginHorizontal: scaleWidth(16),
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
});

export default AppLayout;
