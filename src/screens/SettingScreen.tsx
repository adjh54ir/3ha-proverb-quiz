/* eslint-disable react/no-unstable-nested-components */

/* eslint-disable react-native/no-inline-styles */

import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import ScrollTopButton, { SCROLL_TOP_THRESHOLD } from '@/screens/common/atomic/ScrollTopButton';
import AppAlert from '@/screens/common/modal/AppAlert';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Linking, Platform, SectionList, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import VersionCheck from 'react-native-version-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume, playCorrect, playPop } from '@/utils/SoundUtils';
import { isBgmEnabled, setBgmEnabled, getBgmVolume, setBgmVolume } from '@/utils/BgmUtils';
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
import { APP_STORE_URL, GOOGLE_PLAY_STORE_URL, APP_NAME as ENV_APP_NAME, APP_DESCRIPTION as ENV_APP_DESCRIPTION } from '@env';
import { TOWER_LEVELS, TowerProgress } from '@/const/ConstTowerData';
import FadeInView from '@/components/animation/FadeInView';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles, themedValue } from '@/const/common/Theme';
import { SCORE_PER_QUESTION } from '@/const/common/CommonCharacterData';
import { AppPermissionInfo, loadAppPermissions, requestAppPermission } from '@/utils/PermissionUtils';
import DateUtils from '@/utils/DateUtils';
import { useToast } from '@/hooks/useToast';
import { changeTextSizeMode, changeThemeMode, useTextSizeMode, useThemeMode } from '@/hooks/useThemeMode';
import CharacterGuide, { useCharacterGuideOnce, FloatingGuideButton, resetCharacterGuideSeen } from '@/screens/common/CharacterGuide';
import { update, write } from '@/services/StorageService';

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
// .env 의 앱 정보를 우선 사용하고, 누락 시 기본값으로 폴백
const APP_NAME = ENV_APP_NAME || '속픽: 속담 퀴즈';
const DESCRIPTION =
	ENV_APP_DESCRIPTION ||
	'속픽: 속담 퀴즈는 대한민국 속담을 쉽고 재미있게 학습하고, 다양한 퀴즈를 통해 기억을 점검하며, 틀린 문제는 반복 학습으로 완전히 익힐 수 있도록 돕는 속담 학습 앱입니다.';
const IS_DEV = __DEV__ === true;

const STORAGE_KEYS = {
	study: MainStorageKeyType.USER_STUDY_HISTORY,
	quiz: MainStorageKeyType.USER_QUIZ_HISTORY,
	todayQuiz: MainStorageKeyType.TODAY_QUIZ_LIST,
	timeChallenge: MainStorageKeyType.TIME_CHALLENGE_HISTORY,
	towerChallenge: MainStorageKeyType.TOWER_CHALLENGE_PROGRESS,
	favorites: MainStorageKeyType.FAVORITES_STORAGE_KEY,
};

/**
 * '전체 데이터 초기화' 대상.
 * ⚠️ STORAGE_KEYS 만 지우면 속담집/연습 기록/미션 수령일/마지막 등급이 남아
 *    "모든 기록을 지웠습니다" 라는 안내와 실제 상태가 어긋난다.
 *    소리·테마·글자 크기 같은 '설정'은 사용자 취향이라 초기화 대상에서 제외한다.
 */
const RESET_ALL_KEYS: string[] = [
	...Object.values(STORAGE_KEYS),
	MainStorageKeyType.USER_PROVERB_BOOKS,
	MainStorageKeyType.USER_PROVERB_PRACTICE_RECORDS,
	MainStorageKeyType.DAILY_MISSION_CLAIMED,
	MainStorageKeyType.LAST_SEEN_GRADE,
];

type ResetType = 'study' | 'quiz' | 'timeChallenge' | 'todayQuiz' | 'towerChallenge' | 'all';

// ─────────────────────────────────────────────
// 리셋 설정 테이블 (switch문 → 데이터 기반)
// ─────────────────────────────────────────────
const RESET_CONFIG: Record<ResetType, { title: string; summary: string; iconName: string }> = {
	study: { title: '학습을 다시 시작하시겠습니까?', summary: '지금까지 학습했던 내용이 모두 사라집니다.\n 정말 다시 시작하시겠습니까?', iconName: 'refresh' },
	quiz: { title: '퀴즈를 다시 푸시겠습니까?', summary: '지금까지 풀었던 퀴즈 기록이 초기화됩니다. \n 다시 도전하시겠습니까?', iconName: 'refresh' },
	todayQuiz: { title: '오늘의 퀴즈를 초기화하시겠습니까?', summary: '오늘의 퀴즈 기록이 사라집니다. \n다시 시작하시겠습니까?', iconName: 'refresh' },
	timeChallenge: { title: '타임 챌린지를 초기화하시겠습니까?', summary: '타임 챌린지 기록이 모두 초기화됩니다.\n 계속하시겠습니까?', iconName: 'refresh' },
	towerChallenge: {
		title: '타워 챌린지를 초기화하시겠습니까?',
		summary: '타워 챌린지의 모든 진행 상황이 초기화됩니다.\n 처음부터 다시 도전하시겠습니까?',
		iconName: 'refresh',
	},
	all: {
		title: '모두 초기화하시겠습니까?',
		summary: '지금까지 학습하고 풀었던 모든 기록이 사라집니다. 정말 전부 다시 시작하시겠습니까?',
		iconName: 'delete-alert-outline',
	},
};

