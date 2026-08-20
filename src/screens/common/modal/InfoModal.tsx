import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import IconComponent from "../atomic/IconComponent";
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';

const InfoModal = () => {

    const [showGuideModal, setShowGuideModal] = useState(false);
    const navigation = useNavigation();
    // showGuide 파라미터를 통해 모달 자동 오픈
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setShowGuideModal(true)} style={{ marginRight: SPACING_W.lg }}>
                    <IconComponent type="materialIcons" name="info-outline" size={scaledSize(24)} color={COLORS.secondary} />
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
                                    <IconComponent type="materialIcons" name="close" size={scaledSize(24)} color={COLORS.textSecondary} />
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


const styles = themedStyles(() => StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING_W.xl,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLORS.surface,
        padding: SPACING_W.xl,
        borderRadius: scaleWidth(12),
        alignItems: 'center',
    },
    modalCloseButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: SPACING_H.smPlus,
        paddingHorizontal: SPACING_W.xl,
        borderRadius: scaleWidth(8),
    },
    modalCloseText: {
        color: COLORS.textWhite,
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.textStrong,
        marginBottom: SPACING_H.mdPlus,
        textAlign: 'center',
    },
    modalText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textStrong,
        lineHeight: scaleHeight(22),
        textAlign: 'left',
        marginTop: SPACING_H.smPlus,
        marginBottom: SPACING_H.xl
    },
    boldText: {
        fontWeight: 'bold',
    },
    modalCloseIcon: {
        position: 'absolute',
        top: scaleHeight(10),
        right: scaleWidth(10),
        zIndex: 2,
        padding: SPACING_W.xs,
    },
}));