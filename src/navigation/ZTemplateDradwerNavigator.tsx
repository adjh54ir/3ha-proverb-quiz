import React, { useCallback, useEffect } from "react";
import { Text, TouchableOpacity } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Paths } from "./conf/Paths";
import DrawerContentScreen from "./screens/DrawerContentScreen";
import Icon from "react-native-vector-icons/MaterialIcons";
import RefrenceScreen from "@/screens/common/refrence/RefrenceScreen";
import NotifeeExample from "@/screens/common/refrence/NotificationScreen";
import AdvertisementScreens from "@/screens/common/refrence/AdvertisementScreens";
import PermissionScreens from "@/screens/common/refrence/PermissionScreens";
import LanguageScreen from "@/screens/common/refrence/LanguageScreen";

/**
 * Drawer Navigator : 왼쪽/오른쪽 Aside 메뉴를 구성합니다.
 * @returns
 */
const ZTemplateDradwerNavigator = () => {
    const Drawer = createDrawerNavigator();
    /**
     *
     */
    useEffect(() => {
        console.log("[+] DrawerNavigator");
    }, []);

    // 새로고침 버튼 컴포넌트
    const RefreshButton = ({ navigation, routeName }) => {
        return (
            <TouchableOpacity
                onPress={() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: routeName }],
                    });
                }}
                style={{ marginRight: 15 }}
            >
                <Icon name="refresh" size={24} color="#000" />
            </TouchableOpacity>
        );
    };

    return (
        <Drawer.Navigator
            initialRouteName={Paths.MAIN_REFRENCE}
            backBehavior="history"
            drawerContent={(props: any) => <DrawerContentScreen {...props} />}
            screenOptions={{
                drawerPosition: "left",
            }}
        >
            {/* 메인 화면 */}
            <Drawer.Screen
                name={Paths.MAIN_REFRENCE}
                component={RefrenceScreen}
                options={({ navigation }) => ({
                    title: "예시 화면",
                    drawerLabel: "예시 화면",
                    headerRight: () => (
                        <RefreshButton navigation={navigation} routeName={Paths.MAIN_REFRENCE} />
                    ),
                })}
            />

            {/* 알림 화면 */}
            <Drawer.Screen
                name={Paths.FN_NOTIFICATION}
                component={NotifeeExample}
                options={({ navigation }) => ({
                    title: "알람 기능 사용예시",
                    drawerLabel: "알람 기능 사용예시",
                    headerRight: () => (
                        <RefreshButton
                            navigation={navigation}
                            routeName={Paths.FN_NOTIFICATION}
                        />
                    ),
                })}
            />

            {/* 광고 화면 */}
            <Drawer.Screen
                name={Paths.FN_ADVERTISEMENT}
                component={AdvertisementScreens}
                options={({ navigation }) => ({
                    title: "광고 기능 사용예시",
                    drawerLabel: "광고 기능 사용예시",
                    headerRight: () => (
                        <RefreshButton
                            navigation={navigation}
                            routeName={Paths.FN_ADVERTISEMENT}
                        />
                    ),
                })}
            />

            {/* 광고 화면 */}
            <Drawer.Screen
                name={Paths.FN_PERMISSION}
                component={PermissionScreens}
                options={({ navigation }) => ({
                    title: "권한 기능 사용예시",
                    drawerLabel: "권한 기능 사용예시",
                    headerRight: () => (
                        <RefreshButton
                            navigation={navigation}
                            routeName={Paths.FN_PERMISSION}
                        />
                    ),
                })}
            />

            {/* 다국어 사용예시*/}
            <Drawer.Screen
                name={Paths.FN_LANGUAGE}
                component={LanguageScreen}
                options={({ navigation }) => ({
                    title: "다국어 사용예시",
                    drawerLabel: "다국어 사용예시",
                    headerRight: () => (
                        <RefreshButton
                            navigation={navigation}
                            routeName={Paths.FN_LANGUAGE}
                        />
                    ),
                })}
            />
        </Drawer.Navigator>
    );
};
export default ZTemplateDradwerNavigator;
