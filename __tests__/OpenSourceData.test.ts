import fs from 'fs';
import path from 'path';

import { OPEN_SOURCE_LIBS } from '@/const/common/OpenSourceData';

/**
 * 오픈소스 고지 회귀 테스트.
 *
 * 예전에는 설정 > 오픈소스 화면이 SettingModal 안의 손으로 적은 7개 배열을 그리고 있었고,
 * scripts/genOpenSource.js 가 만든 39개짜리 목록은 아무도 import 하지 않는 죽은 파일이었다.
 * 그래서 실제 번들에 들어가는 라이브러리 32개가 고지에서 빠지고, 적혀 있던 버전 7개 중
 * 5개는 설치 버전과 달랐다. 라이브러리를 추가하고 스크립트를 다시 돌리지 않으면 여기서 걸린다.
 */
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

/** 런타임에 번들되지 않는 도구성 패키지 (genOpenSource.js 의 제외 규칙과 같아야 한다) */
const EXCLUDED = (name: string) => name.startsWith('babel-plugin-') || name.startsWith('@babel/');

const runtimeDeps = Object.keys(pkg.dependencies).filter((name) => !EXCLUDED(name));
const notified = new Set(OPEN_SOURCE_LIBS.map((lib) => lib.name));

test('번들되는 모든 의존성이 고지 목록에 있다', () => {
	expect(runtimeDeps.filter((name) => !notified.has(name))).toEqual([]);
});

test('고지 목록에 더 이상 쓰지 않는 항목이 남아 있지 않다', () => {
	const declared = new Set(runtimeDeps);
	expect(OPEN_SOURCE_LIBS.map((lib) => lib.name).filter((name) => !declared.has(name))).toEqual([]);
});

test('라이선스 종류를 못 읽은 항목이 없다', () => {
	// LICENSE 파일만 있고 package.json 에 license 필드가 없는 패키지도 종류가 채워져야 한다.
	expect(OPEN_SOURCE_LIBS.filter((lib) => lib.license === 'UNKNOWN' || !lib.license)).toEqual([]);
});

test('버전은 설치된 실제 버전이다 (package.json 의 캐럿 범위가 아니다)', () => {
	const wrong = OPEN_SOURCE_LIBS.filter((lib) => {
		let installed = '';
		try {
			installed = require(path.join(__dirname, '..', 'node_modules', lib.name, 'package.json')).version;
		} catch {
			return false; // 미설치는 위 테스트가 아니라 스크립트가 막는다
		}
		return lib.version !== installed;
	}).map((lib) => `${lib.name}: ${lib.version}`);
	expect(wrong).toEqual([]);
});

test('모든 항목이 열 수 있는 링크를 가진다', () => {
	expect(OPEN_SOURCE_LIBS.filter((lib) => !lib.url.startsWith('http')).map((lib) => lib.name)).toEqual([]);
});
