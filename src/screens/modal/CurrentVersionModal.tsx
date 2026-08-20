import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import PopInView from '@/components/animation/PopInView';

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
                <PopInView visible={visible} style={styles.container}>
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
                        <IconComponent type="MaterialCommunityIcons" name="update" size={scaledSize(24)} color={COLORS.textStrong} />
                        <Text style={styles.title}>버전 정보</Text>
                    </View>

                    {/* 현재 버전 */}
                    <View style={[styles.versionCard, { backgroundColor: COLORS.surfaceAlt }]}>
                        <Text style={styles.versionLabel}>현재 버전</Text>
                        <Text style={styles.versionValue}>{currentVersion}</Text>
                    </View>

                    {/* 최신 버전 */}
                    <View
                        style={[
                            styles.versionCard,
                            { backgroundColor: isLatest ? COLORS.successBg : COLORS.dangerBg }, // ✅ 최신이면 연한 초록, 아니면 연한 빨강
                        ]}
                    >
                        <Text style={styles.versionLabel}>최신 버전</Text>
                        <Text style={[styles.versionValue, isLatest ? styles.ok : styles.needUpdate]}>
                            {latestVersion ?? '확인 불가'}
                        </Text>
                    </View>

                    {/* 버튼 */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.closeBtn]} onPress={onClose} activeOpacity={0.8}>
                            <Text style={[styles.buttonText, styles.closeBtnText]}>닫기</Text>
                        </TouchableOpacity>

                        {!isLatest && (
                            <TouchableOpacity style={[styles.button, styles.updateBtn]} onPress={onUpdatePress} activeOpacity={0.85}>
                                <Text style={styles.buttonText}>업데이트</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </PopInView>
            </View>
        </Modal>
    );
};

export default CurrentVersionModal;

const styles = themedStyles(() => StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: COLORS.dim,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING_W.xxl,
        paddingVertical: SPACING_H.xxl,
    },
    container: {
        width: '100%',
        maxWidth: scaleWidth(340),
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACING_W.lg,
        paddingVertical: SPACING_H.xl,
        alignItems: 'center',
    },
    iconWrapper: {
        width: scaleWidth(80),
        height: scaleWidth(80),
        marginBottom: SPACING_H.md,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    appIcon: {
        width: '100%',
        height: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING_H.lg,
    },
    title: {
        fontSize: FONT_SIZES.heading,
        fontWeight: '700',
        marginLeft: SPACING_W.sm,
        color: COLORS.textStrong,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        columnGap: SPACING_W.md,
        marginTop: SPACING_H.xl,
    },
    button: {
        flex: 1,
        height: scaleHeight(48),
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        backgroundColor: COLORS.surfaceAlt,
    },
    closeBtnText: {
        color: COLORS.text,
    },
    updateBtn: {
        backgroundColor: COLORS.primary,
    },
    buttonText: {
        color: COLORS.textWhite,
        fontWeight: '700',
        fontSize: FONT_SIZES.lg,
    },
    versionCard: {
        width: '100%',
        borderRadius: RADIUS.md,
        paddingVertical: SPACING_H.md,
        paddingHorizontal: SPACING_W.lg,
        marginBottom: SPACING_H.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    versionLabel: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.text,
    },
    versionValue: {
        fontSize: FONT_SIZES.mdPlus,
        fontWeight: '700',
    },
    ok: {
        color: COLORS.primaryDark,
    },
    needUpdate: {
        color: COLORS.danger,
    },
}));
