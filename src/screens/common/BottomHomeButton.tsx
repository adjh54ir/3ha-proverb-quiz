import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
import { Paths } from '@/navigation/conf/Paths';
import IconComponent from './atomic/IconComponent';

/** 터치 영역 최소 44 확보 */
const MIN_TOUCH = 44;

const BottomHomeButton = ({
	paddingBottom,
	backgroundColor = COLORS.surface,
	borderColor = COLORS.border,
	textColor = COLORS.text,
	iconColor = COLORS.textMuted,
	confirmTitle = '퀴즈를 종료할까요?',
	confirmMessage = '진행 중인 내용은 저장되지 않아요.',
	skipConfirm = false,
}: {
	paddingBottom?: number;
	backgroundColor?: string;
	borderColor?: string;
	textColor?: string;
	iconColor?: string;
	confirmTitle?: string;
	confirmMessage?: string;
	skipConfirm?: boolean; // ✅ true면 확인 팝업 없이 바로 홈으로 이동
}) => {
	const navigation = useNavigation<any>();
	const [showConfirm, setShowConfirm] = useState(false);

	// 색상 prop 이 바뀔 때만 재생성 (매 렌더 StyleSheet.create 방지)
	const styles = useMemo(
		() =>
			StyleSheet.create({
				wrapper: {
					alignItems: 'center',
					backgroundColor,
					paddingHorizontal: SPACING_W.lg,
					paddingTop: SPACING_H.md,
					// 부모 화면들이 SafeAreaView edges={['bottom']} 로 safe-area 를 이미 소비하므로
					// 여기서 inset 을 다시 더하지 않고, 하단에 최소 여백만 확보한다.
					paddingBottom: SPACING_H.md,
				},
				button: {
					borderColor,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					gap: SPACING_W.sm,
					borderWidth: 1,
					borderRadius: RADIUS.round,
					minHeight: scaleHeight(MIN_TOUCH),
					minWidth: scaleWidth(120),
					paddingVertical: SPACING_H.sm,
					paddingHorizontal: SPACING_W.xxl,
					backgroundColor,
				},
				text: {
					fontSize: FONT_SIZES.sm,
					fontWeight: '600',
					color: textColor,
				},
			}),
		[backgroundColor, borderColor, textColor],
	);

	const goHome = () => {
		setShowConfirm(false);
		navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
	};

	return (
		<View style={[styles.wrapper, paddingBottom !== undefined && { paddingBottom: scaleHeight(paddingBottom) }]}>
			<TouchableOpacity
				style={styles.button}
				onPress={() => (skipConfirm ? goHome() : setShowConfirm(true))}
				activeOpacity={0.8}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
				<IconComponent type="MaterialIcons" name="home" size={scaledSize(16)} color={iconColor} />
				<Text style={styles.text}>HOME</Text>
			</TouchableOpacity>

			<Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
				<View style={modalStyles.overlay}>
					<View style={modalStyles.card}>
						<View style={modalStyles.iconCircle}>
							<IconComponent type="materialIcons" name="logout" size={scaledSize(26)} color={COLORS.danger} />
						</View>
						<Text style={modalStyles.title}>{confirmTitle}</Text>
						<Text style={modalStyles.message}>{confirmMessage}</Text>
						<View style={modalStyles.buttonRow}>
							<TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowConfirm(false)} activeOpacity={0.8}>
								<Text style={modalStyles.cancelText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={modalStyles.confirmBtn} onPress={goHome} activeOpacity={0.8}>
								<Text style={modalStyles.confirmText}>나가기</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
};

export default BottomHomeButton;

const modalStyles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(15,23,42,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.xxl,
		paddingVertical: SPACING_H.xxl,
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(320),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingVertical: SPACING_H.xl,
		paddingHorizontal: SPACING_W.xl,
		alignItems: 'center',
	},
	iconCircle: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(52) / 2,
		backgroundColor: COLORS.dangerBg,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	title: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.xs,
		textAlign: 'center',
	},
	message: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		textAlign: 'center',
		lineHeight: scaledSize(20),
		marginBottom: SPACING_H.xl,
	},
	buttonRow: { flexDirection: 'row', gap: SPACING_W.md, width: '100%' },
	cancelBtn: {
		flex: 1,
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		minHeight: scaleHeight(MIN_TOUCH),
		paddingVertical: SPACING_H.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textSecondary },
	confirmBtn: {
		flex: 1,
		backgroundColor: COLORS.danger,
		borderRadius: RADIUS.md,
		minHeight: scaleHeight(MIN_TOUCH),
		paddingVertical: SPACING_H.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	confirmText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textWhite },
});
