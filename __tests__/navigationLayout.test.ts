/**
 * 네비게이션 레이어 회귀 테스트
 *
 * 1) 배너 아래 콘텐츠 시작 위치
 *    예전에는 플랫폼·태블릿별 고정값을 더해 맞췄는데, adaptive 배너 높이가 기기마다 50~90dp 로
 *    갈려서 iPhone 14/15/16 계열에서 콘텐츠가 배너를 약 20dp 파고들었다.
 *    타입 검사로는 잡히지 않으니 실제 숫자로 못박는다.
 *
 * 2) 탭 화면 초기화
 *    탭을 다시 누르면 값/아코디언/스크롤이 초기 상태로 돌아가야 한다. 화면을 새로 추가할 때
 *    withFreshMount 를 빠뜨리면 그 탭만 조용히 이전 상태를 들고 있게 되므로 소스를 훑어 확인한다.
 */
import fs from 'fs';
import path from 'path';

import { AD_LAYOUT } from '@/navigation/AppLayout';

describe('배너 레이아웃', () => {
	// 폰(50) · 태블릿(90) · 로드 전(0=폴백). adaptive 배너가 실제로 내려주는 범위를 덮는다.
	test.each([0, 50, 60, 90])('배너 높이 %ddp 에서도 콘텐츠는 배너를 덮지 않는다', (bannerHeight) => {
		const gap = AD_LAYOUT.contentTopOffset(bannerHeight) - AD_LAYOUT.bannerBottom(bannerHeight);
		expect(gap).toBeCloseTo(AD_LAYOUT.bottomGap);
	});

	test('배너 하단 여백이 실제로 존재한다', () => {
		expect(AD_LAYOUT.bottomGap).toBeGreaterThan(0);
	});
});

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
