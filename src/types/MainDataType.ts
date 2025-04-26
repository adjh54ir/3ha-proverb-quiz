/**
 * 공통 타입을 관리하는 모듈
 */
export declare module MainDataType {
  /**
   * 일반적인 타입을 관리합니다.
   */
  export type SizeItem = {
    id: number;
    category: string;
    detailCategory: string;
    brand: string;
    size: string;
    detailSize: string;
    memo: string;
    imageUri?: string;
    registerDate: string;
  };

  export interface Category {
    name: string;
    icon: string;
    iconType?: string;
  }
}
