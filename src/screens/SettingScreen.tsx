import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import ProverbServices from '@/services/ProverbServices';
import { CONST_BADGES } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import Contributor9Modal from './common/modal/Contributor9Modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import VersionCheck from 'react-native-version-check';

const STORAGE_KEYS = {
	study: 'UserStudyHistory',
	quiz: 'UserQuizHistory',
};

const SettingScreen = () => {
	const isFocused = useIsFocused();
	const scrollRef = useRef<ScrollView>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [resetType, setResetType] = useState<'study' | 'quiz' | 'all' | null>(null);
	const [summary, setSummary] = useState<string>('');
	// 상태
	const ALARM_TIME_KEY = 'AlarmTime';
	const [alarmTime, setAlarmTime] = useState<Date>(new Date());

	const [showDevModal, setShowDevModal] = useState(false);

	const [appVersion, setAppVersion] = useState('');

	useEffect(() => {
		const version = VersionCheck.getCurrentVersion();
		setAppVersion(version);
	}, []);

	useEffect(() => {
		if (isFocused) {
			handleScrollToTop();
		}
	}, [isFocused]);

	useEffect(() => {
		AsyncStorage.getItem(ALARM_TIME_KEY).then((time) => {
			if (time) setAlarmTime(new Date(time));
		});
	}, []);

	useEffect(() => {
		AsyncStorage.setItem(ALARM_TIME_KEY, alarmTime.toISOString());
	}, [alarmTime]);

	const handleScrollToTop = () => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	const getSummaryMessage = (type: 'study' | 'quiz' | 'all') => {
		let msg = '';
		if (type === 'study') {
			msg = '지금까지 학습했던 내용들이 모두 사라져요.\n정말 다시 시작할까요?';
		} else if (type === 'quiz') {
			msg = '지금까지 풀었던 퀴즈 기록이 초기화돼요.\n다시 도전해볼까요?';
		} else if (type === 'all') {
			msg = '지금까지 학습하고 풀었던 모든 기록이 사라져요.\n정말 전부 다시 시작할까요?';
		}
		setSummary(msg);
	};
	// 모달 타이틀을 타입에 따라 변경
	const getModalTitle = () => {
		switch (resetType) {
			case 'study':
				return '학습을 다시 해볼까요?';
			case 'quiz':
				return '퀴즈를 다시 풀어볼까요?';
			case 'all':
				return '모두 다시 해볼까요?';
			default:
				return '정말 다시 해볼까요?';
		}
	};

	const confirmReset = async (type: 'study' | 'quiz' | 'all') => {
		setResetType(type);
		getSummaryMessage(type);
		setModalVisible(true);
	};

	// handleConfirmDelete 내부 수정
	const handleConfirmDelete = async () => {
		if (!resetType) return;

		try {
			if (resetType === 'study') {
				await AsyncStorage.removeItem(STORAGE_KEYS.study);
				// ✅ 학습 상태 초기화 메시지 → 필요 시 context 또는 이벤트 활용 가능
				Alert.alert('완료', '학습 데이터가 초기화되었습니다');
			} else if (resetType === 'quiz') {
				await AsyncStorage.removeItem(STORAGE_KEYS.quiz);
				Alert.alert('완료', '퀴즈 데이터가 초기화되었습니다');
			} else {
				await AsyncStorage.multiRemove([STORAGE_KEYS.study, STORAGE_KEYS.quiz]);
				Alert.alert('완료', '모든 데이터가 초기화되었습니다');
			}

			setModalVisible(false);
			setResetType(null);
			handleScrollToTop();

			// ✅ 예시: 리셋 후 홈으로 이동
			// navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME });
		} catch (err) {
			Alert.alert('오류', '초기화 중 오류가 발생했습니다');
		}
	};

	const handleCompleteAllQuiz = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		console.log(allProverbs.map((p) => p.id));
		const parsed = {
			badges: CONST_BADGES.filter((b) => b.type === 'quiz').map((b) => b.id),
			correctProverbId: allProverbs.map((p) => p.id),
			wrongProverbId: [],
			totalScore: 2160,
			bestCombo: 20,
			lastAnsweredAt: new Date().toISOString(),
			quizCounts: {}, // 원하면 여기서도 id별로 count 넣을 수 있음
		};
		await AsyncStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify(parsed));
		Alert.alert('처리됨', '모든 퀴즈 완료 + 뱃지 지급!');
	};

	const handleCompleteAllStudy = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		const parsed = {
			badges: CONST_BADGES.filter((b) => b.type === 'study').map((b) => b.id),
			studyProverbes: allProverbs.map((p) => p.id),
			lastStudyAt: new Date().toISOString(),
			studyCounts: {}, // 원하면 각 속담 id별 학습 횟수 설정 가능
		};
		await AsyncStorage.setItem(STORAGE_KEYS.study, JSON.stringify(parsed));
		Alert.alert('처리됨', '모든 학습 완료 + 뱃지 지급!');
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
			<ScrollView ref={scrollRef} style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={() => { }} />}>
				{/* <AdmobBannerAd paramMarginTop={20} /> */}
				{/* <View style={styles.section}></View> */}
				<View style={styles.section}>
					<Text style={styles.title}>학습/퀴즈 다시 풀기 </Text>
					<View style={styles.buttonGroup}>
						<TouchableOpacity style={[styles.button, styles.resetStudy]} onPress={() => confirmReset('study')}>
							<IconComponent type='materialCommunityIcons' name='refresh' size={18} color='#fff' style={styles.iconLeft} />
							<Text style={styles.buttonText}>학습 다시 하기</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.button, styles.resetQuiz]} onPress={() => confirmReset('quiz')}>
							<IconComponent type='materialCommunityIcons' name='refresh' size={18} color='#fff' style={styles.iconLeft} />
							<Text style={styles.buttonText}>퀴즈 다시 풀기</Text>
						</TouchableOpacity>

						<TouchableOpacity style={[styles.button, styles.resetAll]} onPress={() => confirmReset('all')}>
							<IconComponent type='materialCommunityIcons' name='delete' size={18} color='#fff' style={styles.iconLeft} />
							<Text style={styles.buttonText}>모두 다시 풀기</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* 기존 설정 UI */}
				{/* <View style={styles.section}>
					<Text style={styles.title}>📌 관리자 패널</Text>
					<View style={styles.buttonGroup}>
						<TouchableOpacity style={[styles.button, { backgroundColor: '#6a1b9a' }]} onPress={handleCompleteAllQuiz}>
							<IconComponent type='materialIcons' name='check-circle' size={18} color='#fff' style={styles.iconLeft} />
							<Text style={styles.buttonText}>모든 퀴즈 완료로 설정</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.button, { backgroundColor: '#0d47a1' }]} onPress={handleCompleteAllStudy}>
							<IconComponent type='materialIcons' name='school' size={18} color='#fff' style={styles.iconLeft} />
							<Text style={styles.buttonText}>모든 학습 완료로 설정</Text>
						</TouchableOpacity>
					</View>
				</View> */}

				<View style={{ marginBottom: 20 }}>
					<Text style={{ fontSize: 12, color: '#95a5a6', textAlign: 'center' }}>
						📱 현재 앱 버전: <Text style={{ fontWeight: 'bold' }}>v{appVersion}</Text>
					</Text>
				</View>

				<TouchableOpacity style={styles.hiddenDevTouchArea} onPress={() => setShowDevModal(true)}>
					<Text style={styles.devText}>제작자 소개</Text>
				</TouchableOpacity>
				<View style={{ marginTop: scaleHeight(30), marginBottom: scaleHeight(10) }}>
					<Text style={{ fontSize: scaledSize(12), color: '#7f8c8d', textAlign: 'center', padding: scaleWidth(40) }}>
						📚 본 앱의 일부 콘텐츠는{' '}
						<Text style={{ textDecorationLine: 'underline', color: '#3498db' }} onPress={() => Linking.openURL('https://opendict.korean.go.kr/main')}>
							국립국어원 표준국어대사전
						</Text>
						을(를) 기반으로 제작되었습니다.
					</Text>
				</View>
			</ScrollView>

			<Contributor9Modal visible={showDevModal} onClose={() => setShowDevModal(false)} />

			<Modal visible={modalVisible} transparent animationType='fade' onRequestClose={() => setModalVisible(false)}>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>{getModalTitle()}</Text>
						<Text style={styles.modalSummary}>{summary}</Text>

						<View style={styles.modalButtons}>
							<TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setModalVisible(false)}>
								<Text style={styles.modalButtonText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.modalButton, styles.modalDelete]} onPress={handleConfirmDelete}>
								<Text style={styles.modalButtonText}>삭제</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

