// @/screens/components/CompleteOverlay.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withSpring,
    withTiming,
    cancelAnimation,
} from 'react-native-reanimated';
import { scaledSize, scaleWidth } from '@/utils';
import { withAlpha } from '@/utils/ColorAlphaUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, themedStyles, displayFontSize } from '@/const/common/Theme';
import useReducedMotion from '@/hooks/useReducedMotion';

const CompleteOverlay = () => {
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);
    const checkScale = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        // '애니메이션 줄이기' — 완료 표시는 최종 상태로 바로 세운다
        if (reducedMotion) {
            opacity.value = 1;
            scale.value = 1;
            checkScale.value = 1;
            textOpacity.value = 1;
            return;
        }
        // 배경 fade in
        opacity.value = withTiming(1, { duration: 300 });
        // 원형 배경 scale up
        scale.value = withSpring(1, { damping: 12, stiffness: 150 });
        // 체크 아이콘 튀어오르기
        checkScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 200 }));
        // 텍스트 fade in + 위로 올라오기
        textOpacity.value = withDelay(350, withTiming(1, { duration: 300 }));

        // 언마운트 시 진행 중인 애니메이션 정리 (메모리 누수 방지)
        return () => {
            cancelAnimation(opacity);
            cancelAnimation(scale);
            cancelAnimation(checkScale);
            cancelAnimation(textOpacity);
        };
    }, [reducedMotion]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const circleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const checkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        // 페이드와 같은 진행값으로 아래에서 올라온다 (애니메이션 줄이기면 textOpacity 가 곧바로 1)
        transform: [{ translateY: (1 - textOpacity.value) * SPACING_H.md }],
    }));

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            <Animated.View style={[styles.circle, circleStyle]}>
                <Animated.Text style={[styles.checkIcon, checkStyle]}>✓</Animated.Text>
            </Animated.View>
            <Animated.Text style={[styles.completeText, textStyle]}>정복 완료</Animated.Text>
        </Animated.View>
    );
};

export default CompleteOverlay;

const styles = themedStyles(() => StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        // 부모 towerCard 와 동일한 라운드(RADIUS.lg) 유지
        // 하드코딩 초록(흰 글자 2.3:1) 대신 고정 정답 띠 색 — 타워 카드는 모드와 무관하게 같은 톤이다
        backgroundColor: withAlpha(COLORS.towerVictoryBanner, 0.92),
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING_H.md,
        zIndex: 10,
    },
    circle: {
        width: scaleWidth(72),
        height: scaleWidth(72),
        borderRadius: scaleWidth(72) / 2,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkIcon: {
        fontSize: displayFontSize(36),
        color: COLORS.success,
        fontWeight: '700',
        lineHeight: scaledSize(44),
    },
    completeText: {
        fontSize: FONT_SIZES.heading,
        fontWeight: '700',
        color: COLORS.textWhite,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
}));
