import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IconComponent from '../common/atomic/IconComponent';
import { Paths } from '@/navigation/conf/Paths';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';

const ProverbQuizModeSelectScreen = () => {
	const [showGuideModal, setShowGuideModal] = useState(false);
	const navigation = useNavigation();

	const MODES = [
		{
			key: 'meaning',
			label: '속담 뜻 퀴즈',
			icon: 'lightbulb',
			type: 'fontAwesome6',
			color: '#5DADE2',
		},
		{
			key: 'proverb',
			label: '속담 찾기 퀴즈',
			icon: 'quote-left',
			type: 'fontAwesome6',
			color: '#58D68D',
		},
		{
			key: 'blank',
			label: '빈칸 채우기 퀴즈',
			icon: 'pen',
			type: 'fontAwesome6',
			color: '#F5B041',
		},
		{
			key: 'comingsoon', // 오타(commingsoon) 수정
			label: '새로운 퀴즈\nComing Soon...',
			icon: 'hourglass-half',
			type: 'fontAwesome6',
			color: '#dfe6e9',
		},
	];

	const moveToHandler = (modeKey: string) => {
		switch (modeKey) {
			case 'meaning':
				// @ts-ignore
				navigation.push(Paths.PROVERB_MEANING_QUIZ, { mode: 'meaning' });
				break;
			case 'proverb':
				// @ts-ignore
				navigation.push(Paths.PROVERB_FIND_QUIZ, { mode: 'proverb' });
				break;
			case 'blank':
				// @ts-ignore
				navigation.push(Paths.PROVERB_BLANK_QUIZ, { mode: 'fill-blank' });
				break;
			default:
				break;
		}
	};

	return (
		<>
			<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
				<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
					<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
						<View style={styles.titleRow}>
							<Text style={styles.title}>🧠오늘은 어떤 속담 퀴즈로 도전할까요?</Text>
							<TouchableOpacity onPress={() => setShowGuideModal(true)} style={styles.inlineInfoIcon}>
								<IconComponent type='materialIcons' name='info-outline' size={20} color='#3498db' />
							</TouchableOpacity>
						</View>

						<View style={styles.gridWrap}>
							{MODES.map((mode) => {
								const isDisabled = mode.key === 'comingsoon';
								return (
									<TouchableOpacity
										key={mode.key}
										style={[styles.gridButtonHalf, { backgroundColor: mode.color }, isDisabled && styles.disabledButton]}
										activeOpacity={isDisabled ? 1 : 0.7}
										onPress={() => !isDisabled && moveToHandler(mode.key)}>
										<View style={isDisabled ? styles.disabledInner : styles.iconTextRow}>
											<IconComponent type={mode.type} name={mode.icon} size={isDisabled ? 24 : 28} color={isDisabled ? '#bdc3c7' : '#fff'} />
											<Text style={[styles.modeLabel, isDisabled && styles.disabledText]}>{mode.label}</Text>
										</View>
									</TouchableOpacity>
								);
							})}
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>

			{showGuideModal && (
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={() => setShowGuideModal(false)}>
							<IconComponent type='materialIcons' name='close' size={24} color='#555' />
						</TouchableOpacity>
						<ScrollView style={{ maxHeight: '100%' }} showsVerticalScrollIndicator={true}>
							<Text style={styles.modalTitle}>
								<IconComponent type='materialCommunityIcons' name='head-question-outline' size={20} /> 퀴즈 모드 안내
							</Text>
							<Text style={styles.modalText}>
								<Text style={styles.boldText}>1️⃣ 속담 뜻 퀴즈{'\n'}</Text>- 제시된 속담에 대한 올바른 의미를 고르는 4지선다형 퀴즈입니다.{'\n'}- 속담의 뜻을
								이해하는 능력을 키울 수 있어요.{'\n\n'}
								<Text style={styles.boldText}>2️⃣ 속담 찾기 퀴즈{'\n'}</Text>- 제시된 의미에 해당하는 속담을 고르는 4지선다형 퀴즈입니다.
								{'\n'}- 유사한 의미의 속담 중 정확한 속담을 찾아내는 연습이 돼요.{'\n\n'}
								<Text style={styles.boldText}>3️⃣ 빈칸 채우기 퀴즈{'\n'}</Text>- 속담의 일부분이 빈칸으로 제시되고, 알맞은 단어를 고르는 4지선다형 퀴즈입니다.{'\n'}-
								속담의 문장 구조와 정확한 어휘력을 함께 익힐 수 있어요.{'\n\n'}
								<Text style={styles.boldText}>📌 공통 안내{'\n'}</Text>- 각 퀴즈는 난이도별, 카테고리별로 문제를 선택해 풀 수 있습니다.{'\n'}- 이미 푼 문제는
								자동으로 제외되어, 복습 또는 도전이 편리해요.
							</Text>
						</ScrollView>

						<TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowGuideModal(false)}>
							<Text style={styles.modalCloseText}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}
		</>
	);
};

export default ProverbQuizModeSelectScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	centerWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(40),
	},
	title: {
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#2c3e50',
		textAlign: 'center',
		marginBottom: scaleHeight(10),
	},
	gridWrap: {
		paddingTop: scaleHeight(30),
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		columnGap: scaleWidth(16),
		rowGap: scaleHeight(20),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(30),
	},
	gridButtonHalf: {
		width: '45%',
		minWidth: scaleWidth(140),
		maxWidth: scaleWidth(180),
		height: scaleHeight(120),
		borderRadius: scaleWidth(16),
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(6),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.15,
		shadowRadius: scaleWidth(4),
	},
	iconTextRow: {
		flexDirection: 'column',
		alignItems: 'center',
		gap: scaleHeight(6),
	},
	modeLabel: {
		color: '#fff',
		fontSize: scaledSize(18),
		fontWeight: '600',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	disabledInner: {
		alignItems: 'center',
		justifyContent: 'center',
		opacity: 0.6,
	},
	subTitle: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(8),
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
		maxHeight: '75%',
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
	boldText: {
		fontWeight: 'bold',
	},
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(10),
		right: scaleWidth(10),
		zIndex: 2,
		padding: scaleWidth(5),
	},
	homeButtonWrap: {
		width: '100%',
		alignItems: 'center',
		marginTop: scaleHeight(24),
	},
	headerSection: {
		alignItems: 'center',
		marginBottom: scaleHeight(36),
	},
	subtitle: {
		fontSize: scaledSize(15),
		color: '#7f8c8d',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(4),
		paddingHorizontal: scaleWidth(12),
	},
	bottomExitWrapper: {
		width: '100%',
		paddingVertical: scaleHeight(24),
		alignItems: 'center',
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	homeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#28a745',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(28),
		borderRadius: scaleWidth(30),
	},
	buttonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '600',
		textAlign: 'center',
		lineHeight: scaleHeight(22),
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: scaleHeight(12),
	},
	disabledButton: {
		width: '45%',
		minWidth: scaleWidth(150),
		maxWidth: scaleWidth(200),
		height: scaleHeight(120),
		backgroundColor: '#ecf0f1',
		borderRadius: scaleWidth(16),
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.6,
	},
	disabledText: {
		color: '#95a5a6',
		fontSize: scaledSize(16),
		fontWeight: '600',
		textAlign: 'center',
	},
	comingSoon: {
		fontSize: scaledSize(12),
		color: '#bdc3c7',
		fontWeight: '500',
		marginTop: scaleHeight(4),
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(15),
		paddingVertical: scaleHeight(40),
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		flexWrap: 'nowrap',
	},
	inlineInfoIcon: {
		marginLeft: scaleWidth(6),
		padding: scaleWidth(4),
		marginBottom: scaleHeight(12),
	},
});
