import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Animated, Easing } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { TOWER_LEVELS } from '@/const/ConstTowerData';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { withAlpha, ALPHA } from '@/utils/ColorAlphaUtils';

interface Props {
    unlockedRewards: number[];
}

// ✅ 컴포넌트 외부로 분리 (useRef/useEffect 정상 동작)
const ClearBadge = ({ color, name }: { color: string; name: string }) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const shimmer = useRef(new Animated.Value(0)).current;
    const star1Rotate = useRef(new Animated.Value(0)).current;
    const star2Rotate = useRef(new Animated.Value(0)).current;
    const glowScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.sequence([
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 3,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(200),
            Animated.parallel([
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(shimmer, {
                            toValue: 1,
                            duration: 1200,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(shimmer, {
                            toValue: 0,
                            duration: 1200,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ])
                ),
                Animated.loop(
                    Animated.timing(star1Rotate, {
                        toValue: 1,
                        duration: 2400,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                ),
                // ✅ 수정
                Animated.loop(
                    Animated.timing(star2Rotate, {
                        toValue: 1,  // 양수로 변경
                        duration: 3000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                ),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(glowScale, {
                            toValue: 1.06,
                            duration: 1400,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(glowScale, {
                            toValue: 1,
                            duration: 1400,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]),
        ]);
        animation.start();

        // ✅ 종료 처리: 언마운트 시 무한 루프 애니메이션 정지 (메모리 정리)
        return () => {
            animation.stop();
            [scale, opacity, shimmer, star1Rotate, star2Rotate, glowScale].forEach((v) => v.stopAnimation());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const textOpacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
    });
    const textScale = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });
    const star1Deg = star1Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const star2Deg = star2Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg'],  // outputRange에서 방향 반전
    });

    return (
        <Animated.View
            style={[
                styles.clearBadge,
                { backgroundColor: color },
                { opacity, transform: [{ scale }, { scale: glowScale }] },
            ]}>
            <View style={styles.clearBadgeCircleLeft} />
            <View style={styles.clearBadgeCircleRight} />

            <Animated.Text style={[styles.clearStar, styles.clearStarLeft, { transform: [{ rotate: star1Deg }] }]}>
                ✦
            </Animated.Text>
            <Animated.Text style={[styles.clearStar, styles.clearStarRight, { transform: [{ rotate: star2Deg }] }]}>
                ✦
            </Animated.Text>

            <View style={styles.clearBadgeInner}>
                <Text style={styles.clearBadgeTrophy}>🏆</Text>
                <Animated.Text
                    style={[
                        styles.clearBadgeText,
                        { opacity: textOpacity, transform: [{ scale: textScale }] },
                    ]}>
                    {name} 클리어!
                </Animated.Text>
                <Text style={styles.clearBadgeSubText}>★ ★ ★</Text>
            </View>
        </Animated.View>
    );
};

const TowerRewardSection = ({ unlockedRewards }: Props) => {
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    // 팝업 진입 애니메이션 (fade + slide-up)
    const popupAnim = useRef(new Animated.Value(0)).current;

    const towerRewards = TOWER_LEVELS.filter((t) => unlockedRewards.includes(t.level));
    const selectedTower = TOWER_LEVELS.find((t) => t.level === selectedLevel);

    useEffect(() => {
        if (selectedLevel === null) {
            popupAnim.setValue(0);
            return;
        }
        const anim = Animated.timing(popupAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        });
        anim.start();
        return () => anim.stop();
    }, [selectedLevel, popupAnim]);

    if (towerRewards.length === 0) return null;

    return (
        <>
            <View style={styles.towerRewardView}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.towerRewardScrollContent}>
                    {towerRewards.map((tower) => (
                        <TouchableOpacity
                            key={tower.level}
                            style={styles.towerRewardItem}
                            onPress={() => setSelectedLevel(tower.level)}
                            activeOpacity={0.8}>
                            <View style={styles.towerRewardImageWrap}>
                                <FastImage
                                    source={tower.reward.image}
                                    style={styles.towerRewardImage}
                                    resizeMode="cover"
                                />
                                <View style={[styles.towerRewardBadge, { backgroundColor: tower.color }]}>
                                    <Text style={styles.towerRewardBadgeText}>LV.{tower.level}</Text>
                                </View>
                            </View>
                            <Text style={styles.towerRewardName} numberOfLines={2}>
                                {tower.reward.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <Modal
                visible={selectedLevel !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedLevel(null)}>
                <Pressable style={styles.overlay} onPress={() => setSelectedLevel(null)}>
                    <Animated.View
                        style={{
                            opacity: popupAnim,
                            transform: [
                                { translateY: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) },
                            ],
                        }}>
                        <Pressable style={styles.popup} onPress={() => { }}>
                            {selectedTower && (
                            <>
                                <View style={[styles.popupHeader, { backgroundColor: withAlpha(selectedTower.color, ALPHA.soft) }]}>
                                    <FastImage
                                        source={selectedTower.bossImage}
                                        style={styles.bossImage}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.popupHeaderInfo}>
                                        <Text style={styles.bossTitle}>{selectedTower.bossTitle}</Text>
                                        <Text style={styles.bossName}>{selectedTower.bossName}</Text>
                                        <Text style={styles.bossDesc}>{selectedTower.bossDescription}</Text>
                                    </View>
                                </View>

                                <ClearBadge color={selectedTower.color} name={selectedTower.name} />

                                <View style={styles.popupBody}>
                                    <Text style={styles.sectionTitle}>🏆 클리어 조건</Text>
                                    <Text style={styles.infoText}>
                                        <Text style={styles.highlight}>{selectedTower.clearCondition}</Text>
                                    </Text>

                                    <View style={styles.divider} />

                                    <Text style={styles.sectionTitle}>🎁 획득 보상</Text>
                                    <View style={styles.rewardRow}>
                                        <FastImage
                                            source={selectedTower.reward.image}
                                            style={styles.rewardThumb}
                                            resizeMode="cover"
                                        />
                                        <View>
                                            <Text style={styles.rewardType}>
                                                {selectedTower.reward.type === 'costume' ? '👕 코스튬' : '🌟 캐릭터'}
                                            </Text>
                                            <Text style={styles.rewardName}>{selectedTower.reward.name}</Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.closeBtn, { backgroundColor: selectedTower.color }]}
                                    activeOpacity={0.85}
                                    onPress={() => setSelectedLevel(null)}>
                                    <Text style={styles.closeBtnText}>확인</Text>
                                </TouchableOpacity>
                            </>
                            )}
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>
        </>
    );
};

export default TowerRewardSection;

const styles = themedStyles(() => StyleSheet.create({
    towerRewardView: {
        width: '100%',
        marginTop: SPACING_H.sm,
        marginBottom: SPACING_H.xs,
    },
    towerRewardScrollContent: {
        paddingHorizontal: SPACING_W.md,
    },
    towerRewardItem: {
        alignItems: 'center',
        marginRight: SPACING_W.md,
        width: scaleWidth(60),
    },
    towerRewardImageWrap: {
        position: 'relative',
        marginBottom: SPACING_H.xs,
    },
    towerRewardImage: {
        width: scaleWidth(48),
        height: scaleWidth(48),
        borderRadius: scaleWidth(48) / 2,
        borderWidth: 2,
        borderColor: COLORS.accentTeal,
    },
    towerRewardBadge: {
        position: 'absolute',
        bottom: -scaleHeight(4),
        right: -scaleWidth(4),
        borderRadius: RADIUS.round,
        paddingHorizontal: SPACING_W.xs,
        paddingVertical: scaleHeight(1),
    },
    towerRewardBadgeText: {
        fontSize: FONT_SIZES.xxs,
        color: COLORS.textWhite,
        fontWeight: '700',
    },
    towerRewardName: {
        fontSize: FONT_SIZES.xxs,
        color: COLORS.textStrong,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: scaledSize(14),
    },

    // 팝업
    overlay: {
        flex: 1,
        backgroundColor: COLORS.dim,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING_W.lg,
    },
    popup: {
        width: scaleWidth(300),
        maxWidth: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
    },
    popupHeader: {
        flexDirection: 'row',
        paddingHorizontal: SPACING_W.lg,
        paddingVertical: SPACING_H.lg,
        alignItems: 'center',
        gap: SPACING_W.md,
    },
    bossImage: {
        width: scaleWidth(72),
        height: scaleWidth(72),
        borderRadius: RADIUS.md,
    },
    popupHeaderInfo: {
        flex: 1,
    },
    bossTitle: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginBottom: SPACING_H.xs,
    },
    bossName: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.textStrong,
        marginBottom: SPACING_H.xs,
    },
    bossDesc: {
        fontSize: FONT_SIZES.xxs,
        fontWeight: '400',
        color: COLORS.textSecondary,
        lineHeight: scaledSize(15),
    },

    // ✅ 중복 제거 후 단일 정의
    clearBadge: {
        paddingVertical: SPACING_H.lg,
        paddingHorizontal: SPACING_W.xl,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    clearBadgeCircleLeft: {
        position: 'absolute',
        width: scaleWidth(80),
        height: scaleWidth(80),
        borderRadius: scaleWidth(80) / 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
        left: -scaleWidth(20),
        top: -scaleWidth(20),
    },
    clearBadgeCircleRight: {
        position: 'absolute',
        width: scaleWidth(60),
        height: scaleWidth(60),
        borderRadius: scaleWidth(60) / 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
        right: -scaleWidth(10),
        bottom: -scaleWidth(10),
    },
    clearStar: {
        position: 'absolute',
        fontSize: FONT_SIZES.lg,
        color: 'rgba(255,255,255,0.6)',
    },
    clearStarLeft: {
        left: SPACING_W.xl,
        top: SPACING_H.md,
    },
    clearStarRight: {
        right: SPACING_W.xl,
        bottom: SPACING_H.md,
    },
    clearBadgeInner: {
        alignItems: 'center',
        gap: SPACING_H.xs,
    },
    clearBadgeTrophy: {
        fontSize: FONT_SIZES.display,
    },
    clearBadgeText: {
        color: COLORS.textWhite,
        fontSize: FONT_SIZES.xl,
        fontWeight: '700',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    clearBadgeSubText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: FONT_SIZES.xs,
        letterSpacing: 4,
    },

    popupBody: {
        paddingHorizontal: SPACING_W.lg,
        paddingVertical: SPACING_H.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        color: COLORS.textStrong,
        marginBottom: SPACING_H.sm,
    },
    infoText: {
        fontSize: FONT_SIZES.smPlus,
        fontWeight: '400',
        color: COLORS.textSecondary,
        lineHeight: scaledSize(20),
    },
    highlight: {
        fontWeight: '700',
        color: COLORS.accentOrangeDark,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING_H.lg,
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING_W.md,
    },
    rewardThumb: {
        width: scaleWidth(48),
        height: scaleWidth(48),
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    rewardType: {
        fontSize: FONT_SIZES.xxs,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginBottom: SPACING_H.xs,
    },
    rewardName: {
        fontSize: FONT_SIZES.mdPlus,
        fontWeight: '700',
        color: COLORS.textStrong,
    },
    closeBtn: {
        marginHorizontal: SPACING_W.lg,
        marginBottom: SPACING_H.lg,
        paddingVertical: SPACING_H.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: scaleHeight(44), // 터치 영역 최소 44
    },
    closeBtnText: {
        color: COLORS.textWhite,
        fontWeight: '700',
        fontSize: FONT_SIZES.lg,
    },
}));
