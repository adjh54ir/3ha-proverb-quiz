import DateUtils from '@/utils/DateUtils';

/**
 * 날짜 유틸 회귀 테스트.
 *
 * 'YYYY-MM-DD' 를 `new Date()` 로 파싱하면 **UTC 자정**이 된다. 그대로 getDate() 를 부르면
 * UTC- 지역(미주 등)에서 하루 전으로 나와, 오늘의 퀴즈가 매번 새로 발급되고 답이 지워졌다.
 * 날짜만 있는 값은 반드시 로컬 자정으로 파싱되어야 한다.
 */
describe('toLocalDate', () => {
	it("'YYYY-MM-DD' 는 UTC 가 아니라 로컬 자정으로 파싱된다", () => {
		const date = DateUtils.toLocalDate('2026-09-03')!;
		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth() + 1).toBe(9);
		expect(date.getDate()).toBe(3); // new Date('2026-09-03') 는 UTC- 지역에서 2일이 된다
		expect(date.getHours()).toBe(0);
	});

	it('ISO 타임스탬프는 그대로 파싱한다', () => {
		const iso = '2026-09-03T12:34:56.000Z';
		expect(DateUtils.toLocalDate(iso)!.getTime()).toBe(new Date(iso).getTime());
	});

	it('빈 값/이상한 값은 null', () => {
		expect(DateUtils.toLocalDate(null)).toBeNull();
		expect(DateUtils.toLocalDate('')).toBeNull();
		expect(DateUtils.toLocalDate('내일')).toBeNull();
	});
});

describe('toLocalDateKey', () => {
	it("'YYYY-MM-DD' 는 이미 로컬 키라 그대로 돌려준다", () => {
		expect(DateUtils.toLocalDateKey('2026-09-03')).toBe('2026-09-03');
	});

	it('Date 는 기기 타임존 기준 날짜로 환산한다', () => {
		const date = new Date(2026, 8, 3, 1, 0, 0); // 로컬 9/3 01:00
		expect(DateUtils.toLocalDateKey(date)).toBe('2026-09-03');
	});
});

describe('toLocalTime', () => {
	it('날짜만 있는 값과 ISO 값이 같은 기준으로 정렬된다', () => {
		const dateOnly = DateUtils.toLocalTime('2026-09-03');
		const sameDayIso = DateUtils.toLocalTime(new Date(2026, 8, 3, 9, 0, 0).toISOString());
		const nextDay = DateUtils.toLocalTime('2026-09-04');
		expect(dateOnly).toBeLessThan(sameDayIso);
		expect(sameDayIso).toBeLessThan(nextDay);
	});

	it('파싱 실패는 0', () => {
		expect(DateUtils.toLocalTime(undefined)).toBe(0);
	});
});

describe('formatDate / formatLocal', () => {
	it('type6 은 YY.MM.DD', () => {
		expect(DateUtils.formatDate(new Date(2026, 8, 3), 'type6')).toBe('26.09.03');
	});

	it('formatLocal 은 저장 포맷을 가리지 않는다', () => {
		expect(DateUtils.formatLocal('2026-09-03', 'type6')).toBe('26.09.03');
		expect(DateUtils.formatLocal(new Date(2026, 8, 3, 23, 30), 'type6')).toBe('26.09.03');
	});

	it('formatLocal 은 실패 시 fallback', () => {
		expect(DateUtils.formatLocal(null, 'type6', '없음')).toBe('없음');
	});
});
