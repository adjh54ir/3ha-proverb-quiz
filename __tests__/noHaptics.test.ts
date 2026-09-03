/**
 * 진동/햅틱 금지 회귀 테스트
 *
 * 이 앱은 진동 피드백을 쓰지 않는다는 정책이다. 그런데 진동은 두 갈래로 조용히 들어온다.
 *  1) `Vibration` API 나 햅틱 라이브러리 — 코드에 한 줄만 들어가도 바로 울린다.
 *  2) notifee 알림 채널 — `createChannel` 의 `vibration` 기본값이 **true** 라
 *     아무것도 안 써도 알림이 울릴 때 진동한다. 안드로이드 채널은 생성 후 설정이
 *     불변이라 나중에 고치려면 채널 ID 를 새로 발급해야 해서 되돌리는 비용이 크다.
 *
 * 그래서 소스로 못박는다.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');

const walk = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			return walk(full);
		}
		return /\.tsx?$/.test(entry.name) ? [full] : [];
	});

const SOURCES = walk(path.join(ROOT, 'src'));

test('Vibration API / 햅틱 라이브러리를 쓰지 않는다', () => {
	const offenders = SOURCES.filter((file) => {
		const source = fs.readFileSync(file, 'utf8');
		return /\bVibration\b|\bvibrate\(|haptic|Haptic|impactAsync/.test(source);
	}).map((file) => path.relative(ROOT, file));
	expect(offenders).toEqual([]);
});

test('알림 채널은 모두 진동을 끈다 (notifee 기본값이 true)', () => {
	const source = fs.readFileSync(path.join(ROOT, 'src/utils/NotifactionHelper.ts'), 'utf8');
	const channels = [...source.matchAll(/createChannel\(\{([\s\S]*?)\}\)/g)].map((m) => m[1]);
	expect(channels.length).toBeGreaterThan(0);
	channels.forEach((channel) => {
		expect(channel).toMatch(/vibration:\s*false/);
	});
});

test('안드로이드 매니페스트에 VIBRATE 권한이 없다', () => {
	const manifest = fs.readFileSync(path.join(ROOT, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
	expect(manifest).not.toMatch(/android\.permission\.VIBRATE/);
});
