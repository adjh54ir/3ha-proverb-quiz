import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useReducedMotion from '@/hooks/useReducedMotion';
import FastImage from 'react-native-fast-image';
import IconComponent from '@/screens/common/atomic/IconComponent';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { LEVEL_DATA } from '@/const/common/CommonCharacterData';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

/** 안내를 이미 본 화면인지 기록하는 키 접두사 */
const SEEN_PREFIX = 'CHAR_GUIDE_SEEN_';

/**
 * 화면당 1회만 노출되는 캐릭터 안내 훅.
 *
 * 앱 전체 안내 정책 (한 가지만 쓴다)
 *  1. 화면에 **처음 들어갈 때 1회** 자동으로 뜬다.
 *  2. 다시 보려면 화면 안 물음표 버튼(CharacterGuideButton)을 누른다 — open() 으로 같은 안내를 다시 연다.
 *     검은 툴팁 대신 캐릭터가 말풍선으로 설명해 앱 전체 안내 방식이 하나로 통일된다.
 *  3. 설정 > 화면 안내 > 화면 사용법 안내 다시보기 에서 '처음 본 적 없음' 상태로 되돌릴 수 있다.
 *  4. 문제를 푸는 중(퀴즈·타워퀴즈·타임챌린지)에는 안내를 두지 않는다.
 *     그 화면들의 규칙은 시작 팝업(QuizStartModal)·규칙 화면이 이미 설명한다.
 *
 * @param id 화면 식별자 (예: 'favorite'). 이 값으로 노출 여부가 기록된다.
 * @param enabled false 면 판단 자체를 하지 않는다 (데이터 로딩 전 등)
 *
 * @example
 * const guide = useCharacterGuideOnce('favorite');
 * <CharacterGuide visible={guide.visible} onClose={guide.close} lines={[...]} />
 */
export const useCharacterGuideOnce = (id: string, enabled = true) => {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		if (!enabled) return;
		let alive = true;
		AsyncStorage.getItem(SEEN_PREFIX + id).then((v) => {
			if (alive && !v) setVisible(true);
		});
		return () => {
			alive = false;
		};
	}, [id, enabled]);
	const close = useCallback(() => {
		setVisible(false);
		AsyncStorage.setItem(SEEN_PREFIX + id, '1').catch(() => {});
	}, [id]);
	/** 물음표 버튼으로 안내를 다시 열 때 사용 */
	const open = useCallback(() => setVisible(true), []);
	return { visible, close, open };
};

/**
 * 화면 안에 놓는 '이 화면 사용법 다시 보기' 물음표 버튼.
 * useCharacterGuideOnce 의 open 을 연결해 쓴다.
 *
 * @example <CharacterGuideButton onPress={guide.open} size={scaledSize(18)} />
 */
export const CharacterGuideButton: React.FC<{ onPress: () => void; color?: string; size?: number }> = ({
	onPress,
	color = COLORS.textSecondary,
	size = scaledSize(20),
}) => (
	<TouchableOpacity
		onPress={onPress}
		hitSlop={{ top: scaleHeight(10), bottom: scaleHeight(10), left: scaleWidth(10), right: scaleWidth(10) }}
		activeOpacity={0.7}
		accessibilityRole="button"
		accessibilityLabel="이 화면 사용법 다시 보기">
		<IconComponent type="materialIcons" name="help-outline" size={size} color={color} />
	</TouchableOpacity>
);

/** 저장해 둔 '본 적 있음' 기록 초기화 (데이터 초기화에서 사용) */
export const resetCharacterGuideSeen = async () => {
	const keys = await AsyncStorage.getAllKeys();
	const targets = keys.filter((k) => k.startsWith(SEEN_PREFIX));
	if (targets.length) await AsyncStorage.multiRemove(targets);
};

/** 누적 점수로 지금 해금된 레벨 마스코트를 찾는다 (결과 화면 등급 산정과 동일 기준) */
const getLevelMascot = (totalScore: number) =>
	(LEVEL_DATA.find((l) => totalScore >= l.score && totalScore < l.next) ?? LEVEL_DATA[LEVEL_DATA.length - 1]).mascot;

interface CharacterGuideProps {
	visible: boolean;
	/** 캐릭터가 순서대로 말할 문장들. 탭하면 다음 문장으로 넘어간다. */
	lines: string[];
	onClose: () => void;
	/** 말풍선 상단 라벨 */
	title?: string;
	/** 강조색 (기본: 브랜드 컬러) */
	accent?: string;
	/** 마지막 문장에서 누를 버튼 문구 */
	confirmLabel?: string;
}

