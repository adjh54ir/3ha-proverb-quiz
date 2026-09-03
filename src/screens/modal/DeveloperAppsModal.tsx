import React, { useState, useMemo, useEffect } from 'react';
import ModalCloseButton from '@/screens/common/atomic/ModalCloseButton';
import AppAlert from '@/screens/common/modal/AppAlert';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Linking, TextInput, KeyboardAvoidingView, Keyboard, Pressable } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { MODAL_MAX_WIDTH, scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles, themedValue } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import { COMMON_APPS_DATA, appStoreUrl } from '@/const/common/CommonAppsData';
import { CommonType } from '@/types/CommonType';
import PopInView from '@/components/animation/PopInView';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';
import { useModalHandoff } from '@/hooks/useModalHandoff';

type CategoryFilter = 'all' | CommonType.AppCategory;

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
	{ key: 'all', label: '전체' },
	{ key: 'quiz', label: '퀴즈' },
	{ key: 'calculator', label: '계산기' },
	{ key: 'utility', label: '유틸리티' },
];

const CATEGORY_LABEL: Record<CommonType.AppCategory, string> = {
	quiz: '퀴즈',
	calculator: '계산기',
	utility: '유틸리티',
};

// themedValue 로 감싸야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const CATEGORY_COLORS: Record<CommonType.AppCategory, { bg: string; text: string }> = themedValue(() => ({
	quiz: { bg: COLORS.secondaryBg, text: COLORS.secondaryDark },
	calculator: { bg: COLORS.primaryBg, text: COLORS.primaryDeep },
	utility: { bg: COLORS.accentOrangeBg, text: COLORS.warningDeep },
}));

interface Props {
	visible: boolean;
	onClose: () => void;
}

