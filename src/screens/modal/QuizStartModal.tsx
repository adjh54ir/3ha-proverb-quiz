import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';

export type QuizStartMode = 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank' | 'arrange';

interface Props {
	visible: boolean;
	mode?: QuizStartMode;
	isPracticeMode?: boolean;
	timeLimit?: number; // 문제당 제한시간(초)
	scorePerCorrect?: number; // 정답 점수
	showHint?: boolean; // 힌트 안내 표시 여부
	onStart: () => void;
	onBack: () => void;
}

const MODE_META: Record<QuizStartMode, { title: string; desc: string; icon: string }> = {
	meaning: { title: '뜻 맞추기', desc: '속담을 보고 올바른 뜻을 골라보세요.', icon: 'lightbulb' },
	proverb: { title: '속담 찾기', desc: '뜻을 보고 알맞은 속담을 골라보세요.', icon: 'search' },
	blank: { title: '빈 칸 채우기', desc: '속담의 빠진 부분을 채워보세요.', icon: 'edit' },
	example: { title: '예문 속담', desc: '예문을 보고 어울리는 속담을 골라보세요.', icon: 'subject' },
	exampleBlank: { title: '예문 빈칸', desc: '예문 속 빈칸에 들어갈 속담을 골라보세요.', icon: 'edit-note' },
	arrange: { title: '단어 조각 배열', desc: '섞인 단어를 순서대로 배열해 속담을 완성하세요.', icon: 'extension' },
};

/**
 * 퀴즈 시작 안내 공통 팝업
 * - 모든 퀴즈 모드에서 동일한 디자인으로 시작 전 안내를 표시합니다.
 */
const QuizStartModal = ({
	visible,
	mode = 'meaning',
	isPracticeMode = false,
	timeLimit = 30,
	scorePerCorrect = 10,
	showHint = true,
	onStart,
	onBack,
}: Props) => {
	// ✅ 모달 공통 진입 애니메이션 (fade + scale 0.95 → 1)
	const scaleAnim = useRef(new Animated.Value(0.95)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;
	const meta = MODE_META[mode] ?? MODE_META.meaning;

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			scaleAnim.setValue(0.95);
			opacityAnim.setValue(0);
			return;
		}
		scaleAnim.setValue(0.95);
		opacityAnim.setValue(0);
		const anim = Animated.parallel([
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, [visible, scaleAnim, opacityAnim]);

	if (!visible) {
		return null;
	}

	const infoRows: { icon: string; text: string }[] = [
		{ icon: 'check-box', text: '보기 4개 중 하나를 고르는 방식이에요.' },
		{ icon: 'timer', text: `각 문제는 ${timeLimit}초 안에 풀어야 해요.` },
		{ icon: 'star', text: `정답을 맞히면 ${scorePerCorrect}점을 얻어요.` },
		{ icon: 'sentiment-satisfied-alt', text: '틀려도 점수가 깎이지 않아요.' },
	];
	if (mode === 'arrange') {
		infoRows[0] = { icon: 'touch-app', text: '단어 조각을 순서대로 탭해서 완성해요.' };
	}
	if (showHint) {
		infoRows.push({ icon: 'lightbulb', text: '힌트 버튼으로 단서를 확인할 수 있어요.' });
	}

	return (
		<Modal visible transparent animationType="fade">
			<View style={styles.overlay}>
				<Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
					<View style={[styles.iconCircle, isPracticeMode && { backgroundColor: COLORS.warningBg }]}>
						<IconComponent
							type="materialIcons"
							name={meta.icon}
							size={scaledSize(30)}
							color={isPracticeMode ? COLORS.warning : COLORS.primary}
						/>
					</View>

					<Text style={styles.title}>{meta.title}</Text>
					<Text style={styles.desc}>{meta.desc}</Text>

					{isPracticeMode && (
						<View style={styles.practiceBanner}>
							<IconComponent type="materialIcons" name="info" size={scaledSize(14)} color={COLORS.warningDark} />
							<Text style={styles.practiceText}>연습 모드 · 점수와 뱃지가 기록되지 않아요.</Text>
						</View>
					)}

					<View style={styles.infoBox}>
						{infoRows.map((row, i) => (
							<View key={i} style={[styles.infoRow, i === infoRows.length - 1 && { marginBottom: 0 }]}>
								<View style={styles.infoIconChip}>
									<IconComponent type="materialIcons" name={row.icon} size={scaledSize(15)} color={COLORS.primary} />
								</View>
								<Text style={styles.infoText}>{row.text}</Text>
							</View>
						))}
					</View>

					<View style={styles.buttonRow}>
						<TouchableOpacity style={styles.secondaryButton} onPress={onBack} activeOpacity={0.8}>
							<Text style={styles.secondaryButtonText}>돌아가기</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.primaryButton} onPress={onStart} activeOpacity={0.8}>
							<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(18)} color={COLORS.textWhite} />
							<Text style={styles.primaryButtonText}>시작하기</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default QuizStartModal;

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
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
	},
	// ===== 헤더 =====
	iconCircle: {
		width: scaleWidth(60),
		height: scaleWidth(60),
		borderRadius: scaleWidth(60) / 2,
		backgroundColor: COLORS.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	title: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.sm,
		textAlign: 'center',
	},
	desc: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		textAlign: 'center',
		lineHeight: scaledSize(20),
		marginBottom: SPACING_H.lg,
	},
	practiceBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		backgroundColor: COLORS.warningBg,
		borderRadius: RADIUS.sm,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.md,
	},
	practiceText: { fontSize: FONT_SIZES.sm, color: COLORS.warningDark, fontWeight: '600', flexShrink: 1 },
	// ===== 안내 박스 =====
	infoBox: {
		width: '100%',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.xl,
	},
	infoRow: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm, marginBottom: SPACING_H.md },
	infoIconChip: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: RADIUS.sm,
		backgroundColor: COLORS.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
	},
	infoText: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: scaledSize(18) },
	// ===== 하단 버튼 =====
	buttonRow: { flexDirection: 'row', columnGap: SPACING_W.md, width: '100%' },
	secondaryButton: {
		flex: 1,
		height: scaleHeight(48),
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	secondaryButtonText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textSecondary },
	primaryButton: {
		flex: 1,
		flexDirection: 'row',
		columnGap: SPACING_W.xs,
		height: scaleHeight(48),
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	primaryButtonText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textWhite },
});
