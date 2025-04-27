/**
 * 공통 타입을 관리하는 모듈
 */
export declare module MainDataType {
	/**
	 * 사용자 학습 데이터 정의
	 */
	export interface UserStudyHistory {
		studyProverbes: string[]; // 학습 속담 목록
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
	}
}