/**
 * 지금 등급으로 해금된 마스코트가 등장해 화면 사용법을 말풍선으로 설명하는 공통 안내 컴포넌트.
 * - 캐릭터 이미지는 누적 점수(UserQuizHistory.totalScore)로 정해지는 레벨 마스코트를 따라간다.
 * - lines 를 한 문장씩 타이핑하듯 보여주고, 탭하면 다음 문장 → 마지막에 닫기.
 * - 1회만 노출하고 싶으면 useCharacterGuideOnce 훅과 함께 쓴다.
 */
const CharacterGuide: React.FC<CharacterGuideProps> = ({
	visible,
	lines,
	onClose,
	title = '이렇게 써보세요',
	accent = COLORS.primary,
	confirmLabel = '알겠습니다',
}) => {
	// 스택 화면은 포커스를 잃어도 마운트된 채 남는다.
	// 그때 안내 모달이 살아 있으면 다른 화면 위에서 터치를 통째로 먹는다 — 포커스 없으면 렌더하지 않는다.
	const focused = useIsFocused();
	const reducedMotion = useReducedMotion();
	// 안드로이드 3버튼 내비게이션 바와 캐릭터가 겹치던 문제 — 하단 인셋만큼 더 띄운다
	const insets = useSafeAreaInsets();
	const [charImg, setCharImg] = useState<ReturnType<typeof require> | null>(null);
	const [step, setStep] = useState(0);
	const [typed, setTyped] = useState('');
	const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// 캐릭터 등장(아래에서 올라오며 살짝 튐) + 말풍선 페이드
	const enter = useRef(new Animated.Value(0)).current;
	// 말하는 느낌의 상하 흔들림
	const bob = useRef(new Animated.Value(0)).current;

	// 지금 등급으로 해금된 마스코트 로드
	useEffect(() => {
		if (!visible) return;
		let alive = true;
		AsyncStorage.getItem(MainStorageKeyType.USER_QUIZ_HISTORY)
			.then((raw) => {
				if (!alive) return;
				const totalScore = raw ? JSON.parse(raw).totalScore || 0 : 0;
				setCharImg(getLevelMascot(totalScore));
			})
			.catch(() => {
				if (alive) setCharImg(getLevelMascot(0));
			});
		return () => {
			alive = false;
		};
	}, [visible]);

	// 등장 애니메이션 + 말하는 동안 상하 흔들림 반복
	useEffect(() => {
		if (!visible) {
			setStep(0);
			return;
		}
		enter.setValue(0);
		if (reducedMotion) {
			enter.setValue(1);
			bob.setValue(0);
			return;
		}
		Animated.spring(enter, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
				Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [visible, enter, bob, reducedMotion]);

	// 문장 타이핑 — 한 글자씩 노출
	const line = lines[step] ?? '';
	useEffect(() => {
		if (!visible) return;
		if (typingRef.current) clearInterval(typingRef.current);
		if (reducedMotion) {
			setTyped(line);
			return;
		}
		setTyped('');
		let i = 0;
		typingRef.current = setInterval(() => {
			i += 1;
			setTyped(line.slice(0, i));
			if (i >= line.length && typingRef.current) {
				clearInterval(typingRef.current);
				typingRef.current = null;
			}
		}, 28);
		return () => {
			if (typingRef.current) clearInterval(typingRef.current);
			typingRef.current = null;
		};
	}, [line, visible, reducedMotion]);

	if (!visible || !focused) return null;

	const isTyping = typed.length < line.length;
	const isLast = step >= lines.length - 1;

	const next = () => {
		// 타이핑 중이면 먼저 전체 문장을 보여준다(성급한 탭에서도 내용을 놓치지 않게)
		if (isTyping) {
			if (typingRef.current) clearInterval(typingRef.current);
			typingRef.current = null;
			setTyped(line);
			return;
		}
		if (isLast) {
			onClose();
			return;
		}
		setStep((s) => s + 1);
	};

	const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [scaleHeight(40), 0] });
	const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -scaleHeight(6)] });

	return (
		<Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
			<TouchableOpacity
				style={[styles.backdrop, { paddingBottom: SPACING_H.xxxxl + insets.bottom }]}
				activeOpacity={1}
				onPress={next}
				accessibilityRole="button"
				accessibilityLabel="안내 다음으로">
				<Animated.View style={[styles.wrap, { opacity: enter, transform: [{ translateY }] }]}>
					{/* 말풍선 */}
					<View style={[styles.bubble, { borderColor: `${accent}55` }]}>
						<View style={styles.bubbleHead}>
							<IconComponent type="materialicons" name="tips-and-updates" size={scaledSize(15)} color={accent} />
							<Text style={[styles.bubbleTitle, { color: accent }]} numberOfLines={1}>
								{title}
							</Text>
							{lines.length > 1 && (
								<Text style={styles.stepText}>
									{step + 1}/{lines.length}
								</Text>
							)}
						</View>
						<Text style={styles.bubbleText}>
							{typed}
							{isTyping && <Text style={{ color: accent }}>▌</Text>}
						</Text>
						<TouchableOpacity
							style={[styles.cta, { backgroundColor: isLast ? accent : `${accent}1F` }]}
							activeOpacity={0.9}
							onPress={next}
							accessibilityRole="button"
							accessibilityLabel={isLast ? confirmLabel : '다음 안내 보기'}>
							<Text style={[styles.ctaText, { color: isLast ? COLORS.textWhite : accent }]}>
								{isLast ? confirmLabel : '다음'}
							</Text>
							<IconComponent
								type="materialicons"
								name={isLast ? 'check' : 'arrow-forward'}
								size={scaledSize(15)}
								color={isLast ? COLORS.textWhite : accent}
							/>
						</TouchableOpacity>
						{/* 말풍선 꼬리 — 캐릭터 쪽을 향한다 */}
						<View style={[styles.tail, { borderTopColor: COLORS.surface }]} />
						<View style={[styles.tailBorder, { borderTopColor: `${accent}55` }]} />
					</View>

					{/* 캐릭터 */}
					{!!charImg && (
						<Animated.View style={[styles.charWrap, { transform: [{ translateY: bobY }] }]}>
							<View style={[styles.charGlow, { backgroundColor: `${accent}1F` }]} />
							<FastImage source={charImg} style={styles.charImg} resizeMode={FastImage.resizeMode.contain} />
						</Animated.View>
					)}
				</Animated.View>
			</TouchableOpacity>
		</Modal>
	);
};

