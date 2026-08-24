import { getThemeMode } from '@/const/common/Theme';

/**
 * 색상에 투명도를 입힌 값을 만든다.
 *
 * 화면 곳곳에서 `color + '20'` 처럼 16진수 알파를 문자열로 이어 붙이고 있었다.
 * 두 가지 문제가 있다.
 *  1) 원본이 3자리 hex 나 rgba() 면 잘못된 색 문자열이 되어 조용히 무시된다.
 *  2) 라이트 기준으로 고른 옅은 틴트는 다크 배경 위에서 거의 보이지 않는다.
 *
 * 이 함수는 입력을 검증하고, 다크모드에서는 틴트를 조금 진하게 올려 두 모드 모두
 * 같은 정도로 보이게 맞춘다.
 *
 * @param color '#RGB' 또는 '#RRGGBB' 형식의 색
 * @param alpha 0~1 사이 불투명도 (라이트 기준)
 * @returns 'rgba(r, g, b, a)'. 파싱할 수 없으면 원본을 그대로 돌려준다.
 */
export const withAlpha = (color: string, alpha: number): string => {
	const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(color?.trim() ?? '');
	if (!hex) {
		// rgba()/named color 등은 손대지 않는다 — 잘못 만든 문자열보다 원본이 낫다.
		return color;
	}

	const digits = hex[1].length === 3 ? hex[1].replace(/./g, (d) => d + d) : hex[1];
	const r = parseInt(digits.slice(0, 2), 16);
	const g = parseInt(digits.slice(2, 4), 16);
	const b = parseInt(digits.slice(4, 6), 16);

	// 어두운 배경 위에서는 같은 알파가 더 흐리게 보인다 → 1.6배(최대 0.9)로 보정
	const resolved = getThemeMode() === 'dark' ? Math.min(alpha * 1.6, 0.9) : alpha;

	return `rgba(${r}, ${g}, ${b}, ${Number(resolved.toFixed(3))})`;
};

/** 자주 쓰는 틴트 단계 — 화면마다 0.08/0.1/0.12 로 갈리지 않게 이름으로 고른다. */
export const ALPHA = {
	/** 아주 옅은 배경 틴트 (선택된 칩 등) */
	faint: 0.08,
	/** 옅은 배경 틴트 (강조 카드 배경) */
	soft: 0.12,
	/** 보더/글로우 */
	border: 0.25,
} as const;

/**
 * 배경색 위에 올릴 글자/아이콘 색을 고른다.
 *
 * 속담집 색 팔레트에는 `#FCD34D`(연노랑) 처럼 밝은 색이 섞여 있는데,
 * 그 위에 항상 흰색 아이콘을 올리고 있어 거의 보이지 않았다.
 * 밝기(상대 휘도)를 재서 밝은 배경에는 진한 글자를 돌려준다.
 *
 * @param background '#RGB' 또는 '#RRGGBB'
 * @returns 흰색 또는 진한 슬레이트. 파싱 실패 시 흰색(기존 동작 유지)
 */
export const readableTextOn = (background: string): string => {
	const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(background?.trim() ?? '');
	if (!hex) {
		return LIGHT_FG;
	}
	const digits = hex[1].length === 3 ? hex[1].replace(/./g, (d) => d + d) : hex[1];
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255);

	// WCAG 상대 휘도
	const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

	// 흰 글자가 4.5:1 을 못 넘기는 밝기(약 0.18 이상)면 진한 글자로 뒤집는다.
	return luminance > 0.18 ? DARK_FG : LIGHT_FG;
};

const LIGHT_FG = '#FFFFFF';
/** 밝은 배경 위 글자 — 두 모드 모두 같은 색이어야 칩 안에서 일관된다. */
const DARK_FG = '#1E293B';
