/**
 * 공통 타입을 관리하는 모듈
 */
export declare module CommonType {
	/**
	 * 일반적인 타입을 관리합니다.
	 */
	export type userInfoType = {
		userSq: number;
		userId: string;
		userUuid: string;
	};
	export type AppItem = {
		id: number;
		icon: any;
		title: string;
		desc: string;
		android?: string;
		ios?: string;
	};
}
