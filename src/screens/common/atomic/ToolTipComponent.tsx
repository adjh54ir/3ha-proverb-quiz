import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	StyleSheet,
	UIManager,
	findNodeHandle,
	Dimensions,
} from 'react-native';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';

interface TooltipProps {
	text: string;
	marginLeft?: number;
	marginTop?: number;
}

export const ToolTipComponent: React.FC<TooltipProps> = ({ text, marginLeft = 0, marginTop = 0 }) => {
	const [showTooltip, setShowTooltip] = useState(false);
	const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('left');
	const iconRef = useRef(null);

	const toggleTooltip = () => {
		if (!showTooltip) {
			const nodeHandle = findNodeHandle(iconRef.current);
			if (nodeHandle) {
				UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
					const screenWidth = Dimensions.get('window').width;
					const tooltipWidth = 200;
					const margin = 10;

					if (pageX + tooltipWidth + margin > screenWidth) {
						setTooltipPosition('right');
					} else {
						setTooltipPosition('left');
					}
					setShowTooltip(true);
				});
			}
		} else {
			setShowTooltip(false);
		}
	};

	const closeTooltip = () => {
		setShowTooltip(false);
	};
	const styles = themedStyles(() => StyleSheet.create({
		tooltipContainer: {
			position: 'relative',
			marginTop: marginTop,
			marginBottom: SPACING_H.xs,
			marginLeft: marginLeft,
		},
		tooltip: {
			position: 'absolute',
			top: scaleHeight(28), // 🔽 여기서 툴팁 표시 위치를 아래로 내림 (원래는 '100%')
			backgroundColor: 'rgba(0, 0, 0, 0.85)',
			padding: SPACING_W.sm,
			borderRadius: RADIUS.sm,
			width: scaleWidth(300), // ✅ 고정 너비
			minWidth: scaleWidth(250),
			maxWidth: scaleWidth(300),
			zIndex: 10001, // 툴팁은 위에
		},
		tooltipText: {
			color: COLORS.textWhite,
			fontSize: FONT_SIZES.sm,
			flexWrap: 'wrap',
		},
		tooltipLeft: {
			left: 0,
		},
		tooltipRight: {
			right: 0,
		},
		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: Dimensions.get('window').width,
			height: Dimensions.get('window').height,
			zIndex: 10000, // 툴팁 아래에 깔림
		},
	}));

	return (
		<View style={styles.tooltipContainer}>
			<TouchableOpacity
				ref={iconRef}
				onPress={toggleTooltip}
				activeOpacity={0.8}
				hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
				<FontAwesome6Icon name='circle-question' size={scaledSize(16)} color={COLORS.textSecondary} />
			</TouchableOpacity>

			{showTooltip && (
				<>
					{/* 백그라운드 클릭 시 닫기 */}
					<TouchableWithoutFeedback onPress={closeTooltip}>
						<View style={styles.backdrop} />
					</TouchableWithoutFeedback>

					<View style={[styles.tooltip, tooltipPosition === 'right' ? styles.tooltipRight : styles.tooltipLeft]}>
						<Text style={styles.tooltipText}>{text}</Text>
					</View>
				</>
			)}
		</View>
	);
};
