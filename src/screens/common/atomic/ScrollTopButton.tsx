import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

import IconComponent from './IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, HIT_SLOP, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';

/**
 * 목록 최상단으로 되돌리는 공용 플로팅 버튼.
 *
 * 화면마다 따로 만들어 쓰던 걸 하나로 모은다(크기 40/44/48, 하단 여백, 애니메이션 유무가
 * 전부 달랐다). 필터·탭 같은 주요 조작이 화면 맨 위에 있는 구조라, 긴 목록에서 엄지로
 * 닿는 위치에 되돌아갈 수단이 있어야 한다.
 *
 * 등장/퇴장은 fade + scale 로 처리하고, 애니메이션은 언마운트 시 반드시 정리한다.
 * 숨은 동안에도 트리에 남겨 두되 `pointerEvents='none'` 으로 터치를 막는다
 * (조건부 언마운트하면 사라질 때 애니메이션이 재생되지 않는다).
 */

/** 이 높이(px)만큼 내려가면 버튼이 나타난다. 화면마다 제각각이던 기준을 하나로 맞춘다. */
export const SCROLL_TOP_THRESHOLD = scaleHeight(120);

interface ScrollTopButtonProps {
	visible: boolean;
	onPress: () => void;
	/** 하단 고정 바가 있는 화면은 그만큼 띄운다. */
	bottom?: number;
}

const ScrollTopButton = ({ visible, onPress, bottom }: ScrollTopButtonProps) => {
	const anim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const animation = Animated.timing(anim, {
			toValue: visible ? 1 : 0,
			duration: 180,
			useNativeDriver: true,
		});
		animation.start();
		return () => animation.stop();
	}, [visible, anim]);

	return (
		<Animated.View
			pointerEvents={visible ? 'auto' : 'none'}
			style={[
				styles.wrapper,
				bottom !== undefined && { bottom },
				{ opacity: anim, transform: [{ scale: anim }] },
			]}>
			<TouchableOpacity
				onPress={onPress}
				style={styles.button}
				hitSlop={HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="맨 위로 이동">
				<IconComponent type="MaterialIcons" name="arrow-upward" size={scaledSize(22)} color={COLORS.textWhite} />
			</TouchableOpacity>
		</Animated.View>
	);
};

export default ScrollTopButton;

const SIZE = scaleWidth(48); // 터치 최소 권장 크기(44) 이상

const styles = themedStyles(() =>
	StyleSheet.create({
		wrapper: {
			position: 'absolute',
			right: SPACING_W.lg,
			bottom: SPACING_H.lg,
			width: SIZE,
			height: SIZE,
			borderRadius: RADIUS.round,
			// 그림자 대신 테두리로 구분한다(앱 전역 규칙).
			borderWidth: 1,
			borderColor: COLORS.border,
			backgroundColor: COLORS.secondary,
			overflow: 'hidden',
		},
		button: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		},
	}),
);
