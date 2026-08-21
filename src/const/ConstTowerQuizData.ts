// @/const/ConstTowerQuizData.ts

import { MainDataType } from '@/types/MainDataType';
import { CONST_MAIN_DATA } from './ConstMainData';
import { sampleSize, shuffle } from '@/utils/ArrayUtils';

export interface TowerQuizQuestion {
	question: string;
	options: string[];
	correctAnswer: number;
	explanation: string;
	proverb: string;
	level: MainDataType.Proverb['level'];
	category: MainDataType.Proverb['category'];
}

// 레벨별 퀴즈 생성
export function generateTowerQuiz(level: MainDataType.Proverb['level'], questionCount: number = 10): TowerQuizQuestion[] {
	const levelWords = CONST_MAIN_DATA.PROVERB.filter((item) => item.level === level);

	if (levelWords.length === 0) return [];

	const selectedWords = sampleSize(levelWords, questionCount);

	return selectedWords.map((item) => {
		const correctMeaning = item.longMeaning || item.meaning;
		// 뜻이 같은 다른 속담이 오답으로 뽑히면 보기 안에 정답이 두 번 뜬다 → 문자열 기준으로도 제외한다.
		const otherWords = CONST_MAIN_DATA.PROVERB.filter((w) => w.id !== item.id && (w.longMeaning || w.meaning) !== correctMeaning);
		const wrongAnswers = sampleSize(otherWords, 3).map((w) => w.longMeaning || w.meaning);

		const allOptions = shuffle([correctMeaning, ...wrongAnswers]);
		const correctAnswer = allOptions.indexOf(correctMeaning);

		return {
			question: `'${item.proverb}'의 뜻은 무엇입니까?`,
			options: allOptions,
			correctAnswer,
			explanation: `${item.longMeaning || item.meaning}\n\n예시: ${item.example[0] ?? ''}`,
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

	const selectedWords = sampleSize(categoryWords, questionCount);

	return selectedWords.map((item) => {
		const otherWords = CONST_MAIN_DATA.PROVERB.filter((w) => w.id !== item.id && w.meaning !== item.meaning);
		const wrongAnswers = sampleSize(otherWords, 3).map((w) => w.meaning);

		const allOptions = shuffle([item.meaning, ...wrongAnswers]);
		const correctAnswer = allOptions.indexOf(item.meaning);

		return {
			question: `'${item.proverb}'의 뜻은 무엇입니까?`,
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
		1: '초급',
		2: '중급',
		3: '고급',
		4: '특급',
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
