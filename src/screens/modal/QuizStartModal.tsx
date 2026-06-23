import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
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
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;
	const meta = MODE_META[mode] ?? MODE_META.meaning;

	useEffect(() => {
		if (!visible) {
			return;
		}
		scaleAnim.setValue(0.9);
		opacityAnim.setValue(0);
		Animated.parallel([
			Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
			Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
		]).start();
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
					<View style={[styles.iconCircle, isPracticeMode && { backgroundColor: '#FFEDD5' }]}>
						<IconComponent type="materialIcons" name={meta.icon} size={scaledSize(30)} color={isPracticeMode ? '#F97316' : '#3B82F6'} />
					</View>

					<Text style={styles.title}>{meta.title}</Text>
					<Text style={styles.desc}>{meta.desc}</Text>

					{isPracticeMode && (
						<View style={styles.practiceBanner}>
							<IconComponent type="materialIcons" name="info" size={scaledSize(14)} color="#F97316" />
							<Text style={styles.practiceText}>연습 모드 · 점수와 뱃지가 기록되지 않아요.</Text>
						</View>
					)}

					<View style={styles.infoBox}>
						{infoRows.map((row, i) => (
							<View key={i} style={[styles.infoRow, i === infoRows.length - 1 && { marginBottom: 0 }]}>
								<View style={styles.infoIconChip}>
									<IconComponent type="materialIcons" name={row.icon} size={scaledSize(15)} color="#3B82F6" />
								</View>
								<Text style={styles.infoText}>{row.text}</Text>
							</View>
						))}
					</View>

					<View style={styles.buttonRow}>
						<TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.85}>
							<Text style={styles.backButtonText}>돌아가기</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.startButton} onPress={onStart} activeOpacity={0.85}>
							<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(18)} color="#fff" />
							<Text style={styles.startButtonText}>시작하기</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
};

export default QuizStartModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(15,23,42,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: scaleWidth(24),
	},
	card: {
		width: '100%',
		maxWidth: scaleWidth(360),
		backgroundColor: '#fff',
		borderRadius: scaleWidth(24),
		paddingVertical: scaleHeight(24),
		paddingHorizontal: scaleWidth(22),
		alignItems: 'center',
		shadowColor: '#0F172A',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.18,
		shadowRadius: 24,
		elevation: 10,
	},
	iconCircle: {
		width: scaleWidth(60),
		height: scaleWidth(60),
		borderRadius: scaleWidth(30),
		backgroundColor: '#EFF6FF',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(14),
	},
	title: {
		fontSize: scaledSize(20),
		fontWeight: '800',
		color: '#1E293B',
		marginBottom: scaleHeight(6),
		textAlign: 'center',
	},
	desc: {
		fontSize: scaledSize(14),
		color: '#64748B',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
		marginBottom: scaleHeight(16),
	},
	practiceBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),
		backgroundColor: '#FFF7ED',
		borderRadius: scaleWidth(10),
		paddingVertical: scaleHeight(8),
		paddingHorizontal: scaleWidth(12),
		marginBottom: scaleHeight(14),
	},
	practiceText: { fontSize: scaledSize(12), color: '#F97316', fontWeight: '700', flexShrink: 1 },
	infoBox: {
		width: '100%',
		backgroundColor: '#F8FAFC',
		borderRadius: scaleWidth(16),
		padding: scaleWidth(14),
		marginBottom: scaleHeight(20),
	},
	infoRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(10), marginBottom: scaleHeight(10) },
	infoIconChip: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(9),
		backgroundColor: '#EFF6FF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	infoText: { flex: 1, fontSize: scaledSize(13), color: '#334155', lineHeight: scaleHeight(18) },
	buttonRow: { flexDirection: 'row', gap: scaleWidth(10), width: '100%' },
	backButton: {
		flex: 1,
		backgroundColor: '#F1F5F9',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(14),
		alignItems: 'center',
	},
	backButtonText: { fontSize: scaledSize(15), fontWeight: '800', color: '#64748B' },
	startButton: {
		flex: 1.5,
		flexDirection: 'row',
		gap: scaleWidth(4),
		backgroundColor: '#3B82F6',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(14),
		alignItems: 'center',
		justifyContent: 'center',
	},
	startButtonText: { fontSize: scaledSize(15), fontWeight: '800', color: '#fff' },
});
