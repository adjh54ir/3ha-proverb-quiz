/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MainDataType } from '@/types/MainDataType';

import { RouteProp, useRoute } from '@react-navigation/native';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { FIELD_DROPDOWN_ITEMS, LEVELS, QUIZ_MODES, QuizLevelKey } from '@/const/common/CommonMainData';
import ProverbServices from '@/services/ProverbServices';
import IconComponent from './common/atomic/IconComponent';
import AdmobFrontAd from './common/ads/AdmobFrontAd';
import { COLORS } from '@/theme/theme';

type QuizModeScreenRouteParams = {
	QuizModeScreen: { mode: 'meaning' | 'proverb' | 'blank' | 'example' | 'comingsoon' }; // 전달되는 mode는 string 타입 (예: 'meaning' | 'proverb' | 'blank' | 'example')
};

/** 난이도별 설명 (카드 서브텍스트) */
const LEVEL_DESC: Record<string, string> = {
	beginner: '아주 쉬운 속담으로 가볍게 시작해요',
	intermediate: '한 단계 높은 속담에 도전해요',
	advanced: '익숙하지 않은 속담까지 풀어봐요',
	expert: '어려운 속담으로 실력을 확인해요',
	all: '모든 난이도의 속담을 풀어보기',
	comingsoon: '새로운 문제가 준비 중입니다',
};

