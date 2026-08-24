import React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useModalEnter } from '@/hooks/useModalEnter';

interface PopInViewProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	/** true가 되는 순간 팝 애니메이션 재생 (모달 visible과 연동) */
	visible?: boolean;
}

/**
 * 카드 등장용 팝 애니메이션 래퍼.
 *
 * 모션은 `useModalEnter` 하나에서만 정의한다 — 예전에는 이 컴포넌트가 spring 0.92→1,
 * 모달들은 timing 0.95→1 을 따로 쓰고 있어 같은 앱 안에서 팝업이 두 가지 속도로 열렸다.
 */
const PopInView = ({ children, style, visible = true }: PopInViewProps) => {
	const enterStyle = useModalEnter(visible);

	return <Animated.View style={[style, enterStyle]}>{children}</Animated.View>;
};

export default PopInView;
