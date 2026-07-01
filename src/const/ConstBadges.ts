import { MainDataType } from '@/types/MainDataType';

/**
 * 희귀도별 표시 메타 (라벨 / 색상 / 그라데이션 / 별 개수)
 * BadgeDetailPopup, 나의 활동 등에서 공통 사용합니다.
 */
export const BADGE_RARITY_META: Record<
	MainDataType.BadgeRarity,
	{ label: string; color: string; soft: string; gradient: [string, string]; stars: number }
> = {
	common: { label: '일반', color: '#10B981', soft: '#D1FAE5', gradient: ['#34D399', '#059669'], stars: 1 },
	rare: { label: '희귀', color: '#3B82F6', soft: '#DBEAFE', gradient: ['#60A5FA', '#2563EB'], stars: 2 },
	epic: { label: '영웅', color: '#F59E0B', soft: '#FEF3C7', gradient: ['#FBBF24', '#D97706'], stars: 3 },
	legendary: { label: '전설', color: '#EF4444', soft: '#FEE2E2', gradient: ['#FB7185', '#E11D48'], stars: 4 },
};

/*
=========================================
📚 학습 관련 뱃지
=========================================
- 첫 학습: 🎈 첫 속담을 학습했어요! 시작이 반이에요!
- 10개 학습: 📝 속담 10개 돌파! 슬슬 감이 오죠?
- 50개 학습: 📖 속담 50개 달성! 지식이 쌓이고 있어요!
- 100개 학습: 🎓 속담 100개 학습! 당신은 진정한 학자!
- 200개 학습: 🧠 무려 200개! 속담 마스터의 길에 들어섰어요!
- 300개 학습: 📚 벌써 300개! 끝을 향해 달려가고 있어요!
- 400개 학습: ✨ 와! 400개나 학습했어요! 정복의 끝이 보이네요!
- 500개 학습: 🚀 500개 돌파! 절반을 훌쩍 넘었어요!
- 600개 학습: 🌟 600개 달성! 이제 진짜 고수예요!
- 학습 완료: 🌟 모든 속담을 학습 완료! 완벽한 정복이에요!

=========================================
🧠 퀴즈 관련 뱃지
=========================================
- 첫 퀴즈 완료: 🚀 첫 문제 풀기 성공! 이제 진짜 시작이에요!
- 10개 퀴즈 완료: ✍️ 10문제 돌파! 꾸준함이 빛나요!
- 50개 퀴즈 완료: 🏅 50문제 클리어! 퀴즈 고수의 기운이!
- 100개 퀴즈 완료: 🧭 100문제 완주! 대단한 집중력이에요!
- 150개 퀴즈 완료: 🎖️ 벌써 150개? 이건 거의 속담 탐험가죠!
- 200개 퀴즈 완료: 🌍 200문제! 당신은 퀴즈의 전설!
- 300개 퀴즈 완료: 🏅 300문제 돌파! 이제 전설의 반열에 올랐어요!
- 400개 퀴즈 완료: 🎖️ 무려 400문제 돌파! 당신은 퀴즈의 전설이에요!
- 500개 퀴즈 완료: 🚀 500문제 돌파! 절반을 훌쩍 넘었어요!
- 600개 퀴즈 완료: 🌟 600문제 달성! 이제 진짜 고수예요!
- 퀴즈 완료: 🌈 모든 문제 완료! 세계 정복 완료예요!

=========================================
🎯 레벨별 마스터 뱃지
(난이도별 완벽 정복)
=========================================
- 초급 마스터: 🌱 기초 속담은 다 외웠어요! 깔끔한 출발!
- 중급 마스터: 🍃 쉬운 속담도 완벽하게 마스터!
- 고급 마스터: 🌳 고급 난이도? 문제없죠!
- 특급 마스터: 🧠 어려운 속담까지 모두 정복했어요!

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
(누적 점수로 보는 성장 / 700개 × 10점 = 7,000점 기준)
=========================================
- 1000점: ✈️ 퀴즈 여행을 시작했어요! 첫 발걸음 축하해요!
- 2000점: 🌿 속담 입문자 완성! 기초를 탄탄히 다졌어요!
- 3000점: 🌳 속담 숙련자 달성! 속담의 흐름을 꿰뚫고 있어요!
- 5000점: ♞ 속담 고수 등극! 어떤 도전도 당당히 맞설 수 있어요!
- 7000점: 👑 속담 문제 완결! 모든 속담을 정복했어요!
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
		condition: '속담 1개 학습',
		rarity: 'common',
	},
	{
		id: 'study_10',
		name: '10개 학습 완료',
		description: '속담 10개 돌파! 슬슬 감이 오죠?',
		iconType: 'materialIcons',
		icon: 'travel-explore',
		type: 'study',
		condition: '속담 10개 학습',
		rarity: 'common',
	},
	{
		id: 'study_50',
		name: '50개 학습 완료',
		description: '속담 50개 달성! 지식이 쌓이고 있어요!',
		iconType: 'materialIcons',
		icon: 'menu-book',
		type: 'study',
		condition: '속담 50개 학습',
		rarity: 'rare',
	},
	{
		id: 'study_100',
		name: '100개 학습 완료',
		description: '속담 100개 학습! 당신은 진정한 학자!',
		iconType: 'materialIcons',
		icon: 'public',
		type: 'study',
		condition: '속담 100개 학습',
		rarity: 'rare',
	},
	{
		id: 'study_200',
		name: '200개 학습 완료',
		description: '무려 200개! 속담 마스터의 길에 들어섰어요!',
		iconType: 'materialIcons',
		icon: 'school',
		type: 'study',
		condition: '속담 200개 학습',
		rarity: 'epic',
	},
	{
		id: 'study_300',
		name: '300개 학습 완료',
		description: '벌써 300개! 끝을 향해 달려가고 있어요!',
		iconType: 'materialIcons',
		icon: 'menu-book',
		type: 'study',
		condition: '속담 300개 학습',
		rarity: 'epic',
	},
	{
		id: 'study_400',
		name: '400개 학습 완료',
		description: '와! 400개나 학습했어요! 정복의 끝이 보이네요!',
		iconType: 'materialIcons',
		icon: 'auto-awesome',
		type: 'study',
		condition: '속담 400개 학습',
		rarity: 'epic',
	},
	{
		id: 'study_500',
		name: '500개 학습 완료',
		description: '500개 돌파! 절반을 훌쩍 넘었어요!',
		iconType: 'materialIcons',
		icon: 'rocket-launch',
		type: 'study',
		condition: '속담 500개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_600',
		name: '600개 학습 완료',
		description: '600개 달성! 이제 진짜 고수예요!',
		iconType: 'materialIcons',
		icon: 'stars',
		type: 'study',
		condition: '속담 600개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_700',
		name: '700개 학습 완료',
		description: '700개 돌파! 배움의 깊이가 남다르네요!',
		iconType: 'materialIcons',
		icon: 'auto-stories',
		type: 'study',
		condition: '속담 700개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_800',
		name: '800개 학습 완료',
		description: '800개 학습! 지식의 탑이 높이 쌓였어요!',
		iconType: 'materialIcons',
		icon: 'menu-book',
		type: 'study',
		condition: '속담 800개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_1000',
		name: '1,000개 학습 완료',
		description: '천 개 돌파! 이제 속담 도서관이 따로 없네요!',
		iconType: 'materialIcons',
		icon: 'local-library',
		type: 'study',
		condition: '속담 1,000개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_1500',
		name: '1,500개 학습 완료',
		description: '1,500개 학습! 방대한 지혜를 품었어요!',
		iconType: 'materialIcons',
		icon: 'psychology',
		type: 'study',
		condition: '속담 1,500개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_2000',
		name: '2,000개 학습 완료',
		description: '2,000개 정복! 속담 백과사전의 경지예요!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'study',
		condition: '속담 2,000개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_2500',
		name: '2,500개 학습 완료',
		description: '2,500개 학습! 끝이 눈앞에 보여요!',
		iconType: 'materialIcons',
		icon: 'diamond',
		type: 'study',
		condition: '속담 2,500개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_3000',
		name: '3,000개 학습 완료',
		description: '무려 3,000개! 진정한 속담 대가의 반열이에요!',
		iconType: 'materialIcons',
		icon: 'military-tech',
		type: 'study',
		condition: '속담 3,000개 학습',
		rarity: 'legendary',
	},
	{
		id: 'study_all',
		name: '학습 완전 정복',
		description: '모든 속담 학습 완료! 완벽한 정복이에요!',
		iconType: 'materialIcons',
		icon: 'verified',
		type: 'study',
		condition: '모든 속담 학습 완료',
		rarity: 'legendary',
	},

	// 퀴즈 뱃지
	{
		id: 'quiz_1',
		name: '첫 퀴즈 완료',
		description: '첫 문제 풀기 성공! 이제 진짜 시작이에요!',
		iconType: 'materialIcons',
		icon: 'looks-one',
		type: 'quiz',
		condition: '퀴즈 1문제 완료',
		rarity: 'common',
	},
	{
		id: 'quiz_10',
		name: '10문제 퀴즈 완료',
		description: '10문제 돌파! 꾸준함이 빛나요!',
		iconType: 'materialIcons',
		icon: 'military-tech',
		type: 'quiz',
		condition: '퀴즈 10문제 완료',
		rarity: 'common',
	},
	{
		id: 'quiz_50',
		name: '50문제 퀴즈 완료',
		description: '50문제 클리어! 퀴즈 고수의 기운이!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'quiz',
		condition: '퀴즈 50문제 완료',
		rarity: 'rare',
	},
	{
		id: 'quiz_100',
		name: '100문제 퀴즈 완료',
		description: '100문제 완주! 대단한 집중력이에요!',
		iconType: 'materialIcons',
		icon: 'emoji-events',
		type: 'quiz',
		condition: '퀴즈 100문제 완료',
		rarity: 'rare',
	},
	{
		id: 'quiz_150',
		name: '150문제 퀴즈 완료',
		description: '벌써 150개? 이건 거의 속담 탐험가죠!',
		iconType: 'materialIcons',
		icon: 'military-tech',
		type: 'quiz',
		condition: '퀴즈 150문제 완료',
		rarity: 'rare',
	},
	{
		id: 'quiz_200',
		name: '200문제 퀴즈 완료',
		description: '200문제! 당신은 퀴즈의 전설!',
		iconType: 'materialIcons',
		icon: 'grade',
		type: 'quiz',
		condition: '퀴즈 200문제 완료',
		rarity: 'epic',
	},
	{
		id: 'quiz_300',
		name: '300문제 퀴즈 완료',
		description: '300문제 돌파! 이제 전설의 반열에 올랐어요!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'quiz',
		condition: '퀴즈 300문제 완료',
		rarity: 'epic',
	},
	{
		id: 'quiz_400',
		name: '400문제 퀴즈 완료',
		description: '무려 400문제 돌파! 당신은 퀴즈의 전설이에요!',
		iconType: 'materialIcons',
		icon: 'emoji-events',
		type: 'quiz',
		condition: '퀴즈 400문제 완료',
		rarity: 'epic',
	},
	{
		id: 'quiz_500',
		name: '500문제 퀴즈 완료',
		description: '500문제 돌파! 절반을 훌쩍 넘었어요!',
		iconType: 'materialIcons',
		icon: 'rocket-launch',
		type: 'quiz',
		condition: '퀴즈 500문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_600',
		name: '600문제 퀴즈 완료',
		description: '600문제 달성! 이제 진짜 고수예요!',
		iconType: 'materialIcons',
		icon: 'stars',
		type: 'quiz',
		condition: '퀴즈 600문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_700',
		name: '700문제 퀴즈 완료',
		description: '700문제 돌파! 멈추지 않는 도전 정신이에요!',
		iconType: 'materialIcons',
		icon: 'bolt',
		type: 'quiz',
		condition: '퀴즈 700문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_800',
		name: '800문제 퀴즈 완료',
		description: '800문제 클리어! 불붙은 실력이 대단해요!',
		iconType: 'materialIcons',
		icon: 'whatshot',
		type: 'quiz',
		condition: '퀴즈 800문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_1000',
		name: '1,000문제 퀴즈 완료',
		description: '천 문제 돌파! 퀴즈 마스터의 위엄이에요!',
		iconType: 'materialIcons',
		icon: 'local-fire-department',
		type: 'quiz',
		condition: '퀴즈 1,000문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_1500',
		name: '1,500문제 퀴즈 완료',
		description: '1,500문제 정복! 흔들림 없는 실력이에요!',
		iconType: 'materialIcons',
		icon: 'shield',
		type: 'quiz',
		condition: '퀴즈 1,500문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_2000',
		name: '2,000문제 퀴즈 완료',
		description: '2,000문제 돌파! 전설을 넘어선 경지예요!',
		iconType: 'materialIcons',
		icon: 'diamond',
		type: 'quiz',
		condition: '퀴즈 2,000문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_2500',
		name: '2,500문제 퀴즈 완료',
		description: '2,500문제 클리어! 완주가 눈앞이에요!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'quiz',
		condition: '퀴즈 2,500문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_3000',
		name: '3,000문제 퀴즈 완료',
		description: '무려 3,000문제! 퀴즈의 신이라 불러도 손색없어요!',
		iconType: 'materialIcons',
		icon: 'military-tech',
		type: 'quiz',
		condition: '퀴즈 3,000문제 완료',
		rarity: 'legendary',
	},
	{
		id: 'quiz_all',
		name: '퀴즈 정복자',
		description: '모든 속담 퀴즈 완료! 세계 정복 완료예요!',
		iconType: 'materialIcons',
		icon: 'verified',
		type: 'quiz',
		condition: '모든 퀴즈 문제 완료',
		rarity: 'legendary',
	},

	// 레벨 마스터 (퀴즈 유형)
	{
		id: 'level_easy_1',
		name: '초급 마스터',
		description: '기초 속담은 다 외웠어요! 깔끔한 출발!',
		iconType: 'fontAwesome6',
		icon: 'seedling',
		type: 'quiz',
		condition: '초급 난이도 전체 정답',
		rarity: 'rare',
	},
	{
		id: 'level_easy_2',
		name: '중급 마스터',
		description: '쉬운 속담도 완벽하게 마스터!',
		iconType: 'fontAwesome6',
		icon: 'leaf',
		type: 'quiz',
		condition: '중급 난이도 전체 정답',
		rarity: 'rare',
	},
	{
		id: 'level_medium',
		name: '고급 마스터',
		description: '고급 난이도? 문제없죠!',
		iconType: 'fontAwesome6',
		icon: 'tree',
		type: 'quiz',
		condition: '고급 난이도 전체 정답',
		rarity: 'epic',
	},
	{
		id: 'level_hard',
		name: '특급 마스터',
		description: '어려운 속담까지 모두 정복했어요!',
		iconType: 'fontAwesome6',
		icon: 'trophy',
		type: 'quiz',
		condition: '특급 난이도 전체 정답',
		rarity: 'legendary',
	},

	// 카테고리 마스터 (퀴즈 유형)
	{
		id: 'category_luck',
		name: '운/우연 마스터',
		description: '운과 우연에 관한 속담을 전부 익혔어요!',
		iconType: 'materialIcons',
		icon: 'casino',
		type: 'quiz',
		condition: '운/우연 카테고리 속담 전체 정복',
		rarity: 'rare',
	},
	{
		id: 'category_relation',
		name: '인간관계 마스터',
		description: '관계의 지혜, 당신은 인간관계 달인!',
		iconType: 'materialIcons',
		icon: 'groups',
		type: 'quiz',
		condition: '인간관계 카테고리 속담 전체 정복',
		rarity: 'rare',
	},
	{
		id: 'category_life',
		name: '세상 이치 마스터',
		description: '세상 돌아가는 이치, 속담으로 다 알았죠!',
		iconType: 'materialIcons',
		icon: 'language',
		type: 'quiz',
		condition: '세상 이치 카테고리 속담 전체 정복',
		rarity: 'rare',
	},
	{
		id: 'category_diligence',
		name: '근면/검소 마스터',
		description: '성실과 절약, 삶의 기본이죠!',
		iconType: 'materialIcons',
		icon: 'cleaning-services',
		type: 'quiz',
		condition: '근면/검소 카테고리 속담 전체 정복',
		rarity: 'rare',
	},
	{
		id: 'category_effort',
		name: '노력/성공 마스터',
		description: '노력 끝에 성공한 자에게!',
		iconType: 'materialIcons',
		icon: 'trending-up',
		type: 'quiz',
		condition: '노력/성공 카테고리 속담 전체 정복',
		rarity: 'rare',
	},
	{
		id: 'category_caution',
		name: '경계/조심 마스터',
		description: '조심 또 조심! 지혜롭게 살아가요!',
		iconType: 'materialIcons',
		icon: 'report-problem',
		type: 'quiz',
		condition: '경계/조심 카테고리 속담 전체 정복',
		rarity: 'rare',
	},
	{
		id: 'category_greed',
		name: '욕심/탐욕 마스터',
		description: '욕심에 관한 교훈, 뼛속까지 새겼어요!',
		iconType: 'materialIcons',
		icon: 'paid',
		type: 'quiz',
		condition: '욕심/탐욕 카테고리 속담 전체 정복',
		rarity: 'rare',
	},
	{
		id: 'category_betrayal',
		name: '배신/불신 마스터',
		description: '신뢰의 중요성, 확실히 배웠네요!',
		iconType: 'materialIcons',
		icon: 'handshake',
		type: 'quiz',
		condition: '배신/불신 카테고리 속담 전체 정복',
		rarity: 'rare',
	},

	// 콤보 달성 (퀴즈)
	{
		id: 'combo_3',
		name: '콤보 3 연속',
		description: '연속 3문제! 워밍업 완료!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
		condition: '퀴즈 3연속 정답',
		rarity: 'common',
	},
	{
		id: 'combo_5',
		name: '콤보 5 연속',
		description: '집중력 5단계 돌입!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
		condition: '퀴즈 5연속 정답',
		rarity: 'rare',
	},
	{
		id: 'combo_10',
		name: '콤보 10 연속',
		description: '집중력 끝판왕 등장!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
		condition: '퀴즈 10연속 정답',
		rarity: 'epic',
	},
	{
		id: 'combo_15',
		name: '콤보 15 연속',
		description: '불꽃처럼 타오르고 있어요!',
		iconType: 'materialCommunityIcons',
		icon: 'fire',
		type: 'quiz',
		condition: '퀴즈 15연속 정답',
		rarity: 'epic',
	},
	{
		id: 'combo_20',
		name: '콤보 20 연속',
		description: '전설의 20콤보! 퀴즈 신이시군요!',
		iconType: 'materialCommunityIcons',
		icon: 'fire-alert',
		type: 'quiz',
		condition: '퀴즈 20연속 정답',
		rarity: 'legendary',
	},

	// 문제 풀이(캐릭터 획득) 달성 — 100 / 200 / 500 / 1,000 / 2,000문제
	{
		id: 'score_1000',
		name: '입문자 등극',
		description: '1,000점 돌파! 속담 입문자 캐릭터를 손에 넣었어요!',
		iconType: 'fontAwesome6',
		icon: 'leaf',
		type: 'quiz',
		condition: '누적 1,000점 달성',
		rarity: 'common',
	},
	{
		id: 'score_2000',
		name: '숙련자의 길',
		description: '2,000점 달성! 속담 숙련자 캐릭터로 성장했어요!',
		iconType: 'fontAwesome6',
		icon: 'tree',
		type: 'quiz',
		condition: '누적 2,000점 달성',
		rarity: 'rare',
	},
	{
		id: 'score_5000',
		name: '고수의 관록',
		description: '5,000점 돌파! 속담 고수 캐릭터에 도달했어요!',
		iconType: 'fontAwesome6',
		icon: 'chess-knight',
		type: 'quiz',
		condition: '누적 5,000점 달성',
		rarity: 'epic',
	},
	{
		id: 'score_10000',
		name: '마스터 등극',
		description: '10,000점 정복! 속담 마스터 캐릭터의 주인공이 됐어요!',
		iconType: 'fontAwesome6',
		icon: 'trophy',
		type: 'quiz',
		condition: '누적 10,000점 달성',
		rarity: 'legendary',
	},
	{
		id: 'score_20000',
		name: '살아있는 전설',
		description: '20,000점 정복! 속담 전설 캐릭터로 역사에 이름을 새겼어요!',
		iconType: 'fontAwesome6',
		icon: 'crown',
		type: 'quiz',
		condition: '누적 20,000점 달성',
		rarity: 'legendary',
	},

	// =========================================
	// 📅 출석 뱃지 (누적 출석일)
	// =========================================
	{
		id: 'attend_1',
		name: '첫 출석',
		description: '🌅 첫 출석을 완료했어요! 좋은 습관의 시작이에요!',
		iconType: 'materialIcons',
		icon: 'event-available',
		type: 'attendance',
		condition: '누적 출석 1일',
		rarity: 'common',
	},
	{
		id: 'attend_5',
		name: '출석 5일',
		description: '📅 벌써 5일째 출석! 꾸준함이 보여요!',
		iconType: 'materialIcons',
		icon: 'event-available',
		type: 'attendance',
		condition: '누적 출석 5일',
		rarity: 'common',
	},
	{
		id: 'attend_10',
		name: '출석 10일',
		description: '🗓️ 출석 10일 달성! 루틴이 자리 잡고 있어요!',
		iconType: 'materialIcons',
		icon: 'date-range',
		type: 'attendance',
		condition: '누적 출석 10일',
		rarity: 'common',
	},
	{
		id: 'attend_20',
		name: '출석 20일',
		description: '📆 출석 20일! 어느새 습관이 됐네요!',
		iconType: 'materialIcons',
		icon: 'date-range',
		type: 'attendance',
		condition: '누적 출석 20일',
		rarity: 'rare',
	},
	{
		id: 'attend_30',
		name: '한 달 개근',
		description: '🏅 출석 30일 달성! 한 달 개근, 정말 대단해요!',
		iconType: 'materialIcons',
		icon: 'calendar-month',
		type: 'attendance',
		condition: '누적 출석 30일',
		rarity: 'rare',
	},
	{
		id: 'attend_50',
		name: '출석 50일',
		description: '🎖️ 출석 50일! 꾸준함의 아이콘이에요!',
		iconType: 'materialIcons',
		icon: 'calendar-month',
		type: 'attendance',
		condition: '누적 출석 50일',
		rarity: 'epic',
	},
	{
		id: 'attend_100',
		name: '출석 100일',
		description: '🏆 출석 100일 돌파! 백일의 정성을 모았어요!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'attendance',
		condition: '누적 출석 100일',
		rarity: 'epic',
	},
	{
		id: 'attend_150',
		name: '출석 150일',
		description: '🌟 출석 150일! 이쯤 되면 진정한 고수예요!',
		iconType: 'materialIcons',
		icon: 'workspace-premium',
		type: 'attendance',
		condition: '누적 출석 150일',
		rarity: 'legendary',
	},
	{
		id: 'attend_200',
		name: '출석 200일',
		description: '💎 출석 200일! 흔들리지 않는 꾸준함의 결정체!',
		iconType: 'materialIcons',
		icon: 'diamond',
		type: 'attendance',
		condition: '누적 출석 200일',
		rarity: 'legendary',
	},
	{
		id: 'attend_300',
		name: '출석 300일',
		description: '👑 출석 300일! 당신은 출석의 전설입니다!',
		iconType: 'materialIcons',
		icon: 'emoji-events',
		type: 'attendance',
		condition: '누적 출석 300일',
		rarity: 'legendary',
	},

	// =========================================
	// 📅 오늘의 퀴즈 뱃지 (누적 완료 일수)
	// =========================================
	{
		id: 'today_1',
		name: '오늘의 퀴즈 첫 도전',
		description: '🌱 오늘의 퀴즈를 처음으로 완료했어요! 좋은 시작이에요!',
		iconType: 'materialIcons',
		icon: 'today',
		type: 'quiz',
		condition: '오늘의 퀴즈 1일 완료',
		rarity: 'common',
	},
	{
		id: 'today_5',
		name: '오늘의 퀴즈 5일',
		description: '📅 오늘의 퀴즈 5일 완료! 꾸준함이 보여요!',
		iconType: 'materialIcons',
		icon: 'event-available',
		type: 'quiz',
		condition: '오늘의 퀴즈 5일 완료',
		rarity: 'common',
	},
	{
		id: 'today_10',
		name: '오늘의 퀴즈 10일',
		description: '🗓️ 오늘의 퀴즈 10일 완료! 루틴이 자리 잡고 있어요!',
		iconType: 'materialIcons',
		icon: 'date-range',
		type: 'quiz',
		condition: '오늘의 퀴즈 10일 완료',
		rarity: 'rare',
	},
	{
		id: 'today_20',
		name: '오늘의 퀴즈 20일',
		description: '📆 오늘의 퀴즈 20일 완료! 어느새 습관이 됐네요!',
		iconType: 'materialIcons',
		icon: 'date-range',
		type: 'quiz',
		condition: '오늘의 퀴즈 20일 완료',
		rarity: 'rare',
	},
	{
		id: 'today_30',
		name: '오늘의 퀴즈 한 달',
		description: '🏅 오늘의 퀴즈 30일 완료! 한 달 개근, 정말 대단해요!',
		iconType: 'materialIcons',
		icon: 'calendar-month',
		type: 'quiz',
		condition: '오늘의 퀴즈 30일 완료',
		rarity: 'epic',
	},
	{
		id: 'today_50',
		name: '오늘의 퀴즈 50일',
		description: '🎖️ 오늘의 퀴즈 50일 완료! 꾸준함의 아이콘이에요!',
		iconType: 'materialIcons',
		icon: 'auto-awesome',
		type: 'quiz',
		condition: '오늘의 퀴즈 50일 완료',
		rarity: 'epic',
	},
	{
		id: 'today_100',
		name: '오늘의 퀴즈 100일',
		description: '🏆 오늘의 퀴즈 100일 완료! 백일의 정성을 모았어요!',
		iconType: 'materialIcons',
		icon: 'emoji-events',
		type: 'quiz',
		condition: '오늘의 퀴즈 100일 완료',
		rarity: 'legendary',
	},
];
