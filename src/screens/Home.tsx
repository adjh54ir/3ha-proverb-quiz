/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Modal,
	Dimensions,
	Keyboard,
	TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';
import { Paths } from '@/navigation/conf/Paths';
import IconComponent from './common/atomic/IconComponent';
import { CONST_BADGES } from '@/const/ConstBadges';

import ConfettiCannon from 'react-native-confetti-cannon';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import CatService from '@/services/CatService';
const STORAGE_KEY_QUIZ = 'UserQuizHistory';
const STORAGE_KEY_STUDY = 'UserStudyHistory';

const Home = () => {
	const navigation = useNavigation();
	const scrollRef = useRef<NodeJS.Timeout | null>(null);
	const levelScrollRef = useRef<ScrollView>(null);

	const [greeting, setGreeting] = useState('🖐️ 안녕! 오늘도 속담 퀴즈 풀 준비 됐니?');
	const [totalScore, setTotalScore] = useState(0);
	const [showConfetti, setShowConfetti] = useState(false);
	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
	const [showGuideModal, setShowGuideModal] = useState(false);
	const [showBadgeModal, setShowBadgeModal] = useState(false);
	const [selectedBadge, setSelectedBadge] = useState<(typeof CONST_BADGES)[number] | null>(null);

	const earnedBadges = CONST_BADGES.filter((b) => earnedBadgeIds.includes(b.id));
	const visibleBadges = earnedBadges; // 제한 없이 모두 보여줌
	const [tooltipBadgeId, setTooltipBadgeId] = useState<string | null>(null);
	const [showLevelModal, setShowLevelModal] = useState(false);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity onPress={() => setShowGuideModal(true)} style={{ marginRight: 16 }}>
					<IconComponent type="materialIcons" name="info-outline" size={24} color="#3498db" />
				</TouchableOpacity>
			),
		});
	}, [navigation]);
	const greetingMessages = [
		'🎯 반가워! 오늘도 똑똑해질 준비됐나요?',
		'🧠 오늘의 속담으로 지혜를 키워봐요!',
		'📚 기억력 자신 있죠? 속담 퀴즈에 도전!',
		'📝 속담 하나, 교훈 하나! 함께 배워봐요!',
		'✨ 속담으로 생각을 키워보는 시간이에요!',
		'💡 옛말 속 지혜, 오늘도 한마디 배워볼까요?',
		'👀 퀴즈로 속담을 익히면 재미가 두 배!',
		'🔍 뜻을 알면 더 재밌는 속담! 지금 풀어보세요!',
		'🧩 맞히는 재미, 배우는 즐거움! 속담 퀴즈 GO!',
		'🐣 하루 한 속담! 작지만 큰 지혜가 자라나요!',
	];

	const LEVEL_DATA = [
		{
			score: 0,
			next: 600,
			label: '속담 초보자',
			icon: 'seedling',
			mascot: '',
		},
		{ score: 600, next: 1200, label: '속담 입문자', icon: 'leaf', mascot: '' },
		{
			score: 1200,
			next: 1800,
			label: '속담 숙련자',
			icon: 'tree',
			mascot: '',
		},
		{
			score: 1800,
			next: 2461,
			label: '속담 마스터',
			icon: 'trophy',
			mascot: '',
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

	const getLevelData = (score: number) => {
		return LEVEL_DATA.find((l) => score >= l.score && score < l.next) || LEVEL_DATA[0];
	};
	// 이걸 기존 getLevelData 아래에 추가해
	const levelData = useMemo(() => getLevelData(totalScore), [totalScore]);

	const { label, icon, mascot } = levelData;

	useFocusEffect(
		useCallback(() => {
			loadData();

			// 💥 빵빠레 자동 실행
			setShowConfetti(true);
			scrollRef.current = setTimeout(() => setShowConfetti(false), 3000);

			return () => {
				if (scrollRef.current) {
					clearTimeout(scrollRef.current);
				}
			};
		}, []),
	);
	useEffect(() => {
		setShowConfetti(true);

		// 일정 시간 후 자동 종료
		const timeout = setTimeout(() => {
			setShowConfetti(false);
		}, 3000);

		// 정리
		return () => clearTimeout(timeout);
	}, []);

	// getTitleByScore 함수 추가
	const getTitleByScore = (score: number) => {
		if (score >= 1800) {
			return {
				label: '속담 마스터',
				icon: 'trophy',
				mascot: require('@/assets/images/level4_mascote.png'),
			};
		}
		if (score >= 1200) {
			return {
				label: '속담 능력자',
				icon: 'tree',
				mascot: require('@/assets/images/level3_mascote.png'),
			};
		}
		if (score >= 600) {
			return {
				label: '속담 입문자',
				icon: 'leaf',
				mascot: require('@/assets/images/level2_mascote.png'),
			};
		}
		return {
			label: '속담 초보자',
			icon: 'seedling',
			mascot: require('@/assets/images/level1_mascote.png'),
		};
	};

	const getEncourageMessage = (score: number) => {
		if (score >= 1800) {
			return '📚 속담 마스터에 도달했어요! 대단해요!';
		}
		if (score >= 1200) {
			return '💡 능력자까지 왔어요! 이제 마스터도 금방이에요!';
		}
		if (score >= 600) {
			return '✏️ 입문자로서 아주 좋은 출발이에요!';
		}
		return '🚶‍♂️ 이제 막 시작했어요! 하나씩 배워나가봐요!';
	};

	const loadData = async () => {
		const quizData = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);
		const studyData = await AsyncStorage.getItem(STORAGE_KEY_STUDY);

		let realScore = 0;
		if (quizData) {
			realScore = JSON.parse(quizData).totalScore || 0;
		}

		setTotalScore(realScore);
		const quizBadges = quizData ? JSON.parse(quizData).badges || [] : [];
		const studyBadges = studyData ? JSON.parse(studyData).badges || [] : [];
		setEarnedBadgeIds([...new Set([...quizBadges, ...studyBadges])]);
	};

	const handleMascotPress = () => {
		const random = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
		setGreeting(random);
		setShowConfetti(false);
		requestAnimationFrame(() => setShowConfetti(true));
		if (scrollRef.current) {
			clearTimeout(scrollRef.current);
		}
		scrollRef.current = setTimeout(() => setShowConfetti(false), 3000);
	};

	const moveToHandler = {
		//@ts-ignore
		quiz: () => navigation.navigate(Paths.PROVERB_QUIZ_MODE_SELECT),
		//@ts-ignore
		study: () => navigation.navigate(Paths.PROVERB_STUDY),
		//@ts-ignore
		wrongReview: () => navigation.navigate(Paths.QUIZ_WRONG_REVIEW),
	};
	const ActionCard = ({
		iconName,
		iconType,
		label,
		description,
		color,
		onPress,
	}: {
		iconName: string;
		iconType: string;
		label: string;
		description: string;
		color: string;
		onPress: () => void;
	}) => (
		<TouchableOpacity style={[styles.actionCard, { borderColor: color }]} onPress={onPress}>
			<View style={[styles.iconCircle, { backgroundColor: color }]}>
				<IconComponent name={iconName} type={iconType} size={24} color="#fff" />
			</View>
			<View style={styles.cardTextBox}>
				<Text style={styles.cardTitle}>{label}</Text>
				<Text style={styles.cardDescription}>{description}</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			{showConfetti && (
				<View style={styles.globalConfettiWrapper}>
					<ConfettiCannon count={60} origin={{ x: scaleWidth(180), y: 0 }} fadeOut explosionSpeed={500} fallSpeed={2500} />
				</View>
			)}
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
					<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
						<View style={styles.container}>
							<View style={styles.imageContainer}>
								<View style={styles.speechWrapper}>
									<View style={styles.speechBubble}>
										<Text style={styles.speechText}>{greeting}</Text>
									</View>
									<View style={styles.speechTail} />
								</View>

								<TouchableOpacity onPress={handleMascotPress}>
									<View style={styles.mascoteView}>
										<FastImage
											key={totalScore} // totalScore가 바뀌면 이미지 강제 갱신
											source={
												totalScore >= 1800
													? require('@/assets/images/level4_mascote.png')
													: totalScore >= 1200
														? require('@/assets/images/level3_mascote.png')
														: totalScore >= 600
															? require('@/assets/images/level2_mascote.png')
															: require('@/assets/images/level1_mascote.png')
											}
											style={styles.image}
											resizeMode="contain"
										/>
									</View>
								</TouchableOpacity>
							</View>
							<View style={styles.iconView}>
								<View style={styles.iconViewInner}>
									<IconComponent type="fontAwesome6" name={icon} size={15} color="#27ae60" />
									<Text style={styles.myScoreLabel}>{label}</Text>
									<TouchableOpacity onPress={() => setShowLevelModal(true)}>
										<IconComponent
											type="materialIcons"
											name="info-outline"
											size={20}
											color="#7f8c8d"
											style={{ marginLeft: scaleWidth(4), marginTop: scaleHeight(1) }}
										/>
									</TouchableOpacity>
								</View>

								{earnedBadges.length > 0 && (
									<View style={styles.badgeView}>
										<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: scaleWidth(10) }}>
											{visibleBadges.map((item) => (
												<View key={item.id} style={styles.badgeViewInner}>
													<TouchableOpacity
														style={styles.iconBoxActive}
														onPress={() => setSelectedBadge(item)} // ✅ 툴팁 관리 필요없음
													>
														<IconComponent name={item.icon} type={item.iconType} size={20} color="#27ae60" />
													</TouchableOpacity>

													{tooltipBadgeId === item.id && (
														<View style={styles.tooltipBox}>
															<Text style={styles.tooltipText}>{item.description}</Text>
														</View>
													)}
												</View>
											))}
										</ScrollView>
									</View>
								)}
							</View>
						</View>

						<ActionCard
							iconName="play-arrow"
							iconType="materialIcons"
							label="시작하기"
							description="속담 뜻, 속담 찾기, 빈칸 채우기 퀴즈를 선택해서 퀴즈를 풀어봐요"
							color="#3498db"
							onPress={moveToHandler.quiz}
						/>
						<ActionCard
							iconName="school"
							iconType="materialIcons"
							label="학습 모드"
							description="카드 형식으로 속담과 속담의 의미를 재미있게 익혀봐요"
							color="#2ecc71"
							onPress={moveToHandler.study}
						/>
						<ActionCard
							iconName="replay"
							iconType="materialIcons"
							label="오답 복습"
							description="틀린 퀴즈를 다시 풀면서 기억을 더 확실히 다져봐요"
							color="#f1c40f"
							onPress={moveToHandler.wrongReview}
						/>

						<TouchableOpacity style={styles.curiousButton} onPress={() => setShowBadgeModal(true)}>
							<IconComponent type="materialIcons" name="emoji-events" size={18} color="#2ecc71" />
							<Text style={styles.curiousButtonText}>숨겨진 뱃지들을 찾아보세요!</Text>
						</TouchableOpacity>
					</ScrollView>
				</KeyboardAvoidingView>
			</TouchableWithoutFeedback>

			{/* 설명 모달 */}
			<Modal transparent visible={showGuideModal} animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowGuideModal(false)}>
							<IconComponent type="materialIcons" name="close" size={24} color="#555" />
						</TouchableOpacity>
						<Text style={styles.modalText}>
							<Text style={styles.boldText}>🏠 홈 화면{'\n'}</Text>- 주요 기능으로 빠르게 이동할 수 있는 메뉴를 제공합니다.
							{'\n\n'}
							<Text style={styles.boldText}>➡️ 시작하기{'\n'}</Text>- 속담 뜻 맞히기, 속담 찾기, 빈칸 채우기 퀴즈를 통해 재미있게 속담을 학습할 수 있어요.
							{'\n\n'}
							<Text style={styles.boldText}>➡️ 학습 모드{'\n'}</Text>- 카드 형식으로 속담과 그 의미, 예문 등을 쉽게 학습할 수 있어요.
							{'\n\n'}
							<Text style={styles.boldText}>➡️ 오답 복습{'\n'}</Text>- 이전에 틀렸던 문제들을 다시 풀어보며 확실하게 기억할 수 있어요.
							{'\n\n'}
							<Text style={styles.boldText}>🏅 숨겨진 뱃지들을 찾아보세요!{'\n'}</Text>- 학습이나 퀴즈 도중 특정 조건을 만족하면 다양한 뱃지를 획득할 수
							있어요.{'\n'}- 모은 뱃지는 홈 화면에서 확인할 수 있어요!
						</Text>
						<TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowGuideModal(false)}>
							<Text style={styles.modalCloseText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			<Modal visible={!!selectedBadge} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.badgeDetailModal}>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedBadge(null)}>
							<IconComponent type="materialIcons" name="close" size={24} color="#555" />
						</TouchableOpacity>

						{selectedBadge && (
							<>
								<View style={styles.badgeIconWrapper}>
									<IconComponent name={selectedBadge.icon} type={selectedBadge.iconType} size={48} color="#27ae60" />
								</View>

								<Text style={styles.badgeDetailTitle}>{selectedBadge.name}</Text>
								<Text style={styles.badgeDetailDescription}>{selectedBadge.description}</Text>

								<TouchableOpacity onPress={() => setSelectedBadge(null)} style={styles.modalConfirmButton}>
									<Text style={styles.modalConfirmText}>닫기</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>
			</Modal>

			{/* 획득 가능한 뱃지 모달 */}
			<Modal transparent visible={showBadgeModal} animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.badgeModalContent}>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowBadgeModal(false)}>
							<IconComponent type="materialIcons" name="close" size={24} color="#555" />
						</TouchableOpacity>

						<Text style={styles.pageTitle}>획득 가능한 뱃지</Text>
						<Text style={styles.badgeProgressText}>
							총 {CONST_BADGES.length}개 뱃지 중 <Text style={{ fontWeight: 'bold', color: '#27ae60' }}>{earnedBadgeIds.length}개를 획득했어요!</Text>
						</Text>

						<ScrollView contentContainerStyle={{ padding: 10 }} style={styles.badgeScrollView}>
							{CONST_BADGES.map((badge) => {
								const isEarned = earnedBadgeIds.includes(badge.id);
								return (
									<View
										key={badge.id}
										style={[
											styles.badgeCard,
											isEarned && styles.badgeCardActive, // ✅ 활성화된 스타일 적용
										]}>
										<View
											style={[
												styles.iconBox,
												isEarned && styles.badgeCardActive, // 아이콘 박스도 강조
											]}>
											<IconComponent
												name={badge.icon}
												type={badge.iconType}
												size={20}
												color={isEarned ? '#27ae60' : '#2c3e50'} // ✅ 색상 강조
											/>
										</View>
										<View style={styles.textBox}>
											<Text
												style={[
													styles.badgeTitle,
													isEarned && styles.badgeTitleActive, // 텍스트 강조
												]}>
												{badge.name}
											</Text>
											<Text
												style={[
													styles.badgeDesc,
													isEarned && styles.badgeDescActive, // 설명 강조
												]}>
												획득조건: {badge.description}
											</Text>
										</View>
									</View>
								);
							})}
						</ScrollView>

						<TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBadgeModal(false)}>
							<Text style={styles.modalCloseText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			<Modal visible={showLevelModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={[styles.levelModal]}>
						<Text style={styles.levelModalTitle}>등급 안내</Text>

						<ScrollView ref={levelScrollRef} style={{ width: '100%' }} contentContainerStyle={styles.gradeScrollView} showsVerticalScrollIndicator={false}>
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

										{/* 아이콘 추가 위치 */}
										<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(8) }}>
											<IconComponent name={item.icon} type="fontAwesome6" size={16} color="#27ae60" />
											<Text style={[styles.levelLabel]}>{item.label}</Text>
										</View>

										<FastImage source={mascotImage} style={styles.levelMascot} resizeMode={FastImage.resizeMode.contain} />
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
	);
};

