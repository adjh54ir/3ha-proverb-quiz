import { StyleSheet } from 'react-native';
import { SPACING_W } from '@/const/common/Theme';
import { isLargeTablet, isTablet } from '@/utils/DementionUtils';

/**
 * 카드형 목록·보기 그리드의 열 수.
 *
 * 태블릿은 본문이 화면 폭을 다 써 한 줄 카드가 늘어지고 한 화면에 몇 개 안 보인다.
 * 두 열로 놓아 훑어보기 쉽게 한다. 폰은 1 열 그대로라 아래 스타일이 전부 null 이다.
 */
export const LIST_COLUMNS = isTablet ? 2 : 1;

/**
 * 속담 카드 목록(속담 사전·즐겨찾기·속담집 상세)의 열 수.
 * 13인치(짧은 변 1000dp 이상)는 두 열이어도 카드 한 장이 480dp 를 넘어 세 열로 놓는다.
 * 보기(2×2)·홈 메뉴처럼 짝을 이루는 그리드는 `LIST_COLUMNS` 를 그대로 쓴다.
 */
export const CARD_LIST_COLUMNS = isLargeTablet ? 3 : LIST_COLUMNS;

/** 열 사이 간격의 절반 — 셀마다 양옆에 반씩 두고 행을 그만큼 바깥으로 당겨 가장자리를 맞춘다 */
const HALF_GAP = SPACING_W.md / 2;

/**
 * - `row`  : FlatList `columnWrapperStyle` (ScrollView 라면 감싸는 View 에 `wrap` 을 쓴다)
 * - `cell` : 각 아이템을 감싸는 `AnimatedListItem` 의 style — 1/열 폭 + 양옆 반 간격
 * - `full` : 홀수 개 묶음의 마지막처럼 한 행을 혼자 쓰는 셀 — 가장자리는 `cell` 과 맞춘다
 * - `fill` : 카드 본체 — 같은 행의 더 긴 카드에 높이를 맞춘다
 */
const createGrid = (columns: number) =>
	columns > 1
		? StyleSheet.create({
				row: { marginHorizontal: -HALF_GAP },
				wrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -HALF_GAP },
				cell: { width: `${100 / columns}%`, paddingHorizontal: HALF_GAP },
				full: { width: '100%', paddingHorizontal: HALF_GAP },
				fill: { flexGrow: 1 },
			})
		: null;

export const listGrid = createGrid(LIST_COLUMNS);

export const cardListGrid = createGrid(CARD_LIST_COLUMNS);

/**
 * 이 글자 수를 넘는 보기가 하나라도 있으면 태블릿에서도 보기를 한 열로 쌓는다.
 * 2×2 셀은 한 줄에 15~19자라 40자면 세 줄 — 그보다 길면 문장이 잘게 접혀 보기끼리 비교하기 어렵다.
 */
export const LONG_OPTION_LENGTH = 40;

/** 보기 길이로 고른 열 수 (순수 함수 — 테스트용) */
export const pickOptionColumns = (options: readonly string[], columns = LIST_COLUMNS) =>
	columns > 1 && options.every((option) => option.length <= LONG_OPTION_LENGTH) ? columns : 1;

/** 퀴즈 보기 그리드 — 보기가 짧을 때만 태블릿 2×2, 긴 뜻 문장이 섞이면 null(한 열) */
export const optionGrid = (options: readonly string[]) => (pickOptionColumns(options) > 1 ? listGrid : null);