export default CharacterGuide;

const CHAR = scaleWidth(112);

const styles = themedStyles(() =>
	StyleSheet.create({
		backdrop: { flex: 1, backgroundColor: COLORS.dim, justifyContent: 'flex-end' },
		wrap: { paddingHorizontal: SPACING_W.xl, alignItems: 'flex-start' },
		bubble: {
			alignSelf: 'stretch',
			backgroundColor: COLORS.surface,
			borderRadius: RADIUS.xl,
			// 그림자/elevation 대신 테두리로 구분한다(앱 전역 규칙)
			borderWidth: 1,
			borderColor: COLORS.border,
			paddingHorizontal: SPACING_W.lg,
			paddingVertical: SPACING_H.lg,
		},
		bubbleHead: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.xs, marginBottom: SPACING_H.sm },
		bubbleTitle: { flex: 1, fontSize: FONT_SIZES.smPlus, fontWeight: '700' },
		stepText: { fontSize: FONT_SIZES.xxs, fontWeight: '600', color: COLORS.textLight },
		bubbleText: {
			fontSize: FONT_SIZES.mdPlus,
			lineHeight: scaledSize(24),
			color: COLORS.textStrong,
			fontWeight: '600',
			minHeight: scaleHeight(52),
		},
		cta: {
			alignSelf: 'flex-end',
			flexDirection: 'row',
			alignItems: 'center',
			columnGap: SPACING_W.xs,
			marginTop: SPACING_H.md,
			paddingVertical: SPACING_H.sm,
			paddingHorizontal: SPACING_W.lg,
			borderRadius: RADIUS.round,
		},
		ctaText: { fontSize: FONT_SIZES.md, fontWeight: '700' },
		// 삼각 꼬리 — 배경색 삼각형 위에 테두리색 삼각형을 1px 겹쳐 테두리 선을 잇는다
		tail: {
			position: 'absolute',
			left: scaleWidth(36),
			bottom: -scaleHeight(11),
			width: 0,
			height: 0,
			borderLeftWidth: scaleWidth(10),
			borderRightWidth: scaleWidth(10),
			borderTopWidth: scaleHeight(12),
			borderLeftColor: 'transparent',
			borderRightColor: 'transparent',
			zIndex: 2,
		},
		tailBorder: {
			position: 'absolute',
			left: scaleWidth(35),
			bottom: -scaleHeight(13),
			width: 0,
			height: 0,
			borderLeftWidth: scaleWidth(11),
			borderRightWidth: scaleWidth(11),
			borderTopWidth: scaleHeight(13),
			borderLeftColor: 'transparent',
			borderRightColor: 'transparent',
			zIndex: 1,
		},
		charWrap: {
			marginTop: SPACING_H.md,
			marginLeft: SPACING_W.sm,
			width: CHAR,
			height: CHAR,
			alignItems: 'center',
			justifyContent: 'center',
		},
		charGlow: { position: 'absolute', width: CHAR, height: CHAR, borderRadius: CHAR / 2 },
		charImg: { width: CHAR, height: CHAR, borderRadius: RADIUS.xl, overflow: 'hidden' },
	}),
);
