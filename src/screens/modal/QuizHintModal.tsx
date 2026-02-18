import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';

interface Props {
	visible: boolean;
	question: MainDataType.Proverb | null;
	onClose: () => void;
}

const getFieldColor = (field: string) => {
	const map: Record<string, string> = {
		'운/우연': '#00cec9',
		인간관계: '#6c5ce7',
		'세상 이치': '#fdcb6e',
		'근면/검소': '#e17055',
		'노력/성공': '#00b894',
		'경계/조심': '#d63031',
		'욕심/탐욕': '#e84393',
		'배신/불신': '#2d3436',
	};
	return map[field] || '#b2bec3';
};

const getFieldIcon = (field: string) => {
	switch (field) {
		case '운/우연':
			return <IconComponent type="FontAwesome6" name="dice" size={12} color="#fff" />;
		case '인간관계':
			return <IconComponent type="FontAwesome6" name="users" size={12} color="#fff" />;
		case '세상 이치':
			return <IconComponent type="fontawesome5" name="globe" size={12} color="#fff" />;
		case '근면/검소':
			return <IconComponent type="fontawesome5" name="hammer" size={12} color="#fff" />;
		case '노력/성공':
			return <IconComponent type="fontawesome5" name="medal" size={12} color="#fff" />;
		case '경계/조심':
			return <IconComponent type="fontawesome5" name="exclamation-triangle" size={12} color="#fff" />;
		case '욕심/탐욕':
			return <IconComponent type="fontawesome5" name="hand-holding-usd" size={12} color="#fff" />;
		case '배신/불신':
			return <IconComponent type="fontawesome5" name="user-slash" size={12} color="#fff" />;
		default:
			return <IconComponent type="FontAwesome6" name="tag" size={12} color="#fff" />;
	}
};

const QuizHintModal: React.FC<Props> = ({ visible, question, onClose }) => {
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.overlay}>
				<View style={styles.modal}>
					<Text style={styles.title}>🧭 힌트</Text>

					{/* 카테고리 */}
					{question?.category && (
						<View style={[styles.categoryBadge, { backgroundColor: getFieldColor(question.category) }]}>
							{getFieldIcon(question.category)}
							<Text style={styles.categoryText}>{question.category}</Text>
						</View>
					)}

					{/* 비슷한 속담 */}
					{question?.sameProverb && question.sameProverb.filter((sp) => sp?.trim() !== '').length > 0 && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>🔗 비슷한 속담</Text>
							{question.sameProverb
								.filter((sp) => sp?.trim() !== '')
								.map((sp, idx) => (
									<Text key={idx} style={styles.sectionItem}>
										- {sp}
									</Text>
								))}
						</View>
					)}

					{/* 예시 문장 */}
					{question?.example && question.example.length > 0 && (
						<View style={[styles.section, { backgroundColor: '#f9f9f9', borderColor: '#eee' }]}>
							<Text style={[styles.sectionTitle, { color: '#2c3e50' }]}>💡 속담 예시</Text>
							{question.example.map((ex, idx) => (
								<Text key={idx} style={styles.sectionItem}>
									- {ex}
								</Text>
							))}
						</View>
					)}

					<TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
						<Text style={styles.confirmText}>확인</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};

export default QuizHintModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modal: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		alignItems: 'center',
		width: '80%',
	},
	title: {
		fontSize: scaledSize(22),
		fontWeight: 'bold',
		color: '#f39c12',
		marginBottom: scaleHeight(6),
	},
	categoryBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(8),
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(4),
		marginTop: scaleHeight(10),
		marginBottom: scaleHeight(12),
	},
	categoryText: {
		color: '#fff',
		fontWeight: 'bold',
		marginLeft: scaleWidth(6),
	},
	section: {
		backgroundColor: '#eef6ff',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#d6e4ff',
		width: '100%',
	},
	sectionTitle: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#2980b9',
		marginBottom: scaleHeight(8),
		textAlign: 'center',
	},
	sectionItem: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
		lineHeight: scaleHeight(20),
		marginBottom: scaleHeight(4),
	},
	confirmBtn: {
		backgroundColor: '#2980b9',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(36),
		borderRadius: scaleWidth(30),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(2) },
		shadowOpacity: 0.2,
		shadowRadius: scaleWidth(4),
	},
	confirmText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
});
