/* eslint-disable react/no-unstable-nested-components */

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

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const APP_NAME = '속픽: 속담 퀴즈';
const DESCRIPTION =
	'속픽: 속담 퀴즈는 대한민국 속담을 쉽고 재미있게 학습하고, 다양한 퀴즈를 통해 기억을 점검하며, 틀린 문제는 반복 학습으로 완전히 익힐 수 있도록 돕는 속담 학습 앱입니다.';
const IS_DEV = __DEV__ === true;

const STORAGE_KEYS = {
	study: MainStorageKeyType.USER_STUDY_HISTORY,
	quiz: MainStorageKeyType.USER_QUIZ_HISTORY,
	todayQuiz: MainStorageKeyType.TODAY_QUIZ_LIST,
	timeChallenge: MainStorageKeyType.TIME_CHALLENGE_HISTORY,
	towerChallenge: MainStorageKeyType.TOWER_CHALLENGE_PROGRESS,
};

type ResetType = 'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'towerChallenge' | 'all';

// ─────────────────────────────────────────────
// 리셋 설정 테이블 (switch문 → 데이터 기반)
// ─────────────────────────────────────────────
const RESET_CONFIG: Record<ResetType, { title: string; summary: string; iconName: string }> = {
	study: { title: '학습을 다시 해볼까요?', summary: '지금까지 학습했던 내용들이 모두 사라져요.\n 정말 다시 시작할까요?', iconName: 'refresh' },
	quiz: { title: '퀴즈를 다시 풀어볼까요?', summary: '지금까지 풀었던 퀴즈 기록이 초기화돼요. \n 다시 도전해볼까요?', iconName: 'refresh' },
	todayQuiz: { title: '오늘의 퀴즈를 초기화할까요?', summary: '오늘의 퀴즈 기록이 사라져요. \n다시 새로 시작할까요?', iconName: 'refresh' },
	timeChallenge: { title: '타임 챌린지를 초기화할까요?', summary: '타임 챌린지 기록이 모두 초기화돼요.\n 괜찮으신가요?', iconName: 'refresh' },
	towerChallenge: {
		title: '타워 챌린지를 초기화할까요?',
		summary: '타워 챌린지의 모든 진행 상황이 초기화돼요.\n 처음부터 다시 도전하시겠어요?',
		iconName: 'refresh',
	},
	all: {
		title: '모두 다시 해볼까요?',
		summary: '지금까지 학습하고 풀었던 모든 기록이 사라져요. 정말 전부 다시 시작할까요?',
		iconName: 'delete-alert-outline',
	},
};

// ─────────────────────────────────────────────
// 설정 아이템 정의 (컴포넌트 외부)
// ─────────────────────────────────────────────
type IconType = 'MaterialCommunityIcons' | 'materialIcons';

const SETTINGS_MAP: Record<string, { label: string; icon: { type: IconType; name: string } }> = {
	rate: { label: '앱 리뷰 남기기', icon: { type: 'MaterialCommunityIcons', name: 'star-outline' } },
	inquiry: { label: '문의하기', icon: { type: 'MaterialCommunityIcons', name: 'email-outline' } },
	resetStudy: { label: '학습 다시 풀기', icon: { type: 'MaterialCommunityIcons', name: 'refresh' } },
	resetQuiz: { label: '퀴즈 다시 풀기', icon: { type: 'MaterialCommunityIcons', name: 'refresh' } },
	resetTodayQuiz: { label: '오늘의 퀴즈 다시 풀기', icon: { type: 'MaterialCommunityIcons', name: 'refresh' } },
	resetTimeChallenge: { label: '타임 챌린지 기록 초기화', icon: { type: 'MaterialCommunityIcons', name: 'refresh' } },
	resetTowerChallenge: { label: '타워 챌린지 초기화', icon: { type: 'MaterialCommunityIcons', name: 'refresh' } },
	resetAll: { label: '모두 다시 풀기', icon: { type: 'materialIcons', name: 'delete' } },
	developerInfo: { label: '제작자 소개', icon: { type: 'MaterialCommunityIcons', name: 'account-circle-outline' } },
	developerApps: { label: '제작자 앱 더보기', icon: { type: 'MaterialCommunityIcons', name: 'apps' } },
	privacyPolicy: { label: '개인정보 처리방침 및 이용약관', icon: { type: 'MaterialCommunityIcons', name: 'shield-lock-outline' } },
	openSource: { label: '오픈소스 라이브러리', icon: { type: 'MaterialCommunityIcons', name: 'file-code-outline' } },
	checkVersion: { label: '최신 버전 확인', icon: { type: 'MaterialCommunityIcons', name: 'update' } },
	...(IS_DEV && {
		completeAllQuiz: { label: '모든 퀴즈 완료 설정', icon: { type: 'materialIcons', name: 'check-circle' } },
		completeAllStudy: { label: '모든 학습 완료로 설정', icon: { type: 'materialIcons', name: 'school' } },
		completeAllTower: { label: '모든 타워 클리어 설정', icon: { type: 'materialIcons', name: 'flag' } },
	}),
};