const styles = StyleSheet.create({
	wrapper: { flex: 1, backgroundColor: '#fff' },
	scrollContainer: { paddingBottom: scaleHeight(40) },
	container: {
		flexGrow: 1,
		paddingHorizontal: scaleWidth(16),
		paddingVertical: scaleHeight(12), // ← 이 부분을 줄이거나 0으로
	},
	imageContainer: { alignItems: 'center', marginBottom: scaleHeight(8) },
	image: {
		width: scaleWidth(150),
		height: scaleWidth(150),
	},
	speechWrapper: { alignItems: 'center', marginBottom: scaleHeight(-20) },
	speechBubble: {
		backgroundColor: '#fef9e7',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(20),
		maxWidth: '95%',
		shadowColor: '#000',
		shadowOpacity: 0.07,
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowRadius: scaleWidth(3),
	},
	speechTail: {
		width: 0,
		height: 0,
		borderLeftWidth: scaleWidth(10),
		borderRightWidth: scaleWidth(10),
		borderTopWidth: scaleHeight(10),
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#fef9e7',
		alignSelf: 'center',
	},
	speechText: {
		fontSize: scaledSize(13),
		color: '#2c3e50',
		textAlign: 'center',
		fontWeight: '600',
		lineHeight: scaleHeight(22),
	},
	levelContainer: { alignItems: 'center', marginBottom: scaleHeight(16) },
	levelText: {
		fontSize: scaledSize(14),
		color: '#27ae60',
		fontWeight: '600',
		marginLeft: scaleWidth(6),
	},
	badgeScrollWrapper: {
		height: scaleHeight(70),
		width: '100%',
		marginTop: scaleHeight(8),
	},
	iconBoxActive: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		marginHorizontal: scaleWidth(2),
		borderRadius: scaleWidth(18),
		backgroundColor: '#d0f0dc',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#27ae60',
	},
	toggleBadgeText: {
		color: '#27ae60',
		fontSize: scaledSize(13),
		marginTop: scaleHeight(4),
		textAlign: 'center',
	},
	greetingText: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
	},
	actionButton: {
		width: scaleWidth(260),
		paddingVertical: scaleHeight(14),
		borderRadius: scaleWidth(10),
		marginVertical: scaleHeight(8),
		alignSelf: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: 'bold',
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	helpButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: scaleHeight(30),
		alignSelf: 'center',
		backgroundColor: '#95a5a6',
		paddingHorizontal: scaleWidth(18),
		paddingVertical: scaleHeight(10),
		borderRadius: scaleWidth(8),
		opacity: 0.9,
	},
	helpButtonText: {
		color: '#fff',
		fontSize: scaledSize(14),
		fontWeight: '500',
		marginLeft: scaleWidth(6),
	},
	helpIcon: {
		marginRight: scaleWidth(4),
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '85%',
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
	},
	modalCloseButton: {
		backgroundColor: '#3498db',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(8),
		marginTop: scaleHeight(20),
	},
	modalCloseText: {
		color: '#fff',
		fontWeight: '600',
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
	boldText: {
		fontWeight: 'bold',
	},
	badgeModalContent: {
		width: '90%',
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f4f6f8',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(12),
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowRadius: scaleWidth(2),
		width: '100%',
	},
	iconBox: {
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: scaleWidth(20),
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(16),
	},
	textBox: {
		flex: 1,
	},
	badgeTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#34495e',
	},
	badgeDesc: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginTop: scaleHeight(4),
	},
	pageTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(16),
		textAlign: 'center',
	},
	curiousButton: {
		marginTop: scaleHeight(24),
		alignSelf: 'center',
		paddingHorizontal: scaleWidth(14),
		paddingVertical: scaleHeight(10),
		borderRadius: scaleWidth(30),
		borderWidth: 1,
		borderColor: '#2ecc71',
		backgroundColor: '#ffffff',
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowRadius: scaleWidth(3),
	},
	curiousButtonText: {
		color: '#2ecc71',
		fontWeight: '600',
		fontSize: scaledSize(14),
		marginLeft: scaleWidth(8),
		textAlign: 'center',
	},
	actionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(16),
		marginHorizontal: 0,
		marginBottom: scaleHeight(16),
		padding: scaleWidth(14),
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		alignSelf: 'center',
		width: '88%',
		shadowOffset: { width: 0, height: scaleHeight(1) },
		shadowRadius: scaleWidth(2),
	},
	iconCircle: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(26),
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(16),
	},
	cardTitle: {
		fontSize: scaledSize(16),
		fontWeight: '700',
		color: '#2c3e50',
	},
	cardDescription: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginTop: scaleHeight(4),
		lineHeight: scaleHeight(18),
	},
	cardTextBox: {
		flex: 1,
	},
	badgeCardActive: {
		backgroundColor: '#e8f5e9',
		borderColor: '#2ecc71',
		borderWidth: 1.2,
	},
	badgeTitleActive: {
		color: '#27ae60',
	},
	badgeDescActive: {
		color: '#2d8659',
	},
	badgeProgressText: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#27ae60',
		marginBottom: scaleHeight(12),
		textAlign: 'center',
	},
	confettiWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: scaleWidth(150),
		height: scaleHeight(280),
		zIndex: 10,
	},
	tooltipBox: {
		marginTop: scaleHeight(6),
		backgroundColor: '#2c3e50',
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(10),
		borderRadius: scaleWidth(8),
		maxWidth: scaleWidth(180),
		zIndex: 10,
	},
	tooltipText: {
		color: '#fff',
		fontSize: scaledSize(12),
		textAlign: 'center',
		lineHeight: scaleHeight(18),
	},
	badgeDetailModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
		position: 'relative',
	},
	badgeIconWrapper: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		borderRadius: scaleWidth(40),
		backgroundColor: '#eafaf1',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	badgeDetailTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},
	badgeDetailDescription: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(10),
		right: scaleWidth(10),
		zIndex: 2,
		padding: scaleWidth(5),
	},
	modalConfirmButton: {
		backgroundColor: '#27ae60',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(8),
		marginTop: scaleHeight(20),
		alignSelf: 'center',
	},
	modalConfirmText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: scaledSize(14),
		textAlign: 'center',
	},
	levelModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
		paddingBottom: scaleHeight(12),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
		maxHeight: scaleHeight(600),
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
		marginLeft: scaleWidth(6),
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
	main: { flex: 1, backgroundColor: '#fff' },
	mascoteView: {
		width: scaleWidth(180),
		height: scaleWidth(180),
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconView: {
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	iconViewInner: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	myScoreLabel: {
		fontSize: scaledSize(17),
		color: '#27ae60',
		fontWeight: '700',
		marginLeft: scaleWidth(6),
	},
	badgeView: { width: '100%', marginTop: scaleHeight(10) },
	badgeViewInner: {
		marginRight: scaleWidth(12),
		alignItems: 'center',
	},
	badgeScrollView: {
		maxHeight: scaleHeight(400),
		width: '100%',
	},
	gradeScrollView: {
		paddingBottom: scaleHeight(12),
	},
	globalConfettiWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 999,
		pointerEvents: 'none',
	},
});

export default Home;
