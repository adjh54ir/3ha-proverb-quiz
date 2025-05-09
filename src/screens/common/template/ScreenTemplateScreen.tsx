import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * 
 * @returns 
 */
const ScreenTemplateScreen = () => {
    useEffect(() => {
        console.log("[+] 페이지를 시작합니다.")

    }, [])
    return (
        <ScrollView style={styles.container}>
            <View></View>
        </ScrollView>
    )

}
export default ScreenTemplateScreen;

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
})