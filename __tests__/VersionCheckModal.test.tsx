/**
 * 강제 업데이트 게이트 판정 회귀 테스트.
 *
 * 이 로직이 틀리면 "앱이 막힌 줄 알았는데 그냥 통과" 하거나 "업데이트를 끝냈는데도 잠김" 이 된다.
 * 화면 렌더가 아니라 판정 함수만 못박는다 — 게이트를 여는/닫는 근거가 전부 여기에 모여 있다.
 *
 *  - major / minor 상승은 반드시 force
 *  - patch 만 상승하면 optional
 *  - 동일하거나 설치 버전이 더 높으면 none
 *  - 스토어가 주는 실제 값들(4자리 '2.0.1.1', '기기에 따라 다름')에서 게이트가 조용히 꺼지지 않는다
 */
import { getUpdateKind, parseVersion } from '@/screens/common/modal/VersionCheckModal';

describe('getUpdateKind', () => {
	it('major 가 올라가면 강제 업데이트', () => {
		expect(getUpdateKind('1.4.9', '2.0.0')).toBe('force');
		// 설치 버전의 minor/patch 가 더 높아도 major 가 낮으면 강제다
		expect(getUpdateKind('1.9.9', '2.0.0')).toBe('force');
	});

	it('minor 가 올라가면 강제 업데이트', () => {
		expect(getUpdateKind('1.0.0', '1.1.0')).toBe('force');
		expect(getUpdateKind('1.0.7', '1.1.0')).toBe('force');
	});

	it('patch 만 올라가면 선택 업데이트', () => {
		expect(getUpdateKind('1.0.0', '1.0.1')).toBe('optional');
	});

	it('버전이 같으면 팝업 없음', () => {
		expect(getUpdateKind('1.2.3', '1.2.3')).toBe('none');
	});

	it('설치 버전이 스토어보다 높으면 팝업 없음 (심사 중인 빌드)', () => {
		expect(getUpdateKind('2.0.0', '1.9.9')).toBe('none');
		expect(getUpdateKind('1.1.0', '1.0.0')).toBe('none');
		expect(getUpdateKind('1.0.1', '1.0.0')).toBe('none');
	});

	it('스토어의 4자리 버전(2.0.1.1)도 앞 3자리로 비교한다', () => {
		expect(parseVersion('2.0.1.1')).toEqual([2, 0, 1]);
		expect(getUpdateKind('1.0.0', '2.0.1.1')).toBe('force');
		expect(getUpdateKind('2.0.0', '2.0.1.1')).toBe('optional');
		expect(getUpdateKind('2.0.1', '2.0.1.1')).toBe('none');
	});

	it('자리수가 모자라거나 꼬리표가 붙어도 비교한다', () => {
		expect(parseVersion('1.2')).toEqual([1, 2, 0]);
		expect(getUpdateKind('1.0.0', '1.2')).toBe('force');
		expect(getUpdateKind('1.0.0', '1.0.3-beta')).toBe('optional');
	});

	it('읽을 수 없는 스토어 버전은 unknown 이다 — 게이트를 조용히 끄지 않는다', () => {
		// Play 리스팅은 이런 문자열을 그대로 돌려준다. 'none' 이 되면 강제 게이트가 사라진다.
		for (const latest of ['기기에 따라 다름', 'Varies with device', '', null, undefined]) {
			expect(getUpdateKind('1.0.0', latest)).not.toBe('none');
			expect(getUpdateKind('1.0.0', latest)).toBe('unknown');
		}
	});

	it('설치 버전을 읽을 수 없어도 unknown 이다', () => {
		expect(getUpdateKind(null, '2.0.0')).toBe('unknown');
	});
});
