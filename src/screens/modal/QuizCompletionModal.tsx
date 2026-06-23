// QuizCompletionModal.tsx 수정

import { scaleWidth, scaleHeight, scaledSize, screenWidth } from '@/utils';
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import ConfettiCannon from 'react-native-confetti-cannon';
import IconComponent from '../common/atomic/IconComponent';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

interface QuizCompletionModalProps {
    visible: boolean;
    isPracticeMode?: boolean;
    correct: number;
    wrong: number;
    total: number;
    accuracy: number;
    onConfirm: () => void;
    onRetry?: () => void; // ✅ 추가
}

const QuizCompletionModal: React.FC<QuizCompletionModalProps> = ({
    visible,
    isPracticeMode = false,
    correct,
    wrong,
    total,
    accuracy,
    onConfirm,
    onRetry, // ✅ 추가
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const mascotBounce = useRef(new Animated.Value(0)).current;
    const confettiKey = useRef(Math.random()).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    bounciness: 8,
                    speed: 12,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (!finished) {
                    return;
                }
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(mascotBounce, {
                            toValue: -10,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(mascotBounce, {
                            toValue: 0,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            });
        }
        // ✅ 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
        return () => {
            scaleAnim.stopAnimation();
            fadeAnim.stopAnimation();
            mascotBounce.stopAnimation();
        };
    }, [visible]);

    const getPerformanceMessage = () => {
        if (accuracy >= 90) return '완벽해요!';
        if (accuracy >= 80) return '정말 잘했어요!';
        if (accuracy >= 70) return '훌륭해요!';
        if (accuracy >= 60) return '좋아요!';
        return '수고했어요!';
    };

    const getPerformanceEmoji = () => {
        if (accuracy >= 90) return '🏆';
        if (accuracy >= 80) return '🎉';
        if (accuracy >= 70) return '👏';
        if (accuracy >= 60) return '😊';
        return '💪';
    };

    // ✅ 정확도에 따른 색상 결정
    const getAccuracyColor = () => {
        if (accuracy >= 90) return '#22C55E';
        if (accuracy >= 80) return '#22C55E';
        if (accuracy >= 70) return '#F59E0B';
        return '#EF4444';
    };

    if (!isPracticeMode) {
        return (
            <Modal visible={visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <ConfettiCannon
                        key={confettiKey}
                        count={150}
                        origin={{ x: screenWidth / 2, y: 0 }}
                        fadeOut
                        autoStart
                        explosionSpeed={400}
                    />

                    <Animated.View
                        style={[
                            styles.completionModal,
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: fadeAnim,
                            },
                        ]}>

                        <View style={styles.bgCircle1} />
                        <View style={styles.bgCircle2} />

                        <View style={styles.completionHeader}>
                            <Animated.View
                                style={{
                                    transform: [{ translateY: mascotBounce }],
                                }}>
                                <View style={styles.mascotContainer}>
                                    <FastImage
                                        source={require('@/assets/images/mascote_done.png')}
                                        style={styles.completionMascot}
                                        resizeMode={FastImage.resizeMode.contain}
                                    />
                                </View>
                            </Animated.View>

                            <Text style={styles.completionTitle}>
                                완벽해요! 🎉
                            </Text>
                            <Text style={styles.completionSubtitle}>
                                모든 퀴즈를 정복했어요
                            </Text>

                            <View style={styles.celebrateRow}>
                                <Text style={styles.celebrateEmoji}>🎊</Text>
                                <Text style={styles.celebrateText}>정말 잘했어요! 축하해요</Text>
                                <Text style={styles.celebrateEmoji}>🎊</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={onConfirm}
                            activeOpacity={0.8}>
                            <Text style={styles.confirmButtonText}>홈으로 가기</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        );
    }

    // ✅ 연습 모드 - AnimatedCircularProgress 적용
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                {accuracy >= 80 && (
                    <ConfettiCannon
                        key={confettiKey}
                        count={100}
                        origin={{ x: screenWidth / 2, y: 0 }}
                        fadeOut
                        autoStart
                        explosionSpeed={350}
                    />
                )}

                <Animated.View
                    style={[
                        styles.practiceModal,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                        },
                    ]}>

                    <View style={styles.practiceBgGradient} />

                    <View style={styles.practiceHeader}>
                        <Animated.View
                            style={{
                                transform: [{ translateY: mascotBounce }],
                            }}>
                            <View style={styles.practiceMascotContainer}>
                                <Text style={styles.practiceEmoji}>
                                    {getPerformanceEmoji()}
                                </Text>
                            </View>
                        </Animated.View>

                        <Text style={styles.practiceTitle}>
                            {getPerformanceMessage()}
                        </Text>
                        <Text style={styles.practiceSubtitle}>
                            연습 완료!
                        </Text>
                    </View>

                    {/* ✅ AnimatedCircularProgress로 교체 */}
                    <View style={styles.accuracyCircleContainer}>
                        <AnimatedCircularProgress
                            size={scaleWidth(140)}
                            width={scaleWidth(10)}
                            fill={accuracy}
                            tintColor={getAccuracyColor()}
                            backgroundColor="#F1F5F9"
                            duration={1500}
                            rotation={0}
                        >
                            {() => (
                                <View style={styles.accuracyInner}>
                                    <Text style={[styles.accuracyPercentage, { color: getAccuracyColor() }]}>
                                        {accuracy}%
                                    </Text>
                                    <Text style={styles.accuracyLabel}>정답률</Text>
                                </View>
                            )}
                        </AnimatedCircularProgress>
                    </View>

                    <View style={styles.scoreCardsContainer}>
                        <View style={[styles.scoreCard, styles.scoreCardTotal]}>
                            <View style={styles.scoreCardIcon}>
                                <IconComponent
                                    type="FontAwesome6"
                                    name="book-open"
                                    size={scaledSize(20)}
                                    color="#22C55E"
                                />
                            </View>
                            <Text style={styles.scoreCardLabel}>총 문제</Text>
                            <Text style={styles.scoreCardValue}>{total}</Text>
                        </View>

                        <View style={[styles.scoreCard, styles.scoreCardCorrect]}>
                            <View style={styles.scoreCardIcon}>
                                <IconComponent
                                    type="MaterialIcons"
                                    name="check-circle"
                                    size={scaledSize(20)}
                                    color="#22C55E"
                                />
                            </View>
                            <Text style={styles.scoreCardLabel}>정답</Text>
                            <Text style={[styles.scoreCardValue, { color: '#22C55E' }]}>
                                {correct}
                            </Text>
                        </View>

                        <View style={[styles.scoreCard, styles.scoreCardWrong]}>
                            <View style={styles.scoreCardIcon}>
                                <IconComponent
                                    type="MaterialIcons"
                                    name="cancel"
                                    size={scaledSize(20)}
                                    color="#EF4444"
                                />
                            </View>
                            <Text style={styles.scoreCardLabel}>오답</Text>
                            <Text style={[styles.scoreCardValue, { color: '#EF4444' }]}>
                                {wrong}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.practiceInfoBox}>
                        <IconComponent
                            type="MaterialIcons"
                            name="info-outline"
                            size={scaledSize(16)}
                            color="#64748B"
                            style={{ marginRight: scaleWidth(6) }}
                        />
                        <Text style={styles.practiceInfoText}>
                            연습 모드는 점수와 뱃지가 기록되지 않습니다
                        </Text>
                    </View>
                    <View style={styles.practiceButtonRow}>
                        {onRetry && (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={onRetry}
                                activeOpacity={0.8}>
                                <Text style={styles.retryButtonText}>다시 풀기</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.practiceConfirmButton}
                            onPress={onConfirm}
                            activeOpacity={0.8}>
                            <Text style={styles.practiceConfirmText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default QuizCompletionModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    completionModal: {
        backgroundColor: '#fff',
        borderRadius: scaleWidth(32),
        width: '88%',
        maxWidth: scaleWidth(380),
        paddingVertical: scaleHeight(48),
        paddingHorizontal: scaleWidth(28),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        alignItems: 'center',
        overflow: 'hidden',
    },
    bgCircle1: {
        position: 'absolute',
        top: -scaleWidth(60),
        right: -scaleWidth(60),
        width: scaleWidth(200),
        height: scaleWidth(200),
        borderRadius: scaleWidth(100),
        backgroundColor: '#FFF7ED',
        opacity: 0.6,
    },
    bgCircle2: {
        position: 'absolute',
        bottom: -scaleWidth(80),
        left: -scaleWidth(80),
        width: scaleWidth(240),
        height: scaleWidth(240),
        borderRadius: scaleWidth(120),
        backgroundColor: '#EFF6FF',
        opacity: 0.5,
    },
    completionHeader: {
        alignItems: 'center',
        marginBottom: scaleHeight(36),
        zIndex: 1,
    },
    mascotContainer: {
        width: scaleWidth(120),
        height: scaleWidth(120),
        borderRadius: scaleWidth(60),
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: scaleHeight(24),
        shadowColor: '#FCD34D',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    completionMascot: {
        width: scaleWidth(90),
        height: scaleWidth(90),
    },
    completionTitle: {
        fontSize: scaledSize(32),
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: scaleHeight(8),
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    completionSubtitle: {
        fontSize: scaledSize(17),
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: scaleHeight(20),
    },
    achievementBadge: {
        backgroundColor: '#FCD34D',
        paddingHorizontal: scaleWidth(24),
        paddingVertical: scaleHeight(10),
        borderRadius: scaleWidth(20),
        marginTop: scaleHeight(8),
        shadowColor: '#FCD34D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    achievementText: {
        fontSize: scaledSize(16),
        fontWeight: '700',
        color: '#F97316',
    },
    celebrateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scaleWidth(8),
        marginTop: scaleHeight(10),
    },
    celebrateEmoji: {
        fontSize: scaledSize(18),
    },
    celebrateText: {
        fontSize: scaledSize(15),
        fontWeight: '800',
        color: '#22C55E',
    },
    confirmButton: {
        backgroundColor: '#F87171',
        borderRadius: scaleWidth(28),
        paddingVertical: scaleHeight(16),
        paddingHorizontal: scaleWidth(56),
        shadowColor: '#F87171',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        zIndex: 1,
    },
    confirmButtonText: {
        fontSize: scaledSize(18),
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },

    practiceModal: {
        backgroundColor: '#fff',
        borderRadius: scaleWidth(28),
        width: '90%',
        maxWidth: scaleWidth(400),
        paddingVertical: scaleHeight(40),
        paddingHorizontal: scaleWidth(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        alignItems: 'center',
        overflow: 'hidden',
    },
    practiceBgGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: scaleHeight(180),
        backgroundColor: '#F8FAFC',
        opacity: 0.5,
    },
    practiceHeader: {
        alignItems: 'center',
        marginBottom: scaleHeight(24),
        zIndex: 1,
    },
    practiceMascotContainer: {
        width: scaleWidth(90),
        height: scaleWidth(90),
        borderRadius: scaleWidth(45),
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: scaleHeight(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    practiceEmoji: {
        fontSize: scaledSize(50),
    },
    practiceTitle: {
        fontSize: scaledSize(28),
        fontWeight: '800',
        color: '#334155',
        marginBottom: scaleHeight(4),
        textAlign: 'center',
    },
    practiceSubtitle: {
        fontSize: scaledSize(16),
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '600',
    },
    accuracyCircleContainer: {
        marginVertical: scaleHeight(20),
        zIndex: 1,
    },
    // ✅ 내부 텍스트용 스타일 추가
    accuracyInner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    accuracyPercentage: {
        fontSize: scaledSize(42),
        fontWeight: '800',
        marginBottom: scaleHeight(4),
    },
    accuracyLabel: {
        fontSize: scaledSize(13),
        color: '#64748B',
        fontWeight: '600',
    },
    scoreCardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: scaleHeight(20),
        zIndex: 1,
    },
    scoreCard: {
        flex: 1,
        marginHorizontal: scaleWidth(4),
        backgroundColor: '#F8FAFC',
        borderRadius: scaleWidth(16),
        paddingVertical: scaleHeight(16),
        paddingHorizontal: scaleWidth(8),
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    scoreCardTotal: {
        borderColor: '#22C55E',
        backgroundColor: '#EFF6FF',
    },
    scoreCardCorrect: {
        borderColor: '#22C55E',
        backgroundColor: '#EFF6FF',
    },
    scoreCardWrong: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    scoreCardIcon: {
        marginBottom: scaleHeight(8),
    },
    scoreCardLabel: {
        fontSize: scaledSize(12),
        color: '#64748B',
        fontWeight: '600',
        marginBottom: scaleHeight(4),
    },
    scoreCardValue: {
        fontSize: scaledSize(24),
        fontWeight: '800',
        color: '#334155',
    },
    practiceInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: scaleHeight(12),
        paddingHorizontal: scaleWidth(16),
        borderRadius: scaleWidth(12),
        marginBottom: scaleHeight(20),
        width: '100%',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    practiceInfoText: {
        fontSize: scaledSize(13),
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    practiceConfirmText: {
        fontSize: scaledSize(17),
        fontWeight: '700',
        color: '#fff',
    },
    practiceButtonRow: {
        flexDirection: 'row',
        gap: scaleWidth(10),
        width: '100%',
    },
    retryButton: {
        flex: 1,
        backgroundColor: '#EFF6FF',
        borderRadius: scaleWidth(24),
        paddingVertical: scaleHeight(14),
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    retryButtonText: {
        fontSize: scaledSize(16),
        fontWeight: '700',
        color: '#334155',
    },
    // practiceConfirmButton도 flex: 1 추가
    practiceConfirmButton: {
        flex: 1,                          // ✅ 추가
        backgroundColor: '#3B82F6',
        borderRadius: scaleWidth(24),
        paddingVertical: scaleHeight(14),
        alignItems: 'center',             // ✅ center로 변경
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});