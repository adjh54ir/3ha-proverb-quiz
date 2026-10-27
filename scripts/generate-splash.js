const fs = require('node:fs/promises');
const path = require('node:path');
const { createRequire } = require('node:module');

const sharp = createRequire(require.resolve('react-native-bootsplash'))('sharp');
const root = path.resolve(__dirname, '..');

async function generate() {
	const source = await sharp(path.join(root, 'src/assets/images/bootsplash_logo.png')).trim().png().toBuffer();
	const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	let radius = 0;
	for (let y = 0; y < info.height; y++) {
		for (let x = 0; x < info.width; x++) {
			if (data[(y * info.width + x) * 4 + 3] > 0) {
				radius = Math.max(radius, Math.hypot(x + 0.5 - info.width / 2, y + 0.5 - info.height / 2));
			}
		}
	}
	if (!radius) throw new Error('스플래시 이미지가 비어 있습니다.');
	// Android의 지름 192dp 원 안에 보간 여유 2dp를 확보한다.
	const scale = 94 / radius;
	for (const [density, ratio] of Object.entries({ mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 })) {
		const size = 288 * ratio;
		const logo = await sharp(source)
			.resize(Math.floor(info.width * scale * ratio), Math.floor(info.height * scale * ratio))
			.png()
			.toBuffer();
		const directory = path.join(root, `android/app/src/main/res/drawable-${density}`);
		await fs.mkdir(directory, { recursive: true });
		await sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
			.composite([{ input: logo, gravity: 'centre' }])
			.png()
			.toFile(path.join(directory, 'bootsplash_logo.png'));
	}
	const directory = path.join(root, 'ios/ProverbQuiz/Images.xcassets/BootSplashLogo-8f0605.imageset');
	for (const [suffix, ratio] of [
		['', 1],
		['@2x', 2],
		['@3x', 3],
	]) {
		const size = 248 * ratio;
		const logo = await sharp(source).resize(size, size, { fit: 'contain', background: '#00000000' }).png().toBuffer();
		await fs.writeFile(path.join(directory, `logo-8f0605${suffix}.png`), logo);
	}
	console.log('스플래시 생성 완료: Android 5종(원형 안전영역), iOS 3종(248pt)');
}

generate().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
