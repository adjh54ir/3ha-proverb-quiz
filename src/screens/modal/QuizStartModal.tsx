// QuizStartModal.tsx
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import IconComponent from '../common/atomic/IconComponent';
import ProverbServices from '@/services/ProverbServices';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}: Props) => {
	const [levelStats, setLevelStats] = useState<Record<string, { total: number; studied: number }>>({});
	const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; studied: number }>>({});

	useFocusEffect(
		useCallback(() => {
			const load = async () => {
				const raw = await AsyncStorage.getItem('UserStudyHistory');
				const parsed = raw ? JSON.parse(raw) : { studiedIds: [] };
				loadLevelStats(parsed.studiedIds ?? []);
				loadStats(parsed.studiedIds ?? []);
			};
			load();
		}, []),
	);

	const loadStats = (studiedIds: number[]) => {
		const allProverbs = ProverbServices.selectProverbList();
		const categoryMap: Record<string, { total: number; studied: number }> = {
			전체: { total: 0, studied: 0 }, // ✅ 전체 기본값 추가
		};

		allProverbs.forEach((item) => {
			const category = item.category;
			// 개별 카테고리 누적
			if (!categoryMap[category]) categoryMap[category] = { total: 0, studied: 0 };
			categoryMap[category].total += 1;
			if (studiedIds.includes(item.id)) categoryMap[category].studied += 1;

			// 전체 카운트 누적
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
		'아주 쉬움': { color: '#85C1E9', icon: { type: 'fontAwesome5', name: 'seedling' }, type: 'level' },
		쉬움: { color: '#F4D03F', icon: { type: 'fontAwesome5', name: 'leaf' }, type: 'level' },
		보통: { color: '#EB984E', icon: { type: 'fontAwesome5', name: 'tree' }, type: 'level' },
		어려움: { color: '#E74C3C', icon: { type: 'fontAwesome5', name: 'trophy' }, type: 'level' },

		// 카테고리
		'운/우연': { color: '#81ecec', icon: { type: 'fontAwesome5', name: 'dice' }, type: 'category' },
		인간관계: { color: '#a29bfe', icon: { type: 'fontAwesome5', name: 'users' }, type: 'category' },
		'세상 이치': { color: '#ffeaa7', icon: { type: 'fontAwesome5', name: 'globe' }, type: 'category' },
		'근면/검소': { color: '#fab1a0', icon: { type: 'fontAwesome5', name: 'hammer' }, type: 'category' },
		'노력/성공': { color: '#55efc4', icon: { type: 'fontAwesome5', name: 'medal' }, type: 'category' },
		'경계/조심': { color: '#ff7675', icon: { type: 'fontAwesome5', name: 'exclamation-triangle' }, type: 'category' },
		'욕심/탐욕': { color: '#fd79a8', icon: { type: 'fontAwesome5', name: 'money-bill-wave' }, type: 'category' },
		'배신/불신': { color: '#b2bec3', icon: { type: 'fontAwesome5', name: 'user-slash' }, type: 'category' },
	};
	const getStyleColor = (key: string): string =>
		STYLE_MAP[key]?.color || (STYLE_MAP[key]?.type === 'level' ? '#0A84FF' : '#dfe6e9');
	const getStyleIcon = (key: string): { type: string; name: string } | null => STYLE_MAP[key]?.icon || null;

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
				<View style={styles.selectTitleBox}>
					<Text style={styles.selectTitleEmoji}>🎯</Text>
					<Text style={styles.selectTitleText}>{title}</Text>
				</View>
				<View style={styles.selectSection}>
					{options.map((option, idx) => {
						const iconData = getIcon?.(option);
						const isAll = option === '전체';
						const isSelected = selected === option;
						const stats = isLevel ? levelStats[option] : categoryStats[option];

						return (
							<TouchableOpacity
								key={option}
								style={[
									isAll ? styles.fullWidthButton : styles.halfWidthButton,
									{ backgroundColor: isAll ? '#5DADE2' : getColor(option) },
									isSelected && styles.selectButtonActive,
								]}
								onPress={() => onSelect(option)}>
								<View style={{ alignItems: 'center', justifyContent: 'center' }}>
									{isAll ? (
										<IconComponent
											type='fontAwesome5'
											name='clipboard-list'
											size={20}
											color={isSelected ? '#ffffff' : '#eeeeee'}
											style={{ marginBottom: 6 }}
										/>
									) : iconData ? (
										<IconComponent
											type={iconData.type}
											name={iconData.name}
											size={18}
											color={isSelected ? '#ffffff' : '#eeeeee'}
											style={{ marginBottom: 6 }}
										/>
									) : null}
									<Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive, { textAlign: 'center' }]}>
										{`${option} ${stats ? `(${stats.studied}/${stats.total})` : ''}`}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>
		);
	};

	return (
		<Modal visible={visible} transparent animationType='fade'>
			<View style={styles.modalOverlay}>
				<View style={styles.selectModal}>
					<TouchableOpacity style={styles.closeButton} onPress={onClose}>
						<IconComponent type='materialIcons' name='close' size={24} color='#7f8c8d' />
					</TouchableOpacity>

					<Text style={styles.selectTitle}>🧠 퀴즈 모드</Text>
					<Text style={styles.selectSub}>난이도와 카테고리를 선택해주세요!</Text>

					<View style={[styles.selectSection, { marginBottom: modeStep === 1 ? 30 : 0 }]}>
						{modeStep === 0 ? (
							<SelectGroup
								title='난이도 선택'
								options={levelOptions}
								selected={selectedLevel}
								onSelect={setSelectedLevel}
								getIcon={getStyleIcon}
							/>
						) : (
							<ScrollView>
								<SelectGroup
									title='카테고리 선택'
									compact={true}
									options={categoryOptions}
									selected={selectedCategory}
									onSelect={setSelectedCategory}
									getIcon={getStyleIcon}
								/>
							</ScrollView>
						)}
					</View>

					<View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
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
									flex: 1,
									backgroundColor:
										(modeStep === 0 && selectedLevel) || (modeStep === 1 && selectedCategory) ? '#27ae60' : '#ccc',
								},
							]}
							disabled={modeStep === 0 ? !selectedLevel : !selectedCategory}
							onPress={() => {
								if (modeStep === 0) {
									setModeStep(1);
								} else {
									onStart();
								}
							}}>
							<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
								{modeStep === 1 && (
									<IconComponent type='fontAwesome5' name='rocket' size={16} color='#fff' style={{ marginRight: 8 }} />
								)}
								<Text style={styles.modalButtonText}>{modeStep === 0 ? '다음' : '퀴즈 시작'}</Text>
								{modeStep === 0 && (
									<IconComponent type='fontAwesome5' name='arrow-right' size={16} color='#fff' style={{ marginLeft: 8 }} />
								)}
							</View>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default QuizStartModal;

