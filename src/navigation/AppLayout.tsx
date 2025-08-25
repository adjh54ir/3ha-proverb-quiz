import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import AdmobBannerAd from '@/screens/common/ads/AdmobBannerAd';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaleHeight } from '@/utils';
import StackNavigator from '@/navigation/StackNavigator';

const AD_ALLOWED_ROUTES = [
    Paths.TODAY_QUIZ,
    Paths.PROVERB_LIST,
    Paths.HOME,
    Paths.SETTING,
    Paths.MY_SCORE,
    // 필요하면 추가
];

const AppLayout = () => {
    const navigationRef = useRef<NavigationContainerRef<any>>(null);
    const [currentRoute, setCurrentRoute] = useState<string>(Paths.HOME);

    const shouldShowAd = useMemo(() => AD_ALLOWED_ROUTES.includes(currentRoute), [currentRoute]);

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
                    <View style={[styles.adWrapperAbsolute, !shouldShowAd && { height: 0, opacity: 0 }]}>
                        <AdmobBannerAd visible={shouldShowAd} />
                    </View>

                    <View style={{ marginBottom: Platform.OS === 'android' ? scaleHeight(36) : 0 }} />
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
        top: Platform.OS === 'android' ? scaleHeight(6) : 0,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    adWrapper: {
        paddingHorizontal: scaleHeight(10),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#transparent',
    },
    navigatorWrapper: {
        flex: 1,
    },
});

export default AppLayout;
