import { StyleSheet, View, TouchableOpacity, Text, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePicker from 'react-native-date-picker';
import {
	RequestNotificationPermission,
	DirectNotification,
	TriggerWeeklyNotification,
	TriggerDailyNotification,
} from '../../../utils/NotifactionHelper';

// 알림 설정을 위한 Storage keys
const WEEKLY_NOTIFICATION_KEY = 'weeklyNotificationEnabled';
const DAILY_NOTIFICATION_KEY = 'dailyNotificationEnabled';
const DIRECT_NOTIFICATION_KEY = 'directNotificationEnabled';
const WEEKLY_TIME_KEY = 'weeklyNotificationTime';
const WEEKLY_DAY_KEY = 'weeklyNotificationDay';
const DAILY_TIME_KEY = 'dailyNotificationTime';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const NotifeeExample: React.FC = () => {
	// 주간 알림 상태
	const [weeklyEnabled, setWeeklyEnabled] = useState(false);
	const [weeklyTime, setWeeklyTime] = useState(new Date());
	const [selectedDay, setSelectedDay] = useState(6);
	const [isWeeklyTimePickerOpen, setWeeklyTimePickerOpen] = useState(false);

	// 매일 알림 상태
	const [dailyEnabled, setDailyEnabled] = useState(false);
	const [dailyTime, setDailyTime] = useState(new Date());
	const [isDailyTimePickerOpen, setDailyTimePickerOpen] = useState(false);

	// 즉시 알림 상태
	const [directEnabled, setDirectEnabled] = useState(false);
	const [directTitle, setDirectTitle] = useState('즉시 알림');
	const [directMessage, setDirectMessage] = useState('알림 테스트입니다.');

	// 초기 설정 로드
	useEffect(() => {
		loadSettings();
	}, []);

	// 알림 설정 변경시 알림 스케줄 업데이트
	useEffect(() => {
		const initializeNotifications = async () => {
			const hasPermission = await RequestNotificationPermission();
			if (hasPermission) {
				await scheduleNotifications();
			}
		};
		initializeNotifications();
	}, [weeklyEnabled, dailyEnabled, weeklyTime, dailyTime, selectedDay]);

	const loadSettings = async () => {
		try {
			const [weeklyState, dailyState, directState, weeklyTimeState, dailyTimeState, dayState] = await Promise.all([
				AsyncStorage.getItem(WEEKLY_NOTIFICATION_KEY),
				AsyncStorage.getItem(DAILY_NOTIFICATION_KEY),
				AsyncStorage.getItem(DIRECT_NOTIFICATION_KEY),
				AsyncStorage.getItem(WEEKLY_TIME_KEY),
				AsyncStorage.getItem(DAILY_TIME_KEY),
				AsyncStorage.getItem(WEEKLY_DAY_KEY),
			]);

			setWeeklyEnabled(weeklyState === 'true');
			setDailyEnabled(dailyState === 'true');
			setDirectEnabled(directState === 'true');

			if (weeklyTimeState) {
				setWeeklyTime(new Date(weeklyTimeState));
			}
			if (dailyTimeState) {
				setDailyTime(new Date(dailyTimeState));
			}
			if (dayState) {
				setSelectedDay(parseInt(dayState));
			}
		} catch (error) {
			console.error('설정 로드 실패:', error);
		}
	};

	const handleWeeklyUpdate = async (value: boolean) => {
		try {
			await AsyncStorage.setItem(WEEKLY_NOTIFICATION_KEY, value.toString());
			setWeeklyEnabled(value);
		} catch (error) {
			console.error('주간 알림 설정 업데이트 실패:', error);
		}
	};

	const handleDailyUpdate = async (value: boolean) => {
		try {
			await AsyncStorage.setItem(DAILY_NOTIFICATION_KEY, value.toString());
			setDailyEnabled(value);
		} catch (error) {
			console.error('매일 알림 설정 업데이트 실패:', error);
		}
	};

	const handleDirectUpdate = async (value: boolean) => {
		try {
			await AsyncStorage.setItem(DIRECT_NOTIFICATION_KEY, value.toString());
			setDirectEnabled(value);
		} catch (error) {
			console.error('즉시 알림 설정 업데이트 실패:', error);
		}
	};

	const handleWeeklyTimeUpdate = async (date: Date) => {
		try {
			await AsyncStorage.setItem(WEEKLY_TIME_KEY, date.toISOString());
			setWeeklyTime(date);
			setWeeklyTimePickerOpen(false);
		} catch (error) {
			console.error('주간 알림 시간 설정 실패:', error);
		}
	};

	const handleDailyTimeUpdate = async (date: Date) => {
		try {
			await AsyncStorage.setItem(DAILY_TIME_KEY, date.toISOString());
			setDailyTime(date);
			setDailyTimePickerOpen(false);
		} catch (error) {
			console.error('매일 알림 시간 설정 실패:', error);
		}
	};

	const handleDayUpdate = async (day: number) => {
		try {
			await AsyncStorage.setItem(WEEKLY_DAY_KEY, day.toString());
			setSelectedDay(day);
		} catch (error) {
			console.error('요일 설정 업데이트 실패:', error);
		}
	};

	const scheduleNotifications = async () => {
		if (weeklyEnabled) {
			await TriggerWeeklyNotification(
				'주간 알림',
				'주간 알림 시간입니다.',
				weeklyTime.getHours(),
				weeklyTime.getMinutes(),
				selectedDay,
			);
		}

		if (dailyEnabled) {
			await TriggerDailyNotification('매일 알림', '매일 알림 시간입니다!', dailyTime.getHours(), dailyTime.getMinutes());
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.header}>알림 설정</Text>

			{/* 즉시 알림 섹션 */}
			<View style={styles.section}>
				<Text style={styles.title}>즉시 알림 설정</Text>
				<View style={styles.row}>
					<Text>알림 사용</Text>
					<Switch value={directEnabled} onValueChange={handleDirectUpdate} />
				</View>
				{directEnabled && (
					<>
						<Text style={styles.subTitle}>알림 제목:</Text>
						<TouchableOpacity style={styles.timeSelectButton} onPress={() => DirectNotification(directTitle, directMessage)}>
							<Text style={styles.timeSelectButtonText}>즉시 알림 전송</Text>
						</TouchableOpacity>
					</>
				)}
			</View>
			{/* 매일 알림 섹션 */}
			<View style={styles.section}>
				<Text style={styles.title}>매일 알림 설정</Text>
				<View style={styles.row}>
					<Text>알림 사용</Text>
					<Switch value={dailyEnabled} onValueChange={handleDailyUpdate} />
				</View>
				{dailyEnabled && (
					<>
						<Text style={styles.subTitle}>시간 설정:</Text>
						<TouchableOpacity style={styles.timeSelectButton} onPress={() => setDailyTimePickerOpen(true)}>
							<Text style={styles.timeSelectButtonText}>
								{`${dailyTime.getHours()}:${String(dailyTime.getMinutes()).padStart(2, '0')}`}
							</Text>
						</TouchableOpacity>

						<DatePicker
							modal
							open={isDailyTimePickerOpen}
							date={dailyTime}
							mode='time'
							onConfirm={handleDailyTimeUpdate}
							onCancel={() => setDailyTimePickerOpen(false)}
							title='매일 알림 시간 선택'
							confirmText='확인'
							cancelText='취소'
						/>
					</>
				)}
			</View>

			{/* 주간 알림 섹션 */}
			<View style={styles.section}>
				<Text style={styles.title}>주간 알림 설정</Text>
				<View style={styles.row}>
					<Text>알림 사용</Text>
					<Switch value={weeklyEnabled} onValueChange={handleWeeklyUpdate} />
				</View>
				{weeklyEnabled && (
					<>
						<Text style={styles.subTitle}>요일 선택:</Text>
						<View style={styles.dayButtons}>
							{DAYS_OF_WEEK.map((day, index) => (
								<TouchableOpacity
									key={index}
									style={[styles.dayBtn, selectedDay === index && styles.dayBtnSelected]}
									onPress={() => handleDayUpdate(index)}>
									<Text style={selectedDay === index ? styles.dayBtnTextSelected : styles.dayBtnText}>{day}</Text>
								</TouchableOpacity>
							))}
						</View>
						<Text style={styles.subTitle}>시간 설정:</Text>
						<TouchableOpacity style={styles.timeSelectButton} onPress={() => setWeeklyTimePickerOpen(true)}>
							<Text style={styles.timeSelectButtonText}>
								{`${weeklyTime.getHours()}:${String(weeklyTime.getMinutes()).padStart(2, '0')}`}
							</Text>
						</TouchableOpacity>

						<DatePicker
							modal
							open={isWeeklyTimePickerOpen}
							date={weeklyTime}
							mode='time'
							onConfirm={handleWeeklyTimeUpdate}
							onCancel={() => setWeeklyTimePickerOpen(false)}
							title='주간 알림 시간 선택'
							confirmText='확인'
							cancelText='취소'
						/>
					</>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#fff',
	},
	header: {
		fontSize: 24,
		fontWeight: '600',
		marginBottom: 24,
	},
	section: {
		backgroundColor: '#f8f9fa',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: '500',
		marginBottom: 12,
	},
	subTitle: {
		fontSize: 16,
		marginTop: 12,
		marginBottom: 8,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: 8,
	},
	dayButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 8,
	},
	dayBtn: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: '#e9ecef',
	},
	dayBtnSelected: {
		backgroundColor: '#228be6',
	},
	dayBtnText: {
		color: '#495057',
	},
	dayBtnTextSelected: {
		color: '#fff',
	},
	timeSelectButton: {
		backgroundColor: '#e9ecef',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	timeSelectButtonText: {
		fontSize: 16,
		color: '#495057',
	},
});

export default NotifeeExample;