const RESET_ITEM_KEYS = ['resetStudy', 'resetQuiz', 'resetAll', 'resetTodayQuiz', 'resetTimeChallenge', 'resetTowerChallenge'];

// ─────────────────────────────────────────────
// 섹션 정의
// ─────────────────────────────────────────────
const BASE_SECTIONS = [
	{
		titleText: '사용자 정보 초기화',
		titleColor: '#E53935' as string | undefined,
		data: ['resetStudy', 'resetQuiz', 'resetTodayQuiz', 'resetTimeChallenge', 'resetTowerChallenge', 'resetAll'],
	},
	{
		titleText: '문의 및 피드백',
		data: ['rate', 'inquiry', 'developerInfo', 'developerApps'],
	},
	{
		titleText: '정책 및 라이선스',
		data: ['privacyPolicy', 'openSource', 'checkVersion', ...(IS_DEV ? ['completeAllQuiz', 'completeAllStudy', 'completeAllTower'] : [])],
	},
];

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
const SettingScreen = () => {
	const sectionRef = useRef<SectionList>(null);

	const [showDevModal, setShowDevModal] = useState(false);
	const [showAppsModal, setShowAppsModal] = useState(false);
	const [showTermsModal, setShowTermsModal] = useState(false);
	const [showOpenSourceModal, setShowOpenSourceModal] = useState(false);
	const [showVersionModal, setShowVersionModal] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [modalVisible, setModalVisible] = useState(false);
	const [resetType, setResetType] = useState<ResetType | null>(null);
	const [appVersion, setAppVersion] = useState('');
	const [latestVersion, setLatestVersion] = useState<string | null>(null);

	// ── 파생 상태 (RESET_CONFIG 기반) ──────────────
	const resetConfig = resetType ? RESET_CONFIG[resetType] : null;

	useFocusEffect(
		useCallback(() => {
			setAppVersion(VersionCheck.getCurrentVersion());
			scrollToTop();
		}, []),
	);

	const scrollToTop = () => sectionRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: true });

	// ── 리셋 실행 ─────────────────────────────────
	const openResetModal = (type: ResetType) => {
		setResetType(type);
		setModalVisible(true);
	};

	const resetTodayQuizOnly = async () => {
		const json = await AsyncStorage.getItem(STORAGE_KEYS.todayQuiz);
		if (!json) {
			return;
		}

		const todayStr = new Date().toISOString().slice(0, 10);
		const updated = (JSON.parse(json) as MainDataType.TodayQuizList[]).map((item) =>
			item.quizDate.slice(0, 10) === todayStr
				? {
						...item,
						todayQuizIdArr: [],
						correctQuizIdArr: [],
						worngQuizIdArr: [],
						answerResults: {},
						selectedAnswers: {},
						isCheckedIn: item.isCheckedIn ?? false,
					}
				: item,
		);
		await AsyncStorage.setItem(STORAGE_KEYS.todayQuiz, JSON.stringify(updated));
	};

	const RESET_ACTIONS: Record<ResetType, () => Promise<void>> = {
		study: async () => {
			await AsyncStorage.removeItem(STORAGE_KEYS.study);
			Alert.alert('완료', '학습 데이터가 초기화되었습니다');
		},
		quiz: async () => {
			await AsyncStorage.removeItem(STORAGE_KEYS.quiz);
			Alert.alert('완료', '퀴즈 데이터가 초기화되었습니다');
		},
		timeChallenge: async () => {
			await AsyncStorage.removeItem(STORAGE_KEYS.timeChallenge);
			Alert.alert('완료', '타임 챌린지 데이터가 초기화되었습니다');
		},
		towerChallenge: async () => {
			await AsyncStorage.removeItem(STORAGE_KEYS.towerChallenge);
			Alert.alert('완료', '타워 챌린지 데이터가 초기화되었습니다');
		},
		todayQuiz: async () => {
			await resetTodayQuizOnly();
			Alert.alert('완료', '오늘의 퀴즈 데이터가 초기화되었습니다');
		},
		all: async () => {
			await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
			Alert.alert('완료', '모든 데이터가 초기화되었습니다');
		},
	};

	const handleConfirmDelete = async () => {
		if (!resetType) {
			return;
		}
		try {
			await RESET_ACTIONS[resetType]();
			setModalVisible(false);
			setResetType(null);
			scrollToTop();
		} catch {
			Alert.alert('오류', '초기화 중 오류가 발생했습니다');
		}
	};

	// ── 버전 확인 ─────────────────────────────────
	const checkIsLatestVersion = async () => {
		try {
			const updateNeeded = await VersionCheck.needUpdate();
			if (updateNeeded?.isNeeded) {
				setLatestVersion(updateNeeded.latestVersion);
				setShowVersionModal(true);
			} else {
				Alert.alert('최신 버전', `현재 v${appVersion}이 최신 버전입니다`);
			}
		} catch {
			Alert.alert('오류', '버전 확인 중 문제가 발생했습니다.');
		}
	};

	// ── 앱 공유 ───────────────────────────────────
	const shareApp = async () => {
		try {
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

			const message = [
				`📱 ${APP_NAME}`,
				'',
				DESCRIPTION,
				'',
				'🔗 다운로드 링크',
				`• Android: ${androidUrl || '출시 예정입니다..'}`,
				'',
				`• iOS: ${iosUrl || '출시 예정입니다..'}`,
			].join('\n');

			await Share.share(Platform.OS === 'ios' ? { message, url: iosUrl || androidUrl, title: APP_NAME } : { message, title: APP_NAME });
		} catch {
			Alert.alert('오류', '앱 정보를 불러오는 중 문제가 발생했습니다.');
		}
	};

	// ── 개발 더미 액션 ────────────────────────────
	const handleCompleteAllQuiz = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		const parsed: MainDataType.UserQuizHistory = {
			badges: CONST_BADGES.filter((b) => b.type === 'quiz').map((b) => b.id),
			correctProverbId: allProverbs.map((p) => p.id),
			wrongProverbId: [],
			totalScore: 7900,
			bestCombo: 20,
			lastAnsweredAt: new Date(),
			quizCounts: {},
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
			studyCounts: {},
		};
		await AsyncStorage.setItem(STORAGE_KEYS.study, JSON.stringify(parsed));
		Alert.alert('처리됨', '모든 학습 완료 + 뱃지 지급!');
	};

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

	// ── 아이템 이벤트 핸들러 맵 ───────────────────
	const ITEM_HANDLERS: Record<string, () => void | Promise<void>> = {
		resetStudy: () => openResetModal('study'),
		resetQuiz: () => openResetModal('quiz'),
		resetTodayQuiz: () => openResetModal('todayQuiz'),
		resetTimeChallenge: () => openResetModal('timeChallenge'),
		resetTowerChallenge: () => openResetModal('towerChallenge'),
		resetAll: () => openResetModal('all'),
		checkVersion: checkIsLatestVersion,
		developerInfo: () => setShowDevModal(true),
		developerApps: () => setShowAppsModal(true),
		privacyPolicy: () => setShowTermsModal(true),
		openSource: () => setShowOpenSourceModal(true),
		completeAllQuiz: handleCompleteAllQuiz,
		completeAllStudy: handleCompleteAllStudy,
		completeAllTower: handleCompleteAllTower,
		rate: async () => {
			const storeUrl = Platform.OS === 'android' ? GOOGLE_PLAY_STORE_URL : APP_STORE_URL;
			if (!storeUrl) {
				Alert.alert('Coming Soon..!', '아직 스토어에 출시되지 않았습니다.');
				return;
			}
			const supported = await Linking.canOpenURL(storeUrl);
			supported ? Linking.openURL(storeUrl) : Alert.alert('오류', '스토어 페이지를 열 수 없습니다.');
		},
		inquiry: async () => {
			const version = await VersionCheck.getCurrentVersion();
			const os = Platform.OS === 'android' ? 'Android' : 'iOS';
			const device = await DeviceInfo.getModel();
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
			].join('\n');
			Linking.openURL(`mailto:adjh54ir@gmail.com?subject=${encodeURIComponent(`${APP_NAME} 앱 문의`)}&body=${encodeURIComponent(body)}`);
		},
	};

	// ── sections ─────────────────────────────────
	const sections = useMemo(
		() =>
			BASE_SECTIONS.map((s) => ({
				title: <Text style={[styles.sectionHeaderText, s.titleColor ? { color: s.titleColor } : undefined]}>{s.titleText}</Text>,
				data: s.data,
			})),
		[],
	);

	// ── renderItem ────────────────────────────────
	const renderItem = ({ item }: { item: string }) => {
		const config = SETTINGS_MAP[item];
		if (!config) {
			return null;
		}

		return (
			<TouchableOpacity style={styles.cardButton} onPress={() => ITEM_HANDLERS[item]?.()}>
				<View style={styles.row}>
					<IconComponent
						type={config.icon.type}
						name={config.icon.name}
						size={scaledSize(20)}
						color={RESET_ITEM_KEYS.includes(item) ? '#e74c3c' : '#333'}
						style={styles.icon}
						isBottomIcon={true}
					/>
					<Text style={styles.cardText}>{config.label}</Text>
				</View>
			</TouchableOpacity>
		);
	};

	// ── 모달 타이틀 ──────────────────────────────
	const renderModalTitle = () => {
		if (!resetConfig) {
			return null;
		}
		return (
			<View style={styles.modalTitleRow}>
				<IconComponent type="MaterialCommunityIcons" name={resetConfig.iconName} size={20} color="#34495e" style={styles.iconLeft} />
				<Text style={styles.modalTitleText}>{resetConfig.title}</Text>
			</View>
		);
	};

	// ─────────────────────────────────────────────
	return (
		<>
			<SafeAreaView style={styles.container} edges={['top']}>
				<SectionList
					ref={sectionRef}
					keyExtractor={(item, index) => `${item}-${index}`}
					renderItem={renderItem}
					sections={sections.map((section, i) => ({ ...section, key: `section-${i}` }))}
					onScroll={(e) => setShowScrollTop(e.nativeEvent.contentOffset.y > 100)}
					contentContainerStyle={styles.listContent}
					ItemSeparatorComponent={() => <View style={styles.itemSpacing} />}
					renderSectionFooter={() => <View style={styles.sectionSpacing} />}
					renderSectionHeader={({ section }) =>
						section.title ? (
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionHeaderText}>{section.title}</Text>
							</View>
						) : (
							<View style={{ height: scaleHeight(10) }} />
						)
					}
					ListHeaderComponent={
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
										supported ? Linking.openURL(storeUrl) : Alert.alert('오류', '스토어 페이지를 열 수 없습니다.');
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
				/>
			</SafeAreaView>

			<Contributor9Modal visible={showDevModal} onClose={() => setShowDevModal(false)} />
			<DeveloperAppsModal visible={showAppsModal} onClose={() => setShowAppsModal(false)} />
			{showTermsModal && <TermsOfServiceModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />}
			{showOpenSourceModal && <OpenSourceModal visible={showOpenSourceModal} onClose={() => setShowOpenSourceModal(false)} />}

			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
					<IconComponent type="fontawesome6" name="arrow-up" size={20} color="#ffffff" />
				</TouchableOpacity>
			)}

			<CmmDelConfirmModal
				visible={modalVisible}
				onCancel={() => setModalVisible(false)}
				onConfirm={handleConfirmDelete}
				onRequestClose={() => setModalVisible(false)}
				renderTitle={renderModalTitle}
				summary={resetConfig?.summary ?? ''}
			/>

			<CurrentVersionModal
				visible={showVersionModal}
				currentVersion={appVersion}
				latestVersion={latestVersion}
				onClose={() => setShowVersionModal(false)}
				onUpdatePress={() => latestVersion && Linking.openURL(Platform.OS === 'android' ? GOOGLE_PLAY_STORE_URL : APP_STORE_URL)}
			/>
		</>
	);
};

