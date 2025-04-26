import React from "react";
import { Paths } from "@/navigation/conf/Paths";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
} from "react-native";

const Home = () => {
    const navigation = useNavigation();

    useEffect(() => {
        console.log("Home");
    }, []);


    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
            </View>

            <View style={styles.section}>
            </View>

            <View style={styles.section}>
            </View>
        </ScrollView>
    );
};

export default Home;

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
        elevation: 3,
    },
});
