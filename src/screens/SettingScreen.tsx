/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */

import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, Linking, Platform, SectionList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import VersionCheck from 'react-native-version-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import IconComponent from './common/atomic/IconComponent';
import Contributor9Modal from './common/modal/Contributor9Modal';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import { CONST_BADGES } from '@/const/ConstBadges';
import ProverbServices from '@/services/ProverbServices';
import { COMMON_APPS_DATA } from '@/const/common/CommonAppsData';
import DeveloperAppsModal from './modal/DeveloperAppsModal';
import { OpenSourceModal, TermsOfServiceModal } from './common/modal/SettingModal';
import CmmDelConfirmModal from './common/modal/CmmDelConfirmModal';
import CurrentVersionModal from './modal/CurrentVersionModal';
import { APP_STORE_URL, GOOGLE_PLAY_STORE_URL } from '@env';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';

const APP_NAME = '속픽: 속담 퀴즈';

const DESCRIPTION =
	'속픽: 속담 퀴즈는 대한민국 속담을 쉽고 재미있게 학습하고, 다양한 퀴즈를 통해 기억을 점검하며, 틀린 문제는 반복 학습으로 완전히 익힐 수 있도록 돕는 속담 학습 앱입니다.';
// ✅ 섹션 정의 (개발 모드에서만 관리자/더미 노출)
const IS_DEV = __DEV__ === true;

const STORAGE_KEYS = {
	study: MainStorageKeyType.USER_STUDY_HISTORY,
	quiz: MainStorageKeyType.USER_QUIZ_HISTORY,
	todayQuiz: MainStorageKeyType.TODAY_QUIZ_LIST,
	timeChallenge: MainStorageKeyType.TIME_CHALLENGE_HISTORY,
	towerChallenge: MainStorageKeyType.TOWER_CHALLENGE_PROGRESS, // ✅ 추가
};

