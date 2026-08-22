import { useCallback, useState } from 'react';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { allMissionsDone, computeDailyMissions, countDoneMissions } from '@/utils/DailyMissionUtils';
import DateUtils from '@/utils/DateUtils';
import { read } from '@/services/StorageService';
import * as TodayQuizService from '@/services/TodayQuizService';

export interface MissionSummary {
	done: number;
	total: number;
	allDone: boolean;
	claimed: boolean;
}

const INITIAL: MissionSummary = { done: 0, total: 3, allDone: false, claimed: false };

/**
 * 홈 하단 '오늘의 미션' 칩에 표시할 진행도 요약.
 * 미션 자체 계산은 `DailyMissionUtils`, 저장소 접근은 서비스에 맡긴다.
 */
export const useDailyMissionSummary = () => {
	const [summary, setSummary] = useState<MissionSummary>(INITIAL);

	const refresh = useCallback(async () => {
		const today = DateUtils.getLocalDateString();
		const [todayItem, claimedList] = await Promise.all([
			TodayQuizService.getToday(),
			read<string[]>(MainStorageKeyType.DAILY_MISSION_CLAIMED, []),
		]);
		const missions = computeDailyMissions(todayItem);
		setSummary({
			done: countDoneMissions(missions),
			total: missions.length,
			allDone: allMissionsDone(missions),
			claimed: claimedList.includes(today),
		});
	}, []);

	return { summary, refresh };
};
