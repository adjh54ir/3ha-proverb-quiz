/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaleHeight, scaleWidth } from '@/utils';
import BottomTabNavigator from './BottomTabNavigator';
import AdmobBannerAd from '@/screens/common/ads/AdmobBannerAd';
import StackNavigator from './StackNavigator';
import DeviceInfo from 'react-native-device-info';

const AD_ALLOWED_ROUTES = [
    Paths.TODAY_QUIZ,
    Paths.PROVERB_LIST,
    Paths.HOME,
    Paths.SETTING,
    Paths.MY_SCORE,
    // 필요하면 추가
];

const SDK_KEY = 'YOUR_SDK_KEY';
const BANNER_AD_UNIT_ID = 'YOUR_BANNER_AD_UNIT_ID';

const AppLayout = () => {
    const navigationRef = useRef<NavigationContainerRef<any>>(null);
    const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);

    const shouldShowAd = useMemo(() => AD_ALLOWED_ROUTES.includes(currentRoute), [currentRoute]);

    // useEffect(() => {
    // 	AppLovinMAX.initialize(SDK_KEY)
    // 		.then((config: Configuration) => {
    // 			console.log('✅ AppLovin MAX Initialized', config);
    // 			// 테스트 모드 ON (테스트 광고 강제 노출)
    // 			// AppLovinMAX.showMediationDebugger(); // ✅ 강제로 광고 네트워크/테스트 광고 확인
    // 		})
    // 		.catch((error) => {
    // 			console.error('AppLovin MAX 초기화 실패:', error);
    // 		});
    // }, []);

    // ✅ 라우트별 배경색 지정
    const backgroundColor = useMemo(() => {
        switch (currentRoute) {
            case Paths.SETTING:
                return '#f9f9f9';
            case Paths.MY_SCORE:
                return '#ffffff';
            case Paths.TODAY_QUIZ:
                return '#f5f5f5';
            case Paths.PROVERB_LIST:
                return '#f8f9fa';
            default:
                return '#ffffff'; // 기본값
        }
    }, [currentRoute]);

    return (
        <NavigationContainer
            ref={navigationRef}
            onReady={() => {
                setCurrentRoute(navigationRef.current?.getCurrentRoute()?.name || '');
            }}
            onStateChange={() => {
                const routeName = navigationRef.current?.getCurrentRoute()?.name;
                if (routeName) {
                    setCurrentRoute(routeName);
                }
            }}>
            <StackNavigator></StackNavigator>

            {/* <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={shouldShowAd ? ['top'] : []}>

                <StackNavigator />
                <View style={styles.container}>
                    <View style={[styles.adWrapperAbsolute, !shouldShowAd && { height: 0, opacity: 0 }]}>
                        <AdmobBannerAd visible={shouldShowAd} />
                    </View>
                    {shouldShowAd ? (
                        <View
                            style={{
                                marginBottom: DeviceInfo.isTablet() // ✅ 테블릿이면 40
                                    ? scaleHeight(40)
                                    : Platform.OS === 'android' // ✅ 그 외 Android면 30
                                        ? scaleHeight(30)
                                        : scaleHeight(0), // ✅ iOS 기본값
                            }}
                        />
                    ) : (
                        <></>
                    )}
                    <View
                        style={[
                            styles.navigatorWrapper,
                            shouldShowAd && { paddingTop: Platform.OS === 'android' ? scaleHeight(50) : scaleHeight(25) },
                            { backgroundColor },
                        ]}>
                        <StackNavigator />
                    </View>
                </View>
            </SafeAreaView> */}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
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
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
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
