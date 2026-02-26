import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import QuizHistoryService from '@/services/QuizHistoryService';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';

/**
 * 사용자 퀴즈 데이터 정의
 */
export interface UserQuizHistory {
	correctProverbId: number[]; // 사용자가 정답을 맞춘 속담의 아이디 목록 (예: [1, 2])
	wrongProverbId: number[]; // 사용자가 오답을 선택한 속담의 아이디 목록
	lastAnsweredAt: Date; // 마지막으로 퀴즈를 푼 시간 (Date 객체 또는 ISO 문자열)
	quizCounts: { [id: number]: number }; // 각 속담별 퀴즈 시도 횟수 (key는 사용자 아이디)
	badges: string[]; // 사용자가 획득한 뱃지의 ID 목록 (ex: ['asia_master', 'level1_perfect'])
	totalScore: number; // 사용자의 퀴즈 총 누적 점수
	bestCombo?: number; // 사용자가 기록한 가장 높은 연속 정답 수 (선택 값)
}

const WrongReviewScreen = () => {
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const [loading, setLoading] = useState(true);
	const [wrongCountries, setWrongCountries] = useState<MainDataType.Proverb[]>([]);
	const [totalSolvedCount, setTotalSolvedCount] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [showWrongList, setShowWrongList] = useState(false);

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	useEffect(() => {
		if (!isFocused) {
			return;
		}

		const fetchWrongData = async () => {
			setLoading(true);
			try {
				const [wrongIdList, correctIdList] = await Promise.all([QuizHistoryService.getWrongProverbIds(), QuizHistoryService.getCorrectProverbIds()]);

				setTotalSolvedCount(wrongIdList.length + correctIdList.length);
				setCorrectCount(correctIdList.length);

				const allProverbs = ProverbServices.selectProverbList();
				const result = allProverbs.filter((item) => wrongIdList.includes(item.id));
				setWrongCountries(result);
			} catch (e) {
				console.error('❌ 오답 로딩 실패:', e);
			} finally {
				setLoading(false);
			}
		};

		fetchWrongData();
	}, [isFocused]);

	const startWrongReview = () => {
		if (wrongCountries.length === 0) {
			return;
		}

		// @ts-ignore
		navigation.navigate(Paths.QUIZ, {
			mode: 'meaning',
			questionPool: wrongCountries,
			title: '오답 복습',
			isWrongReview: true,
		});
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color="#3498db" />
			</View>
		);
	}

	if (wrongCountries.length === 0) {
		return (
			<View style={styles.center}>
				{/* 마스코트 이미지 */}
				{/* no-data */}
				<FastImage
					source={require('@/assets/images/no-data.png')} // 예시: 해피한 마스코트
					style={styles.mascotImage}
					resizeMode="contain"
				/>

				{/* 텍스트 메시지 */}
				<Text style={styles.emptyText}>🎉 오답이 없습니다! 훌륭해요! 🎉</Text>
				{/* 홈으로 가기 버튼 */}
				<TouchableOpacity
					style={styles.homeButton}
					onPress={() => {
						// @ts-ignore
						navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME });
					}}>
					<Text style={styles.homeButtonText}>홈으로 가기</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<View style={styles.card}>
				<Text style={styles.title}>
					지금까지 <Text style={styles.highlight}>{totalSolvedCount}</Text>문제를 직접 풀었어요!{'\n'}그 중{' '}
					<Text style={styles.highlight}>{wrongCountries.length}</Text>문제는 조금 아쉬웠네요 😅{'\n'}한 번 더 도전해볼까요? 💪
				</Text>
				<Text style={styles.subText}>
					나의 정답률은 <Text style={styles.highlight2}>{totalSolvedCount > 0 ? Math.round((correctCount / totalSolvedCount) * 100) : 0}%</Text>
					예요!{'\n'}정말 열심히 하고 있어요, 계속 힘내봐요! 🚀
				</Text>
			</View>
			<View style={styles.guideCard}>
				<Text style={styles.guideCardTitle}>📘 오답 복습이란?</Text>
				<Text style={styles.guideCardContent}>
					❗ 이전 퀴즈에서 틀린 문제들을 다시 풀 수 있어요.{'\n'}- 틀린 속담이 반복 출제되며,{' '}
					<Text style={styles.guideHighlight}>정답을 맞히면 오답 목록에서 자동 제거</Text>돼요!{'\n'}- 문제는 항상{' '}
					<Text style={styles.guideHighlight}>뜻 맞추기</Text> 형식으로 출제되고 <Text style={styles.guideHighlight}>정답 시 10점</Text>을 받을 수 있어요
					🎯{'\n'}- 만약 오답 복습 중에 다시 틀린 문제는 <Text style={styles.guideHighlight}>오답 목록에 그대로 남게</Text> 되며, 반복적으로 복습할 수
					있어요! 🔄{'\n'}- 여러 번 틀리더라도 걱정하지 말고, 계속 도전하면서 실력을 쌓아가세요! 💪
				</Text>
			</View>

			<TouchableOpacity style={styles.startButton} onPress={startWrongReview}>
				<Text style={styles.buttonText}>🚀 실력 업! 오답 다시 풀어보기</Text>
			</TouchableOpacity>

			<View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
				<TouchableOpacity style={styles.toggleCard} onPress={() => setShowWrongList((prev) => !prev)}>
					<IconComponent type="MaterialIcons" name={showWrongList ? 'expand-less' : 'expand-more'} size={22} color="#00b894" />
					<Text style={styles.toggleText}>{showWrongList ? '오답 목록 접기' : '오답 목록 펼치기'}</Text>
				</TouchableOpacity>
			</View>
			{showWrongList && (
				<View style={styles.reviewCardList}>
					{wrongCountries.map((item) => (
						<View key={item.id} style={styles.historyCard}>
							{/* 좌측 컬러바 + 헤더 */}
							<View style={[styles.historyColorBar]} />
							<View style={styles.historyCardBody}>
								{/* 타이틀 + 정오답 배지 */}
								<View style={styles.headerCenter}>
									<Text style={styles.headerTitle2}>{item.proverb}</Text>
								</View>

								{/* 풀이 */}
								{Boolean(item.longMeaning) && (
									<View style={styles.highlightSection}>
										<View style={styles.meaningQuoteBox}>
											<IconComponent type="fontAwesome6" name="quote-left" size={28} color="#58D68D" style={{ marginBottom: scaleHeight(8) }} />
											<Text style={styles.meaningQuoteText}>{item.longMeaning}</Text>
										</View>
									</View>
								)}

								{/* 상세 풀이 */}
								{Array.isArray(item.sameProverb) && item.sameProverb.length > 0 && (
									<View style={styles.sectionBox}>
										<Text style={styles.sectionTitle}>🔗 비슷한 속담</Text>
										{item.sameProverb.map((p, i) => (
											<View key={`same-${i}`} style={styles.phraseRow}>
												<Text style={styles.inlineValue}>- {p}</Text>
											</View>
										))}
									</View>
								)}

								{/* 예문 */}
								{item.example.length > 0 && (
									<View style={styles.sectionBox}>
										<Text style={styles.sectionTitle}>✍️ 예문</Text>
										{item.example.map((ex, i) => (
											<Text key={i} style={styles.exampleText}>
												• {ex}
											</Text>
										))}
									</View>
								)}
							</View>
						</View>
					))}
				</View>
			)}
		</ScrollView>
	);
};

