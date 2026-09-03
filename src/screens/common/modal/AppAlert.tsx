import React, { useCallback, useSyncExternalStore } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Modal from '@/screens/common/atomic/AppModal';
import useModalSafePadding from '@/hooks/useModalSafePadding';
import { useModalEnter } from '@/hooks/useModalEnter';
import { useModalHandoff } from '@/hooks/useModalHandoff';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import { scaleHeight, scaleWidth } from '@/utils/DementionUtils';

/**
 * 앱 테마를 따르는 공용 알림/확인 팝업.
 *
 * OS 의 `Alert.alert` 은 **시스템 다크모드**를 따라간다. 이 앱은 시스템 설정을 무시하고
 * 설정 화면에서 고른 모드만 쓰기로 했는데(Theme.ts 참고), 시스템이 다크인 기기에서
 * 앱은 화이트인 채로 알림창만 검게 떠서 앱과 따로 노는 문제가 있었다.
 * 글자 크기(TEXT_SIZE_FACTOR)·간격·라운드 토큰도 하나도 적용되지 않는다.
 *
 * 호출부를 그대로 옮길 수 있도록 시그니처는 `Alert.alert` 과 동일하게 맞췄다.
 * 화면마다 state 를 두지 않아도 되게 모듈 스코프 스토어 + 루트에 host 하나를 둔다.
 *
 * ```ts
 * AppAlert.alert('알림', '이미 완료한 레벨입니다!');
 * AppAlert.alert('퀴즈 종료', '정말 종료하시겠습니까?', [
 *   { text: '취소', style: 'cancel' },
 *   { text: '종료', style: 'destructive', onPress: quit },
 * ]);
 * ```
 */
export interface AppAlertButton {
	text: string;
	onPress?: () => void;
	style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
	visible: boolean;
	title: string;
	message?: string;
	buttons: AppAlertButton[];
	/** 안드로이드 백버튼/바깥 터치로 닫을 수 있는지 (Alert 의 cancelable 과 같은 의미) */
	cancelable: boolean;
}

const CLOSED: AlertState = { visible: false, title: '', buttons: [], cancelable: true };
const DEFAULT_BUTTONS: AppAlertButton[] = [{ text: '확인' }];

let state: AlertState = CLOSED;
const listeners = new Set<() => void>();

