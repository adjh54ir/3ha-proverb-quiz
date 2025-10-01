// QuizStartModal.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Animated, TouchableWithoutFeedback, Dimensions, findNodeHandle, UIManager } from 'react-native';
import IconComponent from '../common/atomic/IconComponent';
import ProverbServices from '@/services/ProverbServices';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { GOOGLE_ADMOV_FRONT_PERCENT } from '@env';

interface Props {
	visible: boolean;
	modeStep: number;
	setModeStep: (val: number) => void;
	selectedLevel: string;
	selectedCategory: string;
	levelOptions: string[];
	categoryOptions: string[];
	setSelectedLevel: (val: string) => void;
	setSelectedCategory: (val: string) => void;
	onClose: () => void;
	onStart: () => void;
	onCompleteStart: () => void; // 광고 포함 여부 관계없이 "퀴즈 시작 버튼 클릭" 콜백
	quizType: 'meaning' | 'proverb' | 'fill-blank'; // ✅ 추가
}
interface SelectGroupProps {
	title: string;
	options: string[];
	onSelect: (val: string) => void; // ❗️이거 빠졌어요
	selected: string;
	compact?: boolean;
	getIcon?: (val: string) => { type: string; name: string } | null; // ✅ 추가
}
type StyleKey = 'level' | 'category';
type StyleMap = Record<string, { color: string; icon: { type: string; name: string }; type: StyleKey }>;

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

const LEVEL_LABEL_MAP: Record<string, string> = {
	'아주 쉬움': '아주 쉬움',
	'쉬움': '쉬움',
	'보통': '보통',
	'어려움': '어려움',
};
// 상단에 매핑 정의
const QUIZ_TYPE_LABELS: Record<'meaning' | 'proverb' | 'fill-blank', string> = {
	meaning: '속담 뜻 퀴즈',
	proverb: '속담 찾기 퀴즈',
	'fill-blank': '빈칸 채우기 퀴즈',
};
const QUIZ_TYPE_STYLE: Record<'meaning' | 'proverb' | 'fill-blank', { icon: string; color: string }> = {
	meaning: { icon: 'book-open', color: '#3498db' },      // 뜻 퀴즈 → 책 아이콘
	proverb: { icon: 'search', color: '#27ae60' },         // 속담 찾기 → 돋보기
	'fill-blank': { icon: 'edit', color: '#e67e22' },      // 빈칸 → 연필
};

