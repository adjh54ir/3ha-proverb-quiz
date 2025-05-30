import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	Alert,
	Modal,
	LayoutAnimation,
	FlatList,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import 'moment/locale/ko'; // 한국어 로케일 import
import AdmobBannerAd from './common/ads/AdmobBannerAd';
import ProverbServices from '@/services/ProverbServices';
import { CONST_BADGES } from '@/const/ConstBadges';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

moment.locale('ko'); // 로케일 설정

const STORAGE_KEY_QUIZ = 'UserQuizHistory';
const STORAGE_KEY_STUDY = 'UserStudyHistory';

const CapitalResultScreen = () => {
	const isFocused = useIsFocused();
	const scrollRef = useRef<ScrollView>(null);
	const [refreshing, setRefreshing] = useState(false);
	const levelScrollRef = useRef<ScrollView>(null);

	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
	const [totalScore, setTotalScore] = useState<number>(0);
	const [levelMaster, setLevelMaster] = useState<string[]>([]);
	const [correctCount, setCorrectCount] = useState<number>(0);
	const [wrongCount, setWrongCount] = useState<number>(0);
	const [lastAnsweredAt, setLastAnsweredAt] = useState<string>('');
	const [bestCombo, setBestCombo] = useState<number>(0);
	const [showLevelModal, setShowLevelModal] = useState(false);
	const [showBadgeList, setShowBadgeList] = useState(false);
	const [studyCountries, setStudyCountries] = useState<string[]>([]);
	const [lastStudyAt, setLastStudyAt] = useState<string>('');
	const [totalStudyCount, setTotalStudyCount] = useState<number>(0);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [categoryMaster, setCategoryMaster] = useState<string[]>([]);
	const [totalCountryCount, setTotalCountryCount] = useState<number>(0);

	const allCategories = ProverbServices.selectCategoryList(); // 전체 카테고리 (8개)

	const DIFFICULTIES = [
		{ key: 'Level 1', title: 'Level 1', subtitle: '아주 쉬움', icon: 'seedling' },
		{ key: 'Level 2', title: 'Level 2', subtitle: '쉬움', icon: 'leaf' },
		{ key: 'Level 3', title: 'Level 3', subtitle: '보통', icon: 'tree' },
		{ key: 'Level 4', title: 'Level 4', subtitle: '어려움', icon: 'trophy' },
	];

	const CATEGORY_META: Record<string, { color: string; icon: { type: string; name: string } }> = {
		'운/우연': { color: '#81ecec', icon: { type: 'fontAwesome5', name: 'dice' } },
		인간관계: { color: '#a29bfe', icon: { type: 'fontAwesome5', name: 'users' } },
		'세상 이치': { color: '#ffeaa7', icon: { type: 'fontAwesome5', name: 'globe' } },
		'근면/검소': { color: '#fab1a0', icon: { type: 'fontAwesome5', name: 'hammer' } },
		'노력/성공': { color: '#55efc4', icon: { type: 'fontAwesome5', name: 'medal' } },
		'경계/조심': { color: '#ff7675', icon: { type: 'fontAwesome5', name: 'exclamation-triangle' } },
		'욕심/탐욕': { color: '#fd79a8', icon: { type: 'fontAwesome5', name: 'hand-holding-usd' } },
		'배신/불신': { color: '#b2bec3', icon: { type: 'fontAwesome5', name: 'user-slash' } },
	};

	const STYLE_MAP = {
		'아주 쉬움': {
			color: '#85C1E9',
			icon: { type: 'fontAwesome5', name: 'seedling' },
			badgeId: 'level_easy_1',
			type: 'level',
		},
		쉬움: {
			color: '#F4D03F',
			icon: { type: 'fontAwesome5', name: 'leaf' },
			badgeId: 'level_easy_2',
			type: 'level',
		},
		보통: {
			color: '#EB984E',
			icon: { type: 'fontAwesome5', name: 'tree' },
			badgeId: 'level_medium',
			type: 'level',
		},
		어려움: {
			color: '#E74C3C',
			icon: { type: 'fontAwesome5', name: 'trophy' },
			badgeId: 'level_hard',
			type: 'level',
		},
	};

	const getLevelStyle = (subtitle: string) => {
		const entry = STYLE_MAP[subtitle];
		if (!entry) return { bg: '#fff', border: '#ccc' };
		return { bg: entry.color, border: entry.color };
	};

	useEffect(() => {
		if (isFocused) handleScrollToTop();
	}, [isFocused]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	const loadData = async () => {
		try {
			const categoryMap: Record<string, { total: number; studied: number }> = {};

			const studyData = await AsyncStorage.getItem(STORAGE_KEY_STUDY);
			const quizData = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);

			const studyBadges = studyData ? (JSON.parse(studyData)?.badges ?? []) : [];
			const quizJson = quizData ? JSON.parse(quizData) : null;
			const quizBadges = quizJson?.badges ?? [];
			const studyJson = studyData ? JSON.parse(studyData) : null;
			const studiedIds: number[] = studyJson?.studyProverbes ?? [];
			const studyCounts = studyJson?.studyCounts ?? {};
			const lastDate = studyJson?.lastStudyAt ?? '';

			const allProverbs = ProverbServices.selectProverbList();
			setTotalCountryCount(allProverbs.length);
			setStudyCountries(studiedIds.map(String)); // 화면 출력용
			setLastStudyAt(lastDate);

			const totalCount = (Object.values(studyCounts) as number[]).reduce((a, b) => a + b, 0);
			setTotalStudyCount(totalCount);

			setTotalScore(quizJson?.totalScore ?? 0);
			setCorrectCount(quizJson?.correctProverbId?.length ?? 0);
			setWrongCount(quizJson?.wrongProverbId?.length ?? 0);
			setLastAnsweredAt(quizJson?.lastAnsweredAt ?? '');
			setBestCombo(quizJson?.bestCombo ?? 0);

			// 전체 카테고리별 속담 수 초기화
			allProverbs.forEach((item) => {
				const cat = item.category;
				if (!categoryMap[cat]) {
					categoryMap[cat] = { total: 0, studied: 0 };
				}
				categoryMap[cat].total++;
				if (studiedIds.includes(item.id)) {
					categoryMap[cat].studied++;
				}
			});

			const allBadges = [...new Set([...studyBadges, ...quizBadges])];
			setEarnedBadgeIds(allBadges);

			console.log(allCategories);

			// 카테고리 뱃지 매핑
			const categoryMap2: { [key: string]: string } = {
				'운/우연': 'category_luck',
				인간관계: 'category_relation',
				'세상 이치': 'category_life',
				'근면/검소': 'category_diligence',
				'노력/성공': 'category_effort',
				'경계/조심': 'category_caution',
				'욕심/탐욕': 'category_greed',
				'배신/불신': 'category_betrayal',
			};

			// 정복한 카테고리만 추출
			const conqueredCategories = Object.entries(categoryMap2)
				.filter(([_, badgeId]) => allBadges.includes(badgeId))
				.map(([label]) => label);

			setCategoryMaster(conqueredCategories);

			// 🔽 earnedBadgeIds 대신 allBadges 사용
			const conqueredLevels = Object.entries(STYLE_MAP)
				.filter(([_, v]) => allBadges.includes(v.badgeId)) // ✅ 수정됨
				.map(([k]) => {
					switch (k) {
						case '아주 쉬움':
							return 'Level 1';
						case '쉬움':
							return 'Level 2';
						case '보통':
							return 'Level 3';
						case '어려움':
							return 'Level 4';
						default:
							return '';
					}
				});

			setLevelMaster(conqueredLevels);
		} catch (e) {
			console.error('❌ 데이터 로딩 실패:', e);
		}
	};

	const onRefresh = () => {
		setRefreshing(true);
		loadData().finally(() => setRefreshing(false)); // ✅ 이 방식 권장
	};

	const handleScrollToTop = () => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	const toggleBadgeList = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setShowBadgeList((prev) => !prev);
	};

	const totalSolved = correctCount + wrongCount;
	const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

	const LEVEL_DATA = [
		{
			score: 0,
			next: 600,
			label: '속담 초보자',
			icon: 'seedling',
			mascot: require('@/assets/images/level1_mascote.png'),
		},
		{
			score: 600,
			next: 1200,
			label: '속담 입문자',
			icon: 'leaf',
			mascot: require('@/assets/images/level2_mascote.png'),
		},
		{
			score: 1200,
			next: 1800,
			label: '속담 숙련자',
			icon: 'tree',
			mascot: require('@/assets/images/level3_mascote.png'),
		},
		{
			score: 1800,
			next: 2461,
			label: '속담 마스터',
			icon: 'trophy',
			mascot: require('@/assets/images/level4_mascote.png'),
		},
	];

	const reversedLevelGuide = [...LEVEL_DATA].reverse();
	const currentLevelIndex = reversedLevelGuide.findIndex((item) => totalScore >= item.score && totalScore < item.next);
	useEffect(() => {
		if (showLevelModal && levelScrollRef.current) {
			setTimeout(() => {
				levelScrollRef.current?.scrollTo({
					y: currentLevelIndex * scaleHeight(150), // 카드 높이 예상값
					animated: true,
				});
			}, 100); // 모달이 나타난 후 살짝 delay
		}
	}, [showLevelModal]);

	/**
	 * 스크롤을 관리하는 Handler
	 */
	const scrollHandler = (() => {
		return {
			/**
			 * 스크롤 최상단으로 당기면 Refresh 기능
			 */
			onRefresh: () => {
				// TODO: 로직을 불러오는 부분을 추가해야함.
				setRefreshing(true);
			},

			/**
			 * 스크롤을 일정 높이 만큼 움직였을때 아이콘 등장 처리
			 * @param event
			 */
			onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
				const offsetY = event.nativeEvent.contentOffset.y;
				setShowScrollTop(offsetY > 100);
			},
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
				setTimeout(() => {
					scrollRef.current?.scrollToEnd({ animated: true });
				}, 100);
			},
		};
	})();

	const levelGuide = [
		{ score: 0, next: 600, label: '속담 초보자', icon: 'seedling' },
		{ score: 600, next: 1200, label: '속담 입문자', icon: 'leaf' },
		{ score: 1200, next: 1800, label: '여행 능력자', icon: 'tree' },
		{ score: 1800, next: 2461, label: '속담 마스터', icon: 'trophy' },
	];

	const getEncourageMessage = (score: number) => {
		if (score >= 1800) return '🌎 당신은 속담 마스터! 모두가 당신을 주목해요!';
		if (score >= 1200) return '🌍 이제 마스터까지 한 걸음! 계속 도전해요!';
		if (score >= 600) return '✈️ 더 넓은 세계가 당신을 기다리고 있어요!';
		return '🚀 지금부터 시작이에요! 차근차근 도전해봐요!';
	};
	const getTitleByScore = (score: number) => {
		const level = LEVEL_DATA.find((level) => score >= level.score && score < level.next) || LEVEL_DATA[0];
		return {
			label: level.label,
			icon: level.icon,
			mascot: level.mascot,
		};
	};
	const { label, icon, mascot } = getTitleByScore(totalScore);

	return (
		<>
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<ScrollView
					ref={scrollRef}
					style={styles.container}
					contentContainerStyle={{ paddingBottom: scaleHeight(40), flexGrow: 1 }}
					onScroll={scrollHandler.onScroll}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
					{/* <View style={styles.adContainer}>
						<AdmobBannerAd />
					</View> */}
					<View style={styles.sectionBox}>
						<View style={{ alignItems: 'center', marginVertical: scaleHeight(20) }}>
							<FastImage source={mascot} style={{ width: scaleWidth(120), height: scaleHeight(120) }} resizeMode={FastImage.resizeMode.contain} />
						</View>
						<View style={styles.levelCenteredRow}>
							<IconComponent type='fontAwesome6' name={icon} size={16} color='#27ae60' />

							<Text style={styles.levelTitle}>
								{label} <Text style={styles.levelScoreText}>({totalScore}점)</Text>
							</Text>

							<TouchableOpacity onPress={() => setShowLevelModal(true)}>
								<IconComponent
									type='materialIcons'
									name='info-outline'
									size={18}
									color='#7f8c8d'
									style={{ marginLeft: scaleWidth(4), marginTop: scaleHeight(1) }}
								/>
							</TouchableOpacity>
						</View>
						s{/* 👇 간단한 설명으로 변경 */}
						<Text style={styles.levelDescription}>
							모든 퀴즈를 풀면<Text style={{ fontWeight: 'bold' }}> 속담 마스터</Text> 등급을 획득할 수 있습니다.
						</Text>
						<Text style={styles.levelDescription}>
							틀린 퀴즈는 <Text style={{ fontWeight: 'bold' }}>오답 복습</Text>으로 다시 점수를 얻을 수 있습니다.
						</Text>
					</View>

					<Text style={[styles.sectionTitle, { marginTop: scaleHeight(20) }]}>📚 나의 학습 활동 </Text>
					<View style={styles.activityCardBox}>
						<View style={styles.summaryStatGrid}>
							<View style={styles.summaryStatCard}>
								<Text style={styles.statIcon}>🎯</Text>
								<Text style={styles.statValue}>
									{studyCountries.length} / {totalCountryCount}
								</Text>
								<Text style={styles.statLabel}>학습 완료 속담 ({Math.round((studyCountries.length / totalCountryCount) * 100)}%)</Text>
							</View>
							<View style={styles.summaryStatCard}>
								<Text style={styles.statIcon}>📆</Text>
								<Text style={styles.statValue}> {lastStudyAt ? moment(lastStudyAt).format('YY.MM.DD') : '없음'} </Text>
								<Text style={styles.statLabel}> 마지막 학습일 </Text>
							</View>
						</View>
					</View>

					{/* 나의 퀴즈 활동 요약 */}
					<Text style={[styles.sectionTitle, { marginTop: scaleHeight(20) }]}>📊 나의 퀴즈 활동 </Text>
					<View style={styles.activityCardBox}>
						<View style={styles.summaryStatCard}>
							<Text style={styles.statIcon}>🧮</Text>
							<Text style={styles.statValue}>
								{totalSolved} / {totalCountryCount}
							</Text>
							<Text style={styles.statLabel}> 총 푼 퀴즈 ({Math.round((totalSolved / totalCountryCount) * 100)}%) </Text>
							<View style={styles.progressBarBackground}>
								<View style={[styles.progressBarFill, { width: `${Math.round((totalSolved / totalCountryCount) * 100)}%` }]} />
							</View>
						</View>
						<View style={styles.summaryStatGrid}>
							<View style={styles.summaryStatCard}>
								<Text style={styles.statIcon}>🔥</Text>
								<Text style={styles.statValue}> {bestCombo} Combo </Text>
								<Text style={styles.statLabel}> 최고 콤보 </Text>
							</View>
							<View style={styles.summaryStatCard}>
								<Text style={styles.statIcon}>✅</Text>
								<Text style={styles.statValue}> {accuracy}% </Text>
								<Text style={styles.statLabel}> 정답률 </Text>
							</View>
							<View style={styles.summaryStatCard}>
								<Text style={styles.statIcon}>📅</Text>
								<Text style={styles.statValue}> {lastAnsweredAt ? moment(lastAnsweredAt).format('YY.MM.DD') : '없음'} </Text>
								<Text style={styles.statLabel}> 마지막 퀴즈일 </Text>
							</View>
						</View>

						{/* ✅ 정복한 카테고리 출력 */}
						<View style={styles.subSectionBox1}>
							<Text style={styles.sectionSubtitle}>
								🧠 정복한 카테고리 ({categoryMaster.length} / {allCategories.length})
							</Text>
							<Text style={styles.regionHelperText}>- 다양한 분야의 속담을 학습해보세요!</Text>
							<View style={styles.gridRowNoBottomGap}>
								{allCategories.map((category) => {
									const isEarned = categoryMaster.includes(category);
									const meta = CATEGORY_META[category];
									return (
										<View
											key={category}
											style={[
												styles.regionCard,
												isEarned && {
													backgroundColor: meta.color,
													borderColor: meta.color,
													shadowColor: '#000',
													shadowOpacity: 0.2,
													shadowRadius: 4,
													shadowOffset: { width: 0, height: 2 },
												},
											]}>
											<IconComponent type={meta.icon.type} name={meta.icon.name} size={22} color={isEarned ? '#fff' : '#bdc3c7'} style={{ marginBottom: 6 }} />
											<Text style={[styles.regionText, isEarned && { color: '#fff', fontWeight: 'bold' }]}>{category}</Text>
										</View>
									);
								})}
							</View>
						</View>
						<View style={styles.subSectionBox2}>
							<Text style={styles.sectionSubtitle}>
								🏅 정복한 레벨 ({levelMaster.length} / {DIFFICULTIES.length})
							</Text>
							<Text style={styles.levelHelperText}> - 각 레벨을 마스터하며 진정한 속담 퀴즈 고수가 되어보세요! </Text>
							<View style={{ alignItems: 'center' }}>
								<FlatList
									data={DIFFICULTIES}
									keyExtractor={(item) => item.key}
									numColumns={2}
									scrollEnabled={false}
									columnWrapperStyle={{ justifyContent: 'space-around' }}
									renderItem={({ item }) => {
										const isEarned = levelMaster.includes(item.title);
										const levelStyle = getLevelStyle(item.subtitle);
										return (
											<View
												style={[
													styles.levelCard,
													isEarned && {
														backgroundColor: levelStyle.bg,
														borderColor: levelStyle.border,
													},
												]}>
												<IconComponent name={item.icon} type='fontAwesome6' size={22} color={isEarned ? '#fff' : '#bdc3c7'} style={{ marginBottom: 4 }} />
												<Text style={[styles.levelText, isEarned && { color: '#fff', fontWeight: 'bold' }]}> {item.title} </Text>
												<Text style={[styles.levelSubText, isEarned && { color: '#fff' }]}> {item.subtitle} </Text>
											</View>
										);
									}}
								/>
							</View>
						</View>
					</View>

					{/* 1. 나의 뱃지 목록 (획득한 뱃지만 보여줌) */}
					<Text style={styles.sectionTitle}>🏅 획득한 뱃지 목록 </Text>
					<View style={styles.sectionBox}>
						{earnedBadgeIds.length === 0 ? (
							<Text style={styles.emptyText}> 획득한 뱃지가 없습니다.</Text>
						) : (
							earnedBadgeIds.map((badgeId) => {
								const badge = CONST_BADGES.find((b) => b.id === badgeId);
								if (!badge) return null;
								return (
									<View key={badge.id} style={[styles.badgeCard, styles.badgeCardActive]}>
										<View style={[styles.iconBox, styles.iconBoxActive]}>
											<IconComponent name={badge.icon} type={badge.iconType} size={20} color='#27ae60' />
										</View>
										<View style={styles.textBox}>
											<Text style={[styles.badgeTitle, styles.badgeTitleActive]}> {badge.name} </Text>
											<Text style={[styles.badgeDesc, styles.badgeDescActive]}> {badge.description} </Text>
										</View>
									</View>
								);
							})
						)}
					</View>

					{/* 2. 전체 중 미획득 뱃지만 아코디언에 출력 */}
					<TouchableOpacity onPress={toggleBadgeList} style={{ marginBottom: scaleHeight(12) }}>
						<Text style={{ color: '#27ae60', textAlign: 'center', fontSize: scaledSize(13) }}>{showBadgeList ? '뱃지 목록 닫기 ▲' : '획득 가능한 뱃지 보기 ▼'}</Text>
					</TouchableOpacity>

					{showBadgeList && (
						<View style={styles.sectionBox}>
							{CONST_BADGES.filter((badge) => !earnedBadgeIds.includes(badge.id)).length === 0 ? (
								<Text style={styles.emptyText}> 모든 뱃지를 획득했어요! 🎉</Text>
							) : (
								CONST_BADGES.filter((badge) => !earnedBadgeIds.includes(badge.id)).map((badge) => (
									<View key={badge.id} style={styles.badgeCard}>
										<View style={styles.iconBox}>
											<IconComponent name={badge.icon} type={badge.iconType} size={20} color='#2c3e50' />
										</View>
										<View style={styles.textBox}>
											<Text style={styles.badgeTitle}> {badge.name} </Text>
											<Text style={styles.badgeDesc}> {badge.description} </Text>
										</View>
									</View>
								))
							)}
						</View>
					)}
				</ScrollView>

				<Modal visible={showLevelModal} transparent animationType='fade'>
					<View style={styles.modalOverlay}>
						<View style={[styles.levelModal, { maxHeight: scaleHeight(600) }]}>
							<Text style={styles.levelModalTitle}>등급 안내</Text>

							<ScrollView
								ref={levelScrollRef}
								style={{ width: '100%' }}
								contentContainerStyle={{ paddingBottom: scaleHeight(12) }}
								showsVerticalScrollIndicator={false}>
								{[...LEVEL_DATA].reverse().map((item) => {
									const isCurrent = totalScore >= item.score && totalScore < item.next;
									const mascotImage = getTitleByScore(item.score).mascot;

									return (
										<View key={item.label} style={[styles.levelCardBox, isCurrent && styles.levelCardBoxActive]}>
											{isCurrent && (
												<View style={styles.levelBadge}>
													<Text style={styles.levelBadgeText}>🏆 현재 등급</Text>
												</View>
											)}
											<FastImage source={mascotImage} style={styles.levelMascot} resizeMode={FastImage.resizeMode.contain} />
											<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(6) }}>
												<IconComponent name={item.icon} type='fontAwesome6' size={16} color='#27ae60' />
												<Text style={[styles.levelLabel, { marginLeft: scaleWidth(6) }]}>{item.label}</Text>
											</View>
											<Text style={styles.levelScore}>{item.score}점 이상</Text>
											{isCurrent && <Text style={styles.levelEncourage}>{getEncourageMessage(item.score)}</Text>}
										</View>
									);
								})}
							</ScrollView>

							<TouchableOpacity onPress={() => setShowLevelModal(false)} style={styles.modalConfirmButton}>
								<Text style={styles.modalConfirmText}>닫기</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			</SafeAreaView>

			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity style={styles.scrollTopButton} onPress={scrollHandler.toTop}>
					<IconComponent type='fontawesome6' name='arrow-up' size={20} color='#ffffff' />
				</TouchableOpacity>
			)}
		</>
	);
};

