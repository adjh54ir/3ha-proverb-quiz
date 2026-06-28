/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Modal, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Calendar } from 'react-native-calendars';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';
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
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<TouchableOpacity style={styles.modalCloseIcon} onPress={onClose}>
						<IconComponent type="materialIcons" name="close" size={scaledSize(24)} color="#64748B" />
					</TouchableOpacity>

					<Text style={styles.modalTitle}>오늘의 출석</Text>

					<ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: scaleHeight(20) }} showsVerticalScrollIndicator={false}>
						<View style={styles.rowCentered}>
							<FastImage source={mascot} style={styles.mascotImage} resizeMode={FastImage.resizeMode.cover} />
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
										<View
											key={index}
											style={[
												styles.petItemBox,
												{ marginRight: index !== arr.length - 1 ? scaleWidth(10) : 0 },
												isCurrent && styles.petItemBoxCurrent,
											]}>
											<View>
												<FastImage
													source={item.image}
													style={[styles.petImage, isLocked && styles.petImageLocked]}
													resizeMode="cover"
												/>
												{isEarned && (
													<View style={styles.petEarnedCheck}>
														<IconComponent type="materialIcons" name="check" size={scaledSize(10)} color="#fff" />
													</View>
												)}
												{isLocked && (
													<View style={styles.petLockOverlay}>
														<IconComponent type="materialIcons" name="lock" size={scaledSize(14)} color="#94A3B8" />
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

											{index < arr.length - 1 && <IconComponent name="chevron-right" type="fontAwesome" size={scaledSize(12)} color="#64748B" style={styles.arrowIcon} />}
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
									todayTextColor: '#EF4444',
									todayBackgroundColor: '#FEF2F2',
									arrowColor: '#22C55E',
									textDayFontSize: scaledSize(13),
									textDayFontWeight: '600',
									textMonthFontSize: scaledSize(15),
									textMonthFontWeight: '800',
									textDayHeaderFontSize: scaledSize(11),
									textDayHeaderFontWeight: '700',
									calendarBackground: '#fff',
									textSectionTitleColor: '#94A3B8',
									selectedDayBackgroundColor: '#22C55E',
									selectedDayTextColor: '#fff',
									dayTextColor: '#334155',
									textDisabledColor: '#CBD5E1',
								}}
								renderHeader={(date) => {
									const year = date.getFullYear();
									const month = (date.getMonth() + 1).toString().padStart(2, '0');
									return <Text style={styles.calendarHeaderText}>{`${year}년 ${month}월`} 출석</Text>;
								}}
								style={styles.calendarContainer}
							/>
							<View style={styles.swipeHintRow}>
								<IconComponent type="materialIcons" name="swipe" size={scaledSize(13)} color="#94A3B8" />
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
				</View>
			</View>
		</Modal>
	);
};

export default CheckInModal;

const styles = StyleSheet.create({
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
		maxHeight: scaleHeight(700),
	},
	// modalCloseIcon 스타일 수정
	modalCloseIcon: {
		position: 'absolute',
		top: scaleHeight(16), // ✅ 10 → 16으로 변경
		right: scaleWidth(10),
		zIndex: 2,
		padding: scaleWidth(5),
	},
	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(14),
		textAlign: 'center',
		marginTop: scaleHeight(3), // ✅ 상단 여백 추가
	},
	rowCentered: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	mascotImage: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(24),
		borderWidth: 2,
		borderColor: '#22C55E',
		marginRight: scaleWidth(10),
	},
	modalText: {
		fontSize: scaledSize(13),
		color: '#334155',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(6),
		fontWeight: '500',
	},
	highlightBox: {
		padding: scaleHeight(10),
		backgroundColor: '#FFFBEB',
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: '#FBBF24',
	},
	highlightText: {
		fontSize: scaledSize(12),
		color: '#334155',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
		fontWeight: '500',
	},
	petScrollContainer: {
		marginTop: scaleHeight(12),
		marginBottom: scaleHeight(12),
	},
	petScrollContent: {
		paddingHorizontal: scaleWidth(3),
	},
	petItemBox: {
		width: scaleWidth(90),
		alignItems: 'center',
		padding: scaleWidth(6),
		borderRadius: scaleWidth(8),
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#CBD5E1',
		position: 'relative',
	},
	petImage: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(24),
		borderWidth: 2,
		borderColor: '#22C55E',
		marginBottom: scaleHeight(6),
	},
	petItemBoxCurrent: {
		borderColor: '#22C55E',
		borderWidth: 2,
		backgroundColor: '#EFF6FF',
	},
	petImageLocked: {
		opacity: 0.35,
		borderColor: '#CBD5E1',
	},
	petTextLocked: {
		color: '#94A3B8',
	},
	petEarnedCheck: {
		position: 'absolute',
		top: -scaleHeight(2),
		right: -scaleWidth(2),
		width: scaleWidth(16),
		height: scaleWidth(16),
		borderRadius: scaleWidth(8),
		backgroundColor: '#3B82F6',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1.5,
		borderColor: '#fff',
	},
	petLockOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: scaleHeight(6),
		alignItems: 'center',
		justifyContent: 'center',
	},
	petCurrentBadge: {
		marginTop: scaleHeight(4),
		backgroundColor: '#3B82F6',
		borderRadius: scaleWidth(10),
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(2),
	},
	petCurrentBadgeText: {
		fontSize: scaledSize(9),
		color: '#fff',
		fontWeight: '700',
	},
	stampImageWrap: {
		position: 'relative',
	},
	stampPetBadge: {
		position: 'absolute',
		right: -scaleWidth(6),
		bottom: scaleHeight(6),
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(28),
		borderWidth: 2,
		borderColor: '#fff',
		backgroundColor: '#fff',
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: scaleWidth(4),
	},
	stampPetImage: {
		width: '100%',
		height: '100%',
	},
	petLabelText: {
		fontSize: scaledSize(11),
		color: '#334155',
		fontWeight: '600',
		textAlign: 'center',
	},
	petStageText: {
		fontSize: scaledSize(10),
		color: '#64748B',
		marginTop: scaleHeight(2),
		textAlign: 'center',
	},
	arrowIcon: {
		position: 'absolute',
		right: -scaleWidth(8),
		top: '45%',
	},
	stampContainer: {
		alignItems: 'center',
	},
	stampImage: {
		width: scaleWidth(160),
		height: scaleWidth(160),
		marginBottom: scaleHeight(6),
		borderRadius: scaleWidth(80),
	},
	stampText: {
		fontSize: scaledSize(16),
		color: '#EF4444',
		fontWeight: 'bold',
		textShadowColor: 'rgba(0,0,0,0.2)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	calendarWrapper: {
		width: '100%',
		marginTop: scaleHeight(8),
		marginBottom: scaleHeight(8),
	},
	calendarContainer: {
		width: '100%',
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(4),
		overflow: 'hidden',
		backgroundColor: '#fff',
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
	},
	swipeHintRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(5),
		marginTop: scaleHeight(8),
	},
	swipeHintText: {
		fontSize: scaledSize(11),
		color: '#94A3B8',
		fontWeight: '600',
	},
	calendarHeaderText: {
		fontSize: scaledSize(15),
		fontWeight: '800',
		color: '#334155',
		textAlign: 'center',
		marginVertical: scaleHeight(10),
	},
	checkInCompleteText: {
		fontSize: scaledSize(14),
		color: '#22C55E',
		marginTop: scaleHeight(10),
		fontWeight: 'bold',
		textAlign: 'center',
	},
});
