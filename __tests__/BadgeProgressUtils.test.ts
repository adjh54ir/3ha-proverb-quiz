/**
 * 뱃지 진행도 계산 회귀 테스트
 *
 * 조건 문구가 아니라 뱃지 id 와 저장된 기록에서 진행도를 뽑는다는 것이 이 유틸의 전제다.
 * 지급 로직(인터셉터)과 기준이 갈라지면 "다 채웠는데 안 나온다"가 되므로 여기서 고정해 둔다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '../src/types/MainStorageKeyType';

jest.mock('../src/services/ProverbServices', () => ({
	__esModule: true,
	default: {
		selectProverbList: () => [
			{ id: 1, levelName: '초급', category: '운/우연' },
			{ id: 2, levelName: '초급', category: '인간관계' },
			{ id: 3, levelName: '중급', category: '운/우연' },
		],
	},
}));

const { getBadgeProgress } = require('../src/utils/BadgeProgressUtils');

beforeEach(async () => {
	await AsyncStorage.clear();
	await AsyncStorage.multiSet([
		[MainStorageKeyType.USER_QUIZ_HISTORY, JSON.stringify({ correctProverbId: [1, 2], wrongProverbId: [3], totalScore: 450, bestCombo: 7 })],
		[MainStorageKeyType.USER_STUDY_HISTORY, JSON.stringify({ studyProverbes: [1, 2] })],
		[
			MainStorageKeyType.TODAY_QUIZ_LIST,
			JSON.stringify([
				{ quizDate: '2026-08-20', isCheckedIn: true, todayQuizIdArr: [1, 2], answerResults: { 1: true, 2: false } },
				{ quizDate: '2026-08-21', isCheckedIn: true, todayQuizIdArr: [1, 2], answerResults: { 1: true } },
			]),
		],
	]);
});

test('누적 카운트형 뱃지는 id 의 숫자를 목표로 삼는다', async () => {
	await expect(getBadgeProgress('study_10')).resolves.toEqual({ current: 2, goal: 10, unit: '개 학습' });
	await expect(getBadgeProgress('quiz_50')).resolves.toEqual({ current: 3, goal: 50, unit: '문제 풀이' });
	await expect(getBadgeProgress('combo_10')).resolves.toEqual({ current: 7, goal: 10, unit: '연속 정답' });
	await expect(getBadgeProgress('score_1000')).resolves.toEqual({ current: 450, goal: 1000, unit: '점' });
});

test('출석은 날짜 기준, 오늘의 퀴즈는 끝까지 푼 날만 센다', async () => {
	await expect(getBadgeProgress('attend_5')).resolves.toEqual({ current: 2, goal: 5, unit: '일 출석' });
	// 2026-08-21 은 2문제 중 1문제만 답해 완료로 치지 않는다
	await expect(getBadgeProgress('today_5')).resolves.toEqual({ current: 1, goal: 5, unit: '일 완료' });
});

test('정복형 뱃지는 해당 난이도·카테고리 전체 수를 목표로 삼는다', async () => {
	await expect(getBadgeProgress('level_easy_1')).resolves.toEqual({ current: 2, goal: 2, unit: '문제 풀이' });
	await expect(getBadgeProgress('category_luck')).resolves.toEqual({ current: 2, goal: 2, unit: '문제 풀이' });
	await expect(getBadgeProgress('quiz_all')).resolves.toEqual({ current: 3, goal: 3, unit: '문제 풀이' });
});

test('셀 수 없는 뱃지는 null 을 돌려준다(막대를 감춘다)', async () => {
	await expect(getBadgeProgress('unknown_badge')).resolves.toBeNull();
});
