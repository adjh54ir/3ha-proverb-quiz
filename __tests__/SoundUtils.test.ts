/**
 * 오디오 세션 회귀 테스트
 *
 * 다른 앱의 음악·영상을 끊지 않으면서 효과음만 얹는 것이 요구사항이다.
 * - iOS: Ambient (옵션 없음). Playback + mixWithOthers 는 라이브러리가 AllowBluetooth 를
 *        함께 넣어 setCategory 자체가 실패하므로 쓸 수 없다.
 * - Android: Playback + mixWithOthers=true (오디오 포커스를 뺏지 않는다).
 * 되돌리면 "앱에 들어오면 재생 중이던 영상이 꺼진다" 증상이 재발한다.
 */
import Sound from 'react-native-sound';

const SoundMock = Sound as unknown as { setCategory: jest.Mock; lastArgs?: { file: string; basePath: unknown } };

const load = () => {
	let mod: typeof import('../src/utils/SoundUtils');
	jest.isolateModules(() => {
		mod = require('../src/utils/SoundUtils');
	});
	// @ts-expect-error isolateModules 콜백에서 채워진다
	return mod;
};

beforeEach(() => {
	SoundMock.setCategory.mockClear();
});

test('iOS 오디오 세션은 Ambient 로 잡는다(다른 앱 재생 유지)', () => {
	load().applyAudioCategory();
	expect(SoundMock.setCategory).toHaveBeenCalledWith('Ambient', false);
});

test('Android 오디오 세션은 Playback + 믹스로 잡는다(포커스 미요청)', () => {
	const Platform = require('react-native').Platform;
	const original = Platform.OS;
	Platform.OS = 'android';
	try {
		load().applyAudioCategory();
		expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', true);
	} finally {
		Platform.OS = original;
	}
});

test('모듈이 올라오는 즉시 세션을 잡는다 — 플레이어보다 먼저여야 한다', () => {
	load();
	expect(SoundMock.setCategory).toHaveBeenCalledWith('Ambient', false);
});

test('효과음은 번들 경로 기준으로 로드한다', () => {
	const mod = load();
	mod.playCorrect();
	expect(SoundMock.lastArgs).toEqual({ file: 'correct.m4a', basePath: '/bundle' });
});