const QuizStartModal = ({
	visible,
	modeStep,
	setModeStep,
	selectedLevel,
	selectedCategory,
	levelOptions,
	categoryOptions,
	setSelectedLevel,
	setSelectedCategory,
	onClose,
	onStart,
	onCompleteStart,
	quizType
}: Props) => {
	const STORAGE_KEY_QUIZ = 'UserQuizHistory';
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const [levelStats, setLevelStats] = useState<Record<string, { total: number; studied: number }>>({});
	const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; studied: number }>>({});
	const [quizHistory, setQuizHistory] = useState<UserQuizHistory | null>(null);
	const shouldShowAd = Math.random() < 0.3; // 20% 확률
	const selectedLevelStats =
		levelStats[selectedLevel] || levelStats['전체'] || { total: 0, studied: 0 };

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	useEffect(() => {
		if (!visible || !quizHistory) return;

		const allIds = [...(quizHistory.correctProverbId ?? []), ...(quizHistory.wrongProverbId ?? [])];
		loadStats(Array.from(new Set(allIds)));
	}, [selectedLevel, quizHistory, visible]); // visible 조건 추가

	const loadData = async () => {
		const raw = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);
		let correctIds: number[] = [];
		let wrongIds: number[] = [];

		if (raw) {
			try {
				const parsed: UserQuizHistory = JSON.parse(raw);
				setQuizHistory(parsed); // ✅ 여기서 상태 저장
				correctIds = parsed.correctProverbId ?? [];
				wrongIds = parsed.wrongProverbId ?? [];
			} catch (e) {
				console.error('UserQuizHistory 파싱 실패:', e);
			}
		}

		const studiedIds = Array.from(new Set([...correctIds, ...wrongIds]));
		loadLevelStats(studiedIds);
		loadStats(studiedIds);
	};
	const loadStats = (studiedIds: number[]) => {
		const allProverbs = ProverbServices.selectProverbList();

		// 🔽 난이도 필터링 추가
		const filteredProverbs = selectedLevel === '전체' ? allProverbs : allProverbs.filter((p) => p.levelName === selectedLevel);

		const categoryMap: Record<string, { total: number; studied: number }> = {
			전체: { total: 0, studied: 0 },
		};

		filteredProverbs.forEach((item) => {
			const category = item.category;

			if (!categoryMap[category]) categoryMap[category] = { total: 0, studied: 0 };
			categoryMap[category].total += 1;
			if (studiedIds.includes(item.id)) categoryMap[category].studied += 1;

			categoryMap['전체'].total += 1;
			if (studiedIds.includes(item.id)) categoryMap['전체'].studied += 1;
		});

		setCategoryStats(categoryMap);
	};

	const loadLevelStats = (studiedIds: number[]) => {
		const allProverbs = ProverbServices.selectProverbList();
		const levelMap: Record<string, { total: number; studied: number }> = {
			전체: { total: 0, studied: 0 },
		};

		allProverbs.forEach((item) => {
			const level = item.levelName;

			if (!levelMap[level]) levelMap[level] = { total: 0, studied: 0 };
			levelMap[level].total += 1;
			if (studiedIds.includes(item.id)) levelMap[level].studied += 1;

			// 전체 누적
			levelMap['전체'].total += 1;
			if (studiedIds.includes(item.id)) levelMap['전체'].studied += 1;
		});

		setLevelStats(levelMap);
	};

	const STYLE_MAP: StyleMap = {
		// 레벨
		// 	{
		// 	label: '전체',
		// 	key: 'all',
		// 	icon: () => <IconComponent type="FontAwesome6" name="list" size={16} color="#555" />,
		// 	iconColor: '#555',
		// },


		'전체': { color: '#5DADE2', icon: { type: 'fontAwesome5', name: 'clipboard-list' }, type: 'level' },
		'아주 쉬움': { color: '#85C1E9', icon: { type: 'fontAwesome5', name: 'seedling' }, type: 'level' },
		쉬움: { color: '#F4D03F', icon: { type: 'fontAwesome5', name: 'leaf' }, type: 'level' },
		보통: { color: '#EB984E', icon: { type: 'fontAwesome5', name: 'tree' }, type: 'level' },
		어려움: { color: '#E74C3C', icon: { type: 'fontAwesome5', name: 'trophy' }, type: 'level' },

		// 카테고리
		'운/우연': { color: '#81ecec', icon: { type: 'fontAwesome5', name: 'dice' }, type: 'category' },
		인간관계: { color: '#a29bfe', icon: { type: 'fontAwesome5', name: 'users' }, type: 'category' },
		'세상 이치': { color: '#f39c12', icon: { type: 'fontAwesome5', name: 'globe' }, type: 'category' },
		'근면/검소': { color: '#fab1a0', icon: { type: 'fontAwesome5', name: 'hammer' }, type: 'category' },
		'노력/성공': { color: '#55efc4', icon: { type: 'fontAwesome5', name: 'medal' }, type: 'category' },
		'경계/조심': { color: '#ff7675', icon: { type: 'fontAwesome5', name: 'exclamation-triangle' }, type: 'category' },
		'욕심/탐욕': { color: '#fd79a8', icon: { type: 'fontAwesome5', name: 'hand-holding-usd' }, type: 'category' },
		'배신/불신': { color: '#b2bec3', icon: { type: 'fontAwesome5', name: 'user-slash' }, type: 'category' },
	};

	const CATEGORY_DESCRIPTIONS: Record<string, string> = {
		'운/우연': '예기치 않은 상황이나 운명에 관한 속담이에요.',
		인간관계: '사람과 사람 사이의 관계나 처세에 관한 속담이에요.',
		'세상 이치': '세상의 이치나 진리에 대해 알려주는 속담이에요.',
		'근면/검소': '성실함과 검소함의 중요성을 알려주는 속담이에요.',
		'노력/성공': '노력 끝에 얻는 보람이나 성공에 관한 속담이에요.',
		'경계/조심': '조심성과 주의의 필요성을 담은 속담이에요.',
		'욕심/탐욕': '지나친 욕심이 부작용을 일으킬 수 있음을 경고하는 속담이에요.',
		'배신/불신': '믿음을 저버리거나 신뢰를 잃는 상황을 담은 속담이에요.',
	};
	const tooltipText = Object.entries(CATEGORY_DESCRIPTIONS)
		.map(([key, desc]) => `• ${key}: ${desc}`)
		.join('\n');
	const getStyleColor = (key: string): string => STYLE_MAP[key]?.color || (STYLE_MAP[key]?.type === 'level' ? '#0A84FF' : '#dfe6e9');
	const getStyleIcon = (key: string): { type: string; name: string } | null => STYLE_MAP[key]?.icon || null;


	const ProgressBar = ({ studied, total, color }: { studied: number; total: number; color: string }) => {
		const percentage = total > 0 ? (studied / total) * 100 : 0;

		return (
			<View style={styles.progressWrapper}>
				<View style={styles.progressBackground}>
					<View
						style={[
							styles.progressFill,
							{
								width: `${percentage}%`,
								backgroundColor: color,
							},
						]}
					/>
				</View>
				<Text style={styles.progressText}>
					{studied}/{total} ({Math.round(percentage)}%)
				</Text>
			</View>
		);
	};
	const HeaderPath = () => {
		return (
			<View style={styles.headerPathContainer}>
				{/* 퀴즈 타입 */}
				<View style={[styles.pathBadge, { backgroundColor: QUIZ_TYPE_STYLE[quizType].color }]}>
					<IconComponent
						type="fontAwesome5"
						name={QUIZ_TYPE_STYLE[quizType].icon}
						size={14}
						color="#fff"
						style={{ marginRight: scaleWidth(4) }}
					/>
					<Text style={styles.pathBadgeText}>{QUIZ_TYPE_LABELS[quizType]}</Text>
				</View>

				<IconComponent
					type="fontAwesome5"
					name="chevron-right"
					size={14}
					color="#b2bec3"
					style={styles.pathChevron}
				/>

				{/* 난이도 */}
				<View style={[styles.pathBadge, { backgroundColor: getStyleColor(selectedLevel) }]}>
					{STYLE_MAP[selectedLevel] && (
						<IconComponent
							type={STYLE_MAP[selectedLevel].icon.type}
							name={STYLE_MAP[selectedLevel].icon.name}
							size={14}
							color="#fff"
							style={{ marginRight: scaleWidth(4) }}
						/>
					)}
					<Text style={styles.pathBadgeText}>{selectedLevel || '난이도 선택'}</Text>
				</View>

				{/* 카테고리 (modeStep === 1일 때만) */}
				{modeStep === 1 && (
					<>
						<IconComponent
							type="fontAwesome5"
							name="chevron-right"
							size={14}
							color="#b2bec3"
							style={styles.pathChevron}
						/>
						<View style={[styles.pathBadge, { backgroundColor: getStyleColor(selectedCategory) }]}>
							{STYLE_MAP[selectedCategory] && (
								<IconComponent
									type={STYLE_MAP[selectedCategory].icon.type}
									name={STYLE_MAP[selectedCategory].icon.name}
									size={14}
									color="#fff"
									style={{ marginRight: scaleWidth(4) }}
								/>
							)}
							<Text style={styles.pathBadgeText}>{selectedCategory || '카테고리 선택'}</Text>
						</View>
					</>
				)}
			</View>
		);
	};

	const InlineTooltip = ({ marginLeft = 0, marginTop = 0 }: { marginLeft?: number; marginTop?: number }) => {
		const [showTooltip, setShowTooltip] = useState(false);
		const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('left');
		const iconRef = useRef(null);

		const toggleTooltip = () => {
			if (!showTooltip) {
				const nodeHandle = findNodeHandle(iconRef.current);
				if (nodeHandle) {
					UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
						const screenWidth = Dimensions.get('window').width;
						const tooltipWidth = 280;
						const margin = 10;
						setTooltipPosition(pageX + tooltipWidth + margin > screenWidth ? 'right' : 'left');
						setShowTooltip(true);
					});
				}
			} else {
				setShowTooltip(false);
			}
		};

		const closeTooltip = () => setShowTooltip(false);

		return (
			<View style={{ position: 'relative', marginLeft, marginTop }}>
				<TouchableOpacity ref={iconRef} onPress={toggleTooltip}>
					<IconComponent type='fontawesome6' name="circle-question" size={16} color="#666" />
				</TouchableOpacity>

				{showTooltip && (
					<>
						<TouchableWithoutFeedback onPress={closeTooltip}>
							<View style={{
								position: 'absolute',
								top: 0, left: 0,
								width: Dimensions.get('window').width,
								height: Dimensions.get('window').height,
								zIndex: 10000,
							}} />
						</TouchableWithoutFeedback>

						<View style={{
							position: 'absolute',
							top: scaleHeight(28),
							[tooltipPosition]: 0,
							backgroundColor: 'rgba(0, 0, 0, 0.88)',
							padding: scaleWidth(12),
							borderRadius: 8,
							width: scaleWidth(280),
							zIndex: 10001,
						}}>
							{Object.entries(CATEGORY_DESCRIPTIONS).map(([key, desc]) => (
								<View key={key} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
									{STYLE_MAP[key] && (
										<IconComponent
											type={STYLE_MAP[key].icon.type}
											name={STYLE_MAP[key].icon.name}
											size={13}
											color={STYLE_MAP[key].color}
											style={{ marginRight: scaleWidth(6), marginTop: scaleHeight(2) }}
										/>
									)}
									<View style={{ flex: 1 }}>
										<Text style={{
											color: STYLE_MAP[key]?.color || '#FFD700',
											fontWeight: 'bold',
											fontSize: scaledSize(13),
										}}>
											{key}
										</Text>
										<Text style={{ color: '#ecf0f1', fontSize: scaledSize(12), lineHeight: scaleHeight(17) }}>{desc}</Text>
									</View>
								</View>
							))}
						</View>
					</>
				)}
			</View>
		);
	};


	const handleStartPress = () => {
		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 0.95, // 살짝 줄어듦
				duration: 80,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1.05, // 살짝 커짐
				duration: 120,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1, // 원래 크기
				duration: 80,
				useNativeDriver: true,
			}),
		]).start(() => {
			// 애니메이션 끝난 뒤 원래 로직 실행
			if (modeStep === 0) {
				setModeStep(1);
			} else {
				if (shouldShowAd) {
					onCompleteStart();
				} else {
					onStart();
				}
			}
		});
	};


	const SelectGroup = ({ title, options, selected, compact = false, getIcon }: SelectGroupProps) => {
		const isLevel = title.includes('난이도');

		const onSelect = (val: string) => {
			if (isLevel) {
				setSelectedLevel(val);
			} else {
				setSelectedCategory(val);
			}
		};

		const getColor = (val: string) => getStyleColor(val);



		return (
			<View style={styles.selectGroupWrapper}>
				{/* <View style={styles.selectTitleBox}>
					<Text style={styles.selectTitleEmoji}>🎯</Text>
					<Text style={styles.selectTitleText}>{title}</Text>
				</View> */}
				<View style={styles.selectSection}>
					{options.map((option, idx) => {
						const iconData = getIcon?.(option);
						const isAll = option === '전체';
						const isSelected = selected === option;
						const stats = isLevel ? levelStats[option] : categoryStats[option];

						return (
							<TouchableOpacity
								key={option}
								style={
									[
										isAll ? styles.fullWidthButton : styles.halfWidthButton,
										{ backgroundColor: isAll ? '#5DADE2' : getColor(option) },
										isSelected && styles.selectButtonActive,
									]
								}
								onPress={() => onSelect(option)}>
								<Animated.View
									style={
										[
											isSelected && {
												transform: [{ scale: 1.02 }],
											},
										]}>
									<View style={{ alignItems: 'center', justifyContent: 'center' }}>
										{/* 아이콘 */}
										{isAll ? (
											<IconComponent type='fontAwesome5' name='clipboard-list' size={20} color={isSelected ? '#ffffff' : '#eeeeee'} style={{ marginBottom: scaleHeight(4) }} />
										) : iconData ? (
											<IconComponent type={iconData.type} name={iconData.name} size={18} color={isSelected ? '#ffffff' : '#eeeeee'} style={{ marginBottom: scaleHeight(4) }} />
										) : null}

										{/* ✅ 난이도: 상단 라벨 (Level 1 등) */}
										{isLevel && LEVEL_LABEL_MAP[option] && <Text style={styles.levelTopLabel}>{LEVEL_LABEL_MAP[option]}</Text>}

										{/* ✅ 중간 라벨: 아주 쉬움 등 */}
										<Text style={styles.levelMainLabel}>{option}</Text>

										{/* ✅ 하단 통계: (3/20) */}
										{stats && (
											<Text style={styles.levelStatLabel}>
												({stats.studied}/{stats.total})
											</Text>
										)}

									</View>
								</Animated.View>
							</TouchableOpacity>
						);
					})
					}
				</View >
			</View >
		);
	};

	return (
		<>
			<Modal visible={visible} transparent animationType='none'>
				<View style={styles.modalOverlay}>
					<View style={styles.selectModal}>
						{/* 최상단 타이틀 */}
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>퀴즈 모드</Text>
							<TouchableOpacity style={styles.closeButton} onPress={onClose}>
								<IconComponent type='materialIcons' name='close' size={24} color='#7f8c8d' />
							</TouchableOpacity>
						</View>
						{/* <Text style={styles.selectSub}>난이도와 카테고리를 선택해주세요!</Text> */}

						<View style={styles.selectModalContentBox}>
							{modeStep === 0 ? (
								<>


									<View style={styles.selectTitleBox}>
										<Text style={styles.selectTitleEmoji}>🧠</Text>
										<Text style={styles.selectTitleText}>나에게 맞는 난이도를 골라보세요!</Text>
									</View>
									{/* ✅ 선택한 모드 전체 경로 표시 */}
									<View style={styles.subModeTextWrapper}>
										<HeaderPath />
									</View>
									{/* ✅ 선택된 난이도의 진행도 바 */}
									{/* ✅ 선택된 난이도 카드 */}
									{selectedLevel && (
										<View style={[styles.selectedLevelCard, { borderColor: getStyleColor(selectedLevel) }]}>
											<View style={styles.selectedLevelHeader}>
												{STYLE_MAP[selectedLevel] && (
													<IconComponent
														type={STYLE_MAP[selectedLevel].icon.type}
														name={STYLE_MAP[selectedLevel].icon.name}
														size={20}
														color={getStyleColor(selectedLevel)}
														style={{ marginRight: scaleWidth(6) }}
													/>
												)}
												<Text style={[styles.selectedLevelText, { color: getStyleColor(selectedLevel) }]}>
													{LEVEL_LABEL_MAP[selectedLevel] || selectedLevel}
												</Text>
											</View>

											{/* ✅ 진행도 바 개선 */}
											<View style={styles.progressContainer}>
												<View style={styles.progressTrack}>
													<View
														style={[
															styles.progressIndicator,
															{
																width: `${(selectedLevelStats.studied / selectedLevelStats.total) * 100}%`,
																backgroundColor: getStyleColor(selectedLevel),
															},
														]}
													/>
												</View>
												<View style={styles.progressBadge}>
													<Text style={styles.progressBadgeText}>
														{Math.round((selectedLevelStats.studied / selectedLevelStats.total) * 100)}%
													</Text>
												</View>
											</View>

											<Text style={styles.progressDetail}>
												{selectedLevelStats?.studied ?? 0} / {selectedLevelStats?.total ?? 0} 퀴즈 완료
											</Text>
										</View>
									)}
									<SelectGroup title='난이도 선택' options={levelOptions} selected={selectedLevel} onSelect={setSelectedLevel} getIcon={getStyleIcon} />
								</>
							) : (
								<>

									<View style={styles.selectTitleBox}>
										<View style={styles.titleRowCenter}>
											<Text style={styles.selectTitleEmoji}>🎯 </Text>
											<Text style={styles.selectTitleText}>관심 있는 주제를 골라볼까요?</Text>
											<InlineTooltip />
										</View>
									</View>

									{/* ✅ 선택한 모드 표시 */}
									<View style={styles.subModeTextWrapper}>
										<HeaderPath />
									</View>

									<ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: scaleHeight(10) }} showsVerticalScrollIndicator={false}>
										<SelectGroup
											title='카테고리 선택'
											options={categoryOptions}
											selected={selectedCategory}
											onSelect={setSelectedCategory}
											getIcon={getStyleIcon}
										/>
									</ScrollView>
								</>
							)}
						</View>

						<View style={styles.buttonRow}>
							{modeStep === 1 && (
								<TouchableOpacity onPress={() => setModeStep(0)} style={[styles.modalButton, styles.backButtonInline]}>
									<IconComponent type='fontAwesome5' name='arrow-left' size={16} color='#3498db' />
									<Text style={styles.backButtonText}>이전</Text>
								</TouchableOpacity>
							)}
							<TouchableOpacity
								style={[
									styles.modalButton,
									{
										backgroundColor:
											(modeStep === 0 && selectedLevel) || (modeStep === 1 && selectedCategory)
												? '#27ae60'
												: '#ccc',
									},
								]}
								disabled={modeStep === 0 ? !selectedLevel : !selectedCategory}
								onPress={handleStartPress} // ← 여기!
							>
								<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
									<View style={styles.centeredButtonContent}>
										{modeStep === 1 && (
											<IconComponent
												type="fontAwesome5"
												name="rocket"
												size={16}
												color="#fff"
												style={{ marginRight: 8 }}
											/>
										)}
										<Text style={styles.modalButtonText}>
											{modeStep === 0 ? '다음' : '퀴즈 시작'}
										</Text>
										{modeStep === 0 && (
											<IconComponent
												type="fontAwesome5"
												name="arrow-right"
												size={16}
												color="#fff"
												style={{ marginLeft: 8 }}
											/>
										)}
									</View>
								</Animated.View>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal >
		</>
	);
};

