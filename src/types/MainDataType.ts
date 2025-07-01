/**
 * 공통 타입을 관리하는 모듈
 */
export declare namespace MainDataType {
	/**
	 * 사용자 학습 데이터 정의
	 */
	export interface UserStudyHistory {
		studyProverbes: number[]; // 학습 속담 목록
		studyCounts?: { [id: string]: number }; // 각 속담별 학습 횟수 (선택)
		badges?: string[]; // ✅ 학습 뱃지 ID 목록 추가
		lastStudyAt: Date;
	}

	/**
	 * 속담 데이터를 관리합니다.
	 */
	export type Proverb = {
		id: number; // 고유 식별자 (1부터 시작하는 번호)
		proverb: string; // 속담 본문 (ex: "가는 말이 고와야 오는 말이 곱다")
		meaning: string; // 속담의 의미 설명 (문장형, 존댓말 처리)
		longMeaning: string; // 우리말샘의 긴 의미
		sameProverb?: string[]; // 같은 의미
		category: string; // 속담이 속하는 카테고리 (ex: 인간관계, 세상 이치 등)
		level: number; // 난이도 숫자 (1: 아주 쉬움, 2: 쉬움, 3: 보통, 4: 어려움)
		levelName: string; // 난이도 이름 (ex: "쉬움", "보통" 등 텍스트)
		example: string; // 속담을 활용한 예시 문장
		origin: string; // 속담의 유래나 배경 설명
		usageTip: string; // 속담을 사용할 수 있는 팁 또는 상황 설명
		synonym: string | null; // 비슷한 의미의 다른 속담 (없으면 null)
		antonym: string | null; // 반대 의미의 속담 (없으면 null)
		difficultyScore: number; // 난이도를 세분화한 점수 (1~100 범위)
	};

	/**
	 * 사용자 뱃지 데이터 정의
	 */
	export interface UserBadge {
		id: string; // 'asia_master'
		name: string; // '아시아 마스터'
		description: string; // '아시아 국가 정답률 90% 이상'
		iconType: string; // 아이콘 타입(FontAwesome6)
		icon: string; // 아이콘 이름(earth-asia)
		type: 'quiz' | 'study';
	}
	/**
	 * 사용자 퀴즈 데이터 정의
	 */
	export interface UserQuizHistory {
		correctProverbId: number[]; // 사용자가 정답을 맞춘 속담의 아이디 목록 (예: [1, 2])
		wrongProverbId: number[]; // 사용자가 오답을 선택한 속담의 아이디 목록
		lastAnsweredAt: Date; // 마지막으로 퀴즈를 푼 시간 (Date 객체 또는 ISO 문자열)
		quizCounts: { [id: number]: number }; // 각 속담별 퀴즈 시도 횟수 (key는 사용자 아이디)
		badges: string[]; // 사용자가 획득한 뱃지의 ID 목록 (ex: ['asia_master', 'level1_perfect'])
		totalScore: number; // 사용자의 퀴즈 총 누적 점수
		bestCombo?: number; // 사용자가 기록한 가장 높은 연속 정답 수 (선택 값)
	}
	/**
	 * [공통] 설정 정보 관리
	 */
	export interface SettingInfo {
		isUseAlarm: boolean; // 알람 여부
		alarmTime: string; // 예: '2025-06-17T10:15:00' (ISO 형식의 문자열)
	}
	interface TodayQuizList {
		quizDate: string;
		isCheckedIn: boolean;
		todayQuizIdArr: number[];
		correctQuizIdArr: number[];
		worngQuizIdArr: number[];
		answerResults: { [quizId: number]: boolean };
		selectedAnswers: {
			[quizId: number]: {
				value: string; // 보기 텍스트
				index: number; // 몇 번째 보기인지 (0부터 시작)
			};
		};
		prevQuizIdArr?: number[];
	}
	type AllTodayQuizzes = TodayQuizList[];

	// 개별 타임 챌린지 결과 타입
	export interface TimeChallengeResult {
		quizDate: string; // 챌린지를 푼 날짜 (예: '2025-06-18')
		finalScore: number; // 최종 획득 점수
		totalQuestions: number; // 출제된 전체 문제 수
		solvedQuestions: number; // 실제로 푼 문제 수 (정답 + 오답)
		correctCount: number; // 맞힌 문제 수
		wrongCount: number; // 틀린 문제 수
		maxCombo: number; // 최대 연속 정답 콤보 수
		timeUsedMs: number; // 사용한 시간 (단위: 밀리초)
		hasUsedChance: boolean; // 찬스 사요여부
		hasUsedSkip: boolean; // 스킵 기능을 사용했는지 여부
		quizIdList: number[]; // 출제된 사자성어 ID 목록
		correctQuizIdList: number[]; // 정답 맞춘 문제의 ID 목록
		wrongQuizIdList: number[]; // 오답 문제의 ID 목록
	}
	// 전체 타임 챌린지 기록 배열 타입
	export type TimeChallengeHistory = TimeChallengeResult[];
}
