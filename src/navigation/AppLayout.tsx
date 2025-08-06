import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import AdmobBannerAd from '@/screens/common/ads/AdmobBannerAd';
import BottomTabNavigator from '@/navigation/BottomTabNavigator';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaleHeight } from '@/utils';
import StackNavigator from './StackNavigator';

const AD_ALLOWED_ROUTES = [
    Paths.TODAY_QUIZ,
    Paths.PROVERB_LIST,
    Paths.SETTING,
    Paths.MY_SCORE,
    // 필요하면 추가
];

const AppLayout = () => {
    const navigationRef = useRef<NavigationContainerRef<any>>(null);
    const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);

    const shouldShowAd = AD_ALLOWED_ROUTES.includes(currentRoute);

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
            }}
        >
            <SafeAreaView
                style={styles.safeArea}
                edges={shouldShowAd ? ['top'] : []}
            >
                <View style={styles.container}>
                    {shouldShowAd && (
                        <View style={styles.adWrapperAbsolute}>
                            <AdmobBannerAd paramMarginTop={10} paramMarginBottom={5} />
                        </View>
                    )}

                    {/* 하단 콘텐츠 */}
                    <StackNavigator />
                </View>
            </SafeAreaView>
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
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        justifyContent: "center",
        alignItems: 'center',
        backgroundColor: 'transparent', // ← 이 부분 수정
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: scaleHeight(-4)
    },
    adWrapper: {
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    navigatorWrapper: {
        flex: 1,
    },
});

export default AppLayout;