export default QuizStartModal;

const styles = StyleSheet.create({
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
	selectModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(24),
		paddingBottom: scaleHeight(24),
		paddingTop: scaleHeight(10),
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		width: '90%',
		position: 'relative',
	},
	selectSub: {
		fontSize: scaledSize(16),
		color: '#34495e',
		marginBottom: scaleHeight(20),
		textAlign: 'center',
	},
	modalButton: {
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(40),
		borderRadius: scaleWidth(30),
		marginTop: scaleHeight(12),
	},
	modalButtonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
	backButtonInline: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		paddingVertical: scaleHeight(14),
		borderRadius: scaleWidth(30),
		borderWidth: 2,
		borderColor: '#3498db',
	},
	backButtonText: {
		width: "100%",
		marginLeft: scaleWidth(8),
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#3498db',
	},
	selectGroupWrapper: {
		backgroundColor: '#f2f4f5',
		borderRadius: scaleWidth(12),
		padding: 16,
		paddingHorizontal: scaleWidth(16),
		width: '100%',
		borderWidth: 1,
		borderColor: '#dfe6e9',
	},
	selectSection: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: scaleWidth(5),
		paddingBottom: scaleHeight(16),
	},
	halfWidthButton: {
		width: '46%',
		minHeight: scaleHeight(56),
		borderRadius: scaleWidth(12),
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(10),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.1,
		shadowRadius: scaleWidth(3),
		marginBottom: scaleHeight(6),
	},
	fullWidthButton: {
		width: '100%',
		minHeight: scaleHeight(56),
		borderRadius: scaleWidth(12),
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(10),
		marginBottom: scaleHeight(10),
	},
	selectButtonActive: {
		borderWidth: 2,
		borderColor: '#888',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.6,
		shadowRadius: scaleWidth(4),
	},
	selectButtonTextActive: {
		color: '#fff',
	},
	selectTitleBox: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(6),
	},
	selectTitleEmoji: {
		fontSize: scaledSize(22),
		justifyContent: 'center',
		alignContent: 'center',
	},
	selectTitleText: {
		fontSize: scaledSize(17),
		fontWeight: '600',
		color: '#2d3436',
		textAlign: 'center',
		lineHeight: scaleHeight(24),
		flexShrink: 1,
		marginRight: scaleWidth(5),

	},
	selectButtonText: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#ffffff',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	levelLabel: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#ffffff',
		marginBottom: scaleHeight(4),
	},
	selectModalContentBox: {
		width: '100%',
		maxWidth: scaleWidth(400),
		height: scaleHeight(550),
		justifyContent: 'center',
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: scaleWidth(12),
		width: '100%',
	},
	centeredButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	levelTopLabel: {
		fontSize: scaledSize(13),
		fontWeight: '700',
		color: '#ecf0f1',
		marginBottom: scaleHeight(2),
	},
	levelMainLabel: {
		fontSize: scaledSize(16),
		fontWeight: '800',
		color: '#ffffff',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	levelStatLabel: {
		fontSize: scaledSize(12),
		color: '#ecf0f1',
		opacity: 0.8,
		marginTop: scaleHeight(2),
	},
	selectTitle: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
		marginTop: scaleHeight(12),
		textAlign: 'center',
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		paddingTop: scaleHeight(16),
		paddingBottom: scaleHeight(12),
		position: 'relative',
	},
	modalTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
	},
	closeButton: {
		position: 'absolute',
		right: 0,
		top: scaleHeight(8),
		padding: scaleWidth(8),
	},
	infoModalBox: {
		backgroundColor: '#fff',
		borderRadius: scaleWidth(16),
		padding: scaleWidth(20),
		width: '85%',
		maxWidth: scaleWidth(400),
		maxHeight: '80%',
		alignItems: 'center',
	},
	titleRowCenter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 1,
	},
	progressBarBackground: {
		width: '100%',
		height: scaleHeight(6),
		backgroundColor: 'rgba(255,255,255,0.3)',
		borderRadius: scaleWidth(4),
		marginTop: scaleHeight(4),
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: scaleWidth(4),
	},
	progressWrapper: {
		width: '100%',
		marginTop: scaleHeight(8),
	},
	progressBackground: {
		width: '100%',
		height: scaleHeight(10),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleWidth(10),
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: scaleWidth(10),
	},
	progressText: {
		marginTop: scaleHeight(4),
		fontSize: scaledSize(12),
		fontWeight: '600',
		color: '#2d3436',
		textAlign: 'right',
	},
	selectedLevelCard: {
		width: '100%',
		borderWidth: 2,
		borderRadius: scaleWidth(14),
		padding: scaleWidth(12),
		marginBottom: scaleHeight(16),
		backgroundColor: '#fdfefe',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	selectedLevelHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	selectedLevelText: {
		fontSize: scaledSize(16),
		fontWeight: '700',
	},
	progressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: scaleHeight(6),
	},
	progressTrack: {
		flex: 1,
		height: scaleHeight(10),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleWidth(10),
		overflow: 'hidden',
		marginRight: scaleWidth(8),
	},
	progressIndicator: {
		height: '100%',
		borderRadius: scaleWidth(10),
	},
	progressBadge: {
		minWidth: scaleWidth(40),
		height: scaleHeight(22),
		borderRadius: scaleWidth(12),
		backgroundColor: '#2d3436',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(6),
	},
	progressBadgeText: {
		fontSize: scaledSize(12),
		fontWeight: '700',
		color: '#fff',
	},
	progressDetail: {
		marginTop: scaleHeight(4),
		fontSize: scaledSize(12),
		color: '#636e72',
		textAlign: 'right',
	},
	subModeText: {
		fontSize: scaledSize(14),
		color: '#636e72',
		textAlign: 'center',
		marginBottom: scaleHeight(12),
		fontWeight: '500',
	},
	headerPathContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: scaleHeight(10),
		flexWrap: 'wrap', // 길어질 경우 줄바꿈 허용
	},
	pathBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(5),
		borderRadius: scaleWidth(20),
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
		marginVertical: scaleHeight(4),
	},

	pathBadgeText: {
		color: '#fff',
		fontSize: scaledSize(13),
		fontWeight: '600',
	},

	pathChevron: {
		marginHorizontal: scaleWidth(6),
		opacity: 0.6,
	},
	subModeTextWrapper: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	subModeTextLabel: {
		fontSize: scaledSize(14),
		color: '#636e72',
		fontWeight: '500',
		marginRight: scaleWidth(6),
	},
	quizTypeWrapper: {
		alignItems: 'center',
	},
	quizTypeText: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#2c3e50',
	},
	quizTypeWrapper: {
		marginBottom: scaleHeight(10),
		alignItems: 'center',
	},
	quizTypeBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(14),
		borderRadius: scaleWidth(20),
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
	},
	quizTypeText: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#fff',
	},
});
