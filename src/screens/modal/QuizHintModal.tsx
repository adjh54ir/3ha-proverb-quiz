import React, {  } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';
import ModalCloseButton from '../common/atomic/ModalCloseButton';
import { useModalEnter } from '@/hooks/useModalEnter';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';

interface QuizHintModalProps {
	visible: boolean;
	question: MainDataType.Proverb | null;
	mode?: 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank';
	questionText?: string;
	onClose: () => void;
}

const QuizHintModal: React.FC<QuizHintModalProps> = ({ visible, question, mode, questionText, onClose }) => {
	// AppModal 이 시스템 바까지 덮으므로 오버레이가 직접 안전 여백을 준다.
	const safePadding = useModalSafePadding();
	// 모달 공통 진입 애니메이션 (fade + scale)
	const enterStyle = useModalEnter(visible);


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
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={[styles.overlay, safePadding]}>
				<Animated.View style={[styles.card, enterStyle]}>
					<ModalCloseButton onPress={onClose} />

					{/* 헤더 */}
					<View style={styles.header}>
						<FastImage
							source={require('@/assets/images/screen-heroes/quiz-hint.png')}
							style={styles.hintImage}
							resizeMode={FastImage.resizeMode.contain}
						/>
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
								<Text style={styles.emptyHintText}>이 문제는 제공되는 힌트가 없습니다.</Text>
							</View>
						)}
					</ScrollView>

					{/* 하단 버튼 */}
					<TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.8}>
						<IconComponent type="materialIcons" name="check" size={scaledSize(18)} color={COLORS.textWhite} />
						<Text style={styles.primaryButtonText}>확인했습니다</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default QuizHintModal;

const styles = themedStyles(() => StyleSheet.create({
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
	hintImage: {
		width: scaleWidth(132),
		height: scaleHeight(92),
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
}));
