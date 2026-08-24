import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING_H } from '@/const/common/Theme';

/**
 * 모달 오버레이의 상·하 안전 여백.
 *
 * AppModal 은 딤이 잘리지 않도록 화면(screen) 실측 크기 - 상태바·내비게이션바를 포함한 - 로
 * 깔린다. 그래서 오버레이 안에서 가운데 정렬된 카드는 시스템 바 밑까지 파고들 수 있고,
 * 카드가 화면 높이에 가까울수록(달력·목록 모달) 위아래가 잘려 보인다.
 *
 * 이 여백을 오버레이에 주면 카드가 시스템 바를 피하고, `maxHeight: '100%'` 인 카드는
 * 남은 높이에 맞춰 스스로 줄어든다.
 *
 * ```tsx
 * const safePadding = useModalSafePadding();
 * <View style={[styles.overlay, safePadding]} />
 * ```
 */
export const useModalSafePadding = () => {
	const insets = useSafeAreaInsets();
	return {
		paddingTop: insets.top + SPACING_H.lg,
		paddingBottom: insets.bottom + SPACING_H.lg,
	};
};

export default useModalSafePadding;