export default WrongReviewScreen;

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#ffffff',
		paddingVertical: scaleHeight(28),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#dfe6e9',
		marginBottom: scaleHeight(10),
		width: '100%',
		alignItems: 'center',
	},
	title: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
		marginBottom: scaleHeight(10),
	},
	highlight: {
		color: '#e74c3c',
		fontWeight: 'bold',
	},
	highlight2: {
		fontWeight: 'bold',
	},
	subText: {
		fontSize: scaledSize(15),
		color: '#636e72',
		textAlign: 'center',
	},
	startButton: {
		backgroundColor: '#f1c40f',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(40),
		marginBottom: scaleHeight(30),
		borderRadius: scaleWidth(30),
		marginTop: scaleHeight(20),
	},
	buttonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
		textAlign: 'center',
	},
	toggleButton: {
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#00cec9',
		backgroundColor: '#e0f7fa',
	},
	toggleButtonText: {
		color: '#00b894',
		fontSize: scaledSize(15),
		fontWeight: '600',
	},
	reviewTable: {
		marginTop: scaleHeight(24),
		width: '100%',
		borderWidth: 1,
		borderColor: '#dcdde1',
		borderRadius: scaleWidth(12),
		backgroundColor: '#fefefe',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(2),
	},
	reviewRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#ecf0f1',
	},
	reviewHeader: {
		backgroundColor: '#ecf0f1',
	},
	reviewCell: {
		flex: 1,
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(12),
		fontSize: scaledSize(15),
		color: '#2c3e50',
	},
	headerCell: {
		fontWeight: 'bold',
		color: '#0984e3',
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	emptyText: {
		fontSize: scaledSize(16),
		color: '#636e72',
		fontWeight: 700,
	},
	scrollContainer: {
		marginTop: scaleHeight(12),
		paddingHorizontal: scaleWidth(24),
		alignItems: 'center',
		backgroundColor: '#f5f6fa',
	},
	activityCardBox: {
		backgroundColor: '#f5f6fa',
		borderRadius: scaleWidth(16),
		padding: scaleWidth(10),
		marginBottom: scaleHeight(12),
		borderWidth: 1,
		borderColor: '#ecf0f1',
		// 추가
		width: '100%',
		alignItems: 'center', // 내부 요소 정렬용
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		padding: scaleWidth(20),
	},
	modalContent: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		width: '100%',
		maxWidth: scaleWidth(320),
		alignItems: 'center',
	},
	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},
	modalText: {
		fontSize: scaledSize(15),
		color: '#636e72',
		textAlign: 'left',
	},
	modalButton: {
		marginTop: scaleHeight(20),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		backgroundColor: '#3498db',
		borderRadius: scaleWidth(8),
	},
	modalButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: scaledSize(15),
	},
	headerRow: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(10),
	},
	headerTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginRight: scaleWidth(5),
	},
	guideModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
		paddingBottom: scaleHeight(12),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
		maxHeight: scaleHeight(600),
	},
	guideHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	guideTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginLeft: scaleWidth(8),
	},
	guideDescription: {
		fontSize: scaledSize(14),
		color: '#34495e',
		textAlign: 'left',
		lineHeight: scaleHeight(22),
		marginBottom: scaleHeight(20),
	},
	guideHighlight: {
		fontWeight: 'bold',
		color: '#e67e22',
	},
	guideConfirmButton: {
		marginTop: scaleHeight(16),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		backgroundColor: '#27ae60',
		borderRadius: scaleWidth(8),
	},
	guideConfirmText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: scaledSize(14),
	},
	guideDescriptionBox: {
		backgroundColor: '#f9f9f9',
		borderWidth: 1,
		borderColor: '#ecf0f1',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		width: '100%',
	},
	mascotImage: {
		width: scaleWidth(240),
		height: scaleWidth(240),
		marginBottom: scaleHeight(10),
	},
	guideCard: {
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#dfe6e9',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(20),
		width: '100%',
	},
	guideCardTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(8),
	},
	guideCardContent: {
		fontSize: scaledSize(13),
		color: '#34495e',
		lineHeight: scaleHeight(20),
	},
	reviewCardList: {
		width: '100%',
		marginTop: scaleHeight(16),
	},
	reviewCard: {
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(16),
		marginBottom: scaleHeight(12),
		borderWidth: 1,
		borderColor: '#ecf0f1',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(2),
	},
	reviewProverbText: {
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},
	reviewMeaningText: {
		fontSize: scaledSize(14),
		color: '#636e72',
		lineHeight: scaleHeight(20),
	},
	historyCard: {
		flexDirection: 'row',
		backgroundColor: '#ffffff',
		borderWidth: 2, // ✅ 두께를 늘림
		borderColor: '#b0b0b0', // ✅ 좀 더 진한 회색 (또는 #999, #888)
		borderRadius: scaledSize(12),
		overflow: 'hidden',
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08, // ✅ 살짝 강조
		shadowRadius: 3,
	},
	historyColorBar: {
		width: scaleWidth(5),
	},
	historyBarCorrect: {
		backgroundColor: '#4CAF50',
	},
	historyBarWrong: {
		backgroundColor: '#F44336',
	},
	historyCardBody: {
		flex: 1,
		padding: scaleHeight(12),
	},

	historyHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	historyIdiom: {
		flex: 1,
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#222',
		paddingRight: scaleWidth(10),
	},

	historyMeaningBox: {
		marginTop: scaleHeight(6),
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(8),
		backgroundColor: '#FAFAFA',
		borderWidth: 1,
		borderColor: '#eee',
	},
	historyMeaningLabel: {
		fontSize: scaledSize(12),
		color: '#777',
		marginBottom: scaleHeight(4),
	},
	historyMeaningValue: {
		fontSize: scaledSize(16),
		color: '#2e7d32',
		fontWeight: 'bold',
		lineHeight: scaledSize(16),
	},

	historySubTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	historySubTitle: {
		fontSize: scaledSize(13),
		fontWeight: '700',
		color: '#333',
	},

	phraseRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: scaleHeight(4),
		flexWrap: 'wrap',
	},
	phraseKr: {
		fontSize: scaledSize(13),
		color: '#222',
		fontWeight: '600',
	},
	phraseMean: {
		fontSize: scaledSize(13),
		color: '#444',
		flexShrink: 1,
	},

	exampleList: {
		marginTop: scaleHeight(4),
	},
	bulletItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: scaleHeight(4),
	},
	bulletDot: {
		fontSize: scaledSize(14),
		lineHeight: scaledSize(18),
		color: '#4CAF50',
		marginRight: scaleWidth(6),
	},
	sectionHeaderIcon: {
		marginRight: scaleWidth(6),
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	historyBox: {
		borderWidth: 1,
		borderColor: '#e0e0e0',
		borderRadius: scaleWidth(10),
		padding: scaleWidth(10),
		backgroundColor: '#fafafa',
	},
	headerCenter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(8),
		flex: 1, // 중앙 정렬
		marginVertical: scaleHeight(12),
	},
	headerTitle2: {
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#1E6BB8',
		textAlign: 'center', // ✅ 줄바꿈 시 가운데 정렬
	},
	highlightSection: {
		borderWidth: 1.5,
		borderColor: '#A5D8FF',
		backgroundColor: '#EAF4FF',
		padding: scaleWidth(14),
		borderRadius: scaleWidth(14),
		marginVertical: scaleHeight(12),
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	highlightHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	highlightTitle: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#1E6BB8',
		marginLeft: scaleWidth(6),
	},
	highlightText: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
		lineHeight: 22,
	},
	meaningQuoteBox: {
		alignItems: 'center', // 중앙 정렬
		justifyContent: 'center',
		backgroundColor: '#EAF4FF', // 파란색 계열 배경
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(16),
	},

	meaningQuoteText: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#2c3e50',
		lineHeight: scaleHeight(22),
		textAlign: 'center', // 텍스트도 중앙 정렬
	},
	sectionBox: {
		borderWidth: 1,
		borderColor: '#E6EEF5',
		backgroundColor: '#FDFEFE',
		padding: scaleWidth(12),
		borderRadius: scaleWidth(12),
		marginVertical: scaleHeight(10),
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	sectionTitle: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
	},
	sectionText: {
		fontSize: scaledSize(14),
		color: '#444',
		lineHeight: 20,
	},
	inlineLabel: {
		fontSize: scaledSize(13),
		marginBottom: scaleHeight(3),
		fontWeight: '700',
		color: '#2c3e50',
	},
	inlineValue: {
		fontSize: scaledSize(13),
		color: '#555',
		marginTop: scaleHeight(2),
	},
	exampleText: {
		fontSize: scaledSize(12),
		color: '#555',
		lineHeight: scaleHeight(18),
		marginLeft: scaleWidth(6),
	},
	toggleCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(24),
		borderRadius: scaleWidth(25),
		backgroundColor: '#e8fdfd',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
	},
	toggleText: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#00b894',
	},
	homeButton: {
		marginTop: scaleHeight(20),
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(28),
		borderRadius: scaleWidth(25),
	},
	homeButtonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '600',
		textAlign: 'center',
	},
});
