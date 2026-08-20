/**
 * 한글 검색 유틸 — 초성 검색을 지원한다.
 *
 * - 검색어가 전부 초성(ㄱ~ㅎ)이면 대상 문장의 초성만 뽑아 부분 일치로 비교한다.
 *   예) 'ㄱㅇㅂ' → '가는 말이 고와야 오는 말이 곱다' 의 초성열에서 매칭
 * - 그 외에는 기존처럼 대소문자 무시 부분 일치.
 * - 공백은 양쪽 모두 제거하고 비교하므로 '소 잃고' 와 '소잃고' 가 같이 걸린다.
 */

/** 유니코드 한글 음절 영역 */
const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
/** 음절 하나가 갖는 (중성 21 × 종성 28) 조합 수 */
const JUNG_JONG_COUNT = 21 * 28;

/** 초성 19자 — 음절에서 뽑아낸 초성과 자판으로 입력한 자음이 같은 문자다. */
const CHOSEONG = [
	'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
	'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

/** 자음(ㄱ~ㅎ) 낱자만으로 이루어진 문자열인지 — 초성 검색으로 볼지 판단한다. */
const isChoseongOnly = (value: string): boolean => /^[ㄱ-ㅎ]+$/.test(value);

/** 문장에서 초성만 뽑는다. 한글 음절이 아닌 문자는 그대로 둔다. */
export const toChoseong = (text: string): string => {
	let result = '';
	for (const char of text) {
		const code = char.charCodeAt(0);
		if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
			result += CHOSEONG[Math.floor((code - HANGUL_BASE) / JUNG_JONG_COUNT)];
		} else {
			result += char;
		}
	}
	return result;
};

/** 비교용 정규화 — 공백 제거 + 소문자화 */
const normalize = (text: string): string => text.replace(/\s+/g, '').toLowerCase();

/**
 * 검색어가 대상 문자열들 중 하나라도 매칭되는지.
 * @param keyword 사용자가 입력한 검색어
 * @param targets 검색 대상 문자열(속담/의미 등). undefined 는 무시한다.
 */
export const matchesKeyword = (keyword: string, ...targets: (string | undefined | null)[]): boolean => {
	const query = normalize(keyword);
	if (!query) {
		return true;
	}
	const choseongSearch = isChoseongOnly(query);

	return targets.some((target) => {
		if (!target) {
			return false;
		}
		const source = normalize(target);
		return choseongSearch ? toChoseong(source).includes(query) : source.includes(query);
	});
};
