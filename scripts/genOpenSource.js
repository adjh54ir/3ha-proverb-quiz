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

/**
 * package.json 에 license 필드가 없는 패키지의 LICENSE 파일 첫 줄에서 종류를 읽는다.
 *
 * 필드만 보면 react-native-confetti-cannon 처럼 LICENSE 파일에는 'MIT License' 가
 * 분명히 적혀 있는데도 'UNKNOWN' 으로 고지된다. 라이선스 검토에서 바로 지적받는 형태다.
 */
const LICENSE_FILES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'LICENCE'];
const SPDX_PATTERNS = [
	[/\bMIT\b/i, 'MIT'],
	[/\bApache License\b/i, 'Apache-2.0'],
	[/\bBSD 3-Clause\b/i, 'BSD-3-Clause'],
	[/\bBSD 2-Clause\b/i, 'BSD-2-Clause'],
	[/\bISC\b/i, 'ISC'],
	[/\bMozilla Public License\b/i, 'MPL-2.0'],
];

const readLicenseFile = (name) => {
	for (const file of LICENSE_FILES) {
		const candidate = path.join(ROOT, 'node_modules', name, file);
		if (!fs.existsSync(candidate)) continue;
		// 종류는 항상 앞머리에 나온다. 본문 전체를 훑으면 인용된 다른 라이선스에 걸린다.
		const head = fs.readFileSync(candidate, 'utf8').slice(0, 400);
		const hit = SPDX_PATTERNS.find(([pattern]) => pattern.test(head));
		if (hit) return hit[1];
	}
	return '';
};

const readLicense = (name, meta) => {
	if (typeof meta.license === 'string') return meta.license;
	if (meta.license && meta.license.type) return meta.license.type;
	if (Array.isArray(meta.licenses) && meta.licenses[0]) return meta.licenses[0].type;
	return readLicenseFile(name) || 'UNKNOWN';
};

/** node_modules 에 없어 메타를 읽지 못한 의존성 */
const missing = [];

const rows = Object.keys(pkg.dependencies || {})
	.filter((name) => !EXCLUDE.has(name) && !EXCLUDE_PREFIX.some((p) => name.startsWith(p)))
	.sort((a, b) => a.localeCompare(b))
	.map((name) => {
		let meta = {};
		try {
			meta = require(path.join(ROOT, 'node_modules', name, 'package.json'));
		} catch {
			// 설치되지 않은 패키지. 조용히 빠지면 고지 목록에서 누락되므로 기록해 두고 아래에서 중단한다.
			missing.push(name);
			return null;
		}
		const repo = meta.repository;
		return {
			name,
			license: readLicense(name, meta),
			version: meta.version || '',
			url: normalizeUrl(typeof repo === 'string' ? repo : repo && repo.url) || normalizeUrl(meta.homepage),
		};
	})
	.filter(Boolean);

if (missing.length > 0) {
	console.error('❌ 설치되지 않은 의존성이 있어 고지 목록이 누락될 수 있습니다:');
	missing.forEach((name) => console.error(`   - ${name}`));
	console.error('   yarn install 후 다시 실행하세요. (기존 파일은 그대로 둡니다)');
	process.exit(1);
}

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
