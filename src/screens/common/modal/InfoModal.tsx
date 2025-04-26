import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import IconComponent from "../atomic/IconComponent";

const InfoModal = () => {

    const [showGuideModal, setShowGuideModal] = useState(false);
    const navigation = useNavigation();
    // showGuide 파라미터를 통해 모달 자동 오픈
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setShowGuideModal(true)} style={{ marginRight: 16 }}>
                    <IconComponent type="materialIcons" name="info-outline" size={24} color="#3498db" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    return (
        <SafeAreaView>
            {/* 설명 모달 */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
                    <Modal transparent visible={showGuideModal} animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowGuideModal(false)}>
                                    <IconComponent type="materialIcons" name="close" size={24} color="#555" />
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
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )

}
export default InfoModal;


const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        elevation: 5,
        alignItems: 'center',
    },
    modalCloseButton: {
        backgroundColor: '#3498db',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    modalCloseText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 14,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 14,
        color: '#34495e',
        lineHeight: 22,
        textAlign: 'left',
        marginTop: 10,
        marginBottom: 20
    },
    boldText: {
        fontWeight: 'bold',
    },
    modalCloseIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 2,
        padding: 5,
    },
});