export default SettingScreen;

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f9f9f9' },
	listContent: { paddingBottom: scaleHeight(24) },
	headerContainer: { marginBottom: scaleHeight(5) },
	itemSpacing: { height: scaleHeight(10) },
	sectionSpacing: { height: scaleHeight(24) },

	sectionHeader: {
		marginVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(20),
		paddingVertical: scaleHeight(10),
		marginHorizontal: scaleWidth(16),
		backgroundColor: '#ecf3f9',
		borderLeftWidth: scaleWidth(4),
		borderLeftColor: '#3498db',
		marginBottom: scaleHeight(12),
		borderRadius: scaleWidth(4),
	},
	sectionHeaderText: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#34495e',
		letterSpacing: 0.5,
		textTransform: 'uppercase',
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
	row: { flexDirection: 'row', alignItems: 'center' },
	icon: { marginRight: scaleWidth(12), color: '#34495e' },
	cardText: { fontSize: scaledSize(15), color: '#2c3e50', fontWeight: '500', letterSpacing: 0.3, flexShrink: 1 },

	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(16),
		bottom: scaleHeight(16),
		backgroundColor: '#007AFF',
		width: scaleWidth(36),
		height: scaleWidth(36),
		borderRadius: scaleWidth(24),
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.25,
		shadowRadius: scaleWidth(4),
	},

	modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: scaleHeight(12) },
	modalTitleText: { fontSize: scaledSize(18), lineHeight: scaleHeight(44), fontWeight: 'bold', color: '#34495e', textAlign: 'center' },
	iconLeft: { marginRight: scaleWidth(8) },

	recommendSection: {
		marginHorizontal: scaleWidth(20),
		padding: scaleWidth(20),
		backgroundColor: '#f2f2f2',
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
	recommendTitle: { fontSize: scaledSize(17), fontWeight: '700', color: '#34495e', marginBottom: scaleHeight(6) },
	recommendSubtitle: { fontSize: scaledSize(13), color: '#7f8c8d', textAlign: 'center', marginBottom: scaleHeight(12) },
	appIconWrapper: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		marginBottom: scaleHeight(12),
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: scaleWidth(16),
		overflow: 'hidden',
	},
	appIcon: { width: '100%', height: '100%', borderRadius: scaleWidth(16) },
	storeButtons: { marginTop: scaleHeight(6), flexDirection: 'row', gap: scaleWidth(8) },
	storeButton: { flex: 1, paddingVertical: scaleHeight(12), borderRadius: scaleWidth(8), alignItems: 'center' },
	storeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: scaledSize(13) },
	iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(6) },

	appVerText: { fontSize: scaledSize(12), color: '#95a5a6', textAlign: 'center', marginBottom: scaleHeight(20) },
	appVerBoldText: { fontWeight: 'bold' },

	footerAppWrapper: { paddingVertical: scaleHeight(12) },
	footerAppList: { paddingHorizontal: scaleWidth(16), gap: scaleWidth(12), marginBottom: scaleHeight(12) },
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
	footerAppIcon: { width: scaleWidth(64), height: scaleWidth(64), borderRadius: scaleWidth(12), marginBottom: scaleHeight(8) },
	footerAppTitle: { fontSize: scaledSize(13), fontWeight: '600', color: '#2c3e50', textAlign: 'center', marginBottom: scaleHeight(4) },
	footerAppDesc: { fontSize: scaledSize(11), color: '#7f8c8d', textAlign: 'center' },
});
