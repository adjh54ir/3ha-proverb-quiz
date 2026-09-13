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

/**
 * 같은 속담을 다른 표기로 두 번 실은 것까지 잡는 비교용 표제.
 *
 * `normalize` 는 대괄호 기호만 지워서 "달걀로 바위[백운대/성] 치기" 가
 * "달걀로바위백운대/성치기" 가 된다. 그래서 "계란으로 바위 치기" 와 같은 속담인 걸 못 잡았다.
 * 여기서는 대괄호 안 대체어를 실제로 펼치고, 뜻이 달라지지 않는 표기 차이만 한 형태로 모은다.
 */
const expandVariants = (text: string) => {
	let forms = [text];
	for (let depth = 0; depth < 5; depth += 1) {
		const next: string[] = [];
		let changed = false;
		forms.forEach((form) => {
			const match = /(\S*?)\[([^\]]+)\]/.exec(form);
			if (!match) {
				next.push(form);
				return;
			}
			changed = true;
			// 대괄호를 통째로 빼는 형태 + 대체어를 하나씩 끼운 형태
			next.push(form.replace(match[0], match[1]));
			match[2].split('/').forEach((alt) => next.push(form.replace(match[0], alt)));
		});
		forms = [...new Set(next)];
		if (!changed) {
			break;
		}
	}
	const withParens = forms.flatMap((form) => [form.replace(/\([^)]*\)/g, ''), form.replace(/\(([^)]*)\)/g, '$1')]);
	return [
		...new Set(
			withParens
				.map((form) =>
					form
						.replace(/\s+/g, '')
						.replace(/[.,!?~·'"]/g, '')
						.replace(/계란|닭알/g, '달걀')
						.replace(/으로/g, '로')
						.replace(/(이라|이다)$/, ''),
				)
				.filter(Boolean),
		),
	];
};

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

test('표기만 다른 같은 속담을 두 번 싣지 않는다', () => {
	// 한 표제가 여러 표기 변이를 가지므로, 변이 하나라도 겹치면 같은 속담으로 본다.
	const owners = new Map<string, number[]>();
	PROVERBS.forEach((item) => {
		expandVariants(item.proverb).forEach((form) => {
			const bucket = owners.get(form) ?? [];
			if (!bucket.includes(item.id)) {
				bucket.push(item.id);
			}
			owners.set(form, bucket);
		});
	});
	const collisions = [...new Set([...owners.values()].filter((ids) => ids.length > 1).map((ids) => ids.join(',')))];
	expect(collisions).toEqual([]);
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