export default SettingScreen;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},

	section: {
		margin: scaleWidth(20),
		backgroundColor: '#f8f9fa',
		padding: scaleWidth(25),
		borderRadius: scaleWidth(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.1,
		shadowRadius: scaleWidth(4),
		marginTop: scaleHeight(20),
	},
	title: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		marginBottom: scaleHeight(20),
	},
	buttonGroup: {
		gap: scaleHeight(10),
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: scaledSize(14),
	},
	resetStudy: {
		backgroundColor: '#1E88E5',
	},
	resetQuiz: {
		backgroundColor: '#43A047',
	},
	resetAll: {
		backgroundColor: '#E53935',
	},
	// Modal
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		width: '80%',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(10),
		padding: scaleWidth(20),
	},
	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#34495e',
		textAlign: 'center',
		marginBottom: scaleHeight(12),
	},
	modalSummary: {
		fontSize: scaledSize(13.5),
		color: '#555',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
		marginBottom: scaleHeight(24),
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	modalButton: {
		flex: 1,
		padding: scaleHeight(12),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
		marginHorizontal: scaleWidth(5),
	},
	modalCancel: {
		backgroundColor: '#9E9E9E',
	},
	modalDelete: {
		backgroundColor: '#D32F2F',
	},
	modalButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	label: {
		fontSize: scaledSize(16),
		color: '#2c3e50',
	},
	timeButton: {
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(16),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleWidth(8),
		marginBottom: scaleHeight(8),
	},
	timeText: {
		fontSize: scaledSize(16),
		color: '#34495e',
	},
	addButton: {
		marginTop: scaleHeight(10),
		backgroundColor: '#3498db',
		padding: scaleHeight(12),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
	},
	addButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	iconLeft: {
		marginRight: scaleWidth(8),
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: scaleHeight(15),
		borderRadius: scaleWidth(8),
		marginBottom: scaleHeight(10),
	},
	hiddenDevTouchArea: {
		alignSelf: 'center',
		width: scaleWidth(80),
		height: scaleWidth(30),
		borderRadius: scaleWidth(28),
		backgroundColor: '#F8F8F8',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
	},
	devText: {
		fontSize: scaledSize(13),
		color: '#999999',
		textAlign: 'center',
		fontWeight: '500',
	},
});
