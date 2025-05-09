import React from "react";
import { Paths } from "@/navigation/conf/Paths";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import {
    Text,
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Linking,
} from "react-native";

const RefrenceScreen = () => {
    const navigation = useNavigation();
    useEffect(() => {
        console.log("Home");
    }, []);

    const movePageHandler = (() => {
        return {
            notification: () => {
                //@ts-ignore
                navigation.navigate(Paths.FN_NOTIFICATION);
            },
            advertisement: () => {
                //@ts-ignore
                navigation.navigate(Paths.FN_ADVERTISEMENT);
            },
            permission: () => {
                //@ts-ignore
                navigation.navigate(Paths.FN_PERMISSION);
            },
            language: () => {
                //@ts-ignore
                navigation.navigate(Paths.FN_LANGUAGE);
            }
        };
    })();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.title}>템플릿</Text>
                <Text style={styles.description}>
                    해당 템플릿에서는 다양한 기능을 담고 있습니다.
                </Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity onPress={movePageHandler.notification}>
                    <Text style={styles.title}>알람 기능</Text>
                    <Text style={styles.description}>
                        - 공통 기능 : NotifactionHelper(공통) {"\n"}
                        - 예시 화면 : NotificationScreen(예시) {"\n"}
                        1. 즉시 알림: 사용자가 버튼을 누르면 바로 알림이 전송됩니다. {"\n"}
                        2. 매일 알림: 사용자가 설정한 시간에 매일 알림을 받을 수 있습니다.{" "}
                        {"\n"}
                        3. 주간 알림: 사용자가 선택한 요일과 시간에 매주 알림을 받을 수
                        있습니다. {"\n"}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <TouchableOpacity onPress={movePageHandler.advertisement}>
                    <Text style={styles.title}>광고 기능 </Text>
                    <Text style={styles.description}>
                        - 공통 기능 : AdmobBannerAd(공통) {"\n"}
                        - 예시 화면 : AdvertisementScreens(예시) {"\n"}
                        1. 배너 광고: 앱 레이아웃의 일부를 차지하는 직사각형 광고입니다.
                        {"\n"}
                        2. 전면 광고: 페이지 전체를 채우는 광고입니다. {"\n"}
                        3. 보상형 광고: 광고 시청 후 보상을 받는 광고입니다. {"\n"}
                        4. 네이티브 광고: UI와 어울리는 맞춤 광고입니다. {"\n"}
                        5. 앱 열기 광고: 앱 실행 시 표시되는 광고입니다.
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <TouchableOpacity onPress={movePageHandler.permission}>
                    <Text style={styles.title}>권한 기능</Text>
                    <Text style={styles.description}>
                        - 공통 기능 : PermissionComponent(공통) {"\n"}
                        - 예시 화면 : PermissionScreens(예시) {"\n"}
                        1. 단일 권한 : checkSinglePermission()
                        2. 다중 권한 : checkMultiplePermissions()
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <TouchableOpacity onPress={movePageHandler.language}>
                    <Text style={styles.title}>다국어 기능</Text>
                    <Text style={styles.description}>
                        - 예시 화면 : LanguageScreen(예시) {"\n"}
                        1. 한국어 언어 파일 : ko-KR.json {"\n"}
                        2. 영어 언어 파일 : en-EN.json {"\n"}
                        3. 프랑스 언어 파일 : fr-FR.json {"\n"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default RefrenceScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        padding: 20,
    },
    section: {
        marginBottom: 30,
        backgroundColor: "#f8f9fa",
        padding: 15,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1a73e8",
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#333",
        marginBottom: 10,
    },
    purchaseButton: {
        backgroundColor: "#1a73e8",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
