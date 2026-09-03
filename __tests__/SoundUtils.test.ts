/**
 * 오디오 세션 회귀 테스트
 *
 * 요구사항은 "듣고 있던 음악·영상을 끊지 않으면서 효과음이 들리는 것"이다.
 * 두 플랫폼 모두 Playback + mixWithOthers=false 로 두면 앱이 오디오 포커스를 빼앗아
 * 앱에 들어오는 순간 남의 재생이 꺼진다. 되돌리면 그 증상이 재발한다.
 *
 * iOS 는 Ambient(옵션 없음)여야 섞인다 — ('Playback', true) 는 라이브러리가 넣는
 * AllowBluetooth 때문에 setCategory 가 조용히 실패한다.
 * Android 는 Playback(STREAM_MUSIC = 미디어 볼륨) + mixWithOthers=true 여야
 * requestAudioFocus 를 부르지 않는다.
 */
import Sound from 'react-native-sound';

const SoundMock = Sound as unknown as {
	setCategory: jest.Mock;
	lastArgs?: { file: string; basePath: unknown };
	pitch?: number;
	speed?: number;
};

const load = () => {
	let mod: typeof import('../src/utils/SoundUtils');
	jest.isolateModules(() => {
		mod = require('../src/utils/SoundUtils');
	});
	// @ts-expect-error isolateModules 콜백에서 채워진다
	return mod;
};

const withPlatform = (os: string, fn: () => void) => {
	const Platform = require('react-native').Platform;
	const original = Platform.OS;
	Platform.OS = os;
	try {
		fn();
	} finally {
		Platform.OS = original;
	}
};

/** 로드 콜백이 마이크로태스크로 미뤄져 있어 한 틱 흘려보낸다 */
const flush = () => Promise.resolve().then(() => {});

beforeEach(() => {
	SoundMock.setCategory.mockClear();
	SoundMock.pitch = undefined;
	SoundMock.speed = undefined;
});

test('iOS 오디오 세션은 Ambient 로 잡는다(다른 앱 오디오와 믹스)', () => {
	withPlatform('ios', () => {
		load().applyAudioCategory();
		expect(SoundMock.setCategory).toHaveBeenCalledWith('Ambient', false);
	});
});

test('Android 오디오 세션은 Playback + 믹스로 잡는다(미디어 볼륨 유지, 포커스 미요청)', () => {
	withPlatform('android', () => {
		load().applyAudioCategory();
		expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', true);
	});
});

test('모듈이 올라오는 즉시 세션을 잡는다 — 플레이어보다 먼저여야 한다', () => {
	load();
	expect(SoundMock.setCategory).toHaveBeenCalled();
});

test('효과음은 번들 경로 기준으로 로드한다', () => {
	const mod = load();
	mod.playCorrect();
	expect(SoundMock.lastArgs).toEqual({ file: 'correct.m4a', basePath: '/bundle' });
});

/**
 * 배속 API 크래시 방어 (Android)
 *
 * Sound.kt 의 setSpeed/setPitch 는 MediaPlayer.playbackParams 에 try/catch 없이 그대로 쓴다.
 * 일부 OEM 디코더는 start 전 플레이어에서 예외를 던지고, @ReactMethod 라 앱이 그대로 죽는다.
 * 효과음 11 개 중 배속을 쓰는 건 playCombo 하나뿐이라, 나머지는 아예 부르지 않는 게 유일한 방어다.
 */
test('배속이 1 인 효과음은 네이티브 배속 API 를 건드리지 않는다', async () => {
	const mod = load();
	mod.playCorrect();
	await flush();
	mod.playCorrect(); // 캐시된 플레이어로 재생할 때도 마찬가지
	await flush();
	expect(SoundMock.pitch).toBeUndefined();
	expect(SoundMock.speed).toBeUndefined();
});

test('콤보 효과음은 배속이 걸리고, 콤보가 끊기면 원래 속도로 되돌린다', async () => {
	const mod = load();
	mod.playCombo(8); // 2·5·8… 단계 → 1 + 2*0.06
	await flush();
	expect(SoundMock.pitch).toBe(1.12);
	expect(SoundMock.speed).toBe(1.12);

	SoundMock.pitch = undefined;
	SoundMock.speed = undefined;
	mod.playCombo(8); // 같은 배속이면 다시 부를 이유가 없다
	await flush();
	expect(SoundMock.pitch).toBeUndefined();

	// 플레이어가 캐시돼 재사용되므로, 콤보가 끊긴 뒤에도 음이 높은 채로 남으면 안 된다
	mod.playCombo(0);
	await flush();
	expect(SoundMock.pitch).toBe(1);
	expect(SoundMock.speed).toBe(1);
});
