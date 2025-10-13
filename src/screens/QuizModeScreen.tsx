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
import LevelPlayFrontAd from './common/ads/levelplay/LevelPlayFrontAd';

type QuizModeScreenRouteParams = {
	QuizModeScreen: { mode: 'meaning' | 'proverb' | 'blank' | 'comingsoon' }; // 전달되는 mode는 string 타입 (예: 'meaning' | 'proverb' | 'blank')
};

const QuizModeScreen = () => {
	const navigation = useNavigation();

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;
	const shouldShowAd = Math.random() < 0.3; // 20% 확률
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
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
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
												style={[styles.gridButtonHalf, { backgroundColor: '#ecf0f1' }]}
												onPress={() => {
													Alert.alert('준비중..', '새로운 문제를 준비 중입니다. 조금만 기다려 주세요!');
												}}>
												<IconComponent type={item.type} name={item.icon} size={28} color="#bdc3c7" />
												<Text style={styles.disabledText}>{item.label}</Text>
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
											style={[styles.gridButtonHalf, { backgroundColor: item.color }]}
											onPress={() => {
												if (shouldShowAd) {
													setSelectedLevelKey(item.key as QuizLevelKey);
													setShowAd(true);
												} else {
													moveToLevelQuiz(item.key as QuizLevelKey);
												}
											}}>
											<View style={styles.iconTextRow}>
												<IconComponent type={item.type} name={item.icon} size={28} color="#fff" />
												<Text style={styles.modeLabel}>{item.label}</Text>
												<Text style={styles.progressInlineText}>{`(${solved}/${total})`}</Text>
											</View>
										</TouchableOpacity>
									);
								})}
						</View>
						<View style={{marginTop: scaleHeight(-10)}}>
							{tab === 'category' && (
								<View style={{ flex: 1, width: '100%', paddingHorizontal: scaleWidth(12) }}>
									{CATEGORIES.map((item) => {
										const filteredProverbs = item.label === '전체' ? proverbList : proverbList.filter((p) => p.category === item.label);
										const total = filteredProverbs.length;

										const correctSet = new Set(quizHistory?.correctProverbId ?? []);
										const wrongSet = new Set(quizHistory?.wrongProverbId ?? []);
										const solvedSet = new Set([...correctSet, ...wrongSet]);

										const solved = filteredProverbs.filter((p) => solvedSet.has(p.id)).length;

										return (
											<TouchableOpacity
												key={item.key}
												style={[styles.categoryRowButton, { backgroundColor: item.color }]}
												onPress={() => {
													if (shouldShowAd) {
														setSelectedCategory(item.label);
														setShowAd(true);
													} else {
														moveToCategoryQuiz(item.label);
													}
												}}>
												{/* 왼쪽 아이콘 + 라벨 */}
												<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
													<IconComponent type={item.type} name={item.icon} size={22} color="#fff" />
													<Text style={styles.categoryRowText}>{item.label}</Text>
												</View>

												{/* 오른쪽 진행률 */}
												<View style={styles.progressWrapper}>
													<View style={styles.progressBarBackground}>
														<View style={[styles.progressBarFill, { width: `${(solved / total) * 100}%` }]} />
													</View>
													<Text style={styles.categoryRowProgress}>{`${solved}/${total}`}</Text>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
							)}
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
				<LevelPlayFrontAd
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
		backgroundColor: '#fff',
	},
	centerWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(20),
	},
	titleRow: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: scaleHeight(16),
	},
	title: {
		fontSize: scaledSize(20),
		lineHeight: scaleHeight(30),
		color: '#2c3e50',
		fontWeight: '700',
		textAlign: 'center',
	},
	titleWithIcon: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	gridWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: scaleWidth(12),
		paddingHorizontal: scaleWidth(20),
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
		color: '#2c3e50',
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
		color: '#2c3e50',
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
		borderBottomColor: '#2ecc71',
	},
	tabText: {
		fontSize: scaledSize(15),
		color: '#7f8c8d',
		fontWeight: '500',
	},
	tabTextActive: {
		color: '#2ecc71',
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
		backgroundColor: '#6c5ce7',
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
