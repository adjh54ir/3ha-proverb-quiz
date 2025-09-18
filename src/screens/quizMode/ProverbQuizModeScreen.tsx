import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { Paths } from '@/navigation/conf/Paths';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import FastImage from 'react-native-fast-image';
import { LEVEL_DATA, QUIZ_MODES } from '@/const/common/CommonMainData';
import IconComponent from '../common/atomic/IconComponent';

/**
 * 퀴즈 모드 선택
 * @returns
 */
const ProverbQuizModeScreen = () => {
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

	const moveToHandler = (modeKey: string) => {
		console.log("여기로 전달하고 있나")
		switch (modeKey) {
			case 'meaning':
				// @ts-ignore
				navigation.push(Paths.PROVERB_MEANING_QUIZ, { mode: 'meaning' });
				break;
			case 'proverb':
				// @ts-ignore
				navigation.push(Paths.PROVERB_FIND_QUIZ, { mode: 'proverb' });
				break;
			case 'blank':
				// @ts-ignore
				navigation.push(Paths.PROVERB_BLANK_QUIZ, { mode: 'fill-blank' });
				break;
			default:
				break;
		}
	};

	const getLevelInfoByScore = (score: number) => {
		return LEVEL_DATA.slice().find((l) => score >= l.score) || LEVEL_DATA[0];
	};
	// 이걸 기존 getLevelData 아래에 추가해
	const levelInfo = useMemo(() => getLevelInfoByScore(totalScore), [totalScore]);
	// 수정
	const { mascot, label, next, icon } = levelInfo;
	const progress = useMemo(() => {
		if (!next) return 1;
		const prevScore = LEVEL_DATA.find((l) => l.score === levelInfo.score - 830)?.score || 0;
		return Math.min((totalScore - prevScore) / (next - prevScore), 1);
	}, [totalScore, levelInfo]);
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: scaleHeight(5) }} edges={['bottom']}>
			<View style={styles.container}>

				<ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
					<View style={styles.mascotCard}>
						<FastImage source={mascot} style={styles.mascotImage} resizeMode={FastImage.resizeMode.contain} />

						{/* 라벨 + 아이콘 한 줄 */}
						<View style={styles.levelRow}>
							<IconComponent
								type="FontAwesome5"
								name={icon}
								size={17}
								color={label === '속담 마스터' ? '#FFD700' : '#27ae60'} // ✅ 조건 분기
								style={{ marginRight: scaleWidth(6) }}
							/>
							<Text style={styles.levelLabel}>{label}</Text>
						</View>

						<Text style={styles.scoreText}>총 점수: {totalScore}점</Text>

						{/* 진행도 바 */}
						<View style={styles.progressBarBackground}>
							<View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
						</View>
						{next && (
							<Text style={styles.progressText}>
								다음 레벨까지 {next - totalScore}점 남음
							</Text>
						)}
					</View>
					<View style={styles.titleWrap}>
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
											moveToHandler(mode.key);
										}
									}}>
									<View style={isDisabled ? styles.disabledInner : styles.iconTextRow}>
										<IconComponent type={mode.type} name={mode.icon} size={28} color={isDisabled ? '#bdc3c7' : '#fff'} />
										<Text style={[styles.modeLabel, isDisabled && styles.disabledText]}>{mode.label}</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>
					{/* ❓ 아코디언 안내 */}
					<TouchableOpacity
						style={styles.accordionHeader}
						activeOpacity={0.7}
						onPress={() => setAccordionOpen((prev) => !prev)}>
						<Text style={styles.accordionHeaderText}>❓ 틀린 문제는 어떻게 다시 풀 수 있나요?</Text>
						<IconComponent
							type="MaterialIcons"
							name={accordionOpen ? 'expand-less' : 'expand-more'}
							size={20}
							color="#2c3e50"
						/>
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
									<IconComponent type="FontAwesome5" name="book" size={16} color="#fff" />
									<Text style={styles.accordionButtonText}>오답 복습</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.accordionButton, { backgroundColor: '#2980b9' }]}
									// @ts-ignore
									onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.SETTING })}>
									<IconComponent type="MaterialCommunityIcons" name="reload" size={18} color="#fff" />
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
						<IconComponent type="FontAwesome6" name="house" size={16} color="#fff" style={styles.icon} />
						<Text style={styles.buttonText}>홈으로 가기</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fefefe',
		paddingHorizontal: scaleWidth(10),
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(6),
		paddingBottom: scaleHeight(20),
		marginBottom: scaleHeight(150),
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
		backgroundColor: '#fff',
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
		color: '#fff',
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
		borderColor: '#ddd',
		marginBottom: scaleHeight(10),
	},
	accordionHeaderText: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#2c3e50',
	},
	accordionContent: {
		width: '100%',
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#eee',
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
		color: '#fff',
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
		color: '#555',
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
	},
	mascotCard: {
		width: '100%',
		alignItems: 'center',
		padding: scaleHeight(16),
		marginBottom: scaleHeight(20),
		borderRadius: scaleWidth(16),
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
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
});

export default ProverbQuizModeScreen;
