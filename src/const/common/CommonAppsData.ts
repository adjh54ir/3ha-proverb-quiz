import { CommonType } from '@/types/CommonType';

export const COMMON_APPS_DATA: {
	// 앱 소개 정보
	Apps: CommonType.AppItem[];
} = {
	Apps: [
		{
			id: 8,
			icon: require('@/assets/appicons/main_idiomquiz.png'),
			title: '관픽: 관용구 퀴즈',
			desc:
				'"다양한 대한민국 관용구를 쉽고 재미있게 학습 할 수 있도록 도와주는 학습형 퀴즈앱입니다. 퀴즈를 통해 익힌 지식을 점검하고, 틀린 문제는 ‘오답 복습’ 기능으로 반복 학습할 수 있어 완벽한 관용구 마스터에 한 걸음 더 다가갈 수 있습니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.idiomquiz',
			ios: 'https://apps.apple.com/kr/app/id6752314974',
		},
		{
			id: 5,
			icon: require('@/assets/appicons/main_fouridioms.png'),
			title: '사픽: 사자성어 퀴즈',
			desc: '사자성어를 카드로 학습하고 퀴즈로 실력을 점검할 수 있는 교육용 앱입니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.fouridioms',
			ios: 'https://apps.apple.com/kr/app//id6747324308',
		},
		{
			id: 10,
			icon: require('@/assets/appicons/main_spellingquiz.png'),
			title: '맞픽: 맞춤법 퀴즈',
			desc:
				"다양한 대한민국 맞춤법을 쉽고 재미있게 학습 할 수 있도록 도와주는 학습형 퀴즈앱입니다. 퀴즈를 통해 익힌 지식을 점검하고, 틀린 문제는 '오답 복습'' 기능으로 반복 학습할 수 있어 완벽한 관용구 마스터에 한 걸음 더 다가갈 수 있습니다.",
			android: '',
			ios: 'https://apps.apple.com/us/app/id6753701785',
		},

		{
			id: 3,
			icon: require('@/assets/appicons/main_country.png'),
			title: '수픽: 수도 퀴즈',
			desc: '전 세계 수도를 학습하고 퀴즈로 확인할 수 있는 교육용 앱입니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.capitalquiz',
			ios: 'https://apps.apple.com/app/id6746687390',
		},
		{
			id: 6,
			icon: require('@/assets/appicons/main_dogquiz.png'),
			title: '멍픽: 강아지 퀴즈',
			desc: '강아지 견종을 학습하고 퀴즈로 기억을하는 도감형 학습 앱입니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.dogquiz',
			ios: 'https://apps.apple.com/kr/app/id6749044123',
		},
		{
			id: 8,
			icon: require('@/assets/appicons/main_catquiz.png'),
			title: '냥픽: 고양이 퀴즈',
			desc:
				'냥픽: 고양이 퀴즈는 다양한 묘종을 재미있게 배우고, 퀴즈와 반복 학습, 타임 챌린지를 통해 지식을 쌓아가며 캐릭터와 뱃지를 모으는 게임형 학습 앱입니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.catquiz',
			ios: 'https://apps.apple.com/kr/app/id6751539764',
		},

		{
			id: 7,
			icon: require('@/assets/appicons/main_todaycigarette.png'),
			title: '오흡: 오늘 흡연 기록',
			desc: '"작은 기록이 만든 큰 변화, 오늘부터 시작하세요!" 흡연 습관을 정확하게 파악하고, 금연의 첫 걸음을 함께하세요.',
			android: '',
			ios: 'https://apps.apple.com/kr/app/id6749576206',
		},
		{
			id: 2,
			icon: require('@/assets/appicons/main_lotto.png'),
			title: '로또 지니: 로또 생성기',
			desc: '로또 당첨 확인, 통계 분석, 번호 생성 등 로또 기능을 한 곳에 모은 앱입니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.lottogenerator',
			ios: 'https://apps.apple.com/app/id6746621734',
		},
		{
			id: 1,
			icon: require('@/assets/appicons/squaremetercalc2.png'),
			title: '평수 계산기',
			desc: '㎡(제곱미터)와 평(坪)을 쉽게 변환하고 평당 금액을 계산할 수 있는 계산기 앱입니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.squaremetercalc',
			ios: 'https://apps.apple.com/app/id6746688301',
		},

		{
			id: 4,
			icon: require('@/assets/appicons/main_proverb.jpeg'),
			title: '속픽: 속담 퀴즈',
			desc: '속담을 학습하고 다양한 퀴즈로 점검하며 반복 복습할 수 있는 교육용 앱입니다.',
			android: 'https://play.google.com/store/apps/details?id=com.tha.proverbquiz',
			ios: 'https://apps.apple.com/app/id6746687973',
		},
	],
};
