/**
 * 공통 타입을 관리하는 모듈
 */
export declare module MainDataType {
  /**
   * 일반적인 타입을 관리합니다.
   */
  export type Proverb = {
    id: number
    proverb: string;
    meaning: string;
    easyMeaning: string;
    field: string;
    level: string;
  };
}