// ─────────────────────────────────────────────
// 아코디언 그룹 정의 (사용자 정보 초기화)
// ─────────────────────────────────────────────
// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const ACCORDION_CONFIG = themedValue(() => ({
	study: {
		label: '학습 데이터 초기화',
		icon: 'book-open-variant',
		iconColor: COLORS.primary,
		iconBg: COLORS.primarySoft,
		items: [
			{ key: 'resetStudy', label: '학습 기록 초기화' },
			{ key: 'resetQuiz', label: '퀴즈 기록 초기화' },
			{ key: 'resetTodayQuiz', label: '오늘의 퀴즈 초기화' },
		],
	},
	challenge: {
		label: '챌린지 데이터 초기화',
		icon: 'trophy-outline',
		iconColor: COLORS.warning,
		iconBg: COLORS.warningBg,
		items: [
			{ key: 'resetTimeChallenge', label: '타임챌린지 기록 초기화' },
			{ key: 'resetTowerChallenge', label: '타워챌린지 기록 초기화' },
		],
	},
}));

// ─────────────────────────────────────────────
// 설정 아이템 정의 (컴포넌트 외부)
// ─────────────────────────────────────────────
type IconType = 'MaterialCommunityIcons' | 'materialIcons';

const SETTINGS_MAP: Record<string, { label: string; icon: { type: IconType; name: string }; isDanger?: boolean }> = {
	rate: { label: '앱 리뷰 남기기', icon: { type: 'MaterialCommunityIcons', name: 'star-outline' } },
	inquiry: { label: '문의하기', icon: { type: 'MaterialCommunityIcons', name: 'email-outline' } },
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

// ─────────────────────────────────────────────
// 섹션 정의
// ─────────────────────────────────────────────
// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const BASE_SECTIONS = themedValue(() => ([
	{
		titleText: '화면 테마',
		iconType: 'materialIcons',
		icon: 'brightness-6',
		iconColor: COLORS.secondaryDark,
		iconBg: COLORS.secondarySoft,
		data: ['__theme__'],
	},
	{
		titleText: '소리 설정',
		iconType: 'materialIcons',
		icon: 'volume-up',
		iconColor: COLORS.primaryDark,
		iconBg: COLORS.primarySoft,
		data: ['__sound__'],
	},
	{
		titleText: '사용자 정보 초기화',
		iconType: 'materialIcons',
		icon: 'restart-alt',
		iconColor: COLORS.danger,
		iconBg: COLORS.dangerBg,
		data: ['__accordion__'],
	},
	{
		titleText: '문의 및 피드백',
		iconType: 'materialIcons',
		icon: 'forum',
		iconColor: COLORS.secondaryDark,
		iconBg: COLORS.secondarySoft,
		data: ['rate', 'inquiry', 'developerInfo', 'developerApps'],
	},
	{
		titleText: '정책 및 라이선스',
		iconType: 'materialIcons',
		icon: 'gavel',
		iconColor: COLORS.primaryDark,
		iconBg: COLORS.primarySoft,
		data: ['privacyPolicy', 'openSource', 'checkVersion', ...(IS_DEV ? ['completeAllQuiz', 'completeAllStudy', 'completeAllTower'] : [])],
	},
	// 권한 상태는 항상 마지막 섹션 — 하단 앱 목록(ListFooterComponent) 바로 위에 노출된다.
	{
		titleText: '권한 설정',
		iconType: 'materialIcons',
		icon: 'lock-outline',
		iconColor: COLORS.secondaryDark,
		iconBg: COLORS.secondarySoft,
		data: ['__permissions__'],
	},
]));

// 권한 상태별 뱃지 표기
// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const PERMISSION_BADGE: Record<AppPermissionInfo['state'], { text: string; color: string }> = themedValue(() => ({
	granted: { text: '허용', color: COLORS.success },
	blocked: { text: '거부', color: COLORS.danger },
	undetermined: { text: '미설정', color: COLORS.textSecondary },
}));

const PERMISSION_ICON: Record<AppPermissionInfo['key'], string> = {
	notifications: 'bell-outline',
	tracking: 'bullhorn-outline',
};

// ─────────────────────────────────────────────
// 카드 버튼 press scale 애니메이션 래퍼
// ─────────────────────────────────────────────
const AnimatedPressCard = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
	};
	const handlePressOut = () => {
		Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
	};

	return (
		<TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
			<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>{children}</Animated.View>
		</TouchableOpacity>
	);
};

