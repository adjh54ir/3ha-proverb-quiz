/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Modal, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Calendar } from 'react-native-calendars';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';

interface CheckInModalProps {
	visible: boolean;
	isCheckedIn: boolean;
	checkedInDates: { [date: string]: any };
	mascot: any;
	showStamp: boolean;
	stampStyle: any;
	onClose: () => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ visible, isCheckedIn, checkedInDates, mascot, showStamp, stampStyle, onClose }) => {
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<TouchableOpacity style={styles.modalCloseIcon} onPress={onClose}>
						<IconComponent type="materialIcons" name="close" size={24} color="#555" />
					</TouchableOpacity>

					<Text style={styles.modalTitle}>오늘의 출석</Text>

					<ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: scaleHeight(20) }} showsVerticalScrollIndicator={false}>
						<View style={styles.rowCentered}>
							<FastImage source={mascot} style={styles.mascotImage} resizeMode={FastImage.resizeMode.cover} />
							<Text style={[styles.modalText, { flex: 1 }]}>매일 접속하면 퀴즈에서 얻은 나의 캐릭터가 출석 스탬프를 찍어줘요!{'\n'}</Text>
						</View>

						<View style={styles.highlightBox}>
							<Text style={styles.highlightText}>
								연속 출석을 통해 4단계로 진화하는 귀여운 펫도 함께 얻을 수 있답니다 🐾{'\n'}
								획득한 펫은 캐릭터 옆에 항상 따라다녀요!
							</Text>
						</View>

						<View style={styles.petScrollContainer}>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petScrollContent}>
								{[
									{ label: '7일 출석', image: require('@/assets/images/pet_level1_org.png') },
									{ label: '14일 출석', image: require('@/assets/images/pet_level2_org.png') },
									{ label: '21일 출석', image: require('@/assets/images/pet_level3_org.png') },
									{ label: '28일 출석', image: require('@/assets/images/pet_level4_org.png'), stage: '열매 친구' },
								].map((item, index, arr) => (
									<View key={index} style={[styles.petItemBox, { marginRight: index !== arr.length - 1 ? scaleWidth(10) : 0 }]}>
										<FastImage source={item.image} style={styles.petImage} resizeMode="contain" />
										<Text style={styles.petLabelText}>{item.label}</Text>
										<Text style={styles.petStageText}>{['새싹 친구', '잎사귀 친구', '꽃잎 친구', '만개 친구'][index]}</Text>

										{index < arr.length - 1 && <IconComponent name="chevron-right" type="fontAwesome" size={12} color="#7f8c8d" style={styles.arrowIcon} />}
									</View>
								))}
							</ScrollView>
						</View>

						<View style={styles.calendarWrapper}>
							<Calendar
								markingType="custom"
								markedDates={checkedInDates}
								disableAllTouchEventsForDisabledDays={true}
								theme={{
									todayTextColor: '#e74c3c',
									arrowColor: '#2ecc71',
									textDayFontSize: scaledSize(12),
									textMonthFontSize: scaledSize(14),
									textDayHeaderFontSize: scaledSize(11),
									calendarBackground: '#ffffff',
									textSectionTitleColor: '#2c3e50',
									selectedDayBackgroundColor: '#27ae60',
									selectedDayTextColor: '#ffffff',
									dayTextColor: '#2c3e50',
									textDisabledColor: '#d9e1e8',
								}}
								renderHeader={(date) => {
									const year = date.getFullYear();
									const month = (date.getMonth() + 1).toString().padStart(2, '0');
									return <Text style={styles.calendarHeaderText}>{`${year}년 ${month}월`} 출석</Text>;
								}}
								hideArrows
								style={styles.calendarContainer}
							/>
						</View>

						{showStamp && (
							<Animated.View style={[stampStyle, styles.stampContainer]}>
								<FastImage source={mascot} style={styles.stampImage} resizeMode="contain" />
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
		color: '#2c3e50',
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
		borderColor: '#27ae60',
		marginRight: scaleWidth(10),
	},
	modalText: {
		fontSize: scaledSize(13),
		color: '#2c3e50',
		lineHeight: scaleHeight(20),
		marginTop: scaleHeight(6),
		fontWeight: '500',
	},
	highlightBox: {
		padding: scaleHeight(10),
		backgroundColor: '#fef9e7',
		borderRadius: scaleWidth(10),
		borderWidth: 1,
		borderColor: '#f1c40f',
	},
	highlightText: {
		fontSize: scaledSize(12),
		color: '#2c3e50',
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
		backgroundColor: '#f8f9fa',
		borderWidth: 1,
		borderColor: '#dcdcdc',
		position: 'relative',
	},
	petImage: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(24),
		borderWidth: 2,
		borderColor: '#27ae60',
		marginBottom: scaleHeight(6),
	},
	petLabelText: {
		fontSize: scaledSize(11),
		color: '#2c3e50',
		fontWeight: '600',
		textAlign: 'center',
	},
	petStageText: {
		fontSize: scaledSize(10),
		color: '#7f8c8d',
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
		color: '#e74c3c',
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
		width: '100%', // ✅ 100%로 유지
		borderRadius: scaleWidth(8),
		borderWidth: 1,
		borderColor: '#27ae60',
		overflow: 'hidden',
	},
	calendarHeaderText: {
		fontSize: scaledSize(16), // ✅ 폰트 크기 조정
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
		marginVertical: scaleHeight(12), // ✅ 여백 조정
	},
	checkInCompleteText: {
		fontSize: scaledSize(14),
		color: '#27ae60',
		marginTop: scaleHeight(10),
		fontWeight: 'bold',
		textAlign: 'center',
	},
});
