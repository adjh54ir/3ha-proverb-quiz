// CommonConfirmModal.tsx
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import React, { FC } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

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

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={_onRequestClose}>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContainer}>
                    {renderTitle && renderTitle()}
                    <Text style={styles.modalSummary}>{summary}</Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={onCancel}>
                            <Text style={styles.modalButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.modalDelete]} onPress={onConfirm}>
                            <Text style={styles.modalButtonText}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%', // 기존 80% → 90%로 변경
        backgroundColor: '#fff',
        borderRadius: scaleWidth(10),
        padding: scaleWidth(24), // 패딩도 조금 더 여유 있게
    },
    modalTitle: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        color: '#34495e',
        textAlign: 'center',
        marginBottom: scaleHeight(12),
    },
    modalSummary: {
        fontSize: scaledSize(14), // 기존 12 → 14로 증가
        color: '#555',
        textAlign: 'center', // 중앙정렬에서 왼쪽 정렬로 변경 (더 자연스러운 느낌)
        lineHeight: scaleHeight(24), // 기존 22 → 24로 증가
        marginBottom: scaleHeight(24),
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: scaleHeight(12),
        borderRadius: scaleWidth(8),
        alignItems: 'center',
        marginHorizontal: scaleWidth(5),
    },
    modalCancel: {
        backgroundColor: '#9E9E9E',
    },
    modalDelete: {
        backgroundColor: '#D32F2F',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: scaleHeight(12), // ← 간격 여기로
    },
    modalTitleText: {
        fontSize: scaledSize(18),
        lineHeight: scaleHeight(44),
        fontWeight: 'bold',
        color: '#34495e',
        textAlign: 'center',
    },
});

export default CmmDelConfirmModal;

