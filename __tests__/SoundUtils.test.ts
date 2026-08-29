/**
 * 오디오 세션 회귀 테스트
 *
 * 요구사항은 "효과음이 실제로 귀에 들리는 것"이다. 믹스(다른 앱 음악 유지)를 택하면
 * 앱이 오디오 포커스를 잡지 않아 볼륨 버튼이 미디어가 아닌 벨소리 볼륨을 조절하고,
 * 미디어 볼륨이 0인 기기에서는 0.1~1.7초짜리 효과음이 그대로 무음이 된다.
 * 그래서 두 플랫폼 모두 Playback + mixWithOthers=false 로 고정한다.
 * 되돌리면 "앱 전체가 무음"으로 보이던 증상이 재발한다.
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

test('iOS 오디오 세션은 Playback + 포커스 요청으로 잡는다(미디어 볼륨 사용)', () => {
	load().applyAudioCategory();
	expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', false);
});

test('Android 오디오 세션도 같은 값으로 잡는다(플랫폼 분기 없음)', () => {
	const Platform = require('react-native').Platform;
	const original = Platform.OS;
	Platform.OS = 'android';
	try {
		load().applyAudioCategory();
		expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', false);
	} finally {
		Platform.OS = original;
	}
});

test('모듈이 올라오는 즉시 세션을 잡는다 — 플레이어보다 먼저여야 한다', () => {
	load();
	expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', false);
});

test('효과음은 번들 경로 기준으로 로드한다', () => {
	const mod = load();
	mod.playCorrect();
	expect(SoundMock.lastArgs).toEqual({ file: 'correct.m4a', basePath: '/bundle' });
});
