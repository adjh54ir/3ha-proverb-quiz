// QuizCompletionModal.tsx 수정

import { scaleWidth, scaleHeight, scaledSize, screenWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
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
    // ✅ 모달 공통 진입 애니메이션 (fade + scale 0.95 → 1)
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const mascotBounce = useRef(new Animated.Value(0)).current;
    const confettiKey = useRef(Math.random()).current;
    // ✅ 루프 애니메이션 핸들 (cleanup 에서 stop)
    const loopRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (!visible) {
            // 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
            scaleAnim.setValue(0.95);
            fadeAnim.setValue(0);
            return;
        }
        scaleAnim.setValue(0.95);
        fadeAnim.setValue(0);
        const enterAnim = Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]);
        enterAnim.start(({ finished }) => {
            if (!finished) {
                return;
            }
            loopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(mascotBounce, {
                        toValue: -scaleHeight(10),
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(mascotBounce, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
            loopRef.current.start();
        });

        // ✅ 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
        return () => {
            enterAnim.stop();
            loopRef.current?.stop();
            loopRef.current = null;
            mascotBounce.setValue(0);
        };
    }, [visible, scaleAnim, fadeAnim, mascotBounce]);

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

    // ✅ 정확도에 따른 색상 결정 (성공/경고/실패 시맨틱 토큰으로 통일)
    const getAccuracyColor = () => {
        if (accuracy >= 80) return COLORS.success;
        if (accuracy >= 70) return COLORS.warning;
        return COLORS.danger;
    };

    const completionImageSource = accuracy === 100
        ? require('@/assets/images/screen-heroes/quiz-perfect.png')
        : require('@/assets/images/screen-heroes/quiz-complete.png');

    if (!isPracticeMode) {
        return (
            <Modal visible={visible} transparent animationType="fade">
                <View style={styles.overlay}>
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
                            styles.card,
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
                                        source={completionImageSource}
                                        style={styles.completionMascot}
                                        resizeMode={FastImage.resizeMode.contain}
                                    />
                                </View>
                            </Animated.View>

                            <Text style={styles.title}>
                                {getPerformanceMessage()} {getPerformanceEmoji()}
                            </Text>
                            <Text style={styles.subtitle}>
                                모든 퀴즈를 정복했어요
                            </Text>

                            <View style={styles.celebrateRow}>
                                <Text style={styles.celebrateEmoji}>🎊</Text>
                                <Text style={styles.celebrateText}>정말 잘했어요! 축하해요</Text>
                                <Text style={styles.celebrateEmoji}>🎊</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onConfirm}
                            activeOpacity={0.8}>
                            <Text style={styles.primaryButtonText}>홈으로 가기</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        );
    }

    // ✅ 연습 모드 - AnimatedCircularProgress 적용
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
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
                        styles.card,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                        },
                    ]}>

                    <View style={styles.practiceHeader}>
                        <Animated.View
                            style={{
                                transform: [{ translateY: mascotBounce }],
                            }}>
                            <View style={styles.practiceMascotContainer}>
                                <FastImage
                                    source={completionImageSource}
                                    style={styles.practiceCompletionImage}
                                    resizeMode={FastImage.resizeMode.contain}
                                />
                            </View>
                        </Animated.View>

                        <Text style={styles.title}>
                            {getPerformanceMessage()}
                        </Text>
                        <Text style={styles.subtitle}>
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
                            backgroundColor={COLORS.surfaceAlt}
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
                        <View style={styles.scoreCard}>
                            <View style={styles.scoreCardIcon}>
                                <IconComponent
                                    type="FontAwesome6"
                                    name="book-open"
                                    size={scaledSize(20)}
                                    color={COLORS.textSecondary}
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
                                    color={COLORS.success}
                                />
                            </View>
                            <Text style={styles.scoreCardLabel}>정답</Text>
                            <Text style={[styles.scoreCardValue, { color: COLORS.success }]}>
                                {correct}
                            </Text>
                        </View>

                        <View style={[styles.scoreCard, styles.scoreCardWrong]}>
                            <View style={styles.scoreCardIcon}>
                                <IconComponent
                                    type="MaterialIcons"
                                    name="cancel"
                                    size={scaledSize(20)}
                                    color={COLORS.danger}
                                />
                            </View>
                            <Text style={styles.scoreCardLabel}>오답</Text>
                            <Text style={[styles.scoreCardValue, { color: COLORS.danger }]}>
                                {wrong}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.practiceInfoBox}>
                        <IconComponent
                            type="MaterialIcons"
                            name="info-outline"
                            size={scaledSize(16)}
                            color={COLORS.textSecondary}
                            style={{ marginRight: SPACING_W.sm }}
                        />
                        <Text style={styles.practiceInfoText}>
                            연습 모드는 점수와 뱃지가 기록되지 않습니다
                        </Text>
                    </View>

                    <View style={styles.buttonRow}>
                        {onRetry && (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={onRetry}
                                activeOpacity={0.8}>
                                <Text style={styles.secondaryButtonText}>다시 풀기</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.primaryButton, styles.primaryButtonInRow]}
                            onPress={onConfirm}
                            activeOpacity={0.8}>
                            <Text style={styles.primaryButtonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default QuizCompletionModal;

const styles = StyleSheet.create({
    // ===== 모달 공통 껍데기 =====
    overlay: {
        flex: 1,
        backgroundColor: COLORS.dim,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING_W.lg,
    },
    card: {
        width: '100%',
        maxWidth: scaleWidth(340),
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACING_W.lg,
        paddingVertical: SPACING_H.xl,
        alignItems: 'center',
        overflow: 'hidden',
    },
    // ===== 공통 타이포 =====
    title: {
        fontSize: FONT_SIZES.heading,
        fontWeight: '700',
        color: COLORS.textStrong,
        marginBottom: SPACING_H.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    // ===== 배경 장식 =====
    bgCircle1: {
        position: 'absolute',
        top: -scaleHeight(60),
        right: -scaleWidth(60),
        width: scaleWidth(200),
        height: scaleWidth(200),
        borderRadius: scaleWidth(200) / 2,
        backgroundColor: COLORS.warningBg,
        opacity: 0.4,
    },
    bgCircle2: {
        position: 'absolute',
        bottom: -scaleHeight(80),
        left: -scaleWidth(80),
        width: scaleWidth(240),
        height: scaleWidth(240),
        borderRadius: scaleWidth(240) / 2,
        backgroundColor: COLORS.secondaryBg,
        opacity: 0.5,
    },
    // ===== 완료(정식) 모드 =====
    completionHeader: {
        alignItems: 'center',
        marginBottom: SPACING_H.xl,
        zIndex: 1,
    },
    mascotContainer: {
        width: scaleWidth(190),
        height: scaleHeight(132),
        borderRadius: RADIUS.xl,
        backgroundColor: COLORS.warningBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING_H.lg,
    },
    completionMascot: {
        width: scaleWidth(176),
        height: scaleHeight(126),
    },
    celebrateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: SPACING_W.sm,
        marginTop: SPACING_H.md,
    },
    celebrateEmoji: {
        fontSize: FONT_SIZES.lg,
    },
    celebrateText: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.primary,
    },
    // ===== 연습 모드 =====
    practiceHeader: {
        alignItems: 'center',
        marginBottom: SPACING_H.lg,
        zIndex: 1,
    },
    practiceMascotContainer: {
		width: scaleWidth(142),
		height: scaleHeight(100),
		borderRadius: RADIUS.lg,
        backgroundColor: COLORS.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING_H.md,
    },
	practiceCompletionImage: {
		width: scaleWidth(134),
		height: scaleHeight(94),
    },
    accuracyCircleContainer: {
        marginBottom: SPACING_H.xl,
        zIndex: 1,
    },
    accuracyInner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    accuracyPercentage: {
        fontSize: FONT_SIZES.display,
        fontWeight: '700',
        marginBottom: SPACING_H.xs,
    },
    accuracyLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    scoreCardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        columnGap: SPACING_W.sm,
        width: '100%',
        marginBottom: SPACING_H.lg,
        zIndex: 1,
    },
    scoreCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING_H.md,
        paddingHorizontal: SPACING_W.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    scoreCardCorrect: {
        borderColor: COLORS.successSoft,
        backgroundColor: COLORS.successBg,
    },
    scoreCardWrong: {
        borderColor: COLORS.dangerBg,
        backgroundColor: COLORS.dangerBg,
    },
    scoreCardIcon: {
        marginBottom: SPACING_H.sm,
    },
    scoreCardLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginBottom: SPACING_H.xs,
    },
    scoreCardValue: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: '700',
        color: COLORS.textStrong,
    },
    practiceInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceAlt,
        paddingVertical: SPACING_H.md,
        paddingHorizontal: SPACING_W.lg,
        borderRadius: RADIUS.md,
        marginBottom: SPACING_H.xl,
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.border,
        zIndex: 1,
    },
    practiceInfoText: {
        fontSize: FONT_SIZES.smPlus,
        color: COLORS.textSecondary,
        fontWeight: '400',
        flex: 1,
    },
    // ===== 하단 버튼 =====
    buttonRow: {
        flexDirection: 'row',
        columnGap: SPACING_W.md,
        width: '100%',
        zIndex: 1,
    },
    primaryButton: {
        width: '100%',
        height: scaleHeight(48),
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    primaryButtonInRow: {
        flex: 1,
        width: undefined,
    },
    primaryButtonText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.textWhite,
    },
    secondaryButton: {
        flex: 1,
        height: scaleHeight(48),
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
});
