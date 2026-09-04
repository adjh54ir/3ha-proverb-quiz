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
 * 첫 표시에서 딤이 잘리는 문제는 AppModal 안에서만 고칠 수 있다
 * (창이 뜬 뒤 네이티브 프롭을 다시 흘려보내 edge-to-edge 를 재적용한다).
 * 어딘가에서 react-native 의 Modal 을 직접 쓰면 그 팝업만 조용히 다시 잘린다.
 */
test('react-native 의 Modal 을 직접 쓰는 파일은 AppModal 뿐이다', () => {
	const walk = (dir: string): string[] =>
		fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const full = path.join(dir, entry.name);
			return entry.isDirectory() ? walk(full) : full.endsWith('.tsx') || full.endsWith('.ts') ? [full] : [];
		});

	const src = path.join(__dirname, '..', 'src');
	const offenders = walk(src)
		.filter((file) => /^import\s[^;]*\bModal\b[^;]*from\s'react-native'/m.test(fs.readFileSync(file, 'utf8')))
		.map((file) => path.relative(src, file))
		// ModalProps 타입만 가져다 쓰는 파일은 대상이 아니다.
		.filter((rel) => !/^const\//.test(rel))
		.filter((rel) => rel !== path.join('screens', 'common', 'atomic', 'AppModal.tsx'));

	expect(offenders).toEqual([]);
});

/**
 * DropDownPicker(listMode="MODAL") 는 라이브러리가 RN Modal 을 직접 렌더해서 AppModal 을 안 거친다.
 * 공용 훅으로 같은 처리를 받지 않으면 그 팝업만 처음 열 때 다시 밀린다.
 */
test('listMode="MODAL" 인 화면은 useDropdownModalProps 를 쓴다', () => {
	const src = path.join(__dirname, '..', 'src');
	const walk = (dir: string): string[] =>
		fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const full = path.join(dir, entry.name);
			return entry.isDirectory() ? walk(full) : full.endsWith('.tsx') ? [full] : [];
		});

	const offenders = walk(src)
		.map((file) => ({ rel: path.relative(src, file), source: fs.readFileSync(file, 'utf8') }))
		.filter(({ source }) => source.includes('listMode="MODAL"'))
		.filter(({ source }) => !source.includes('useDropdownModalProps'))
		.map(({ rel }) => rel);

	expect(offenders).toEqual([]);
});
