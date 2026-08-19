module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		// ================================ modules-resolver ================================
		[
			'module-resolver',
			{
				root: ['./src'],
				alias: {
					'@': './src',
				},
				extensions: ['.ios.ts', '.android.ts', '.ios.tsx', '.android.tsx', '.ts', '.tsx', '.jsx', '.js', '.json'],
			},
		],
		// ================================ react-native-dotenv ================================
		[
			'module:react-native-dotenv',
			// Development 환경 파일 설정
			{
				envName: 'APP_ENV',
				moduleName: '@env',
				path: '.env', // ⭐️ 불러올 환경 파일 명 ⭐️
				blocklist: null,
				allowlist: null,
				blacklist: null, // DEPRECATED
				whitelist: null, // DEPRECATED
				safe: false,
				allowUndefined: true,
			},
			'react-native-dotenv-1', // 고유한 이름 부여
		],

		'inline-dotenv',
		'react-native-reanimated/plugin', // needs to be last
	],
	env: {
		// 운영(release) 번들에서는 console.* 호출을 전부 제거한다.
		// error 까지 지우면 Crashlytics 로 올라가는 단서가 사라지므로 남긴다.
		production: {
			plugins: [['transform-remove-console', { exclude: ['error'] }]],
		},
	},
};
