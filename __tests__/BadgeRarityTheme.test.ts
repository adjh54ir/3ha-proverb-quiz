import { BADGE_RARITY_META } from '@/const/ConstBadges';
import { setThemeMode } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';

/**
 * 뱃지 희귀도 색 회귀 테스트.
 *
 * `soft` 는 테마를 따르는 카드(COLORS.surface) 위에 깔리는 배경 틴트다. 예전에는
 * `'#D1FAE5'` 같은 거의 흰색인 파스텔 리터럴이라, 다크모드에서 카드만 어두워지고 칩은
 * 밝은 채로 남아 어두운 카드 위에 흰 조각이 떠 보였다. 특히 MyScoreScreen 의 뱃지 목록은
 * `earned ? rarity.soft : COLORS.surfaceAlt` 여서 한 줄 안에서 한쪽만 라이트로 굳어 있었다.
 *
 * 값이 모듈 로드 시점에 굳지 않고 '읽는 시점의 모드' 로 계산되는지를 못박는다.
 */
const RARITIES: MainDataType.BadgeRarity[] = ['common', 'rare', 'epic', 'legendary'];

afterEach(() => setThemeMode('light'));

describe('BADGE_RARITY_META', () => {
	it('네 희귀도가 모두 있고 라벨/별 개수가 유지된다', () => {
		expect(RARITIES.map((r) => BADGE_RARITY_META[r].label)).toEqual(['일반', '희귀', '영웅', '전설']);
		expect(RARITIES.map((r) => BADGE_RARITY_META[r].stars)).toEqual([1, 2, 3, 4]);
	});

	it('soft 는 리터럴 hex 가 아니라 알파가 들어간 틴트다', () => {
		// hex 리터럴이면 다크 카드 위에서 그대로 밝게 남는다.
		RARITIES.forEach((rarity) => {
			expect(BADGE_RARITY_META[rarity].soft).toMatch(/^rgba\(/);
		});
	});

	it('모드를 바꾸면 soft 가 다시 계산된다 (모듈 로드 시점 값으로 굳지 않는다)', () => {
		setThemeMode('light');
		const light = RARITIES.map((r) => BADGE_RARITY_META[r].soft);

		setThemeMode('dark');
		const dark = RARITIES.map((r) => BADGE_RARITY_META[r].soft);

		expect(dark).not.toEqual(light);
		// 어두운 배경에서는 같은 알파가 더 흐리게 보이므로 알파가 올라가야 한다.
		const alphaOf = (rgba: string) => Number(/,\s*([\d.]+)\)$/.exec(rgba)![1]);
		dark.forEach((value, index) => expect(alphaOf(value)).toBeGreaterThan(alphaOf(light[index])));
	});

	it('color / gradient 는 두 모드에서 같다 (채도 있는 중간 톤이라 뒤집지 않는다)', () => {
		setThemeMode('light');
		const light = RARITIES.map((r) => [BADGE_RARITY_META[r].color, ...BADGE_RARITY_META[r].gradient]);
		setThemeMode('dark');
		expect(RARITIES.map((r) => [BADGE_RARITY_META[r].color, ...BADGE_RARITY_META[r].gradient])).toEqual(light);
	});
});