const emit = (next: AlertState): void => {
	state = next;
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getState = (): AlertState => state;

/**
 * 팝업을 띄운다. 시그니처는 RN 의 Alert.alert 과 동일하다.
 *
 * ⚠️ 버튼의 `onPress` 는 팝업이 **완전히 닫힌 뒤**(MODAL_HANDOFF_DELAY) 실행된다.
 *    콜백에서 또 다른 팝업/모달을 열어도 이전 팝업이 깜빡이지 않게 하기 위한 것으로,
 *    호출부에서 따로 딜레이를 줄 필요가 없다.
 */
const alert = (title: string, message?: string, buttons?: AppAlertButton[], options?: { cancelable?: boolean }): void => {
	emit({
		visible: true,
		title,
		message,
		buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
		cancelable: options?.cancelable !== false,
	});
};

/** 열려 있는 팝업을 닫는다(화면 전환 등으로 강제로 내려야 할 때). */
const dismiss = (): void => emit(CLOSED);

export const AppAlert = { alert, dismiss };

/**
 * 팝업을 실제로 그리는 곳. 앱 루트(AppLayout)에 **한 번만** 마운트한다.
 * 화면 안에 두면 그 화면이 사라질 때 팝업도 같이 사라진다.
 */
export const AppAlertHost = (): React.ReactElement | null => {
	const current = useSyncExternalStore(subscribe, getState, getState);
	const enterStyle = useModalEnter(current.visible);
	const safePadding = useModalSafePadding();
	// 버튼 콜백이 또 다른 팝업/모달을 여는 경우가 많아 '닫은 뒤 실행'이 필수다.
	const handoff = useModalHandoff();

	/**
	 * 버튼을 누르면 팝업을 먼저 닫고, 닫힘이 끝난 뒤에 콜백을 실행한다.
	 *
	 * 같은 틱에 `dismiss(); onPress()` 를 하면
	 *  - 콜백이 또 다른 AppAlert 을 여는 경우: host 가 visible:false 로 한 번도 그려지지 않아
	 *    useModalEnter 가 다시 돌지 않고, 이전 제목/본문이 그대로 남은 채 내용만 바뀐다.
	 *  - 콜백이 다른 모달을 여는 경우: 네이티브 창 두 개가 함께 커밋되어 이전 팝업이 깜빡인다.
	 * 그래서 화면 쪽 호출부를 고치지 않아도 되도록 host 한 곳에서 전환을 넘겨받는다.
	 */
	const handlePress = useCallback(
		(button: AppAlertButton) => {
			handoff(dismiss, () => button.onPress?.());
		},
		[handoff],
	);

	const handleRequestClose = useCallback(() => {
		if (!current.cancelable) {
			return;
		}
		// 백버튼은 '취소' 버튼과 같은 동작으로 취급한다(없으면 그냥 닫는다).
		const cancelButton = current.buttons.find((button) => button.style === 'cancel');
		handoff(dismiss, () => cancelButton?.onPress?.());
	}, [current.cancelable, current.buttons, handoff]);

	if (!current.visible) {
		return null;
	}

	// 버튼이 3개 이상이면 가로로 욱여넣지 않고 세로로 쌓는다(텍스트가 잘리지 않게).
	const isStacked = current.buttons.length > 2;

	return (
		<Modal visible transparent animationType="fade" onRequestClose={handleRequestClose}>
			<View style={[styles.overlay, safePadding]}>
				<Animated.View style={[styles.card, enterStyle]}>
					<Text style={styles.title}>{current.title}</Text>
					{!!current.message && <Text style={styles.message}>{current.message}</Text>}

					<View style={[styles.buttonRow, isStacked && styles.buttonColumn]}>
						{current.buttons.map((button, index) => (
							<TouchableOpacity
								key={`${button.text}-${index}`}
								style={[
									styles.button,
									isStacked && styles.buttonStacked,
									button.style === 'cancel' && styles.buttonCancel,
									button.style === 'destructive' && styles.buttonDestructive,
								]}
								onPress={() => handlePress(button)}
								accessibilityRole="button">
								<Text
									style={[
										styles.buttonText,
										button.style === 'cancel' && styles.buttonTextCancel,
										button.style === 'destructive' && styles.buttonTextDestructive,
									]}
									numberOfLines={2}>
									{button.text}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
};

const styles = themedStyles(() =>
	StyleSheet.create({
		overlay: {
			flex: 1,
			backgroundColor: COLORS.dim,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: SPACING_W.xxl,
		},
		card: {
			width: '100%',
			maxHeight: '100%',
			maxWidth: scaleWidth(340),
			backgroundColor: COLORS.surface,
			borderRadius: RADIUS.xl,
			borderWidth: 1,
			borderColor: COLORS.border,
			paddingHorizontal: SPACING_W.xl,
			paddingTop: SPACING_H.xl,
			paddingBottom: SPACING_H.lg,
		},
		title: {
			fontSize: FONT_SIZES.heading,
			fontWeight: '700',
			color: COLORS.textStrong,
			textAlign: 'center',
		},
		message: {
			marginTop: SPACING_H.smPlus,
			fontSize: FONT_SIZES.md,
			color: COLORS.textSecondary,
			textAlign: 'center',
		},
		buttonRow: {
			flexDirection: 'row',
			columnGap: SPACING_W.sm,
			marginTop: SPACING_H.xl,
		},
		buttonColumn: {
			flexDirection: 'column',
			rowGap: SPACING_H.sm,
		},
		button: {
			flex: 1,
			minHeight: scaleHeight(48), // 터치 최소 높이 확보
			borderRadius: RADIUS.md,
			backgroundColor: COLORS.primary,
			alignItems: 'center',
			justifyContent: 'center',
			paddingHorizontal: SPACING_W.md,
		},
		buttonStacked: {
			flex: 0,
			width: '100%',
		},
		buttonCancel: {
			backgroundColor: COLORS.surfaceAlt,
		},
		buttonDestructive: {
			backgroundColor: COLORS.danger,
		},
		buttonText: {
			fontSize: FONT_SIZES.mdPlus,
			fontWeight: '700',
			color: COLORS.textWhite,
			textAlign: 'center',
		},
		buttonTextCancel: {
			color: COLORS.textSecondary,
		},
		buttonTextDestructive: {
			color: COLORS.textWhite,
		},
	}),
);

export default AppAlert;
