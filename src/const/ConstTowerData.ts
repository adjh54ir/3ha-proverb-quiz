// @/const/ConstTowerData.ts
export const TOWER_LEVELS = [
	{
		id: 1, // ← 추가
		level: 1,
		name: '초급 탑',
		bossName: '먹보 멧돼지 꿀꿀이',
		bossTitle: '🐗 레벨 1 보스',
		bossDescription: '도깨비의 메밀묵을 훔쳐 먹으려는 숲속의 골칫덩이 멧돼지',
		bossImage: require('@/assets/images/boss/boss1.png'),
		questions: [], // ← 추가 (사용하지 않으면 빈 배열)
		requiredScore: 0,
		reward: {
			type: 'costume',
			name: '초급 모자',
			image: require('@/assets/images/costumes/beginner_hat.png'),
		},
		color: '#82c91e', // 연두색 (멧돼지)
		backgroundColor: '#f1f8e9',
		clearCondition: '초급 문제 전체 클리어',
	},
	{
		id: 2, // ← 추가
		level: 2,
		name: '중급 탑',
		bossName: '바위 거인 옹고집',
		bossTitle: '🗿 레벨 2 보스',
		bossDescription: '바위산의 입구를 가로막고 있는 고집불통 거인. 오직 퀴즈로만 길을 비켜줌',
		questions: [], // ← 추가 (사용하지 않으면 빈 배열)
		bossImage: require('@/assets/images/boss/boss2.png'),
		requiredScore: 100,
		reward: {
			type: 'costume',
			name: '중급 망토',
			image: require('@/assets/images/costumes/intermediate_cape.png'),
		},
		color: '#8d6e63', // 갈색 (바위)
		backgroundColor: '#efebe9',
		clearCondition: '중급 문제 전체 클리어',
	},
	{
		id: 3, // ← 추가
		level: 3,
		name: '고급 탑',
		bossName: '천년 묵은 구미호 매혹',
		questions: [], // ← 추가 (사용하지 않으면 빈 배열)
		bossTitle: '🦊 레벨 3 보스',
		bossDescription: '골짜기의 안개 속에서 나타나는 신비롭고 영악한 여우 요괴',
		bossImage: require('@/assets/images/boss/boss3.png'),
		requiredScore: 300,
		clearCondition: '고급 문제 전체 클리어',
		reward: {
			type: 'character',
			name: '전설의 한글 수호자',
			image: require('@/assets/images/costumes/legendary_guardian.png'),
		},
		color: '#9c27b0', // 보라색 (신비)
		backgroundColor: '#f3e5f5',
	},
	{
		id: 4, // ← 추가
		level: 4,
		name: '최종 탑',
		bossName: '도깨비 왕 염라',
		questions: [], // ← 추가 (사용하지 않으면 빈 배열)
		bossTitle: '👹 레벨 4 최종 보스',
		bossDescription: '거대한 어사화를 쓰고 황금 방망이를 든, 위엄 넘치는 도깨비들의 군주',
		bossImage: require('@/assets/images/boss/boss4.png'),
		requiredScore: 600,
		reward: {
			type: 'character',
			name: '황금 도깨비 방망이',
			image: require('@/assets/images/costumes/golden_hammer.jpg'),
		},
		color: '#d32f2f', // 붉은색 (도깨비)
		backgroundColor: '#ffebee',
		clearCondition: '특급 문제 전체 클리어',
	},
];

export interface TowerProgress {
	level: number;
	attempts: number;
	adRewardUsed: number;
	completedLevels: number[];
	currentQuestion: number;
	correctAnswers: number;
	lastAttemptDate: string;
	unlockedRewards: number[]; // 획득한 보상 ID
	badges?: string[]; // ✅ 추가
}
