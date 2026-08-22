import React from 'react';
import { Animated, View, Text, Image, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { useModalEnter } from '@/hooks/useModalEnter';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import IconComponent from '../atomic/IconComponent';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';

interface Props {
	visible: boolean;
	onClose: () => void;
}

/**
 * 개발자 팝업 
 * Type1 
 * 
 * 
		const [showDevInfo, setShowDevInfo] = useState(false);
  
	  <TouchableOpacity style={styles.hiddenDevTouchArea} onPress={() => setShowDevInfo(true)}>
		<Text style={styles.devText}>제작자 소개</Text>
	</TouchableOpacity>

	<Contributor9Modal visible={showDevModal} onClose={() => setShowDevInfo(false)} />

	
	hiddenDevTouchArea: {
		alignItems: 'center',
		marginTop: SPACING_H.smPlus,
		marginBottom: SPACING_H.xxxl,
		backgroundColor: 'transparent',
	},

	devText: {
		fontSize: FONT_SIZES.sm,
		color: COLORS.textLight,
		textAlign: 'center',
	},

* Type2

	const [showDevModal, setShowDevModal] = useState(false);


	<TouchableOpacity style={styles.hiddenDevTouchArea} onPress={() => setShowDevModal(true)}>
		<Text style={styles.devText}>제작자 소개</Text>
	</TouchableOpacity>

	<Contributor9Modal visible={showDevModal} onClose={() => setShowDevModal(false)} />


	hiddenDevTouchArea: {
		alignSelf: 'center',
		width: scaleWidth(80),
		height: scaleWidth(30),
		borderRadius: scaleWidth(28), // 반지름도 줄임
		backgroundColor: COLORS.surfaceAlt,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.xxxl,
	},
	devText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		textAlign: 'center',
		fontWeight: '500',
	},
 * 
 * 
 * @param param0 
 * @returns 
 */

/** 프로필 링크 행 — 행 디자인 통일을 위해 데이터로 관리 */
const LINK_ROWS = [
	{ label: '🏠 공식 홈페이지', iconType: 'materialIcons', icon: 'home', action: '바로가기', url: 'https://www.ecodelab.im' },
	{
		label: '📱 개발자가 만든 앱 소개',
		iconType: 'materialIcons',
		icon: 'apps',
		action: '바로가기',
		url: 'https://adjh54.notion.site/1e816d47b05b80d08c29d5a039846dd6?pvs=4',
	},
	{ label: '📝 개발자 블로그', iconType: 'materialIcons', icon: 'language', action: '방문하기', url: 'https://adjh54.tistory.com/' },
	{ label: '💻 GitHub', iconType: 'materialCommunityIcons', icon: 'github', action: '둘러보기', url: 'https://github.com/adjh54ir' },
	{ label: '📩 메일 문의', iconType: 'materialIcons', icon: 'email', action: '보내기', url: 'mailto:adjh54ir@gmail.com' },
];

const Contributor9Modal = ({ visible, onClose }: Props) => {
	const handleOpenUrl = (url: string) => Linking.openURL(url);

	// 모달 공통 진입 애니메이션 (fade + scale)
	const enterStyle = useModalEnter(visible);

	return (
		<Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
			<View style={styles.overlay}>
				<Animated.View style={[styles.container, enterStyle]}>
					<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
						<View style={styles.profileSection}>
							<Image source={require('@/assets/images/developer.png')} style={styles.image} />
							<Text style={styles.name}>EcodeLab</Text>
							<Text style={styles.subName}>Contributor9</Text>
						</View>

						{LINK_ROWS.map((row, index) => (
							<View key={row.label} style={[styles.rowItem, index === LINK_ROWS.length - 1 && styles.rowItemLast]}>
								<Text style={styles.labelText}>{row.label}</Text>
								<TouchableOpacity style={styles.rightButton} activeOpacity={0.8} onPress={() => handleOpenUrl(row.url)}>
									<IconComponent type={row.iconType} name={row.icon} size={scaledSize(16)} color={COLORS.secondary} />
									<Text style={styles.buttonText}>{row.action}</Text>
								</TouchableOpacity>
							</View>
						))}

						<Text style={styles.footerText}>항상 더 좋은 앱을 만들기 위해 노력 중입니다. {'\n'}🙇‍♂️ 감사합니다! 🙇‍♂️</Text>

						<TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
							<Text style={styles.closeText}>닫기</Text>
						</TouchableOpacity>
					</ScrollView>
				</Animated.View>
			</View>
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
	container: {
		width: '100%',
		maxHeight: scaleHeight(680),
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.xl,
		paddingVertical: SPACING_H.xl,
		paddingHorizontal: SPACING_W.lg,
	},
	scroll: {
		alignItems: 'center',
		paddingBottom: SPACING_H.sm,
	},
	profileSection: {
		alignItems: 'center',
		marginBottom: SPACING_H.xl,
	},
	image: {
		width: scaleWidth(100),
		height: scaleWidth(100),
		borderRadius: scaleWidth(100) / 2,
		borderWidth: 1,
		borderColor: COLORS.border,
		marginBottom: SPACING_H.sm,
	},
	name: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
		marginBottom: SPACING_H.xs,
	},
	subName: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
	},
	// ── 링크 행 (설정 행 규격과 동일: 최소 높이 52) ──
	rowItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		minHeight: scaleHeight(52),
		paddingVertical: SPACING_H.sm,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	rowItemLast: {
		borderBottomWidth: 0,
	},
	labelText: {
		fontSize: FONT_SIZES.mdPlus,
		color: COLORS.text,
		fontWeight: '500',
		flexShrink: 1,
		marginRight: SPACING_W.md,
	},
	rightButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.secondaryBg,
		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.md,
		borderRadius: RADIUS.md,
	},
	buttonText: {
		color: COLORS.secondary,
		fontSize: FONT_SIZES.md,
		fontWeight: '600',
		marginLeft: SPACING_W.xs,
	},
	footerText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
		textAlign: 'center',
		marginTop: SPACING_H.lg,
		lineHeight: scaledSize(20),
	},
	closeButton: {
		marginTop: SPACING_H.xl,
		backgroundColor: COLORS.secondary,
		minHeight: scaleHeight(48),
		justifyContent: 'center',
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.xxl,
		borderRadius: RADIUS.md,
		alignSelf: 'stretch',
	},
	closeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.lg,
		fontWeight: '700',
		textAlign: 'center',
	},
}));

export default Contributor9Modal;