const styles = StyleSheet.create({
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
	selectModal: {
		backgroundColor: '#fff',
		paddingHorizontal: 24,
		paddingBottom: 24,
		paddingTop: 48,
		borderRadius: 16,
		alignItems: 'center',
		width: '90%',
		position: 'relative',
	},
	closeButton: {
		position: 'absolute',
		top: 12,
		right: 12,
		zIndex: 10,
		padding: 4,
	},
	selectTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 8,
	},
	selectSub: {
		fontSize: 16,
		color: '#34495e',
		marginBottom: 20,
		textAlign: 'center',
	},
	modalButton: {
		backgroundColor: '#3498db',
		paddingVertical: 14,
		paddingHorizontal: 40,
		borderRadius: 30,
		marginTop: 20,
	},
	modalButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	backButtonInline: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		paddingVertical: 14,
		borderRadius: 30,
		borderWidth: 2,
		borderColor: '#3498db',
	},
	backButtonText: {
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
		color: '#3498db',
	},
	selectGroupWrapper: {
		backgroundColor: '#f2f4f5',
		borderRadius: 12,
		padding: 16,
		marginBottom: 0,
		width: '100%',
		borderWidth: 1,
		borderColor: '#dfe6e9',
	},
	selectSection: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: 5,
	},

	halfWidthButton: {
		width: '46%',
		minHeight: 56, // 기존보다 줄임
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 8, // 내부 여백도 소폭 줄임
		paddingVertical: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
		marginBottom: 6, // 🔽 여기도 줄이기
	},

	fullWidthButton: {
		width: '100%',
		minHeight: 56, // 동일하게 줄임
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 10,
		marginBottom: 10,
	},
	selectButtonActive: {
		borderWidth: 2,
		borderColor: '#27ae60',
		shadowColor: '#27ae60',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.7,
		shadowRadius: 6,
		elevation: 6,
	},

	selectButtonTextActive: {
		color: '#fff',
	},
	selectTitleBox: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
		gap: 6,
	},
	selectTitleEmoji: {
		fontSize: 22,
	},

	selectTitleText: {
		fontSize: 18,
		fontWeight: '700',
		color: '#2c3e50',
	},
	selectButtonText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#ffffff',
		textAlign: 'center',
		lineHeight: 20,
	},
});
