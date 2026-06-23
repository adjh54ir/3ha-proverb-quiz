import { MainDataType } from '@/types/MainDataType';

/**
 * 일일 미션 유틸
 * - 오늘의 퀴즈 항목(TodayQuizList)에서 미션 진행도를 파생 계산합니다.
 * - 별도 추적/저장 없이 매일(새 날짜 항목) 자동 초기화됩니다.
 */
export interface DailyMission {
	id: string;
	label: string;
	iconType: string;
	icon: string;
	current: number;
	target: number;
	done: boolean;
}

/** 정답 목표 개수 */
const CORRECT_TARGET = 3;

export const computeDailyMissions = (todayItem?: MainDataType.TodayQuizList | null): DailyMission[] => {
	const total = todayItem?.todayQuizIdArr?.length ?? 5;
	const answerResults = todayItem?.answerResults ?? {};
	const answered = Object.keys(answerResults).length;
	// ✅ 정답 수도 answerResults(문항별 즉시 기록) 기준으로 계산 → 퀴즈 풀고 돌아오면 즉시 반영
	//    (correctQuizIdArr 은 완료 시점에만 갱신될 수 있어 즉각 반영이 안 됨)
	const correctFromResults = Object.values(answerResults).filter((v) => v === true).length;
	const correct = Math.max(correctFromResults, todayItem?.correctQuizIdArr?.length ?? 0);
	const checkedIn = todayItem?.isCheckedIn ?? false;

	return [
		{
			id: 'attend',
			label: '오늘 출석하기',
			iconType: 'materialIcons',
			icon: 'event-available',
			current: checkedIn ? 1 : 0,
			target: 1,
			done: checkedIn,
		},
		{
			id: 'solve',
			label: `오늘의 퀴즈 ${total}문제 풀기`,
			iconType: 'materialIcons',
			icon: 'quiz',
			current: Math.min(answered, total),
			target: total,
			done: total > 0 && answered >= total,
		},
		{
			id: 'correct',
			label: `정답 ${CORRECT_TARGET}개 이상 맞히기`,
			iconType: 'materialIcons',
			icon: 'check-circle',
			current: Math.min(correct, CORRECT_TARGET),
			target: CORRECT_TARGET,
			done: correct >= CORRECT_TARGET,
		},
	];
};

export const countDoneMissions = (missions: DailyMission[]): number => missions.filter((m) => m.done).length;

export const allMissionsDone = (missions: DailyMission[]): boolean =>
	missions.length > 0 && missions.every((m) => m.done);
