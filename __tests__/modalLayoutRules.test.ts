/**
 * 모달 레이아웃 규칙 회귀 테스트 (CLAUDE.md "모달 레이아웃 규칙")
 *
 * 팝업이 시스템 바에 잘리는 문제는 매번 "한 모달만" 고쳐 왔고, 새로 만든 모달에서 같은 방식으로
 * 다시 새어 나왔다. 타입 검사로는 잡히지 않는 규칙이라 소스를 직접 훑어 두 가지만 못박는다.
 *
 *  1. 세로 크기에 scaleHeight 를 쓰지 않는다 — scaleHeight(N) 은 상수가 아니라 화면 높이에 비례한다
 *     (기기 높이 / 812 배, MAX_HEIGHT_SCALE=1.3 상한). 큰 기기에서 카드가 같이 커진다
 *     (실제로 BadgeListModal 440, NewBadgeModal 380 이 그랬다).
 *  2. 오버레이(딤)는 안전 여백을 직접 준다 — AppModal 이 시스템 바까지 덮기 때문.
 */
import fs from 'fs';
import path from 'path';

const MODAL_DIRS = ['src/screens/modal', 'src/screens/common/modal'];

const modalFiles = MODAL_DIRS.flatMap((dir) => {
	const abs = path.join(__dirname, '..', dir);
	return fs
		.readdirSync(abs)
		.filter((name) => name.endsWith('.tsx'))
		.map((name) => ({ name: `${dir}/${name}`, source: fs.readFileSync(path.join(abs, name), 'utf8') }));
});

test('모달 파일을 찾았다', () => {
	expect(modalFiles.length).toBeGreaterThan(10);
});

