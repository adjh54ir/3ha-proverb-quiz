// components/VersionCheckModal.tsx
import { setCurrentAppVerion } from '@/store/slice/UserDeviceInfoSlice';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Linking, Platform, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from '@/screens/common/atomic/AppModal';
import IconComponent from '@/screens/common/atomic/IconComponent';
import useModalSafePadding from '@/hooks/useModalSafePadding';
import VersionCheck from 'react-native-version-check';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useDispatch } from 'react-redux';
import { useModalEnterExit } from '@/hooks/useModalEnter';
import useReducedMotion from '@/hooks/useReducedMotion';

/** 업데이트 종류: 팝업 없음 / 닫기 가능한 안내 / 강제 업데이트 */
export type UpdateKind = 'none' | 'optional' | 'force';

/**
 * 버전 비교 결과.
 *
 * `'unknown'` 은 "버전 문자열을 읽을 수 없어 **판단 불가**" 라는 뜻이다. `'none'`(최신)과 반드시
 * 구분해야 한다 — 예전에는 파싱 실패가 곧 `'none'` 이라서, 스토어가 `기기에 따라 다름` 같은 값을
 * 돌려주면 강제 게이트가 조용히 꺼졌다. `'unknown'` 은 게이트를 끄거나 낮추는 근거가 될 수 없다.
 */
export type UpdateVerdict = UpdateKind | 'unknown';

/** 개발 빌드에서는 스토어 버전이 항상 높아 무한 팝업이 되므로 건너뛴다. 팝업을 직접 확인하려면 false 로 변경. */
const SKIP_ON_DEV = true;

/**
 * 강제 업데이트를 확정시킨 **스토어 버전** 저장 키.
 *
 * 불린("강제 필요함")이 아니라 버전 문자열을 저장한다. 스토어에 닿지 못하는 상태에서도 설치 버전과
 * 다시 비교할 수 있어야 하기 때문이다. 사용자가 스토어에서 업데이트를 마치면 설치 버전이 이 값을
 * 따라잡으므로 판정이 `'force'` 가 아니게 되고, 그 순간 플래그가 스스로 지워진다.
 * → 네트워크 없이도 잠금이 풀린다(업데이트를 끝낸 사용자가 영구히 막히는 사고 방지).
 */
const FORCE_STORE_VERSION_KEY = 'FORCE_UPDATE_STORE_VERSION';

/** 플래그 쓰기 실패는 다음 실행에서 다시 판정되므로 로그만 남긴다(미처리 rejection 방지). */
const logFlagError = (error: unknown): void => console.log('Force flag write failed:', error);

/**
 * 'major.minor.patch…' 문자열을 앞 세 자리 숫자로 파싱한다.
 * - '1.2' → [1, 2, 0] / '1.2.3-beta' → [1, 2, 3]
 * - '2.0.1.1' → [2, 0, 1] : 스토어 리스팅은 네 자리 버전을 그대로 노출하는 경우가 있어 앞 세 자리만 본다
 * - '기기에 따라 다름' / 'Varies with device' 처럼 숫자가 아니면 null → 호출부에서 'unknown' 이 된다
 */
export const parseVersion = (version?: string | null): [number, number, number] | null => {
	if (typeof version !== 'string') {
		return null;
	}
	// 프리릴리스/빌드 꼬리표('-beta', '+3')와 뒤에 붙는 안내 문구('1.0.0 (베타)')를 떼어 낸다.
	const core = version.trim().split(/[-+\s]/)[0];
	const parts = core.split('.').slice(0, 3);
	if (parts.length === 0) {
		return null;
	}
	const nums = parts.map((part) => (/^\d+$/.test(part) ? Number(part) : NaN));
	if (nums.some((num) => Number.isNaN(num))) {
		return null;
	}
	return [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0];
};

/**
 * 현재 버전과 스토어 최신 버전을 비교해 업데이트 종류를 판단한다.
 * - major 또는 minor 가 올라가면 강제(force)
 * - patch 만 올라가면 선택(optional)
 * - 동일하거나 설치 버전이 더 높으면 팝업 없음(none)
 * - 어느 한쪽이라도 파싱 실패면 판단 불가(unknown) — 'none' 과 섞지 않는다
 */
