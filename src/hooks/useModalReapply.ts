import { useCallback, useState } from 'react';
import { ModalProps, Platform } from 'react-native';

/**
 * 번갈아 쓰는 더미 값 두 개. 값이 "바뀌었다"는 사실만 필요하다.
 * `supportedOrientations` 는 안드로이드 ViewManager 에서 빈 구현(`Unit`)이라 부작용이 없고,
 * 앱은 어차피 세로 고정이라 iOS 쪽 의미도 달라지지 않는다.
 */
const REAPPLY_VALUES: NonNullable<ModalProps['supportedOrientations']>[] = [['portrait'], ['portrait', 'portrait-upside-down']];

/**
 * 모달 창이 뜬 뒤 네이티브 프롭을 한 번 더 흘려보내는 훅.
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────
 * RN 은 `dialog.show()` **전에** `WindowCompat.setDecorFitsSystemWindows(window, false)` 를
 * 부른다(`ReactModalHostView.showOrUpdate`). 그런데 그 시점에는 ViewRootImpl 이 아직 없어서
 * (`PhoneWindow.applyDecorFitsSystemWindows` 가 `getViewRootImplOrNull() == null` 로 빠져나감)
 * 설정이 실제로 적용되지 않는다. 그래서 **처음 여는 한 번**은 다이얼로그 content 뷰가 시스템
 * 바만큼 padding 을 갖고, `clipToPadding=true` 라 그 띠를 잘라낸다 — 딤이 화면 끝까지 닿지
 * 못하고, 고정 크기로 얹은 카드도 그만큼 밀린다.
 *
 * 창이 뜬 뒤(onShow) 네이티브 프롭을 바꾸면
 * `onAfterUpdateTransaction → showOrUpdate → updateProperties` 가 다시 돌고, 이번에는
 * ViewRootImpl 이 붙어 있으므로 edge-to-edge 설정이 실제로 먹는다.
 * (두 번째부터 정상으로 보이던 것도 같은 이유다 — 이미 붙은 창에 적용되기 때문)
 *
 * 열 때마다 새 Dialog 가 만들어지므로 값을 **번갈아** 준다. 한 값으로 고정하면 두 번째
 * 열기부터는 생성 시점 값과 같아져 프롭 변경이 일어나지 않고 증상이 되돌아온다.
 *
 * ```tsx
 * const { supportedOrientations, markShown } = useModalReapply();
 * <Modal supportedOrientations={supportedOrientations} onShow={markShown} />
 * ```
 */
export const useModalReapply = () => {
	const [tick, setTick] = useState(0);

	/** 창이 실제로 뜬 시점에 부른다 (Modal 의 onShow). */
	const markShown = useCallback(() => setTick((prev) => prev + 1), []);

	return {
		// 안드로이드에서만 필요한 재적용이다. iOS 는 호출부 값을 그대로 두도록 undefined 를 준다.
		supportedOrientations: Platform.OS === 'android' ? REAPPLY_VALUES[tick % REAPPLY_VALUES.length] : undefined,
		markShown,
	};
};

export default useModalReapply;
