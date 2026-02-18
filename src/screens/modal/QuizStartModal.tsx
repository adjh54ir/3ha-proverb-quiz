import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scaleWidth, scaleHeight, scaledSize } from '@/utils/DementionUtils';

interface StartModalProps {
	visible: boolean;
	onStart: () => void;
	onBack: () => void;
}

const StartModal: React.FC<StartModalProps> = ({ visible, onStart, onBack }) => {
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<View style={styles.startModal}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.emoji}>🧠</Text>
						<Text style={styles.startTitle}>속담 퀴즈</Text>
						<Text style={styles.subtitle}>얼마나 알고 있나요?</Text>
					</View>

					{/* Divider */}
					<View style={styles.divider} />

					{/* Info Cards */}
					<View style={styles.infoContainer}>
						<View style={styles.infoCard}>
							<Text style={styles.infoIcon}>🧩</Text>
							<Text style={styles.infoText}>4지선다 객관식</Text>
						</View>
						<View style={styles.infoCard}>
							<Text style={styles.infoIcon}>⏱️</Text>
							<Text style={styles.infoText}>문제당 40초</Text>
						</View>
						<View style={styles.infoCard}>
							<Text style={styles.infoIcon}>🎯</Text>
							<Text style={styles.infoText}>정답 시 +10점</Text>
						</View>
						<View style={styles.infoCard}>
							<Text style={styles.infoIcon}>💡</Text>
							<Text style={styles.infoText}>힌트 제공</Text>
						</View>
					</View>

					{/* Description */}
					<View style={styles.descBox}>
						<Text style={styles.descText}>
							🎲 선택한 모드에 따라 다양한 문제가 출제돼요!{'\n'}
							🙆 틀려도 점수는 깎이지 않으니 걱정 마세요 :)
						</Text>
					</View>

					{/* Buttons */}
					<View style={styles.modalButtonRow}>
						<TouchableOpacity style={styles.modalBackButton} onPress={onBack}>
							<Text style={styles.backButtonText}>돌아가기</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.modalStartButton} onPress={onStart}>
							<Text style={styles.startButtonText}>시작하기 🚀</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	startModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(24),
		paddingVertical: scaleHeight(28),
		borderRadius: scaleWidth(24),
		width: '88%',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 16,
		elevation: 10,
	},
	header: {
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	emoji: {
		fontSize: scaledSize(44),
		marginBottom: scaleHeight(6),
	},
	startTitle: {
		fontSize: scaledSize(24),
		fontWeight: 'bold',
		color: '#1a1a2e',
		letterSpacing: 1,
	},
	subtitle: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginTop: scaleHeight(4),
	},
	divider: {
		width: '100%',
		height: 1,
		backgroundColor: '#ecf0f1',
		marginBottom: scaleHeight(16),
	},
	infoContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: scaleHeight(14),
		gap: scaleWidth(8),
	},
	infoCard: {
		width: '47%',
		backgroundColor: '#f0f4ff',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(10),
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
	},
	infoIcon: {
		fontSize: scaledSize(18),
	},
	infoText: {
		fontSize: scaledSize(12),
		color: '#2c3e50',
		fontWeight: '600',
	},
	descBox: {
		backgroundColor: '#fffbf0',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(14),
		width: '100%',
		marginBottom: scaleHeight(20),
		borderLeftWidth: 3,
		borderLeftColor: '#f39c12',
	},
	descText: {
		fontSize: scaledSize(12),
		color: '#555',
		lineHeight: scaleHeight(20),
	},
	modalButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		gap: scaleWidth(10),
	},
	modalBackButton: {
		flex: 1,
		backgroundColor: '#f0f0f0',
		paddingVertical: scaleHeight(13),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
	},
	modalStartButton: {
		flex: 2,
		backgroundColor: '#4f46e5',
		paddingVertical: scaleHeight(13),
		borderRadius: scaleWidth(12),
		alignItems: 'center',
		shadowColor: '#4f46e5',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 8,
		elevation: 6,
	},
	backButtonText: {
		color: '#777',
		fontWeight: '600',
		fontSize: scaledSize(14),
	},
	startButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: scaledSize(15),
	},
});

export default StartModal;