export const getUpdateKind = (current?: string | null, latest?: string | null): UpdateVerdict => {
	const cur = parseVersion(current);
	const lat = parseVersion(latest);
	if (!cur || !lat) {
		return 'unknown';
	}
	if (lat[0] !== cur[0]) {
		return lat[0] > cur[0] ? 'force' : 'none';
	}
	if (lat[1] !== cur[1]) {
		return lat[1] > cur[1] ? 'force' : 'none';
	}
	return lat[2] > cur[2] ? 'optional' : 'none';
};

/**
 * 스토어 최신 버전을 조회해 업데이트가 필요하면 팝업을 띄운다.
 * - 마이너/메이저 상승: 강제 업데이트(닫기 불가)
 * - 패치 상승: 닫기 가능한 안내
 *
 * 스토어 조회는 수백 ms 가 걸리고 실패할 수도 있으므로, 한 번 확정된 강제 판정은
 * AsyncStorage 에 남겨 두고 다음 실행에서는 **조회보다 먼저** 게이트를 세운다.
 */
const VersionCheckModal = () => {
	useThemeMode(); // 네비게이터 밖(App 루트)에 있어 직접 구독해야 테마가 반영된다
	const dispatch = useDispatch();
	const [updateKind, setUpdateKind] = useState<UpdateKind>('none');
	const [currentVersion, setCurrentVersion] = useState('');
	const [latestVersion, setLatestVersion] = useState('');
	/** 선택 업데이트를 닫은 뒤에는 포그라운드 복귀 시 다시 띄우지 않는다(강제는 제외). */
	const optionalDismissed = useRef(false);
	/** 한 세션에서 강제가 확정되면 더 약한 결과로는 절대 내려오지 않는다. */
	const forceLatched = useRef(false);
	/** 스토어 이동 연타 방지 — 앱으로 돌아오면 다시 누를 수 있게 풀어 준다. */
	const storeOpening = useRef(false);

	const visible = updateKind !== 'none';
	const isForce = updateKind === 'force';

	// 모달 공통 진입/퇴장 애니메이션 (fade + scale) — 선택 업데이트는 닫힐 때도 되감는다
	const { style: cardStyle, runExit } = useModalEnterExit(visible);
	const safePadding = useModalSafePadding();

	// 강제 업데이트에서만 아이콘을 은은하게 맥동시켜 주목을 유도한다
	const reducedMotion = useReducedMotion();
	const pulse = useRef(new Animated.Value(0)).current;
	const pulseStyle = useMemo(
		() => ({ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }),
		[pulse],
	);

	useEffect(() => {
		if (!isForce || reducedMotion) {
			pulse.setValue(0);
			return;
		}
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
				Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
			]),
		);
		loop.start();
		// 언마운트/판정 변경 시 애니메이션 정리 (메모리 누수 방지)
		return () => loop.stop();
	}, [isForce, reducedMotion, pulse]);

	useEffect(() => {
		let mounted = true;
		const current = VersionCheck.getCurrentVersion();

		/**
		 * 스토어 버전 하나로 판정을 내리고 화면·저장소에 반영한다.
		 * 스토어에서 방금 받은 값이든, 저장해 둔 값이든 같은 규칙을 태운다.
		 */
		const apply = (latest?: string | null): void => {
			if (!mounted || !latest) {
				return;
			}
			const verdict = getUpdateKind(current, latest);

			// 판단 불가 — 근거가 없으니 아무것도 바꾸지 않는다(저장된 강제 판정도 그대로 유지).
			if (verdict === 'unknown') {
				return;
			}

			// 강제가 확정된 세션에서는 더 약한 결과를 통째로 무시한다.
			// 앱이 살아 있는 동안 설치 버전은 바뀌지 않으므로, 뒤늦게 오는 'none'/'optional' 은
			// 지역별·캐시된 스토어 응답일 뿐이다. 저장 플래그도 함께 지켜 다음 실행까지 살린다.
			if (forceLatched.current && verdict !== 'force') {
				return;
			}

			if (verdict === 'force') {
				forceLatched.current = true;
				AsyncStorage.setItem(FORCE_STORE_VERSION_KEY, latest).catch(logFlagError);
			} else {
				// ── 플래그를 지우는 유일한 조건 ─────────────────────────────────
				// "읽을 수 있는 스토어 버전과 비교했고, 그 결과가 강제가 아니다"
				//  = 설치 버전이 major/minor 를 따라잡았다.
				// 세션 중에 설치 버전은 바뀌지 않으니 이 조건이 성립하는 경우는 두 가지뿐이다.
				//   (a) 사용자가 스토어에서 업데이트를 마치고 앱이 새로 떴다
				//   (b) 문제가 된 릴리스가 스토어에서 내려갔다
				// 둘 다 게이트가 없어야 하는 상태다. 반대로 **조회 실패**나 **파싱 실패(unknown)**
				// 로는 절대 지우지 않는다 — 지우면 오프라인 사용자가 게이트를 영구히 우회하고,
				// 지우지 않으면 업데이트를 끝낸 사용자가 영구히 잠긴다. 그 경계가 이 조건이다.
				AsyncStorage.removeItem(FORCE_STORE_VERSION_KEY).catch(logFlagError);
			}

			if (verdict === 'optional' && optionalDismissed.current) {
				return;
			}
			setCurrentVersion(current);
			setLatestVersion(latest);
			setUpdateKind(verdict);
		};

		/** 스토어 조회(수백 ms, 실패 가능). 실패는 게이트를 끄는 근거가 아니다. */
		const checkVersion = async (): Promise<void> => {
			if (SKIP_ON_DEV && __DEV__) {
				return;
			}
			try {
				const provider = Platform.OS === 'android' ? 'playStore' : 'appStore';
				apply(await VersionCheck.getLatestVersion({ provider }));
			} catch (error) {
				// 미출시·네트워크 실패 — 저장된 강제 판정이 있으면 그것이 그대로 게이트를 유지한다.
				console.log('Version check failed:', error);
			}
		};

		/**
		 * 저장된 강제 판정을 먼저 복원한다.
		 * 로컬 읽기는 스토어 왕복보다 훨씬 빨라, 오프라인이거나 스토어가 느려도 이 경로만으로 게이트가 뜬다.
		 */
		const restoreForce = async (): Promise<void> => {
			if (SKIP_ON_DEV && __DEV__) {
				return;
			}
			try {
				apply(await AsyncStorage.getItem(FORCE_STORE_VERSION_KEY));
			} catch (error) {
				console.log('Force flag restore failed:', error);
			}
		};

		dispatch(setCurrentAppVerion(current));
		// 복원 → 조회 순서를 지킨다. 동시에 돌리면 조회가 먼저 끝나 플래그를 지운 뒤,
		// 그 전에 읽어 둔 낡은 저장값이 뒤늦게 게이트를 세우는 역전이 생긴다.
		restoreForce().then(checkVersion);

		// 스토어에 다녀와도 업데이트하지 않았으면 포그라운드 복귀 시 다시 확인
		const subscription = AppState.addEventListener('change', (state) => {
			if (state === 'active') {
				storeOpening.current = false; // 스토어에서 돌아왔으니 버튼을 다시 열어 준다
				checkVersion();
			}
		});
		return () => {
			mounted = false;
			subscription.remove();
		};
	}, [dispatch]);

	/** 스토어로 이동 (연타 시 openURL 이 두 번 불리지 않도록 잠근다) */
	const handleUpdate = async (): Promise<void> => {
		if (storeOpening.current) {
			return;
		}
		storeOpening.current = true;
		try {
			const storeUrl = await VersionCheck.getStoreUrl();
			if (storeUrl) {
				// 열기가 실패하면(스토어 앱 없음 등) 강제 모드에는 빠져나갈 길이 없으니 잠금을 풀어 준다
				Linking.openURL(storeUrl).catch((error) => {
					storeOpening.current = false;
					console.log('Store url open failed:', error);
				});
				return;
			}
			storeOpening.current = false; // 열 주소가 없으면 다시 누를 수 있게
		} catch (error) {
			storeOpening.current = false;
			console.log('Store url open failed:', error);
		}
	};

	/** 선택 업데이트에서만 닫기 허용 (강제는 딤 탭·백버튼 모두 막힌다) */
	const handleClose = () => {
		if (isForce) {
			return;
		}
		optionalDismissed.current = true;
		runExit(() => setUpdateKind('none')); // 카드를 되감은 뒤 닫아 툭 끊기지 않게
	};

	if (!visible) {
		return null;
	}

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={isForce ? () => {} : handleClose}>
			<TouchableWithoutFeedback onPress={handleClose}>
				<View style={[styles.overlay, safePadding]}>
					{/* 카드 안쪽 탭이 딤으로 새어 나가 모달이 닫히지 않게 한 겹 막는다 */}
					<TouchableWithoutFeedback onPress={() => {}}>
						<Animated.View style={[styles.card, cardStyle]}>
							{/* 1.6MB 래스터 PNG 대신 벡터 아이콘 (앱의 다른 모달과 동일한 방식) */}
							<Animated.View style={[styles.iconWrap, isForce && styles.iconWrapForce, pulseStyle]}>
								<IconComponent
									type="MaterialCommunityIcons"
									name={isForce ? 'alert-decagram-outline' : 'rocket-launch-outline'}
									size={scaledSize(36)}
									color={isForce ? COLORS.warningDark : COLORS.primaryDark}
								/>
							</Animated.View>

							{/* 배지는 View 로 감싼다 — <Text> 의 paddingVertical 은 안드로이드에서 어긋난다 */}
							<View style={[styles.badge, isForce && styles.badgeForce]}>
								<Text style={[styles.badgeText, isForce && styles.badgeTextForce]}>
									{isForce ? '필수 업데이트' : '새로운 버전 출시'}
								</Text>
							</View>

							<Text style={styles.title}>{isForce ? '업데이트가 필요합니다' : '새 버전이 나왔습니다'}</Text>

							<View style={styles.versionRow}>
								<View style={styles.versionChip}>
									<Text style={styles.versionChipLabel}>현재</Text>
									<Text style={styles.versionChipValue} numberOfLines={1}>
										{currentVersion}
									</Text>
								</View>
								{/* 텍스트 화살표(→)는 플랫폼 글꼴마다 두께·중심이 달라 아이콘으로 대체 */}
								<IconComponent
									type="MaterialCommunityIcons"
									name="arrow-right"
									size={scaledSize(18)}
									color={COLORS.textLight}
									style={styles.versionArrow}
								/>
								<View style={[styles.versionChip, isForce ? styles.versionChipForce : styles.versionChipLatest]}>
									<Text style={[styles.versionChipLabel, isForce ? styles.versionChipLabelForce : styles.versionChipLabelLatest]}>
										최신
									</Text>
									<Text
										style={[styles.versionChipValue, isForce ? styles.versionChipValueForce : styles.versionChipValueLatest]}
										numberOfLines={1}>
										{latestVersion}
									</Text>
								</View>
							</View>

							<Text style={styles.message}>
								{isForce
									? '중요한 변경 사항이 포함되어 있습니다.\n계속하려면 업데이트가 필요합니다.'
									: '더 편리해진 기능과 개선 사항이 준비됐습니다.\n최신 버전으로 업데이트해 주세요.'}
							</Text>

							<View style={styles.actions}>
								<TouchableOpacity
									style={[styles.updateButton, isForce && styles.updateButtonForce]}
									onPress={handleUpdate}
									activeOpacity={0.85}>
									<IconComponent
										type="MaterialCommunityIcons"
										name="tray-arrow-down"
										size={scaledSize(18)}
										color={isForce ? COLORS.textOnAccent : COLORS.textWhite}
									/>
									<Text style={[styles.updateButtonText, isForce && styles.updateButtonTextForce]}>지금 업데이트</Text>
								</TouchableOpacity>

								{!isForce && (
									<TouchableOpacity style={styles.laterButton} onPress={handleClose} activeOpacity={0.7}>
										<Text style={styles.laterButtonText}>나중에 하기</Text>
									</TouchableOpacity>
								)}
							</View>
						</Animated.View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

