import type { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { MainDataType } from '@/types/MainDataType';
import { Paths } from './Paths';

/** 퀴즈 화면 출제 모드 */
export type QuizMode = 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank';

/** 퀴즈 화면이 받는 파라미터 */
export type QuizScreenParams = {
	mode: QuizMode;
	questionPool?: MainDataType.Proverb[];
	isWrongReview?: boolean;
	title?: string;
	/** 숫자(1~4) 또는 'all'/'전체'. 값이 없으면 전체로 본다(화면에서 한글 등급명으로 정규화). */
	selectedLevel?: number | 'all' | '전체' | null;
	levelKey?: string;
	selectedCategory?: string;
};

/**
 * 앱의 모든 화면 경로와 파라미터.
 *
 * 예전에는 여기에 5개만 있고 화면들은 `navigation.navigate` 앞에 `@ts-ignore` 를
 * 붙여 쓰고 있었다. 그래서 경로 이름을 잘못 적거나 필요한 파라미터를 빠뜨려도
 * 컴파일에서 걸리지 않고 실행 중에 조용히 이동이 실패했다.
 */
export type RootStackParamList = {
	[Paths.MAIN_TAB]: { screen?: Paths } | undefined;
	[Paths.HOME]: { showGuide?: boolean } | undefined;
	[Paths.SETTING]: undefined;
	[Paths.TODAY_QUIZ]: undefined;
	[Paths.PROVERB_LIST]: undefined;
	[Paths.PROVERB_STUDY]: undefined;
	[Paths.MY_SCORE]: undefined;

	[Paths.QUIZ]: QuizScreenParams;
	[Paths.QUIZ_MODE]: { mode?: QuizMode } | undefined;
	[Paths.PROVERB_QUIZ_MODE_SELECT]: undefined;
	[Paths.QUIZ_WRONG_REVIEW]: undefined;

	[Paths.INIT_TIME_CHANLLENGE]: undefined;
	[Paths.TIME_CHANLLENGE]: undefined;
	[Paths.TOWER_CHANLLENGE]: undefined;
	[Paths.TOWER_QUIZ]: { level?: number } | undefined;

	[Paths.FAVORITE]: undefined;
	[Paths.MY_PROVERB_BOOK]: undefined;
	[Paths.MY_PROVERB_BOOK_DETAIL]: { bookId: string };

	// 템플릿 참고용 화면 (실 서비스 네비게이터에는 연결돼 있지 않다)
	[Paths.EXAMPLE]: undefined;
	[Paths.MAIN_REFRENCE]: undefined;
	[Paths.FN_NOTIFICATION]: undefined;
	[Paths.FN_ADVERTISEMENT]: undefined;
	[Paths.FN_PERMISSION]: undefined;
	[Paths.FN_LANGUAGE]: undefined;
};

export type RootScreenProps<S extends keyof RootStackParamList = keyof RootStackParamList> = StackScreenProps<RootStackParamList, S>;

/** push/replace 까지 쓸 수 있도록 스택 기준 타입을 쓴다. */
export type AppNavigation = StackNavigationProp<RootStackParamList>;

/**
 * 경로 이름과 파라미터가 검증되는 navigation 객체.
 * 화면에서는 `useNavigation()` 대신 이 훅을 쓴다 (`@ts-ignore` 불필요).
 */
export const useAppNavigation = (): AppNavigation => useNavigation<AppNavigation>();
