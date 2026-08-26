/**
 * react-native-sound 0.13.0 Android 크래시 패치 (postinstall 자동 실행)
 *
 * 버그: Sound.kt 의 stop()/release() 가 오디오 포커스를 반납할 때
 *
 *   if (!this.mixWithOthers && key === this.focusedPlayerKey) {
 *
 * 를 평가한다. focusedPlayerKey 는 Double? 이고 첫 play() 전까지 null 이라,
 * Kotlin 이 언박싱하면서 NPE 가 난다.
 *
 *   java.lang.NullPointerException: Attempt to invoke virtual method
 *   'double java.lang.Double.doubleValue()' on a null object reference
 *       at com.zmxv.RNSound.Sound.stop(Sound.kt:272)
 *
 * @ReactMethod 안에서 던져지므로 JS try/catch 로 못 잡고 앱이 그대로 죽는다.
 * 우리 앱은 setCategory('Playback', false) 라 mixWithOthers 가 false 이고,
 * SoundUtils.play() 가 재생 전에 항상 stop() 을 부르기 때문에 효과음이 있는
 * 화면에 들어가는 즉시 100% 재현됐다.
 *
 * 덤으로 === 를 == 로 바꾼다. 박싱된 Double 의 참조 비교는 항상 false 라
 * abandonAudioFocus() 가 한 번도 호출되지 않고 있었다.
 *
 * 업스트림에 고쳐지면(https://github.com/zmxv/react-native-sound) 이 스크립트와
 * package.json 의 postinstall 을 지운다.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(
	__dirname,
	'..',
	'node_modules',
	'react-native-sound',
	'android',
	'src',
	'main',
	'java',
	'com',
	'zmxv',
	'RNSound',
	'Sound.kt',
);

const BROKEN = 'if (!this.mixWithOthers && key === this.focusedPlayerKey) {';
const FIXED = 'if (!this.mixWithOthers && this.focusedPlayerKey != null && key == this.focusedPlayerKey) {';

if (!fs.existsSync(TARGET)) {
	// 라이브러리가 없는 환경(CI의 lint-only 잡 등)에서는 조용히 통과한다.
	process.exit(0);
}

const source = fs.readFileSync(TARGET, 'utf8');

if (source.includes(FIXED)) {
	process.exit(0); // 이미 패치됨
}

if (!source.includes(BROKEN)) {
	console.error(
		'[patch-rn-sound] Sound.kt 에서 패치 대상 코드를 찾지 못했습니다. ' +
			'react-native-sound 버전이 바뀌었다면 scripts/patch-rn-sound.js 를 갱신하세요.',
	);
	process.exit(1);
}

fs.writeFileSync(TARGET, source.split(BROKEN).join(FIXED));
console.log('[patch-rn-sound] Sound.kt 오디오 포커스 반납 NPE 패치 적용 완료');
