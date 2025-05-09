import React from "react";
import { useRef, useState } from "react"
import { NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native"
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome6Icon from "react-native-vector-icons/FontAwesome6";

const ScrollViewScreens = () => {

    const scrollViewRef = useRef<ScrollView>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);




    /**
     * 스크롤을 관리하는 Handler
     */
    const scrollHandler = (() => {
        return {

            /**
            * 스크롤 최상단으로 당기면 Refresh 기능 
            */
            onRefresh: () => {

                // TODO: 로직을 불러오는 부분을 추가해야함.
                setRefreshing(true);
            },

            /**
             * 스크롤을 일정 높이 만큼 움직였을때 아이콘 등장 처리 
             * @param event 
             */
            onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                setShowScrollTop(offsetY > 100);
            },
            /**
            * 스크롤 최상단으로 이동 
            * @return {void}
            */
            toTop: (): void => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            },

            /**
             * 스크롤 뷰 최하단으로 이동
             * @return {void}
             */
            toBottom: (): void => {
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            },
        }
    })();





    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={scrollHandler.onRefresh} />
            }
            onScroll={scrollHandler.onScroll}
            ref={scrollViewRef}>
            <View></View>



            {/* 최하단에 위치할것!! */}
            {showScrollTop && (
                <TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop}>
                    <FontAwesome6Icon name="arrow-up" size={20} color="#ffffff" />
                </TouchableOpacity>
            )}

        </ScrollView>
    )

}
export default ScrollViewScreens;

const styles = StyleSheet.create({
    scrollTopButton: {
        position: "absolute",
        right: 16,
        bottom: 16,
        backgroundColor: "#2196F3",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
});
