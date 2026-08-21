// components/VersionCheckModal.tsx
import { setCurrentAppVerion } from '@/store/slice/UserDeviceInfoSlice';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Linking, Platform, Image } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import VersionCheck from 'react-native-version-check';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useDispatch } from 'react-redux';

/** 업데이트 종류: 팝업 없음 / 닫기 가능한 안내 / 강제 업데이트 */
export type UpdateKind = 'none' | 'optional' | 'force';

/** 개발 빌드에서는 스토어 버전이 항상 높아 무한 팝업이 되므로 건너뛴다. 팝업을 직접 확인하려면 false 로 변경. */
const SKIP_ON_DEV = true;

/**
 * 'major.minor.patch' 문자열을 숫자 3개로 파싱한다.
 * - '1.2' → [1, 2, 0], '1.2.3-beta' → [1, 2, 3]
 * - 숫자가 아니거나 자리수가 4개 이상이면 null (비교 불가로 처리)
 */
const parseVersion = (version?: string | null): [number, number, number] | null => {
	if (typeof version !== 'string') {
		return null;
	}
	const core = version.trim().split(/[-+]/)[0];
	const parts = core.split('.');
	if (parts.length === 0 || parts.length > 3) {
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
 * - 그 외(동일/하위/파싱 실패)는 팝업 없음(none)
 */
export const getUpdateKind = (current?: string | null, latest?: string | null): UpdateKind => {
	const cur = parseVersion(current);
	const lat = parseVersion(latest);
	if (!cur || !lat) {
		return 'none';
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
 */
const VersionCheckModal = () => {
	useThemeMode(); // 네비게이터 밖(App 루트)에 있어 직접 구독해야 테마가 반영된다
	const dispatch = useDispatch();
	const [updateKind, setUpdateKind] = useState<UpdateKind>('none');
	const [currentVersion, setCurrentVersion] = useState('');
	const [latestVersion, setLatestVersion] = useState('');
	/** 선택 업데이트를 닫은 뒤에는 포그라운드 복귀 시 다시 띄우지 않는다(강제는 제외). */
	const optionalDismissed = useRef(false);

	// 진입 애니메이션 (fade + scale 0.95 → 1)
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	const visible = updateKind !== 'none';
	const isForce = updateKind === 'force';

	useEffect(() => {
		let mounted = true;

		/** 스토어 버전 조회 후 업데이트 종류 판단 */
		const checkVersion = async (): Promise<void> => {
			if (SKIP_ON_DEV && __DEV__) {
				return;
			}
			try {
				const provider = Platform.OS === 'android' ? 'playStore' : 'appStore';
				const latest = await VersionCheck.getLatestVersion({ provider });
				const current = VersionCheck.getCurrentVersion();

				// 미출시이거나 조회 실패(null/undefined)면 팝업을 띄우지 않는다.
				if (!mounted || !latest || !current) {
					return;
				}
				const kind = getUpdateKind(current, latest);
				if (kind === 'optional' && optionalDismissed.current) {
					return;
				}
				setCurrentVersion(current);
				setLatestVersion(latest);
				setUpdateKind(kind);
			} catch (error) {
				console.log('Version check failed:', error);
			}
		};

		dispatch(setCurrentAppVerion(VersionCheck.getCurrentVersion()));
		checkVersion();

		// 스토어에 다녀와도 업데이트하지 않았으면 포그라운드 복귀 시 다시 확인
		const subscription = AppState.addEventListener('change', (state) => {
			if (state === 'active') {
				checkVersion();
			}
		});
		return () => {
			mounted = false;
			subscription.remove();
		};
	}, [dispatch]);

	useEffect(() => {
		if (!visible) {
			// 닫힐 때 초기화해야 다음에 열릴 때 첫 프레임이 opacity 0 으로 그려진다(잔상 방지)
			fadeAnim.setValue(0);
			scaleAnim.setValue(0.95);
			return;
		}
		fadeAnim.setValue(0);
		scaleAnim.setValue(0.95);
		const enter = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		enter.start();
		return () => enter.stop();
	}, [visible, fadeAnim, scaleAnim]);

	/** 스토어로 이동 */
	const handleUpdate = async (): Promise<void> => {
		try {
			const storeUrl = await VersionCheck.getStoreUrl();
			if (storeUrl) {
				Linking.openURL(storeUrl);
			}
		} catch (error) {
			console.log('Store url open failed:', error);
		}
	};

	/** 선택 업데이트에서만 닫기 허용 */
	const handleClose = () => {
		if (isForce) {
			return;
		}
		optionalDismissed.current = true;
		setUpdateKind('none');
	};

	if (!visible) {
		return null;
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent // ✅ 안드로이드에서 전체 화면 덮게
			presentationStyle="overFullScreen" // ✅ iOS에서도 안정적
			onRequestClose={isForce ? () => {} : handleClose}>
			<TouchableWithoutFeedback onPress={handleClose}>
				<View style={styles.overlay}>
					<TouchableWithoutFeedback onPress={() => {}}>
						<Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
							<View style={[styles.iconWrap, isForce && styles.iconWrapForce]}>
								<Image source={require('@/assets/images/update.png')} style={styles.icon} />
							</View>

							<Text style={[styles.badge, isForce && styles.badgeForce]}>{isForce ? '필수 업데이트' : '새로운 버전 출시'}</Text>
							<Text style={styles.title}>{isForce ? '업데이트가 필요합니다' : '새 버전이 나왔습니다'}</Text>

							<View style={styles.versionRow}>
								<View style={styles.versionChip}>
									<Text style={styles.versionChipLabel}>현재</Text>
									<Text style={styles.versionChipValue}>{currentVersion}</Text>
								</View>
								<Text style={styles.versionArrow}>→</Text>
								<View style={[styles.versionChip, styles.versionChipLatest]}>
									<Text style={[styles.versionChipLabel, styles.versionChipLabelLatest]}>최신</Text>
									<Text style={[styles.versionChipValue, styles.versionChipValueLatest]}>{latestVersion}</Text>
								</View>
							</View>

							<Text style={styles.message}>
								{isForce
									? '중요한 변경 사항이 포함되어 있습니다.\n계속하려면 업데이트가 필요합니다.'
									: '더 편리해진 기능과 개선 사항이 준비됐습니다.\n최신 버전으로 업데이트해 주세요.'}
							</Text>

							<TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.85}>
								<Text style={styles.updateButtonText}>지금 업데이트</Text>
							</TouchableOpacity>

							{!isForce && (
								<TouchableOpacity style={styles.laterButton} onPress={handleClose} activeOpacity={0.7}>
									<Text style={styles.laterButtonText}>나중에 하기</Text>
								</TouchableOpacity>
							)}
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
		paddingHorizontal: SPACING_W.xxl,
	},
	card: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		paddingTop: SPACING_H.xl,
		paddingBottom: SPACING_H.lg,
		paddingHorizontal: SPACING_W.lg,
		width: '100%',
		maxWidth: scaleWidth(340),
		alignItems: 'center',
	},
	iconWrap: {
		width: scaleWidth(84),
		height: scaleWidth(84),
		borderRadius: scaleWidth(84) / 2,
		backgroundColor: COLORS.primaryBg,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING_H.md,
	},
	iconWrapForce: {
		backgroundColor: COLORS.warningBg,
	},
	icon: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		resizeMode: 'contain',
	},
	badge: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '700',
		color: COLORS.primaryDeep,
		backgroundColor: COLORS.primarySoft,
		borderRadius: RADIUS.round,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		overflow: 'hidden',
		marginBottom: SPACING_H.sm,
	},
	badgeForce: {
		color: COLORS.warningDark,
		backgroundColor: COLORS.warningBg,
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
		marginBottom: SPACING_H.lg,
	},
	versionChip: {
		alignItems: 'center',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		minWidth: scaleWidth(92),
	},
	versionChipLatest: {
		backgroundColor: COLORS.primaryBg,
		borderWidth: 1,
		borderColor: COLORS.primaryBorder,
	},
	versionChipLabel: {
		fontSize: FONT_SIZES.xxs,
		fontWeight: '600',
		color: COLORS.textLight,
		marginBottom: SPACING_H.xs,
	},
	versionChipLabelLatest: {
		color: COLORS.primaryDark,
	},
	versionChipValue: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textSecondary,
	},
	versionChipValueLatest: {
		color: COLORS.primaryDeep,
	},
	versionArrow: {
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		color: COLORS.textLight,
		marginHorizontal: SPACING_W.sm,
	},
	message: {
		fontSize: FONT_SIZES.md,
		textAlign: 'center',
		color: COLORS.textSecondary,
		lineHeight: scaledSize(21),
		includeFontPadding: false,
		marginBottom: SPACING_H.xl,
	},
	updateButton: {
		backgroundColor: COLORS.primary,
		height: scaleHeight(48),
		borderRadius: RADIUS.md,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	updateButtonText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
	},
	laterButton: {
		height: scaleHeight(40),
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: SPACING_H.xs,
	},
	laterButtonText: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.textLight,
	},
}));

export default VersionCheckModal;
