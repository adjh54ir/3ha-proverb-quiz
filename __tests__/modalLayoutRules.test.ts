/**
 * 모달 레이아웃 규칙 회귀 테스트 (CLAUDE.md "모달 레이아웃 규칙")
 *
 * 팝업이 시스템 바에 잘리는 문제는 매번 "한 모달만" 고쳐 왔고, 새로 만든 모달에서 같은 방식으로
 * 다시 새어 나왔다. 타입 검사로는 잡히지 않는 규칙이라 소스를 직접 훑어 두 가지만 못박는다.
 *
 *  1. 세로 크기에 scaleHeight 를 쓰지 않는다 — scaleHeight(N) 은 상수가 아니라 "화면 높이의 N/812"
 *     라서 큰 기기에서 카드가 같이 커진다(실제로 BadgeListModal 440, NewBadgeModal 380 이 그랬다).
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