const SettingScreen = () => {
	// useBlockBackHandler(true); // 뒤로가기 모션 막기

	const sectionRef = useRef<SectionList>(null);
	const [showDevModal, setShowDevModal] = useState(false);
	const [appVersion, setAppVersion] = useState('');
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	// resetType state
	const [resetType, setResetType] = useState<'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'towerChallenge' | 'all' | null>(null);
	const [summary, setSummary] = useState<string>('');
	const [showAppsModal, setShowAppsModal] = useState(false);
	const [showTermsModal, setShowTermsModal] = useState(false);
	const [showOpenSourceModal, setShowOpenSourceModal] = useState(false);

	// state
	const [showVersionModal, setShowVersionModal] = useState(false);
	const [latestVersion, setLatestVersion] = useState<string | null>(null);
	const [iapPrice, setIapPrice] = useState<string | null>(null);

	const [isAdRemoved, setIsAdRemoved] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadVersion();
			scrollToTop();
		}, []),
	);

	useEffect(() => {
		const loadState = async () => {
			const val = await AsyncStorage.getItem('IS_AD_REMOVED');
			setIsAdRemoved(val === 'true');
		};
		loadState();
	}, []);

	const loadVersion = () => {
		const version = VersionCheck.getCurrentVersion();
		setAppVersion(version);
	};

	const scrollToTop = () => sectionRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: true });

	const confirmReset = async (type: 'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'towerChallenge' | 'all') => {
		getSummaryMessage(type);
		setResetType(type);
		setModalVisible(true);
	};

	const getSummaryMessage = (type: 'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'towerChallenge' | 'all') => {
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
			case 'towerChallenge':
				msg = '타워 챌린지의 모든 진행 상황이 초기화돼요.\n 처음부터 다시 도전하시겠어요?';
				break;
			case 'all':
				msg = '지금까지 학습하고 풀었던 모든 기록이 사라져요. 정말 전부 다시 시작할까요?';
				break;

			default:
				msg = '정말 초기화하시겠어요?';
		}

		setSummary(msg);
	};

	const resetTodayQuizOnly = async () => {
		const json = await AsyncStorage.getItem(STORAGE_KEYS.todayQuiz);
		if (!json) {
			return;
		}

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
		if (!resetType) {
			return;
		}

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
				// resetType === 'all' 케이스의 multiRemove 배열
				await AsyncStorage.multiRemove([
					STORAGE_KEYS.study,
					STORAGE_KEYS.quiz,
					STORAGE_KEYS.timeChallenge,
					STORAGE_KEYS.todayQuiz,
					STORAGE_KEYS.towerChallenge, // ✅ 추가
				]);
				Alert.alert('완료', '모든 데이터가 초기화되었습니다');
				// handleConfirmDelete - else if 추가 (resetType === 'all' 앞에)
			} else if (resetType === 'towerChallenge') {
				await AsyncStorage.removeItem(STORAGE_KEYS.towerChallenge);
				Alert.alert('완료', '타워 챌린지 데이터가 초기화되었습니다');
			}
			setModalVisible(false);
			setResetType(null);
			scrollToTop();
		} catch (err) {
			Alert.alert('오류', '초기화 중 오류가 발생했습니다');
		}
	};

	const handleCompleteAllQuiz = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		console.log(allProverbs.map((p) => p.id));
		const parsed: MainDataType.UserQuizHistory = {
			badges: CONST_BADGES.filter((b) => b.type === 'quiz').map((b) => b.id),
			correctProverbId: allProverbs.map((p) => p.id),
			wrongProverbId: [],
			totalScore: 7900,
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
			studyProverbes: allProverbs.map((p) => p.id),
			lastStudyAt: new Date(),
			studyCounts: {}, // 원하면 각 사자성어 id별 학습 횟수 설정 가능
		};
		await AsyncStorage.setItem(STORAGE_KEYS.study, JSON.stringify(parsed));
		Alert.alert('처리됨', '모든 학습 완료 + 뱃지 지급!');
	};

	// 5. handleCompleteAllTower 함수 추가 (handleCompleteAllStudy 아래에)
	const handleCompleteAllTower = async () => {
		const allLevels = TOWER_LEVELS.map((t) => t.level);
		const towerProgress: TowerProgress = {
			level: TOWER_LEVELS[TOWER_LEVELS.length - 1].level,
			attempts: 0,
			adRewardUsed: 0,
			completedLevels: allLevels,
			currentQuestion: 0,
			correctAnswers: 0,
			lastAttemptDate: new Date().toISOString(),
			unlockedRewards: allLevels,
		};
		await AsyncStorage.setItem(STORAGE_KEYS.towerChallenge, JSON.stringify(towerProgress));
		Alert.alert('처리됨', '모든 타워 클리어 완료!');
	};
	const checkIsLatestVersion = async () => {
		try {
			const updateNeeded = await VersionCheck.needUpdate();
			if (updateNeeded?.isNeeded) {
				// 🔻 최신 버전이 있으면 모달 열기
				setLatestVersion(updateNeeded.latestVersion);
				setShowVersionModal(true);
			} else {
				// 🔻 최신 버전일 경우 Alert으로만 알림
				Alert.alert('최신 버전', `현재 v${appVersion}이 최신 버전입니다`);
			}
		} catch (err) {
			Alert.alert('오류', '버전 확인 중 문제가 발생했습니다.');
		}
	};

	const sections: { title: React.ReactNode; data: string[] }[] = useMemo(() => {
		const resetSection = {
			title: <Text style={[styles.sectionHeaderText, { color: '#E53935' }]}>사용자 정보 초기화</Text>,
			data: ['resetStudy', 'resetQuiz', 'resetTodayQuiz', 'resetTimeChallenge', 'resetTowerChallenge', 'resetAll'], // ✅ resetTowerChallenge 추가
		};

		const feedbackSection = {
			title: <Text style={styles.sectionHeaderText}>문의 및 피드백</Text>,
			data: ['rate', 'inquiry', 'developerInfo', 'developerApps'],
		};

		const policyData = ['privacyPolicy', 'openSource', 'checkVersion'];

		if (__DEV__) {
			policyData.push('completeAllQuiz', 'completeAllStudy', 'completeAllTower');
		}

		const policySection = {
			title: <Text style={styles.sectionHeaderText}>정책 및 라이선스</Text>,
			data: policyData,
		};

		return [resetSection, feedbackSection, policySection].filter((s) => Array.isArray(s.data) && s.data.length > 0);
	}, []);

	const renderItem = ({ item }: { item: string }) => {
		const settingsMap: Record<string, { label: string; icon: { type: 'MaterialCommunityIcons' | 'materialIcons'; name: string } }> = {
			rate: {
				label: '앱 리뷰 남기기',
				icon: { type: 'MaterialCommunityIcons', name: 'star-outline' },
			},
			inquiry: {
				label: '문의하기',
				icon: { type: 'MaterialCommunityIcons', name: 'email-outline' },
			},

			resetStudy: {
				label: '학습 다시 풀기',
				icon: { type: 'MaterialCommunityIcons', name: 'refresh' },
			},
			resetQuiz: {
				label: '퀴즈 다시 풀기',
				icon: { type: 'MaterialCommunityIcons', name: 'refresh' },
			},
			resetAll: {
				label: '모두 다시 풀기',
				icon: { type: 'materialIcons', name: 'delete' },
			},
			resetTodayQuiz: {
				label: '오늘의 퀴즈 다시 풀기',
				icon: { type: 'MaterialCommunityIcons', name: 'refresh' },
			},
			resetTimeChallenge: {
				label: '타임 챌린지 기록 초기화',
				icon: { type: 'MaterialCommunityIcons', name: 'refresh' },
			},
			// settingsMap에 추가
			resetTowerChallenge: {
				label: '타워 챌린지 초기화',
				icon: { type: 'MaterialCommunityIcons', name: 'refresh' },
			},

			developerInfo: {
				label: '제작자 소개',
				icon: { type: 'MaterialCommunityIcons', name: 'account-circle-outline' },
			},
			developerApps: {
				label: '제작자 앱 더보기',
				icon: { type: 'MaterialCommunityIcons', name: 'apps' },
			},
			privacyPolicy: {
				label: '개인정보 처리방침 및 이용약관',
				icon: { type: 'MaterialCommunityIcons', name: 'shield-lock-outline' },
			},
			openSource: {
				label: '오픈소스 라이브러리',
				icon: { type: 'MaterialCommunityIcons', name: 'file-code-outline' },
			},
			checkVersion: {
				label: '최신 버전 확인',
				icon: { type: 'MaterialCommunityIcons', name: 'update' },
			},

			...(IS_DEV && {
				generateDummyData: {
					label: '더미데이터 생성',
					icon: { type: 'MaterialCommunityIcons', name: 'apps' },
				},
				completeAllQuiz: {
					label: '모든 퀴즈 완료 설정',
					icon: { type: 'materialIcons', name: 'check-circle' },
				},
				completeAllStudy: {
					label: '모든 학습 완료로 설정',
					icon: { type: 'materialIcons', name: 'school' },
				},
				completeAllTower: {
					label: '모든 타워 클리어 설정',
					icon: { type: 'materialIcons', name: 'tower' }, // 없으면 'flag' 사용
				},
			}),
		};
		// ===== 설정 아이템 동작 =====
		const handlePress = async (item: string) => {
			switch (item) {
				case 'resetStudy':
					confirmReset('study');
					break;

				case 'resetQuiz':
					confirmReset('quiz');
					break;

				case 'resetTodayQuiz':
					confirmReset('todayQuiz');
					break;

				case 'resetTimeChallenge':
					confirmReset('timeChallenge');
					break;

				case 'resetAll':
					confirmReset('all');
					break;

				// handlePress에 동작 추가
				case 'checkVersion':
					checkIsLatestVersion();
					break;

				// handlePress - case 추가
				case 'resetTowerChallenge':
					confirmReset('towerChallenge');
					break;
				case 'rate':
					try {
						const storeUrl = Platform.OS === 'android' ? GOOGLE_PLAY_STORE_URL : APP_STORE_URL;

						if (!storeUrl) {
							Alert.alert('Coming Soon..!', '아직 스토어에 출시되지 않았습니다.');
							return;
						}

						const supported = await Linking.canOpenURL(storeUrl);
						if (supported) {
							await Linking.openURL(storeUrl);
						} else {
							Alert.alert('오류', '스토어 페이지를 열 수 없습니다.');
						}
					} catch (err) {
						Alert.alert('오류', '리뷰 페이지로 이동 중 문제가 발생했습니다.');
					}
					break;

				case 'inquiry':
					const version = await VersionCheck.getCurrentVersion();
					const os = Platform.OS === 'android' ? 'Android' : 'iOS';
					const device = await DeviceInfo.getModel(); // 예: "iPhone 14 Pro"

					const body = [
						'',
						'',
						'',
						'',
						'아래에 내용을 함께 보내주시면 문의사항을 처리하는데 도움이 됩니다.',
						'',
						'--------------',
						`앱 버전: ${version}`,
						`운영 체제: ${os}`,
						`기기: ${device}`,
						'--------------',
					].join('\n'); // 줄바꿈은 \n 사용 (이걸 encodeURIComponent가 처리함)

					const encodedBody = encodeURIComponent(body); // ✅ 반드시 인코딩!

					const mailto = `mailto:adjh54ir@gmail.com?subject=${encodeURIComponent(`${APP_NAME} 앱 문의`)}&body=${encodedBody}`;

					Linking.openURL(mailto);
					break;

				case 'developerInfo':
					setShowDevModal(true);
					break;
				case 'developerApps':
					setShowAppsModal(true);
					break;

				case 'privacyPolicy':
					setShowTermsModal(true);
					break;
				case 'openSource':
					setShowOpenSourceModal(true);
					break;

				case 'completeAllQuiz':
					handleCompleteAllQuiz();
					break;
				case 'completeAllStudy':
					handleCompleteAllStudy();
					break;
				case 'completeAllTower':
					handleCompleteAllTower();
					break;
			}
		};

		return (
			<TouchableOpacity style={styles.cardButton} onPress={() => handlePress(item)}>
				<View style={styles.row}>
					<IconComponent
						type={settingsMap[item].icon.type}
						name={settingsMap[item].icon.name}
						size={scaledSize(20)}
						// renderItem - 빨간 아이콘 배열
						color={
							['resetStudy', 'resetQuiz', 'resetAll', 'resetTodayQuiz', 'resetTimeChallenge', 'resetTowerChallenge'].includes(item) ? '#e74c3c' : '#333'
						}
						style={styles.icon}
						isBottomIcon={true}
					/>
					<Text style={[styles.cardText]}>{settingsMap[item].label}</Text>
				</View>
			</TouchableOpacity>
		);
	};

	const shareApp = async () => {
		try {
			// 1) 스토어 링크 확보 (하드코딩 > VersionCheck)
			const [playRes, appRes] = await Promise.all([
				GOOGLE_PLAY_STORE_URL
					? Promise.resolve({ storeUrl: GOOGLE_PLAY_STORE_URL })
					: VersionCheck.needUpdate({ provider: 'playStore' }).catch(() => null),
				APP_STORE_URL ? Promise.resolve({ storeUrl: APP_STORE_URL }) : VersionCheck.needUpdate({ provider: 'appStore' }).catch(() => null),
			]);

			const androidUrl = playRes?.storeUrl || '';
			const iosUrl = appRes?.storeUrl || '';

			if (!androidUrl && !iosUrl) {
				Alert.alert('Coming Soon..!', '아직 안드로이드/iOS 스토어에 출시되지 않았습니다.');
				return;
			}

			// 2) 공유 메시지 구성 (두 링크 모두 포함)
			const messageLines = [
				`📱 ${APP_NAME}`,
				'',
				DESCRIPTION,
				'',
				'🔗 다운로드 링크',
				`• Android: ${androidUrl || '출시 예정입니다..'}`,
				'',
				`• iOS: ${iosUrl || '출시 예정입니다..'}`,
			];
			const message = messageLines.join('\n');

			// 3) 플랫폼별 Share 호출
			// - iOS: url 필드가 우선 사용되므로 대표 링크 하나도 넣어줌(있으면 iOS 링크, 없으면 Android 링크)
			const sharePayload = Platform.OS === 'ios' ? { message, url: iosUrl || androidUrl, title: APP_NAME } : { message, title: APP_NAME };

			await Share.share(sharePayload);
		} catch (e) {
			console.warn('앱 공유 오류:', e);
			Alert.alert('오류', '앱 정보를 불러오는 중 문제가 발생했습니다.');
		}
	};

	// 모달 타이틀을 타입에 따라 변경
	const getModalTitle = () => {
		switch (resetType) {
			case 'study':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="MaterialCommunityIcons" name="refresh" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>학습을 다시 해볼까요?</Text>
					</View>
				);
			case 'quiz':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="MaterialCommunityIcons" name="refresh" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>퀴즈를 다시 풀어볼까요?</Text>
					</View>
				);
			case 'todayQuiz':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="MaterialCommunityIcons" name="refresh" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>오늘의 퀴즈를 초기화할까요?</Text>
					</View>
				);
			case 'timeChallenge':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="MaterialCommunityIcons" name="refresh" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>타임 챌린지를 초기화할까요?</Text>
					</View>
				);
			// getModalTitle - case 추가 (case 'all': 앞에)
			case 'towerChallenge':
				return (
					<View style={styles.modalTitleRow}>
						<IconComponent type="MaterialCommunityIcons" name="refresh" size={20} color="#34495e" style={styles.iconLeft} />
						<Text style={styles.modalTitleText}>타워 챌린지를 초기화할까요?</Text>
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
				return <></>;
		}
	};

	return (
		<>
			<SafeAreaView style={styles.container} edges={['top']}>
				<SectionList
					ref={sectionRef}
					keyExtractor={(item, index) => `${item}-${index}`}
					renderItem={renderItem}
					sections={sections.map((section, sectionIndex) => ({
						...section,
						key: `section-${sectionIndex}`,
					}))}
					onScroll={(event) => {
						const offsetY = event.nativeEvent.contentOffset.y;
						setShowScrollTop(offsetY > 100);
					}}
					contentContainerStyle={styles.listContent}
					ItemSeparatorComponent={() => <View style={styles.itemSpacing} />}
					renderSectionFooter={() => <View style={styles.sectionSpacing} />}
					ListHeaderComponent={
						<>
							<View style={styles.headerContainer}>
								<View style={styles.recommendSection}>
									<Text style={styles.recommendTitle}>📲 앱이 마음에 드셨나요?</Text>
									<Text style={styles.recommendSubtitle}>가족이나 친구, 지인에게 유용한 앱을 함께 나눠보세요!</Text>

									<View style={styles.appIconWrapper}>
										<Image source={require('@/assets/images/mainIcon.png')} style={styles.appIcon} resizeMode="contain" />
									</View>

									<View style={styles.storeButtons}>
										<TouchableOpacity style={[styles.storeButton, { backgroundColor: '#2ecc71' }]} onPress={shareApp}>
											<View style={styles.iconRow}>
												<IconComponent type="MaterialCommunityIcons" name="share-variant" size={scaledSize(16)} color="#fff" />
												<Text style={styles.storeButtonText}>공유하기</Text>
											</View>
										</TouchableOpacity>
									</View>
								</View>
							</View>
							{/* {!isAdRemoved && (
								<InAppRemoveAdsSection />
							)} */}
						</>
					}
					ListFooterComponent={
						<View style={styles.footerAppWrapper}>
							<Text style={styles.appVerText}>
								📱 현재 앱 버전: <Text style={styles.appVerBoldText}>v{appVersion}</Text>
							</Text>
							<FlatList
								horizontal
								data={COMMON_APPS_DATA.Apps}
								keyExtractor={(item, index) => `${item.id}-${index}`}
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.footerAppList}
								renderItem={({ item }) => {
									const handlePress = async () => {
										const storeUrl = Platform.OS === 'android' ? item.android : item.ios;
										if (!storeUrl) {
											Alert.alert('Coming Soon..!', '아직 이 플랫폼에서는 출시되지 않았습니다.');
											return;
										}
										const supported = await Linking.canOpenURL(storeUrl);
										if (supported) {
											Linking.openURL(storeUrl);
										} else {
											Alert.alert('오류', '스토어 페이지를 열 수 없습니다.');
										}
									};

									return (
										<TouchableOpacity style={styles.footerAppCard} onPress={handlePress}>
											<Image source={item.icon} style={styles.footerAppIcon} resizeMode="contain" />
											<Text style={styles.footerAppTitle}>{item.title}</Text>
											<Text style={styles.footerAppDesc} numberOfLines={2}>
												{item.desc}
											</Text>
										</TouchableOpacity>
									);
								}}
							/>
						</View>
					}
					renderSectionHeader={({ section }) =>
						section.title ? (
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionHeaderText}>{section.title}</Text>
							</View>
						) : (
							<View style={{ height: scaleHeight(10) }} />
						)
					}
				/>
			</SafeAreaView>

			{/* 제작자 소개 Modal */}
			<Contributor9Modal visible={showDevModal} onClose={() => setShowDevModal(false)} />

			{/* 제작자 앱 더보기 팝업 */}
			<DeveloperAppsModal visible={showAppsModal} onClose={() => setShowAppsModal(false)} />

			{/* 스크롤 최상단 이동 버튼 */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
					<IconComponent type="fontawesome6" name="arrow-up" size={20} color="#ffffff" />
				</TouchableOpacity>
			)}

			{/* 개인정보처리방침 및 이용약관 팝업 */}
			{showTermsModal && <TermsOfServiceModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />}
			{/* 오픈소스 라이브러리 팝업 */}
			{showOpenSourceModal && <OpenSourceModal visible={showOpenSourceModal} onClose={() => setShowOpenSourceModal(false)} />}

			<CmmDelConfirmModal
				visible={modalVisible}
				onCancel={() => setModalVisible(false)}
				onConfirm={handleConfirmDelete}
				onRequestClose={() => setModalVisible(false)} // Android 백버튼
				renderTitle={getModalTitle} // 기존 커스텀 타이틀 함수 재사용
				summary={summary}
			/>
			<CurrentVersionModal
				visible={showVersionModal}
				currentVersion={appVersion}
				latestVersion={latestVersion}
				onClose={() => setShowVersionModal(false)}
				onUpdatePress={() => {
					if (latestVersion) {
						Linking.openURL(Platform.OS === 'android' ? GOOGLE_PLAY_STORE_URL : APP_STORE_URL);
					}
				}}
			/>
		</>
	);
};
export default SettingScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f9f9f9',
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
		marginBottom: scaleHeight(20),
	},
	policyContentBox: {
		minHeight: scaleHeight(500),
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
		paddingBottom: scaleHeight(50), // ✅ 고정된 하단 영역만큼 패딩 확보
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
		right: scaleWidth(16),
		bottom: scaleHeight(16),
		backgroundColor: '#007AFF',
		width: scaleWidth(36),
		height: scaleWidth(36), // 보통 width와 height는 같은 비율 유지
		borderRadius: scaleWidth(24),
		justifyContent: 'center',
		alignItems: 'center',

		// ✅ iOS 그림자
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.25,
		shadowRadius: scaleWidth(4),
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
		fontWeight: '600', // 기존 bold보다 살짝 가벼워서 현대적인 느낌
		fontSize: scaledSize(15), // 기존 14 → 약간 크게
		letterSpacing: 0.5, // 글자 사이 간격 추가
		textAlign: 'center', // 아이콘이 없을 때도 중앙정렬
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
		textAlign: 'center', // 중앙정렬에서 왼쪽 정렬로 변경 (더 자연스러운 느낌)
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
		marginBottom: scaleHeight(12), // ← 간격 여기로
	},
	modalTitleText: {
		fontSize: scaledSize(18),
		lineHeight: scaleHeight(44),
		fontWeight: 'bold',
		color: '#34495e',
		textAlign: 'center',
	},
	listContent: {
		paddingBottom: scaleHeight(24),
	},
	cardButton: {
		backgroundColor: '#fff',
		borderRadius: 12,
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(16),
		marginHorizontal: scaleHeight(20),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 3,
		flexDirection: 'row',
		alignItems: 'center',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	icon: {
		marginRight: scaleWidth(12), // 기존보다 여유
		color: '#34495e', // 통일된 톤
	},
	cardText: {
		fontSize: scaledSize(15), // 살짝 줄여서 현대적인 느낌
		color: '#2c3e50', // 조금 더 진한 톤
		fontWeight: '500', // 중간 두께
		letterSpacing: 0.3, // 글자 간격 추가
		flexShrink: 1, // 길어져도 잘림 방지
	},
	itemSpacing: {
		height: scaleHeight(10),
	},
	sectionSpacing: {
		height: scaleHeight(24), // 섹션 사이 간격
	},
	versionText: {
		textAlign: 'center',
		color: '#999',
		fontSize: scaledSize(13),
		paddingVertical: scaleHeight(20),
	},
	recommendSection: {
		marginHorizontal: scaleWidth(20),
		padding: scaleWidth(20),
		backgroundColor: '#f2f2f2', // ⬅️ 회색으로 변경
		borderRadius: scaleWidth(12),
		borderWidth: 1,
		borderColor: '#e1e4e8',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		alignItems: 'center',
		marginTop: scaleHeight(12),
	},
	recommendTitle: {
		fontSize: scaledSize(17),
		fontWeight: '700',
		color: '#34495e',
		marginBottom: scaleHeight(6),
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
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: scaleWidth(16),
		overflow: 'hidden', // FastImage일 경우도 고려
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
	iconRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(6), // 아이콘과 텍스트 사이 간격
	},
	versionBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#ecf0f1',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(10),
		marginBottom: scaleHeight(12),
		alignSelf: 'flex-start',
	},
	versionIcon: {
		marginRight: scaleWidth(8),
	},
	versionLabel: {
		fontSize: scaledSize(14),
		color: '#34495e',
		fontWeight: '600',
		marginRight: scaleWidth(6),
	},
	versionValue: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
	},
	appVerText: {
		fontSize: scaledSize(12),
		color: '#95a5a6',
		textAlign: 'center',
		marginBottom: scaleHeight(20),
	},
	appVerBoldText: {
		fontWeight: 'bold',
	},
	headerContainer: {
		marginBottom: scaleHeight(5),
	},
	sectionHeaderText: {
		fontSize: scaledSize(15), // 살짝 줄여서 더 깔끔하게
		fontWeight: '600', // 굵기는 중간 정도
		color: '#34495e', // 톤 다운된 네이비
		letterSpacing: 0.5, // 글자 간격
		textTransform: 'uppercase', // 대문자(원하면만)
	},
	sectionHeader: {
		marginVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(20),
		paddingVertical: scaleHeight(10),
		marginHorizontal: scaleWidth(16),
		backgroundColor: '#ecf3f9',
		borderLeftWidth: scaleWidth(4),
		borderLeftColor: '#3498db', // 포인트 블루
		marginBottom: scaleHeight(12),
		borderRadius: scaleWidth(4),
	},
	footerAppWrapper: {
		paddingVertical: scaleHeight(12),
	},
	footerAppList: {
		paddingHorizontal: scaleWidth(16),
		gap: scaleWidth(12),
		marginBottom: scaleHeight(12),
	},

	footerAppCard: {
		width: scaleWidth(120),
		padding: scaleWidth(12),
		borderRadius: scaleWidth(12),
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'flex-start',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},

	footerAppIcon: {
		width: scaleWidth(64),
		height: scaleWidth(64),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(8),
	},

	footerAppTitle: {
		fontSize: scaledSize(13),
		fontWeight: '600',
		color: '#2c3e50',
		textAlign: 'center',
		marginBottom: scaleHeight(4),
	},

	footerAppDesc: {
		fontSize: scaledSize(11),
		color: '#7f8c8d',
		textAlign: 'center',
	},
	purchaseContainer: {
		backgroundColor: '#ffffff',
		padding: scaleWidth(20),
		marginHorizontal: scaleWidth(20),
		marginTop: scaleHeight(12),
		marginBottom: scaleHeight(8),
		borderRadius: scaleWidth(12),
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 3,
		shadowOffset: { width: 0, height: 2 },
	},

	purchaseTitle: {
		fontSize: scaledSize(16),
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: scaleHeight(4),
	},

	purchaseDesc: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginBottom: scaleHeight(12),
		lineHeight: scaleHeight(20),
	},

	purchaseButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(12),
		borderRadius: scaleWidth(8),
	},

	purchaseButtonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: scaledSize(14),
	},

	premiumDesc: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(6),
		marginBottom: scaleHeight(10),
		textAlign: 'center',
	},

	premiumPrice: {
		fontSize: scaledSize(14),
		color: '#34495e',
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: scaleHeight(14),
	},

	freeBadge: {
		backgroundColor: '#eaf7ff',
		borderColor: '#3498db',
		borderWidth: 1,
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(8),
		alignSelf: 'center',
		marginBottom: scaleHeight(10),
	},

	freeBadgeText: {
		fontSize: scaledSize(13),
		color: '#1b73c8',
		fontWeight: '700',
	},
	premiumDescBox: {
		borderWidth: 1,
		borderColor: '#d5e4f3', // 연한 블루감 (너무 진하지 않게)
		backgroundColor: '#f7fbff', // 살짝 푸른 배경으로 Premium 느낌
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(14),
		borderRadius: scaleWidth(10),
		marginBottom: scaleHeight(12),
	},
	premiumContainer: {
		backgroundColor: '#ffffff',
		padding: scaleWidth(20),
		marginHorizontal: scaleWidth(20),
		marginTop: scaleHeight(16),
		marginBottom: scaleHeight(12),
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: '#e2e6ea',

		// 은은한 카드 그림자
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
	},

	premiumHeader: {
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},

	premiumTitle: {
		fontSize: scaledSize(18),
		fontWeight: '700',
		color: '#2c3e50',
	},

	premiumSubtitle: {
		fontSize: scaledSize(11),
		color: '#8395a7',
		letterSpacing: 1.2,
		marginTop: scaleHeight(2),
	},

	premiumBadge: {
		backgroundColor: '#eaf4ff',
		borderColor: '#2c82f5',
		borderWidth: 1,
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		borderRadius: scaleWidth(30),
		alignSelf: 'center',
		marginBottom: scaleHeight(14),
	},

	premiumBadgeText: {
		fontSize: scaledSize(13),
		color: '#2c82f5',
		fontWeight: '700',
	},

	benefitList: {
		marginBottom: scaleHeight(12),
	},

	benefitItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
		marginBottom: scaleHeight(6),
	},

	benefitText: {
		fontSize: scaledSize(13),
		color: '#546e7a',
	},

	premiumButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#2c82f5',
		paddingVertical: scaleHeight(12),
		borderRadius: scaleWidth(10),
		marginBottom: scaleHeight(8),
	},

	premiumButtonText: {
		color: '#fff',
		fontSize: scaledSize(14),
		fontWeight: '700',
	},

	restoreButton: {
		paddingVertical: scaleHeight(6),
		alignSelf: 'center',
	},

	restoreText: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
		textDecorationLine: 'underline',
	},
});
