import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainDataType } from '@/types/MainDataType';

const STORAGE_KEY_QUIZ = 'UserQuizHistory';
class QuizHistoryService {
	/**
	 * 퀴즈 기록 저장
	 */
	saveQuizHistory = async (data: MainDataType.UserQuizHistory): Promise<void> => {
		try {
			await AsyncStorage.setItem(STORAGE_KEY_QUIZ, JSON.stringify(data));
		} catch (error) {
			console.error('퀴즈 기록 저장 실패:', error);
		}
	};

	/**
	 * 퀴즈 기록 불러오기
	 */
	getQuizHistory = async (): Promise<MainDataType.UserQuizHistory | null> => {
		try {
			const stored = await AsyncStorage.getItem(STORAGE_KEY_QUIZ);
			if (!stored) return null;
			return JSON.parse(stored);
		} catch (error) {
			console.error('퀴즈 기록 불러오기 실패:', error);
			return null;
		}
	};

	/**
	 * 오답 속담 ID 배열 반환
	 */
	getWrongProverbIds = async (): Promise<number[]> => {
		const history = await this.getQuizHistory();
		return history?.wrongProverbId ?? [];
	};

	/**
	 * 정답 속담 ID 배열 반환
	 */
	getCorrectProverbIds = async (): Promise<number[]> => {
		const history = await this.getQuizHistory();
		return history?.correctProverbId ?? [];
	};

	/**
	 * 총 점수 반환
	 */
	getTotalScore = async (): Promise<number> => {
		const history = await this.getQuizHistory();
		return history?.totalScore ?? 0;
	};

	/**
	 * 마지막 퀴즈일 반환
	 */
	getLastAnsweredAt = async (): Promise<Date | null> => {
		const history = await this.getQuizHistory();
		return history?.lastAnsweredAt ? new Date(history.lastAnsweredAt) : null;
	};

	/**
	 * 베스트 콤보 반환
	 */
	getBestCombo = async (): Promise<number> => {
		const history = await this.getQuizHistory();
		return history?.bestCombo ?? 0;
	};

	/**
	 * 퀴즈 횟수 통계 반환
	 */
	getQuizCountMap = async (): Promise<{ [id: number]: number }> => {
		const history = await this.getQuizHistory();
		return history?.quizCounts ?? {};
	};

	/**
	 * 뱃지 목록 반환
	 */
	getBadgeList = async (): Promise<string[]> => {
		const history = await this.getQuizHistory();
		return history?.badges ?? [];
	};
}

export default new QuizHistoryService();
