import { MainDataType } from '@/types/MainDataType';
/*
=========================================
📚 학습 관련 뱃지
=========================================
- 첫 학습: 🎈 첫 속담을 학습했어요! 시작이 반이에요!
- 10개 학습: 📝 속담 10개 돌파! 슬슬 감이 오죠?
- 50개 학습: 📖 속담 50개 달성! 지식이 쌓이고 있어요!
- 100개 학습: 🎓 속담 100개 학습! 당신은 진정한 학자!
- 200개 학습: 🧠 무려 200개! 속담 마스터의 길에 들어섰어요!
- 학습 완료: 🌟 모든 속담을 학습 완료! 완벽한 정복이에요!

=========================================
🧠 퀴즈 관련 뱃지
=========================================
- 첫 퀴즈 완료: 🚀 첫 문제 풀기 성공! 이제 진짜 시작이에요!
- 10개 퀴즈 완료: ✍️ 10문제 돌파! 꾸준함이 빛나요!
- 50개 퀴즈 완료: 🏅 50문제 클리어! 퀴즈 고수의 기운이!
- 100개 퀴즈 완료: 🧭 100문제 완주! 대단한 집중력이에요!
- 150개 퀴즈 완료: 🎖️ 벌써 150개? 이건 거의 대륙 탐험이죠!
- 200개 퀴즈 완료: 🌍 200문제! 당신은 퀴즈의 전설!
- 퀴즈 완료: 🌈 모든 문제 완료! 세계 정복 완료예요!

=========================================
🎯 레벨별 마스터 뱃지
(난이도별 완벽 정복)
=========================================
- 아주 쉬움 마스터: 🌱 기초 속담은 다 외웠어요! 깔끔한 출발!
- 쉬움 마스터: 🍃 쉬운 속담도 완벽하게 마스터!
- 보통 마스터: 🌳 보통 난이도? 문제없죠!
- 어려움 마스터: 🧠 어려운 속담까지 모두 정복했어요!

=========================================
💬 카테고리별 마스터 뱃지
(속담 주제 정복자)
=========================================
- 운/우연 마스터: 🍀 운과 우연에 관한 속담을 전부 익혔어요!
- 인간관계 마스터: 👫 관계의 지혜, 당신은 인간관계 달인!
- 세상 이치 마스터: 🌐 세상 돌아가는 이치, 속담으로 다 알았죠!
- 근면/검소 마스터: 🧺 성실과 절약, 삶의 기본이죠!
- 노력/성공 마스터: 🏃‍♂️ 노력 끝에 성공한 자에게!
- 경계/조심 마스터: ⚠️ 조심 또 조심! 지혜롭게 살아가요!
- 욕심/탐욕 마스터: 🤑 욕심에 관한 교훈, 뼛속까지 새겼어요!
- 배신/불신 마스터: 🤝 신뢰의 중요성, 확실히 배웠네요!

=========================================
🔥 콤보 달성 뱃지
(연속 정답의 쾌감!)
=========================================
- 콤보 3: 🔥 연속 3문제! 워밍업 완료!
- 콤보 5: 🔥🔥 집중력 5단계 돌입!
- 콤보 10: 🔥🔥🔥 집중력 끝판왕 등장!
- 콤보 15: 🔥🔥🔥🔥 불꽃처럼 타오르고 있어요!
- 콤보 20: ⚡ 전설의 20콤보! 퀴즈 신이시군요!

=========================================
🏆 점수 달성 뱃지
(누적 점수로 보는 성장)
=========================================
- 600점: ✈️ 퀴즈 여행을 시작했어요! 첫 발걸음 축하해요!
- 1200점: 🏞️ 대륙을 넘나드는 정복자!
- 1800점: 🧳 국가 탐험가! 이제 세계가 무대예요!
- 2460점: 👑 속담 마스터! 전 세계 속담을 정복했어요!
*/
export const CONST_BADGES: MainDataType.UserBadge[] = [
	// 학습 뱃지
	{
		id: 'study_1',
		name: '시작이 반이다',
		description: '첫 번째 속담을 학습했어요! 시작이 반이에요!',
		iconType: 'materialIcons',
		icon: 'school',
		type: 'study',
	},
	{
		id: 'study_10',
		name: '10개 학습 완료',
		description: '속담 10개 돌파! 슬슬 감이 오죠?',
		iconType: 'materialIcons',
		icon: 'travel-explore',
		type: 'study',
	},
	{
		id: 'study_50',
		name: '50개 학습 완료',
		description: '속담 50개 달성! 지식이 쌓이고 있어요!',
		iconType: 'materialIcons',
		icon: 'menu-book',
		type: 'study',
	},
	{
		id: 'study_100',
		name: '100개 학습 완료',
		description: '속담 100개 학습! 당신은 진정한 학자!',
		iconType: 'materialIcons',
		icon: 'public',
		type: 'study',
	},
	{
		id: 'study_200',
		name: '200개 학습 완료',
		description: '무려 200개! 속담 마스터의 길에 들어섰어요!',
		iconType: 'materialIcons',
		icon: 'school',
		type: 'study',
	},
	{
		id: 'study_300',
		name: '300개 학습 완료',
		description: '벌써 300개! 끝을 향해 달려가고 있어요!',
		iconType: 'materialIcons',
		icon: 'menu-book',
		type: 'study',
	},
	{
		id: 'study_400',
		name: '400개 학습 완료',
		description: '와! 400개나 학습했어요! 정복의 끝이 보이네요!',
		iconType: 'materialIcons',
		icon: 'auto-awesome',
		type: 'study',
	},
	{
		id: 'study_all',
		name: '학습 완전 정복',
		description: '속담 413개 전체 학습 완료! 완벽한 정복이에요!',
		iconType: 'materialIcons',
		icon: 'verified',
		type: 'study',
	},

	// 퀴즈 뱃지
	{
		id: 'quiz_1',
		name: '첫 퀴즈 완료',
		description: '첫 문제 풀기 성공! 이제 진짜 시작이에요!',
		iconType: 'materialIcons',
		icon: 'looks-one',
		type: 'quiz',
	},
	{
		id: 'quiz_10',
		name: '10문제 퀴즈 완료',
		description: '10문제 돌파! 꾸준함이 빛나요!',
		iconType: 'materialIcons',
		icon: 'military-tech',
		type: 'quiz',
	},
	{
		id: 'quiz_50',
		name: '50문제 퀴즈 완료',
		description: '50문제 클리어! 퀴즈 고수의 기운이!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'quiz',
	},
	{
		id: 'quiz_100',
		name: '100문제 퀴즈 완료',
		description: '100문제 완주! 대단한 집중력이에요!',
		iconType: 'materialIcons',
		icon: 'emoji-events',
		type: 'quiz',
	},
	{
		id: 'quiz_150',
		name: '150문제 퀴즈 완료',
		description: '벌써 150개? 이건 거의 속담 탐험가죠!',
		iconType: 'materialIcons',
		icon: 'military-tech',
		type: 'quiz',
	},
	{
		id: 'quiz_200',
		name: '200문제 퀴즈 완료',
		description: '200문제! 당신은 퀴즈의 전설!',
		iconType: 'materialIcons',
		icon: 'grade',
		type: 'quiz',
	},
	{
		id: 'quiz_300',
		name: '300문제 퀴즈 완료',
		description: '300문제 돌파! 이제 전설의 반열에 올랐어요!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'quiz',
	},
	{
		id: 'quiz_400',
		name: '400문제 퀴즈 완료',
		description: '무려 400문제 돌파! 당신은 퀴즈의 전설이에요!',
		iconType: 'materialIcons',
		icon: 'emoji-events',
		type: 'quiz',
	},
	{
		id: 'quiz_all',
		name: '퀴즈 정복자',
		description: '속담 퀴즈 413개 전부 완료! 세계 정복 완료예요!',
		iconType: 'materialIcons',
		icon: 'verified',
		type: 'quiz',
	},

	// 레벨 마스터 (퀴즈 유형)
	{
		id: 'level_easy_1',
		name: '아주 쉬움 마스터',
		description: '기초 속담은 다 외웠어요! 깔끔한 출발!',
		iconType: 'fontAwesome6',
		icon: 'seedling',
		type: 'quiz',
	},
	{
		id: 'level_easy_2',
		name: '쉬움 마스터',
		description: '쉬운 속담도 완벽하게 마스터!',
		iconType: 'fontAwesome6',
		icon: 'leaf',
		type: 'quiz',
	},
	{
		id: 'level_medium',
		name: '보통 마스터',
		description: '보통 난이도? 문제없죠!',
		iconType: 'fontAwesome6',
		icon: 'tree',
		type: 'quiz',
	},
	{
		id: 'level_hard',
		name: '어려움 마스터',
		description: '어려운 속담까지 모두 정복했어요!',
		iconType: 'fontAwesome6',
		icon: 'trophy',
		type: 'quiz',
	},

	// 카테고리 마스터 (퀴즈 유형)
	{
		id: 'category_luck',
		name: '운/우연 마스터',
		description: '운과 우연에 관한 속담을 전부 익혔어요!',
		iconType: 'materialIcons',
		icon: 'casino',
		type: 'quiz',
	},
	{
		id: 'category_relation',
		name: '인간관계 마스터',
		description: '관계의 지혜, 당신은 인간관계 달인!',
		iconType: 'materialIcons',
		icon: 'groups',
		type: 'quiz',
	},
	{
		id: 'category_life',
		name: '세상 이치 마스터',
		description: '세상 돌아가는 이치, 속담으로 다 알았죠!',
		iconType: 'materialIcons',
		icon: 'language',
		type: 'quiz',
	},
	{
		id: 'category_diligence',
		name: '근면/검소 마스터',
		description: '성실과 절약, 삶의 기본이죠!',
		iconType: 'materialIcons',
		icon: 'cleaning-services',
		type: 'quiz',
	},
	{
		id: 'category_effort',
		name: '노력/성공 마스터',
		description: '노력 끝에 성공한 자에게!',
		iconType: 'materialIcons',
		icon: 'trending-up',
		type: 'quiz',
	},
	{
		id: 'category_caution',
		name: '경계/조심 마스터',
		description: '조심 또 조심! 지혜롭게 살아가요!',
		iconType: 'materialIcons',
		icon: 'report-problem',
		type: 'quiz',
	},
	{
		id: 'category_greed',
		name: '욕심/탐욕 마스터',
		description: '욕심에 관한 교훈, 뼛속까지 새겼어요!',
		iconType: 'materialIcons',
		icon: 'paid',
		type: 'quiz',
	},
	{
		id: 'category_betrayal',
		name: '배신/불신 마스터',
		description: '신뢰의 중요성, 확실히 배웠네요!',
		iconType: 'materialIcons',
		icon: 'handshake',
		type: 'quiz',
	},

	// 콤보 달성 (퀴즈)
	{
		id: 'combo_3',
		name: '콤보 3 연속',
		description: '연속 3문제! 워밍업 완료!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
	},
	{
		id: 'combo_5',
		name: '콤보 5 연속',
		description: '집중력 5단계 돌입!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
	},
	{
		id: 'combo_10',
		name: '콤보 10 연속',
		description: '집중력 끝판왕 등장!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
	},
	{
		id: 'combo_15',
		name: '콤보 15 연속',
		description: '불꽃처럼 타오르고 있어요!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
	},
	{
		id: 'combo_20',
		name: '콤보 20 연속',
		description: '전설의 20콤보! 퀴즈 신이시군요!',
		iconType: 'materialCommunityIcons',
		icon: 'fire-alert',
		type: 'quiz',
	},

	{
		id: 'score_600',
		name: '600점 돌파',
		description: '속담 입문자로서 퀴즈 여행을 시작했어요! 첫 발걸음 축하해요!',
		iconType: 'fontAwesome6',
		icon: 'seedling',
		type: 'quiz',
	},
	{
		id: 'score_1200',
		name: '1200점 달성',
		description: '속담 숙련자가 되었어요! 이제 속담의 흐름을 완전히 꿰뚫고 있어요!',
		iconType: 'fontAwesome6',
		icon: 'leaf',
		type: 'quiz',
	},
	{
		id: 'score_1800',
		name: '1800점 달성',
		description: '속담 마스터 등극! 속담 탐험가로서 이제 세계가 무대예요!',
		iconType: 'fontAwesome6',
		icon: 'tree',
		type: 'quiz',
	},
	{
		id: 'score_2160',
		name: '2160점 달성',
		description: '속담 문제 완결! 모든 속담을 정복했어요!',
		iconType: 'fontAwesome6',
		icon: 'trophy',
		type: 'quiz',
	},
];
