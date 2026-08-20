module.exports = {
	preset: 'react-native',
	setupFiles: ['<rootDir>/jest.setup.js'],
	// 이 프로젝트 의존성 상당수가 ESM 으로 배포된다(react-redux, react-native-version-check …).
	// 패키지를 하나씩 예외 목록에 추가하는 대신 node_modules 도 babel 로 변환한다.
	transformIgnorePatterns: [],
};
