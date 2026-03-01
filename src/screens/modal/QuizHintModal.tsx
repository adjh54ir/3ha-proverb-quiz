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
		'세상 이치': '#f6a623',
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
					{/* 헤더 */}
					<View style={styles.header}>
						<View style={styles.headerIconWrap}>
							<IconComponent type="MaterialIcons" name="lightbulb" size={22} color="#f39c12" />
						</View>
						<Text style={styles.title}>힌트</Text>
					</View>

					<View style={styles.divider} />

					{/* 카테고리 */}
					{question?.category && (
						<View style={styles.categoryRow}>
							<Text style={styles.categoryLabel}>카테고리</Text>
							<View style={[styles.categoryBadge, { backgroundColor: getFieldColor(question.category) }]}>
								{getFieldIcon(question.category)}
								<Text style={styles.categoryText}>{question.category}</Text>
							</View>
						</View>
					)}

					{question?.sameProverb && question.sameProverb.filter((sp) => sp?.trim() !== '').length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<View style={[styles.sectionIconWrap, { backgroundColor: '#e8f4fd' }]}>
									<IconComponent type="FontAwesome6" name="link" size={12} color="#3498db" />
								</View>
								<Text style={styles.sectionTitle}>💬 동의 속담</Text>
							</View>
							{question.sameProverb
								.filter((sp) => sp?.trim() !== '')
								.map((sp, idx) => (
									<View key={idx} style={styles.itemRow}>
										<View style={styles.itemDot} />
										<Text style={styles.sectionItem}>{sp}</Text>
									</View>
								))}
						</View>
					)}

					{/* 예시 문장 */}
					{question?.example && question.example.length > 0 && (
						<View style={[styles.section, styles.exampleSection]}>
							<View style={styles.sectionHeader}>
								<View style={[styles.sectionIconWrap, { backgroundColor: '#fef9e7' }]}>
									<IconComponent type="FontAwesome6" name="pen" size={12} color="#f39c12" />
								</View>
								<Text style={[styles.sectionTitle, { color: '#e67e22' }]}>속담 예시</Text>
							</View>
							{question.example.map((ex, idx) => (
								<View key={idx} style={styles.itemRow}>
									<View style={[styles.itemDot, { backgroundColor: '#f39c12' }]} />
									<Text style={styles.sectionItem}>{ex}</Text>
								</View>
							))}
						</View>
					)}

					{/* 확인 버튼 */}
					<TouchableOpacity style={styles.confirmBtn} onPress={onClose} activeOpacity={0.85}>
						<Text style={styles.confirmText}>확인했어요</Text>
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
		backgroundColor: 'rgba(15, 20, 40, 0.55)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(22),
		paddingTop: scaleHeight(22),
		paddingBottom: scaleHeight(24),
		borderRadius: scaleWidth(22),
		alignItems: 'center',
		width: '88%',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: scaleHeight(8) },
		shadowOpacity: 0.18,
		shadowRadius: scaleWidth(20),
		elevation: 10,
	},

	/* 헤더 */
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(14),
	},
	headerIconWrap: {
		width: scaleWidth(36),
		height: scaleWidth(36),
		borderRadius: scaleWidth(18),
		backgroundColor: '#fef3c7',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(10),
	},
	title: {
		fontSize: scaledSize(20),
		fontWeight: '700',
		color: '#1a1a2e',
		letterSpacing: -0.3,
	},
	divider: {
		width: '100%',
		height: 1,
		backgroundColor: '#f0f0f5',
		marginBottom: scaleHeight(16),
	},

	/* 카테고리 */
	categoryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		marginBottom: scaleHeight(14),
		gap: scaleWidth(8),
	},
	categoryLabel: {
		fontSize: scaledSize(13),
		color: '#8e8e9a',
		fontWeight: '500',
	},
	categoryBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(20),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(5),
	},
	categoryText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: scaledSize(12),
		marginLeft: scaleWidth(5),
	},

	/* 섹션 공통 */
	section: {
		backgroundColor: '#f0f7ff',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(14),
		marginBottom: scaleHeight(12),
		borderWidth: 1,
		borderColor: '#daeeff',
		width: '100%',
	},
	exampleSection: {
		backgroundColor: '#fffbf0',
		borderColor: '#fde9b0',
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(10),
	},
	sectionIconWrap: {
		width: scaleWidth(26),
		height: scaleWidth(26),
		borderRadius: scaleWidth(8),
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(8),
	},
	sectionTitle: {
		fontSize: scaledSize(13),
		fontWeight: '700',
		color: '#3498db',
		letterSpacing: 0.2,
	},
	itemRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: scaleHeight(5),
	},
	itemDot: {
		width: scaleWidth(5),
		height: scaleWidth(5),
		borderRadius: scaleWidth(3),
		backgroundColor: '#3498db',
		marginTop: scaleHeight(7),
		marginRight: scaleWidth(8),
		flexShrink: 0,
	},
	sectionItem: {
		fontSize: scaledSize(14),
		color: '#2c3e50',
		lineHeight: scaleHeight(21),
		flex: 1,
		fontWeight: '500',
	},

	/* 버튼 */
	confirmBtn: {
		marginTop: scaleHeight(6),
		backgroundColor: '#f39c12',
		paddingVertical: scaleHeight(14),
		borderRadius: scaleWidth(14),
		width: '100%',
		alignItems: 'center',
		shadowColor: '#f39c12',
		shadowOffset: { width: 0, height: scaleHeight(4) },
		shadowOpacity: 0.35,
		shadowRadius: scaleWidth(8),
		elevation: 5,
	},
	confirmText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '700',
		letterSpacing: 0.3,
	},
});
