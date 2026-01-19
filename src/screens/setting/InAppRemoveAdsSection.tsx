
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNIap, { useIAP } from 'react-native-iap';
import { IAP_REMOVE_AD_KEY } from '@env';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';
import IconComponent from '../common/atomic/IconComponent';

type Props = {
    priceText: string;
    onPressPurchase: () => void;
};

const STORAGE_KEY = 'IS_AD_REMOVED';

const InAppRemoveAdsSection = () => {
    const [loading, setLoading] = useState(false);
    const [priceText, setPriceText] = useState<string>('—');

    const itemKey = "com.tha.iap.remove_ad"
    const itemSkus = ["com.tha.iap.remove_ad"];


    const purchaseProduct = async () => {
        try {
            setLoading(true);

            const purchase = await RNIap.requestPurchase({
                sku: itemKey,
            });
            console.log('Purchase success:', purchase);
            await AsyncStorage.setItem(STORAGE_KEY, 'true');
            Alert.alert('구매 완료', '광고가 제거되었습니다 🎉');
        } catch (e: any) {
            if (e.code === 'E_USER_CANCELLED') {
                // 유저 취소 → 무시
                return;
            }
            console.error('Purchase error', e);
            Alert.alert('결제 실패', '결제를 진행할 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <IconComponent
                    type="MaterialCommunityIcons"
                    name="diamond-stone"
                    size={scaledSize(32)}
                    color="#2c82f5"
                    style={{ marginBottom: scaleHeight(6) }}
                />
                <Text style={styles.title}>광고 없이 깔끔하게!</Text>
                <Text style={styles.subtitle}>PREMIUM UPGRADE</Text>
            </View>

            {/* 배지 */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>💎 평생 광고 제거</Text>
            </View>

            {/* 혜택 */}
            <View style={styles.benefitList}>
                <Benefit text="앱 내 모든 광고 완전 제거" />
                <Benefit text="홈 · 퀴즈 · 챌린지 화면 광고 차단" />
                <Benefit text="1회 결제로 평생 유지" />
            </View>

            {/* 구매 버튼 */}
            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={purchaseProduct}
                disabled={loading}
            >
                <IconComponent type="MaterialCommunityIcons" name="crown" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>
                    평생 광고 제거하기
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const Benefit = ({ text }: { text: string }) => (
    <View style={styles.benefitItem}>
        <IconComponent type="MaterialCommunityIcons" name="check-circle" size={18} color="#2c82f5" />
        <Text style={styles.benefitText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        padding: scaleWidth(20),
        marginHorizontal: scaleWidth(20),
        marginTop: scaleHeight(16),
        marginBottom: scaleHeight(12),
        borderRadius: scaleWidth(14),
        borderWidth: 1,
        borderColor: '#e2e6ea',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    header: {
        alignItems: 'center',
        marginBottom: scaleHeight(10),
    },
    title: {
        fontSize: scaledSize(18),
        fontWeight: '700',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: scaledSize(11),
        color: '#8395a7',
        letterSpacing: 1.2,
        marginTop: scaleHeight(2),
    },
    badge: {
        backgroundColor: '#eaf4ff',
        borderColor: '#2c82f5',
        borderWidth: 1,
        paddingVertical: scaleHeight(6),
        paddingHorizontal: scaleWidth(12),
        borderRadius: scaleWidth(30),
        alignSelf: 'center',
        marginBottom: scaleHeight(14),
    },
    badgeText: {
        fontSize: scaledSize(13),
        color: '#2c82f5',
        fontWeight: '700',
    },
    benefitList: {
        marginBottom: scaleHeight(12),
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scaleWidth(8),
        marginBottom: scaleHeight(6),
    },
    benefitText: {
        fontSize: scaledSize(13),
        color: '#546e7a',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2c82f5',
        paddingVertical: scaleHeight(12),
        borderRadius: scaleWidth(10),
    },
    buttonText: {
        color: '#fff',
        fontSize: scaledSize(14),
        fontWeight: '700',
    },
});

export default InAppRemoveAdsSection;