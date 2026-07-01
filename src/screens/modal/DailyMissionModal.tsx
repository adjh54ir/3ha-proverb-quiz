/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import DateUtils from '@/utils/DateUtils';
import { computeDailyMissions, countDoneMissions, allMissionsDone, DailyMission } from '@/utils/DailyMissionUtils';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import Colors from '@/const/ConstColors';

interface DailyMissionModalProps {
	visible: boolean;
	onClose: () => void;
	/** 보상 수령(점수 변동) 후 부모 갱신용 콜백. 지급된 보너스 점수를 전달한다. */
	onClaimed?: (bonus: number) => void;
}

/** 미션 전체 완료 보너스 점수 */
const MISSION_BONUS = 100;

const DailyMissionModal: React.FC<DailyMissionModalProps> = ({ visible, onClose, onClaimed }) => {
	const [missions, setMissions] = useState<DailyMission[]>([]);
	const [claimedToday, setClaimedToday] = useState(false);
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!visible) {
			return;
		}
		// 오늘 미션 진행도 + 보상 수령 여부 로드
		(async () => {
			try {
				const todayStr = DateUtils.getLocalDateString();
				const [json, claimedJson] = await Promise.all([
					AsyncStorage.getItem(MainStorageKeyType.TODAY_QUIZ_LIST),
					AsyncStorage.getItem(MainStorageKeyType.DAILY_MISSION_CLAIMED),
				]);
				const list: MainDataType.TodayQuizList[] = json ? JSON.parse(json) : [];
				const todayItem = list.find((q) => q.quizDate.slice(0, 10) === todayStr) ?? null;
				setMissions(computeDailyMissions(todayItem));
				const claimed: string[] = claimedJson ? JSON.parse(claimedJson) : [];
				setClaimedToday(claimed.includes(todayStr));
			} catch {
				setMissions(computeDailyMissions(null));
				setClaimedToday(false);
			}
		})();

		// 진입 애니메이션
		scaleAnim.setValue(0.9);
		opacityAnim.setValue(0);
		const anim = Animated.parallel([
			Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
			Animated.timing(opacityAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
		]);
		anim.start();

		// ✅ 정리
		return () => anim.stop();
	}, [visible, opacityAnim, scaleAnim]);

	const doneCount = countDoneMissions(missions);
	const allDone = allMissionsDone(missions);

	// 미션 전체 완료 시 보너스 점수 수령 (하루 1회)
	const handleClaim = async () => {
		if (!allDone || claimedToday) {
			return;
		}
		try {
			const todayStr = DateUtils.getLocalDateString();
			// 보너스 점수 지급 (다른 필드는 보존)
			const quizJson = await AsyncStorage.getItem(MainStorageKeyType.USER_QUIZ_HISTORY);
			const quiz = quizJson ? JSON.parse(quizJson) : {};
			quiz.totalScore = (quiz.totalScore ?? 0) + MISSION_BONUS;
			quiz.badges = quiz.badges ?? [];
			await AsyncStorage.setItem(MainStorageKeyType.USER_QUIZ_HISTORY, JSON.stringify(quiz));

			// 수령 날짜 기록
			const claimedJson = await AsyncStorage.getItem(MainStorageKeyType.DAILY_MISSION_CLAIMED);
			const claimed: string[] = claimedJson ? JSON.parse(claimedJson) : [];
			await AsyncStorage.setItem(
				MainStorageKeyType.DAILY_MISSION_CLAIMED,
				JSON.stringify([...new Set([...claimed, todayStr])]),
			);

			setClaimedToday(true);
			// ✅ 지급 보너스를 부모로 전달해 즉시 점수 반영 (스토리지 재조회 지연 방지)
			onClaimed?.(MISSION_BONUS);
		} catch {
			// 무시
		}
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
					<ModalCloseButton onPress={onClose} />

					{/* 헤더 */}
					<View style={styles.header}>
						<View style={styles.headerIcon}>
							<IconComponent type="materialIcons" name="task-alt" size={scaledSize(26)} color="#fff" />
						</View>
						<Text style={styles.title}>오늘의 미션</Text>
						<Text style={styles.subtitle}>
							{allDone ? '오늘 미션을 모두 완료했어요! 🎉' : `${doneCount} / ${missions.length} 완료`}
						</Text>
						<View style={styles.progressTrack}>
							<View
								style={[
									styles.progressFill,
									{ width: `${missions.length ? (doneCount / missions.length) * 100 : 0}%` },
								]}
							/>
						</View>
					</View>

					{/* 미션 목록 */}
					<View style={styles.list}>
						{missions.map((m) => (
							<View key={m.id} style={[styles.missionRow, m.done && styles.missionRowDone]}>
								<View style={[styles.missionIcon, { backgroundColor: m.done ? Colors.primary : '#E2E8F0' }]}>
									<IconComponent type={m.iconType} name={m.icon} size={scaledSize(18)} color={m.done ? '#fff' : '#94A3B8'} />
								</View>
								<View style={styles.missionTextWrap}>
									<Text style={[styles.missionLabel, m.done && styles.missionLabelDone]}>{m.label}</Text>
									<Text style={styles.missionProgress}>
										{m.current} / {m.target}
									</Text>
								</View>
								<IconComponent
									type="materialIcons"
									name={m.done ? 'check-circle' : 'radio-button-unchecked'}
									size={scaledSize(22)}
									color={m.done ? Colors.primary : '#CBD5E1'}
								/>
							</View>
						))}
					</View>

					{/* 보상 영역 */}
					<View style={styles.rewardWrap}>
						{!allDone ? (
							<Text style={styles.rewardHint}>미션을 모두 완료하면 보너스 +{MISSION_BONUS}점!</Text>
						) : claimedToday ? (
							<View style={styles.rewardDone}>
								<IconComponent type="materialIcons" name="verified" size={scaledSize(18)} color={Colors.primaryDeep} />
								<Text style={styles.rewardDoneText}>오늘 보상 완료! (+{MISSION_BONUS}점)</Text>
							</View>
						) : (
							<TouchableOpacity style={styles.rewardBtn} onPress={handleClaim} activeOpacity={0.85}>
								<IconComponent type="materialIcons" name="card-giftcard" size={scaledSize(18)} color="#fff" />
								<Text style={styles.rewardBtnText}>보상 받기 (+{MISSION_BONUS}점)</Text>
							</TouchableOpacity>
						)}
					</View>

					<Text style={styles.hint}>미션은 매일 자정에 새로 시작돼요.</Text>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default DailyMissionModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	card: {
		width: '86%',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		paddingBottom: scaleHeight(18),
		overflow: 'hidden',
	},
	header: {
		backgroundColor: Colors.primary,
		paddingTop: scaleHeight(22),
		paddingBottom: scaleHeight(16),
		paddingHorizontal: scaleWidth(20),
		alignItems: 'center',
	},
	headerIcon: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(26),
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	title: {
		fontSize: scaledSize(18),
		fontWeight: '800',
		color: '#fff',
	},
	subtitle: {
		fontSize: scaledSize(13),
		fontWeight: '600',
		color: 'rgba(255,255,255,0.9)',
		marginTop: scaleHeight(4),
		marginBottom: scaleHeight(12),
	},
	progressTrack: {
		width: '100%',
		height: scaleHeight(8),
		borderRadius: scaleHeight(4),
		backgroundColor: 'rgba(255,255,255,0.3)',
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: scaleHeight(4),
		backgroundColor: '#fff',
	},
	list: {
		paddingHorizontal: scaleWidth(16),
		paddingTop: scaleHeight(16),
	},
	missionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: '#EEF2F7',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(14),
		marginBottom: scaleHeight(10),
	},
	missionRowDone: {
		backgroundColor: Colors.primaryBg,
		borderColor: Colors.primarySoft,
	},
	missionIcon: {
		width: scaleWidth(38),
		height: scaleWidth(38),
		borderRadius: scaleWidth(19),
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(12),
	},
	missionTextWrap: {
		flex: 1,
	},
	missionLabel: {
		fontSize: scaledSize(14),
		fontWeight: '700',
		color: '#334155',
	},
	missionLabelDone: {
		color: Colors.primaryDeep,
	},
	missionProgress: {
		fontSize: scaledSize(12),
		color: '#94A3B8',
		marginTop: scaleHeight(2),
		fontWeight: '600',
	},
	rewardWrap: {
		paddingHorizontal: scaleWidth(16),
		marginTop: scaleHeight(2),
		marginBottom: scaleHeight(8),
	},
	rewardHint: {
		fontSize: scaledSize(12.5),
		color: '#94A3B8',
		textAlign: 'center',
		fontWeight: '600',
	},
	rewardBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.primary,
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(13),
		gap: scaleWidth(8),
	},
	rewardBtnText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '800',
	},
	rewardDone: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.primaryBg,
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(12),
		gap: scaleWidth(6),
	},
	rewardDoneText: {
		color: Colors.primaryDeep,
		fontSize: scaledSize(14),
		fontWeight: '800',
	},
	hint: {
		fontSize: scaledSize(11),
		color: '#94A3B8',
		textAlign: 'center',
		marginTop: scaleHeight(4),
	},
});
