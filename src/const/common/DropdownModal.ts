import { Dimensions, ModalProps, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING_H, themedValue } from '@/const/common/Theme';

/**
 * DropDownPicker(listMode="MODAL") 카테고리 팝업 공통 설정.
 *
 * 이 팝업은 앱 공용 `AppModal` 을 거치지 않는다. 라이브러리가 RN `<Modal>` 을 직접 렌더하기
 * 때문이다(`react-native-dropdown-picker/src/components/Picker.js`). 그래서 AppModal 이
 * 한곳에서 막아 둔 두 가지가 이 팝업에는 적용되지 않아, 같은 문제가 화면마다 다시 새어 나왔다.
 *
 *  1. `statusBarTranslucent` / `navigationBarTranslucent` 가 없으면 팝업 창이 상태바·
 *     내비게이션바를 **비켜서** 열려 딤이 화면 위아래 끝까지 닿지 않는다.
 *     (RN 문서 — navigationBarTranslucent 는 statusBarTranslucent 와 함께 켜야 동작한다)
 *  2. 모달 내용 루트의 크기는 네이티브 → JS 왕복으로 채워진다
 *     (`ReactModalHostView.updateState`). 그래서 **처음 여는 한 번**은 0 으로 측정되고,
 *     그 위에 얹은 `marginTop: '25%'` / `width: '85%'` / `maxHeight: '60%'` 는 모두 0 이 되어
 *     카드가 사라진다. `alignSelf: 'center'` 도 폭 0 기준이라 카드가 화면 왼쪽 밖으로 나간다.
 *     (두 번째부터는 캐시된 크기라 정상이었다 — 그래서 "첫 열기만 깨지는" 증상이었다)
 *
 *     그래서 카드의 폭·최대 높이·위치를 화면(screen) 실측 px 로 고정한다. 부모가 아직 0 이어도
 *     RN 의 ReactViewGroup 은 setClipChildren(false) 라 고정 크기 자식은 그대로 그려진다 —
 *     AppModal 이 안쪽을 고정 크기 View 로 감싸는 것과 같은 처리다.
 *
 * 앱은 세로 고정이라(AndroidManifest `screenOrientation="portrait"`, Info.plist
 * `UISupportedInterfaceOrientations`) 모듈 로드 시 한 번 재는 것으로 충분하다.
 */
const screen = Dimensions.get('screen');

/** 카드 폭 — 기존 `width: '85%'` 와 같은 비율. */
const CARD_WIDTH = Math.round(screen.width * 0.85);
/** 카드 최대 높이 — 기존 `maxHeight: '60%'` 와 같은 비율. */
const CARD_MAX_HEIGHT = Math.round(screen.height * 0.6);
/** 카드 상단 여백 — 기존 `marginTop: '25%'`. */
const CARD_MARGIN_TOP = Math.round(screen.height * 0.25);
/** `alignSelf: 'center'` 대체 — 폭 0 인 부모를 기준으로 삼지 않는 좌우 중앙 정렬. */
const CARD_MARGIN_LEFT = Math.round((screen.width - CARD_WIDTH) / 2);

/**
 * 카테고리 팝업의 `modalProps`.
 * AppModal 처럼 두 translucent 속성을 항상 켜서 딤이 잘리지 않게 한다.
 */
export const DROPDOWN_MODAL_PROPS: ModalProps = {
	animationType: 'fade',
	presentationStyle: 'overFullScreen',
	transparent: true,
	statusBarTranslucent: true,
	navigationBarTranslucent: true,
};

/**
 * 카테고리 팝업의 `modalContentContainerStyle` 공통 값(= 카드 자체).
 * 화면마다 다른 테두리 같은 값은 호출부에서 배열로 덧붙인다.
 *
 * themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
 */
export const DROPDOWN_MODAL_CONTENT_STYLE: ViewStyle = themedValue(() => ({
	width: CARD_WIDTH,
	marginLeft: CARD_MARGIN_LEFT,
	marginTop: CARD_MARGIN_TOP,
	maxHeight: CARD_MAX_HEIGHT,
	backgroundColor: COLORS.surface,
	borderRadius: RADIUS.xl,
	paddingVertical: SPACING_H.xl,
}));
