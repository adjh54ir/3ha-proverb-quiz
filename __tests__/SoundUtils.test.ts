/**
 * 오디오 세션 회귀 테스트
 *
 * "설정은 켜져 있는데 앱 전체가 무음"의 원인은 오디오 포커스였다.
 * 믹스(mixWithOthers=true)로 두면 앱이 포커스를 잡지 않아 볼륨 버튼이 미디어 볼륨이 아니라
 * 벨소리 볼륨을 움직인다. 미디어 볼륨이 0인 기기에서는 0.1~1.7초짜리 효과음이 그냥 안 들린다.
 * 그래서 Playback + 비믹스로 고정한다 — 되돌리면 같은 증상이 재발한다.
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

test('오디오 세션은 Playback + 비믹스로 잡는다(오디오 포커스 확보)', () => {
	load().applyAudioCategory();
	expect(SoundMock.setCategory).toHaveBeenCalledWith('Playback', false);
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
