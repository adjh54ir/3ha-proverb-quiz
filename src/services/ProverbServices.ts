import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import { MainDataType } from '@/types/MainDataType';

const filterData = CONST_MAIN_DATA.PROVERB;

class ProverbServices {
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

	/**
	 * level(초등/중등/고등/성인/심화)별 속담 조회
	 */
	selectProverbsByLevel = (level: string): MainDataType.Proverb[] => {
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
			return filterData.filter((item) => item.field === field);
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
			return filterData.filter(
				(item) =>
					item.proverb.toLowerCase().includes(lowerKeyword) || item.easyMeaning.toLowerCase().includes(lowerKeyword),
			);
		} catch (error) {
			console.error(`키워드(${keyword}) 검색 실패:`, error);
			return [];
		}
	};
}

export default new ProverbServices();
