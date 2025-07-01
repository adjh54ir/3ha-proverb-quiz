import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils'; // 필요 시 사용자 유틸로 교체
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import IconComponent from './common/atomic/IconComponent';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

const InitTimeChallengeScreen = () => {
	const STORAGE_KEY = MainStorageKeyType.TIME_CHALLENGE_HISTORY;
	const navigation = useNavigation();
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const [count, setCount] = useState(3);
	const [showAllRules, setShowAllRules] = useState(false);
	const [isCountingDown, setIsCountingDown] = useState(false);
	const [top5History, setTop5History] = useState<MainDataType.TimeChallengeResult[]>([]);

	useEffect(() => {
		fetchTopHistory();
	}, []);

	// useEffect 바깥에 함수 이동
	const fetchTopHistory = async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY);
			const history: MainDataType.TimeChallengeResult[] = raw ? JSON.parse(raw) : [];

			const sorted = history.sort((a, b) => b.finalScore - a.finalScore);
			setTop5History(sorted.slice(0, 5));
		} catch (e) {
			console.error('기록 불러오기 실패', e);
		}
	};

	// ISO 형식 대응 버전
	const getRelativeDateLabel = (isoString: string): string => {
		try {
			const inputDate = new Date(isoString);
			const now = new Date();

			const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const startOfInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

			const diffMs = startOfToday.getTime() - startOfInput.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

			const hour = inputDate.getHours();
			const minute = inputDate.getMinutes();
			const timeStr = `${hour}:${String(minute).padStart(2, '0')}`;

			if (diffDays === 0) {
				return `오늘, ${timeStr}`;
			}
			if (diffDays === 1) {
				return `어제, ${timeStr}`;
			}
			if (diffDays === 2) {
				return `그제, ${timeStr}`;
			}
			if (diffDays < 7) {
				return `${diffDays}일 전`;
			}
			if (diffDays < 30) {
				return `${Math.floor(diffDays / 7)}주 전`;
			}

			const y = inputDate.getFullYear();
			const m = String(inputDate.getMonth() + 1).padStart(2, '0');
			const d = String(inputDate.getDate()).padStart(2, '0');
			return `${y}. ${m}. ${d}. ${timeStr}`;
		} catch {
			return isoString;
		}
	};

	const handleStartChallenge = () => {
		setIsCountingDown(true);
		setShowAllRules(false);

		let countdown = 3;
		setCount(countdown); // 시작 시 3 한 번만 세팅
		animateScale(); // 첫 애니메이션도 같이 실행

		const timer = setInterval(() => {
			countdown--;

			if (countdown < 0) {
				clearInterval(timer);

				setTimeout(() => {
					setIsCountingDown(false);
					// @ts-ignore
					navigation.navigate(Paths.TIME_CHANLLENGE);
				}, 800);
				return;
			}

			setCount(countdown);
			animateScale();
		}, 1000);
	};

	const animateScale = () => {
		scaleAnim.setValue(1.5);
		Animated.spring(scaleAnim, {
			toValue: 1,
			useNativeDriver: true,
			friction: 4,
		}).start();
	};

	const clearDummyHistory = async () => {
		try {
			await AsyncStorage.removeItem(STORAGE_KEY);
			setTop5History([]);
			alert('기록이 삭제되었습니다!');
		} catch (e) {
			console.error('기록 삭제 실패', e);
		}
	};

	// const createDummyTimeChallengeResult = (): MainDataType.TimeChallengeResult => {
	// 	const now = new Date();
	// 	const isoDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
	// 	const time = now.toTimeString().split(':').slice(0, 2).join(':'); // HH:mm
	// 	const formattedDate = `${isoDate} ${time}`;

	// 	return {
	// 		quizDate: formattedDate,
	// 		finalScore: Math.floor(Math.random() * 200) + 50,
	// 		totalQuestions: 20,
	// 		solvedQuestions: 18,
	// 		correctCount: 15,
	// 		wrongCount: 3,
	// 		maxCombo: 7,
	// 		timeUsedMs: Math.floor(Math.random() * 180000),
	// 		hasUsedSkip: Math.random() < 0.5,
	// 		quizIdList: [1, 2, 3, 4, 5],
	// 		correctQuizIdList: [1, 2, 3],
	// 		wrongQuizIdList: [4, 5],
	// 	};
	// };

	const saveDummyToStorage = async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY);
			const history: MainDataType.TimeChallengeResult[] = raw ? JSON.parse(raw) : [];

			// 10개의 서로 다른 시간으로 더미 생성
			const now = new Date();
			const dummyList: MainDataType.TimeChallengeResult[] = Array.from({ length: 10 }, (_, i) => {
				const offsetDate = new Date(now.getTime() - i * 60000); // 1분씩 이전으로 오프셋
				const isoDate = offsetDate.toISOString().split('T')[0];
				const time = offsetDate.toTimeString().split(':').slice(0, 2).join(':');
				const formattedDate = `${isoDate} ${time}`;

				return {
					quizDate: formattedDate,
					finalScore: Math.floor(Math.random() * 200) + 50,
					totalQuestions: 20,
					solvedQuestions: 18,
					correctCount: 15,
					wrongCount: 3,
					maxCombo: 7,
					timeUsedMs: Math.floor(Math.random() * 180000),
					hasUsedSkip: Math.random() < 0.5,
					quizIdList: [1, 2, 3, 4, 5],
					correctQuizIdList: [1, 2, 3],
					wrongQuizIdList: [4, 5],
				};
			});

			const updated = [...dummyList, ...history];
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			alert('10건의 더미 데이터가 저장되었습니다!');
		} catch (e) {
			console.error('더미 저장 실패', e);
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<View style={styles.contentWrapper}>
				<ScrollView contentContainerStyle={styles.scrollContainer}>
					<AdmobBannerAd />

					{/* ⏱️ 규칙 및 버튼 */}
					<View style={styles.challengeRuleBox}>
						<Text style={styles.title}>⏱️ 타임 챌린지 규칙</Text>

						{showAllRules ? (
							<>
								<Text style={styles.rule}>
									•{' '}
									<Text style={{ fontWeight: 'bold', color: '#34495e', fontSize: scaledSize(14) }}>
										주어진 180초 안에 속담의 의미를 최대한 많이 맞히는 게임입니다.
									</Text>
								</Text>
								<Text style={styles.rule}>• 문제를 틀릴 경우 하트(❤️ 총 5개)가 1개씩 줄어듭니다.</Text>
								<Text style={styles.rule}>• 1회 스킵 기능이 주어지며, 어려운 문제를 건너뛸 수 있습니다.</Text>
								<Text style={styles.rule}>
									• 1회 찬스 기능이 주어지며, 잠시 동안 해당 문제의 각 한자 뜻과 예문이 제공됩니다.
								</Text>
								<Text style={styles.rule}>• 중간에 종료할 경우 기록은 저장되지 않습니다.</Text>

								<Text
									style={[
										styles.rule,
										{ marginVertical: scaleHeight(8), fontWeight: 'bold', color: '#2c3e50', fontSize: scaledSize(15) },
									]}>
									💡 점수별 보너스
								</Text>
								<Text style={styles.rule}>
									• 100점 도달 시 <Text style={{ color: '#2980b9', fontWeight: 'bold' }}>⏱ 10초 추가</Text>
								</Text>
								<Text style={styles.rule}>
									• 200점 도달 시 <Text style={{ color: '#2980b9', fontWeight: 'bold' }}>⏱ 10초</Text> +{' '}
									<Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>❤️ 하트 1개 추가</Text>
								</Text>
								<Text style={styles.rule}>
									• 300점 도달 시 <Text style={{ color: '#2980b9', fontWeight: 'bold' }}>⏱ 10초 추가</Text>
								</Text>
								<Text style={styles.rule}>
									• 400점 도달 시 <Text style={{ color: '#2980b9', fontWeight: 'bold' }}>⏱ 10초 추가</Text>
								</Text>

								<Text style={styles.rule}>
									• 500점 도달 시 <Text style={{ color: '#2980b9', fontWeight: 'bold' }}>⏱ 10초</Text> +{' '}
									<Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>❤️ 하트 1개 추가</Text>
								</Text>

								<Text
									style={[
										styles.rule,
										{ marginVertical: scaleHeight(8), fontWeight: 'bold', color: '#2c3e50', fontSize: scaledSize(15) },
									]}>
									🔥 콤보 보너스
								</Text>
								<Text style={styles.rule}>
									• 3콤보 달성 시 <Text style={{ color: '#f39c12', fontWeight: 'bold' }}>+5점</Text>
								</Text>
								<Text style={styles.rule}>
									• 4콤보 달성 시 <Text style={{ color: '#f39c12', fontWeight: 'bold' }}>+10점</Text>
								</Text>
								<Text style={styles.rule}>
									• 5콤보 달성 시 <Text style={{ color: '#f39c12', fontWeight: 'bold' }}>+20점</Text>
								</Text>
								<Text style={styles.rule}>
									• 6콤보 이상 시 <Text style={{ color: '#f39c12', fontWeight: 'bold' }}>+30점</Text>
								</Text>

								<Text style={[styles.rule, { color: '#e74c3c', fontWeight: 'bold', marginTop: scaleHeight(3) }]}>
									• 시작 버튼을 누르면 3초 뒤에 퀴즈가 시작됩니다!
								</Text>

								<TouchableOpacity onPress={() => setShowAllRules(false)}>
									<Text style={styles.toggleText}>간단히 보기 ▲</Text>
								</TouchableOpacity>
							</>
						) : (
							<>
								<Text style={styles.rule}>
									•{' '}
									<Text style={{ fontWeight: 'bold', color: '#34495e', fontSize: scaledSize(14) }}>
										주어진 180초 안에 속담의 의미를 최대한 많이 맞히는 게임입니다.
									</Text>
								</Text>
								<Text style={styles.rule}>• 문제를 틀릴 경우 하트(❤️ 총 5개)가 1개씩 줄어듭니다.</Text>
								<Text style={[styles.rule, { color: '#e74c3c', fontWeight: 'bold', marginTop: scaleHeight(3) }]}>
									• 시작 버튼을 누르면 3초 뒤에 퀴즈가 시작됩니다!
								</Text>
								<TouchableOpacity onPress={() => setShowAllRules(true)}>
									<Text style={styles.toggleText}>자세히 보기 ▼</Text>
								</TouchableOpacity>
							</>
						)}
					</View>

					{/* 🥇🥈🥉 TOP 5 리스트 */}
					<View style={styles.myTopRankingBox}>
						<Text style={styles.topRankingTitle}>📋 나의 랭킹 TOP 3</Text>

						{top5History.length === 0 ? (
							<Text style={styles.noRecordText}>아직 기록이 없습니다. 챌린지를 시작해보세요!</Text>
						) : (
							top5History.slice(0, 3).map((item, index) => (
								<View key={index} style={styles.recordCard}>
									<View style={styles.rankRow}>
										{index === 0 && (
											<>
												<IconComponent
													name="trophy"
													type="FontAwesome"
													size={24}
													color="#f1c40f"
													style={{ marginRight: scaleWidth(8) }}
												/>
												<Text style={styles.firstRankLabel}>1등</Text>
												<Text style={styles.firstRankScore}>
													{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
												</Text>
											</>
										)}
										{index === 1 && (
											<>
												<IconComponent
													name="trophy"
													type="FontAwesome"
													size={20}
													color="#bdc3c7"
													style={{ marginRight: scaleWidth(13) }}
												/>
												<Text style={styles.secondRankLabel}>2등</Text>
												<Text style={styles.secondRankScore}>
													{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
												</Text>
											</>
										)}
										{index === 2 && (
											<>
												<IconComponent
													name="trophy"
													type="FontAwesome"
													size={18}
													color="#cd7f32"
													style={{ marginRight: scaleWidth(16) }}
												/>
												<Text style={styles.thirdRankLabel}>3등</Text>
												<Text style={styles.thirdRankScore}>
													{item.finalScore}점<Text style={styles.rankDate}> ({getRelativeDateLabel(item.quizDate)})</Text>
												</Text>
											</>
										)}
									</View>
								</View>
							))
						)}
					</View>

					<TouchableOpacity style={styles.startButton} onPress={handleStartChallenge}>
						<Text style={styles.startButtonText}>시작하기</Text>
					</TouchableOpacity>
					{/* <TouchableOpacity style={styles.dummyButton} onPress={saveDummyToStorage}>
						<Text style={styles.dummyButtonText}>더미 기록 추가</Text>
					</TouchableOpacity>

					<TouchableOpacity style={[styles.dummyButton, { backgroundColor: "#c0392b" }]} onPress={clearDummyHistory}>
						<Text style={styles.dummyButtonText}>더미 기록 삭제</Text>
					</TouchableOpacity> */}
				</ScrollView>
			</View>
			<View style={styles.bottomExitWrapper}>
				<TouchableOpacity
					style={styles.exitButton}
					onPress={() =>
						//@ts-ignore
						navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME })
					}>
					<Text style={styles.exitButtonText}>홈으로</Text>
				</TouchableOpacity>
			</View>
			{isCountingDown && (
				<View style={StyleSheet.absoluteFillObject}>
					<View style={styles.countdownOverlay}>
						<Animated.Text style={[styles.countdownText, { transform: [{ scale: scaleAnim }] }]}>
							{count === 0 ? '시작!' : count}
						</Animated.Text>
						<Text style={styles.countdownMessage}>
							{count === 3 ? '심호흡 하세요…' : count === 2 ? '준비하세요!' : count === 1 ? '곧 시작됩니다!' : ''}
						</Text>
					</View>
				</View>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		backgroundColor: '#ffffff',
	},
	contentContainer: {
		backgroundColor: '#f9f9f9',
		borderRadius: 12,
		padding: scaleWidth(20),
	},
	title: {
		fontSize: scaledSize(17), // ✅ 기존 20 → 17
		fontWeight: 'bold',
		marginBottom: scaleHeight(10), // 여백도 살짝 줄임
		color: '#2c3e50', // 더 안정적인 색상
	},
	rule: {
		fontSize: scaledSize(13), // 기존 16 → 15
		color: '#555',
		marginBottom: scaleHeight(3), // 더 타이트하게
		lineHeight: scaleHeight(22), // 줄 간격도 살짝 줄임
	},
	startButton: {
		marginTop: scaleHeight(24),
		backgroundColor: '#4A90E2',
		paddingVertical: scaleHeight(12),
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	startButtonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	rankingText: {
		fontSize: scaledSize(14),
		color: '#555',
		marginBottom: scaleHeight(2),
	},
	dummyButton: {
		marginBottom: scaleHeight(20),
		backgroundColor: '#7f8c8d',
		paddingVertical: scaleHeight(10),
		borderRadius: 8,
		alignItems: 'center',
	},
	dummyButtonText: {
		color: '#fff',
		fontSize: scaledSize(14),
		fontWeight: '600',
	},
	myRankingBox: {
		marginBottom: scaleHeight(20),
		padding: scaleWidth(16),
		backgroundColor: '#fef9e7',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#f1c40f',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	rankingHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	rankingTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginLeft: scaleWidth(8),
	},
	rankingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	rankingLabel: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		marginLeft: scaleWidth(6),
		marginRight: scaleWidth(4),
	},
	rankingValue: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#2c3e50',
	},
	myTopRankingBox: {
		marginBottom: scaleHeight(12),
		padding: scaleWidth(18),
		backgroundColor: '#f9f9f9',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	topRankingTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},
	rankingItemRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: scaleHeight(4), // 👈 각 row 간 여백
	},
	rankNumber: {
		width: scaleWidth(20),
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#555',
		marginRight: scaleWidth(6),
		textAlign: 'center',
	},
	headerBox: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(20),
		padding: scaleWidth(12),
		backgroundColor: '#fef9e7',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#f1c40f',
	},
	headerText: {
		fontSize: scaledSize(15),
		marginLeft: scaleWidth(8),
		color: '#2c3e50',
		fontWeight: '600',
	},
	highlightText: {
		color: '#e67e22',
		fontWeight: 'bold',
	},
	scrollContainer: {
		paddingBottom: scaleHeight(10), // 하단 여백
	},
	recordCard: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 10,
		padding: scaleWidth(12),
		marginBottom: scaleHeight(6),
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	recordHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	recordScore: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#34495e',
		marginBottom: scaleHeight(4),
	},
	recordDate: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},

	firstRankDate: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},
	rankRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap', // 긴 날짜가 잘리지 않게
		marginBottom: scaleHeight(2),
	},
	rankLabel: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
		marginRight: scaleWidth(6),
	},

	rankScore: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
	},

	rankDate: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
	},
	challengeRuleBox: {
		backgroundColor: '#fdfdfd',
		borderRadius: 12,
		padding: scaleWidth(18),
		marginBottom: scaleHeight(12),
		borderWidth: 1,
		borderColor: '#ddd',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	contentWrapper: {
		flex: 1,
		justifyContent: 'space-between',
	},

	noRecordText: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		textAlign: 'center',
		marginVertical: scaleHeight(12),
	},
	firstRankLabel: {
		fontSize: scaledSize(17),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginRight: scaleWidth(8),
	},
	firstRankScore: {
		fontSize: scaledSize(17),
		fontWeight: 'bold',
		color: '#e67e22', // 주황
	},
	secondRankLabel: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#7f8c8d',
		marginRight: scaleWidth(6),
	},
	secondRankScore: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#95a5a6', // 은색 계열
	},
	thirdRankLabel: {
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#795548',
		marginRight: scaleWidth(6),
	},
	thirdRankScore: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#a1887f', // 청동색 계열
	},
	countdownOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999,
	},
	countdownText: {
		fontSize: 72,
		fontWeight: 'bold',
		color: '#ffffff',
	},
	countdownMessage: {
		fontSize: 20,
		marginTop: 12,
		color: '#fff',
		fontWeight: '500',
	},
	toggleText: {
		color: '#3498db',
		fontSize: scaledSize(13),
		marginTop: scaleHeight(6),
		textAlign: 'center',
		fontWeight: '600',
	},
	bottomExitWrapper: {
		width: '100%',
		height: scaleHeight(30), // ✅ 명시적 높이 추가
		alignItems: 'center',
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#eee',
		paddingTop: scaleHeight(6),
		paddingBottom: Platform.OS === 'android' ? scaleHeight(10) : scaleHeight(14),
		marginBottom: Platform.OS === 'android' ? scaleHeight(52) : scaleHeight(12),
	},
	exitButton: {
		backgroundColor: '#7f8c8d',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(32),
		borderRadius: scaleWidth(20),
		height: scaleHeight(40), // ✅ 버튼 높이 보장
		justifyContent: 'center', // 수직 정렬 보장
		alignItems: 'center',
	},
	exitButtonText: {
		color: '#fff',
		fontSize: scaledSize(14), // 🔽 기존보다 작게
		fontWeight: '600',
	},
});

export default InitTimeChallengeScreen;
