// @/screens/components/CompleteOverlay.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withSpring,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';

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
        transform: [{ translateY: withTiming(textOpacity.value === 0 ? 10 : 0, { duration: 300 }) }],
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

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(39, 174, 96, 0.85)',
        borderRadius: scaleWidth(20),
        justifyContent: 'center',
        alignItems: 'center',
        gap: scaleHeight(12),
        zIndex: 10,
    },
    circle: {
        width: scaleWidth(72),
        height: scaleWidth(72),
        borderRadius: scaleWidth(36),
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    checkIcon: {
        fontSize: scaledSize(36),
        color: '#27ae60',
        fontWeight: 'bold',
        lineHeight: scaledSize(44),
    },
    completeText: {
        fontSize: scaledSize(22),
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});