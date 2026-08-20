/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { View, Modal, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Calendar } from 'react-native-calendars';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { PET_REWARDS } from '@/const/ConstInfoData';

interface CheckInModalProps {
	visible: boolean;
	isCheckedIn: boolean;
	checkedInDates: { [date: string]: any };
	mascot: any;
	showStamp: boolean;
	stampStyle: any;
	onClose: () => void;
	petLevel?: number; // ✅ 현재 획득한 펫 단계(-1: 없음). 출석 모달에서 내 펫 상태를 표시
}

const CheckInModal: React.FC<CheckInModalProps> = ({ visible, isCheckedIn, checkedInDates, mascot, showStamp, stampStyle, onClose, petLevel = -1 }) => {
	// 모달 진입 애니메이션 (fade + scale)
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			fadeAnim.setValue(0);
			scaleAnim.setValue(0.95);
			return;
		}
		fadeAnim.setValue(0);
		scaleAnim.setValue(0.95);
		const anim = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		anim.start();
		// ✅ 정리
		return () => anim.stop();
	}, [visible, fadeAnim, scaleAnim]);

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<Animated.View style={[styles.modalContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
					<ModalCloseButton onPress={onClose} />

					<Text style={styles.modalTitle}>오늘의 출석</Text>

					<ScrollView style={{ width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
						<View style={styles.rowCentered}>
							<FastImage source={require('@/assets/images/screen-heroes/check-in-stamp.png')} style={styles.checkInHeroImage} resizeMode={FastImage.resizeMode.contain} />
							<Text style={[styles.modalText, { flex: 1 }]}>매일 접속하면 퀴즈에서 얻은 나의 캐릭터가 출석 스탬프를 찍어줘요!{'\n'}</Text>
						</View>

						<View style={styles.highlightBox}>
							<Text style={styles.highlightText}>
								연속 출석을 통해 5단계로 진화하는 귀여운 펫도 함께 얻을 수 있답니다 🐾{'\n'}
								획득한 펫은 캐릭터 옆에 항상 따라다녀요!
							</Text>
						</View>

						<View style={styles.petScrollContainer}>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petScrollContent}>
								{PET_REWARDS.map((item, index, arr) => {
									const isEarned = index <= petLevel; // ✅ 획득 완료
									const isCurrent = index === petLevel; // ✅ 현재 단계
									const isLocked = index > petLevel; // ✅ 미획득(잠금)
									return (
										<View key={index} style={[styles.petItemBox, isCurrent && styles.petItemBoxCurrent]}>
											<View>
												<FastImage
													source={item.image}
													style={[styles.petImage, isLocked && styles.petImageLocked]}
													resizeMode="cover"
												/>
												{isEarned && (
													<View style={styles.petEarnedCheck}>
														<IconComponent type="materialIcons" name="check" size={scaledSize(10)} color={COLORS.textWhite} />
													</View>
												)}
												{isLocked && (
													<View style={styles.petLockOverlay}>
														<IconComponent type="materialIcons" name="lock" size={scaledSize(14)} color={COLORS.textLight} />
													</View>
												)}
											</View>
											<Text style={[styles.petLabelText, isLocked && styles.petTextLocked]}>{item.label}</Text>
											<Text style={[styles.petStageText, isLocked && styles.petTextLocked]}>{item.name}</Text>

											{isCurrent && (
												<View style={styles.petCurrentBadge}>
													<Text style={styles.petCurrentBadgeText}>현재</Text>
												</View>
											)}

											{index < arr.length - 1 && <IconComponent name="chevron-right" type="fontAwesome" size={scaledSize(12)} color={COLORS.textSecondary} style={styles.arrowIcon} />}
										</View>
									);
								})}
							</ScrollView>
						</View>

						<View style={styles.calendarWrapper}>
							<Calendar
								markingType="custom"
								markedDates={checkedInDates}
								disableAllTouchEventsForDisabledDays={true}
								enableSwipeMonths={true}
								theme={{
									todayTextColor: COLORS.danger,
									todayBackgroundColor: COLORS.dangerBg,
									arrowColor: COLORS.primary,
									textDayFontSize: FONT_SIZES.smPlus,
									textDayFontWeight: '600',
									textMonthFontSize: FONT_SIZES.mdPlus,
									textMonthFontWeight: '700',
									textDayHeaderFontSize: FONT_SIZES.xs,
									textDayHeaderFontWeight: '700',
									calendarBackground: COLORS.surface,
									textSectionTitleColor: COLORS.textLight,
									selectedDayBackgroundColor: COLORS.primary,
									selectedDayTextColor: COLORS.textWhite,
									dayTextColor: COLORS.text,
									textDisabledColor: COLORS.borderDark,
								}}
								renderHeader={(date) => {
									const year = date.getFullYear();
									const month = (date.getMonth() + 1).toString().padStart(2, '0');
									return <Text style={styles.calendarHeaderText}>{`${year}년 ${month}월`} 출석</Text>;
								}}
								style={styles.calendarContainer}
							/>
							<View style={styles.swipeHintRow}>
								<IconComponent type="materialIcons" name="swipe" size={scaledSize(13)} color={COLORS.textLight} />
								<Text style={styles.swipeHintText}>좌우 화살표 버튼을 눌러서 출석을 확인해보세요!</Text>
							</View>
						</View>

						{showStamp && (
							<Animated.View style={[stampStyle, styles.stampContainer]}>
								<View style={styles.stampImageWrap}>
									<FastImage source={mascot} style={styles.stampImage} resizeMode="contain" />
									{/* ✅ 획득한 펫이 캐릭터 옆에 함께 따라다님 */}
									{petLevel >= 0 && (
										<View style={styles.stampPetBadge}>
											<FastImage source={PET_REWARDS[petLevel].image} style={styles.stampPetImage} resizeMode="cover" />
										</View>
									)}
								</View>
								<Text style={styles.stampText}>오늘 출석 완료!</Text>
							</Animated.View>
						)}

						{isCheckedIn && <Text style={styles.checkInCompleteText}>🎉 오늘도 출석 완료! 🎉</Text>}
					</ScrollView>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default CheckInModal;

const styles = themedStyles(() => StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	modalContent: {
		width: '100%',
		maxWidth: scaleWidth(340),
		maxHeight: scaleHeight(700),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
	},
	modalTitle: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.md,
		textAlign: 'center',
	},
	scrollContent: {
		paddingBottom: SPACING_H.md,
	},
	rowCentered: {
		flexDirection: 'row',
		justifyContent: 'center',
		columnGap: SPACING_W.md,
		marginBottom: SPACING_H.md,
	},
	mascotImage: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(48) / 2,
		borderWidth: 2,
		borderColor: COLORS.primary,
	},
	checkInHeroImage: { width: scaleWidth(96), height: scaleHeight(92) },
	modalText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(20),
		fontWeight: '400',
	},
	highlightBox: {
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.md,
		backgroundColor: COLORS.warningBg,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.warning,
	},
	highlightText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.text,
		textAlign: 'center',
		lineHeight: scaledSize(20),
		fontWeight: '500',
	},
	petScrollContainer: {
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.md,
	},
	petScrollContent: {
		paddingHorizontal: SPACING_W.xs,
		columnGap: SPACING_W.sm,
	},
	petItemBox: {
		width: scaleWidth(90),
		alignItems: 'center',
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.border,
		position: 'relative',
	},
	petImage: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(48) / 2,
		borderWidth: 2,
		borderColor: COLORS.primary,
		marginBottom: SPACING_H.xs,
	},
	petItemBoxCurrent: {
		borderColor: COLORS.primary,
		backgroundColor: COLORS.primaryBg,
	},
	petImageLocked: {
		opacity: 0.35,
		borderColor: COLORS.borderDark,
	},
	petTextLocked: {
		color: COLORS.textLight,
	},
	petEarnedCheck: {
		position: 'absolute',
		top: -SPACING_H.xs / 2,
		right: -SPACING_W.xs / 2,
		width: scaleWidth(16),
		height: scaleWidth(16),
		borderRadius: scaleWidth(16) / 2,
		backgroundColor: COLORS.secondary,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1.5,
		borderColor: COLORS.surface,
	},
	petLockOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: SPACING_H.xs,
		alignItems: 'center',
		justifyContent: 'center',
	},
	petCurrentBadge: {
		marginTop: SPACING_H.xs,
		backgroundColor: COLORS.secondary,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs / 2,
	},
	petCurrentBadgeText: {
		fontSize: FONT_SIZES.xxs,
		color: COLORS.textWhite,
		fontWeight: '700',
	},
	stampImageWrap: {
		position: 'relative',
	},
	stampPetBadge: {
		position: 'absolute',
		right: -SPACING_W.sm,
		bottom: SPACING_H.sm,
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(56) / 2,
		borderWidth: 2,
		borderColor: COLORS.surface,
		backgroundColor: COLORS.surface,
		overflow: 'hidden',
	},
	stampPetImage: {
		width: '100%',
		height: '100%',
	},
	petLabelText: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.text,
		fontWeight: '600',
		textAlign: 'center',
	},
	petStageText: {
		fontSize: FONT_SIZES.xxs,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.xs / 2,
		textAlign: 'center',
	},
	arrowIcon: {
		position: 'absolute',
		right: -SPACING_W.sm,
		top: '45%',
	},
	stampContainer: {
		alignItems: 'center',
		marginTop: SPACING_H.md,
	},
	stampImage: {
		width: scaleWidth(160),
		height: scaleWidth(160),
		marginBottom: SPACING_H.xs,
		borderRadius: scaleWidth(160) / 2,
	},
	stampText: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.danger,
		fontWeight: '700',
		textShadowColor: 'rgba(0,0,0,0.2)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	calendarWrapper: {
		width: '100%',
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.sm,
	},
	calendarContainer: {
		width: '100%',
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.xs,
		overflow: 'hidden',
		backgroundColor: COLORS.surface,
	},
	swipeHintRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.xs,
		marginTop: SPACING_H.sm,
	},
	swipeHintText: {
		fontSize: FONT_SIZES.xs,
		color: COLORS.textLight,
		fontWeight: '600',
	},
	calendarHeaderText: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.text,
		textAlign: 'center',
		marginVertical: SPACING_H.sm,
	},
	checkInCompleteText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.primary,
		marginTop: SPACING_H.md,
		fontWeight: '700',
		textAlign: 'center',
	},
}));
