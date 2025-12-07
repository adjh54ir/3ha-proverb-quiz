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
			android: 'https://play.google.com/store/apps/details?id=com.tha.spellingquiz',
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
		{
			id: 11,
			icon: require('@/assets/appicons/main_agecalc.png'),
			title: '나이 계산기: 오늘의 나이',
			desc:
				'나이 계산기: 오늘의 나이는 단순한 ‘나이 계산기’를 넘어, 당신의 생일에 담긴 의미와 인생의 흐름을 알려주는 앱입니다. 음력·양력 변환은 기본, 당신의 띠·별자리·탄생석·탄생화·탄생목·탄생색·수호성까지 모두 한 눈에 볼 수 있습니다.',
			android: '',
			ios: 'https://apps.apple.com/us/app/id6754360556',
		},
		{
			id: 12,
			icon: require('@/assets/appicons/main_emotionbutton.png'),
			title: '기분 팡: 나의 기분을 팡!',
			desc:
				'기분 팡: 나의 기분을 팡!은 지금 느끼는 기분을 버튼 하나로 표현하고,다양한 이펙트로 가볍게 스트레스를 풀 수 있는 앱입니다. 내가 좋아하는 이미지로 나만의 버튼을 만들고 자유롭게 배치해 나만의 감정 공간을 꾸며보세요.',
			android: '',
			ios: 'https://apps.apple.com/kr/app/id6755211160',
		},

		{
			id: 13,
			icon: require('@/assets/appicons/main_choncalc.png'),
			title: '촌수 계산기 Plus+',
			desc:
				'촌수 계산기 Plus+: 단순한 ‘촌수 계산기’를 넘어서, 당신의 가족 관계를 가장 정확하고 직관적으로 이해하도록 돕는 앱입니다. 부계·모계·인척 관계까지 촌수를 자동으로 계산해 주고, 방대한 친족 호칭을 검색해 즉시 확인할 수 있습니다. 게다가 재미있고 유익한 ‘가족 관계 퀴즈’ 기능을 통해 자연스럽게 촌수 지식도 익힐 수 있어, 학습과 재미를 모두 잡은 종합 친족 도우미입니다.',
			android: '',
			ios: '',
		},
	],
};
