import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import { MainDataType } from '@/types/MainDataType';

const filterData = CONST_MAIN_DATA.PROVERB;
class ProverbServices {
	/**
	 * 중복된 속담 리스트 반환 (모든 중복 탐지)
	 */
	getDuplicateProverbs = (): MainDataType.Proverb[][] => {
		try {
			const map = new Map<string, MainDataType.Proverb[]>();
			filterData.forEach((item) => {
				const key = item.proverb.trim().toLowerCase();
				if (!map.has(key)) {
					map.set(key, []);
				}
				map.get(key)!.push(item);
			});

			// 2개 이상 있는 것만 반환
			return Array.from(map.values()).filter((arr) => arr.length > 1);
		} catch (error) {
			console.error('중복 속담 리스트 추출 실패:', error);
			return [];
		}
	};

	/**
	 * 전체 속담 리스트 조회
	 */
	selectProverbList = (): MainDataType.Proverb[] => {
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
	selectProverbById = (id: number): MainDataType.Proverb | undefined => {
		try {
			return filterData.find((item) => item.id === id);
		} catch (error) {
			console.error(`ID(${id}) 기반 속담 조회 실패:`, error);
			return undefined;
		}
	};
	// ProverbServices.ts
	selectProverbByIds(ids: number[]): MainDataType.Proverb[] {
		const all = this.selectProverbList();
		return all.filter((p) => ids.includes(p.id));
	}

	/**
	 * level(초등/중등/고등/성인/심화)별 속담 조회
	 */
	selectProverbsByLevel = (level: Number): MainDataType.Proverb[] => {
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
	selectProverbsByField = (field: string): MainDataType.Proverb[] => {
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
	selectProverbsByKeyword = (keyword: string): MainDataType.Proverb[] => {
		try {
			const lowerKeyword = keyword.toLowerCase();
			return filterData.filter((item) => item.proverb.toLowerCase().includes(lowerKeyword) || item.longMeaning!.toLowerCase().includes(lowerKeyword));
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
	/**
	 * 난이도(levelName) 목록 조회 (중복 제거)
	 */
	selectLevelNameList = (): string[] => {
		try {
			const levels = filterData.map((item) => item.levelName).filter(Boolean);
			const uniqueLevels = Array.from(new Set(levels));
			const LEVEL_ORDER = ['아주 쉬움', '쉬움', '보통', '어려움'];

			// 정해진 순서대로 정렬, 없으면 기본 순서 유지
			const sorted = uniqueLevels.sort((a, b) => {
				const indexA = LEVEL_ORDER.indexOf(a);
				const indexB = LEVEL_ORDER.indexOf(b);
				if (indexA === -1) return 1;
				if (indexB === -1) return -1;
				return indexA - indexB;
			});
			return sorted;
		} catch (error) {
			console.error('난이도 목록 조회 실패:', error);
			return [];
		}
	};
	/**
	 * 주어진 속담 ID 배열로부터 정복한 레벨 목록 추출
	 */
	selectMasterLevelsByStudyIds = (studiedIds: number[]): string[] => {
		const allProverbs = this.selectProverbList();
		const levels = allProverbs
			.filter((item) => studiedIds.includes(item.id))
			.map((item) => item.levelName)
			.filter(Boolean);
		return Array.from(new Set(levels));
	};
}

export default new ProverbServices();
