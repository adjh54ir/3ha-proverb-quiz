import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconComponent from './common/atomic/IconComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import FastImage from 'react-native-fast-image';
import { LEVEL_DATA, QUIZ_MODES } from '@/const/ConstInfoData';
import BottomHomeButton from './common/BottomHomeButton';

/** 모드별 설명 (카드 서브텍스트) */
const MODE_DESC: Record<string, string> = {
	meaning: '속담을 보고 올바른 뜻을 고르세요',
	proverb: '뜻을 보고 알맞은 속담을 고르세요',
	blank: '속담의 빠진 부분을 채워보세요',
	example: '예문 속 빈칸에 들어갈 속담을 고르세요',
};

/**
 * 퀴즈 모드 선택
 */
const InitQuizModeScreen = () => {
	const navigation = useNavigation();
	const USER_QUIZ_HISTORY = MainStorageKeyType.USER_QUIZ_HISTORY;

	const [accordionOpen, setAccordionOpen] = useState(false);
	const [totalScore, setTotalScore] = useState<number>(0);

	const enterAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		const animation = Animated.timing(enterAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true });
		animation.start();
		return () => {
			animation.stop();
			enterAnim.stopAnimation();
		};
	}, [enterAnim]);

	const loadData = async () => {
		const quizRaw = await AsyncStorage.getItem(USER_QUIZ_HISTORY);
		const quiz = quizRaw ? JSON.parse(quizRaw) : {};
		const totalScoreFromQuiz = typeof quiz.totalScore === 'number' ? quiz.totalScore : 0;
		setTotalScore(totalScoreFromQuiz);
	};

	const handleSelectMode = (mode: 'meaning' | 'proverb' | 'blank' | 'example') => {
		// @ts-ignore
		navigation.navigate(Paths.QUIZ_MODE, { mode });
	};

	const getLevelInfoByScore = (score: number) => LEVEL_DATA.slice().find((l) => score >= l.score) || LEVEL_DATA[0];
	const levelInfo = useMemo(() => getLevelInfoByScore(totalScore), [totalScore]);
	const { mascot } = levelInfo;

	return (
		<SafeAreaView style={styles.main} edges={['bottom']}>
			<View style={styles.container}>
				<Animated.View
					style={{
						flex: 1,
						width: '100%',
						opacity: enterAnim,
						transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(18), 0] }) }],
					}}>
					<ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
						<View style={styles.mascotSection}>
							<FastImage source={mascot} style={styles.mascotImage} resizeMode={FastImage.resizeMode.contain} />
							<View style={styles.levelBadgeRow}>
								<IconComponent type="FontAwesome5" name={levelInfo.icon} size={16} color="#f39c12" />
								<Text style={styles.levelBadgeText}>{levelInfo.label}</Text>
							</View>
						</View>

						<View style={styles.titleWrap}>
							<Text style={styles.titleLine}>🧩 퀴즈 준비됐나요?</Text>
							<Text style={styles.titleLine}>도전하려는 퀴즈 모드를 선택하세요!</Text>
						</View>

						<View style={styles.gridWrap}>
							{QUIZ_MODES.map((mode) => (
								<TouchableOpacity key={mode.key} style={styles.modeCardFull} activeOpacity={0.85} onPress={() => handleSelectMode(mode.key as any)}>
									<View style={[styles.modeIconChipFull, { backgroundColor: mode.color }]}>
										<IconComponent type={mode.type} name={mode.icon} size={scaledSize(24)} color="#fff" />
									</View>
									<View style={styles.modeTextWrap}>
										<Text style={[styles.modeLabelFull, { color: mode.color }]} numberOfLines={1}>
											{mode.label}
										</Text>
										<Text style={styles.modeDescFull} numberOfLines={2}>
											{MODE_DESC[mode.key] ?? ''}
										</Text>
									</View>
									<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color="#CBD5E1" />
								</TouchableOpacity>
							))}
						</View>

						<TouchableOpacity style={styles.accordionHeader} activeOpacity={0.7} onPress={() => setAccordionOpen((prev) => !prev)}>
							<Text style={styles.accordionHeaderText}>❓ 틀린 문제는 어떻게 다시 풀 수 있나요?</Text>
							<IconComponent type="MaterialIcons" name={accordionOpen ? 'expand-less' : 'expand-more'} size={20} color="#334155" />
						</TouchableOpacity>

						{accordionOpen && (
							<View style={styles.accordionContent}>
								<View style={styles.accordionDescBox}>
									<View style={styles.accordionRow}>
										<IconComponent type="FontAwesome5" name="book" size={16} color="#F97316" />
										<Text style={styles.accordionText}>틀린 문제는 오답 복습에서 다시 확인할 수 있어요.</Text>
									</View>
									<View style={styles.accordionRow}>
										<IconComponent type="MaterialCommunityIcons" name="reload" size={18} color="#22C55E" />
										<Text style={[styles.accordionText, styles.warningText]}>다시 풀기는 설정 탭에서 '퀴즈 다시 풀기'에서 할 수 있지만, 이전 기록이 초기화되니 꼭 참고하세요!</Text>
									</View>
								</View>
								<View style={styles.accordionButtonsRow}>
									<TouchableOpacity
										style={[styles.accordionButton, { backgroundColor: '#F97316' }]}
										// @ts-ignore
										onPress={() => navigation.navigate(Paths.QUIZ_WRONG_REVIEW)}>
										<IconComponent type="FontAwesome5" name="book" size={16} color="#fff" />
										<Text style={styles.accordionButtonText}>오답 복습</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.accordionButton, { backgroundColor: '#3B82F6' }]}
										// @ts-ignore
										onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.SETTING })}>
										<IconComponent type="MaterialCommunityIcons" name="reload" size={18} color="#fff" />
										<Text style={styles.accordionButtonText}>다시 풀기</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</ScrollView>
				</Animated.View>
			</View>
			<BottomHomeButton backgroundColor="#F8FAFC" />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	main: { flex: 1, backgroundColor: '#F8FAFC' },
	container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: scaleWidth(10), alignItems: 'center' },
	scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scaleWidth(14), paddingTop: scaleHeight(6), paddingBottom: scaleHeight(20) },
	mascotSection: { width: '100%', alignItems: 'center', marginTop: scaleHeight(10), marginBottom: scaleHeight(20) },
	mascotImage: {
		width: scaleWidth(120),
		height: scaleWidth(120),
		borderRadius: scaleWidth(60),
		borderWidth: 1,
		borderColor: '#FBBF24',
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 6,
	},
	levelBadgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		marginTop: scaleHeight(8),
		backgroundColor: '#FFFBEB',
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(12),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#FDE68A',
	},
	levelBadgeText: { fontSize: scaledSize(14), fontWeight: '700', color: '#B45309' },
	titleWrap: { marginBottom: scaleHeight(20), alignItems: 'center' },
	titleLine: { fontSize: scaledSize(18), fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: scaleHeight(6) },
	gridWrap: { width: '100%', rowGap: scaleHeight(12), marginBottom: scaleHeight(16) },
	modeCardFull: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(14),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(16),
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#EEF2F7',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(8),
	},
	modeIconChipFull: { width: scaleWidth(48), height: scaleWidth(48), borderRadius: scaleWidth(14), justifyContent: 'center', alignItems: 'center' },
	modeTextWrap: { flex: 1 },
	modeLabelFull: { fontSize: scaledSize(16), fontWeight: '800', marginBottom: scaleHeight(3) },
	modeDescFull: { color: '#64748B', fontSize: scaledSize(12.5), lineHeight: scaleHeight(17) },
	accordionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(12),
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#E2E8F0',
		marginBottom: scaleHeight(10),
	},
	accordionHeaderText: { fontSize: scaledSize(15), fontWeight: '700', color: '#334155' },
	accordionContent: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: scaleWidth(12), padding: scaleWidth(14), marginBottom: scaleHeight(20) },
	accordionButtonsRow: { flexDirection: 'row', gap: scaleWidth(12), justifyContent: 'center', alignItems: 'center' },
	accordionButton: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6), paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(16), borderRadius: scaleWidth(20) },
	accordionButtonText: { color: '#fff', fontSize: scaledSize(14), fontWeight: '600' },
	accordionDescBox: { width: '100%', gap: scaleHeight(8), marginBottom: scaleHeight(12) },
	accordionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: scaleWidth(8) },
	accordionText: { flex: 1, fontSize: scaledSize(13), color: '#64748B', lineHeight: scaleHeight(20) },
	warningText: { color: '#DC2626', fontWeight: '600' },
});

export default InitQuizModeScreen;
