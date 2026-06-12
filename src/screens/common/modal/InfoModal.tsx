import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import IconComponent from "../atomic/IconComponent";
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';

const InfoModal = () => {

    const [showGuideModal, setShowGuideModal] = useState(false);
    const navigation = useNavigation();
    // showGuide 파라미터를 통해 모달 자동 오픈
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setShowGuideModal(true)} style={{ marginRight: scaleWidth(16) }}>
                    <IconComponent type="materialIcons" name="info-outline" size={24} color="#3498db" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    return (
        <SafeAreaView>
            {/* 설명 모달 */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.wrapper}>
                    <Modal transparent visible={showGuideModal} animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowGuideModal(false)}>
                                    <IconComponent type="materialIcons" name="close" size={24} color="#7f8c8d" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>🏠 홈 화면 안내</Text>
                                <Text style={styles.modalText}>
                                    <Text style={styles.boldText}>🏠 홈 화면{"\n"}</Text>
                                    주요 기능으로 빠르게 이동할 수 있는 기능을 제공합니다.{"\n\n"}

                                    <Text style={styles.boldText}>➡️ 시작하기{"\n"}</Text>
                                    전체 문제, 대륙별 문제, 난이도별 문제 중 원하는 방식으로 퀴즈를 선택하고 풀면서 수도를 학습할 수 있습니다.{"\n\n"}

                                    <Text style={styles.boldText}>➡️ 학습 모드{"\n"}</Text>
                                    국가별 수도 정보를 카드 형태로 학습할 수 있습니다. 국기, 국가명, 수도, 인구 등 다양한 정보를 함께 확인할 수 있습니다.{"\n\n"}

                                    <Text style={styles.boldText}>➡️ 오답 복습{"\n"}</Text>
                                    이전에 퀴즈에서 틀렸던 문제를 다시 복습하며 정확도를 높일 수 있습니다.
                                </Text>
                                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowGuideModal(false)}>
                                    <Text style={styles.modalCloseText}>닫기</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )

}
export default InfoModal;


const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: scaleWidth(20),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#ffffff',
        padding: scaleWidth(20),
        borderRadius: scaleWidth(12),
        alignItems: 'center',
    },
    modalCloseButton: {
        backgroundColor: '#3498db',
        paddingVertical: scaleHeight(10),
        paddingHorizontal: scaleWidth(20),
        borderRadius: scaleWidth(8),
    },
    modalCloseText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: scaleHeight(14),
        textAlign: 'center',
    },
    modalText: {
        fontSize: scaledSize(14),
        color: '#2c3e50',
        lineHeight: scaleHeight(22),
        textAlign: 'left',
        marginTop: scaleHeight(10),
        marginBottom: scaleHeight(20)
    },
    boldText: {
        fontWeight: 'bold',
    },
    modalCloseIcon: {
        position: 'absolute',
        top: scaleHeight(10),
        right: scaleWidth(10),
        zIndex: 2,
        padding: scaleWidth(5),
    },
});