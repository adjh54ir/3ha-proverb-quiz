import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scaledSize, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, HIT_SLOP, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import IconComponent from './atomic/IconComponent';

/**
 * 헤더를 직접 그리는 화면(즐겨찾기 / 나만의 속담집 / 속담집 상세)의 공통 헤더.
 *
 * 예전에는 화면마다 따로 만들어서 타이틀 크기가 xxl/xl/xl 로 갈리고,
 * 가운데 정렬 규칙도 화면마다 달라 탭을 오갈 때 타이틀이 미묘하게 움직였다.
 *
 * 레이아웃은 항상 [왼쪽 슬롯] [타이틀] [오른쪽 슬롯] 3칸이며, 양쪽 슬롯의
 * **최소 너비를 같게 고정**해 타이틀이 언제나 화면 정중앙에 온다.
 * (버튼이 한쪽에만 있어도 타이틀이 밀리지 않는다)
 */
interface ScreenHeaderProps {
	title: string;
	/** 뒤로가기 동작. 없으면 왼쪽은 빈 슬롯이 된다. */
	onBack?: () => void;
	/** 타이틀 오른쪽에 붙는 개수 뱃지 (예: '3/12') */
	countLabel?: string;
	/** 오른쪽 슬롯 (편집 버튼, 도움말 버튼 등) */
	right?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, countLabel, right }) => (
	<View style={styles.header}>
		<View style={styles.side}>
			{!!onBack && (
				<TouchableOpacity onPress={onBack} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel="뒤로 가기">
					<IconComponent type="materialIcons" name="arrow-back" size={scaledSize(22)} color={COLORS.text} />
				</TouchableOpacity>
			)}
		</View>

		<View style={styles.titleRow}>
			<Text style={styles.title} numberOfLines={1}>
				{title}
			</Text>
			{!!countLabel && (
				<View style={styles.countBadge}>
					<Text style={styles.countBadgeText}>{countLabel}</Text>
				</View>
			)}
		</View>

		<View style={[styles.side, styles.sideRight]}>{right}</View>
	</View>
);

export default ScreenHeader;

/** 좌우 슬롯 최소 너비 — 양쪽이 같아야 타이틀이 정중앙에 온다. */
const SIDE_SLOT_WIDTH = scaleWidth(64);

const styles = themedStyles(() =>
	StyleSheet.create({
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: SPACING_W.lg,
			paddingVertical: SPACING_H.md,
			backgroundColor: COLORS.surface,
			borderBottomWidth: 1,
			borderBottomColor: COLORS.surfaceAlt,
		},
		side: {
			minWidth: SIDE_SLOT_WIDTH,
			flexDirection: 'row',
			alignItems: 'center',
			columnGap: SPACING_W.sm,
		},
		sideRight: {
			justifyContent: 'flex-end',
		},
		titleRow: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			columnGap: SPACING_W.sm,
		},
		title: {
			fontSize: FONT_SIZES.xl,
			fontWeight: '700',
			color: COLORS.textStrong,
			letterSpacing: -0.3,
			flexShrink: 1,
			textAlign: 'center',
		},
		countBadge: {
			minWidth: scaleWidth(24),
			paddingHorizontal: SPACING_W.sm,
			paddingVertical: SPACING_H.xs,
			borderRadius: RADIUS.round,
			backgroundColor: COLORS.secondaryBg,
			alignItems: 'center',
		},
		countBadgeText: {
			fontSize: FONT_SIZES.sm,
			fontWeight: '700',
			color: COLORS.secondary,
		},
	}),
);
