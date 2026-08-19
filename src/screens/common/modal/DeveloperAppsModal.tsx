import React, { useEffect, useRef } from 'react';
import {
    Animated,
    View,
    Text,
    Modal,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    Platform,
    Alert,
    Linking,
} from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils';
import IconComponent from '../atomic/IconComponent';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W } from '@/const/common/Theme';

interface Props {
    visible: boolean;
    onClose: () => void;
}

type AppItem = {
    id: string;
    icon: any;
    title: string;
    desc: string;
    android?: string;
    ios?: string;
};

const DeveloperAppsModal = ({ visible, onClose }: Props) => {
    const appsData: AppItem[] = [
        {
            id: '평수 계산기',
            icon: require('@/assets/appicons/squaremetercalc2.png'),
            title: '평수 계산기',
            desc: '㎡(제곱미터)와 평(坪)을 쉽게 변환하고 평당 금액을 계산할 수 있는 계산기 앱입니다.',
            android: 'https://play.google.com/store/apps/details?id=com.tha.squaremetercalc',
            ios: 'https://apps.apple.com/app/id6746688301',
        },
        {
            id: '로또지니: 로또 생성기',
            icon: require('@/assets/appicons/main_lotto.png'),
            title: '로또지니: 로또 생성기',
            desc: '로또 당첨 확인, 통계 분석, 번호 생성 등 로또 기능을 한 곳에 모은 앱입니다.',
            android: 'https://play.google.com/store/apps/details?id=com.tha.lottogenerator',
            ios: 'https://apps.apple.com/app/id6746621734',
        },
        {
            id: '수픽: 수도 퀴즈',
            icon: require('@/assets/appicons/main_country.png'),
            title: '수픽: 수도 퀴즈',
            desc: '전 세계 수도를 학습하고 퀴즈로 확인할 수 있는 교육용 앱입니다.',
            android: 'https://play.google.com/store/apps/details?id=com.tha.capitalquiz',
            ios: 'https://apps.apple.com/app/id6746687390',
        },
        {
            id: '속픽: 속담 퀴즈',
            icon: require('@/assets/appicons/main_proverb.jpeg'),
            title: '속픽: 속담 퀴즈',
            desc: '속담을 학습하고 다양한 퀴즈로 점검하며 반복 복습할 수 있는 교육용 앱입니다.',
            android: 'https://play.google.com/store/apps/details?id=com.tha.proverbquiz',
            ios: 'https://apps.apple.com/app/id6746687973',
        },
        {
            id: '사픽: 사자성어 퀴즈',
            icon: require('@/assets/appicons/main_fouridioms.png'),
            title: '사픽: 사자성어 퀴즈',
            desc: '사자성어를 카드로 학습하고 퀴즈로 실력을 점검할 수 있는 교육용 앱입니다.',
            android: 'https://play.google.com/store/apps/details?id=com.tha.fouridioms',
            ios: 'https://apps.apple.com/us/app/%EC%82%AC%ED%94%BD-%EC%82%AC%EC%9E%90%EC%84%B1%EC%96%B4-%ED%80%B4%EC%A6%88/id6747324308',
        },
        {
            id: '멍픽: 강아지 퀴즈',
            icon: require('@/assets/appicons/main_dogquiz.png'),
            title: '멍픽: 강아지 퀴즈',
            desc: '강아지 견종을 학습하고 퀴즈로 기억을하는 도감형 학습 앱입니다.',
            android: '',
            ios: 'https://apps.apple.com/kr/app/%EB%A9%8D%ED%94%BD-%EA%B0%95%EC%95%84%EC%A7%80-%ED%80%B4%EC%A6%88/id6749044123',
        },

        {
            id: '오흡: 오늘 흡연 기록',
            icon: require('@/assets/appicons/main_todaycigarette.png'),
            title: '오흡: 오늘 흡연 기록',
            desc: '"작은 기록이 만든 큰 변화, 오늘부터 시작하세요!" 흡연 습관을 정확하게 파악하고, 금연의 첫 걸음을 도와주는 앱입니다.',
            android: '',
            ios: 'https://apps.apple.com/us/app/%EC%98%A4%ED%9D%A1-%EC%98%A4%EB%8A%98-%ED%9D%A1%EC%97%B0-%EA%B8%B0%EB%A1%9D/id6749576206',
        },
    ];

    // 진입 애니메이션 (fade + slide-up)
    const enterAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) {
            enterAnim.setValue(0);
            return;
        }
        const enter = Animated.timing(enterAnim, { toValue: 1, duration: 260, useNativeDriver: true });
        enter.start();
        return () => enter.stop();
    }, [visible, enterAnim]);

    const enterStyle = {
        opacity: enterAnim,
        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(12), 0] }) }],
    };

    const getDownloadUrl = (app: AppItem) => {
        const primary = Platform.OS === 'android' ? app.android : app.ios;
        const fallback = Platform.OS === 'android' ? app.ios : app.android;
        return primary || fallback || null;
    };

    const onDownloadApp = async (app: AppItem) => {
        const url = getDownloadUrl(app);
        if (!url) {
            Alert.alert('Comming Soon..!', '아직 스토어 링크가 준비되지 않았습니다.');
            return;
        }
        try {
            const supported = await Linking.canOpenURL(url);
            if (!supported) {
                Alert.alert('오류', '링크를 열 수 없습니다.');
                return;
            }
            Linking.openURL(url);
        } catch {
            Alert.alert('오류', '링크를 여는 중 문제가 발생했습니다.');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, enterStyle]}>
                    {/* 헤더 */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.titleText}>📱 제작자의 다른 앱</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.8}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 리스트 */}
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {appsData.map((app) => (
                            <View key={app.id} style={styles.appCard}>
                                <Image source={app.icon} style={styles.image} resizeMode="cover" />

                                <View style={styles.textArea}>
                                    <Text style={styles.appTitle}>{app.title}</Text>
                                    <Text style={styles.appDesc} numberOfLines={3}>
                                        {app.desc}
                                    </Text>
                                </View>

                                {/* 단일 다운로드 버튼 */}
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.downloadButton} onPress={() => onDownloadApp(app)} activeOpacity={0.8}>
                                        <IconComponent
                                            type="MaterialCommunityIcons"
                                            name="download"
                                            size={scaledSize(16)}
                                            color={COLORS.textWhite}
                                        />
                                        <Text style={styles.buttonText}>다운로드</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default DeveloperAppsModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.dim,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING_W.lg,
    },
    container: {
        width: '100%',
        maxHeight: scaleHeight(680),
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.xl,
        paddingVertical: SPACING_H.lg,
        paddingHorizontal: SPACING_W.lg,
    },
    scroll: {
        alignItems: 'center',
        paddingBottom: SPACING_H.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: scaleHeight(44),
        marginBottom: SPACING_H.md,
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
        paddingLeft: SPACING_W.xl, // 우상단 닫기 버튼 폭만큼 보정해 타이틀을 중앙에
    },
    titleText: {
        fontSize: FONT_SIZES.xl,
        fontWeight: '700',
        color: COLORS.textStrong,
        textAlign: 'center',
        flexShrink: 1,
    },
    closeButton: {
        padding: SPACING_W.xs,
    },
    closeText: {
        fontSize: FONT_SIZES.heading,
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
    appCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        paddingHorizontal: SPACING_W.md,
        paddingVertical: SPACING_H.md,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING_H.md,
    },
    image: {
        width: scaleWidth(64),
        height: scaleWidth(64),
        borderRadius: RADIUS.md,
        marginRight: SPACING_W.md,
    },
    textArea: {
        flex: 1,
    },
    appTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.textStrong,
        marginBottom: SPACING_H.xs,
    },
    appDesc: {
        fontSize: FONT_SIZES.smPlus,
        color: COLORS.textSecondary,
        lineHeight: scaledSize(19),
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: SPACING_H.md,
        width: '100%',
        justifyContent: 'center',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60%',
        minHeight: scaleHeight(44),
        paddingHorizontal: SPACING_W.lg,
        paddingVertical: SPACING_H.sm,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.secondary,
    },
    buttonText: {
        color: COLORS.textWhite,
        fontWeight: '600',
        marginLeft: SPACING_W.sm,
        fontSize: FONT_SIZES.md,
        textAlign: 'center',
    },
});