const DeveloperAppsModal = ({ visible, onClose }: Props) => {
	// AppModal 이 시스템 바까지 덮으므로 오버레이가 직접 안전 여백을 준다.
	const safePadding = useModalSafePadding();
	// 모달 → 알림창 전환 시 이전 모달 깜빡임 방지
	const handoff = useModalHandoff();
	const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchFocused, setSearchFocused] = useState(false);

	// AppModal 은 visible=false 면 '내용'만 언마운트하고 이 컴포넌트는 계속 살아 있다.
	// 그래서 닫는 경로(닫기 버튼 / 백버튼 / 부모가 visible 을 내리는 경우)에 상관없이
	// 여기서 한 번만 초기화해야 다음에 열 때 이전 필터·검색어가 남지 않는다.
	useEffect(() => {
		if (visible) {
			return;
		}
		setSelectedCategory('all');
		setSearchQuery('');
		setSearchFocused(false);
	}, [visible]);

	const filteredApps = useMemo(() => {
		return COMMON_APPS_DATA.Apps.filter((app) => {
			const categoryMatch = selectedCategory === 'all' || app.category === selectedCategory;
			const q = searchQuery.trim().toLowerCase();
			const textMatch = !q || app.title.toLowerCase().includes(q) || app.desc.toLowerCase().includes(q);
			return categoryMatch && textMatch;
		});
	}, [selectedCategory, searchQuery]);

	const newAppIds = useMemo(
		() =>
			new Set(
				[...COMMON_APPS_DATA.Apps]
					.sort((a, b) => b.id - a.id)
					.slice(0, 2)
					.map((app) => app.id),
			),
		[],
	);
	/**
	 * 이 모달 위에 알림창을 바로 띄우면 RN Modal(네이티브 창)이 두 개가 되어
	 * 이전 모달이 한 프레임 다시 보이고, iOS 에서는 알림창이 아예 뜨지 않을 수 있다.
	 * 모달을 먼저 닫고 닫힘 애니메이션이 끝난 뒤에 알림창을 띄운다.
	 */
	const alertAfterClose = (title: string, message: string) => {
		handoff(onClose, () => AppAlert.alert(title, message));
	};

	const onDownloadApp = async (app: CommonType.AppItem) => {
		const url = appStoreUrl(app);
		if (!url) {
			alertAfterClose('Coming Soon!', '아직 스토어 링크가 준비되지 않았습니다.');
			return;
		}
		try {
			const supported = await Linking.canOpenURL(url);
			if (!supported) {
				alertAfterClose('오류', '링크를 열 수 없습니다.');
				return;
			}
			Linking.openURL(url);
		} catch {
			alertAfterClose('오류', '링크를 여는 중 문제가 발생했습니다.');
		}
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			{/* 모달은 Activity 가 아닌 별도 Dialog 윈도우라 매니페스트의 adjustResize 가 적용되지 않는다.
			    화면(Screen)과 달리 안드로이드도 behavior 를 직접 줘야 키보드가 입력창을 가리지 않는다. */}
			{/* 키보드 회피 규칙은 common/modal/README.md 참고 — behavior 는 두 플랫폼 모두 'padding' 으로 통일한다. */}
			<KeyboardAvoidingView behavior="padding" style={[styles.overlay, safePadding]}>
				{/* 카드 밖(딤 영역)을 누르면 키보드를 닫는다 */}
				<Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
				<PopInView visible={visible} style={styles.container}>
					{/* 헤더 */}
					<View style={styles.header}>
						<View style={styles.headerTop}>
							<Text style={styles.titleText}>📱 제작자의 다른 앱</Text>
							<ModalCloseButton onPress={onClose} style={styles.closeButton} />
						</View>

						{/* 검색 */}
						<View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
							<IconComponent type="Feather" name="search" size={scaledSize(14)} color={COLORS.textLight} style={styles.searchIcon} />
							<TextInput
								style={styles.searchInput}
								placeholder="앱 검색..."
								placeholderTextColor={COLORS.textLight}
								value={searchQuery}
								onChangeText={setSearchQuery}
								onFocus={() => setSearchFocused(true)}
								onBlur={() => setSearchFocused(false)}
							/>
						</View>

						{/* 카테고리 필터 */}
						<ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.tabsContainer}>
							{CATEGORY_TABS.map((tab) => (
								<TouchableOpacity
									key={tab.key}
									style={[styles.tabButton, selectedCategory === tab.key && styles.tabButtonActive]}
									activeOpacity={0.8}
									onPress={() => setSelectedCategory(tab.key)}>
									<Text style={[styles.tabButtonText, selectedCategory === tab.key && styles.tabButtonTextActive]}>
										{tab.label}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>

					<View style={styles.divider} />

					{/* 카운트 */}
					<Text style={styles.countLabel}>{filteredApps.length}개 앱</Text>

					{/* 리스트 */}
					<ScrollView contentContainerStyle={[styles.scroll, filteredApps.length === 0 && styles.scrollEmpty]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
						{filteredApps.length === 0 ? (
							<View style={styles.emptyState}>
								<Text style={styles.emptyText}>검색 결과가 없습니다</Text>
							</View>
						) : (
							filteredApps.map((app) => {
								const catColor = CATEGORY_COLORS[app.category];
								return (
									<View key={app.id} style={styles.appCard}>
										<View style={{ position: 'relative' }}>
											<Image source={app.icon} style={styles.image} resizeMode="cover" />

											{newAppIds.has(app.id) && (
												<View style={styles.newBadge}>
													<Text style={styles.newBadgeText}>NEW</Text>
												</View>
											)}
										</View>
										<View style={styles.appInfo}>
											<Text style={styles.appTitle} numberOfLines={1}>
												{app.title}
											</Text>
											<Text style={styles.appDesc} numberOfLines={2}>
												{app.desc}
											</Text>
											<View style={styles.appFooter}>
												<View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
													<Text style={[styles.categoryBadgeText, { color: catColor.text }]}>{CATEGORY_LABEL[app.category]}</Text>
												</View>
												<TouchableOpacity style={styles.downloadButton} activeOpacity={0.8} onPress={() => onDownloadApp(app)}>
													<IconComponent type="Feather" name="download" size={scaledSize(12)} color={COLORS.secondaryDark} />
													<Text style={styles.downloadText}>다운로드</Text>
												</TouchableOpacity>
											</View>
										</View>
									</View>
								);
							})
						)}
					</ScrollView>
				</PopInView>
			</KeyboardAvoidingView>
		</Modal>
	);
};

export default DeveloperAppsModal;

const styles = themedStyles(() => StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.lg,
	},
	container: {
		width: '100%',
		// 태블릿에서 카드가 화면 폭만큼 늘어나면 대화상자로 읽히지 않는다. 폰은 화면이 더 좁아 영향 없음.
		maxWidth: MODAL_MAX_WIDTH,
		maxHeight: '100%',
		flexShrink: 1, // 키보드로 화면이 줄어들 때 모달이 넘치지 않도록
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		overflow: 'hidden',
	},
	header: {
		paddingTop: SPACING_H.xl,
		paddingHorizontal: SPACING_W.lg,
	},
	headerTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: SPACING_H.md,
	},
	titleText: {
		fontSize: FONT_SIZES.heading,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	closeButton: {
		// 공용 ModalCloseButton 은 카드 우상단 고정이 기본이라, 헤더 행 안에서는 흐름 배치로 되돌린다.
		position: 'relative',
		top: 0,
		right: 0,
	},
	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.md,
		borderWidth: 1,
		borderColor: COLORS.border,
		paddingHorizontal: SPACING_W.md,
		marginBottom: SPACING_H.md,
		height: scaleHeight(48),
	},
	searchBoxFocused: {
		borderColor: COLORS.primary,
		backgroundColor: COLORS.surface,
	},
	searchIcon: {
		marginRight: SPACING_W.sm,
	},
	searchInput: {
		flex: 1,
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		paddingVertical: 0,
	},
	tabsContainer: {
		flexDirection: 'row',
		gap: SPACING_W.sm,
		paddingBottom: SPACING_H.md,
	},
	tabButton: {
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.round,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: 'transparent',
	},
	tabButtonActive: {
		backgroundColor: COLORS.secondaryBg,
		borderColor: COLORS.secondary,
	},
	tabButtonText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		fontWeight: '500',
	},
	tabButtonTextActive: {
		color: COLORS.secondaryDark,
		fontWeight: '600',
	},
	divider: {
		height: 1,
		backgroundColor: COLORS.border,
	},
	countLabel: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.md,
		paddingBottom: SPACING_H.xs,
	},
	scroll: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.xs,
		paddingBottom: SPACING_H.xxxxl,
	},
	// 위아래 여백은 스크롤되는 목록을 위한 것이라, 비었을 때는 안내 문구가 위로 치우쳐 보이게 한다.
	// (카드가 내용 높이만큼만 늘어나므로 emptyState 의 상하 여백만 남아 정중앙이 된다)
	scrollEmpty: {
		paddingTop: 0,
		paddingBottom: 0,
	},
	appCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: SPACING_W.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		marginBottom: SPACING_H.md,
	},
	image: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: RADIUS.md,
		flexShrink: 0,
	},
	appInfo: {
		flex: 1,
		minWidth: 0,
	},
	appTitle: {
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.xs,
	},
	appDesc: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textSecondary,
		lineHeight: scaledSize(18),
		marginBottom: SPACING_H.sm,
	},
	appFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	categoryBadge: {
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	categoryBadgeText: {
		fontSize: FONT_SIZES.xs,
		fontWeight: '600',
	},
	downloadButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xs,
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.sm,
		borderWidth: 1,
		borderColor: COLORS.secondaryDark,
	},
	downloadText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.secondaryDark,
		fontWeight: '600',
	},
	emptyState: {
		paddingVertical: SPACING_H.xxxxl,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
	},
	newBadge: {
		position: 'absolute',
		top: -scaleWidth(4),
		left: -scaleWidth(4),
		backgroundColor: COLORS.danger,
		borderRadius: RADIUS.sm,
		paddingHorizontal: SPACING_W.xs,
		paddingVertical: SPACING_H.xs,
		zIndex: 1,
	},
	newBadgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.xxs,
		fontWeight: '700',
		letterSpacing: 0.5,
	},
}));
