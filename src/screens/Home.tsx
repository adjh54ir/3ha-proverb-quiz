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

const STORAGE_KEY_QUIZ = 'UserQuizHistory';
const STORAGE_KEY_STUDY = 'UserStudyHistory';

const Home = () => {
	const navigation = useNavigation();
	const { height: screenHeight } = Dimensions.get('window');
	const scrollRef = useRef<NodeJS.Timeout | null>(null);

	const [greeting, setGreeting] = useState('🖐️ 안녕! 오늘도 속담 퀴즈 풀 준비 됐니?');
	const [totalScore, setTotalScore] = useState(0);
	const [showConfetti, setShowConfetti] = useState(false);
	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
	const [showGuideModal, setShowGuideModal] = useState(false);
	const [showBadgeModal, setShowBadgeModal] = useState(false);
	const [selectedBadge, setSelectedBadge] = useState<(typeof CONST_BADGES)[number] | null>(null);

	const greetingMessages = [
		'🎯 반가워! 오늘도 똑똑해질 시간이야!',
		'🧠 오늘도 새로운 수도를 알아보자!',
		'📚 기억력 자신 있지? 퀴즈 시작해볼까?',
		'✨ 하루 한 퀴즈! 똑똑해지는 비결이야!',
	];

	const LEVEL_DATA = [
		{
			score: 0,
			next: 600,
			label: '여행 초보자',
			icon: 'seedling',
			mascot: '',
		},
		{ score: 600, next: 1200, label: '여행 입문자', icon: 'leaf', mascot: '' },
		{
			score: 1200,
			next: 1800,
			label: '여행 전문가',
			icon: 'tree',
			mascot: '',
		},
		{
			score: 1800,
			next: 2461,
			label: '월드마스터',
			icon: 'trophy',
			mascot: '',
		},
	];

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity onPress={() => setShowGuideModal(true)} style={{ marginRight: 16 }}>
					<IconComponent type='materialIcons' name='info-outline' size={24} color='#3498db' />
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, []),
	);

	const loadData = async () => {
		const quizData = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);
		const studyData = await AsyncStorage.getItem(STORAGE_KEY_STUDY);

		let realScore = 0;
		if (quizData) realScore = JSON.parse(quizData).totalScore || 0;

		setTotalScore(realScore);
		const quizBadges = quizData ? JSON.parse(quizData).badges || [] : [];
		const studyBadges = studyData ? JSON.parse(studyData).badges || [] : [];
		setEarnedBadgeIds([...new Set([...quizBadges, ...studyBadges])]);
	};

	const levelData = useMemo(
		() => LEVEL_DATA.find((l) => totalScore >= l.score && totalScore < l.next) || LEVEL_DATA[0],
		[totalScore],
	);

	const handleMascotPress = () => {
		const random = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
		setGreeting(random);
		setShowConfetti(false);
		requestAnimationFrame(() => setShowConfetti(true));
		if (scrollRef.current) clearTimeout(scrollRef.current);
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
				{/* @ts-ignore */}

				<IconComponent name={iconName} type={iconType} size={24} color='#fff' />
			</View>
			<View style={styles.cardTextBox}>
				<Text style={styles.cardTitle}>{label}</Text>
				<Text style={styles.cardDescription}>{description}</Text>
			</View>
		</TouchableOpacity>
	);

	return (
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
								<FastImage source={require('../assets/images/main_mascote.png')} style={styles.image} resizeMode='contain' />
							</TouchableOpacity>
						</View>

						<ActionCard
							iconName='play-arrow'
							iconType='materialIcons'
							label='시작하기'
							description='전체, 대륙, 난이도별 퀴즈 모드를 선택해 퀴즈를 풀어봐요'
							color='#3498db'
							onPress={moveToHandler.quiz}
						/>
						<ActionCard
							iconName='school'
							iconType='materialIcons'
							label='학습 모드'
							description='카드 형식으로 국가별 수도 정보를 재미있게 익혀봐요'
							color='#2ecc71'
							onPress={moveToHandler.study}
						/>
						<ActionCard
							iconName='replay'
							iconType='materialIcons'
							label='오답 복습'
							description='틀린 퀴즈를 다시 풀면서 기억을 더 확실히 다져봐요'
							color='#f1c40f'
							onPress={moveToHandler.wrongReview}
						/>

						<TouchableOpacity style={styles.curiousButton} onPress={() => setShowBadgeModal(true)}>
							<IconComponent type='materialIcons' name='emoji-events' size={18} color='#2ecc71' />
							<Text style={styles.curiousButtonText}>숨겨진 뱃지들을 찾아보세요!</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	);
};

