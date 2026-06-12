import React from 'react';
import {
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
import { moderateScale, scaleHeight, scaleWidth, scaledSize } from '@/utils';
import IconComponent from '../atomic/IconComponent';

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
            desc: '“작은 기록이 만든 큰 변화, 오늘부터 시작하세요!” 흡연 습관을 정확하게 파악하고, 금연의 첫 걸음을 도와주는 앱입니다.',
            android: '',
            ios: 'https://apps.apple.com/us/app/%EC%98%A4%ED%9D%A1-%EC%98%A4%EB%8A%98-%ED%9D%A1%EC%97%B0-%EA%B8%B0%EB%A1%9D/id6749576206',
        },
    ];

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
                <View style={styles.container}>
                    {/* 헤더 */}
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={styles.titleText}>📱 제작자의 다른 앱</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
                                    <TouchableOpacity style={styles.downloadButton} onPress={() => onDownloadApp(app)}>
                                        <IconComponent
                                            type="MaterialCommunityIcons"
                                            name="download"
                                            size={scaledSize(16)}
                                            color="#ffffff"
                                        />
                                        <Text style={styles.buttonText}>다운로드</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default DeveloperAppsModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scaleWidth(20),
    },
    container: {
        width: '100%',
        maxHeight: scaleHeight(680),
        backgroundColor: '#ffffff',
        borderRadius: moderateScale(16),
        paddingVertical: scaleHeight(24),
        paddingHorizontal: scaleWidth(20),
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: scaleHeight(4) },
        shadowRadius: 8,
    },
    scroll: {
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: scaleHeight(12),
    },
    titleText: {
        fontSize: scaledSize(20),
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'left',
        flexShrink: 1,
    },
    closeButton: {
        padding: scaleWidth(6),
    },
    closeText: {
        fontSize: scaledSize(22),
        color: '#7f8c8d',
        fontWeight: 'bold',
    },
    appCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        padding: scaleWidth(12),
        borderRadius: scaleWidth(12),
        backgroundColor: '#f8f9fa',
        marginBottom: scaleHeight(14),
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    image: {
        width: scaleWidth(64),
        height: scaleWidth(64),
        borderRadius: scaleWidth(12),
        marginRight: scaleWidth(12),
    },
    textArea: {
        flex: 1,
        marginBottom: scaleHeight(8),
    },
    appTitle: {
        fontSize: scaledSize(18),
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: scaleHeight(4),
    },
    appDesc: {
        fontSize: scaledSize(13),
        color: '#7f8c8d',
        marginBottom: scaleHeight(10),
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: scaleHeight(10),
        width: '100%',
        justifyContent: 'center',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60%',
        paddingHorizontal: scaleWidth(17),
        paddingVertical: scaleHeight(10),
        borderRadius: scaleWidth(8),
        backgroundColor: '#0D96F6', // 다운로드 버튼 색상 (블루)
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: scaleWidth(6),
        fontSize: scaledSize(13),
        textAlign: 'center',
    },
});
