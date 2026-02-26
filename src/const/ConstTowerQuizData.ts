// @/const/ConstTowerQuizData.ts (새 파일 생성)

import { CONST_PURE_KOREAN_DATA } from './ConstMainPureKoreanData';

export interface TowerQuizQuestion {
	question: string;
	options: string[];
	correctAnswer: number;
	explanation: string;
	word: string;
}

// 배열 셔플 함수
function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

// 레벨별 퀴즈 생성
export function generateTowerQuiz(level: number, questionCount: number = 10): TowerQuizQuestion[] {
	// 해당 레벨의 단어들 필터링
	const levelWords = CONST_PURE_KOREAN_DATA.WORDS.filter((word) => word.level === level);

	if (levelWords.length === 0) {
		return [];
	}

	// 랜덤하게 questionCount개 선택
	const selectedWords = shuffle(levelWords).slice(0, Math.min(questionCount, levelWords.length));

	return selectedWords.map((word) => {
		// 오답 생성: 다른 단어들의 의미 3개
		const otherWords = CONST_PURE_KOREAN_DATA.WORDS.filter((w) => w.id !== word.id);
		const wrongAnswers = shuffle(otherWords)
			.slice(0, 3)
			.map((w) => w.meaning);

		// 정답과 오답을 섞기
		const allOptions = shuffle([word.meaning, ...wrongAnswers]);
		const correctAnswer = allOptions.indexOf(word.meaning);

		return {
			question: `'${word.word}'의 뜻은 무엇일까요?`,
			options: allOptions,
			correctAnswer,
			explanation: `${word.meaning}\n\n예시: ${word.example[0] || word.examples[0]}`,
			word: word.word,
		};
	});
}
