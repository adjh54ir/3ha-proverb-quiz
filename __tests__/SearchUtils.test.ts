/**
 * 초성 검색 회귀 테스트
 */
import { matchesKeyword, toChoseong } from '../src/utils/SearchUtils';

const PROVERB = '가는 말이 고와야 오는 말이 곱다';

test('한글 음절에서 초성을 뽑는다', () => {
	expect(toChoseong('소 잃고')).toBe('ㅅ ㅇㄱ');
});

test('초성만 입력해도 속담이 검색된다', () => {
	expect(matchesKeyword('ㄱㄴㅁ', PROVERB)).toBe(true);
	expect(matchesKeyword('ㅁㅇㄱ', PROVERB)).toBe(true); // 중간부터도 매칭
	expect(matchesKeyword('ㅋㅋㅋ', PROVERB)).toBe(false);
});

test('일반 검색어는 부분 일치로 동작하고 공백을 무시한다', () => {
	expect(matchesKeyword('고와야', PROVERB)).toBe(true);
	expect(matchesKeyword('가는말이', PROVERB)).toBe(true);
	expect(matchesKeyword('없는말', PROVERB)).toBe(false);
});

test('여러 대상 중 하나만 걸려도 매칭이고, 빈 검색어는 항상 통과한다', () => {
	expect(matchesKeyword('ㅁㅇ', undefined, PROVERB)).toBe(true);
	expect(matchesKeyword('   ', PROVERB)).toBe(true);
});
