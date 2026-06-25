import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, ScrollView } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';

interface QuizHintModalProps {
	visible: boolean;
	question: MainDataType.Proverb | null;
	onClose: () => void;
}

const QuizHintModal: React.FC<QuizHintModalProps> = ({ visible, question, onClose }) => {
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			scaleAnim.setValue(0.92);
			fadeAnim.setValue(0);

			Animated.parallel([
				Animated.spring(scaleAnim, {
					toValue: 1,
					useNativeDriver: true,
					tension: 60,
					friction: 8,
				}),
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();
		}
		// ✅ 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
		return () => {
			scaleAnim.stopAnimation();
			fadeAnim.stopAnimation();
		};
	}, [visible]);

	const similar = (question?.sameProverb ?? []).filter((p) => p.trim());
	const examples = Array.isArray(question?.example) ? question!.example.filter((e) => e.trim()) : [];
	const hasAnyHint = similar.length > 0 || examples.length > 0 || !!question?.usageTip;

	return (
		<Modal visible={visible} transparent animationType="none">
			<Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
				<Animated.View style={[styles.modal, { transform: [{ scale: scaleAnim }] }]}>
					<ModalCloseButton onPress={onClose} />
					{/* 헤더 */}
					<View style={styles.header}>
						<View style={styles.iconGlow}>
							<View style={styles.iconCircle}>
								<IconComponent type="MaterialIcons" name="lightbulb" size={scaledSize(26)} color="#fff" />
							</View>
						</View>
						<Text style={styles.title}>힌트</Text>
						<Text style={styles.subtitle}>이런 단서들을 참고해보세요!</Text>
					</View>

					{/* 컨텐츠 */}
					<ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
						{/* 동의속담 */}
						{similar.length > 0 && (
							<View style={styles.section}>
								<View style={styles.sectionLabelRow}>
									<IconComponent type="materialIcons" name="tag" size={scaledSize(14)} color="#D97706" />
									<Text style={styles.sectionLabel}>동의속담</Text>
								</View>
								<View style={styles.tagRow}>
									{similar.map((word, index) => (
										<View key={index} style={styles.tag}>
											<Text style={styles.tagText}>{word}</Text>
										</View>
									))}
								</View>
							</View>
						)}

						{/* 활용 팁 */}
						{!!question?.usageTip && (
							<View style={styles.section}>
								<View style={styles.sectionLabelRow}>
									<IconComponent type="materialIcons" name="emoji-objects" size={scaledSize(15)} color="#D97706" />
									<Text style={styles.sectionLabel}>활용 팁</Text>
								</View>
								<View style={styles.exampleBox}>
									<Text style={styles.exampleText}>{question.usageTip}</Text>
								</View>
							</View>
						)}

						{/* 예시 */}
						{examples.length > 0 && (
							<View style={styles.section}>
								<View style={styles.sectionLabelRow}>
									<IconComponent type="materialIcons" name="format-quote" size={scaledSize(15)} color="#D97706" />
									<Text style={styles.sectionLabel}>사용 예시</Text>
								</View>
								<View style={styles.exampleBox}>
									{examples.map((ex, index) => (
										<Text key={index} style={styles.exampleText}>
											· {ex}
										</Text>
									))}
								</View>
							</View>
						)}

						{!hasAnyHint && (
							<View style={styles.emptyHint}>
								<IconComponent type="materialIcons" name="search" size={scaledSize(22)} color="#CBD5E1" />
								<Text style={styles.emptyHintText}>이 문제는 제공되는 힌트가 없어요.</Text>
							</View>
						)}
					</ScrollView>

					{/* 버튼 */}
					<View style={styles.footer}>
						<TouchableOpacity style={styles.confirmButton} onPress={onClose} activeOpacity={0.85}>
							<IconComponent type="materialIcons" name="check" size={scaledSize(18)} color="#fff" />
							<Text style={styles.confirmButtonText}>확인했어요</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>
			</Animated.View>
		</Modal>
	);
};

export default QuizHintModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modal: {
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		width: '88%',
		maxHeight: '80%',
		overflow: 'hidden',
	},
	header: {
		alignItems: 'center',
		gap: scaleHeight(6),
		paddingHorizontal: scaleWidth(24),
		paddingTop: scaleHeight(26),
		paddingBottom: scaleHeight(18),
		backgroundColor: '#FFFBEB',
		borderBottomWidth: 1,
		borderBottomColor: '#FDE68A',
	},
	iconGlow: {
		width: scaleWidth(64),
		height: scaleWidth(64),
		borderRadius: scaleWidth(32),
		backgroundColor: '#FEF3C7',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(4),
	},
	iconCircle: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: scaleWidth(24),
		backgroundColor: '#F59E0B',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#F59E0B',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 4,
	},
	title: {
		fontSize: scaledSize(19),
		fontWeight: '800',
		color: '#92400E',
	},
	subtitle: {
		fontSize: scaledSize(12.5),
		fontWeight: '500',
		color: '#B45309',
	},
	sectionLabelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(5),
	},
	emptyHint: {
		alignItems: 'center',
		paddingVertical: scaleHeight(20),
		gap: scaleHeight(8),
	},
	emptyHintText: {
		fontSize: scaledSize(13),
		color: '#94A3B8',
	},
	scrollView: {
		flexGrow: 0,
	},
	content: {
		padding: scaleWidth(24),
		gap: scaleHeight(22),
	},
	section: {
		gap: scaleHeight(10),
	},
	sectionLabel: {
		fontSize: scaledSize(11),
		fontWeight: '600',
		color: '#94A3B8',
		letterSpacing: 0.8,
		textTransform: 'uppercase',
	},
	tagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: scaleWidth(7),
	},
	tag: {
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(6),
		backgroundColor: '#FEF3C7',
		borderRadius: scaleWidth(30),
		borderWidth: 1,
		borderColor: '#FDE68A',
	},
	tagText: {
		fontSize: scaledSize(13),
		fontWeight: '600',
		color: '#92400E',
	},
	exampleBox: {
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(10),
		paddingHorizontal: scaleWidth(16),
		paddingVertical: scaleHeight(14),
		borderWidth: 0.5,
		borderColor: 'rgba(0,0,0,0.08)',
		gap: scaleHeight(6),
	},
	exampleText: {
		fontSize: scaledSize(14),
		color: '#334155',
		lineHeight: scaleHeight(22),
		fontStyle: 'italic',
	},
	footer: {
		paddingHorizontal: scaleWidth(24),
		paddingVertical: scaleHeight(16),
		borderTopWidth: 0.5,
		borderTopColor: 'rgba(0,0,0,0.08)',
	},
	confirmButton: {
		flexDirection: 'row',
		gap: scaleWidth(6),
		backgroundColor: '#F59E0B',
		borderRadius: scaleWidth(12),
		paddingVertical: scaleHeight(14),
		alignItems: 'center',
		justifyContent: 'center',
	},
	confirmButtonText: {
		fontSize: scaledSize(15),
		fontWeight: '700',
		color: '#fff',
	},
});
