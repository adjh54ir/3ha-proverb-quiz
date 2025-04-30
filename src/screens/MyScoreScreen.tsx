import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,
    Alert,
    Modal,
    LayoutAnimation,
    FlatList,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import 'moment/locale/ko'; // 한국어 로케일 import
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import ProverbServices from '@/services/ProverbServices';
import { CONST_BADGES } from '@/const/ConstBadges';

moment.locale('ko'); // 로케일 설정

const STORAGE_KEY_STUDY = 'UserStudyHistory';
const STORAGE_KEY_QUIZ = 'UserQuizHistory';

const CapitalResultScreen = () => {
    const isFocused = useIsFocused();
    const scrollRef = useRef<ScrollView>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
    const [totalScore, setTotalScore] = useState<number>(0);
    const [levelMaster, setLevelMaster] = useState<string[]>([]);
    const [correctCount, setCorrectCount] = useState<number>(0);
    const [wrongCount, setWrongCount] = useState<number>(0);
    const [lastAnsweredAt, setLastAnsweredAt] = useState<string>('');
    const [bestCombo, setBestCombo] = useState<number>(0);
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [showBadgeList, setShowBadgeList] = useState(false);
    const [studyCountries, setStudyCountries] = useState<string[]>([]);
    const [lastStudyAt, setLastStudyAt] = useState<string>('');
    const [totalStudyCount, setTotalStudyCount] = useState<number>(0);

    const [categoryMaster, setCategoryMaster] = useState<string[]>([]);
    const [totalCountryCount, setTotalCountryCount] = useState<number>(0);

    const DIFFICULTIES = [
        { key: 'Level 1', title: 'Level 1', subtitle: '아주 쉬움', icon: 'seedling' },
        { key: 'Level 2', title: 'Level 2', subtitle: '쉬움', icon: 'leaf' },
        { key: 'Level 3', title: 'Level 3', subtitle: '보통', icon: 'tree' },
        { key: 'Level 4', title: 'Level 4', subtitle: '어려움', icon: 'trophy' },
    ];

    const getContinentColor = (key: string): string => {
        switch (key) {
            case 'Europe':
                return '#7B68EE';
            case 'Asia':
                return '#E74C3C';
            case 'Americas':
                return '#3498DB';
            case 'Africa':
                return '#F39C12';
            case 'Oceania':
                return '#1ABC9C';
            case 'Antarctic':
                return '#AEDFF7';
            default:
                return '#0A84FF';
        }
    };


    useEffect(() => {
        if (isFocused) handleScrollToTop();
    }, [isFocused]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, []),
    );
    const getLevelColor = (key: string): string => {
        switch (key) {
            case 'Level 1':
                return '#85C1E9'; // 연한 파랑
            case 'Level 2':
                return '#F4D03F'; // 노랑
            case 'Level 3':
                return '#EB984E'; // 주황
            case 'Level 4':
                return '#E74C3C'; // 빨강
            default:
                return '#0A84FF'; // 기본 파랑
        }
    };

    const loadData = async () => {
        try {
            const studyData = await AsyncStorage.getItem(STORAGE_KEY_STUDY);
            const quizData = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);

            const studyBadges = studyData ? (JSON.parse(studyData)?.badges ?? []) : [];
            const quizJson = quizData ? JSON.parse(quizData) : null;
            const quizBadges = quizJson?.badges ?? [];
            const studyJson = studyData ? JSON.parse(studyData) : null;
            // const studiedIds: number[] = studyJson?.studyCountries ?? [];
            const studiedIds: number[] = studyJson?.studyCountries ?? [];
            const studyCounts = studyJson?.studyCounts ?? {};
            const lastDate = studyJson?.lastStudyAt ?? '';

            const allProverbs = ProverbServices.selectProverbList();
            setTotalCountryCount(allProverbs.length);
            setStudyCountries(studiedIds.map(String)); // 화면 출력용
            setLastStudyAt(lastDate);
            const totalCount = (Object.values(studyCounts) as number[]).reduce((a, b) => a + b, 0);
            setTotalStudyCount(totalCount);

            setTotalScore(quizJson?.totalScore ?? 0);
            setCorrectCount(quizJson?.correctCountries?.length ?? 0);
            setWrongCount(quizJson?.wrongCountries?.length ?? 0);
            setLastAnsweredAt(quizJson?.lastAnsweredAt ?? '');
            setBestCombo(quizJson?.bestCombo ?? 0);

            const allBadges = [...new Set([...studyBadges, ...quizBadges])];
            setEarnedBadgeIds(allBadges);


            const levelNames = ProverbServices.selectMasterLevelsByStudyIds(studiedIds);
            setLevelMaster(levelNames);

            const studiedCategories = allProverbs
                .filter((item) => studiedIds.includes(item.id)) // ✅ number끼리 비교
                .map((item) => item.category);
            setCategoryMaster(Array.from(new Set(studiedCategories)));
        } catch (e) {
            console.error('❌ 데이터 로딩 실패:', e);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData().finally(() => setRefreshing(false)); // ✅ 이 방식 권장
    };

    const handleScrollToTop = () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const toggleBadgeList = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowBadgeList((prev) => !prev);
    };

    const totalSolved = correctCount + wrongCount;
    const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;
    const levelGuide = [
        { score: 0, next: 600, label: '여행 초보자', icon: 'seedling' },
        { score: 600, next: 1200, label: '여행 입문자', icon: 'leaf' },
        { score: 1200, next: 1800, label: '여행 전문가', icon: 'tree' },
        { score: 1800, next: 2461, label: '월드마스터', icon: 'trophy' },
    ];

    const getEncourageMessage = (score: number) => {
        if (score >= 1800) return '🌎 당신은 월드 마스터! 모두가 당신을 주목해요!';
        if (score >= 1200) return '🌍 이제 마스터까지 한 걸음! 계속 도전해요!';
        if (score >= 600) return '✈️ 더 넓은 세계가 당신을 기다리고 있어요!';
        return '🚀 지금부터 시작이에요! 차근차근 도전해봐요!';
    };
    // getTitleByScore 함수 추가
    const getTitleByScore = (score: number) => {
        if (score >= 1800)
            return { label: '월드마스터', icon: 'trophy', mascot: require('@/assets/images/level4_mascote_back.png') };
        if (score >= 1200)
            return { label: '여행 전문가', icon: 'tree', mascot: require('@/assets/images/level3_mascote_back.png') };
        if (score >= 600)
            return { label: '여행 입문자', icon: 'leaf', mascot: require('@/assets/images/level2_mascote_back.png') };
        return { label: '여행 초보자', icon: 'seedling', mascot: require('@/assets/images/level1_mascote_back.png') };
    };
    const { label, icon, mascot } = getTitleByScore(totalScore);

    return (
        <SafeAreaView style={styles.safeArea} >
            <ScrollView
                ref={scrollRef}
                style={styles.container}
                refreshControl={< RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <View style={styles.sectionBox}>
                    <View style={{ alignItems: 'center', marginVertical: 20 }}>
                        <FastImage source={mascot} style={{ width: 120, height: 120 }} resizeMode={FastImage.resizeMode.contain} />
                    </View>
                    < View style={styles.levelCenteredRow} >
                        <View style={styles.levelIconWrap}>
                            <IconComponent type='fontAwesome6' name={icon} size={18} color='#27ae60' />
                        </View>

                        < Text style={styles.levelTitle} >
                            {label} < Text style={styles.levelScoreText} > ({totalScore}점)</Text>
                        </Text>

                        < TouchableOpacity onPress={() => setShowLevelModal(true)}>
                            <IconComponent
                                type='materialIcons'
                                name='info-outline'
                                size={16}
                                color='#7f8c8d'
                                style={{ marginLeft: 4, marginTop: 1 }}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 👇 간단한 설명으로 변경 */}
                    <Text style={styles.levelDescription}>
                        모든 퀴즈를 풀면 < Text style={{ fontWeight: 'bold' }}> 월드마스터 </Text> 등급을 획득할 수 있습니다.
                    </Text>
                    < Text style={styles.levelDescription} >
                        틀린 퀴즈는 < Text style={{ fontWeight: 'bold' }}> 오답 복습 </Text>으로 다시 점수를 얻을 수 있습니다.
                    </Text>
                </View>

                < Text style={[styles.sectionTitle, { marginTop: 20 }]} >📚 나의 학습 활동 </Text>
                < View style={styles.activityCardBox} >
                    <View style={styles.summaryStatGrid}>
                        <View style={styles.summaryStatCard}>
                            <Text style={styles.statIcon}>🎯</Text>
                            < Text style={styles.statValue} >
                                {studyCountries.length} / {totalCountryCount}
                            </Text>
                            < Text style={styles.statLabel} >
                                학습 완료 국가({Math.round((studyCountries.length / totalCountryCount) * 100)} %)
                            </Text>
                        </View>
                        < View style={styles.summaryStatCard} >
                            <Text style={styles.statIcon}>📆</Text>
                            < Text style={styles.statValue} > {lastStudyAt ? moment(lastStudyAt).format('YY.MM.DD') : '없음'} </Text>
                            < Text style={styles.statLabel} > 마지막 학습일 </Text>
                        </View>
                    </View>
                </View>

                {/* 나의 퀴즈 활동 요약 */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📊 나의 퀴즈 활동 </Text>
                < View style={styles.activityCardBox} >
                    <View style={styles.summaryStatCard}>
                        <Text style={styles.statIcon}>🧮</Text>
                        < Text style={styles.statValue} >
                            {totalSolved} / {totalCountryCount}
                        </Text>
                        < Text style={styles.statLabel} > 총 푼 퀴즈({Math.round((totalSolved / totalCountryCount) * 100)} %) </Text>
                        < View style={styles.progressBarBackground} >
                            <View style={[styles.progressBarFill, { width: `${Math.round((totalSolved / totalCountryCount) * 100)}%` }]} />
                        </View>
                    </View>
                    < View style={styles.summaryStatGrid} >
                        <View style={styles.summaryStatCard}>
                            <Text style={styles.statIcon}>🔥</Text>
                            < Text style={styles.statValue} > {bestCombo} Combo </Text>
                            < Text style={styles.statLabel} > 최고 콤보 </Text>
                        </View>
                        < View style={styles.summaryStatCard} >
                            <Text style={styles.statIcon}>✅</Text>
                            < Text style={styles.statValue} > {accuracy} % </Text>
                            < Text style={styles.statLabel} > 정답률 </Text>
                        </View>
                        < View style={styles.summaryStatCard} >
                            <Text style={styles.statIcon}>📅</Text>
                            < Text style={styles.statValue} > {lastAnsweredAt ? moment(lastAnsweredAt).format('YY.MM.DD') : '없음'} </Text>
                            < Text style={styles.statLabel} > 마지막 퀴즈일 </Text>
                        </View>
                    </View>

                    {/* ✅ 정복한 카테고리 출력 */}
                    <View style={styles.subSectionBox1}>
                        <Text style={styles.sectionSubtitle}>🧠 정복한 카테고리</Text>
                        <Text style={styles.regionHelperText}>- 다양한 분야의 속담을 학습해보세요!</Text>
                        <View style={styles.gridRowNoBottomGap}>
                            {categoryMaster.map((category) => (
                                <View key={category} style={styles.regionCard}>
                                    <Text style={styles.regionText}>{category}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    < View style={styles.subSectionBox2} >
                        <Text style={styles.sectionSubtitle}>🏅 정복한 레벨 </Text>
                        < Text style={styles.levelHelperText} > - 각 레벨을 마스터하며 진정한 수도 퀴즈 고수가 되어보세요! </Text>
                        < View style={{ alignItems: 'center' }}>
                            <FlatList
                                data={DIFFICULTIES}
                                style={{ marginTop: 6 }}
                                keyExtractor={(item) => item.key}
                                numColumns={2}
                                scrollEnabled={false}
                                columnWrapperStyle={{ justifyContent: 'space-around' }} // 👈 요렇게 조정
                                renderItem={({ item }) => {
                                    const isEarned = levelMaster.includes(item.title);
                                    const levelColor = getLevelColor(item.key);
                                    return (
                                        <View
                                            style={
                                                [
                                                    styles.levelCard,
                                                    isEarned && {
                                                        backgroundColor: levelColor,
                                                        borderColor: '#5D6D7E',
                                                    },
                                                ]} >
                                            <IconComponent
                                                name={item.icon}
                                                type='fontAwesome6'
                                                size={22}
                                                color={isEarned ? '#fff' : '#bdc3c7'}
                                                style={{ marginBottom: 4 }
                                                }
                                            />
                                            < Text style={[styles.levelText, isEarned && { color: '#fff', fontWeight: 'bold' }]} > {item.title} </Text>
                                            < Text style={[styles.levelSubText, isEarned && { color: '#fff' }]} > {item.subtitle} </Text>
                                        </View>
                                    );
                                }}
                            />
                        </View>
                    </View>
                </View>

                {/* 1. 나의 뱃지 목록 (획득한 뱃지만 보여줌) */}
                <Text style={styles.sectionTitle}>🏅 획득한 뱃지 목록 </Text>
                < View style={styles.sectionBox} >
                    {
                        earnedBadgeIds.length === 0 ? (
                            <Text style={styles.emptyText} > 획득한 뱃지가 없습니다.</Text>
                        ) : (
                            earnedBadgeIds.map((badgeId) => {
                                const badge = CONST_BADGES.find((b) => b.id === badgeId);
                                if (!badge) return null;
                                return (
                                    <View key={badge.id} style={[styles.badgeCard, styles.badgeCardActive]} >
                                        <View style={[styles.iconBox, styles.iconBoxActive]}>
                                            <IconComponent name={badge.icon} type={badge.iconType} size={20} color='#27ae60' />
                                        </View>
                                        < View style={styles.textBox} >
                                            <Text style={[styles.badgeTitle, styles.badgeTitleActive]}> {badge.name} </Text>
                                            < Text style={[styles.badgeDesc, styles.badgeDescActive]} > {badge.description} </Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                </View>

                {/* 2. 전체 중 미획득 뱃지만 아코디언에 출력 */}
                <TouchableOpacity onPress={toggleBadgeList} style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#27ae60', textAlign: 'right' }}>
                        {showBadgeList ? '뱃지 목록 닫기 ▲' : '획득 가능한 뱃지 보기 ▼'}
                    </Text>
                </TouchableOpacity>

                {
                    showBadgeList && (
                        <View style={styles.sectionBox}>
                            {
                                CONST_BADGES.filter((badge) => !earnedBadgeIds.includes(badge.id)).length === 0 ? (
                                    <Text style={styles.emptyText} > 모든 뱃지를 획득했어요! 🎉</Text>
                                ) : (
                                    CONST_BADGES.filter((badge) => !earnedBadgeIds.includes(badge.id)).map((badge) => (
                                        <View key={badge.id} style={styles.badgeCard} >
                                            <View style={styles.iconBox} >
                                                <IconComponent name={badge.icon} type={badge.iconType} size={20} color='#2c3e50' />
                                            </View>
                                            < View style={styles.textBox} >
                                                <Text style={styles.badgeTitle} > {badge.name} </Text>
                                                < Text style={styles.badgeDesc} > {badge.description} </Text>
                                            </View>
                                        </View>
                                    ))
                                )
                            }
                        </View>
                    )}
            </ScrollView>
            < View style={styles.adContainer} >
                <AdmobBannerAd marginBottom={0} />
            </View>

            < Modal visible={showLevelModal} transparent animationType='fade' >
                <View style={styles.modalOverlay}>
                    <View style={styles.levelModal}>
                        <Text style={styles.levelModalTitle}> 등급 안내 </Text>
                        {
                            levelGuide
                                .slice()
                                .reverse()
                                .map((item) => {
                                    const isCurrent = totalScore >= item.score && totalScore < item.next;
                                    const mascotImage = getTitleByScore(item.score).mascot;
                                    return (
                                        <View key={item.label} style={[styles.levelCardBox, isCurrent && styles.levelCardBoxActive]} >
                                            {isCurrent && (
                                                <View style={styles.levelBadge}>
                                                    <Text style={styles.levelBadgeText}>🏆 현재 등급 </Text>
                                                </View>
                                            )
                                            }
                                            <FastImage source={mascotImage} style={styles.levelMascot} resizeMode={FastImage.resizeMode.contain} />
                                            <Text style={styles.levelLabel}> {item.label} </Text>
                                            < Text style={styles.levelScore} > {item.score}점 이상 </Text>
                                            {isCurrent && <Text style={styles.levelEncourage}> {getEncourageMessage(item.score)} </Text>}
                                        </View>
                                    );
                                })}
                        <TouchableOpacity onPress={() => setShowLevelModal(false)} style={styles.modalConfirmButton} >
                            <Text style={styles.modalConfirmText}> 닫기 </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default CapitalResultScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { paddingHorizontal: 16, paddingTop: 20 },
    pageTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
    badgeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    badgeCardActive: {
        borderColor: '#27ae60',
        backgroundColor: '#f0fbf4',
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconBoxActive: {
        backgroundColor: '#d0f0dc',
    },
    badgeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
    },
    badgeTitleActive: {
        color: '#27ae60',
    },
    badgeDesc: {
        fontSize: 13,
        color: '#7f8c8d',
        marginTop: 2,
        lineHeight: 18,
    },
    badgeDescActive: {
        color: '#2d8659',
    },
    sectionBox: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ddd',
    },

    subSectionBox1: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    subSectionBox2: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#2c3e50' },
    statItem: { fontSize: 14, color: '#34495e', marginBottom: 6 },
    subTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50', marginBottom: 6 },
    tagItem: { fontSize: 14, color: '#27ae60', marginBottom: 4 },
    emptyText: { fontSize: 13, color: '#95a5a6' },
    textBox: { flex: 1 },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    quizSummaryBox: {
        backgroundColor: '#f4f6f7',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        marginBottom: 16,
    },
    levelIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#27ae60',
        backgroundColor: '#eafaf1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 2,
    },
    levelModal: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        width: '85%',
        alignItems: 'center',
    },
    levelModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#2c3e50',
    },
    levelRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    levelRowItemActive: {
        backgroundColor: '#eafaf1',
        borderColor: '#27ae60',
    },
    levelIconWrapSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#d0f0dc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    levelModalText: {
        flex: 1,
        fontSize: 14,
        color: '#2c3e50',
    },
    levelModalScore: {
        fontSize: 13,
        color: '#7f8c8d',
    },
    levelNowText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#27ae60',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalConfirmButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: '#27ae60',
        borderRadius: 8,
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    levelCenteredRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    levelDescription: {
        fontSize: 13,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 4,
        paddingHorizontal: 6,
    },
    levelScoreText: {
        fontSize: 13,
        color: '#7f8c8d',
        textAlign: 'center',
        marginTop: 4,
    },

    levelScoreHighlight: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27ae60',
        marginTop: 4,
    },
    activityCardBox: {
        backgroundColor: '#f4f6f7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    activityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    activityLabel: {
        fontSize: 14,
        color: '#2c3e50',
    },
    activityValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#34495e',
    },

    summaryCard: {
        backgroundColor: '#fff8e1',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1c40f',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f39c12',
        marginBottom: 8,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        color: '#2c3e50',
        marginRight: 12,
    },
    progressBarBackground: {
        width: '80%', // 약간 좁게 해서 정중앙 느낌 강조
        height: 6,
        backgroundColor: '#ecf0f1',
        borderRadius: 3,
        marginTop: 6,
        alignSelf: 'center', // 👉 중앙 정렬 추가
    },
    progressBarFill: {
        height: 6,
        backgroundColor: '#27ae60',
        borderRadius: 3,
    },
    gridRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    regionCard: {
        width: '30%',
        aspectRatio: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginBottom: 12, // ✅ 카드 간 하단 여백 추가
        marginHorizontal: 5, // ✅ 좌우 간격 추가
    },
    levelCard: {
        width: 120, // ✅ 픽셀 고정이 안정적 (또는 Dimensions로 계산해도 OK)
        aspectRatio: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 8, // ✅ 카드 간 간격
        marginBottom: 12,
    },
    regionText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#7f8c8d', // 기본 회색
    },
    levelText: {
        fontSize: 15, // ✅ 12 → 14
        textAlign: 'center',
        color: '#7f8c8d',
    },
    cardActive: {
        backgroundColor: '#f0fbf4',
        elevation: 3,
    },
    summaryStatGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    summaryStatCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 16,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ecf0f1',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        marginBottom: 12,
    },

    statIcon: {
        fontSize: 22,
        marginBottom: 4,
    },

    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },

    statLabel: {
        fontSize: 13,
        color: '#7f8c8d',
    },
    regionSubText: {
        fontSize: 10,
        color: '#b0b0b0',
        textAlign: 'center',
        marginTop: 1,
        lineHeight: 13,
        fontWeight: '400',
    },
    levelSubText: {
        fontSize: 12,
        color: '#b0b0b0',
        textAlign: 'center',
        marginTop: 1,
        lineHeight: 13,
        fontWeight: '400',
    },
    sectionSubtitle: {
        fontSize: 15, // 좀 더 작은 폰트
        color: '#2c3e50',
        marginBottom: 12,
        marginTop: 8,
        fontWeight: 'bold',
    },
    gridRowNoBottomGap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingBottom: 6, // 또는 marginBottom: -6
    },
    levelCardBox: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    levelCardBoxActive: {
        backgroundColor: '#eafaf1',
    },
    levelBadge: {
        backgroundColor: '#27ae60',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginBottom: 6,
    },
    levelBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    levelMascot: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    levelLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    levelScore: {
        fontSize: 13,
        color: '#7f8c8d',
    },
    levelEncourage: {
        fontSize: 13,
        color: '#27ae60',
        marginTop: 4,
    },
    regionHelperText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 10,
    },
    levelHelperText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 3,
        marginBottom: 15,
    },
    adContainer: {
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
});