const styles = themedStyles(() => StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	card: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		borderWidth: 1,
		borderColor: COLORS.borderLight,
		// 위·아래·좌·우 여백을 20 으로 맞춘다 — 버튼이 하나(강제)든 둘(선택)이든 아래가 비어 보이지 않는다
		paddingVertical: SPACING_H.xl,
		paddingHorizontal: SPACING_W.xl,
		width: '100%',
		maxHeight: '100%', // 카드가 시스템 바를 넘지 않도록(모달 레이아웃 규칙 2)
		maxWidth: scaleWidth(340),
		alignItems: 'center',
	},
	iconWrap: {
		width: scaleWidth(76),
		height: scaleWidth(76),
		borderRadius: scaleWidth(76) / 2,
		backgroundColor: COLORS.primaryBg,
		borderWidth: 1,
		borderColor: COLORS.primaryBorder,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.md,
	},
	// 강제 모드 위계 1/3 — 가장 옅은 앰버 틴트(배지와 겹쳐 보이지 않게 한 단계 낮춘다)
	iconWrapForce: {
		backgroundColor: COLORS.warningSoft,
		borderColor: COLORS.warningBorder,
	},
	badge: {
		backgroundColor: COLORS.primarySoft,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		marginBottom: SPACING_H.sm,
	},
	// 강제 모드 위계 2/3 — 아이콘보다 진한 앰버
	badgeForce: {
		backgroundColor: COLORS.warningBg,
	},
	badgeText: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		color: COLORS.primaryDeep,
	},
	badgeTextForce: {
		color: COLORS.warningDeep,
	},
	title: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
		textAlign: 'center',
		marginBottom: SPACING_H.lg,
	},
	versionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		marginBottom: SPACING_H.lg,
	},
	// flex 로 나눠 가져야 긴 버전 문자열('2.0.1.1')이 행을 넘치지 않는다(고정 minWidth 는 넘쳤다)
	versionChip: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.borderLight,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.sm,
	},
	versionChipLatest: {
		backgroundColor: COLORS.primaryBg,
		borderColor: COLORS.primaryBorder,
	},
	versionChipForce: {
		backgroundColor: COLORS.warningSoft,
		borderColor: COLORS.warningBorder,
	},
	versionChipLabel: {
		fontSize: FONT_SIZES.xxs,
		fontWeight: '600',
		color: COLORS.textLight,
		marginBottom: SPACING_H.xxs,
	},
	versionChipLabelLatest: {
		color: COLORS.primaryDark,
	},
	versionChipLabelForce: {
		color: COLORS.warningDark,
	},
	versionChipValue: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textSecondary,
	},
	versionChipValueLatest: {
		color: COLORS.primaryDeep,
	},
	versionChipValueForce: {
		color: COLORS.warningDeep,
	},
	versionArrow: {
		marginHorizontal: SPACING_W.sm,
	},
	message: {
		fontSize: FONT_SIZES.md,
		textAlign: 'center',
		color: COLORS.textSecondary,
		lineHeight: scaledSize(21),
		marginBottom: SPACING_H.xl,
	},
	actions: {
		width: '100%',
		rowGap: SPACING_H.xs,
	},
	updateButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.xsPlus,
		backgroundColor: COLORS.primary,
		minHeight: scaleHeight(48),
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.md,
	},
	// 강제 모드 위계 3/3 — 눌러야 하는 버튼까지 앰버로 이어 붙인다(초록 CTA 는 긴급함이 끊긴다)
	updateButtonForce: {
		backgroundColor: COLORS.warning,
	},
	updateButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},
	// 앰버 위 흰 글자는 두 모드 모두 대비가 모자라므로 고정 잉크를 쓴다
	updateButtonTextForce: {
		color: COLORS.textOnAccent,
	},
	laterButton: {
		minHeight: scaleHeight(40),
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: SPACING_H.sm,
	},
	laterButtonText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.textLight,
	},
}));

export default VersionCheckModal;
