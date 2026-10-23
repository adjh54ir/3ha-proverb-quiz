import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

/**
 * AsyncStorage 접근 단일 창구.
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────
 * 이전에는 화면마다 `getItem` → `JSON.parse` → 수정 → `setItem` 을 직접 했다.
 * 두 가지 문제가 있었다.
 *
 *  1) **덮어쓰기(lost update)**
 *     읽기와 쓰기 사이에 다른 코드가 같은 키를 쓰면 그 변경이 사라진다.
 *     예: 오늘의 미션 보상이 점수를 올리는 동안 홈이 퀴즈 기록을 저장하면
 *     둘 중 하나가 통째로 날아간다. `update()` 는 키별로 작업을 줄 세워 막는다.
 *
 *  2) **깨진 JSON 처리 제각각**
 *     parse 실패 시 어떤 화면은 throw, 어떤 화면은 조용히 무시했다.
 *     여기서 한 번만 처리하고 기본값을 돌려준다.
 *
 * 화면은 이 모듈(또는 이 모듈을 쓰는 도메인 서비스)만 사용한다.
 */

/** 키별 직렬화 큐 — 같은 키에 대한 update 가 겹치지 않게 순서대로 실행한다. */
const queues = new Map<string, Promise<unknown>>();

/** 저장소 읽기/쓰기 실패를 한 곳에서 보고한다(추후 Crashlytics 연결 지점). */
const report = (action: string, key: string, error: unknown): void => {
	console.warn(`[Storage] ${action} 실패: ${key}`, error);
};

/**
 * 값 읽기. 없거나 JSON 이 깨졌으면 `fallback` 을 돌려준다.
 */
export const read = async <T>(key: MainStorageKeyType, fallback: T): Promise<T> => {
	try {
		const raw = await AsyncStorage.getItem(key);
		if (raw == null) {
			return fallback;
		}
		return JSON.parse(raw) as T;
	} catch (error) {
		report('읽기', key, error);
		return fallback;
	}
};

/**
 * 값 쓰기. 실패해도 예외를 던지지 않고 false 를 돌려준다.
 * @returns 저장 성공 여부 — 호출부가 사용자에게 실패를 알릴 수 있다.
 */
export const write = async <T>(key: MainStorageKeyType, value: T): Promise<boolean> => {
	try {
		await AsyncStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		report('쓰기', key, error);
		return false;
	}
};

/**
 * 읽고 → 바꾸고 → 쓰기를 하나의 작업으로 처리한다.
 *
 * 같은 키에 대한 update 들은 큐에 들어가 **순서대로** 실행되므로,
 * 앞 update 의 결과를 뒤 update 가 반드시 보고 시작한다(덮어쓰기 방지).
 *
 * ```ts
 * await update(MainStorageKeyType.USER_QUIZ_HISTORY, {}, (history) => ({
 *   ...history,
 *   totalScore: (history.totalScore ?? 0) + 10,
 * }));
 * ```
 *
 * @param mutator 현재 값을 받아 새 값을 돌려준다. `undefined` 를 돌려주면 저장하지 않는다.
 * @returns 저장된 값 (mutator 가 저장을 건너뛰면 읽은 값 그대로)
 */
export const update = async <T>(
	key: MainStorageKeyType,
	fallback: T,
	mutator: (current: T) => T | undefined | Promise<T | undefined>,
): Promise<T> => {
	const run = async (): Promise<T> => {
		const current = await read<T>(key, fallback);
		const next = await mutator(current);
		if (next === undefined) {
			return current;
		}
		await write(key, next);
		return next;
	};

	// 앞선 작업이 실패해도 큐가 멈추면 안 되므로 catch 로 이어 붙인다.
	const previous = queues.get(key) ?? Promise.resolve();
	const task = previous.then(run, run);
	queues.set(key, task.catch(() => undefined));
	return task;
};

/** 값 삭제 */
export const remove = async (key: MainStorageKeyType): Promise<void> => {
	try {
		await AsyncStorage.removeItem(key);
	} catch (error) {
		report('삭제', key, error);
	}
};

/** 테스트에서 큐 상태를 초기화할 때만 사용한다. */
export const __resetQueues = (): void => {
	queues.clear();
};
