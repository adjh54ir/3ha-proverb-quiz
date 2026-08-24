import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image, Switch } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import { isSoundEnabled, setSoundEnabled } from '@/utils/SoundUtils';
import { isBgmEnabled, setBgmEnabled, startBgm, stopBgm, BgmTrack } from '@/utils/BgmUtils';
import { useModalEnter } from '@/hooks/useModalEnter';

export type QuizStartMode = 'meaning' | 'proverb' | 'blank' | 'example' | 'exampleBlank' | 'arrange';

interface Props {
	visible: boolean;
	mode?: QuizStartMode;
	isPracticeMode?: boolean;
	timeLimit?: number; // 문제당 제한시간(초)
	scorePerCorrect?: number; // 정답 점수
	showHint?: boolean; // 힌트 안내 표시 여부
	/** 이 화면에서 재생할 BGM 트랙 — 스위치를 켰을 때 즉시 다시 틀어주기 위해 필요 */
	bgmTrack?: BgmTrack;
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
	bgmTrack = 'quiz',
	onStart,
	onBack,
}: Props) => {
	// 모달 공통 진입 애니메이션 (fade + scale)
	const enterStyle = useModalEnter(visible);
	const meta = MODE_META[mode] ?? MODE_META.meaning;
	// 시작 전에 소리 설정을 바로 바꿀 수 있게 — 설정 화면까지 나갔다 오지 않아도 된다
	const [sfxOn, setSfxOn] = useState(isSoundEnabled());
	const [bgmOn, setBgmOn] = useState(isBgmEnabled());

	// 팝업이 열릴 때마다 저장된 현재 값을 다시 읽어 스위치와 실제 설정을 맞춘다
	useEffect(() => {
		if (!visible) {
			return;
		}
		setSfxOn(isSoundEnabled());
		setBgmOn(isBgmEnabled());
	}, [visible]);

	const toggleSfx = (v: boolean) => {
		setSfxOn(v);
		setSoundEnabled(v);
	};

	const toggleBgm = (v: boolean) => {
		setBgmOn(v);
		setBgmEnabled(v); // false면 내부에서 stopBgm() 처리
		if (v) {
			startBgm(bgmTrack);
		} else {
			stopBgm();
		}
	};

	if (!visible) {
		return null;
	}

	const infoRows: { icon: string; text: string }[] = [
		{ icon: 'check-box', text: '보기 4개 중 하나를 고르는 방식입니다.' },
		{ icon: 'timer', text: `각 문제는 ${timeLimit}초 안에 풀어야 합니다.` },
		{ icon: 'star', text: `정답을 맞히면 ${scorePerCorrect}점을 얻습니다.` },
		{ icon: 'sentiment-satisfied-alt', text: '틀려도 점수가 깎이지 않습니다.' },
	];
	if (mode === 'arrange') {
		infoRows[0] = { icon: 'touch-app', text: '단어 조각을 순서대로 탭해서 완성합니다.' };
	}
	if (showHint) {
		infoRows.push({ icon: 'lightbulb', text: '힌트 버튼으로 단서를 확인할 수 있습니다.' });
	}

	return (
		<Modal visible transparent animationType="fade" onRequestClose={onBack}>
			<View style={styles.overlay}>
				<Animated.View style={[styles.card, enterStyle]}>
					<Image source={require('@/assets/images/home-mascot-moments/mascot-challenge-final.png')} style={styles.headerMascot} resizeMode="contain" />

					<Text style={styles.title}>{meta.title}</Text>
					<Text style={styles.desc}>{meta.desc}</Text>

					{isPracticeMode && (
						<View style={styles.practiceBanner}>
							<IconComponent type="materialIcons" name="info" size={scaledSize(14)} color={COLORS.warningDark} />
							<Text style={styles.practiceText}>연습 모드 · 점수와 뱃지가 기록되지 않습니다.</Text>
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

					{/* 🔊 시작 전 소리 설정 — 설정 화면까지 나가지 않고 바로 끄고 켠다 */}
					<View style={styles.soundBox}>
						{[
							{ key: 'sfx', on: sfxOn, onChange: toggleSfx, icon: sfxOn ? 'volume-up' : 'volume-off', label: '효과음' },
							{ key: 'bgm', on: bgmOn, onChange: toggleBgm, icon: bgmOn ? 'music-note' : 'music-off', label: '배경음악' },
						].map((row, i) => (
							<View key={row.key} style={[styles.soundRow, i === 0 && styles.soundRowDivider]}>
								<View style={styles.soundLabelWrap}>
									<IconComponent
										type="materialIcons"
										name={row.icon}
										size={scaledSize(16)}
										color={row.on ? COLORS.primary : COLORS.textLight}
									/>
									<Text style={styles.soundLabel} numberOfLines={1} ellipsizeMode="tail">
										{row.label}
									</Text>
								</View>
								<Switch
									value={row.on}
									onValueChange={row.onChange}
									trackColor={{ false: COLORS.borderDark, true: COLORS.primaryLight }}
									thumbColor={row.on ? COLORS.primaryDark : COLORS.surfaceAlt}
									accessibilityLabel={row.label}
								/>
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
		alignItems: 'center',
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
	headerMascot: {
		width: scaleWidth(96),
		height: scaleWidth(96),
		marginBottom: SPACING_H.sm,
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
	// ===== 소리 설정 =====
	soundBox: {
		width: '100%',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.xl,
	},
	soundRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: SPACING_H.sm,
	},
	soundRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
	soundLabelWrap: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.sm, flexShrink: 1 },
	soundLabel: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text, flexShrink: 1 },
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
}));
