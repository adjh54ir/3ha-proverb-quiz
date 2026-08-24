import { useCallback, useState } from 'react';
import { buildCheckedInMark } from '@/utils/CalendarMarkUtils';
import { calcStreak, StreakInfo } from '@/utils/StreakUtils';
import { AttendanceBadgeInterceptor } from '@/services/interceptor/AttendanceBadgeInterceptor';
import QuizHistoryService from '@/services/QuizHistoryService';
import * as TodayQuizService from '@/services/TodayQuizService';
import DateUtils from '@/utils/DateUtils';

/** 달력에 넘길 마킹 맵 */
export type MarkedDates = Record<string, ReturnType<typeof buildCheckedInMark>>;

/**
 * 출석 상태(오늘 출석 여부 / 달력 마킹 / 연속 출석 / 펫 레벨)를 한곳에서 관리한다.
 *
 * 홈 화면 안에 흩어져 있던 출석 로직을 모은 것으로, 저장소 접근은 전부
 * `TodayQuizService` 를 거치므로 다른 화면의 저장과 겹쳐도 값이 덮어써지지 않는다.
 */

/** 누적 출석일 → 펫 레벨(-1 = 아직 없음) */
export const getPetLevel = (checkInCount: number): number => {
	if (checkInCount >= 28) {
		return 4;
	}
	if (checkInCount >= 21) {
		return 3;
	}
	if (checkInCount >= 14) {
		return 2;
	}
	if (checkInCount >= 7) {
		return 1;
	}
	return checkInCount >= 1 ? 0 : -1;
};

export const useAttendance = () => {
	const [isCheckedIn, setIsCheckedIn] = useState(false);
	const [checkedInDates, setCheckedInDates] = useState<MarkedDates>({});
	const [petLevel, setPetLevel] = useState(-1);
	const [streakInfo, setStreakInfo] = useState<StreakInfo>({ current: 0, best: 0, total: 0, checkedToday: false });
	/** 이번에 새로 받은 출석 뱃지 id — 홈이 화면 목록에 합칠 때 쓴다 */
	const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);

	/** 저장된 출석일을 읽어 달력/스트릭/펫 레벨과 출석 뱃지를 갱신한다. */
	const refresh = useCallback(async () => {
		const todayStr = DateUtils.getLocalDateString();
		const dates = await TodayQuizService.getCheckedInDates();

		const marked: MarkedDates = {};
		dates.forEach((date) => {
			marked[date] = buildCheckedInMark(date === todayStr);
		});
		setCheckedInDates(marked);
		setPetLevel(getPetLevel(dates.length));
		setStreakInfo(calcStreak(dates, todayStr));
		setIsCheckedIn(dates.includes(todayStr));

		// 누적 출석일 기준 출석 뱃지 부여
		const existing = await QuizHistoryService.getBadgeList();
		const earned = AttendanceBadgeInterceptor(dates.length, existing);
		if (earned.length > 0) {
			const added = await QuizHistoryService.addBadges(earned);
			setEarnedBadgeIds((prev) => [...new Set([...prev, ...added])]);
		}
	}, []);

	/** 오늘 출석 처리 후 달력에 즉시 반영한다. */
	const checkIn = useCallback(async () => {
		await TodayQuizService.checkInToday();
		setIsCheckedIn(true);
		setCheckedInDates((prev) => ({ ...prev, [DateUtils.getLocalDateString()]: buildCheckedInMark(true) }));
	}, []);

	return { isCheckedIn, checkedInDates, petLevel, streakInfo, earnedBadgeIds, refresh, checkIn };
};
