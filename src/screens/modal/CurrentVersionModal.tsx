import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import PopInView from '@/components/animation/PopInView';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';

interface VersionModalProps {
    visible: boolean;
    currentVersion: string;
    latestVersion: string | null;
    onClose: () => void;
    onUpdatePress?: () => void;
}

/**
 * 설정 화면에서 직접 누르는 버전 확인 팝업.
 *
 * 자동 업데이트 팝업(`VersionCheckModal`)과 같은 시각 언어를 쓴다 — 배지 → 타이틀 → 버전 행 → 버튼.
 * "최신이 아님" 은 오류가 아니라 **권유**이므로 시맨틱 레드가 아니라 앰버 톤을 쓴다.
 */
const CurrentVersionModal = ({ visible, currentVersion, latestVersion, onClose, onUpdatePress }: VersionModalProps) => {
    // AppModal 이 시스템 바까지 덮으므로 오버레이가 직접 안전 여백을 준다.
    const safePadding = useModalSafePadding();
    /** 스토어 조회 실패(null) — '최신' 과 섞으면 확인도 못 한 버전을 최신이라고 말하게 된다. */
    const isUnknown = !latestVersion;
    const isLatest = !isUnknown && currentVersion === latestVersion;
    /** 업데이트가 있다고 **확인된** 상태에서만 앰버 톤을 입힌다(확인 불가는 중립). */
    const needsUpdate = !isUnknown && !isLatest;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={[styles.backdrop, safePadding]}>
                <PopInView visible={visible} style={styles.container}>
                    {/* ✅ 앱 아이콘 */}
                    <View style={styles.iconWrapper}>
                        <Image source={require('@/assets/images/mainIcon.png')} style={styles.appIcon} resizeMode="contain" />
                    </View>

                    {/* 상태 배지 — 자동 업데이트 팝업과 동일한 pill (Text 패딩 대신 View 로 감싼다) */}
                    <View style={[styles.badge, isLatest && styles.badgeLatest, needsUpdate && styles.badgeUpdate]}>
                        <Text style={[styles.badgeText, isLatest && styles.badgeTextLatest, needsUpdate && styles.badgeTextUpdate]}>
                            {isUnknown ? '버전 확인 불가' : isLatest ? '최신 버전 사용 중' : '업데이트 가능'}
                        </Text>
                    </View>

                    {/* 타이틀 */}
                    <Text style={styles.title}>버전 정보</Text>

                    {/* 현재 / 최신 버전 */}
                    <View style={styles.versionList}>
                        <View style={styles.versionCard}>
                            <View style={styles.versionLabelRow}>
                                <IconComponent type="MaterialCommunityIcons" name="cellphone" size={scaledSize(18)} color={COLORS.textLight} />
                                <Text style={styles.versionLabel}>현재 버전</Text>
                            </View>
                            <Text style={styles.versionValue} numberOfLines={1}>
                                {currentVersion}
                            </Text>
                        </View>

                        <View style={[styles.versionCard, isLatest && styles.versionCardLatest, needsUpdate && styles.versionCardUpdate]}>
                            <View style={styles.versionLabelRow}>
                                <IconComponent
                                    type="MaterialCommunityIcons"
                                    name={isUnknown ? 'cloud-off-outline' : isLatest ? 'check-decagram' : 'arrow-up-circle'}
                                    size={scaledSize(18)}
                                    color={isUnknown ? COLORS.textLight : isLatest ? COLORS.primaryDark : COLORS.warningDark}
                                />
                                <Text style={[styles.versionLabel, isLatest && styles.labelLatest, needsUpdate && styles.labelUpdate]}>
                                    최신 버전
                                </Text>
                            </View>
                            <Text
                                style={[styles.versionValue, isLatest && styles.valueLatest, needsUpdate && styles.valueUpdate]}
                                numberOfLines={1}>
                                {latestVersion ?? '확인 불가'}
                            </Text>
                        </View>
                    </View>

                    {/* 버튼 */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.closeBtn]} onPress={onClose} activeOpacity={0.8}>
                            <Text style={[styles.buttonText, styles.closeBtnText]}>닫기</Text>
                        </TouchableOpacity>

                        {!isLatest && (
                            <TouchableOpacity style={[styles.button, styles.updateBtn]} onPress={onUpdatePress} activeOpacity={0.85}>
                                <IconComponent type="MaterialCommunityIcons" name="tray-arrow-down" size={scaledSize(18)} color={COLORS.textWhite} />
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
        paddingHorizontal: SPACING_W.lg,
    },
    container: {
        width: '100%',
        maxWidth: scaleWidth(340),
        maxHeight: '100%', // 카드가 시스템 바를 넘지 않도록(모달 레이아웃 규칙 2)
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        // 위·아래·좌·우 여백을 20 으로 맞춘다 (자동 업데이트 팝업과 동일한 리듬)
        paddingHorizontal: SPACING_W.xl,
        paddingVertical: SPACING_H.xl,
        alignItems: 'center',
    },
    iconWrapper: {
        width: scaleWidth(76),
        height: scaleWidth(76),
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
    badge: {
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: RADIUS.round,
        paddingHorizontal: SPACING_W.md,
        paddingVertical: SPACING_H.xs,
        marginBottom: SPACING_H.sm,
    },
    badgeLatest: {
        backgroundColor: COLORS.primarySoft,
    },
    badgeUpdate: {
        backgroundColor: COLORS.warningBg,
    },
    badgeText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    badgeTextLatest: {
        color: COLORS.primaryDeep,
    },
    badgeTextUpdate: {
        color: COLORS.warningDeep,
    },
    title: {
        fontSize: FONT_SIZES.heading,
        fontWeight: '700',
        color: COLORS.textStrong,
        textAlign: 'center',
        marginBottom: SPACING_H.lg,
    },
    versionList: {
        width: '100%',
        rowGap: SPACING_H.sm,
    },
    versionCard: {
        width: '100%',
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        backgroundColor: COLORS.surfaceAlt,
        paddingVertical: SPACING_H.md,
        paddingHorizontal: SPACING_W.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        columnGap: SPACING_W.sm,
    },
    versionCardLatest: {
        backgroundColor: COLORS.primaryBg,
        borderColor: COLORS.primaryBorder,
    },
    // 최신이 아님 = 오류가 아니라 권유 → 레드 대신 앰버 톤
    versionCardUpdate: {
        backgroundColor: COLORS.warningSoft,
        borderColor: COLORS.warningBorder,
    },
    versionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: SPACING_W.xsPlus,
    },
    versionLabel: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    labelLatest: {
        color: COLORS.primaryDark,
    },
    labelUpdate: {
        color: COLORS.warningDark,
    },
    versionValue: {
        flexShrink: 1,
        fontSize: FONT_SIZES.mdPlus,
        fontWeight: '700',
        color: COLORS.text,
    },
    valueLatest: {
        color: COLORS.primaryDeep,
    },
    valueUpdate: {
        color: COLORS.warningDeep,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        columnGap: SPACING_W.md,
        marginTop: SPACING_H.xl,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: SPACING_W.xsPlus,
        minHeight: scaleHeight(48),
        paddingVertical: SPACING_H.md,
        borderRadius: RADIUS.md,
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
}));
