import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconComponent from './common/atomic/IconComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import FastImage from 'react-native-fast-image';
import { LEVEL_DATA, QUIZ_MODES } from '@/const/ConstInfoData';

/**
 * 퀴즈 모드 선택
 * @returns
 */
const InitQuizModeScreen = () => {
	const navigation = useNavigation();
	const USER_QUIZ_HISTORY = MainStorageKeyType.USER_QUIZ_HISTORY;

	const [accordionOpen, setAccordionOpen] = useState(false);
	const [totalScore, setTotalScore] = useState<number>(0);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		const quizRaw = await AsyncStorage.getItem(USER_QUIZ_HISTORY);
		const quiz = quizRaw ? JSON.parse(quizRaw) : {};
		const totalScoreFromQuiz = typeof quiz.totalScore === 'number' ? quiz.totalScore : 0;
		setTotalScore(totalScoreFromQuiz);
	};

	/**
	 * 퀴즈 모드를 전달하여서 다음페이지로 이동
	 * @param mode 'meaning' | 'proverb' | 'blank' | 'comingsoon'
	 */
	const handleSelectMode = (mode: 'meaning' | 'proverb' | 'blank' | 'comingsoon') => {
		// @ts-ignore
		navigation.navigate(Paths.QUIZ_MODE, { mode });
	};

	const getLevelInfoByScore = (score: number) => {
		return LEVEL_DATA.slice().find((l) => score >= l.score) || LEVEL_DATA[0];
	};
	// 이걸 기존 getLevelData 아래에 추가해
	const levelInfo = useMemo(() => getLevelInfoByScore(totalScore), [totalScore]);
	const { mascot } = levelInfo;

	// 수정
	return (
		<SafeAreaView style={styles.main} edges={['bottom']}>
			<View style={styles.container}>
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
						{QUIZ_MODES.map((mode) => {
							const isDisabled = mode.key === 'comingsoon';
							return (
								<TouchableOpacity
									key={mode.key}
									style={[styles.gridButtonHalf, { backgroundColor: mode.color }, isDisabled && styles.disabledButton]}
									activeOpacity={isDisabled ? 1 : 0.7}
									onPress={() => {
										if (isDisabled) {
											Alert.alert('새로운 퀴즈 준비 중', '새로운 퀴즈를 준비 중에 있습니다.');
										} else {
											//@ts-ignore
											handleSelectMode(mode.key);
										}
									}}>
									<View style={isDisabled ? styles.disabledInner : styles.iconTextRow}>
										<IconComponent type={mode.type} name={mode.icon} size={28} color={isDisabled ? '#bdc3c7' : '#ffffff'} />
										<Text style={[styles.modeLabel, isDisabled && styles.disabledText]}>{mode.label}</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>
					{/* ❓ 아코디언 안내 */}
					<TouchableOpacity style={styles.accordionHeader} activeOpacity={0.7} onPress={() => setAccordionOpen((prev) => !prev)}>
						<Text style={styles.accordionHeaderText}>❓ 틀린 문제는 어떻게 다시 풀 수 있나요?</Text>
						<IconComponent type="MaterialIcons" name={accordionOpen ? 'expand-less' : 'expand-more'} size={20} color="#2c3e50" />
					</TouchableOpacity>

					{accordionOpen && (
						<View style={styles.accordionContent}>
							<View style={styles.accordionDescBox}>
								<View style={styles.accordionRow}>
									<IconComponent type="FontAwesome5" name="book" size={16} color="#e67e22" />
									<Text style={styles.accordionText}>틀린 문제는 오답 복습에서 다시 확인할 수 있어요.</Text>
								</View>

								<View style={styles.accordionRow}>
									<IconComponent type="MaterialCommunityIcons" name="reload" size={18} color="#2980b9" />
									<Text style={[styles.accordionText, styles.warningText]}>
										다시 풀기는 설정 탭에서 '퀴즈 다시 풀기'에서 할 수 있지만, 이전 기록이 초기화되니 꼭 참고하세요!
									</Text>
								</View>
							</View>
							<View style={styles.accordionButtonsRow}>
								<TouchableOpacity
									style={[styles.accordionButton, { backgroundColor: '#e67e22' }]}
									// @ts-ignore
									onPress={() => navigation.navigate(Paths.QUIZ_WRONG_REVIEW)}>
									<IconComponent type="FontAwesome5" name="book" size={16} color="#ffffff" />
									<Text style={styles.accordionButtonText}>오답 복습</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.accordionButton, { backgroundColor: '#2980b9' }]}
									// @ts-ignore
									onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.SETTING })}>
									<IconComponent type="MaterialCommunityIcons" name="reload" size={18} color="#ffffff" />
									<Text style={styles.accordionButtonText}>다시 풀기</Text>
								</TouchableOpacity>
							</View>
						</View>
					)}
				</ScrollView>
				<View style={styles.bottomExitWrapper}>
					<TouchableOpacity
						style={styles.homeButton}
						// @ts-ignore
						onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME })}>
						<IconComponent type="FontAwesome6" name="house" size={16} color="#ffffff" style={styles.icon} />
						<Text style={styles.buttonText}>홈으로 가기</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: '#ffffff',
		paddingTop: scaleHeight(5),
	},
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
		paddingHorizontal: scaleWidth(10),
		alignItems: 'center', // 가로 중앙 정렬
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center', // 중앙 정렬 (세로)
		alignItems: 'center', // 중앙 정렬 (가로)
		paddingHorizontal: scaleWidth(16),
		paddingTop: scaleHeight(6),
		paddingBottom: scaleHeight(20),
	},
	gridWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: scaleHeight(20),
		columnGap: scaleWidth(16),
		marginBottom: scaleHeight(16),
		paddingHorizontal: scaleWidth(16),
	},
	gridButtonHalf: {
		width: '46%',
		aspectRatio: 1,
		borderRadius: scaleWidth(16),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		backgroundColor: '#ffffff',
	},
	iconTextRow: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: scaleHeight(10),
	},
	disabledInner: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: scaleHeight(10),
	},
	modeLabel: {
		color: '#ffffff',
		fontSize: scaledSize(18),
		fontWeight: '700',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
	},
	disabledText: {
		color: '#95a5a6',
		fontSize: scaledSize(15),
		fontWeight: '700',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
	},
	disabledButton: {
		opacity: 0.5,
	},
	titleWrap: {
		marginBottom: scaleHeight(20),
		alignItems: 'center',
	},
	titleLine: {
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#2c3e50',
		textAlign: 'center',
		marginBottom: scaleHeight(8),
	},
	bottomExitWrapper: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: scaleHeight(4),
		borderColor: '#ecf0f1',
	},
	homeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#28a745',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(28),
		borderRadius: scaleWidth(30),
	},
	buttonText: {
		color: '#ffffff',
		fontSize: scaledSize(14),
		fontWeight: 'bold',
	},
	icon: {
		marginRight: scaleWidth(6),
	},
	accordionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(12),
		backgroundColor: '#f8f9fa',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		marginBottom: scaleHeight(10),
	},
	accordionHeaderText: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#2c3e50',
	},
	accordionContent: {
		width: '100%',
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#ecf0f1',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(14),
		marginBottom: scaleHeight(20),
	},
	accordionButtonsRow: {
		flexDirection: 'row',
		gap: scaleWidth(12),
		justifyContent: 'center',
		alignItems: 'center',
	},
	accordionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(20),
	},
	accordionButtonText: {
		color: '#ffffff',
		fontSize: scaledSize(14),
		fontWeight: '600',
	},
	accordionDescBox: {
		width: '100%',
		gap: scaleHeight(8),
		marginBottom: scaleHeight(12),
	},
	accordionRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: scaleWidth(8),
	},
	accordionText: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		lineHeight: scaleHeight(20),
	},
	warningText: {
		color: '#c0392b',
		fontWeight: '600',
	},
	mascotSection: {
		width: '100%',
		alignItems: 'center',
		marginTop: scaleHeight(10),
		marginBottom: scaleHeight(20),
	},
	mascotImage: {
		width: scaleWidth(120),
		height: scaleWidth(120),
		borderRadius: scaleWidth(60),
		borderWidth: 1,
		borderColor: '#f1c40f',
		backgroundColor: '#ffffff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(4) },
		shadowOpacity: 0.15,
		shadowRadius: 6,
	},
	mascotCard: {
		width: '100%',
		alignItems: 'center',
		padding: scaleHeight(16),
		marginBottom: scaleHeight(20),
		borderRadius: scaleWidth(16),
		backgroundColor: '#ffffff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(3) },
		shadowOpacity: 0.1,
		shadowRadius: 6,
	},
	levelMascotImage: {
		width: '100%',
		height: '100%',
		borderRadius: scaleWidth(40),
	},
	levelLabel: {
		fontSize: scaledSize(18),
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: scaleHeight(6),
	},
	scoreText: {
		fontSize: scaledSize(14),
		color: '#f39c12',
		fontWeight: '600',
		marginBottom: scaleHeight(10),
	},
	progressBarBackground: {
		width: '80%',
		height: scaleHeight(10),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleWidth(6),
		overflow: 'hidden',
		marginBottom: scaleHeight(6),
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: '#27ae60',
	},
	progressText: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
	},
	levelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(6),
	},
	levelBadgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		marginTop: scaleHeight(8),
		backgroundColor: '#fef9e7',
		paddingVertical: scaleHeight(4),
		paddingHorizontal: scaleWidth(12),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#f1c40f',
	},
	levelBadgeText: {
		fontSize: scaledSize(14),
		fontWeight: '700',
		color: '#e67e22',
	},
});

export default InitQuizModeScreen;