const QuizModeScreen = () => {
	const navigation = useNavigation();

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;
	const shouldShowAd = Math.random() < 0.5; // 20% 확률
	const route = useRoute<RouteProp<QuizModeScreenRouteParams, 'QuizModeScreen'>>();
	const passedMode = route.params?.mode; // 예: 'meaning'

	const [proverbList, setProverbList] = useState<MainDataType.Proverb[]>([]);
	const [quizHistory, setQuizHistory] = useState<MainDataType.UserQuizHistory>();

	const [showAd, setShowAd] = useState(false);
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedLevelKey, setSelectedLevelKey] = useState<QuizLevelKey | null>(null);
	const [tab, setTab] = useState<'level' | 'category'>('level');

	const CATEGORIES = FIELD_DROPDOWN_ITEMS.filter((item) => item.label && item.value).map((item) => ({
		key: item.value,
		label: item.label,
		icon: item.iconName ?? '', // 혹은 기본값
		type: item.iconType ?? 'FontAwesome6',
		color: item.iconColor ?? '#ccc',
	}));

	useEffect(() => {
		initData();
	}, []);

	const initData = async () => {
		const allProverbs = ProverbServices.selectProverbList();
		setProverbList(allProverbs);
		const stored = await AsyncStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed: MainDataType.UserQuizHistory = JSON.parse(stored);
			const safeParsed: MainDataType.UserQuizHistory = {
				correctProverbId: parsed.correctProverbId || [],
				wrongProverbId: parsed.wrongProverbId || [],
				lastAnsweredAt: parsed.lastAnsweredAt ? new Date(parsed.lastAnsweredAt) : new Date(),
				quizCounts: parsed.quizCounts || {},
				badges: parsed.badges || [],
				totalScore: parsed.totalScore || 0,
				bestCombo: parsed.bestCombo || 0,
			};
			setQuizHistory(safeParsed);
		}
	};

	const convertKeyToLevel = (key: QuizLevelKey): number | 'all' | null => {
		switch (key) {
			case 'all':
				return 'all';
			case 'beginner':
				return 1;
			case 'intermediate':
				return 2;
			case 'advanced':
				return 3;
			case 'expert':
				return 4;
			default:
				return null;
		}
	};

	const moveToLevelQuiz = (level: QuizLevelKey) => {
		const titleMap = {
			all: '전체 퀴즈',
			beginner: '초급 퀴즈',
			intermediate: '중급 퀴즈',
			advanced: '고급 퀴즈',
			expert: '특급 퀴즈',
		};

		const selectedLevel = convertKeyToLevel(level);

		let filteredQuestions: MainDataType.Proverb[] = [];

		if (selectedLevel === 'all') {
			// ✅ 전체 문제를 전부 포함
			filteredQuestions = proverbList;
		} else {
			// 난이도별 문제 필터링
			filteredQuestions = proverbList.filter((item) => item.level === selectedLevel);
		}
		//@ts-ignore
		navigation.push(Paths.QUIZ, {
			questionPool: filteredQuestions,
			isWrongReview: false,
			title: titleMap[level],
			mode: passedMode,
			selectedLevel,
			levelKey: level,
		});
	};

	const moveToCategoryQuiz = (categoryLabel: string) => {
		const filteredQuestions = categoryLabel === '전체' ? proverbList : proverbList.filter((p) => p.category === categoryLabel);

		//@ts-ignore
		navigation.push(Paths.QUIZ, {
			questionPool: filteredQuestions,
			isWrongReview: false,
			title: categoryLabel + ' 퀴즈',
			mode: passedMode,
			selectedCategory: categoryLabel,
		});
	};

	const selectedMode = QUIZ_MODES.find((mode) => mode.key === passedMode);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'bottom']}>
			<View style={styles.container}>
				<View style={styles.centerWrapper}>
					<View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: scaleHeight(20) }}>
						<TouchableOpacity onPress={() => setTab('level')} style={[styles.tabButton, tab === 'level' && styles.tabActive]}>
							<Text style={[styles.tabText, tab === 'level' && styles.tabTextActive]}>난이도</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => setTab('category')} style={[styles.tabButton, tab === 'category' && styles.tabActive]}>
							<Text style={[styles.tabText, tab === 'category' && styles.tabTextActive]}>카테고리</Text>
						</TouchableOpacity>
					</View>
					<ScrollView
						contentContainerStyle={{
							paddingHorizontal: scaleWidth(2),
							rowGap: scaleHeight(12),
							paddingBottom: scaleHeight(30),
						}}>
						<View style={styles.titleRow}>
							<View style={styles.titleWithIcon}>
								<Text style={styles.title}>
									{tab === 'level' ? '🚀 지금부터 속담 퀴즈 모험 시작! \n난이도를 선택하세요.' : '🚀 지금부터 속담 퀴즈 모험 시작! \n카테고리를 선택하세요.'}
								</Text>
							</View>
						</View>
						{selectedMode && (
							<View style={[styles.selectedModeBoxEnhanced, { backgroundColor: selectedMode.color + '20' }]}>
								<View style={styles.selectedModeRow}>
									<IconComponent
										type={selectedMode.type}
										name={selectedMode.icon}
										size={20}
										color={selectedMode.color}
										style={{ marginRight: scaleWidth(8) }}
									/>
									<Text style={styles.selectedModeTextEnhanced}>
										현재 선택한 모드: <Text style={[styles.selectedModeHighlight, { color: selectedMode.color }]}>{selectedMode.label}</Text>
									</Text>
								</View>
							</View>
						)}
						<View style={styles.gridWrap}>
							{tab === 'level' &&
								LEVELS.map((item) => {
									// @ts-ignore
									const isComingSoon = item.key === 'comingsoon';
									if (isComingSoon) {
										return (
											<TouchableOpacity
												key={item.key}
												style={[styles.levelCardFull, { opacity: 0.6 }]}
												onPress={() => {
													Alert.alert('준비중..', '새로운 문제를 준비 중입니다. 조금만 기다려 주세요!');
												}}>
												<View style={[styles.levelIconChip, { backgroundColor: '#CBD5E1' }]}>
													<IconComponent type={item.type} name={item.icon} size={scaledSize(22)} color="#fff" />
												</View>
												<View style={styles.levelTextWrap}>
													<Text style={styles.levelLabelFull}>{item.label}</Text>
													<Text style={styles.levelDescFull}>{LEVEL_DESC[item.key] ?? ''}</Text>
												</View>
												<Text style={styles.comingSoon}>Coming Soon</Text>
											</TouchableOpacity>
										);
									}

									const levelKey = item.key;
									const selectedLevel = convertKeyToLevel(levelKey);
									const filteredProverbs = selectedLevel === 'all' ? proverbList : proverbList.filter((p) => p.level === selectedLevel);
									const total = filteredProverbs.length;

									const correctSet = new Set(quizHistory?.correctProverbId ?? []);
									const wrongSet = new Set(quizHistory?.wrongProverbId ?? []);
									const solvedSet = new Set([...correctSet, ...wrongSet]);

									const solved = filteredProverbs.filter((p) => solvedSet.has(p.id)).length;

									return (
										<TouchableOpacity
											key={item.key}
											style={styles.levelCardFull}
											activeOpacity={0.85}
											onPress={() => {
												if (shouldShowAd) {
													setSelectedLevelKey(item.key as QuizLevelKey);
													setShowAd(true);
												} else {
													moveToLevelQuiz(item.key as QuizLevelKey);
												}
											}}>
											<View style={[styles.levelIconChip, { backgroundColor: item.color }]}>
												<IconComponent type={item.type} name={item.icon} size={scaledSize(22)} color="#fff" />
											</View>
											<View style={styles.levelTextWrap}>
												<Text style={styles.levelLabelFull}>{item.label}</Text>
												<Text style={styles.levelDescFull} numberOfLines={2}>
													{LEVEL_DESC[item.key] ?? ''}
												</Text>
											</View>
											<View style={styles.levelProgressChip}>
												<Text style={styles.levelProgressText}>{`${solved}/${total}`}</Text>
											</View>
										</TouchableOpacity>
									);
								})}

							{tab === 'category' &&
								CATEGORIES.map((item) => {
									const filteredProverbs = item.label === '전체' ? proverbList : proverbList.filter((p) => p.category === item.label);
									const total = filteredProverbs.length;

									const correctSet = new Set(quizHistory?.correctProverbId ?? []);
									const wrongSet = new Set(quizHistory?.wrongProverbId ?? []);
									const solvedSet = new Set([...correctSet, ...wrongSet]);

									const solved = filteredProverbs.filter((p) => solvedSet.has(p.id)).length;

									return (
										<TouchableOpacity
											key={item.key}
											style={styles.levelCardFull}
											activeOpacity={0.85}
											onPress={() => {
												if (shouldShowAd) {
													setSelectedCategory(item.label);
													setShowAd(true);
												} else {
													moveToCategoryQuiz(item.label);
												}
											}}>
											<View style={[styles.levelIconChip, { backgroundColor: item.color }]}>
												<IconComponent type={item.type} name={item.icon} size={scaledSize(22)} color="#fff" />
											</View>
											<View style={styles.levelTextWrap}>
												<Text style={styles.levelLabelFull}>{item.label}</Text>
												<Text style={styles.levelDescFull} numberOfLines={2}>
													{item.label === '전체' ? '모든 주제의 속담을 풀어보기' : `${item.label} 주제의 속담에 도전`}
												</Text>
											</View>
											<View style={styles.levelProgressChip}>
												<Text style={styles.levelProgressText}>{`${solved}/${total}`}</Text>
											</View>
										</TouchableOpacity>
									);
								})}
						</View>
					</ScrollView>
				</View>
			</View>
			<View style={styles.bottomExitWrapper}>
				<TouchableOpacity
					style={styles.homeButton}
					// @ts-ignore
					onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME })}>
					<IconComponent type="FontAwesome6" name="house" size={16} color="#fff" style={styles.icon} />
					<Text style={styles.buttonText}>홈으로 가기</Text>
				</TouchableOpacity>
			</View>

			{showInfoModal && (
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowInfoModal(false)}>
							<IconComponent type="materialIcons" name="close" size={24} color="#555" />
						</TouchableOpacity>
						<Text style={styles.modalTitle}>난이도별 퀴즈 안내</Text>
						<Text style={styles.modalText}>전체, 초급, 중급, 고급, 특급으로 나뉘며 난이도에 따라 퀴즈 문제가 달라집니다.</Text>
						<TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowInfoModal(false)}>
							<Text style={styles.modalCloseText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}

			{showAd && (
				<AdmobFrontAd
					onAdClosed={() => {
						setShowAd(false);
						if (selectedLevelKey) {
							moveToLevelQuiz(selectedLevelKey);
							setSelectedLevelKey(null);
						} else if (selectedCategory) {
							moveToCategoryQuiz(selectedCategory);
							setSelectedCategory(null);
						}
					}}
				/>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8FAFC',
	},
	centerWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(20),
	},
	levelCardFull: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(14),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(16),
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#EEF2F7',
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(8),
	},
	levelIconChip: { width: scaleWidth(48), height: scaleWidth(48), borderRadius: scaleWidth(14), justifyContent: 'center', alignItems: 'center' },
	levelTextWrap: { flex: 1 },
	levelLabelFull: { fontSize: scaledSize(16), fontWeight: '800', color: '#1E293B', marginBottom: scaleHeight(3) },
	levelDescFull: { fontSize: scaledSize(12.5), color: '#64748B', lineHeight: scaleHeight(17) },
	levelProgressChip: { backgroundColor: '#F1F5F9', borderRadius: scaleWidth(10), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(5) },
	levelProgressText: { fontSize: scaledSize(12), fontWeight: '700', color: '#475569' },
	titleRow: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: scaleHeight(16),
	},
	title: {
		fontSize: scaledSize(20),
		lineHeight: scaleHeight(30),
		color: '#334155',
		fontWeight: '700',
		textAlign: 'center',
	},
	titleWithIcon: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	gridWrap: {
		width: '100%',
		paddingHorizontal: scaleWidth(10),
	},
	gridButtonHalf: {
		width: '46%',
		height: scaleHeight(130),
		borderRadius: scaleWidth(14),
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	modeLabel: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
		marginLeft: scaleWidth(5),
	},
	icon: {
		marginRight: scaleWidth(6),
	},
	modalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 99,
	},
	modalContent: {
		width: '85%',
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(12),
	},
	modalCloseButton: {
		marginTop: scaleHeight(20),
		alignSelf: 'center',
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(30),
		borderRadius: scaleWidth(8),
	},
	modalCloseText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: scaledSize(15),
	},
	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(14),
		textAlign: 'center',
	},
	modalText: {
		fontSize: scaledSize(14),
		color: '#34495e',
		lineHeight: scaleHeight(22),
		textAlign: 'left',
		marginTop: scaleHeight(10),
		marginBottom: scaleHeight(20),
	},
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(10),
		right: scaleWidth(10),
		zIndex: 2,
		padding: scaleWidth(5),
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
		backgroundColor: COLORS.primary,
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(28),
		borderRadius: scaleWidth(30),
	},
	buttonText: {
		color: '#ffffff',
		fontSize: scaledSize(14),
		fontWeight: 'bold',
	},
	disabledButton: {
		backgroundColor: '#ecf0f1',
		borderRadius: scaleWidth(16),
		justifyContent: 'center',
		alignItems: 'center',
		width: '46%',
		height: scaleHeight(130),
		marginBottom: scaleHeight(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	disabledText: {
		color: '#95a5a6',
		fontSize: scaledSize(15),
		fontWeight: '700',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	comingSoon: {
		fontSize: scaledSize(12),
		color: '#bdc3c7',
		fontWeight: '500',
		marginTop: scaleHeight(2),
	},
	iconTextRow: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: scaleHeight(6),
	},
	progressInlineText: {
		color: '#fff',
		fontSize: scaledSize(14),
		marginLeft: scaleWidth(6),
		fontWeight: '700',
	},
	selectedModeBoxEnhanced: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: scaleWidth(12),
		marginVertical: scaleHeight(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#dcdde1',
	},
	selectedModeRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	selectedModeTextEnhanced: {
		fontSize: scaledSize(15),
		color: '#334155',
		fontWeight: '500',
		marginVertical: scaleHeight(6),
	},
	selectedModeHighlight: {
		fontWeight: 'bold',
	},
	tabButton: {
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
		marginHorizontal: scaleWidth(10),
	},
	tabActive: {
		borderBottomColor: COLORS.primary,
	},
	tabText: {
		fontSize: scaledSize(15),
		color: COLORS.textMuted,
		fontWeight: '500',
	},
	tabTextActive: {
		color: COLORS.primary,
		fontWeight: '700',
	},
	categoryRowButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(18),
		borderRadius: scaleWidth(14),
		width: '100%',
		marginBottom: scaleHeight(14),
		backgroundColor: COLORS.primary,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	categoryRowText: {
		flex: 1,
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '700',
		marginLeft: scaleWidth(12),
	},
	progressWrapper: {
		flexDirection: 'column',
		alignItems: 'flex-end',
		minWidth: scaleWidth(90),
	},
	progressBarBackground: {
		width: '100%',
		height: scaleHeight(10),
		backgroundColor: 'rgba(255,255,255,0.25)',
		borderRadius: scaleHeight(5),
		overflow: 'hidden',
		marginBottom: scaleHeight(4),
	},
	progressBarFill: {
		height: '100%',
		borderRadius: scaleHeight(5),
		backgroundColor: '#fff',
	},
	categoryRowProgress: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: '600',
	},
});
export default QuizModeScreen;
