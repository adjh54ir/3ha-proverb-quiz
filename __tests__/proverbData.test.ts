/**
 * ConstMainData 의 속담 데이터가 지켜야 할 최소 규칙.
 *
 * 우리말샘 원문을 일괄 이식하면서 생겼던 결함들을 다시 들이지 않기 위한 그물이다.
 * 문장 하나하나의 사실 여부는 여기서 못 잡는다 — 형식이 무너지는 것만 막는다.
 */
import { CONST_MAIN_DATA } from '@/const/ConstMainData';

const PROVERBS = CONST_MAIN_DATA.PROVERB;

/** 괄호·대괄호 이형태와 띄어쓰기를 지운 비교용 표제 */
const normalize = (text: string) => text.replace(/[[\](){}]/g, '').replace(/\s+/g, '').replace(/[.,!?~]/g, '');

/** 마지막 음절에 받침이 있는지 (없으면 '를', 있으면 '을') */
const hasFinalConsonant = (syllable: string) => {
	const code = syllable.charCodeAt(0);
	if (code < 0xac00 || code > 0xd7a3) {
		return null;
	}
	return (code - 0xac00) % 28 !== 0;
};

const duplicatesOf = <T>(keyOf: (item: (typeof PROVERBS)[number]) => T) => {
	const seen = new Map<T, number[]>();
	PROVERBS.forEach((item) => {
		const key = keyOf(item);
		const bucket = seen.get(key) ?? [];
		bucket.push(item.id);
		seen.set(key, bucket);
	});
	return [...seen.values()].filter((ids) => ids.length > 1);
};

test('데이터를 찾았다', () => {
	expect(PROVERBS.length).toBeGreaterThan(2000);
});

test('id 와 표제가 중복되지 않는다', () => {
	expect(duplicatesOf((p) => p.id)).toEqual([]);
	// 괄호·띄어쓰기만 다른 표제도 같은 속담이다
	expect(duplicatesOf((p) => normalize(p.proverb))).toEqual([]);
});

test('longMeaning 은 "이르는 말." 로 끝난다', () => {
	const broken = PROVERBS.filter((p) => !/이르는 말\.$/.test(p.longMeaning.trim()));
	expect(broken.map((p) => `${p.id} ${p.proverb}`)).toEqual([]);
});

test('"…을/를 이르는 말" 의 조사가 앞 음절 받침과 맞는다', () => {
	const wrong = PROVERBS.filter((p) => {
		const text = p.longMeaning.trim();
		const eul = text.match(/(.)을 이르는 말\.$/);
		if (eul) {
			return hasFinalConsonant(eul[1]) === false;
		}
		const reul = text.match(/(.)를 이르는 말\.$/);
		return reul ? hasFinalConsonant(reul[1]) === true : false;
	});
	expect(wrong.map((p) => `${p.id} ${p.proverb}`)).toEqual([]);
});

test('뜻풀이는 평서형으로 끝난다 (존댓말 금지)', () => {
	const honorific = PROVERBS.filter((p) => /(합니다|입니다|습니다)\.$/.test(p.meaning.trim()) || /(합니다|입니다|습니다)\.$/.test(p.longMeaning.trim()));
	expect(honorific.map((p) => `${p.id} ${p.proverb}`)).toEqual([]);
});

test('meaning 과 longMeaning 은 서로 다른 문장이다', () => {
	// 같으면 카드 앞뒤에 같은 글이 두 번 나온다
	const same = PROVERBS.filter((p) => p.meaning.trim() === p.longMeaning.trim());
	expect(same.map((p) => `${p.id} ${p.proverb}`)).toEqual([]);
});

test('예문은 두 개씩, 반말로 통일한다', () => {
	const badCount = PROVERBS.filter((p) => p.example.length !== 2);
	expect(badCount.map((p) => p.id)).toEqual([]);

	const honorific = PROVERBS.filter((p) => p.example.some((sentence) => /(요|습니다)[.!?]$/.test(sentence.trim())));
	expect(honorific.map((p) => `${p.id} ${p.proverb}`)).toEqual([]);
});

test('sameProverb 에 빈 문자열을 남기지 않는다', () => {
	const empty = PROVERBS.filter((p) => (p.sameProverb ?? []).some((s) => !s.trim()));
	expect(empty.map((p) => p.id)).toEqual([]);
});
