/**
 * 오디오 세션 회귀 테스트
 *
<<<<<<< HEAD
 * 요구사항은 "효과음이 실제로 들리는 것"이다(SoundUtils 의 applyAudioCategory 주석 참고).
 * Playback + mixWithOthers=false 로 잡아 앱이 오디오 포커스를 가져가고 미디어 볼륨을 쓴다.
 * 믹스(Ambient / mixWithOthers=true)로 되돌리면 볼륨 버튼이 벨소리 볼륨을 조절해
 * 미디어 볼륨이 0인 기기에서 "앱 전체가 무음"이 되는 증상이 재발한다.
=======
 * 요구사항은 "듣고 있던 음악·영상을 끊지 않으면서 효과음이 들리는 것"이다.
 * 두 플랫폼 모두 Playback + mixWithOthers=false 로 두면 앱이 오디오 포커스를 빼앗아
 * 앱에 들어오는 순간 남의 재생이 꺼진다. 되돌리면 그 증상이 재발한다.
 *
 * iOS 는 Ambient(옵션 없음)여야 섞인다 — ('Playback', true) 는 라이브러리가 넣는
 * AllowBluetooth 때문에 setCategory 가 조용히 실패한다.
 * Android 는 Playback(STREAM_MUSIC = 미디어 볼륨) + mixWithOthers=true 여야
 * requestAudioFocus 를 부르지 않는다.
>>>>>>> df9a381e98aca17f54cff6c27b751b06c0a623db
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

beforeEach(() => {
	SoundMock.setCategory.mockClear();
});

<<<<<<< HEAD
test('오디오 세션은 Playback + 포커스 요청으로 잡는다(미디어 볼륨 사용)', () => {
	load().applyAudioCategory();
	expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', false);
});

test('플랫폼과 무관하게 같은 세션을 잡는다', () => {
	const Platform = require('react-native').Platform;
	const original = Platform.OS;
	Platform.OS = 'android';
	try {
		load().applyAudioCategory();
		expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', false);
	} finally {
		Platform.OS = original;
	}
=======
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
>>>>>>> df9a381e98aca17f54cff6c27b751b06c0a623db
});

test('모듈이 올라오는 즉시 세션을 잡는다 — 플레이어보다 먼저여야 한다', () => {
	load();
<<<<<<< HEAD
	expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', false);
=======
	expect(SoundMock.setCategory).toHaveBeenCalled();
>>>>>>> df9a381e98aca17f54cff6c27b751b06c0a623db
});

test('효과음은 번들 경로 기준으로 로드한다', () => {
	const mod = load();
	mod.playCorrect();
	expect(SoundMock.lastArgs).toEqual({ file: 'correct.m4a', basePath: '/bundle' });
});
