import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import { MainDataType } from '@/types/MainDataType';

const filterData = CONST_MAIN_DATA.PROVERB;

/**
	 * 속담 데이터를 관리합니다.
	 */
export type Proverb = {
	id: number; // 고유 식별자 (1부터 시작하는 번호)
	proverb: string; // 속담 본문 (ex: "가는 말이 고와야 오는 말이 곱다")
	meaning: string; // 속담의 의미 설명 (문장형, 존댓말 처리)
	category: string; // 속담이 속하는 카테고리 (ex: 인간관계, 세상 이치 등)
	level: number; // 난이도 숫자 (1: 아주 쉬움, 2: 쉬움, 3: 보통, 4: 어려움)
	levelName: string; // 난이도 이름 (ex: "쉬움", "보통" 등 텍스트)
	example: string; // 속담을 활용한 예시 문장
	origin: string; // 속담의 유래나 배경 설명
	usageTip: string; // 속담을 사용할 수 있는 팁 또는 상황 설명
	synonym: string | null; // 비슷한 의미의 다른 속담 (없으면 null)
	antonym: string | null; // 반대 의미의 속담 (없으면 null)
	difficultyScore: number; // 난이도를 세분화한 점수 (1~100 범위)
};
class ProverbServices {
	/**
	 * 전체 속담 리스트 조회
	 */
	selectProverbList = (): Proverb[] => {
		try {
			return filterData;
		} catch (error) {
			console.error('속담 리스트 조회 실패:', error);
			return [];
		}
	};

	/**
	 * ID 기반 속담 상세 조회
	 */
	selectProverbById = (id: number): Proverb | undefined => {
		try {
			return filterData.find((item) => item.id === id);
		} catch (error) {
			console.error(`ID(${id}) 기반 속담 조회 실패:`, error);
			return undefined;
		}
	};

	/**
	 * level(초등/중등/고등/성인/심화)별 속담 조회
	 */
	selectProverbsByLevel = (level: Number): Proverb[] => {
		try {
			return filterData.filter((item) => item.level === level);
		} catch (error) {
			console.error(`Level(${level}) 기반 속담 조회 실패:`, error);
			return [];
		}
	};

	/**
	 * field(배움/지혜/인내 등)별 속담 조회
	 */
	selectProverbsByField = (field: string): Proverb[] => {
		try {
			return filterData.filter((item) => item.category === field);
		} catch (error) {
			console.error(`Field(${field}) 기반 속담 조회 실패:`, error);
			return [];
		}
	};

	/**
	 * 속담 내용 또는 쉬운뜻으로 키워드 검색
	 */
	selectProverbsByKeyword = (keyword: string): Proverb[] => {
		try {
			const lowerKeyword = keyword.toLowerCase();
			return filterData.filter(
				(item) =>
					item.proverb.toLowerCase().includes(lowerKeyword) || item.meaning.toLowerCase().includes(lowerKeyword),
			);
		} catch (error) {
			console.error(`키워드(${keyword}) 검색 실패:`, error);
			return [];
		}
	};

	/**
 * 카테고리 목록 조회 (중복 제거)
 */
	selectCategoryList = (): string[] => {
		try {
			const categories = filterData.map((item) => item.category);
			const uniqueCategories = Array.from(new Set(categories));
			return uniqueCategories;
		} catch (error) {
			console.error('카테고리 목록 조회 실패:', error);
			return [];
		}
	};
}

export default new ProverbServices();
