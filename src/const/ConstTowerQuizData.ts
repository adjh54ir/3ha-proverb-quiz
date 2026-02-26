// @/const/ConstTowerQuizData.ts

import { MainDataType } from '@/types/MainDataType';
import { CONST_MAIN_DATA } from './ConstMainData';

export interface TowerQuizQuestion {
	question: string;
	options: string[];
	correctAnswer: number;
	explanation: string;
	proverb: string;
	level: MainDataType.Proverb['level'];
	category: MainDataType.Proverb['category'];
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
export function generateTowerQuiz(level: MainDataType.Proverb['level'], questionCount: number = 10): TowerQuizQuestion[] {
	const levelWords = CONST_MAIN_DATA.PROVERB.filter((item) => item.level === level);

	if (levelWords.length === 0) return [];

	const selectedWords = shuffle(levelWords).slice(0, Math.min(questionCount, levelWords.length));

	return selectedWords.map((item) => {
		const otherWords = CONST_MAIN_DATA.PROVERB.filter((w) => w.id !== item.id);
		const wrongAnswers = shuffle(otherWords)
			.slice(0, 3)
			.map((w) => w.meaning);

		const allOptions = shuffle([item.meaning, ...wrongAnswers]);
		const correctAnswer = allOptions.indexOf(item.meaning);

		return {
			question: `'${item.proverb}'의 뜻은 무엇일까요?`,
			options: allOptions,
			correctAnswer,
			explanation: `${item.meaning}\n\n예시: ${item.example[0] ?? ''}`,
			proverb: item.proverb,
			level: item.level,
			category: item.category,
		};
	});
}

// 전체 레벨 랜덤 퀴즈 생성 (타워 챌린지용 - 레벨 오름차순 보장)
export function generateTowerChallengeQuiz(questionsPerLevel: number = 5): TowerQuizQuestion[] {
	const levels: MainDataType.Proverb['level'][] = [1, 2, 3, 4];
	return levels.flatMap((level) => generateTowerQuiz(level, questionsPerLevel));
}

// 특정 카테고리 퀴즈 생성
export function generateCategoryQuiz(category: MainDataType.Proverb['category'], questionCount: number = 10): TowerQuizQuestion[] {
	const categoryWords = CONST_MAIN_DATA.PROVERB.filter((item) => item.category === category);

	if (categoryWords.length === 0) return [];

	const selectedWords = shuffle(categoryWords).slice(0, Math.min(questionCount, categoryWords.length));

	return selectedWords.map((item) => {
		const otherWords = CONST_MAIN_DATA.PROVERB.filter((w) => w.id !== item.id);
		const wrongAnswers = shuffle(otherWords)
			.slice(0, 3)
			.map((w) => w.meaning);

		const allOptions = shuffle([item.meaning, ...wrongAnswers]);
		const correctAnswer = allOptions.indexOf(item.meaning);

		return {
			question: `'${item.proverb}'의 뜻은 무엇일까요?`,
			options: allOptions,
			correctAnswer,
			explanation: `${item.meaning}\n\n예시: ${item.example[0] ?? ''}`,
			proverb: item.proverb,
			level: item.level,
			category: item.category,
		};
	});
}

// 유틸: 레벨 이름 반환
export function getLevelName(level: MainDataType.Proverb['level']): string {
	const levelMap: Record<MainDataType.Proverb['level'], string> = {
		1: '아주 쉬움',
		2: '쉬움',
		3: '보통',
		4: '어려움',
	};
	return levelMap[level];
}

// 유틸: 퀴즈 결과 채점
export interface QuizResult {
	total: number;
	correct: number;
	score: number; // 0~100
	wrongQuestions: TowerQuizQuestion[];
}

export function gradeQuiz(questions: TowerQuizQuestion[], answers: number[]): QuizResult {
	const wrongQuestions: TowerQuizQuestion[] = [];
	let correct = 0;

	questions.forEach((q, i) => {
		if (q.correctAnswer === answers[i]) {
			correct++;
		} else {
			wrongQuestions.push(q);
		}
	});

	return {
		total: questions.length,
		correct,
		score: Math.round((correct / questions.length) * 100),
		wrongQuestions,
	};
}