test('세로 크기(maxHeight/height)에 scaleHeight 를 쓰지 않는다', () => {
	const offenders = modalFiles.flatMap(({ name, source }) =>
		source
			.split('\n')
			.map((line, i) => ({ line: line.trim(), no: i + 1 }))
			// lineHeight 는 글꼴 행간이라 규칙 대상이 아니다.
			.filter(({ line }) => /(?<!line)(?:max)?[Hh]eight:\s*scaleHeight\(/.test(line) && !/^\/\//.test(line))
			.filter(({ line }) => /maxHeight:\s*scaleHeight\(/.test(line))
			.map(({ no, line }) => `${name}:${no} ${line}`),
	);
	expect(offenders).toEqual([]);
});

test('모달 오버레이는 안전 여백을 직접 준다', () => {
	const offenders = modalFiles
		.filter(({ source }) => source.includes('atomic/AppModal'))
		.filter(({ source }) => !source.includes('useModalSafePadding') && !source.includes('useSafeAreaInsets'))
		.map(({ name }) => name);
	expect(offenders).toEqual([]);
});

/**
 * 위 테스트는 `useSafeAreaInsets` 를 import 만 해 둬도 통과한다. 실제로 그랬다 —
 * AddProverbModal / FavoriteAddModal 은 insets 를 footer 에만 쓰고 오버레이에는 아무 여백이
 * 없어서, 두 파일은 규칙을 어긴 채로 테스트를 통과하고 있었다.
 *
 * 아래에 붙는 바텀시트는 `useModalSafePadding()` 을 그대로 쓸 수 없다. 이 훅은
 * paddingBottom 까지 주기 때문에 `justifyContent: 'flex-end'` 인 시트가 화면 하단에서 떠서
 * 시트와 화면 끝 사이에 딤 띠가 생긴다(하단 시스템 바는 footer 가 이미 피한다).
 * 그래서 훅 대신 insets 를 직접 쓰는 것은 허용하되, **상단 여백을 실제로 적용했는지**는 확인한다.
 */
test('훅 대신 insets 를 직접 쓰는 모달은 상단 여백을 실제로 적용한다', () => {
	const offenders = modalFiles
		.filter(({ source }) => source.includes('atomic/AppModal'))
		.filter(({ source }) => !source.includes('useModalSafePadding'))
		.filter(({ source }) => !/paddingTop:\s*insets\.top/.test(source))
		.map(({ name }) => name);
	expect(offenders).toEqual([]);
});

/**
 * scale 로 등장·맥동하는 카드에 테두리가 있으면 `overflow: 'hidden'` 이 필수다. (규칙 7)
 *
 * iOS 는 테두리를 내용 **뒤에** 그려야 할 때(CSS 방식) 배경색을 뷰 레이어에 직접 칠하지 않고
 * 별도 서브레이어로 그린다. 그 서브레이어는 첫 마운트 때 transform 이 반영된 크기로 만들어져서,
 * scale 0.95 로 등장하는 첫 프레임에 배경만 95% 크기로 남는다 — 카드 안쪽이 덜 채워져 보이는
 * 그 버그다(CheckInModal / LevelModal / NewBadgeModal / VersionCheckModal … 이 그랬다).
 *
 * clipsToBounds(= overflow: 'hidden') 면 iOS 가 CoreAnimation 테두리 경로를 타면서 배경을
 * 뷰 레이어에 그대로 칠하므로 서브레이어가 아예 생기지 않는다.
 *
 * scale 이 1 에서 시작하면 첫 프레임은 멀쩡하지만, 규칙을 "테두리 + scale" 로 단순하게 두는 편이
 * 새로 만드는 카드에서 매번 판단하지 않아도 되어 싸다. 그래서 예외를 두지 않는다.
 *
 * scale 은 세 갈래로 카드에 닿는다 — 세 갈래 모두 훑는다.
 *  1. style 안에 직접 `scale:` 이 있다
 *  2. `useModalEnter` / `useModalEnterExit` 가 돌려준 스타일을 얹는다 (변수명 자유)
 *  3. `PopInView` 로 감싼다 (내부에서 useModalEnter 를 쓴다)
 */
const SRC = path.join(__dirname, '..', 'src');

const walkTsx = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory() ? walkTsx(full) : entry.name.endsWith('.tsx') ? [full] : [];
	});

/** 여는 괄호 위치에서 짝이 맞는 닫는 괄호 다음 인덱스를 돌려준다 (중첩 객체 때문에 정규식으로는 못 자른다) */
const matchBlock = (source: string, open: number) => {
	let depth = 0;
	for (let i = open; i < source.length; i += 1) {
		if ('{[('.includes(source[i])) depth += 1;
		else if ('}])'.includes(source[i])) {
			depth -= 1;
			if (depth === 0) return i + 1;
		}
	}
	return source.length;
};

/** StyleSheet 정의를 이름 → 본문 으로 모은다 */
const collectStyles = (source: string) => {
	const out = new Map<string, string>();
	for (const m of source.matchAll(/^[ \t]*(\w+):\s*\{/gm)) {
		const open = source.indexOf('{', m.index!);
		if (!out.has(m[1])) out.set(m[1], source.slice(open, matchBlock(source, open)));
	}
	return out;
};

test('scale 이 걸리는 테두리 카드는 overflow: hidden 을 준다', () => {
	const offenders = walkTsx(SRC).flatMap((file) => {
		const source = fs.readFileSync(file, 'utf8');
		const styles = collectStyles(source);
		// useModalEnter(Exit) 결과를 담은 변수명 (enterStyle / cardStyle / …)
		const enterVars = [
			...source.matchAll(/const\s+(?:(\w+)|\{\s*style:\s*(\w+)[^}]*\})\s*=\s*useModalEnter(?:Exit)?\(/g),
		].map((m) => m[1] ?? m[2]);

		const scaled = new Set<string>();
		for (const m of source.matchAll(/style=\{/g)) {
			const open = source.indexOf('{', m.index!);
			const attr = source.slice(open, matchBlock(source, open));
			const hasScale = /scale\s*:/.test(attr) || enterVars.some((v) => new RegExp(`\\b${v}\\b`).test(attr));
			if (hasScale) [...attr.matchAll(/styles\.(\w+)/g)].forEach((s) => scaled.add(s[1]));
		}
		// PopInView 는 감싼 카드에 useModalEnter 를 얹는다
		for (const m of source.matchAll(/<PopInView[^>]*style=\{styles\.(\w+)\}/g)) scaled.add(m[1]);

		return [...scaled]
			.filter((name) => {
				const block = styles.get(name);
				return block && /borderWidth:/.test(block) && !/overflow:/.test(block);
			})
			.map((name) => `${path.relative(path.join(__dirname, '..'), file)} → ${name}`);
	});
	expect(offenders).toEqual([]);
});
