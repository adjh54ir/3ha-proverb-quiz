/**
 * 배경음(BGM) 회귀 테스트
 *
 * 타임챌린지는 포커스/일시정지 상태가 자주 바뀌어 startBgm('time') 이 짧은 간격으로 여러 번 불린다.
 * 로드가 끝나기 전(currentPlayer 가 아직 null)에 들어온 같은 트랙 요청을 "재생 중이 아니다"로 보고
 * 처음부터 다시 로드하면, 1.2MB 트랙이 매번 취소돼 배경음이 영영 나오지 않는다.
 */
import Sound from 'react-native-sound';

const SoundMock = Sound as unknown as {
	lastArgs?: { file: string; basePath: unknown };
	created: number;
	played: number;
	pitch?: number;
	speed?: number;
};

const load = () => {
	let mod: typeof import('../src/utils/BgmUtils');
	jest.isolateModules(() => {
		mod = require('../src/utils/BgmUtils');
	});
	// @ts-expect-error isolateModules 콜백에서 채워진다
	return mod;
};

/** 로드 콜백이 마이크로태스크로 미뤄져 있어 한 틱 흘려보낸다 */
const flush = () => Promise.resolve().then(() => {});

beforeEach(() => {
	SoundMock.created = 0;
	SoundMock.played = 0;
	SoundMock.pitch = undefined;
	SoundMock.speed = undefined;
});

test('타임챌린지 BGM 은 번들 경로 기준으로 로드한다', async () => {
	load().startBgm('time');
	await flush();
	expect(SoundMock.lastArgs).toEqual({ file: 'bgm_time.m4a', basePath: '/bundle' });
	expect(SoundMock.played).toBe(1);
});

test('로드 중 같은 트랙 재요청은 로드를 취소하지 않는다 (effect 재실행 대비)', async () => {
	const bgm = load();
	bgm.startBgm('time');
	bgm.startBgm('time'); // 아직 로드 완료 전
	bgm.startBgm('time');
	await flush();
	expect(SoundMock.created).toBe(1);
	expect(SoundMock.played).toBe(1);
});

test('일시정지 중에 로드가 끝나면 바로 재생하지 않는다', async () => {
	const bgm = load();
	bgm.startBgm('time');
	bgm.pauseBgm(); // 로드 완료 전 일시정지
	await flush();
	expect(SoundMock.played).toBe(0);
	bgm.resumeBgm();
	expect(SoundMock.played).toBe(1);
});

test('막판 배속은 재생 중인 트랙에 즉시 걸리고, 정지하면 원래대로 돌아온다', async () => {
	const bgm = load();
	bgm.startBgm('time');
	await flush();

	bgm.setBgmRate(1.12);
	expect(bgm.getBgmRate()).toBe(1.12);
	// 플랫폼마다 먹는 API 가 달라 둘 다 걸어야 한다(Android=pitch, iOS=speed)
	expect(SoundMock.pitch).toBe(1.12);
	expect(SoundMock.speed).toBe(1.12);

	bgm.stopBgm();
	expect(bgm.getBgmRate()).toBe(1);
});

/**
 * Sound.kt 의 setSpeed/setPitch 는 MediaPlayer.playbackParams 에 try/catch 없이 쓴다.
 * 일부 OEM 디코더가 던지면 @ReactMethod 라 앱이 그대로 죽으므로, 배속이 기본값인 동안에는
 * 아예 부르지 않는다(효과음과 같은 방어 — SoundUtils.applyPlaybackRate).
 */
test('배속이 1 인 동안은 네이티브 배속 API 를 건드리지 않는다', async () => {
	const bgm = load();
	bgm.startBgm('quiz');
	await flush();
	expect(SoundMock.pitch).toBeUndefined();
	expect(SoundMock.speed).toBeUndefined();
});

test('미리듣기 정지는 자기가 틀지 않은 BGM 을 끄지 않는다', async () => {
	const bgm = load();
	bgm.startBgm('quiz'); // 다른 화면·팝업이 틀어 둔 트랙
	await flush();

	bgm.startBgmPreview('quiz'); // 설정 화면 미리듣기 — 이미 흐르므로 소유권이 없다
	bgm.stopBgmPreview();

	// 아직 재생 중이면 같은 트랙 요청은 무시된다(새로 로드하지 않는다)
	bgm.startBgm('quiz');
	await flush();
	expect(SoundMock.created).toBe(1);
});

test('자기가 시작한 미리듣기는 정지한다', async () => {
	const bgm = load();
	bgm.startBgmPreview('quiz');
	await flush();
	expect(SoundMock.played).toBe(1);

	bgm.stopBgmPreview();
	// 정지됐으므로 같은 트랙 요청이 새 플레이어를 만든다
	bgm.startBgm('quiz');
	await flush();
	expect(SoundMock.created).toBe(2);
});

test('배속은 0.5~1.5 로 잘린다 — 곡이 알아들을 수 없게 되지 않도록', () => {
	const bgm = load();
	bgm.setBgmRate(9);
	expect(bgm.getBgmRate()).toBe(1.5);
	bgm.setBgmRate(0);
	expect(bgm.getBgmRate()).toBe(0.5);
});