const styles = StyleSheet.create({
	wrapper: { flex: 1, backgroundColor: '#fff' },
	scrollContainer: { paddingBottom: 40 },
	container: {
		flexGrow: 1,
		paddingHorizontal: 16, // ✅ 기존 12 → 16 (적당한 여백 확보)
		paddingVertical: 24, // ✅ 기존 20 → 24 (위아래 여백도 약간 늘림)
	},
	imageContainer: { alignItems: 'center', marginBottom: 20 },
	image: { width: 150, height: 150 },
	speechWrapper: { alignItems: 'center', marginBottom: 8 },
	speechBubble: {
		backgroundColor: '#fef9e7',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 20,
		maxWidth: '85%', // ✅ 기존 90% → 85%, 더 자연스럽게 말풍선 위치됨
		shadowColor: '#000',
		shadowOpacity: 0.07,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
		elevation: 4,
	},
	speechTail: {
		width: 0,
		height: 0,
		borderLeftWidth: 10,
		borderRightWidth: 10,
		borderTopWidth: 10,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#fef9e7',
		alignSelf: 'center',
	},
	speechText: {
		fontSize: 15,
		color: '#2c3e50',
		textAlign: 'center',
		fontWeight: '600',
		lineHeight: 22,
	},
	levelContainer: { alignItems: 'center', marginBottom: 16 },
	levelBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
	levelText: { fontSize: 14, color: '#27ae60', fontWeight: '600', marginLeft: 6 },
	badgeScrollWrapper: { height: 70, width: '100%', marginTop: 8 },
	iconBoxActive: {
		width: 36, // 기존 40보다 살짝 축소
		height: 36,
		marginHorizontal: 2,
		borderRadius: 18,
		backgroundColor: '#d0f0dc',
		justifyContent: 'center',
		alignItems: 'center',
	},
	toggleBadgeText: {
		color: '#27ae60',
		fontSize: 13,
		marginTop: 4,
		textAlign: 'center',
	},
	greetingText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
	},
	actionButton: {
		width: 260,
		paddingVertical: 14,
		borderRadius: 10,
		marginVertical: 8,
		alignSelf: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
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
		marginTop: 30,
		alignSelf: 'center',
		backgroundColor: '#95a5a6',
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderRadius: 8,
		opacity: 0.9,
	},
	helpButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '500',
		marginLeft: 6,
	},
	helpIcon: {
		marginRight: 4,
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
		padding: 20,
		borderRadius: 12,
		elevation: 5,
		alignItems: 'center',
	},
	modalCloseButton: {
		backgroundColor: '#3498db',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginTop: 20, // ✅ 간격 추가
	},
	modalCloseText: {
		color: '#fff',
		fontWeight: '600',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 14,
		textAlign: 'center',
	},
	modalText: {
		fontSize: 14,
		color: '#34495e',
		lineHeight: 22,
		textAlign: 'left',
		marginTop: 10,
		marginBottom: 20,
	},
	boldText: {
		fontWeight: 'bold',
	},
	badgeModalContent: {
		width: '90%',
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 12,
		elevation: 5,
		alignItems: 'center',
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f4f6f8',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
		elevation: 2,
		width: '100%',
	},
	iconBox: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	textBox: {
		flex: 1,
	},
	badgeTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#34495e',
	},
	badgeDesc: {
		fontSize: 13,
		color: '#7f8c8d',
		marginTop: 4,
	},
	pageTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 16,
		textAlign: 'center',
	},
	curiousButton: {
		marginTop: 24,
		alignSelf: 'center', // ✅ 중앙 정렬
		paddingHorizontal: 14, // ✅ 텍스트 좌우 여백만 제공
		paddingVertical: 10,
		borderRadius: 30,
		borderWidth: 1,
		borderColor: '#2ecc71',
		backgroundColor: '#ffffff',
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 3,
		elevation: 3,
	},
	curiousButtonText: {
		color: '#2ecc71',
		fontWeight: '600',
		fontSize: 14,
		marginLeft: 8,
		textAlign: 'center',
	},
	actionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 16,
		marginHorizontal: 0, // ✅ 카드가 container의 패딩 내에서만 정렬되도록 설정
		marginBottom: 16, // ✅ 카드 사이 간격 조금 더 띄움
		padding: 14, // ✅ 내용물과 테두리 간 간격 약간 늘림
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		alignSelf: 'center', // ✅ 중앙 정렬
		width: '88%', // ✅ 적당한 폭 설정 (예: 92% 또는 90%)
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
		elevation: 3,
	},
	iconCircle: {
		width: 52,
		height: 52,
		borderRadius: 26,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '700', // ✅ 강조
		color: '#2c3e50',
	},
	cardDescription: {
		fontSize: 13,
		color: '#7f8c8d',
		marginTop: 4,
		lineHeight: 18,
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
		fontSize: 14,
		fontWeight: '600',
		color: '#27ae60',
		marginBottom: 12,
		textAlign: 'center',
	},
	confettiWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: 150,
		height: 280, // ✅ 캐릭터 + 뱃지 리스트까지 덮도록 확장
		zIndex: 10,
	},
	tooltipBox: {
		marginTop: 6,
		backgroundColor: '#2c3e50',
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 8,
		maxWidth: 180,
		zIndex: 10,
		elevation: 4,
	},
	tooltipText: {
		color: '#fff',
		fontSize: 12,
		textAlign: 'center',
		lineHeight: 18,
	},
	badgeDetailModal: {
		backgroundColor: '#fff',
		padding: 24,
		borderRadius: 16,
		width: '85%',
		alignItems: 'center',
		elevation: 5,
		position: 'relative',
	},

	badgeIconWrapper: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#eafaf1',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},

	badgeDetailTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 8,
		textAlign: 'center',
	},

	badgeDetailDescription: {
		fontSize: 14,
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: 22,
	},

	modalCloseIcon: {
		position: 'absolute',
		top: 10,
		right: 10,
		zIndex: 2,
		padding: 5,
	},
	modalConfirmButton: {
		backgroundColor: '#27ae60',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginTop: 20,
		alignSelf: 'center',
	},
	modalConfirmText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: 14,
		textAlign: 'center',
	},
});

export default Home;
