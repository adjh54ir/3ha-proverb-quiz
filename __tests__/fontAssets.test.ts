/**
 * 커스텀 서체 배선 회귀 테스트
 *
 * 서체 파일은 android/app/src/main/res/font 한 곳에만 있고, iOS 는 같은 파일을 번들에 참조한다.
 * 그래서 네 군데가 같이 움직여야 한다 — 하나라도 빠지면 그 플랫폼만 조용히 시스템 서체로 돌아간다.
 *  1. res/font 의 XML 폰트 패밀리
 *  2. MainApplication 의 addCustomFont 등록 (JS fontFamily 이름)
 *  3. Info.plist UIAppFonts
 *  4. Xcode 프로젝트의 Copy Bundle Resources
 */
import fs from 'fs';
import path from 'path';
import { FONTS } from '@/const/common/Theme';

const ROOT = path.join(__dirname, '..');
const FONT_DIR = path.join(ROOT, 'android/app/src/main/res/font');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const fontFiles = fs.readdirSync(FONT_DIR).filter((f) => /\.(otf|ttf)$/.test(f));
const mainApplication = read('android/app/src/main/java/com/threehundredapptemplate/MainApplication.kt');
const infoPlist = read('ios/ProverbQuiz/Info.plist');
const pbxproj = read('ios/ProverbQuiz.xcodeproj/project.pbxproj');

test('서체 파일이 있다', () => {
	expect(fontFiles.length).toBeGreaterThan(0);
});

test.each(Object.values(FONTS))('%s 는 Android 에 XML 패밀리로 등록돼 있다', (family) => {
	// res 파일명은 소문자·공백 없음만 허용된다 ('Gowun Batang' → gowunbatang)
	const xml = family.toLowerCase().replace(/\s/g, '');
	expect(fs.existsSync(path.join(FONT_DIR, `${xml}.xml`))).toBe(true);
	expect(mainApplication).toContain(`addCustomFont(this, "${family}", R.font.${xml})`);
});

test.each(fontFiles)('%s 는 XML 패밀리·Info.plist·Xcode 리소스에 모두 들어 있다', (file) => {
	const family = file.split('_')[0];
	expect(read(`android/app/src/main/res/font/${family}.xml`)).toContain(`@font/${file.replace(/\.(otf|ttf)$/, '')}"`);
	expect(infoPlist).toContain(`<string>${file}</string>`);
	expect(pbxproj).toContain(`/* ${file} in Resources */,`);
});
