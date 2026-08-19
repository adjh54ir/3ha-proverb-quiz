#!/usr/bin/env node
/**
 * package.json 의 dependencies 를 읽어 오픈소스 고지 데이터를 생성한다.
 *
 * 사용법: node scripts/genOpenSource.js
 * 결과물: src/const/common/OpenSourceData.ts
 *
 * 라이브러리를 추가/제거/업그레이드한 뒤 이 스크립트를 다시 돌리면 설정 > 오픈소스 화면이 최신화된다.
 * (수동으로 목록을 관리하면 반드시 실제 번들과 어긋난다)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));

/** 런타임에 번들되지 않는 도구성 패키지는 고지 대상이 아니다. */
const EXCLUDE = new Set(['add', 'yarn', '@react-native-community/eslint-config']);
const EXCLUDE_PREFIX = ['babel-plugin-', '@babel/'];

const normalizeUrl = (raw) => {
	if (!raw) return '';
	let url = String(raw)
		.replace(/^git\+/, '')
		.replace(/^git:\/\//, 'https://')
		.replace(/^git@github\.com:/, 'https://github.com/')
		.replace(/^github:/, 'https://github.com/')
		.replace(/\.git$/, '');
	return url.startsWith('http') ? url : '';
};

const readLicense = (meta) => {
	if (typeof meta.license === 'string') return meta.license;
	if (meta.license && meta.license.type) return meta.license.type;
	if (Array.isArray(meta.licenses) && meta.licenses[0]) return meta.licenses[0].type;
	return 'UNKNOWN';
};

const rows = Object.keys(pkg.dependencies || {})
	.filter((name) => !EXCLUDE.has(name) && !EXCLUDE_PREFIX.some((p) => name.startsWith(p)))
	.sort((a, b) => a.localeCompare(b))
	.map((name) => {
		let meta = {};
		try {
			meta = require(path.join(ROOT, 'node_modules', name, 'package.json'));
		} catch {
			return null; // 설치되지 않은 패키지는 고지하지 않는다
		}
		const repo = meta.repository;
		return {
			name,
			license: readLicense(meta),
			version: meta.version || '',
			url: normalizeUrl(typeof repo === 'string' ? repo : repo && repo.url) || normalizeUrl(meta.homepage),
		};
	})
	.filter(Boolean);

const body = rows
	.map((r) => `\t{ name: '${r.name}', license: '${r.license}', version: '${r.version}', url: '${r.url}' },`)
	.join('\n');

const out = `/**
 * 오픈소스 고지 데이터 — scripts/genOpenSource.js 가 package.json 기준으로 생성한다.
 * ⚠️ 직접 수정하지 말 것. 의존성이 바뀌면 \`node scripts/genOpenSource.js\` 를 다시 실행한다.
 */
export interface OpenSourceLib {
\tname: string;
\tlicense: string;
\tversion: string;
\turl: string;
}

export const OPEN_SOURCE_LIBS: OpenSourceLib[] = [
${body}
];
`;

const target = path.join(ROOT, 'src/const/common/OpenSourceData.ts');
fs.writeFileSync(target, out);
console.log(`생성 완료: ${rows.length}개 → ${path.relative(ROOT, target)}`);
