import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import DateUtils from '@/utils/DateUtils';
import { computeDailyMissions, countDoneMissions, allMissionsDone, DailyMission } from '@/utils/DailyMissionUtils';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';

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
	const scaleAnim = useRef(new Animated.Value(0.95)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			scaleAnim.setValue(0.95);
			opacityAnim.setValue(0);
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
				const todayItem = list.find((q) => DateUtils.toLocalDateKey(q.quizDate) === todayStr) ?? null;
				setMissions(computeDailyMissions(todayItem));
				const claimed: string[] = claimedJson ? JSON.parse(claimedJson) : [];
				setClaimedToday(claimed.includes(todayStr));
			} catch {
				setMissions(computeDailyMissions(null));
				setClaimedToday(false);
			}
		})();

		// 진입 애니메이션
		scaleAnim.setValue(0.95);
		opacityAnim.setValue(0);
		const anim = Animated.parallel([
			Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
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
					<ModalCloseButton onPress={onClose} color={COLORS.textWhite} />

					{/* 헤더 */}
					<View style={styles.header}>
						<View style={styles.headerIcon}>
							<IconComponent type="materialIcons" name="task-alt" size={scaledSize(26)} color={COLORS.textWhite} />
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
						{allDone ? (
							<Image
								source={require('@/assets/images/feature-states/daily-mission-complete.png')}
								style={styles.completeImage}
								resizeMode="contain"
							/>
						) : (
							<Image
								source={require('@/assets/images/screen-heroes/daily-mission-progress.png')}
								style={styles.progressImage}
								resizeMode="contain"
							/>
						)}
						{missions.map((m) => (
							<View key={m.id} style={[styles.missionRow, m.done && styles.missionRowDone]}>
								<View style={[styles.missionIcon, { backgroundColor: m.done ? COLORS.primary : COLORS.border }]}>
									<IconComponent type={m.iconType} name={m.icon} size={scaledSize(18)} color={m.done ? COLORS.textWhite : COLORS.textLight} />
								</View>
								<View style={styles.missionTextWrap}>
									<Text style={[styles.missionLabel, m.done && styles.missionLabelDone]} numberOfLines={2} ellipsizeMode="tail">
										{m.label}
									</Text>
									<Text style={styles.missionProgress}>
										{m.current} / {m.target}
									</Text>
								</View>
								<IconComponent
									type="materialIcons"
									name={m.done ? 'check-circle' : 'radio-button-unchecked'}
									size={scaledSize(22)}
									color={m.done ? COLORS.primary : COLORS.borderDark}
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
								<IconComponent type="materialIcons" name="verified" size={scaledSize(18)} color={COLORS.primaryDeep} />
								<Text style={styles.rewardDoneText}>오늘 보상 완료! (+{MISSION_BONUS}점)</Text>
							</View>
						) : (
							<TouchableOpacity style={styles.rewardBtn} onPress={handleClaim} activeOpacity={0.85}>
								<IconComponent type="materialIcons" name="card-giftcard" size={scaledSize(18)} color={COLORS.textWhite} />
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

const styles = themedStyles(() => StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(340),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		// 헤더 밴드가 카드 상단을 가득 채우므로 좌우 패딩은 내부 섹션에서 처리한다.
		paddingBottom: SPACING_H.xl,
		overflow: 'hidden',
	},
	header: {
		backgroundColor: COLORS.primary,
		paddingTop: SPACING_H.xl,
		paddingBottom: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		alignItems: 'center',
	},
	headerIcon: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(52) / 2,
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	title: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textWhite,
	},
	subtitle: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: 'rgba(255,255,255,0.9)',
		marginTop: SPACING_H.xs,
		marginBottom: SPACING_H.md,
	},
	progressTrack: {
		width: '100%',
		height: scaleHeight(8),
		borderRadius: RADIUS.round,
		backgroundColor: 'rgba(255,255,255,0.3)',
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.textWhite,
	},
	list: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.lg,
	},
	completeImage: {
		width: scaleWidth(84),
		height: scaleWidth(84),
		alignSelf: 'center',
		marginBottom: SPACING_H.md,
	},
	progressImage: {
		width: scaleWidth(116),
		height: scaleHeight(84),
		alignSelf: 'center',
		marginBottom: SPACING_H.md,
	},
	missionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.md,
		backgroundColor: COLORS.background,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.md,
	},
	missionRowDone: {
		backgroundColor: COLORS.primaryBg,
		borderColor: COLORS.primarySoft,
	},
	missionIcon: {
		width: scaleWidth(38),
		height: scaleWidth(38),
		borderRadius: scaleWidth(38) / 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	missionTextWrap: {
		flex: 1,
	},
	missionLabel: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.text,
	},
	missionLabelDone: {
		color: COLORS.primaryDeep,
	},
	missionProgress: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
		marginTop: SPACING_H.xs,
		fontWeight: '600',
	},
	rewardWrap: {
		paddingHorizontal: SPACING_W.lg,
		marginTop: SPACING_H.xs,
		marginBottom: SPACING_H.sm,
	},
	rewardHint: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
		textAlign: 'center',
		fontWeight: '600',
	},
	rewardBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.md,
		height: scaleHeight(48),
	},
	rewardBtnText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},
	rewardDone: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.xs,
		backgroundColor: COLORS.primaryBg,
		borderRadius: RADIUS.md,
		height: scaleHeight(48),
	},
	rewardDoneText: {
		color: COLORS.primaryDeep,
		fontSize: FONT_SIZES.md,
		fontWeight: '700',
	},
	hint: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
		textAlign: 'center',
		marginTop: SPACING_H.sm,
	},
}));
