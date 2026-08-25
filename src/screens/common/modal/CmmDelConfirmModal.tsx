// CommonConfirmModal.tsx
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import React, { FC } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import useModalSafePadding from '@/hooks/useModalSafePadding';
import { useModalEnter } from '@/hooks/useModalEnter';

type IconType = 'MaterialCommunityIcons' | 'materialIcons';

type Props = {
    visible: boolean;
    onCancel: () => void;
    onConfirm?: () => void;
    onRequestClose?: () => void; // Android 백버튼 대응 (없으면 onCancel로 fallback)

    // 제목은 문자열 또는 커스텀 노드(아이콘 포함 타이틀 등) 모두 지원
    title?: string;
    renderTitle?: () => React.ReactNode;

    // 본문 요약/설명
    summary?: string;
    children?: React.ReactNode; // 커스텀 콘텐츠가 필요할 때 사용

    // 버튼 텍스트와 스타일
    cancelText?: string;
    confirmText?: string;
    confirmVariant?: 'default' | 'delete'; // delete는 빨강 버튼 적용

    // 상단 닫기 아이콘 표시 여부 (필요 시)
    showClose?: boolean;
    onPressClose?: () => void;

    // 아이콘을 쓰고 싶다면 외부에서 렌더링해서 title에 전달 권장.
    // (내부에서 IconComponent를 의존하지 않도록 decouple)
};

const CmmDelConfirmModal: FC<Props> = ({
    visible,
    onCancel,
    onConfirm,
    onRequestClose,
    renderTitle,
    summary,
}) => {
    const _onRequestClose = onRequestClose ?? onCancel;

    // 모달 공통 진입 애니메이션 (fade + scale)
    const enterStyle = useModalEnter(visible);
    const safePadding = useModalSafePadding();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={_onRequestClose}>
            <View style={[styles.modalBackdrop, safePadding]}>
                <Animated.View style={[styles.modalContainer, enterStyle]}>
                    {renderTitle && renderTitle()}
                    <Text style={styles.modalSummary}>{summary}</Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={onCancel} activeOpacity={0.8}>
                            <Text style={[styles.modalButtonText, styles.modalCancelText]}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.modalDelete]} onPress={onConfirm} activeOpacity={0.8}>
                            <Text style={styles.modalButtonText}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = themedStyles(() => StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: COLORS.dim,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING_W.lg,
    },
    modalContainer: {
        width: '100%',
        maxWidth: scaleWidth(360),
        maxHeight: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACING_W.lg,
        paddingVertical: SPACING_H.xl,
    },
    modalSummary: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: scaledSize(22),
        marginBottom: SPACING_H.xl,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING_W.md,
    },
    modalButton: {
        flex: 1,
        minHeight: scaleHeight(48),
        justifyContent: 'center',
        paddingVertical: SPACING_H.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    modalCancel: {
        backgroundColor: COLORS.surfaceAlt,
    },
    // 파괴적 액션 — 취소 버튼과 색/간격으로 확실히 구분
    modalDelete: {
        backgroundColor: COLORS.danger,
    },
    modalButtonText: {
        color: COLORS.textWhite,
        fontSize: FONT_SIZES.mdPlus,
        fontWeight: '700',
    },
    modalCancelText: {
        color: COLORS.textSecondary,
    },
}));

export default CmmDelConfirmModal;

