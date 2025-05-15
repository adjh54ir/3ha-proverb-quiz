// services/CatService.ts
import axios from 'axios';

const BASE_URL = 'https://api.thecatapi.com/v1';

const catApi = axios.create({
	baseURL: BASE_URL,
	// headers: {
	// 	'x-api-key': API_KEY,
	// },
});

export interface CatBreed {
	id: string;
	name: string;
	origin: string;
	description: string;
	temperament: string;
	life_span: string;
	wikipedia_url?: string;
	image?: {
		url: string;
	};
}

const CatService = {
	/**
	 * 모든 고양이 품종 정보 가져오기
	 */
	async fetchAllBreeds(): Promise<CatBreed[]> {
		try {
			const response = await catApi.get<CatBreed[]>('/breeds');
			return response.data;
		} catch (error) {
			console.error('고양이 품종 정보 불러오기 실패:', error);
			throw error;
		}
	},
};

export default CatService;
