import { COLORS, RADIUS } from '@/const/common/Theme';

/**
 * 출석 달력(react-native-calendars) 셀 마킹 규칙 — 앱 전체 단일 소스.
 *
 * 홈(출석 팝업)과 '나의 활동' 이 각자 마킹을 만들면서 색이 어긋나 있었다.
 * 홈은 "오늘 출석함 = 파랑", 나의 활동은 "오늘 미출석 = 파랑" 이라 같은 파란 칸이
 * 화면마다 반대 의미였다. 아래 규칙 하나로 통일한다.
 *
 * - 오늘 출석 완료 : 앰버 (연속 출석/스트릭과 같은 계열)
 * - 이전 출석      : 그린
 * - 퀴즈만 푼 날   : 옅은 블루 배경 + 그린 글자
 * - 오늘 미출석    : 블루 (지금 눌러야 할 날)
 * - 사용자가 고른 날 : 회색
 *
 * ⚠️ 모듈 스코프 상수로 굳히면 다크모드에서 색이 안 바뀐다. 반드시 호출 시점에 만든다.
 */

/** 달력 셀 하나의 마킹 객체 */
type DateMark = {
	marked?: boolean;
	dotColor?: string;
	customStyles: {
		container: Record<string, unknown>;
		text: Record<string, unknown>;
	};
};

const cell = (backgroundColor: string, color: string): DateMark => ({
	customStyles: {
		container: { backgroundColor, borderRadius: RADIUS.sm },
		text: { color, fontWeight: '700' },
	},
});

/** 출석한 날 — 오늘은 앰버, 이전 날은 그린 */
export const buildCheckedInMark = (isToday: boolean): DateMark => ({
	marked: true,
	dotColor: COLORS.textWhite,
	...cell(isToday ? COLORS.warning : COLORS.primary, COLORS.textWhite),
});

/** 퀴즈 기록만 있고 출석은 안 한 날 */
export const buildQuizOnlyMark = (): DateMark => ({
	marked: true,
	dotColor: COLORS.primary,
	...cell(COLORS.secondaryBg, COLORS.primary),
});

/** 출석 여부에 따른 기본 마킹. 선택 해제 시 이 규칙으로 복원해야 출석 색이 유지된다. */
export const buildDateMark = (isCheckedIn: boolean, isToday: boolean): DateMark =>
	isCheckedIn ? buildCheckedInMark(isToday) : buildQuizOnlyMark();

/** 아직 출석하지 않은 오늘 — "지금 누르세요" 강조 */
export const buildTodayPendingMark = (): DateMark => cell(COLORS.secondary, COLORS.textWhite);

/** 사용자가 달력에서 고른 날 */
export const buildSelectedMark = (): DateMark => cell(COLORS.border, COLORS.text);
