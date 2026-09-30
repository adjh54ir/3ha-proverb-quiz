/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { scaledSize } from '@/utils';
import IconComponent from './IconComponent';
import { HIT_SLOP, COLORS, SPACING_H, SPACING_W } from '@/const/common/Theme';

/**
 * 모달 공통 닫기(X) 버튼 — 모든 콘텐츠 모달의 닫기 위치/아이콘/색을 통일합니다.
 * - 위치: 카드(컨테이너) 우상단 고정
 * - 컨테이너에 position:relative 또는 overflow 설정이 있으면 그 기준으로 배치됩니다.
 */
interface ModalCloseButtonProps {
	onPress: () => void;
	/** 컬러 헤더 밴드 위에 올릴 때 흰색 등으로 변경 */
	color?: string;
	style?: StyleProp<ViewStyle>;
}

const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({ onPress, color = COLORS.textSecondary, style }) => {
	return (
		<TouchableOpacity
			style={[styles.btn, style]}
			onPress={onPress}
			activeOpacity={0.7}
			hitSlop={HIT_SLOP}>
			<IconComponent type="materialIcons" name="close" size={scaledSize(22)} color={color} />
		</TouchableOpacity>
	);
};

export default ModalCloseButton;

const styles = StyleSheet.create({
	btn: {
		position: 'absolute',
		// 카드 paddingTop(xl) + heading 타이틀 첫 줄의 세로 중앙에 X 중앙이 오도록 lg.
		// (12 일 때는 X 가 타이틀보다 7px 가량 위로 떠 보였다)
		top: SPACING_H.lg,
		right: SPACING_W.md,
		zIndex: 20,
		paddingHorizontal: SPACING_W.xs,
		paddingVertical: SPACING_H.xs,
	},
});
