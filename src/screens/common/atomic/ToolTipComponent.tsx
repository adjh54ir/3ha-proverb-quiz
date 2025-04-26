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
	const styles = StyleSheet.create({
		tooltipContainer: {
			position: 'relative',
			marginTop: marginTop,
			marginBottom: 5,
			marginLeft: marginLeft,
		},
		tooltip: {
			position: 'absolute',
			top: '100%',
			backgroundColor: 'rgba(0, 0, 0, 0.85)',
			padding: 8,
			borderRadius: 6,
			minWidth: 250,
			maxWidth: 300,
			zIndex: 10001, // 툴팁은 위에
		},
		tooltipText: {
			color: '#fff',
			fontSize: 12,
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
	});

	return (
		<View style={styles.tooltipContainer}>
			<TouchableOpacity ref={iconRef} onPress={toggleTooltip}>
				<FontAwesome6Icon name='circle-question' size={16} color='#666' />
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
