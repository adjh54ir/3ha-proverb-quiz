/**
 * 배열 유틸.
 *
 * ⚠️ `arr.sort(() => Math.random() - 0.5)` 는 셔플이 아니다.
 *    비교 함수가 일관되지 않아 정렬 결과가 균등 분포가 아니며, 특히 보기 4개처럼
 *    짧은 배열에서는 엔진의 삽입 정렬 특성상 "정답이 항상 뒤쪽" 같은 편향이 눈에 띈다.
 *    퀴즈 보기 순서/문제 추출은 반드시 이 파일의 Fisher-Yates 구현을 쓴다.
 */

/** Fisher-Yates 셔플. 원본은 건드리지 않고 새 배열을 돌려준다. */
export const shuffle = <T>(array: readonly T[]): T[] => {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
};

/** 배열에서 무작위 1개. 비어 있으면 undefined. */
export const pickRandom = <T>(array: readonly T[]): T | undefined =>
	array.length === 0 ? undefined : array[Math.floor(Math.random() * array.length)];

/**
 * 전체를 셔플하지 않고 앞에서 count 개만 뽑는다(부분 Fisher-Yates).
 * 후보가 수천 개인데 3~5개만 필요한 경우 전체 정렬/셔플보다 훨씬 싸다.
 */
export const sampleSize = <T>(array: readonly T[], count: number): T[] => {
	const n = Math.min(count, array.length);
	if (n <= 0) {
		return [];
	}
	const pool = [...array];
	const picked: T[] = [];
	for (let i = 0; i < n; i++) {
		const j = i + Math.floor(Math.random() * (pool.length - i));
		[pool[i], pool[j]] = [pool[j], pool[i]];
		picked.push(pool[i]);
	}
	return picked;
};
