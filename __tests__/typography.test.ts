/**
 * 서체 규칙 회귀 테스트 (CLAUDE.md "색·서체 규칙", Theme.ts FONTS 주석)
 *
 * 굵기와 명조 사용처가 화면마다 제각각으로 다시 흩어지지 않도록 소스를 직접 훑는다.
 *  1. 굵기는 400/500/600/700 네 단계만 — 800 이상은 서체 파일이 없어 700 과 똑같이 그려진다.
 *  2. 명조(FONTS.display) 스타일은 400/700 두 단계만 — 고운바탕 파일이 두 벌뿐이다.
 *  3. 섹션·빈 화면 제목 스타일에는 명조를 쓰지 않는다 — "명조 = 속담·화면/모달 타이틀".
 */
import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', 'src');

const walk = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const abs = path.join(dir, e.name);
		if (e.isDirectory()) return walk(abs);
		return /\.tsx?$/.test(e.name) ? [abs] : [];
	});

const files = walk(SRC).map((abs) => ({ name: path.relative(SRC, abs), source: fs.readFileSync(abs, 'utf8') }));

/** `name: { ... }` 형태의 스타일 객체를 이름과 본문으로 뽑는다(중첩 중괄호 포함). */
const styleObjects = (source: string) => {
	const out: { key: string; body: string }[] = [];
	const re = /(\w+):\s*\{/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(source))) {
		let depth = 1;
		let i = re.lastIndex;
		while (depth && i < source.length) {
			if (source[i] === '{') depth++;
			else if (source[i] === '}') depth--;
			i++;
		}
		out.push({ key: m[1], body: source.slice(re.lastIndex, i - 1) });
	}
	return out;
};

test('굵기는 400/500/600/700 네 단계만 쓴다', () => {
	const offenders = files.flatMap(({ name, source }) =>
		[...source.matchAll(/fontWeight:\s*['"]?(\w+)['"]?/g)].filter((m) => !['400', '500', '600', '700'].includes(m[1])).map((m) => `${name} ${m[0]}`),
	);
	expect(offenders).toEqual([]);
});

test('명조 스타일의 굵기는 400/700 두 단계만 쓴다', () => {
	const offenders = files.flatMap(({ name, source }) =>
		styleObjects(source)
			.filter(({ body }) => body.includes('FONTS.display'))
			.flatMap(({ key, body }) => {
				const w = body.match(/fontWeight:\s*'(\d+)'/);
				return w && !['400', '700'].includes(w[1]) ? [`${name} ${key} ${w[1]}`] : [];
			}),
	);
	expect(offenders).toEqual([]);
});

test('섹션·빈 화면 제목에는 명조를 쓰지 않는다', () => {
	const BODY_ONLY = /^(section\w*Title\d*|empty\w*Title)$/;
	const offenders = files.flatMap(({ name, source }) =>
		styleObjects(source)
			.filter(({ key, body }) => BODY_ONLY.test(key) && body.includes('FONTS.display'))
			.map(({ key }) => `${name} ${key}`),
	);
	expect(offenders).toEqual([]);
});
