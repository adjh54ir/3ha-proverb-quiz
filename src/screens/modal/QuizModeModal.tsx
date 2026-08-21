/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { scaledSize, scaleWidth, scaleHeight } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles, themedValue } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';

type QuizMode = 'meaning' | 'proverb' | 'blank' | 'example';

type Props = {
	book: MainDataType.ProverbBook | null;
	onClose: () => void;
	onSelect: (book: MainDataType.ProverbBook, mode: QuizMode) => void;
};

// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const MODES: { key: QuizMode; label: string; desc: string; icon: string; color: string; bg: string }[] = themedValue(() => ([
	{ key: 'meaning', label: '뜻 맞추기', desc: '속담을 보고 의미를 고릅니다', icon: 'lightbulb', color: COLORS.secondary, bg: COLORS.secondaryBg },
	{ key: 'proverb', label: '속담 맞추기', desc: '의미를 보고 속담을 고릅니다', icon: 'menu-book', color: COLORS.primary, bg: COLORS.primaryBg },
	{ key: 'blank', label: '빈칸 채우기', desc: '속담의 빈칸을 채웁니다', icon: 'edit', color: COLORS.warning, bg: COLORS.warningSoft },
	{ key: 'example', label: '예문 속담', desc: '예문에 어울리는 속담을 고릅니다', icon: 'forum', color: COLORS.accentTeal, bg: COLORS.accentTealBg },
]));

const QuizModeModal = ({ book, onClose, onSelect }: Props) => {
	// ✅ 모달 공통 진입 애니메이션 (fade + scale 0.95 → 1)
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	useEffect(() => {
		if (!book) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			fadeAnim.setValue(0);
			scaleAnim.setValue(0.95);
			return;
		}
		fadeAnim.setValue(0);
		scaleAnim.setValue(0.95);
		const anim = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, [book, fadeAnim, scaleAnim]);

	return (
		<Modal visible={!!book} transparent animationType="fade" onRequestClose={onClose}>
			<TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
				<Animated.View style={{ width: '100%', alignItems: 'center', opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
					<TouchableOpacity activeOpacity={1} style={styles.card}>
						<View style={styles.headerRow}>
							<Text style={styles.title} numberOfLines={1}>{book?.title ? `${book.title} 퀴즈` : '퀴즈 모드 선택'}</Text>
							<TouchableOpacity onPress={onClose} hitSlop={HIT_SLOP}>
								<IconComponent type="materialIcons" name="close" size={scaledSize(22)} color={COLORS.textSecondary} />
							</TouchableOpacity>
						</View>
						<Text style={styles.subtitle}>원하는 퀴즈 모드를 선택해주세요</Text>

						{MODES.map((m, i) => (
							<TouchableOpacity
								key={m.key}
								style={[styles.modeItem, i === MODES.length - 1 && { marginBottom: 0 }]}
								activeOpacity={0.8}
								onPress={() => book && onSelect(book, m.key)}>
								<View style={[styles.modeIcon, { backgroundColor: m.bg }]}>
									<IconComponent type="materialIcons" name={m.icon} size={scaledSize(20)} color={m.color} />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.modeLabel}>{m.label}</Text>
									<Text style={styles.modeDesc}>{m.desc}</Text>
								</View>
								<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(20)} color={COLORS.borderDark} />
							</TouchableOpacity>
						))}
					</TouchableOpacity>
				</Animated.View>
			</TouchableOpacity>
		</Modal>
	);
};

export default QuizModeModal;

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
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.xl,
	},
	// ===== 헤더 =====
	headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	title: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		flex: 1,
		marginRight: SPACING_W.md,
	},
	subtitle: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		marginTop: SPACING_H.xs,
		marginBottom: SPACING_H.lg,
	},
	// ===== 모드 리스트 =====
	modeItem: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.md,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		marginBottom: SPACING_H.md,
	},
	modeIcon: {
		width: scaleWidth(42),
		height: scaleWidth(42),
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	modeLabel: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.text },
	modeDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING_H.xs },
}));
