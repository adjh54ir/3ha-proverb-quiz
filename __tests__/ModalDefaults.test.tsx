/**
 * ModalDefaults 회귀 테스트
 * - Android 팝업 배경이 화면 끝까지 채워지려면 두 프롭이 기본으로 켜져 있어야 한다.
 * - navigationBarTranslucent 는 statusBarTranslucent 가 true 여야 RN 이 경고 없이 동작한다.
 */
import { Modal } from 'react-native';
import '../src/utils/ModalDefaults';

test('Modal 기본 프롭에 translucent 설정이 주입된다', () => {
	const defaults = (Modal as unknown as { defaultProps?: Record<string, unknown> }).defaultProps;

	expect(defaults?.statusBarTranslucent).toBe(true);
	expect(defaults?.navigationBarTranslucent).toBe(true);
	// RN 기본값(visible)이 덮이지 않았는지 확인
	expect(defaults?.visible).toBe(true);
});
