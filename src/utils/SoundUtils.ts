/**
 * 퀴즈 효과음 유틸 (react-native-sound 기반)
 *
 * 📁 사운드 파일 위치 (Metro 번들이 아니라 네이티브 리소스로 포함된다)
 *  - Android: android/app/src/main/res/raw/
 *  - iOS:     ios/ (Xcode 프로젝트의 Resources 빌드 페이즈에 등록됨)
 *
 * - 파일 추가/이름 변경 시 위 두 곳 모두 반영해야 하며, 네이티브 재빌드가 필요하다.
 * - 로드 실패 시 조용히 무음 처리한다(앱이 죽지 않음).
 * - 포맷은 AAC(.m4a) 96kbps — 원본 WAV(1411kbps) 대비 앱 용량 약 1/40.
 *   재인코딩 방법은 scripts/encode-sounds.sh 참고.
 * - 효과음: Mixkit Free SFX — assets/sounds/LICENSE.txt 참고
 */
import { Platform } from 'react-native';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import DateUtils from '@/utils/DateUtils';

/**
 * 오디오 세션 설정 — 다른 앱의 음악/영상을 끊지 않고 효과음만 얹는 것을 최우선으로 한다.
 *
 * iOS: Ambient
 *   - 다른 앱 오디오와 섞이고 세션을 빼앗지 않는다(유튜브·음악 재생 중 앱에 들어와도 그대로 재생됨).
 *   - Playback + mixWithOthers 조합은 쓸 수 없다. react-native-sound 가 mixWithOthers=true 일 때
 *     AllowBluetooth 옵션을 함께 넣는데, 이 옵션은 Record/PlayAndRecord 에서만 유효해
 *     setCategory 자체가 실패하고 세션이 기본값(SoloAmbient=끊김)으로 남는다.
 *   - 대가: Ambient 는 무음 스위치를 따르므로 무음 모드에서는 효과음이 나지 않는다.
 *
 * Android: Playback(STREAM_MUSIC) + mixWithOthers=true
 *   - 재생할 때 오디오 포커스를 요청하지 않아 다른 앱 재생이 끊기지 않는다.
 *   - 스트림은 STREAM_MUSIC 그대로라 미디어 볼륨을 따른다.
 *
 * ponytail: 무음 스위치까지 무시하면서 섞으려면 AVAudioSession 을 직접 다루는 네이티브 모듈이
 *           필요하다(Playback + MixWithOthers, AllowBluetooth 제외). 요구되면 그때 올린다.
 */
export const applyAudioCategory = () => {
	if (Platform.OS === 'ios') {
		Sound.setCategory('Ambient', false);
		return;
	}
	Sound.setCategory('Playback', true);
};

const SOURCES = {
	correct: 'correct.m4a',
	wrong: 'wrong.m4a',
	finish: 'finish.m4a',
	timeout: 'timeout.m4a',
	complete: 'complete.m4a',
	combo: 'combo.m4a', // 콤보 달성(타임챌린지)
	tick: 'tick.m4a', // 남은 시간 5초 카운트다운
	flip: 'flip.m4a', // 카드 뒤집기(짝 맞추기)
	match: 'match.m4a', // 짝 맞춤 성공
	pop: 'pop.m4a', // 즐겨찾기 저장/해제
	whoosh: 'whoosh.m4a', // 퀴즈 시작
} as const;

type SoundKey = keyof typeof SOURCES;

const SOUND_KEY = MainStorageKeyType.SOUND_ENABLED;
const VOLUME_KEY = MainStorageKeyType.SOUND_VOLUME;

/** 볼륨 100%일 때의 실제 재생 볼륨 (원음이 커서 그대로 쓰면 시끄럽다) */
const MAX_VOLUME = 0.8;

let soundEnabled = true;
let volumeRatio = 1; // 사용자 설정 볼륨 0~1

// 설정 로드를 기다리지 않고 모듈이 올라오는 즉시 한 번 적용한다.
// (플레이어가 만들어질 때 세션 설정이 이미 잡혀 있어야 한다)
applyAudioCategory();

// 로드된 플레이어 캐시 (첫 재생 때 만들어 두고 재사용)
const players = new Map<SoundKey, Sound>();
// 로드 중인 키 (동시에 두 번 만들지 않기 위함)
const loading = new Set<SoundKey>();
// 로드 실패한 키는 다시 시도하지 않는다
const failed = new Set<SoundKey>();

/**
 * 축하 계열 효과음은 서로 겹치면 싸구려로 들린다.
 * 같은 시간대에 요청이 몰리면 숫자가 큰 것 하나만 남긴다.
 */
const EXCLUSIVE_RANK: Partial<Record<SoundKey, number>> = {
	whoosh: 1,
	complete: 2,
	match: 2,
	finish: 3,
};
const EXCLUSIVE_WINDOW_MS = 900;
let lastExclusive: { key: SoundKey; rank: number; at: number } | null = null;

/** 효과음 on/off (설정 연동용) */
export const setSoundEnabled = (v: boolean) => {
	soundEnabled = v;
	AsyncStorage.setItem(SOUND_KEY, v ? '1' : '0').catch(() => {});
};

/** 현재 효과음 on/off 상태 */
export const isSoundEnabled = () => soundEnabled;

