import { sampleSize, shuffle } from '../src/utils/ArrayUtils';

describe('ArrayUtils', () => {
	it('shuffle 은 원본을 바꾸지 않고 같은 원소를 그대로 유지한다', () => {
		const source = [1, 2, 3, 4, 5];
		const result = shuffle(source);
		expect(source).toEqual([1, 2, 3, 4, 5]);
		expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
	});

	it('sampleSize 는 중복 없이 요청한 개수만 뽑는다', () => {
		const picked = sampleSize([1, 2, 3, 4, 5, 6, 7, 8], 3);
		expect(picked).toHaveLength(3);
		expect(new Set(picked).size).toBe(3);
	});

	it('sampleSize 는 원본보다 많이 요청해도 원본 길이를 넘지 않는다', () => {
		expect(sampleSize([1, 2], 5)).toHaveLength(2);
		expect(sampleSize([], 3)).toEqual([]);
	});

	/**
	 * 회귀 방지: 예전 `sort(() => Math.random() - 0.5)` 는 보기 4개에서 마지막에 넣은
	 * 정답이 뒤쪽에 몰렸다. 각 위치가 대략 균등하게 나오는지 확인한다.
	 */
	it('정답 위치가 특정 자리에 쏠리지 않는다', () => {
		const counts = [0, 0, 0, 0];
		const RUNS = 4000;
		for (let i = 0; i < RUNS; i++) {
			counts[shuffle(['오답1', '오답2', '오답3', '정답']).indexOf('정답')]++;
		}
		const expected = RUNS / 4;
		counts.forEach((c) => expect(Math.abs(c - expected)).toBeLessThan(expected * 0.25));
	});
});
