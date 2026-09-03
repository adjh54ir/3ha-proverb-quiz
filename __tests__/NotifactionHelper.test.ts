import { getNextTriggerTimestamp, parseAlarmHour } from '@/utils/NotifactionHelper';

/**
 * 알림 예약 시각 계산 회귀 테스트.
 *
 * 사용자 신고: "지정한 푸시 시간이 자꾸 바뀐다". 원인이 두 군데 있었다.
 * 1) 예약 timestamp 가 과거(또는 몇 ms 뒤)면 notifee 가
 *    "'trigger.timestamp' date must be in the future." 로 throw 해 예약이 통째로 실패한다.
 * 2) 저장값 범위 검증이 없어 '99:00' 같은 깨진 값이 setHours(99) 로 넘어가 알람이 며칠 뒤로 밀렸다.
 */
describe('getNextTriggerTimestamp', () => {
	it('오늘 아직 지나지 않은 시각이면 오늘 그 시각(분/초 0)으로 잡는다', () => {
		const from = new Date(2026, 8, 3, 10, 30, 45, 123); // 2026-09-03 10:30:45.123
		const next = new Date(getNextTriggerTimestamp(15, 0, from));

		expect(next.getDate()).toBe(3);
		expect(next.getHours()).toBe(15);
		expect(next.getMinutes()).toBe(0);
		expect(next.getSeconds()).toBe(0);
		expect(next.getMilliseconds()).toBe(0);
	});

	it('이미 지난 시각이면 다음 날로 넘긴다', () => {
		const from = new Date(2026, 8, 3, 16, 0, 0, 0);
		const next = new Date(getNextTriggerTimestamp(15, 0, from));

		expect(next.getDate()).toBe(4);
		expect(next.getHours()).toBe(15);
	});

	it('지정 시각과 정확히 같은 순간이어도 과거로 잡지 않는다 (내일)', () => {
		const from = new Date(2026, 8, 3, 15, 0, 0, 0);
		const next = new Date(getNextTriggerTimestamp(15, 0, from));

		expect(next.getDate()).toBe(4);
	});

	it('정시 직전(1초 미만)이면 다음 날로 넘긴다 — 네이티브 왕복 중 과거가 되어 예약이 터졌다', () => {
		const from = new Date(2026, 8, 3, 14, 59, 59, 998);
		const next = new Date(getNextTriggerTimestamp(15, 0, from));

		expect(next.getDate()).toBe(4); // 2ms 뒤로 잡으면 notifee 검증에서 throw
	});

	it('월말/연말 경계에서도 날짜가 정상으로 넘어간다', () => {
		const from = new Date(2026, 11, 31, 23, 30, 0, 0); // 2026-12-31 23:30
		const next = new Date(getNextTriggerTimestamp(9, 0, from));

		expect(next.getFullYear()).toBe(2027);
		expect(next.getMonth()).toBe(0);
		expect(next.getDate()).toBe(1);
		expect(next.getHours()).toBe(9);
	});

	it('어떤 시각을 넣어도 결과는 항상 기준 시각보다 미래다', () => {
		const from = new Date(2026, 8, 3, 12, 0, 0, 0);
		for (let hour = 0; hour < 24; hour++) {
			expect(getNextTriggerTimestamp(hour, 0, from)).toBeGreaterThan(from.getTime());
		}
	});
});

describe('parseAlarmHour', () => {
	it("신규 포맷 'HH:mm' 은 시만 읽는다", () => {
		expect(parseAlarmHour('07:00')).toBe(7);
		expect(parseAlarmHour('7:30')).toBe(7);
		expect(parseAlarmHour('00:00')).toBe(0);
		expect(parseAlarmHour('23:00')).toBe(23);
	});

	it('구버전 ISO 문자열은 기기 로컬 시로 환산해 읽는다 (하위 호환)', () => {
		const legacy = new Date(2026, 8, 3, 21, 15, 0, 0);
		expect(parseAlarmHour(legacy.toISOString())).toBe(21);
	});

	it('범위를 벗어난 값은 거부한다 — setHours(99) 로 알람이 며칠 뒤로 밀리던 원인', () => {
		expect(parseAlarmHour('99:00')).toBeNull();
		expect(parseAlarmHour('24:00')).toBeNull();
	});

	it('빈 값·쓰레기 값은 거부한다', () => {
		expect(parseAlarmHour(undefined)).toBeNull();
		expect(parseAlarmHour(null)).toBeNull();
		expect(parseAlarmHour('')).toBeNull();
		expect(parseAlarmHour('아무거나')).toBeNull();
		expect(parseAlarmHour('15시')).toBeNull();
	});
});
