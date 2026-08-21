/**
 * 배경음악(BGM) 유틸 — 퀴즈/타임챌린지 동안 반복 재생 (react-native-sound 기반)
 *
 * - 트랙: bgm_quiz.m4a (일반 퀴즈), bgm_time.m4a (타임챌린지)
 *   파일 위치/포맷은 SoundUtils와 동일 (android res/raw, ios 번들 리소스, AAC 96kbps)
 * - 한 번에 하나만 재생. 화면 전환/종료 시 stopBgm()으로 반드시 정리(메모리 누수 방지)
 * - SFX(효과음)와 별개 토글. 기본 ON.
 */
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { applyAudioCategory } from './SoundUtils';

const SOURCES = {
	quiz: 'bgm_quiz.m4a',
	time: 'bgm_time.m4a',
} as const;

export type BgmTrack = keyof typeof SOURCES;

const BGM_KEY = MainStorageKeyType.BGM_ENABLED;
const BGM_VOLUME_KEY = MainStorageKeyType.BGM_VOLUME;

/** 볼륨 100%일 때의 실제 재생 볼륨 (배경음이라 효과음보다 훨씬 낮게 깐다) */
const MAX_VOLUME = 0.28;

let bgmEnabled = true;
let volumeRatio = 1; // 사용자 설정 볼륨 0~1

let currentPlayer: Sound | null = null;
let currentTrack: BgmTrack | null = null;
// 로드가 끝나기 전에 stopBgm()이 불릴 수 있다 — 그 경우 재생하지 않기 위한 세대 번호
let generation = 0;

/** BGM on/off (설정 연동용) */
export const setBgmEnabled = (v: boolean) => {
	bgmEnabled = v;
	AsyncStorage.setItem(BGM_KEY, v ? '1' : '0').catch(() => {});
	if (!v) {
		stopBgm();
	}
};

/** 현재 BGM on/off 상태 */
export const isBgmEnabled = () => bgmEnabled;

/** BGM 볼륨 설정 (0~1). 재생 중이면 즉시 반영 */
export const setBgmVolume = (ratio: number) => {
	volumeRatio = Math.min(1, Math.max(0, ratio));
	currentPlayer?.setVolume(MAX_VOLUME * volumeRatio);
	AsyncStorage.setItem(BGM_VOLUME_KEY, String(volumeRatio)).catch(() => {});
};

/** 현재 BGM 볼륨 (0~1) */
export const getBgmVolume = () => volumeRatio;

/** 앱 시작 시 저장된 BGM 설정 로드 (기본: on / 100%) */
export const loadBgmSetting = async () => {
	try {
		const [enabled, volume] = await AsyncStorage.multiGet([BGM_KEY, BGM_VOLUME_KEY]);
		bgmEnabled = enabled[1] !== '0';
		const parsed = Number(volume[1]);
		volumeRatio = Number.isFinite(parsed) && volume[1] !== null ? Math.min(1, Math.max(0, parsed)) : 1;
	} catch {
		bgmEnabled = true;
		volumeRatio = 1;
	}
};

/**
 * 화면 사정으로 잠깐 멈춤 (일시정지 팝업·안내 등). stopBgm 과 달리 트랙을 버리지 않는다.
 * 앱이 백그라운드로 내려간 경우와 구분하기 위해 별도 플래그를 둔다.
 */
let pausedByScreen = false;

export const pauseBgm = () => {
	if (!currentPlayer || pausedByScreen) {
		return;
	}
	pausedByScreen = true;
	currentPlayer.pause();
};

/** pauseBgm 으로 멈춘 BGM 재개. 멈춘 적이 없으면 아무것도 하지 않는다. */
export const resumeBgm = () => {
	if (!pausedByScreen) {
		return;
	}
	pausedByScreen = false;
	if (currentPlayer && bgmEnabled) {
		currentPlayer.play();
	}
};

/** 현재 재생 중인 BGM 정지 + 리소스 해제 */
export const stopBgm = () => {
	generation += 1; // 로딩 중인 트랙이 있으면 재생되지 않도록 무효화
	pausedByScreen = false;
	const player = currentPlayer;
	currentPlayer = null;
	currentTrack = null;
	if (!player) {
		return;
	}
	player.stop(() => player.release());
};

/**
 * BGM 재생 시작 (무한 반복). 이미 같은 트랙이 재생 중이면 무시.
 * @param track 'quiz' | 'time'
 */
export const startBgm = (track: BgmTrack) => {
	if (!bgmEnabled || volumeRatio === 0) {
		return;
	}
	if (currentTrack === track && currentPlayer) {
		return;
	} // 이미 재생 중
	stopBgm(); // 다른 트랙 정리

	// 다른 앱 음악과 섞이도록 보장 (효과음과 동일한 세션 설정을 재사용한다)
	applyAudioCategory();

	const myGeneration = generation;
	currentTrack = track;
	const player = new Sound(SOURCES[track], Sound.MAIN_BUNDLE, (err) => {
		// 로드 콜백이 동기로 불릴 수 있어 player 바인딩이 끝난 뒤로 미룬다
		Promise.resolve().then(() => {
			// 로딩 도중 stopBgm()/다른 트랙 시작이 있었으면 버린다
			if (myGeneration !== generation) {
				if (!err) {
					player.release();
				}
				return;
			}
			if (err) {
				currentTrack = null;
				if (__DEV__) {
					console.warn(`🔇 BGM 로드 실패: ${SOURCES[track]}`, err);
				}
				return;
			}
			player.setNumberOfLoops(-1);
			player.setVolume(MAX_VOLUME * volumeRatio);
			currentPlayer = player;
			player.play();
		});
	});
};

// 앱이 백그라운드로 가면 BGM을 멈추고, 돌아오면 이어서 재생한다.
// (없으면 홈 버튼을 눌러도 음악이 계속 흘러 배터리를 먹는다)
let pausedByBackground = false;
AppState.addEventListener('change', (state) => {
	if (state === 'active') {
		if (pausedByBackground && currentPlayer && bgmEnabled && !pausedByScreen) {
			currentPlayer.play();
		}
		pausedByBackground = false;
		return;
	}
	if (currentPlayer) {
		currentPlayer.pause();
		pausedByBackground = true;
	}
});

export default { startBgm, stopBgm, pauseBgm, resumeBgm, setBgmEnabled, isBgmEnabled, setBgmVolume, getBgmVolume, loadBgmSetting };
