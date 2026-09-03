module.exports = {
	preset: 'react-native',
	setupFiles: ['<rootDir>/jest.setup.js'],
	// 이 프로젝트 의존성 상당수가 ESM 으로 배포된다(react-redux, react-native-version-check …).
	// 패키지를 하나씩 예외 목록에 추가하는 대신 node_modules 도 babel 로 변환한다.
	transformIgnorePatterns: [],
	// 모달 등장 애니메이션(250ms)을 실제 타이머로 기다리는 테스트가 있다. 23개 스위트를
	// 병렬로 돌리면 워커가 굶어 기본 5초 안에 못 끝나고 간헐적으로 터진다(로직 문제 아님).
	testTimeout: 20000,
};
