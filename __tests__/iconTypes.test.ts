/**
 * 아이콘 패밀리 회귀 테스트
 *
 * IconComponent 는 안 쓰는 패밀리를 들고 있으면 그 글리프 맵이 통째로 번들에 들어가므로
 * 실제로 쓰는 패밀리만 남겨 두었다. 그래서 반대 방향의 사고가 생긴다 —
 * 화면에서 남지 않은 패밀리를 쓰면 아이콘이 조용히 사라진다(console.warn + null).
 * 소스에 박힌 아이콘 타입 문자열을 전부 긁어 지원 목록과 대조한다.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', 'src');

const walk = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			return walk(full);
		}
		return /\.tsx?$/.test(entry.name) ? [full] : [];
	});

const files = walk(SRC);

/** IconComponent 가 지원하는 타입 (소문자) */
const supported = (() => {
	const source = fs.readFileSync(path.join(SRC, 'screens/common/atomic/IconComponent.tsx'), 'utf8');
	const block = source.slice(source.indexOf('const ICON_MAP'), source.indexOf('interface IconProps'));
	return new Set([...block.matchAll(/^\t(\w+):/gm)].map((m) => m[1]));
})();

/**
 * 아이콘 타입으로 쓰일 수 있는 문자열만 고른다.
 * `type: 'quiz'` 처럼 아이콘과 무관한 필드도 같은 이름을 쓰므로, 지원 목록 또는
 * vector-icons 가 실제로 제공하는 패밀리명과 겹치는 것만 검사 대상으로 삼는다.
 */
const KNOWN_FAMILIES = new Set(
	[
		'AntDesign', 'Entypo', 'EvilIcons', 'Feather', 'FontAwesome', 'FontAwesome5', 'FontAwesome6',
		'Fontisto', 'Foundation', 'Ionicons', 'MaterialCommunityIcons', 'MaterialIcons', 'Octicons',
		'SimpleLineIcons', 'Zocial',
	].map((n) => n.toLowerCase()),
);

test('지원 목록이 비어 있지 않다', () => {
	expect(supported.size).toBeGreaterThan(0);
});

test('화면에서 쓰는 아이콘 패밀리는 모두 IconComponent 가 지원한다', () => {
	const missing = new Map<string, string>();

	for (const file of files) {
		if (file.endsWith('IconComponent.tsx') || file.includes('__tests__')) {
			continue;
		}
		const source = fs.readFileSync(file, 'utf8');
		for (const match of source.matchAll(/(?:iconType|type)\s*[:=]\s*\{?["']([A-Za-z0-9]+)["']/g)) {
			const family = match[1].toLowerCase();
			if (KNOWN_FAMILIES.has(family) && !supported.has(family)) {
				missing.set(`${path.relative(SRC, file)} → ${match[1]}`, family);
			}
		}
	}

	expect([...missing.keys()]).toEqual([]);
});
