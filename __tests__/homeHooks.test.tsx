import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAttendance, getPetLevel } from '@/hooks/home/useAttendance';
import { useHomeProgress } from '@/hooks/home/useHomeProgress';
import * as TodayQuizService from '@/services/TodayQuizService';
import QuizHistoryService from '@/services/QuizHistoryService';
import { __resetQueues } from '@/services/StorageService';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import DateUtils from '@/utils/DateUtils';

/** 훅을 렌더해서 반환값을 밖으로 꺼내 준다. */
const renderHook = async <T,>(hook: () => T): Promise<{ current: () => T }> => {
	let latest!: T;
	const Probe = () => {
		latest = hook();
		return <Text>probe</Text>;
	};
	await act(async () => {
		create(<Probe />);
	});
	return { current: () => latest };
};

beforeEach(async () => {
	await AsyncStorage.clear();
	__resetQueues();
});

describe('getPetLevel', () => {
	it('누적 출석일에 따라 펫 단계가 올라간다', () => {
		expect(getPetLevel(0)).toBe(-1);
		expect(getPetLevel(1)).toBe(0);
		expect(getPetLevel(7)).toBe(1);
		expect(getPetLevel(14)).toBe(2);
		expect(getPetLevel(21)).toBe(3);
		expect(getPetLevel(28)).toBe(4);
		expect(getPetLevel(100)).toBe(4);
	});
});

describe('useAttendance', () => {
	it('출석하면 오늘이 달력에 표시되고 저장에도 남는다', async () => {
		const today = DateUtils.getLocalDateString();
		const hook = await renderHook(() => useAttendance());

		await act(async () => {
			await hook.current().refresh();
		});
		expect(hook.current().isCheckedIn).toBe(false);

		await act(async () => {
			await hook.current().checkIn();
		});

		expect(hook.current().isCheckedIn).toBe(true);
		expect(Object.keys(hook.current().checkedInDates)).toContain(today);
		expect(await TodayQuizService.getCheckedInDates()).toContain(today);
	});

	it('출석일이 쌓이면 펫 레벨과 연속 출석이 갱신된다', async () => {
		await TodayQuizService.checkInToday();
		const hook = await renderHook(() => useAttendance());

		await act(async () => {
			await hook.current().refresh();
		});

		expect(hook.current().petLevel).toBe(0); // 1일 출석 → 첫 펫
		expect(hook.current().streakInfo.current).toBe(1);
	});
});

describe('useHomeProgress', () => {
	it('저장된 점수와 뱃지를 읽어 온다', async () => {
		await QuizHistoryService.saveQuizHistory({
			correctProverbId: [1],
			wrongProverbId: [],
			lastAnsweredAt: new Date(),
			quizCounts: {},
			badges: ['quiz_1'],
			totalScore: 120,
		});

		const hook = await renderHook(() => useHomeProgress());
		await act(async () => {
			await hook.current().refresh();
		});

		expect(hook.current().status).toBe('ready');
		expect(hook.current().progress.totalScore).toBe(120);
		expect(hook.current().progress.badgeIds).toContain('quiz_1');
	});

	it('기록이 없으면 0점이지만 상태는 정상(ready)이다', async () => {
		const hook = await renderHook(() => useHomeProgress());
		await act(async () => {
			await hook.current().refresh();
		});

		expect(hook.current().status).toBe('ready');
		expect(hook.current().progress.totalScore).toBe(0);
	});

	it('읽기가 실패하면 0점이 아니라 error 상태로 알린다', async () => {
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		jest.spyOn(QuizHistoryService, 'getQuizHistoryOrEmpty').mockRejectedValueOnce(new Error('저장소 고장'));

		const hook = await renderHook(() => useHomeProgress());
		await act(async () => {
			await hook.current().refresh();
		});

		expect(hook.current().status).toBe('error');
		jest.restoreAllMocks();
	});

	it('등급이 올라가면 레벨업 데이터를 채운다', async () => {
		// 이전에 확인한 등급을 0점 등급으로 기록해 둔다
		await AsyncStorage.setItem(MainStorageKeyType.LAST_SEEN_GRADE, JSON.stringify(0));
		await QuizHistoryService.saveQuizHistory({
			correctProverbId: [],
			wrongProverbId: [],
			lastAnsweredAt: new Date(),
			quizCounts: {},
			badges: [],
			totalScore: 100_000, // 확실히 상위 등급
		});

		const hook = await renderHook(() => useHomeProgress());
		await act(async () => {
			await hook.current().refresh();
		});

		expect(hook.current().levelUp).not.toBeNull();
	});
});

describe('TodayQuizService', () => {
	it('오늘 항목이 없으면 만들고, 이미 있으면 그대로 둔다', async () => {
		const first = await TodayQuizService.ensureToday();
		expect(first.todayQuizIdArr).toHaveLength(TodayQuizService.TODAY_QUIZ_COUNT);

		const second = await TodayQuizService.ensureToday();
		// 다시 만들면 문제가 바뀌어 버린다 — 같은 문제여야 한다
		expect(second.todayQuizIdArr).toEqual(first.todayQuizIdArr);
		expect(await TodayQuizService.getAll()).toHaveLength(1);
	});

	it('동시에 출석과 정답 기록이 들어와도 서로 덮어쓰지 않는다', async () => {
		await TodayQuizService.ensureToday();

		await Promise.all([
			TodayQuizService.checkInToday(),
			TodayQuizService.patchToday(() => ({ correctQuizIdArr: [7] })),
		]);

		const today = await TodayQuizService.getToday();
		expect(today?.isCheckedIn).toBe(true);
		expect(today?.correctQuizIdArr).toEqual([7]);
	});
});
