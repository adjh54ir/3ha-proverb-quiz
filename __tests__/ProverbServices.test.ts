/**
 * 전역 속담 목록 회귀 테스트
 *
 * selectProverbList() 는 CONST_MAIN_DATA.PROVERB 배열을 그대로 돌려준다.
 * 화면에서 복사 없이 sort/reverse 하면 속담 사전 등 앱 전체의 목록 순서가 영구히 뒤섞였다.
 * (타임 챌린지 진입/재시작에서 실제로 발생했던 버그)
 */
import ProverbServices from '../src/services/ProverbServices';

test('여러 화면이 같은 배열 인스턴스를 공유한다', () => {
	expect(ProverbServices.selectProverbList()).toBe(ProverbServices.selectProverbList());
});

test('복사 후 섞으면 원본 순서가 보존된다', () => {
	const before = ProverbServices.selectProverbList().map((p) => p.id);

	// 화면에서 쓰는 방식: 반드시 복사한 뒤 섞는다
	const shuffled = [...ProverbServices.selectProverbList()].sort(() => 0.5 - Math.random());

	expect(shuffled).toHaveLength(before.length);
	expect(ProverbServices.selectProverbList().map((p) => p.id)).toEqual(before);
});
