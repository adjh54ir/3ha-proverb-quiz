import { StyleSheet } from 'react-native';
import { SPACING_W } from '@/const/common/Theme';
import { isTablet } from '@/utils/DementionUtils';

/**
 * 카드형 목록(속담 사전·즐겨찾기·내 속담책)의 열 수.
 *
 * 태블릿은 본문 기둥이 최대 900 까지 넓어져 한 줄 카드가 늘어지고 한 화면에 몇 개 안 보인다.
 * 두 열로 놓아 훑어보기 쉽게 한다. 폰은 1 열 그대로라 아래 스타일이 전부 null 이다.
 */
export const LIST_COLUMNS = isTablet ? 2 : 1;

/** 열 사이 간격의 절반 — 셀마다 양옆에 반씩 두고 행을 그만큼 바깥으로 당겨 가장자리를 맞춘다 */
const HALF_GAP = SPACING_W.md / 2;

/**
 * - `row`  : FlatList `columnWrapperStyle` (ScrollView 라면 감싸는 View 에 `wrap` 을 쓴다)
 * - `cell` : 각 아이템을 감싸는 `AnimatedListItem` 의 style — 반 폭 + 양옆 반 간격
 * - `full` : 홀수 개 묶음의 마지막처럼 한 행을 혼자 쓰는 셀 — 가장자리는 `cell` 과 맞춘다
 * - `fill` : 카드 본체 — 같은 행의 더 긴 카드에 높이를 맞춘다
 */
export const listGrid =
	LIST_COLUMNS > 1
		? StyleSheet.create({
				row: { marginHorizontal: -HALF_GAP },
				wrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -HALF_GAP },
				cell: { width: '50%', paddingHorizontal: HALF_GAP },
				full: { width: '100%', paddingHorizontal: HALF_GAP },
				fill: { flexGrow: 1 },
			})
		: null;
