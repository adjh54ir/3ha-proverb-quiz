import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, ScrollView } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';

interface QuizHintModalProps {
	visible: boolean;
	question: MainDataType.Proverb | null;
	mode?: 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank';
	questionText?: string;
	onClose: () => void;
}

const QuizHintModal: React.FC<QuizHintModalProps> = ({ visible, question, mode, questionText, onClose }) => {
	// ✅ 모달 공통 진입 애니메이션 (fade + scale 0.95 → 1)
	const scaleAnim = useRef(new Animated.Value(0.95)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			scaleAnim.setValue(0.95);
			fadeAnim.setValue(0);
			return;
		}
		scaleAnim.setValue(0.95);
		fadeAnim.setValue(0);

		const anim = Animated.parallel([
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		anim.start();
		// ✅ 언마운트/visible 변경 시 애니메이션 정리 (메모리 누수 방지)
		return () => anim.stop();
	}, [visible, scaleAnim, fadeAnim]);

	// 현재 화면에 출제된 문제 프롬프트를 그대로 보여줘 추론을 돕는다.
	const questionPrompt = !question
		? ''
		: mode === 'meaning'
			? question.proverb
			: mode === 'proverb'
				? question.longMeaning || question.meaning
				: questionText || question.proverb;

	const similar = (question?.sameProverb ?? []).filter((p) => p.trim());
	const examples = Array.isArray(question?.example) ? question!.example.filter((e) => e.trim()) : [];
	const hasAnyHint = similar.length > 0 || examples.length > 0 || !!question?.usageTip;

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.overlay}>
				<Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
					<ModalCloseButton onPress={onClose} />

					{/* 헤더 */}
					<View style={styles.header}>
						<View style={styles.iconCircle}>
							<IconComponent type="MaterialIcons" name="lightbulb" size={scaledSize(26)} color={COLORS.textWhite} />
						</View>
						<Text style={styles.title}>힌트</Text>
						<Text style={styles.subtitle}>이런 단서들을 참고해보세요!</Text>
					</View>

					{/* 컨텐츠 */}
					<ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
						{/* 문제 (추론용) */}
						{!!questionPrompt && (
							<View style={styles.section}>
								<View style={styles.sectionLabelRow}>
									<IconComponent type="materialIcons" name="quiz" size={scaledSize(14)} color={COLORS.warningDark} />
									<Text style={styles.sectionLabel}>문제</Text>
								</View>
								<View style={styles.questionBox}>
									<Text style={styles.questionText}>{questionPrompt}</Text>
								</View>
							</View>
						)}

						{/* 동의속담 */}
						{similar.length > 0 && (
							<View style={styles.section}>
								<View style={styles.sectionLabelRow}>
									<IconComponent type="materialIcons" name="tag" size={scaledSize(14)} color={COLORS.warningDark} />
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
									<IconComponent type="materialIcons" name="emoji-objects" size={scaledSize(15)} color={COLORS.warningDark} />
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
									<IconComponent type="materialIcons" name="format-quote" size={scaledSize(15)} color={COLORS.warningDark} />
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
								<IconComponent type="materialIcons" name="search" size={scaledSize(22)} color={COLORS.borderDark} />
								<Text style={styles.emptyHintText}>이 문제는 제공되는 힌트가 없어요.</Text>
							</View>
						)}
					</ScrollView>

					{/* 하단 버튼 */}
					<TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.8}>
						<IconComponent type="materialIcons" name="check" size={scaledSize(18)} color={COLORS.textWhite} />
						<Text style={styles.primaryButtonText}>확인했어요</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default QuizHintModal;

const styles = StyleSheet.create({
	// ===== 모달 공통 껍데기 =====
	overlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(340),
		maxHeight: '80%',
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
	},
	// ===== 헤더 =====
	header: {
		alignItems: 'center',
		rowGap: SPACING_H.xs,
		marginBottom: SPACING_H.lg,
	},
	iconCircle: {
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(56) / 2,
		backgroundColor: COLORS.warning,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.sm,
	},
	title: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	subtitle: {
		fontSize: FONT_SIZES.md,
		fontWeight: '500',
		color: COLORS.textSecondary,
	},
	// ===== 컨텐츠 =====
	scrollView: {
		flexGrow: 0,
		flexShrink: 1,
	},
	content: {
		rowGap: SPACING_H.xl,
		paddingBottom: SPACING_H.xs,
	},
	section: {
		rowGap: SPACING_H.sm,
	},
	sectionLabelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.xs,
	},
	sectionLabel: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '600',
		color: COLORS.textSecondary,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
	},
	tagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		columnGap: SPACING_W.sm,
		rowGap: SPACING_H.sm,
	},
	tag: {
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		backgroundColor: COLORS.warningBg,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.warningBorder,
	},
	tagText: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '600',
		color: COLORS.warningDark,
	},
	exampleBox: {
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		rowGap: SPACING_H.xs,
	},
	questionBox: {
		backgroundColor: COLORS.warningBg,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.warningBorder,
	},
	questionText: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '600',
		color: COLORS.textStrong,
		lineHeight: scaledSize(23),
	},
	exampleText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(22),
		fontStyle: 'italic',
	},
	emptyHint: {
		alignItems: 'center',
		paddingVertical: SPACING_H.xl,
		rowGap: SPACING_H.sm,
	},
	emptyHintText: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textLight,
	},
	// ===== 하단 버튼 =====
	primaryButton: {
		flexDirection: 'row',
		columnGap: SPACING_W.xs,
		height: scaleHeight(48),
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: SPACING_H.xl,
	},
	primaryButtonText: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textWhite,
	},
});