/** 효과음 볼륨 설정 (0~1). 이미 로드된 플레이어에도 즉시 반영 */
export const setSoundVolume = (ratio: number) => {
	volumeRatio = Math.min(1, Math.max(0, ratio));
	players.forEach((p) => p.setVolume(MAX_VOLUME * volumeRatio));
	AsyncStorage.setItem(VOLUME_KEY, String(volumeRatio)).catch(() => {});
};

/** 현재 효과음 볼륨 (0~1) */
export const getSoundVolume = () => volumeRatio;

/** 앱 시작 시 저장된 효과음 설정 로드 (기본: on / 100%) */
export const loadSoundSetting = async () => {
	try {
		const [enabled, volume] = await AsyncStorage.multiGet([SOUND_KEY, VOLUME_KEY]);
		soundEnabled = enabled[1] !== '0';
		const parsed = Number(volume[1]);
		volumeRatio = Number.isFinite(parsed) && volume[1] !== null ? Math.min(1, Math.max(0, parsed)) : 1;
	} catch {
		soundEnabled = true;
		volumeRatio = 1;
	}
	applyAudioCategory();
};

const load = (key: SoundKey, onReady?: (s: Sound) => void) => {
	if (failed.has(key)) {
		return;
	}
	const cached = players.get(key);
	if (cached) {
		onReady?.(cached);
		return;
	}
	if (loading.has(key)) {
		return;
	} // 이미 로드 중 — 중복 생성 방지
	loading.add(key);
	const player = new Sound(SOURCES[key], Sound.MAIN_BUNDLE, (err) => {
		// 로드 콜백이 동기로 불릴 수 있어 player 바인딩이 끝난 뒤로 미룬다
		Promise.resolve().then(() => {
			loading.delete(key);
			if (err) {
				failed.add(key);
				// 원인이 묻히면 "효과음이 안 난다"를 추적할 수 없다 — 개발 빌드에서만 노출
				if (__DEV__) {
					console.warn(`🔇 효과음 로드 실패: ${SOURCES[key]}`, err);
				}
				return;
			}
			player.setVolume(MAX_VOLUME * volumeRatio);
			players.set(key, player);
			onReady?.(player);
		});
	});
};

/**
 * 축하 계열이 겹치는지 판정.
 * - 낮은 등급이 뒤늦게 오면 버린다(false)
 * - 높은 등급이 오면 앞서 울리던 소리를 끊고 이어받는다
 */
const passExclusiveGate = (key: SoundKey): boolean => {
	const rank = EXCLUSIVE_RANK[key];
	if (!rank) {
		return true; // 겹침 관리 대상이 아님
	}
	const now = DateUtils.nowTime();
	if (lastExclusive && now - lastExclusive.at < EXCLUSIVE_WINDOW_MS) {
		if (rank <= lastExclusive.rank) {
			return false;
		}
		players.get(lastExclusive.key)?.stop();
	}
	lastExclusive = { key, rank, at: now };
	return true;
};

/**
 * @param key   재생할 효과음
 * @param pitch 1보다 크면 더 높고 빠르게 (콤보 고조용). Android는 pitch, iOS는 speed로 반영된다.
 */
const play = (key: SoundKey, pitch = 1) => {
	if (!soundEnabled || volumeRatio === 0) {
		return;
	}
	if (!passExclusiveGate(key)) {
		return;
	}
	load(key, (player) => {
		player.setPitch(pitch); // Android 전용
		player.setSpeed(pitch); // iOS 전용
		// 연속 재생 시 앞선 재생을 끊고 처음부터
		player.stop(() => player.play());
	});
};

/** 앱 시작 시 미리 로드해 첫 재생 지연을 없앤다 (선택) */
export const preloadSounds = () => {
	(Object.keys(SOURCES) as SoundKey[]).forEach((key) => load(key));
};

export const playCorrect = () => play('correct');
export const playWrong = () => play('wrong');
export const playFinish = () => play('finish');
/** 문제 시간 초과 */
export const playTimeout = () => play('timeout');
/** 학습 완료 버튼 */
export const playComplete = () => play('complete');
/**
 * 콤보 달성(타임챌린지).
 * 콤보가 쌓일수록 음이 높아진다 — 숫자보다 몸으로 먼저 느껴진다.
 * @param combo 현재 콤보 수
 */
export const playCombo = (combo = 0) => {
	const step = Math.max(0, Math.floor((combo - 2) / 3)); // 2·5·8… 단계
	const pitch = Math.min(1.3, 1 + step * 0.06);
	play('combo', pitch);
};
/** 남은 시간 카운트다운(마지막 5초) */
export const playTick = () => play('tick');
/** 카드 뒤집기(짝 맞추기) */
export const playFlip = () => play('flip');
/** 짝 맞춤 성공 */
export const playMatch = () => play('match');
/** 즐겨찾기 저장/해제 */
export const playPop = () => play('pop');
/** 퀴즈 시작 */
export const playWhoosh = () => play('whoosh');

export default {
	playCorrect,
	playWrong,
	playFinish,
	playTimeout,
	playComplete,
	playCombo,
	playTick,
	playFlip,
	playMatch,
	playPop,
	playWhoosh,
	preloadSounds,
	setSoundEnabled,
	isSoundEnabled,
	setSoundVolume,
	getSoundVolume,
	loadSoundSetting,
};
