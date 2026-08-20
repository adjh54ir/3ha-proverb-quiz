/**
 * 전역 Modal 기본 프롭 (부수효과 모듈)
 *
 * Android 의 RN <Modal> 은 별도 Dialog 윈도우로 뜨는데, 기본값은
 * decorFitsSystemWindows=true 라 상태바/네비게이션바 영역이 딤 배경 밖으로 남는다.
 * → 팝업을 띄우면 배경이 화면 끝까지 안 채워진 채로 잘려 보이는 문제.
 *
 * statusBarTranslucent + navigationBarTranslucent 를 켜면 모달 윈도우가
 * edge-to-edge 로 확장되어 배경(딤)이 화면 끝까지 채워진다.
 * (navigationBarTranslucent 는 statusBarTranslucent 가 true 여야 경고 없이 동작 — RN 0.77+)
 *
 * 모달마다 프롭을 반복해서 붙이면 새로 추가되는 모달에서 또 누락되므로
 * 클래스 컴포넌트의 defaultProps 로 한 번에 기본값을 잡는다.
 * (React 19 에서 defaultProps 는 함수 컴포넌트만 제거됐고 클래스는 유지된다.
 *  RN Modal 은 클래스 컴포넌트이므로 안전하다.)
 *
 * ⚠️ 모달 하단에 버튼/액션시트를 붙일 때는 네비게이션 바 아래까지 영역이 늘어나므로
 *    useSafeAreaInsets().bottom 만큼 paddingBottom 을 반드시 주어야 한다.
 *
 * index.js 최상단에서 App 보다 먼저 import 할 것.
 */
import { Modal } from 'react-native';

const ModalAny = Modal as unknown as { defaultProps?: Record<string, unknown> };

ModalAny.defaultProps = {
	...ModalAny.defaultProps,
	statusBarTranslucent: true,
	navigationBarTranslucent: true,
};

export {};
