import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IconComponent from '../common/atomic/IconComponent';
import { Paths } from '@/navigation/conf/Paths';

const ProverbQuizModeSelectScreen = () => {
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
				//@ts-ignore
				navigation.push(Paths.PROVERB_MEANING_QUIZ);
				break;
			case 'proverb':
				//@ts-ignore
				navigation.push(Paths.PROVERB_FIND_QUIZ);
				break;
			case 'blank':
				//@ts-ignore
				navigation.push(Paths.PROVERB_BLANK_QUIZ);
				break;
			default:
				break;
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<View style={styles.container}>
					<View style={styles.centerWrapper}>
						<Text style={styles.title}>🧠 오늘은 어떤 속담 퀴즈로 도전할까요?</Text>
						<Text style={styles.subTitle}>퀴즈를 선택하면 난이도, 카테고리별로 퀴즈를 선택할 수 있습니다</Text>
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
											<IconComponent
												type={mode.type}
												name={mode.icon}
												size={isDisabled ? 24 : 28}
												color={isDisabled ? '#bdc3c7' : '#fff'}
											/>
											<Text style={[styles.modeLabel, isDisabled && styles.disabledText]}>{mode.label}</Text>
										</View>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
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
		paddingHorizontal: 40,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#2c3e50',
		textAlign: 'center',
		marginBottom: 10,
	},
	gridWrap: {
		width: '100%',
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: 16,
	},
	gridButtonHalf: {
		width: '48%',
		height: 120,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 6,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	iconTextRow: {
		flexDirection: 'column',
		alignItems: 'center',
		gap: 6,
	},
	modeLabel: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
		lineHeight: 22,
	},
	disabledButton: {
		backgroundColor: '#ecf0f1',
		opacity: 0.7,
	},
	disabledInner: {
		alignItems: 'center',
		justifyContent: 'center',
		opacity: 0.6,
	},
	disabledText: {
		color: '#95a5a6',
		fontSize: 16,
		textAlign: 'center',
	},
	subTitle: {
		fontSize: 14,
		color: '#7f8c8d',
		textAlign: 'center',
		marginBottom: 40,
		lineHeight: 20,
	},
});
