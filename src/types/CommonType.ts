/**
 * 공통 타입을 관리하는 모듈
 */

export declare module CommonType {
	export type AppCategory = 'quiz' | 'calculator' | 'utility';
	export type AppText = { title: string; desc: string };
	/** Storage common-apps/apps.json 한 줄 */
	export type AppItem = {
		id: number;
		/** icons/ 안의 파일 이름 — 주소는 appIconUrl 로 만든다 */
		icon: string;
		title: string;
		desc: string;
		category: AppCategory;
		/** 스토어 출시일(YYYY-MM-DD). 적힌 앱만 일정 기간 NEW 배지가 붙는다 — isNewApp 참고 */
		releasedAt?: string;
		android?: string;
		ios?: string;
		/** 언어별 이름/설명 — 이 앱은 한국어만 써서 title/desc 원문을 쓴다 */
		i18n?: Record<string, AppText>;
	};
	/**
	 * 일반적인 타입을 관리합니다.
	 */
	export type userInfoType = {
		userSq: number;
		userId: string;
		userUuid: string;
	};
}
