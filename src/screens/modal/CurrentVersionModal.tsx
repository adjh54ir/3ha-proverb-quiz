import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';
import IconComponent from '../common/atomic/IconComponent';

interface VersionModalProps {
    visible: boolean;
    currentVersion: string;
    latestVersion: string | null;
    onClose: () => void;
    onUpdatePress?: () => void;
}

const CurrentVersionModal = ({ visible, currentVersion, latestVersion, onClose, onUpdatePress }: VersionModalProps) => {
    const isLatest = !latestVersion || currentVersion === latestVersion;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    {/* ✅ 앱 아이콘 */}
                    <View style={styles.iconWrapper}>
                        <Image
                            source={require('@/assets/images/mainIcon.png')}
                            style={styles.appIcon}
                            resizeMode="contain"
                        />
                    </View>

                    {/* 타이틀 */}
                    <View style={styles.headerRow}>
                        <IconComponent type="MaterialCommunityIcons" name="update" size={24} color="#34495e" />
                        <Text style={styles.title}>버전 정보</Text>
                    </View>

                    {/* 현재 버전 */}
                    <View style={[styles.versionCard, { backgroundColor: '#ecf0f1' }]}>
                        <Text style={styles.versionLabel}>현재 버전</Text>
                        <Text style={styles.versionValue}>{currentVersion}</Text>
                    </View>

                    {/* 최신 버전 */}
                    <View
                        style={[
                            styles.versionCard,
                            { backgroundColor: isLatest ? '#eafaf1' : '#fdecea' }, // ✅ 최신이면 연한 초록, 아니면 연한 빨강
                        ]}
                    >
                        <Text style={styles.versionLabel}>최신 버전</Text>
                        <Text style={[styles.versionValue, isLatest ? styles.ok : styles.needUpdate]}>
                            {latestVersion ?? '확인 불가'}
                        </Text>
                    </View>

                    {/* 버튼 */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.closeBtn]} onPress={onClose}>
                            <Text style={styles.buttonText}>닫기</Text>
                        </TouchableOpacity>

                        {!isLatest && (
                            <TouchableOpacity style={[styles.button, styles.updateBtn]} onPress={onUpdatePress}>
                                <Text style={styles.buttonText}>업데이트</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CurrentVersionModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: scaleWidth(12),
        padding: scaleWidth(20),
        alignItems: 'center',
    },
    iconWrapper: {
        width: scaleWidth(80),
        height: scaleWidth(80),
        marginBottom: scaleHeight(12),
        borderRadius: scaleWidth(16),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    appIcon: {
        width: '100%',
        height: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scaleHeight(16),
    },
    title: {
        fontSize: scaledSize(18),
        fontWeight: '700',
        marginLeft: scaleWidth(8),
        color: '#34495e',
    },
    versionBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: scaleHeight(10),
    },
    label: {
        fontSize: scaledSize(14),
        color: '#2c3e50',
        fontWeight: '600',
    },
    value: {
        fontSize: scaledSize(14),
        color: '#7f8c8d',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between', // ✅ 좌우로 분리
        width: '100%',
        marginTop: scaleHeight(20),
    },
    button: {
        flex: 1, // ✅ 버튼을 동일 비율로 차지
        paddingVertical: scaleHeight(14), // ⬆️ 기존 10 → 14
        paddingHorizontal: scaleWidth(20), // ⬆️ 기존 16 → 20
        borderRadius: scaleWidth(8),       // ⬆️ 살짝 둥글게
        marginHorizontal: scaleWidth(6),   // 버튼 사이 간격 확보
        alignItems: 'center',
    },
    closeBtn: {
        backgroundColor: '#95a5a6',
    },
    updateBtn: {
        backgroundColor: '#3498db',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700', // ⬆️ 조금 더 두껍게
        fontSize: scaledSize(16), // ⬆️ 기존 14 → 16
    },
    versionCard: {
        width: '100%',
        borderRadius: scaleWidth(10),
        paddingVertical: scaleHeight(14),
        paddingHorizontal: scaleWidth(16),
        marginBottom: scaleHeight(12),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        // 그림자 효과 (iOS/Android 모두 반영)
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
    },
    versionLabel: {
        fontSize: scaledSize(15),
        fontWeight: '600',
        color: '#2c3e50',
    },
    versionValue: {
        fontSize: scaledSize(15),
        fontWeight: '700',
    },
    ok: {
        color: '#27ae60',
    },
    needUpdate: {
        color: '#e74c3c',
    },
});