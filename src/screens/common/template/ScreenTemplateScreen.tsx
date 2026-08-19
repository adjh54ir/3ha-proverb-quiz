import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { SPACING_W, SPACING_H } from '@/const/common/Theme';

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
        padding: SPACING_W.xl,
    },
    section: {
        marginBottom: SPACING_H.xxxl,
        backgroundColor: "#f8f9fa",
        padding: SPACING_W.lg,
        borderRadius: scaleWidth(12),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
})