export default CapitalResultScreen;

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#fff' },
	container: {
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
	},
	pageTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		marginBottom: scaleHeight(20),
		color: '#2c3e50',
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	badgeCardActive: {
		borderColor: '#27ae60',
		backgroundColor: '#f0fbf4',
	},
	iconBox: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(12),
	},
	iconBoxActive: {
		backgroundColor: '#d0f0dc',
	},
	badgeTitle: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
	},
	badgeTitleActive: {
		color: '#27ae60',
	},
	badgeDesc: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginTop: scaleHeight(2),
		lineHeight: scaleHeight(18),
	},
	badgeDescActive: {
		color: '#2d8659',
	},
	sectionBox: {
		backgroundColor: '#f9f9f9',
		padding: scaleWidth(16),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	subSectionBox1: {
		backgroundColor: '#ffffff',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	subSectionBox2: {
		backgroundColor: '#ffffff',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#ddd',
	},
	sectionTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginBottom: scaleHeight(12),
		color: '#2c3e50',
	},
	statItem: {
		fontSize: scaledSize(14),
		color: '#34495e',
		marginBottom: scaleHeight(6),
	},
	subTitle: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: scaleHeight(6),
	},
	tagItem: {
		fontSize: scaledSize(14),
		color: '#27ae60',
		marginBottom: scaleHeight(4),
	},
	emptyText: {
		fontSize: scaledSize(13),
		color: '#95a5a6',
	},
	textBox: { flex: 1 },
	levelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	levelTitle: {
		fontSize: scaledSize(16),
		marginLeft: scaleWidth(6),
		color: '#27ae60',
		fontWeight: '700',
	},
	quizSummaryBox: {
		backgroundColor: '#f4f6f7',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginTop: scaleHeight(8),
		marginBottom: scaleHeight(16),
	},
	levelIconWrap: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		borderRadius: scaleWidth(18),
		borderWidth: 2,
		borderColor: '#27ae60',
		backgroundColor: '#eafaf1',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: scaleWidth(8),
		shadowColor: '#27ae60',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.25,
		shadowRadius: 2,
	},
	levelModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
		paddingBottom: scaleHeight(12),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
	},
	levelModalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginBottom: scaleHeight(12),
		color: '#2c3e50',
	},
	levelRowItem: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		paddingVertical: scaleHeight(8),
		borderBottomWidth: 1,
		borderColor: '#eee',
	},
	levelRowItemActive: {
		backgroundColor: '#eafaf1',
		borderColor: '#27ae60',
	},
	levelCardBox: {
		backgroundColor: '#fdfdfd',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(16),
		alignItems: 'center',
		marginBottom: scaleHeight(14),
		width: '100%',
		borderWidth: 1,
		borderColor: '#ececec',
	},
	levelCardBoxActive: {
		backgroundColor: '#eafaf1',
		borderColor: '#2ecc71',
		borderWidth: 2,
	},
	levelBadge: {
		backgroundColor: '#27ae60',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(8),
	},
	levelBadgeText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: 'bold',
	},
	levelMascot: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		marginBottom: scaleHeight(10),
	},
	levelLabel: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(2),
	},
	levelScore: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},
	levelEncourage: {
		fontSize: scaledSize(12),
		color: '#27ae60',
		marginTop: scaleHeight(6),
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	levelIconWrapSmall: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(14),
		backgroundColor: '#d0f0dc',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(10),
	},
	levelModalText: {
		flex: 1,
		fontSize: scaledSize(14),
		color: '#2c3e50',
	},
	levelModalScore: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},
	levelNowText: {
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
		color: '#27ae60',
		fontWeight: 'bold',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalConfirmButton: {
		marginTop: scaleHeight(16),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		backgroundColor: '#27ae60',
		borderRadius: scaleWidth(8),
	},
	modalConfirmText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: scaledSize(14),
	},
	levelCenteredRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	levelDescription: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(18),
		marginBottom: scaleHeight(4),
	},
	levelScoreText: {
		fontSize: scaledSize(15),
		color: '#7f8c8d',
		textAlign: 'center',
		marginTop: scaleHeight(4),
	},
	levelScoreHighlight: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#27ae60',
		marginTop: scaleHeight(4),
	},
	activityCardBox: {
		backgroundColor: '#f4f6f7',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(24),
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
	activityRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	activityLabel: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
	},
	activityValue: {
		fontSize: scaledSize(14),
		fontWeight: 'bold',
		color: '#34495e',
	},
	summaryCard: {
		backgroundColor: '#fff8e1',
		padding: scaleWidth(16),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#f1c40f',
	},
	summaryTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#f39c12',
		marginBottom: scaleHeight(8),
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	progressText: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
		marginRight: scaleWidth(12),
	},
	progressBarBackground: {
		width: '80%',
		height: scaleHeight(6),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleHeight(3),
		marginTop: scaleHeight(6),
		alignSelf: 'center',
	},
	progressBarFill: {
		height: scaleHeight(6),
		backgroundColor: '#27ae60',
		borderRadius: scaleHeight(3),
	},
	gridRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginTop: scaleHeight(6),
	},
	regionCard: {
		width: '28%',
		height: scaleHeight(100),
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(6),
		paddingVertical: scaleHeight(8),
		backgroundColor: '#fff',
		marginBottom: scaleHeight(12),
		marginHorizontal: scaleWidth(5),
	},
	levelCard: {
		width: '40%',
		aspectRatio: 1,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: scaleWidth(12),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		marginHorizontal: scaleWidth(8),
		marginBottom: scaleHeight(12),
	},
	regionText: {
		fontSize: scaledSize(14),
		textAlign: 'center',
		color: '#7f8c8d',
	},
	levelText: {
		fontSize: scaledSize(15),
		textAlign: 'center',
		color: '#7f8c8d',
	},
	cardActive: {
		backgroundColor: '#f0fbf4',
	},
	summaryStatGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	summaryStatCard: {
		flex: 1,
		backgroundColor: '#ffffff',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(16),
		marginHorizontal: scaleWidth(4),
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ecf0f1',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		marginBottom: scaleHeight(12),
	},
	statIcon: {
		fontSize: scaledSize(22),
		marginBottom: scaleHeight(4),
	},
	statValue: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(4),
	},
	statLabel: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
	},
	regionSubText: {
		fontSize: scaledSize(10),
		color: '#b0b0b0',
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	levelSubText: {
		fontSize: scaledSize(12),
		color: '#b0b0b0',
		textAlign: 'center',
		marginTop: scaleHeight(1),
		lineHeight: scaleHeight(13),
		fontWeight: '400',
	},
	sectionSubtitle: {
		fontSize: scaledSize(15),
		color: '#2c3e50',
		marginBottom: scaleHeight(12),
		marginTop: scaleHeight(8),
		fontWeight: 'bold',
	},
	gridRowNoBottomGap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginTop: scaleHeight(12),
		paddingBottom: scaleHeight(6),
	},
	regionHelperText: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
		marginBottom: scaleHeight(10),
	},
	levelHelperText: {
		fontSize: scaledSize(12),
		color: '#7f8c8d',
		marginTop: scaleHeight(3),
		marginBottom: scaleHeight(15),
	},
	adContainer: {
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: scaleHeight(10),
		paddingVertical: scaleHeight(6),
	},
	regionCardActive: {
		backgroundColor: '#eafaf1',
		borderColor: '#27ae60',
	},
	regionTextActive: {
		color: '#27ae60',
		fontWeight: 'bold',
	},
	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(16),
		bottom: scaleHeight(16),
		backgroundColor: '#2196F3',
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		justifyContent: 'center',
		alignItems: 'center',
	},
});

