/**
 * 네비게이션 레이어 회귀 테스트
 *
 * 탭 화면 초기화
 *    탭을 다시 누르면 값/아코디언/스크롤이 초기 상태로 돌아가야 한다. 화면을 새로 추가할 때
 *    withFreshMount 를 빠뜨리면 그 탭만 조용히 이전 상태를 들고 있게 되므로 소스를 훑어 확인한다.
 */
import fs from 'fs';
import path from 'path';

describe('탭 화면 초기화', () => {
	const source = fs.readFileSync(path.join(__dirname, '..', 'src/navigation/BottomTabNavigator.tsx'), 'utf8');

	test('모든 Tab.Screen 의 component 가 withFreshMount 로 감싼 화면이다', () => {
		const components = [...source.matchAll(/component=\{(\w+)\}/g)].map((m) => m[1]);
		expect(components.length).toBeGreaterThan(0);

		const fresh = new Set([...source.matchAll(/const\s+(\w+)\s*=\s*withThemedScreen\(withFreshMount\(/g)].map((m) => m[1]));
		expect(components.filter((name) => !fresh.has(name))).toEqual([]);
	});

	test('탭 버튼을 거치지 않고 들어온 경우도 초기화한다', () => {
		expect(source).toContain("addListener('tabPress'");
		expect(source).toContain('useFocusEffect');
	});
});
