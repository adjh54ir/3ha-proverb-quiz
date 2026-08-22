import AsyncStorage from '@react-native-async-storage/async-storage';
import { read, write, update, remove, __resetQueues } from '@/services/StorageService';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

const KEY = MainStorageKeyType.USER_QUIZ_HISTORY;

describe('StorageService', () => {
	beforeEach(async () => {
		__resetQueues();
		await AsyncStorage.clear();
		jest.restoreAllMocks();
	});

	it('없는 값은 기본값을 돌려준다', async () => {
		expect(await read(KEY, { totalScore: 0 })).toEqual({ totalScore: 0 });
	});

	it('쓰고 다시 읽으면 같은 값', async () => {
		await write(KEY, { totalScore: 30 });
		expect(await read(KEY, { totalScore: 0 })).toEqual({ totalScore: 30 });
	});

	it('JSON 이 깨져 있어도 던지지 않고 기본값을 돌려준다', async () => {
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		await AsyncStorage.setItem(KEY, '{망가진 JSON');
		expect(await read(KEY, { totalScore: 0 })).toEqual({ totalScore: 0 });
	});

	it('동시에 여러 update 가 들어와도 값이 덮어써지지 않는다', async () => {
		await write(KEY, { totalScore: 0 });

		// 예전 패턴(각자 읽고 각자 쓰기)이라면 마지막 하나만 남는다.
		await Promise.all(
			Array.from({ length: 20 }, () =>
				update(KEY, { totalScore: 0 }, (current) => ({ totalScore: current.totalScore + 1 })),
			),
		);

		expect(await read(KEY, { totalScore: -1 })).toEqual({ totalScore: 20 });
	});

	it('mutator 가 undefined 를 돌려주면 저장하지 않는다', async () => {
		await write(KEY, { totalScore: 7 });
		const result = await update(KEY, { totalScore: 0 }, () => undefined);

		expect(result).toEqual({ totalScore: 7 });
		expect(await read(KEY, { totalScore: 0 })).toEqual({ totalScore: 7 });
	});

	it('앞선 update 가 실패해도 다음 update 는 계속 실행된다', async () => {
		await write(KEY, { totalScore: 1 });

		const failed = update(KEY, { totalScore: 0 }, () => {
			throw new Error('의도된 실패');
		});
		await expect(failed).rejects.toThrow('의도된 실패');

		await update(KEY, { totalScore: 0 }, (current) => ({ totalScore: current.totalScore + 5 }));
		expect(await read(KEY, { totalScore: 0 })).toEqual({ totalScore: 6 });
	});

	it('쓰기 실패는 예외 대신 false 로 알린다', async () => {
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('디스크 가득 참'));

		expect(await write(KEY, { totalScore: 1 })).toBe(false);
	});

	it('삭제하면 기본값으로 돌아간다', async () => {
		await write(KEY, { totalScore: 9 });
		await remove(KEY);
		expect(await read(KEY, { totalScore: 0 })).toEqual({ totalScore: 0 });
	});
});
