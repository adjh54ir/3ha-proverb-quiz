/**
 * 공통 타입을 관리하는 모듈
 */
export declare namespace CommonType {
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

	/** ✅ 앱 내 결제 상태 관리 타입 */
	export type PurchaseInfoType = {
		isRemoveAds: boolean; // 광고 제거 구매했는지
		purchaseDate?: string; // 언제 구매했는지 (ISO string)
		transactionId?: string; // 영수증/거래 ID (복원 체크 시 사용 가능)
		platform?: 'android' | 'ios';
	};
}
