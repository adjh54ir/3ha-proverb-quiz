import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { Paths } from '@/navigation/conf/Paths';
import IconComponent from './atomic/IconComponent';

const BottomHomeButton = ({
	paddingBottom,
	backgroundColor = '#fff',
	borderColor = '#E2E8F0',
	textColor = '#334155',
	iconColor = '#475569',
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

	const styles = StyleSheet.create({
		wrapper: {
			alignItems: 'center',
			backgroundColor,
			paddingVertical: scaleHeight(10),
		},
		button: {
			borderColor,
			flexDirection: 'row',
			alignItems: 'center',
			gap: scaleWidth(6),
			borderWidth: 1,
			borderRadius: scaleWidth(22),
			paddingVertical: scaleHeight(9),
			paddingHorizontal: scaleWidth(22),
			backgroundColor,
		},
		text: {
			fontSize: scaledSize(12),
			fontWeight: '600',
			color: textColor,
		},
	});

	const goHome = () => {
		setShowConfirm(false);
		navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
	};

	return (
		<View style={[styles.wrapper, paddingBottom !== undefined && { paddingBottom: scaleHeight(paddingBottom) }]}>
			<TouchableOpacity style={styles.button} onPress={() => (skipConfirm ? goHome() : setShowConfirm(true))} activeOpacity={0.85}>
				<IconComponent type="MaterialIcons" name="home" size={14} color={iconColor} />
				<Text style={styles.text}>HOME</Text>
			</TouchableOpacity>

			<Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
				<View style={modalStyles.overlay}>
					<View style={modalStyles.card}>
						<View style={modalStyles.iconCircle}>
							<IconComponent type="materialIcons" name="logout" size={scaledSize(26)} color="#EF4444" />
						</View>
						<Text style={modalStyles.title}>{confirmTitle}</Text>
						<Text style={modalStyles.message}>{confirmMessage}</Text>
						<View style={modalStyles.buttonRow}>
							<TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowConfirm(false)} activeOpacity={0.85}>
								<Text style={modalStyles.cancelText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={modalStyles.confirmBtn} onPress={goHome} activeOpacity={0.85}>
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
		padding: scaleWidth(24),
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(320),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		paddingVertical: scaleHeight(22),
		paddingHorizontal: scaleWidth(20),
		alignItems: 'center',
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.18,
		shadowRadius: 20,
	},
	iconCircle: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(26),
		backgroundColor: '#FEF2F2',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	title: {
		fontSize: scaledSize(17),
		fontWeight: '800',
		color: '#1E293B',
		marginBottom: scaleHeight(6),
		textAlign: 'center',
	},
	message: {
		fontSize: scaledSize(13.5),
		color: '#64748B',
		textAlign: 'center',
		lineHeight: scaleHeight(19),
		marginBottom: scaleHeight(18),
	},
	buttonRow: { flexDirection: 'row', gap: scaleWidth(10), width: '100%' },
	cancelBtn: {
		flex: 1,
		backgroundColor: '#F1F5F9',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(13),
		alignItems: 'center',
	},
	cancelText: { fontSize: scaledSize(14), fontWeight: '800', color: '#64748B' },
	confirmBtn: {
		flex: 1,
		backgroundColor: '#EF4444',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(13),
		alignItems: 'center',
	},
	confirmText: { fontSize: scaledSize(14), fontWeight: '800', color: '#fff' },
});
