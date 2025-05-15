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

	useEffect(() => {
		if (!isFocused) return;

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
		if (wrongCountries.length === 0) return;

		// @ts-ignore
		navigation.navigate(Paths.PROVERB_MEANING_QUIZ, {
			mode: 'meaning',
			questionPool: wrongCountries,
			title: '오답 복습',
			isWrongReview: true,
		});
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size='large' color='#3498db' />
			</View>
		);
	}

	if (wrongCountries.length === 0) {
		return (
			<View style={styles.center}>
				{/* 마스코트 이미지 */}
				<FastImage
					source={require('@/assets/images/no_wrong.png')} // 예시: 해피한 마스코트
					style={styles.mascotImage}
					resizeMode='contain'
				/>

				{/* 텍스트 메시지 */}
				<Text style={styles.emptyText}>🎉 오답이 없습니다!</Text>
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<View style={styles.card}>
				<Text style={styles.title}>
					지금까지 <Text style={styles.highlight}>{totalSolvedCount}</Text>문제를 직접 풀었어요!{'\n'}
					그중 <Text style={styles.highlight}>{wrongCountries.length}</Text>문제는 조금 아쉬웠네요 😅{'\n'}
					한 번 더 도전해볼까요? 💪
				</Text>
				<Text style={styles.subText}>
					나의 정답률은 <Text style={styles.highlight2}>{totalSolvedCount > 0 ? Math.round((correctCount / totalSolvedCount) * 100) : 0}%</Text>
					예요!{'\n'}정말 열심히 하고 있어요, 계속 힘내봐요! 🚀
				</Text>
			</View>
			<View style={styles.guideCard}>
				<Text style={styles.guideCardTitle}>📘 오답 복습이란?</Text>
				<Text style={styles.guideCardContent}>
					❗ 이전 퀴즈에서 틀린 문제들을 다시 풀 수 있어요.{'\n'}
					- 틀린 속담이 반복 출제되며, <Text style={styles.guideHighlight}>정답을 맞히면 오답 목록에서 자동 제거</Text>돼요!{'\n'}
					- 문제는 항상 <Text style={styles.guideHighlight}>뜻 맞추기</Text> 형식으로 출제되고 <Text style={styles.guideHighlight}>정답 시 10점</Text>을 받을 수 있어요 🎯{'\n'}
					- 만약 오답 복습 중에 다시 틀린 문제는 <Text style={styles.guideHighlight}>오답 목록에 그대로 남게</Text> 되며, 반복적으로 복습할 수 있어요! 🔄{'\n'}
					- 여러 번 틀리더라도 걱정하지 말고, 계속 도전하면서 실력을 쌓아가세요! 💪
				</Text>
			</View>


			<TouchableOpacity style={styles.startButton} onPress={startWrongReview}>
				<Text style={styles.buttonText}>🚀 실력 업! 오답 다시 풀어보기</Text>
			</TouchableOpacity>

			<TouchableOpacity style={styles.toggleButton} onPress={() => setShowWrongList((prev) => !prev)}>
				<Text style={styles.toggleButtonText}>{showWrongList ? '⬆️ 나의 오답 목록 접기' : '⬇️ 나의 오답 목록 펼치기'}</Text>
			</TouchableOpacity>

			{showWrongList && (
				<View style={styles.reviewCardList}>
					{wrongCountries.map((proverb) => (
						<View key={proverb.id} style={styles.reviewCard}>
							<Text style={styles.reviewProverbText}>📝 {proverb.proverb}</Text>
							<Text style={styles.reviewMeaningText}>- {proverb.longMeaning}</Text>
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
		shadowRadius: 2,
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
	},
	scrollContainer: {
		paddingVertical: scaleHeight(40),
		paddingHorizontal: scaleWidth(24),
		alignItems: 'center',
		backgroundColor: '#f5f6fa',
	},
	activityCardBox: {
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(16),
		padding: scaleWidth(10),
		marginBottom: scaleHeight(12),
		borderWidth: 1,
		borderColor: '#ecf0f1',
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
		marginTop: 16,
		paddingVertical: 10,
		paddingHorizontal: 24,
		backgroundColor: '#27ae60',
		borderRadius: 8,
	},
	guideConfirmText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 14,
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
		width: scaleWidth(120),
		height: scaleWidth(120),
		marginBottom: scaleHeight(10),
	},

	guideCard: {
		backgroundColor: '#ffffff', // 기존 '#fefefe' → 완전 흰색으로 변경
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
		shadowRadius: 2,
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
});
