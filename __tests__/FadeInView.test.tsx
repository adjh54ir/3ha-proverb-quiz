import { staggerDelay } from '@/components/animation/FadeInView';

describe('staggerDelay', () => {
	it('앞쪽 항목은 순서대로 지연이 늘어난다', () => {
		expect(staggerDelay(0)).toBe(0);
		expect(staggerDelay(1)).toBe(40);
		expect(staggerDelay(5)).toBe(200);
	});

	it('기본 상한을 넘으면 지연 없이 즉시 표시한다 (긴 목록 스크롤 성능 보호)', () => {
		expect(staggerDelay(6)).toBe(0);
		expect(staggerDelay(500)).toBe(0);
	});

	it('상한을 늘리면 그 개수까지 순차로 등장한다 (홈 액션 카드처럼 짧은 고정 목록)', () => {
		expect(staggerDelay(6, 8)).toBe(240);
		expect(staggerDelay(8, 8)).toBe(0);
	});
});
