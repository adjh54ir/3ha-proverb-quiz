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
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, themedStyles, displayFontSize } from '@/const/common/Theme';

const CompleteOverlay = () => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);
    const checkScale = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
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
    }, []);

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
        transform: [{ translateY: withTiming(textOpacity.value === 0 ? SPACING_H.md : 0, { duration: 300 }) }],
    }));

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            <Animated.View style={[styles.circle, circleStyle]}>
                <Animated.Text style={[styles.checkIcon, checkStyle]}>✓</Animated.Text>
            </Animated.View>
            <Animated.Text style={[styles.completeText, textStyle]}>COMPLETE</Animated.Text>
        </Animated.View>
    );
};

export default CompleteOverlay;

const styles = themedStyles(() => StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        // 부모 towerCard 와 동일한 라운드(RADIUS.lg) 유지
        backgroundColor: 'rgba(34, 197, 94, 0.88)',
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
        color: COLORS.primary,
        fontWeight: '700',
        lineHeight: scaledSize(44),
    },
    completeText: {
        fontSize: FONT_SIZES.heading,
        fontWeight: '700',
        color: COLORS.textWhite,
        letterSpacing: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
}));
