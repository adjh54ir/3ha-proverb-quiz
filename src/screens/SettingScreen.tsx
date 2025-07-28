import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Image,
	Keyboard,
	Modal,
	RefreshControl,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import VersionCheck from 'react-native-version-check';
import Contributor9Modal from './common/modal/Contributor9Modal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import IconComponent from './common/atomic/IconComponent';
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import ProverbServices from '@/services/ProverbServices';
import { CONST_BADGES } from '@/const/ConstBadges';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import TermsScreen from './setting/TermScreen';
import OpenSourceScreen from './setting/OpenSourceScreen';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';

const STORAGE_KEYS = {
	study: MainStorageKeyType.USER_STUDY_HISTORY,
	quiz: MainStorageKeyType.USER_QUIZ_HISTORY,
	todayQuiz: MainStorageKeyType.TODAY_QUIZ_LIST,
	timeChallenge: MainStorageKeyType.TIME_CHALLENGE_HISTORY,
};
const SettingScreen = () => {
	const scrollRef = useRef<ScrollView>(null);
	const [showDevModal, setShowDevModal] = useState(false);
	const [appVersion, setAppVersion] = useState('');
	const [showTerms, setShowTerms] = useState(false);
	const [showOpenSource, setShowOpenSource] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [resetType, setResetType] = useState<'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'all' | null>(null);
	const [summary, setSummary] = useState<string>('');

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	useFocusEffect(
		useCallback(() => {
			const version = VersionCheck.getCurrentVersion();
			setAppVersion(version);

			scrollHandler.toTop();
		}, []),
	);

	/**
	 * 스크롤을 움직일때 동작을 합니다. 하단으로 스크롤을 내릴때 아이콘 생성
	 * @param event
	 */
	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 0);
	};
	const scrollHandler = (() => {
		return {
			/**
			 * 스크롤 최상단으로 이동
			 * @return {void}
			 */
			toTop: (): void => {
				scrollRef.current?.scrollTo({ y: 0, animated: true });
			},

			/**
			 * 스크롤 뷰 최하단으로 이동
			 * @return {void}
			 */
			toBottom: (): void => {
				scrollRef.current?.scrollToEnd({ animated: true });
			},
		};
	})();

	const confirmReset = async (type: 'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'all') => {
		console.log(type);
		setResetType(type);
		getSummaryMessage(type);
		setModalVisible(true);
	};

	const getSummaryMessage = (type: 'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'all') => {
		let msg = '';

		switch (type) {
			case 'study':
				msg = '지금까지 학습했던 내용들이 모두 사라져요.\n 정말 다시 시작할까요?';
				break;
			case 'quiz':
				msg = '지금까지 풀었던 퀴즈 기록이 초기화돼요. \n 다시 도전해볼까요?';
				break;
			case 'timeChallenge':
				msg = '타임 챌린지 기록이 모두 초기화돼요.\n 괜찮으신가요?';
				break;
			case 'todayQuiz':
				msg = '오늘의 퀴즈 기록이 사라져요. \n다시 새로 시작할까요?';
				break;
			case 'all':
				msg = '지금까지 학습하고 풀었던 모든 기록이 사라져요. 정말 전부 다시 시작할까요?';
				break;
			default:
				msg = '정말 초기화하시겠어요?';
		}

		setSummary(msg);
	};
	const handleCompleteAllQuiz = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		console.log(allProverbs.map((p) => p.id));
		const parsed: MainDataType.UserQuizHistory = {
			badges: CONST_BADGES.filter((b) => b.type === 'quiz').map((b) => b.id),
			correctProverbId: allProverbs.map((p) => p.id),
			wrongProverbId: [],
			totalScore: 5500,
			bestCombo: 20,
			lastAnsweredAt: new Date(),
			quizCounts: {}, // 원하면 여기서도 id별로 count 넣을 수 있음
		};
		await AsyncStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify(parsed));
		Alert.alert('처리됨', '모든 퀴즈 완료 + 뱃지 지급!');
	};
	const handleCompleteAllStudy = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		const parsed: MainDataType.UserStudyHistory = {
			badges: CONST_BADGES.filter((b) => b.type === 'study').map((b) => b.id),
			studyProverbs: allProverbs.map((p) => p.id),
			lastStudyAt: new Date(),
			studyCounts: {}, // 원하면 각 사자성어 id별 학습 횟수 설정 가능
		};
		await AsyncStorage.setItem(STORAGE_KEYS.study, JSON.stringify(parsed));
		Alert.alert('처리됨', '모든 학습 완료 + 뱃지 지급!');
	};

	// 모달 타이틀을 타입에 따라 변경
	const getModalTitle = () => {
		switch (resetType) {
			case 'study':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="materialCommunityIcons" name="book-refresh" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>학습을 다시 해볼까요?</Text>
					</View>
				);
			case 'quiz':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="materialCommunityIcons" name="clipboard-refresh-outline" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>퀴즈를 다시 풀어볼까요?</Text>
					</View>
				);
			case 'todayQuiz':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="materialIcons" name="today" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>오늘의 퀴즈를 초기화할까요?</Text>
					</View>
				);
			case 'timeChallenge':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="materialIcons" name="alarm" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>타임 챌린지를 초기화할까요?</Text>
					</View>
				);
			case 'all':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="materialCommunityIcons" name="delete-alert-outline" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>모두 다시 해볼까요?</Text>
					</View>
				);
			default:
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="materialIcons" name="help-outline" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>정말 다시 해볼까요?</Text>
					</View>
				);
		}
	};
	const handleScrollToTop = () => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	const resetTodayQuizOnly = async () => {
		const json = await AsyncStorage.getItem(STORAGE_KEYS.todayQuiz);
		if (!json) return;

		const list: MainDataType.TodayQuizList[] = JSON.parse(json);
		const todayStr = new Date().toISOString().slice(0, 10);

		const updated = list.map((item) => {
			if (item.quizDate.slice(0, 10) === todayStr) {
				return {
					...item,
					todayQuizIdArr: [], // or regenerate if needed
					correctQuizIdArr: [],
					worngQuizIdArr: [],
					answerResults: {},
					selectedAnswers: {},
					// ✅ 출석 유지
					isCheckedIn: item.isCheckedIn ?? false,
				};
			}
			return item;
		});

		await AsyncStorage.setItem(STORAGE_KEYS.todayQuiz, JSON.stringify(updated));
	};

	// handleConfirmDelete 내부 수정
	const handleConfirmDelete = async () => {
		if (!resetType) { return; }

		try {
			if (resetType === 'study') {
				await AsyncStorage.removeItem(STORAGE_KEYS.study);
				Alert.alert('완료', '학습 데이터가 초기화되었습니다');
			} else if (resetType === 'quiz') {
				await AsyncStorage.removeItem(STORAGE_KEYS.quiz);
				Alert.alert('완료', '퀴즈 데이터가 초기화되었습니다');
			} else if (resetType === 'timeChallenge') {
				await AsyncStorage.removeItem(STORAGE_KEYS.timeChallenge);
				Alert.alert('완료', '타임 챌린지 데이터가 초기화되었습니다');
			} else if (resetType === 'todayQuiz') {
				resetTodayQuizOnly();
				Alert.alert('완료', '오늘의 퀴즈 데이터가 초기화되었습니다');
			} else if (resetType === 'all') {
				await AsyncStorage.multiRemove([
					STORAGE_KEYS.study,
					STORAGE_KEYS.quiz,
					STORAGE_KEYS.timeChallenge,
					STORAGE_KEYS.todayQuiz,
				]);
				Alert.alert('완료', '모든 데이터가 초기화되었습니다');
			}

			setModalVisible(false);
			setResetType(null);
			handleScrollToTop();

			// 예: 초기화 후 홈으로 이동하고 싶다면 아래 주석 해제
			// navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME });
		} catch (err) {
			Alert.alert('오류', '초기화 중 오류가 발생했습니다');
		}
	};

	const handleShareApp = async (platform: 'android' | 'ios') => {
		try {
			const storeUrl =
				platform === 'android'
					? '📱 Android: https://play.google.com/store/apps/details?id=com.tha.proverbquiz'
					: '🍏 iOS: https://apps.apple.com/app/id6746687973';

			const message = `
📕 재미있는 속픽: 속담 퀴즈 앱을 추천해요!

이 앱은 다양한 대한민국 속담을 쉽고 재미있게 학습할 수 있도록 도와주는 학습 도구입니다.
퀴즈를 통해 익힌 지식을 점검하고, 틀린 문제는 ‘오답 복습’ 기능으로 반복 학습할 수 있어
완벽한 속담 마스터에 한 걸음 더 다가갈 수 있어요.

지금 바로 다운로드하고 친구와 함께 즐겨보세요!

${storeUrl}
		`.trim();

			await Share.share({ message });
		} catch (error) {
			Alert.alert('오류', '공유 중 문제가 발생했어요.');
		}
	};

	return (
		<>
			<SafeAreaView style={styles.container} edges={['top']}>
				<View style={styles.flexWrapper}>
					<ScrollView
						ref={scrollRef}
						onScroll={handleScroll}
						style={styles.scrollArea}
						contentContainerStyle={{ paddingBottom: scaleHeight(60) }} // 아래 고정 영역 공간 확보
						refreshControl={<RefreshControl refreshing={false} onRefresh={() => { }} />}>
						<AdmobBannerAd paramMarginTop={40} />
						{/* <View style={styles.section} /> */}
						<View style={styles.section}>
							<Text style={styles.title}>🎓 학습/퀴즈 다시 풀기 </Text>
							<View style={styles.buttonGroup}>
								<TouchableOpacity style={[styles.button, styles.resetStudy]} onPress={() => confirmReset('study')}>
									<IconComponent type="materialCommunityIcons" name="refresh" size={18} color="#fff" style={styles.iconLeft} />
									<Text style={styles.buttonText}>학습 다시 하기</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.button, styles.resetQuiz]} onPress={() => confirmReset('quiz')}>
									<IconComponent type="materialCommunityIcons" name="refresh" size={18} color="#fff" style={styles.iconLeft} />
									<Text style={styles.buttonText}>퀴즈 다시 풀기</Text>
								</TouchableOpacity>

								<TouchableOpacity style={[styles.button, styles.resetAll]} onPress={() => confirmReset('all')}>
									<IconComponent type="materialCommunityIcons" name="delete" size={18} color="#fff" style={styles.iconLeft} />
									<Text style={styles.buttonText}>모두 다시 풀기</Text>
								</TouchableOpacity>
							</View>
						</View>

						<View style={styles.section}>
							<Text style={styles.title}>🧹 기타 데이터 초기화</Text>
							<View style={styles.buttonGroup}>
								<TouchableOpacity
									style={[styles.button, { backgroundColor: '#16a085' }]}
									onPress={() => confirmReset('todayQuiz')}>
									<IconComponent type="materialCommunityIcons" name="refresh" size={18} color="#fff" style={styles.iconLeft} />
									<Text style={styles.buttonText}>오늘의 퀴즈 다시 풀기</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.button, { backgroundColor: '#e67e22' }]}
									onPress={() => confirmReset('timeChallenge')}>
									<IconComponent type="materialCommunityIcons" name="refresh" size={18} color="#fff" style={styles.iconLeft} />
									<Text style={styles.buttonText}>타임 챌린지 기록 초기화</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* 기존 설정 UI */}
						{/* <View style={styles.section}>
							<Text style={styles.title}>📌 관리자 패널</Text>
							<View style={styles.buttonGroup}>
								<TouchableOpacity style={[styles.button, { backgroundColor: '#6a1b9a' }]} onPress={handleCompleteAllQuiz}>
									<IconComponent type="materialIcons" name="check-circle" size={18} color="#fff" style={styles.iconLeft} />
									<Text style={styles.buttonText}>모든 퀴즈 완료로 설정</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.button, { backgroundColor: '#0d47a1' }]} onPress={handleCompleteAllStudy}>
									<IconComponent type="materialIcons" name="school" size={18} color="#fff" style={styles.iconLeft} />
									<Text style={styles.buttonText}>모든 학습 완료로 설정</Text>
								</TouchableOpacity>
							</View>
						</View> */}

						{/* ============== 이용약관 및 개인정보처리방침 ==============*/}
						<TouchableOpacity style={styles.policyAccordionHeader} onPress={() => setShowTerms((prev) => !prev)}>
							<Text style={styles.policyAccordionText}>개인정보 처리방침 및 이용약관 {showTerms ? '▲' : '▼'}</Text>
						</TouchableOpacity>
						{showTerms && <TermsScreen />}

						{/* ============== 오픈소스 라이브러리 ==============*/}
						<TouchableOpacity style={styles.policyAccordionHeader} onPress={() => setShowOpenSource((prev) => !prev)}>
							<Text style={styles.policyAccordionText}>오픈소스 라이브러리 {showOpenSource ? '▲' : '▼'}</Text>
						</TouchableOpacity>
						{showOpenSource && <OpenSourceScreen />}
						{/* ✅ 하단 앱 정보 */}
						<View style={styles.footer}>
							<Text style={styles.appVerText}>
								📱 현재 앱 버전: <Text style={styles.appVerBoldText}>v{appVersion}</Text>
							</Text>
							<TouchableOpacity style={styles.hiddenDevTouchArea} onPress={() => setShowDevModal(true)}>
								<Text style={styles.devText}>제작자 소개</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.recommendSection}>
							<Text style={styles.recommendTitle}>📲 앱이 마음에 드셨나요?</Text>
							<Text style={styles.recommendSubtitle}>친구에게 앱을 추천하고 함께 퀴즈를 즐겨보세요!</Text>

							{/* 앱 아이콘 */}
							<View style={styles.appIconWrapper}>
								<Image
									source={require('@/assets/images/mainIcon.png')} // 앱 아이콘 경로에 맞게 조정
									style={styles.appIcon}
									resizeMode="contain"
								/>
							</View>

							{/* 스토어 버튼 */}
							<View style={styles.storeButtons}>
								<TouchableOpacity
									style={[styles.storeButton, { backgroundColor: '#1E88E5' }]}
									onPress={() => handleShareApp('android')}>
									<Text style={styles.storeButtonText}>📱 안드로이드 공유하기</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.storeButton, { backgroundColor: '#2ecc71' }]}
									onPress={() => handleShareApp('ios')}>
									<Text style={styles.storeButtonText}>🍏 애플 공유하기</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>

					{/* ============== 현재 앱버전 명시 ==============*/}
				</View>
			</SafeAreaView>

			{/* 제작자 소개 Modal */}
			<Contributor9Modal visible={showDevModal} onClose={() => setShowDevModal(false)} />
			<Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
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
		</>
	);
};
export default SettingScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	section: {
		marginHorizontal: scaleWidth(20),
		marginBottom: scaleHeight(20),
		backgroundColor: '#f8f9fa',
		padding: scaleWidth(25),
		borderRadius: scaleWidth(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.1,
		shadowRadius: scaleWidth(4),
	},
	hiddenDevTouchArea: {
		alignSelf: 'center',
		width: scaleWidth(80),
		height: scaleWidth(30),
		borderRadius: scaleWidth(28), // 반지름도 줄임
		backgroundColor: '#F8F8F8', // 연한 회색 배경
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
		marginBottom: scaleHeight(30),
	},
	devText: {
		fontSize: scaledSize(13),
		color: '#999999', // 조금 더 진한 회색
		textAlign: 'center',
		fontWeight: '500',
	},
	appVerContainer: {
		marginBottom: 20,
	},
	appVerText: {
		fontSize: 12,
		color: '#95a5a6',
		textAlign: 'center',
		marginBottom: scaleHeight(20),
	},
	appVerBoldText: {
		fontWeight: 'bold',
	},
	policyContentBox: {
		minHeight: 500,
		backgroundColor: '#f9f9f9',
		paddingHorizontal: scaleWidth(10),
		marginHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(10),
		marginBottom: scaleHeight(20),
	},
	policyContentText: {
		fontSize: scaledSize(13),
		color: '#555',
		lineHeight: scaleHeight(22),
	},
	flexWrapper: {
		flex: 1,
	},
	footerFixed: {
		width: '100%',
		borderTopColor: '#eee',
		backgroundColor: '#fff',
		paddingTop: scaleHeight(6),
		paddingBottom: scaleHeight(-20),
		paddingHorizontal: scaleWidth(20),
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 10,
	},
	scrollArea: {
		flex: 1,
		paddingBottom: scaleHeight(100), // ✅ 고정된 하단 영역만큼 패딩 확보
	},
	policyAccordionHeader: {
		width: 'auto',
		alignSelf: 'stretch', // ✅ 전체 너비에서 margin만큼 빠짐
		marginHorizontal: scaleWidth(20), // ✅ 좌우 여백 추가
		borderWidth: 1,
		borderColor: '#dcdde1',
		backgroundColor: '#f8f9fa',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(20),
		marginBottom: scaleHeight(10),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
		justifyContent: 'center',
	},
	policyAccordionText: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
		fontWeight: '600',
	},
	scrollTopButton: {
		position: 'absolute',
		right: 16,
		bottom: 16,
		backgroundColor: '#007AFF',
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
	},
	footer: {
		marginTop: scaleHeight(30),
		alignItems: 'center',
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
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: scaleHeight(15),
		borderRadius: scaleWidth(8),
		marginBottom: scaleHeight(10),
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
	iconLeft: {
		marginRight: scaleWidth(8),
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		width: '85%', // 기존 80% → 90%로 변경
		backgroundColor: '#fff',
		borderRadius: scaleWidth(10),
		padding: scaleWidth(24), // 패딩도 조금 더 여유 있게
	},
	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#34495e',
		textAlign: 'center',
		marginBottom: scaleHeight(12),
	},
	modalSummary: {
		fontSize: scaledSize(14), // 기존 12 → 14로 증가
		color: '#555',
		textAlign: 'center',        // 중앙정렬에서 왼쪽 정렬로 변경 (더 자연스러운 느낌)
		lineHeight: scaleHeight(24), // 기존 22 → 24로 증가
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
	modalTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalTitleText: {
		fontSize: scaledSize(18),
		lineHeight: scaleHeight(44),
		fontWeight: 'bold',
		color: '#34495e',
		textAlign: 'center',
	},
	recommendSection: {
		marginHorizontal: scaleWidth(20),
		marginBottom: scaleHeight(30),
		padding: scaleWidth(20),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleWidth(12),
		alignItems: 'center',
	},
	recommendTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(4),
	},
	recommendSubtitle: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		textAlign: 'center',
		marginBottom: scaleHeight(12),
	},
	appIconWrapper: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		marginBottom: scaleHeight(12),
	},
	appIcon: {
		width: '100%',
		height: '100%',
		borderRadius: scaleWidth(16),
	},
	storeButtons: {
		marginTop: scaleHeight(6),
		flexDirection: 'row',
		gap: scaleWidth(8),
	},
	storeButton: {
		flex: 1,
		paddingVertical: scaleHeight(12),
		borderRadius: scaleWidth(8),
		alignItems: 'center',
	},
	storeButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: scaledSize(13),
	},
});
