/**
 * react-native 0.78 iOS(Fabric) 배경색 레이어 크기 패치 (postinstall 자동 실행)
 *
 * 증상: 테두리(borderWidth)와 둥근 모서리가 있는 카드가 `transform: [{ scale: 0.95 }]` 로
 * 마운트되면(모달 등장 애니메이션 `useModalEnter`) 테두리는 카드 크기대로 그려지는데
 * 흰 배경은 95% 크기에서 멈춘다. 첫 번째 열 때만 재현되고 두 번째부터는 정상이다.
 *
 * 원인: Fabric 의 RCTViewComponentView 는 CSS 방식 테두리(테두리를 내용 뒤에 그리는 경우)에서
 * 배경색을 별도 서브레이어 `_backgroundColorLayer` 로 그린다. 이 레이어를 처음 만들 때
 *
 *   _backgroundColorLayer.frame = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
 *
 * 처럼 `self.frame` 을 쓰는데, `frame` 은 transform 이 반영된 크기다(scale 0.95 → 95%).
 * 이후 네이티브 드라이버가 scale 을 1 로 되돌려도 서브레이어 프레임은 다시 계산되지 않는다.
 * 뷰가 재활용되는 두 번째 마운트부터는 레이어가 이미 있어 `updateLayoutMetrics` 의
 * `self.layer.bounds` 경로를 타므로 정상이다. `_containerView`(overflow: hidden 컨테이너) 도 같은 버그.
 *
 * 업스트림 main 은 둘 다 `self.layer.bounds` / `self.bounds` 로 고쳐져 있다. 그 수정을 백포트한다.
 * react-native 를 올려서 원본에 `self.frame.size` 가 없으면 이 스크립트와
 * package.json 의 postinstall 항목을 지운다.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(
	__dirname,
	'..',
	'node_modules',
	'react-native',
	'React',
	'Fabric',
	'Mounting',
	'ComponentViews',
	'View',
	'RCTViewComponentView.mm',
);

const REPLACEMENTS = [
	[
		'_backgroundColorLayer.frame = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);',
		'_backgroundColorLayer.frame = CGRectMake(0, 0, self.layer.bounds.size.width, self.layer.bounds.size.height);',
	],
	[
		'_containerView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, self.frame.size.width, self.frame.size.height)];',
		'_containerView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];',
	],
];

if (!fs.existsSync(TARGET)) {
	// 라이브러리가 없는 환경(CI의 lint-only 잡 등)에서는 조용히 통과한다.
	process.exit(0);
}

let source = fs.readFileSync(TARGET, 'utf8');

if (REPLACEMENTS.every(([, fixed]) => source.includes(fixed))) {
	process.exit(0); // 이미 패치됨
}

for (const [broken, fixed] of REPLACEMENTS) {
	if (!source.includes(broken) && !source.includes(fixed)) {
		console.error(
			'[patch-rn-view-bg] RCTViewComponentView.mm 에서 패치 대상 코드를 찾지 못했습니다. ' +
				'react-native 버전이 바뀌었다면 scripts/patch-rn-view-bg.js 를 갱신하거나 지우세요.',
		);
		process.exit(1);
	}
	source = source.split(broken).join(fixed);
}

fs.writeFileSync(TARGET, source);
console.log('[patch-rn-view-bg] RCTViewComponentView.mm 배경색 레이어 크기 패치 적용 완료');