/** 글자 크기 선택지 — 미리보기 '가' 글자 크기까지 함께 보여준다. */
const TEXT_SIZE_OPTIONS = themedValue(() => [
	{ key: 'default' as const, label: '기본', desc: '표준 크기', sampleSize: FONT_SIZES.md },
	{ key: 'large' as const, label: '크게', desc: '한 단계 크게', sampleSize: FONT_SIZES.xl },
]);

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
const SettingScreen = () => {
	// 첫 실행 안내는 홈에서 한 번만 띄운다 — 화면마다 뜨면 성가시다. 여기선 물음표 버튼으로만 연다
	const guide = useCharacterGuideOnce('setting', false);
	const themeMode = useThemeMode(); // 화이트/다크 선택 상태
	const textSizeMode = useTextSizeMode(); // 기본/글자 크게 선택 상태
	const sectionRef = useRef<SectionList>(null);

	const [showDevModal, setShowDevModal] = useState(false);
	const [showAppsModal, setShowAppsModal] = useState(false);
	const [showTermsModal, setShowTermsModal] = useState(false);
	const [showOpenSourceModal, setShowOpenSourceModal] = useState(false);
	const [showVersionModal, setShowVersionModal] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [openAccordion, setOpenAccordion] = useState<'study' | 'challenge' | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [resetType, setResetType] = useState<ResetType | null>(null);
	const [appVersion, setAppVersion] = useState('');
	const [latestVersion, setLatestVersion] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<AppPermissionInfo[]>([]);
	const { showToast, ToastView } = useToast();

	// ── 소리 설정 ──────────────────────────────────
	const [soundOn, setSoundOn] = useState(isSoundEnabled());
	const [bgmOn, setBgmOn] = useState(isBgmEnabled());
	const [sfxVolume, setSfxVolume] = useState(getSoundVolume());
	const [bgmVolume, setBgmVolumeState] = useState(getBgmVolume());

	const handleToggleSound = (value: boolean) => {
		setSoundEnabled(value);
		setSoundOn(value);
		if (value) {
			playPop(); // 켠 자리에서 바로 소리를 확인시켜 준다
		}
	};

	const handleToggleBgm = (value: boolean) => {
		setBgmEnabled(value);
		setBgmOn(value);
	};


	/** 슬라이더를 놓는 순간에만 저장한다(드래그 중 매 프레임 AsyncStorage 쓰기 방지) */
	const handleSfxVolumeCommit = (value: number) => {
		setSoundVolume(value);
		playPop(); // 조절한 크기를 바로 들려준다
	};

	const handleBgmVolumeCommit = (value: number) => {
		setBgmVolume(value);
	};

	// ── 파생 상태 (RESET_CONFIG 기반) ──────────────
	const resetConfig = resetType ? RESET_CONFIG[resetType] : null;

	useFocusEffect(
		useCallback(() => {
			setAppVersion(VersionCheck.getCurrentVersion());
			// 다시 들어올 때는 아코디언을 접고 열려 있던 팝업을 닫은 뒤 맨 위에서 시작한다
			setOpenAccordion(null);
			setModalVisible(false);
			setShowDevModal(false);
			setShowAppsModal(false);
			setShowTermsModal(false);
			setShowOpenSourceModal(false);
			setShowVersionModal(false);
			setShowScrollTop(false);
			scrollToTop();

			// 퀴즈 시작 팝업 등 다른 화면에서 바꿨을 수 있어 포커스마다 다시 읽는다
			setSoundOn(isSoundEnabled());
			setBgmOn(isBgmEnabled());
			setSfxVolume(getSoundVolume());
			setBgmVolumeState(getBgmVolume());

			// 설정 앱에서 권한을 바꾸고 돌아오는 경우가 있어 포커스마다 다시 읽는다
			let isActive = true;
			loadAppPermissions().then((list) => {
				if (isActive) {
					setPermissions(list);
				}
			});
			return () => {
				isActive = false;
			};
		}, []),
	);

	const scrollToTop = () => sectionRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: true });

	// ── 리셋 실행 ─────────────────────────────────
	const openResetModal = (type: ResetType) => {
		setResetType(type);
		setModalVisible(true);
	};

	const resetTodayQuizOnly = async () => {
		const todayStr = DateUtils.getLocalDateString();
		await update<MainDataType.TodayQuizList[]>(STORAGE_KEYS.todayQuiz, [], (list) =>
			list.map((item) =>
				DateUtils.toLocalDateKey(item.quizDate) === todayStr
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
			),
		);
	};

	const RESET_ACTIONS: Record<ResetType, () => Promise<void>> = {
		study: async () => {
			await AsyncStorage.removeItem(STORAGE_KEYS.study);
			showToast('학습 데이터 초기화', '학습 기록과 뱃지를 모두 지웠습니다.');
		},
		quiz: async () => {
			// 점수를 0으로 되돌리므로 '마지막으로 본 등급' 도 함께 지워야 레벨업 감지가 다시 동작한다.
			await AsyncStorage.multiRemove([STORAGE_KEYS.quiz, MainStorageKeyType.LAST_SEEN_GRADE]);
			showToast('퀴즈 데이터 초기화', '퀴즈 기록과 점수를 모두 지웠습니다.');
		},
		timeChallenge: async () => {
			await AsyncStorage.removeItem(STORAGE_KEYS.timeChallenge);
			showToast('타임 챌린지 초기화', '타임 챌린지 기록을 모두 지웠습니다.');
		},
		towerChallenge: async () => {
			await AsyncStorage.removeItem(STORAGE_KEYS.towerChallenge);
			showToast('타워 챌린지 초기화', '타워 진행도를 모두 지웠습니다.');
		},
		todayQuiz: async () => {
			await resetTodayQuizOnly();
			showToast('오늘의 퀴즈 초기화', '오늘의 퀴즈 기록을 지웠습니다.');
		},
		all: async () => {
			await AsyncStorage.multiRemove(RESET_ALL_KEYS);
			// 화면 안내를 '본 적 있음' 기록도 함께 지워 처음 상태로 되돌린다
			await resetCharacterGuideSeen();
			showToast('전체 초기화 완료', '앱의 모든 기록을 지웠습니다.');
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
			showToast('초기화 실패', '잠시 후 다시 시도해주세요.');
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
				AppAlert.alert('최신 버전', `현재 v${appVersion}이 최신 버전입니다`);
			}
		} catch {
			AppAlert.alert('오류', '버전 확인 중 문제가 발생했습니다.');
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
				AppAlert.alert('Coming Soon..!', '아직 안드로이드/iOS 스토어에 출시되지 않았습니다.');
				return;
			}

			const message = [
				'요즘 재미있게 쓰고 있는 앱이 있어 추천드립니다! 😊',
				'',
				`📱 ${APP_NAME}`,
				DESCRIPTION,
				'',
				'👇 아래 링크에서 받아보세요',
				`• Android: ${androidUrl || '출시 예정입니다..'}`,
				'',
				`• iOS: ${iosUrl || '출시 예정입니다..'}`,
			].join('\n');

			await Share.share(Platform.OS === 'ios' ? { message, url: iosUrl || androidUrl, title: APP_NAME } : { message, title: APP_NAME });
		} catch {
			AppAlert.alert('오류', '앱 정보를 불러오는 중 문제가 발생했습니다.');
		}
	};

	// ── 개발 더미 액션 ────────────────────────────
	const handleCompleteAllQuiz = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		// 전체 속담 수 기준 만점으로 산정 (데이터 증가 자동 반영)
		const fullScore = allProverbs.length * SCORE_PER_QUESTION;
		// 문제별 풀이 횟수도 1회씩 채워 누적 통계와 정합성 유지
		const quizCounts = allProverbs.reduce<{ [id: number]: number }>((acc, p) => {
			acc[p.id] = 1;
			return acc;
		}, {});
		const parsed: MainDataType.UserQuizHistory = {
			badges: CONST_BADGES.filter((b) => b.type === 'quiz').map((b) => b.id),
			correctProverbId: allProverbs.map((p) => p.id),
			wrongProverbId: [],
			totalScore: fullScore,
			bestCombo: 20,
			lastAnsweredAt: DateUtils.now(),
			quizCounts,
		};
		await write(STORAGE_KEYS.quiz, parsed);
		showToast('퀴즈 전체 완료 처리', `${allProverbs.length.toLocaleString()}문제 / ${fullScore.toLocaleString()}점 반영했습니다.`);
	};

	const handleCompleteAllStudy = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		// 속담별 학습 횟수도 1회씩 채워 정합성 유지
		const studyCounts = allProverbs.reduce<{ [id: string]: number }>((acc, p) => {
			acc[String(p.id)] = 1;
			return acc;
		}, {});
		const parsed: MainDataType.UserStudyHistory = {
			badges: CONST_BADGES.filter((b) => b.type === 'study').map((b) => b.id),
			studyProverbes: allProverbs.map((p) => p.id),
			lastStudyAt: DateUtils.now(),
			studyCounts,
		};
		await write(STORAGE_KEYS.study, parsed);
		showToast('학습 전체 완료 처리', `${allProverbs.length.toLocaleString()}개 학습 완료로 반영했습니다.`);
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
			// 읽는 쪽(TowerChallengeScreen/TowerQuizScreen)이 'YYYY-MM-DD' 로컬 키를 기대한다.
			lastAttemptDate: DateUtils.getLocalDateString(),
			unlockedRewards: allLevels,
		};
		await write(STORAGE_KEYS.towerChallenge, towerProgress);
		showToast('타워 전체 클리어 처리', '모든 층을 클리어 상태로 반영했습니다.');
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
				AppAlert.alert('Coming Soon..!', '아직 스토어에 출시되지 않았습니다.');
				return;
			}
			const supported = await Linking.canOpenURL(storeUrl);
			supported ? Linking.openURL(storeUrl) : AppAlert.alert('오류', '스토어 페이지를 열 수 없습니다.');
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

	const newAppIds = useMemo(
		() =>
			new Set(
				[...COMMON_APPS_DATA.Apps]
					.sort((a, b) => b.id - a.id)
					.slice(0, 2)
					.map((app) => app.id),
			),
		[],
	);

	/**
	 * 권한 행 탭 처리.
	 * - 미설정: 앱에서 바로 시스템 팝업을 띄운다(설정 앱까지 나갈 필요 없음)
	 * - 거부됨: 앱에서 다시 물어볼 수 없으므로 설정 앱으로 보낸다
	 */
	const handlePermissionPress = async (perm: AppPermissionInfo) => {
		if (perm.state === 'undetermined') {
			const next = await requestAppPermission(perm.key);
			if (next === 'granted') {
				setPermissions((prev) => prev.map((item) => (item.key === perm.key ? { ...item, state: next } : item)));
				return;
			}
			// 팝업에서 거부했다면 이후로는 설정 앱에서만 바꿀 수 있다
			setPermissions(await loadAppPermissions());
			if (next !== 'blocked') {
				return;
			}
		}
		Linking.openSettings().catch(() => AppAlert.alert('오류', '설정 화면을 열 수 없습니다.'));
	};

	// ── renderItem ────────────────────────────────
	const renderItem = ({ item }: { item: string }) => {
		// 사용자 정보 초기화 — 아코디언
		if (item === '__accordion__') {
			return (
				<View style={styles.accordionWrapper}>
					{(['study', 'challenge'] as const).map((groupKey) => {
						const group = ACCORDION_CONFIG[groupKey];
						const isOpen = openAccordion === groupKey;

						return (
							<View key={groupKey} style={styles.accordionGroup}>
								<TouchableOpacity
									style={styles.accordionHeader}
									onPress={() => setOpenAccordion(isOpen ? null : groupKey)}
									activeOpacity={0.7}>
									<View style={styles.row}>
										<View style={[styles.accordionIconChip, { backgroundColor: group.iconBg }]}>
											<IconComponent type="MaterialCommunityIcons" name={group.icon} size={scaledSize(16)} color={group.iconColor} />
										</View>
										<Text style={styles.accordionHeaderText}>{group.label}</Text>
									</View>
									<IconComponent
										type="MaterialCommunityIcons"
										name={isOpen ? 'chevron-up' : 'chevron-down'}
										size={scaledSize(20)}
										color={COLORS.textSecondary}
									/>
								</TouchableOpacity>

								{isOpen && (
									<View style={styles.accordionBody}>
										{group.items.map((subItem, index) => (
											<TouchableOpacity
												key={subItem.key}
												style={[styles.accordionSubItem, index === group.items.length - 1 && { borderBottomWidth: 0 }]}
												activeOpacity={0.8}
												onPress={() => ITEM_HANDLERS[subItem.key]?.()}>
												<IconComponent
													type="MaterialCommunityIcons"
													name="refresh"
													size={scaledSize(16)}
													color={COLORS.danger}
													style={{ marginRight: SPACING_W.md }}
												/>
												<Text style={styles.accordionSubText}>{subItem.label}</Text>
											</TouchableOpacity>
										))}
									</View>
								)}
							</View>
						);
					})}

					<TouchableOpacity
						style={[styles.accordionGroup, styles.accordionGroupDanger]}
						onPress={() => ITEM_HANDLERS.resetAll?.()}
						activeOpacity={0.8}>
						<View style={styles.accordionHeader}>
							<View style={styles.row}>
								<View style={[styles.accordionIconChip, { backgroundColor: COLORS.dangerBg }]}>
									<IconComponent type="materialIcons" name="delete" size={scaledSize(16)} color={COLORS.danger} />
								</View>
								<Text style={[styles.accordionHeaderText, { color: COLORS.danger }]}>전체 데이터 초기화</Text>
							</View>
							<IconComponent type="MaterialCommunityIcons" name="chevron-right" size={scaledSize(20)} color={COLORS.danger} />
						</View>
					</TouchableOpacity>
				</View>
			);
		}

		// 화면 테마 — 시스템 설정과 무관하게 화이트/다크를 직접 고른다
		if (item === '__theme__') {
			const themeOptions = [
				{ key: 'light' as const, label: '화이트', desc: '밝은 배경', icon: 'white-balance-sunny' },
				{ key: 'dark' as const, label: '다크', desc: '어두운 배경', icon: 'weather-night' },
			];

			return (
				<View style={styles.accordionWrapper}>
					<View style={styles.themeRow}>
						{themeOptions.map((option) => {
							const isActive = themeMode === option.key;
							return (
								<TouchableOpacity
									key={option.key}
									style={[styles.themeCard, isActive && styles.themeCardActive]}
									activeOpacity={0.85}
									onPress={() => changeThemeMode(option.key)}
									accessibilityRole="button"
									accessibilityState={{ selected: isActive }}
									accessibilityLabel={`${option.label} 모드`}>
									<View style={[styles.themeIconChip, isActive && styles.themeIconChipActive]}>
										<IconComponent
											type="MaterialCommunityIcons"
											name={option.icon}
											size={scaledSize(20)}
											color={isActive ? COLORS.textWhite : COLORS.textSecondary}
										/>
									</View>
									<View style={styles.themeTextWrap}>
										<Text style={[styles.themeLabel, isActive && styles.themeLabelActive]} numberOfLines={1} ellipsizeMode="tail">
											{option.label}
										</Text>
										<Text style={styles.themeDesc} numberOfLines={1} ellipsizeMode="tail">
											{option.desc}
										</Text>
									</View>
									{isActive && <IconComponent type="materialIcons" name="check-circle" size={scaledSize(20)} color={COLORS.primary} />}
								</TouchableOpacity>
							);
						})}
					</View>
					<Text style={styles.themeHint}>시스템(휴대폰) 설정과 무관하게 앱에서 고른 테마로 표시됩니다.</Text>

					{/* 글자 크기 — 시각 약자를 위해 앱 전체 폰트를 한 단계 키운다 */}
					<Text style={styles.themeGroupLabel}>글자 크기</Text>
					<View style={styles.themeRow}>
						{TEXT_SIZE_OPTIONS.map((option) => {
							const isActive = textSizeMode === option.key;
							return (
								<TouchableOpacity
									key={option.key}
									style={[styles.themeCard, isActive && styles.themeCardActive]}
									activeOpacity={0.85}
									onPress={() => changeTextSizeMode(option.key)}
									accessibilityRole="button"
									accessibilityState={{ selected: isActive }}
									accessibilityLabel={`글자 크기 ${option.label}`}>
									<View style={[styles.themeIconChip, isActive && styles.themeIconChipActive]}>
										<Text style={[styles.textSizeSample, isActive && styles.textSizeSampleActive, { fontSize: option.sampleSize }]}>가</Text>
									</View>
									<View style={styles.themeTextWrap}>
										<Text style={[styles.themeLabel, isActive && styles.themeLabelActive]} numberOfLines={1} ellipsizeMode="tail">
											{option.label}
										</Text>
										<Text style={styles.themeDesc} numberOfLines={1} ellipsizeMode="tail">
											{option.desc}
										</Text>
									</View>
									{isActive && <IconComponent type="materialIcons" name="check-circle" size={scaledSize(20)} color={COLORS.primary} />}
								</TouchableOpacity>
							);
						})}
					</View>
					<Text style={styles.themeHint}>글자를 크게 하면 앱 전체 글자가 커지고, 휴대폰의 큰 글씨 설정도 더 넓게 반영됩니다.</Text>
				</View>
			);
		}

		// 권한 설정 — 현재 상태 표시 + 미허용 항목은 OS 설정으로 이동
		// 소리 설정 — 효과음/배경음악 on·off + 볼륨
		if (item === '__sound__') {
			const soundRows = [
				{
					key: 'sfx',
					on: soundOn,
					onChange: handleToggleSound,
					icon: soundOn ? 'volume-high' : 'volume-off',
					label: '효과음',
					desc: '정답·오답·완료 등 상황별 소리',
					volume: sfxVolume,
					onVolumeChange: setSfxVolume,
					onVolumeCommit: handleSfxVolumeCommit,
					onPreview: playCorrect,
				},
				{
					key: 'bgm',
					on: bgmOn,
					onChange: handleToggleBgm,
					icon: bgmOn ? 'music-note' : 'music-note-off',
					label: '배경음악',
					desc: '퀴즈·챌린지 진행 중 흐르는 음악',
					volume: bgmVolume,
					onVolumeChange: setBgmVolumeState,
					onVolumeCommit: handleBgmVolumeCommit,
					onPreview: undefined, // BGM은 볼륨 조절 시 바로 들리므로 미리듣기 불필요
				},
			];

			return (
				<View style={styles.accordionWrapper}>
					<View style={styles.accordionGroup}>
						{soundRows.map((row, index) => (
							<View key={row.key} style={[styles.soundRow, index === soundRows.length - 1 && { borderBottomWidth: 0 }]}>
								<View style={styles.soundRowHeader}>
									<View style={[styles.itemIconChip, !row.on && styles.itemIconChipOff]}>
										<IconComponent
											type="MaterialCommunityIcons"
											name={row.icon}
											size={scaledSize(18)}
											color={row.on ? COLORS.primaryDark : COLORS.textLight}
										/>
									</View>
									<View style={styles.soundTextWrap}>
										<Text style={styles.permissionLabel} numberOfLines={1} ellipsizeMode="tail">
											{row.label}
										</Text>
										<Text style={styles.permissionDesc} numberOfLines={2} ellipsizeMode="tail">
											{row.desc}
										</Text>
									</View>
									<Switch
										value={row.on}
										onValueChange={row.onChange}
										trackColor={{ false: COLORS.borderDark, true: COLORS.primaryLight }}
										thumbColor={row.on ? COLORS.primaryDark : COLORS.surfaceAlt}
										accessibilityLabel={row.label}
									/>
								</View>

								{/* 볼륨 슬라이더 — 켜져 있을 때만 노출 */}
								{row.on && (
									<View style={styles.volumeRow}>
										<Text style={styles.volumeLabel}>볼륨</Text>
										<Slider
											style={styles.volumeSlider}
											minimumValue={0}
											maximumValue={1}
											step={0.05}
											value={row.volume}
											onValueChange={row.onVolumeChange}
											onSlidingComplete={row.onVolumeCommit}
											minimumTrackTintColor={COLORS.primary}
											maximumTrackTintColor={COLORS.borderDark}
											thumbTintColor={COLORS.primaryDark}
											accessibilityLabel={`${row.label} 볼륨`}
										/>
										<Text style={styles.volumeValue}>{Math.round((row.volume ?? 0) * 100)}%</Text>
										{row.onPreview && (
											<TouchableOpacity
												style={styles.volumePreviewButton}
												onPress={row.onPreview}
												hitSlop={HIT_SLOP}
												activeOpacity={0.7}
												accessibilityRole="button"
												accessibilityLabel="효과음 미리듣기">
												<IconComponent type="MaterialCommunityIcons" name="play-circle-outline" size={scaledSize(20)} color={COLORS.primaryDark} />
											</TouchableOpacity>
										)}
									</View>
								)}
							</View>
						))}
					</View>
				</View>
			);
		}

		if (item === '__permissions__') {
			if (permissions.length === 0) {
				return null;
			}
			return (
				<View style={styles.accordionWrapper}>
					<View style={styles.accordionGroup}>
						{permissions.map((perm, index) => {
							const badge = PERMISSION_BADGE[perm.state];
							const isGranted = perm.state === 'granted';

							return (
								<TouchableOpacity
									key={perm.key}
									style={[styles.permissionRow, index === permissions.length - 1 && { borderBottomWidth: 0 }]}
									activeOpacity={isGranted ? 1 : 0.7}
									disabled={isGranted}
									onPress={() => handlePermissionPress(perm)}>
									<View style={styles.itemIconChip}>
										<IconComponent type="MaterialCommunityIcons" name={PERMISSION_ICON[perm.key]} size={scaledSize(18)} color={COLORS.secondary} />
									</View>
									<View style={styles.permissionTextWrap}>
										<Text style={styles.permissionLabel}>{perm.label}</Text>
										<Text style={styles.permissionDesc}>{perm.description}</Text>
									</View>
									<View style={[styles.permissionBadge, { borderColor: badge.color }]}>
										<Text style={[styles.permissionBadgeText, { color: badge.color }]}>{badge.text}</Text>
									</View>
									{!isGranted && (
										<IconComponent
											type="MaterialCommunityIcons"
											name="chevron-right"
											size={scaledSize(20)}
											color={COLORS.textSecondary}
											style={styles.permissionChevron}
										/>
									)}
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			);
		}

		const config = SETTINGS_MAP[item];
		if (!config) {
			return null;
		}

		return (
			<AnimatedPressCard onPress={() => ITEM_HANDLERS[item]?.()}>
				<View style={styles.cardButton}>
					<View style={styles.row}>
						<View style={[styles.itemIconChip, config.isDanger && styles.itemIconChipDanger]}>
							<IconComponent
								type={config.icon.type}
								name={config.icon.name}
								size={scaledSize(18)}
								color={config.isDanger ? COLORS.danger : COLORS.secondary}
							/>
						</View>
						<Text style={styles.cardText}>{config.label}</Text>
					</View>
				</View>
			</AnimatedPressCard>
		);
	};

	// ── 모달 타이틀 ──────────────────────────────
	const renderModalTitle = () => {
		if (!resetConfig) {
			return null;
		}
		return (
			<View style={styles.modalTitleRow}>
				<IconComponent type="MaterialCommunityIcons" name={resetConfig.iconName} size={scaledSize(20)} color={COLORS.text} style={styles.iconLeft} />
				<Text style={styles.modalTitleText}>{resetConfig.title}</Text>
			</View>
		);
	};

	// ─────────────────────────────────────────────
	return (
		<>
			<SafeAreaView style={styles.container} edges={['top']}>
			<FloatingGuideButton onPress={guide.open} />
				<FadeInView style={{ flex: 1 }}>
					<SectionList
						ref={sectionRef}
						keyExtractor={(item, index) => `${item}-${index}`}
						renderItem={renderItem}
						sections={BASE_SECTIONS.map((section, i) => ({ ...section, key: `section-${i}` }))}
						stickySectionHeadersEnabled={false}
						onScroll={(e) => setShowScrollTop(e.nativeEvent.contentOffset.y > SCROLL_TOP_THRESHOLD)}
						scrollEventThrottle={16}
						contentContainerStyle={styles.listContent}
						ItemSeparatorComponent={() => <View style={styles.itemSpacing} />}
						renderSectionFooter={() => <View style={styles.sectionSpacing} />}
						renderSectionHeader={({ section }) =>
							section.titleText ? (
								<View style={styles.sectionHeader}>
									<View style={[styles.sectionHeaderChip, section.iconBg ? { backgroundColor: section.iconBg } : undefined]}>
										<IconComponent type={section.iconType} name={section.icon} size={scaledSize(15)} color={section.iconColor} />
									</View>
									<Text style={styles.sectionHeaderText}>{section.titleText}</Text>
								</View>
							) : (
								<View style={{ height: SPACING_H.md }} />
							)
						}
						ListHeaderComponent={
							<View style={styles.headerContainer}>
								<View style={styles.recommendSection}>
									<View style={styles.recommendTitleRow}>
										<View style={styles.recommendTitleIconChip}>
											<IconComponent type="MaterialCommunityIcons" name="cellphone-check" size={scaledSize(16)} color={COLORS.secondary} />
										</View>
										<Text style={styles.recommendTitle}>앱이 마음에 드셨습니까?</Text>
									</View>
									<Text style={styles.recommendSubtitle}>가족이나 친구, 지인에게 유용한 앱을 함께 나눠보세요!</Text>
									<View style={styles.appIconWrapper}>
										<Image source={require('@/assets/images/mainIcon.png')} style={styles.appIcon} resizeMode="contain" />
									</View>
									<View style={styles.storeButtons}>
										<TouchableOpacity style={[styles.storeButton, { backgroundColor: COLORS.primary }]} onPress={shareApp} activeOpacity={0.8}>
											<View style={styles.iconRow}>
												<IconComponent type="MaterialCommunityIcons" name="share-variant" size={scaledSize(16)} color={COLORS.textWhite} />
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
												AppAlert.alert('Coming Soon..!', '아직 이 플랫폼에서는 출시되지 않았습니다.');
												return;
											}
											const supported = await Linking.canOpenURL(storeUrl);
											supported ? Linking.openURL(storeUrl) : AppAlert.alert('오류', '스토어 페이지를 열 수 없습니다.');
										};
										return (
											<TouchableOpacity style={styles.footerAppCard} onPress={handlePress} activeOpacity={0.8}>
												<View style={{ position: 'relative' }}>
													<View style={styles.footerAppIconWrapper}>
														<Image source={item.icon} style={styles.footerAppIcon} resizeMode="contain" />
													</View>
													{newAppIds.has(item.id) && (
														<View style={styles.footerNewBadge}>
															<Text style={styles.footerNewBadgeText}>NEW</Text>
														</View>
													)}
												</View>
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
				</FadeInView>
			</SafeAreaView>

			<Contributor9Modal visible={showDevModal} onClose={() => setShowDevModal(false)} />
			<DeveloperAppsModal visible={showAppsModal} onClose={() => setShowAppsModal(false)} />
			{showTermsModal && <TermsOfServiceModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />}
			{showOpenSourceModal && <OpenSourceModal visible={showOpenSourceModal} onClose={() => setShowOpenSourceModal(false)} />}

			<ScrollTopButton visible={showScrollTop} onPress={scrollToTop} />

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

			<ToastView />
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'앱의 알림·소리·화면 설정을 바꾸는 곳입니다.',
					'효과음과 배경음은 각각 켜고 끄거나 크기를 조절할 수 있습니다.',
					'소리가 나는 동안에는 다른 앱의 음악·영상이 잠시 멈춥니다.',
					'아래쪽에서 앱 버전과 다른 앱들도 확인할 수 있습니다!',
				]}
				title="설정, 이렇게 씁니다"
			/>
		</>
	);
};

export default SettingScreen;

const styles = themedStyles(() => StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },
	listContent: { paddingBottom: SPACING_H.xxxxl },
	headerContainer: { marginBottom: SPACING_H.xs },
	itemSpacing: { height: SPACING_H.md },
	// 섹션 사이 총 간격 = 이 값 + sectionHeader marginTop(20) ≈ 24
	sectionSpacing: { height: SPACING_H.xs },

	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.md,
		marginTop: SPACING_H.xl,
		marginBottom: SPACING_H.sm,
		marginHorizontal: SPACING_W.lg,
	},
	sectionHeaderChip: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: RADIUS.sm,
		backgroundColor: COLORS.surfaceAlt,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sectionHeaderText: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '700',
		color: COLORS.textSecondary,
		letterSpacing: 0.3,
	},

	cardButton: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
		minHeight: scaleHeight(52),
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		marginHorizontal: SPACING_W.lg,
		flexDirection: 'row',
		alignItems: 'center',
	},
	row: { flexDirection: 'row', alignItems: 'center' },
	itemIconChip: {
		width: scaleWidth(34),
		height: scaleWidth(34),
		borderRadius: RADIUS.sm,
		backgroundColor: COLORS.secondaryBg,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.md,
	},
	itemIconChipDanger: { backgroundColor: COLORS.dangerBg },
	cardText: { fontSize: FONT_SIZES.mdPlus, color: COLORS.text, fontWeight: '500', letterSpacing: 0.3, flexShrink: 1 },

	// ── 아코디언 ──
	accordionWrapper: { marginHorizontal: SPACING_W.lg, gap: SPACING_H.md },
	accordionGroup: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
		overflow: 'hidden',
	},
	// 파괴적 액션 — 위 그룹들과 한 칸 더 띄운다
	accordionGroupDanger: {
		marginTop: SPACING_H.sm,
		borderWidth: 1,
		borderColor: COLORS.dangerBg,
	},
	accordionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: scaleHeight(52),
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
	},
	accordionIconChip: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(28) / 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.md,
	},
	accordionHeaderText: { fontSize: FONT_SIZES.mdPlus, fontWeight: '600', color: COLORS.text },
	accordionBody: { borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
	accordionSubItem: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: scaleHeight(52),
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	accordionSubText: { fontSize: FONT_SIZES.md, color: COLORS.danger, fontWeight: '500' },

	// ── 권한 설정 ──
	permissionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: scaleHeight(52),
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	permissionTextWrap: { flex: 1, marginRight: SPACING_W.md },
	permissionLabel: { fontSize: FONT_SIZES.mdPlus, fontWeight: '600', color: COLORS.text, letterSpacing: 0.3 },
	permissionDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING_H.xs },
	permissionBadge: {
		borderWidth: 1,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
	},
	permissionBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
	// ===== 소리 설정 =====
	itemIconChipOff: { backgroundColor: COLORS.surfaceAlt },
	soundRow: {
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	soundRowHeader: { flexDirection: 'row', alignItems: 'center', minHeight: scaleHeight(44) },
	soundTextWrap: { flex: 1, marginRight: SPACING_W.md },
	volumeRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm, marginTop: SPACING_H.sm },
	volumeLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
	volumeSlider: { flex: 1, height: scaleHeight(32) },
	volumeValue: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '700', minWidth: scaleWidth(38), textAlign: 'right' },
	volumePreviewButton: { paddingLeft: SPACING_W.xs },
	permissionChevron: { marginLeft: SPACING_W.xs },

	// ===== 화면 테마 (화이트/다크) =====
	themeRow: { flexDirection: 'row', columnGap: SPACING_W.md },
	themeCard: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		minHeight: scaleHeight(60),
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
	},
	themeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
	themeIconChip: {
		width: scaleWidth(34),
		height: scaleWidth(34),
		borderRadius: scaleWidth(17),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.surfaceAlt,
	},
	themeIconChipActive: { backgroundColor: COLORS.primary },
	themeTextWrap: { flex: 1 },
	themeLabel: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
	themeLabelActive: { color: COLORS.primaryDeep },
	themeDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING_H.xxs },
	themeHint: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, lineHeight: scaledSize(18) },
	themeGroupLabel: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textStrong, marginTop: SPACING_H.xs },
	textSizeSample: { fontWeight: '700', color: COLORS.textSecondary },
	textSizeSampleActive: { color: COLORS.textWhite },


	modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING_H.md },
	modalTitleText: { fontSize: FONT_SIZES.xl, lineHeight: scaledSize(26), fontWeight: '700', color: COLORS.textStrong, textAlign: 'center' },
	iconLeft: { marginRight: SPACING_W.sm },

	recommendSection: {
		marginHorizontal: SPACING_W.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		alignItems: 'center',
		marginTop: SPACING_H.md,
	},
	recommendTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING_H.sm },
	recommendTitleIconChip: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(28) / 2,
		backgroundColor: COLORS.secondarySoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING_W.sm,
	},
	recommendTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong },
	recommendSubtitle: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING_H.md },
	appIconWrapper: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		overflow: 'hidden',
	},
	appIcon: { width: '100%', height: '100%', borderRadius: RADIUS.lg },
	storeButtons: { marginTop: SPACING_H.sm, flexDirection: 'row', gap: SPACING_W.sm, alignSelf: 'stretch' },
	storeButton: {
		flex: 1,
		minHeight: scaleHeight(48),
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	storeButtonText: { color: COLORS.textWhite, fontWeight: '700', fontSize: FONT_SIZES.mdPlus },
	iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING_W.sm },

	appVerText: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, textAlign: 'center', marginBottom: SPACING_H.lg },
	appVerBoldText: { fontWeight: '700' },

	footerAppWrapper: { paddingVertical: SPACING_H.md },
	footerAppList: { paddingHorizontal: SPACING_W.lg, gap: SPACING_W.md },
	footerAppCard: {
		width: scaleWidth(120),
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	footerAppIconWrapper: {
		width: scaleWidth(64),
		height: scaleWidth(64),
		borderRadius: RADIUS.md,
		overflow: 'hidden',
		marginBottom: SPACING_H.sm,
	},
	footerAppIcon: { width: '100%', height: '100%' },
	// 아이콘 우상단 NEW 배지 — 이전에는 삼각형 리본 + 5px 회전 텍스트라 글자가 읽히지 않았다.
	footerNewBadge: {
		position: 'absolute',
		top: -scaleHeight(4),
		right: -scaleWidth(6),
		paddingHorizontal: SPACING_W.xs,
		paddingVertical: scaleHeight(1),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.danger,
		borderWidth: 1,
		borderColor: COLORS.surface,
	},
	footerNewBadgeText: {
		fontSize: FONT_SIZES.xxs,
		lineHeight: scaledSize(13),
		fontWeight: '700',
		color: COLORS.textWhite,
		letterSpacing: 0.2,
	},
	footerAppTitle: { fontSize: FONT_SIZES.smPlus, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginBottom: SPACING_H.xs },
	footerAppDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
}));
