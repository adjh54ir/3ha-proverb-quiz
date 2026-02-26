import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, Easing } from 'react-native';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { TOWER_LEVELS } from '@/const/ConstTowerData';

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
        Animated.sequence([
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
        ]).start();
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

    const towerRewards = TOWER_LEVELS.filter((t) => unlockedRewards.includes(t.level));
    const selectedTower = TOWER_LEVELS.find((t) => t.level === selectedLevel);

    if (towerRewards.length === 0) return null;

    return (
        <>
            <View style={styles.towerRewardView}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: scaleWidth(10) }}>
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
                    <Pressable style={styles.popup} onPress={() => { }}>
                        {selectedTower && (
                            <>
                                <View style={[styles.popupHeader, { backgroundColor: selectedTower.backgroundColor }]}>
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
                                    onPress={() => setSelectedLevel(null)}>
                                    <Text style={styles.closeBtnText}>확인</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

export default TowerRewardSection;

const styles = StyleSheet.create({
    towerRewardView: {
        width: '105%',
        marginTop: scaleHeight(6),
        marginBottom: scaleHeight(4),
    },
    towerRewardItem: {
        alignItems: 'center',
        marginRight: scaleWidth(12),
        width: scaleWidth(60),
    },
    towerRewardImageWrap: {
        position: 'relative',
        marginBottom: scaleHeight(4),
    },
    towerRewardImage: {
        width: scaleWidth(48),
        height: scaleWidth(48),
        borderRadius: scaleWidth(24),
        borderWidth: 2,
        borderColor: '#9b59b6',
    },
    towerRewardBadge: {
        position: 'absolute',
        bottom: -scaleHeight(4),
        right: -scaleWidth(4),
        borderRadius: scaleWidth(8),
        paddingHorizontal: scaleWidth(4),
        paddingVertical: scaleHeight(1),
    },
    towerRewardBadgeText: {
        fontSize: scaledSize(8),
        color: '#fff',
        fontWeight: 'bold',
    },
    towerRewardName: {
        fontSize: scaledSize(10),
        color: '#2c3e50',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: scaledSize(14),
    },

    // 팝업
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        width: scaleWidth(300),
        backgroundColor: '#fff',
        borderRadius: scaleWidth(16),
        overflow: 'hidden',
    },
    popupHeader: {
        flexDirection: 'row',
        padding: scaleWidth(16),
        alignItems: 'center',
        gap: scaleWidth(12),
    },
    bossImage: {
        width: scaleWidth(72),
        height: scaleWidth(72),
        borderRadius: scaleWidth(8),
    },
    popupHeaderInfo: {
        flex: 1,
    },
    bossTitle: {
        fontSize: scaledSize(11),
        color: '#666',
        marginBottom: scaleHeight(2),
    },
    bossName: {
        fontSize: scaledSize(14),
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: scaleHeight(4),
    },
    bossDesc: {
        fontSize: scaledSize(10),
        color: '#555',
        lineHeight: scaledSize(14),
    },

    // ✅ 중복 제거 후 단일 정의
    clearBadge: {
        paddingVertical: scaleHeight(16),
        paddingHorizontal: scaleWidth(20),
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    clearBadgeCircleLeft: {
        position: 'absolute',
        width: scaleWidth(80),
        height: scaleWidth(80),
        borderRadius: scaleWidth(40),
        backgroundColor: 'rgba(255,255,255,0.08)',
        left: -scaleWidth(20),
        top: -scaleWidth(20),
    },
    clearBadgeCircleRight: {
        position: 'absolute',
        width: scaleWidth(60),
        height: scaleWidth(60),
        borderRadius: scaleWidth(30),
        backgroundColor: 'rgba(255,255,255,0.08)',
        right: -scaleWidth(10),
        bottom: -scaleWidth(10),
    },
    clearStar: {
        position: 'absolute',
        fontSize: scaledSize(16),
        color: 'rgba(255,255,255,0.6)',
    },
    clearStarLeft: {
        left: scaleWidth(20),
        top: scaleHeight(10),
    },
    clearStarRight: {
        right: scaleWidth(20),
        bottom: scaleHeight(10),
    },
    clearBadgeInner: {
        alignItems: 'center',
        gap: scaleHeight(4),
    },
    clearBadgeTrophy: {
        fontSize: scaledSize(28),
    },
    clearBadgeText: {
        color: '#fff',
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    clearBadgeSubText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: scaledSize(11),
        letterSpacing: 4,
    },

    popupBody: {
        padding: scaleWidth(16),
    },
    sectionTitle: {
        fontSize: scaledSize(12),
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: scaleHeight(6),
    },
    infoText: {
        fontSize: scaledSize(12),
        color: '#555',
    },
    highlight: {
        fontWeight: 'bold',
        color: '#e67e22',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: scaleHeight(12),
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scaleWidth(12),
    },
    rewardThumb: {
        width: scaleWidth(48),
        height: scaleWidth(48),
        borderRadius: scaleWidth(8),
        borderWidth: 1,
        borderColor: '#ddd',
    },
    rewardType: {
        fontSize: scaledSize(10),
        color: '#888',
        marginBottom: scaleHeight(2),
    },
    rewardName: {
        fontSize: scaledSize(13),
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    closeBtn: {
        margin: scaleWidth(16),
        marginTop: 0,
        paddingVertical: scaleHeight(10),
        borderRadius: scaleWidth(8),
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: scaledSize(13),
    },
});