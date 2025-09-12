// ProverbDetailModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';

type Props = {
    visible: boolean;
    proverb: MainDataType.Proverb | null;
    onClose: () => void;
    getFieldColor: (field: string) => string;
    getLevelColor: (levelName: string) => string;
};

const ProverbDetailModal = ({ visible, proverb, onClose, getFieldColor, getLevelColor }: Props) => {
    if (!proverb) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* ───────────── 헤더 (그대로 유지) ───────────── */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderTitle}>속담 상세</Text>
                        <TouchableOpacity style={styles.modalCloseIcon} onPress={onClose}>
                            <Icon name="xmark" size={20} color="#0984e3" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {/* 배지 영역 */}
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: getLevelColor(proverb.levelName) }]}>
                                <Text style={styles.badgeText}>{proverb.levelName}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: getFieldColor(proverb.category) }]}>
                                <Text style={styles.badgeText}>{proverb.category}</Text>
                            </View>
                        </View>

                        {/* 속담 본문 강조 박스 */}
                        <Text style={styles.modalProverbText}>{proverb.proverb}</Text>

                        {/* 의미 */}
                        {Boolean(proverb.longMeaning) && (
                            <View style={styles.meaningHighlight}>
                                <View style={styles.meaningQuoteBox}>
                                    <Icon
                                        name="quote-left"
                                        size={28}
                                        color="#58D68D"
                                        style={{ marginBottom: scaleHeight(8) }}
                                    />
                                    <Text style={styles.meaningQuoteText}>{proverb.longMeaning}</Text>
                                </View>
                            </View>
                        )}

                        {/* 예시 */}
                        {Array.isArray(proverb.example) && proverb.example.length > 0 && (
                            <View style={styles.sectionBox}>
                                <Text style={styles.sectionTitle}>✍️ 예시</Text>
                                {proverb.example.map((ex, idx) => (
                                    <Text key={idx} style={styles.exampleText}>
                                        • {ex}
                                    </Text>
                                ))}
                            </View>
                        )}

                        {/* 비슷한 속담 */}
                        {Array.isArray(proverb.sameProverb) && proverb.sameProverb.filter((p) => p.trim()).length > 0 && (
                            <View style={styles.sectionBox}>
                                <Text style={styles.sectionTitle}>🔗 비슷한 속담</Text>
                                {proverb.sameProverb.map((p, idx) => (
                                    <Text key={idx} style={styles.sectionText}>
                                        - {p}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* 닫기 버튼 */}
                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Text style={styles.modalCloseButtonText}>닫기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default ProverbDetailModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: scaleWidth(20),
        overflow: 'hidden',
        maxHeight: '85%',
    },

    /* ✅ 헤더는 기존 스타일 유지 */
    modalHeader: {
        backgroundColor: '#fff',
        paddingVertical: scaleHeight(16),
        paddingHorizontal: scaleWidth(20),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    modalHeaderTitle: {
        fontSize: scaledSize(22),
        fontWeight: 'bold',
        color: '#2d3436',
        textAlign: 'center',
    },
    modalCloseIcon: {
        position: 'absolute',
        top: scaleHeight(16),
        right: scaleWidth(16),
        padding: scaleWidth(4),
        zIndex: 10,
    },

    /* ✅ 본문 스타일 개선 */
    modalBody: {
        paddingHorizontal: scaleWidth(16),
        paddingTop: scaleHeight(8),
        paddingBottom: scaleHeight(20),
    },

    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scaleWidth(8),
        justifyContent: 'center',
        marginBottom: scaleHeight(16),
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scaleWidth(12),
        paddingVertical: scaleHeight(6),
        borderRadius: scaleWidth(14),
    },
    badgeText: {
        color: '#fff',
        fontSize: scaledSize(12),
        fontWeight: '600',
    },

    highlightSection: {
        borderWidth: 1.5,
        borderColor: '#A5D8FF',
        backgroundColor: '#EAF4FF',
        paddingVertical: scaleHeight(16),
        paddingHorizontal: scaleWidth(14),
        borderRadius: scaleWidth(14),
        marginBottom: scaleHeight(16),
        alignItems: 'center',
    },
    modalProverbText: {
        fontSize: scaledSize(20),
        fontWeight: '700',
        color: '#1E6BB8', // 파란색 강조
        textAlign: 'center',
        lineHeight: scaleHeight(28),
        marginBottom: scaleHeight(16), // 아래 요소와 간격만 추가
    },

    sectionBox: {
        borderWidth: 1,
        borderColor: '#E6EEF5',
        backgroundColor: '#FDFEFE',
        padding: scaleWidth(12),
        borderRadius: scaleWidth(12),
        marginBottom: scaleHeight(12),
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: scaledSize(15),
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: scaleHeight(10),
    },
    sectionText: {
        fontSize: scaledSize(14),
        color: '#444',
        lineHeight: scaleHeight(20),
    },
    exampleText: {
        fontSize: scaledSize(13),
        color: '#555',
        lineHeight: 20,
        marginBottom: scaleHeight(6),
        backgroundColor: '#FAFAFA',
        padding: scaleWidth(8),
        borderRadius: scaleWidth(8),
    },

    /* ✅ 닫기 버튼 */
    modalCloseButton: {
        backgroundColor: '#0984e3',
        paddingVertical: scaleHeight(14),
        alignItems: 'center',
        borderBottomLeftRadius: scaleWidth(20),
        borderBottomRightRadius: scaleWidth(20),
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: scaledSize(16),
        fontWeight: 'bold',
    },
    meaningHighlight: {
        borderWidth: 1.5,
        borderColor: '#A5D8FF',
        backgroundColor: '#EAF4FF',
        padding: scaleWidth(14),
        borderRadius: scaleWidth(14),
        marginBottom: scaleHeight(16),
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    meaningQuoteBox: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    meaningQuoteText: {
        fontSize: scaledSize(15),
        fontWeight: '600',
        color: '#2c3e50',
        lineHeight: scaleHeight(22),
        textAlign: 'center',
    },
});