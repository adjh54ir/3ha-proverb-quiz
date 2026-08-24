/* eslint-disable react-native/no-inline-styles */
// 속담 상세 인라인 컨텐츠 (오늘의 퀴즈 해설 / 상세 모달 공통 사용)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scaledSize, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { getCategoryColor, getLevelColorByNumber } from './CommonProverbModule';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from './atomic/IconComponent';

/**
 * 속담 상세 본문(공용)
 * - ProverbDetailModal 과 오늘의 퀴즈 해설에서 공통으로 사용해 표시를 일치시킵니다.
 * - 헤더 밴드/즐겨찾기/닫기 등 컨테이너 요소는 호출하는 쪽에서 감쌉니다.
 */

const CATEGORY_ICON: Record<string, { type: string; name: string }> = {
	'운/우연': { type: 'FontAwesome6', name: 'dice' },
	인간관계: { type: 'FontAwesome6', name: 'users' },
	'세상 이치': { type: 'FontAwesome5', name: 'globe' },
	'근면/검소': { type: 'FontAwesome5', name: 'hammer' },
	'노력/성공': { type: 'FontAwesome5', name: 'medal' },
	'경계/조심': { type: 'FontAwesome5', name: 'exclamation-triangle' },
	'욕심/탐욕': { type: 'FontAwesome5', name: 'hand-holding-usd' },
	'배신/불신': { type: 'FontAwesome5', name: 'user-slash' },
};

/** 레벨 번호 → 난이도 이름 (공통 난이도 램프 조회용) */

const getLevelIcon = (level: number) => {
	switch (level) {
		case 1:
			return <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(13)} color={COLORS.textWhite} />;
		case 2:
			return <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(13)} color={COLORS.textWhite} />;
		case 3:
			return <IconComponent type="FontAwesome6" name="tree" size={scaledSize(13)} color={COLORS.textWhite} />;
		case 4:
			return <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(13)} color={COLORS.textWhite} />;
		default:
			return null;
	}
};

interface ProverbDetailContentProps {
	proverb: MainDataType.Proverb;
	/** 본문 위에 속담 제목을 표시 */
	showTitle?: boolean;
}

const ProverbDetailContent: React.FC<ProverbDetailContentProps> = ({ proverb, showTitle = false }) => {
	const examples = Array.isArray(proverb.example) ? proverb.example.filter((e) => e.trim()) : [];
	const sameProverbs = Array.isArray(proverb.sameProverb) ? proverb.sameProverb.filter((p) => p.trim()) : [];
	const categoryIcon = CATEGORY_ICON[proverb.category];

	return (
		<View>
			{showTitle && (
				<View style={styles.titleWrap}>
					<Text style={styles.titleProverb}>{proverb.proverb}</Text>
				</View>
			)}

			{/* 배지: 난이도 + 카테고리 */}
			<View style={styles.badgeRow}>
				<View style={[styles.levelBadge, { backgroundColor: getLevelColorByNumber(proverb.level) }]}>
					{getLevelIcon(proverb.level)}
					<Text style={styles.levelBadgeText}>{proverb.levelName}</Text>
				</View>
				<View style={[styles.badge2, { backgroundColor: getCategoryColor(proverb.category) }]}>
					{categoryIcon && <IconComponent type={categoryIcon.type} name={categoryIcon.name} size={scaledSize(13)} color={COLORS.textWhite} />}
					<Text style={[styles.badgeText, { marginLeft: SPACING_W.xs }]}>{proverb.category}</Text>
				</View>
			</View>

			{/* 의미 (강조 카드) */}
			<View style={[styles.modalSection, styles.modalSectionPrimary]}>
				<View style={styles.sectionLabelRow}>
					<View style={[styles.sectionIconChip, { backgroundColor: COLORS.secondarySoft }]}>
						<IconComponent type="materialIcons" name="lightbulb" size={scaledSize(15)} color={COLORS.secondary} />
					</View>
					<Text style={styles.modalLabel}>의미</Text>
				</View>
				<Text style={styles.modalTextStrong}>{proverb.longMeaning || proverb.meaning}</Text>
			</View>

			{/* 예시 */}
			{examples.length > 0 && (
				<View style={styles.modalSection}>
					<View style={styles.sectionLabelRow}>
						<View style={[styles.sectionIconChip, { backgroundColor: COLORS.primarySoft }]}>
							<IconComponent type="materialIcons" name="format-quote" size={scaledSize(15)} color={COLORS.primary} />
						</View>
						<Text style={styles.modalLabel}>예시</Text>
					</View>
					{examples.map((ex, idx) => (
						<Text key={idx} style={[styles.modalText2, idx > 0 && { marginTop: SPACING_H.sm }]}>
							• {ex}
						</Text>
					))}
				</View>
			)}

			{/* 동의 속담 */}
			{sameProverbs.length > 0 && (
				<View style={styles.modalSection}>
					<View style={styles.sectionLabelRow}>
						<View style={[styles.sectionIconChip, { backgroundColor: COLORS.warningBg }]}>
							<IconComponent type="materialIcons" name="swap-horiz" size={scaledSize(15)} color={COLORS.warning} />
						</View>
						<Text style={styles.modalLabel}>동의 속담</Text>
					</View>
					<View style={styles.tagsWrapper}>
						{sameProverbs.map((word, idx) => (
							<View key={idx} style={styles.tagItem}>
								<Text style={styles.tagText}>{word}</Text>
							</View>
						))}
					</View>
				</View>
			)}

			{/* 유래 */}
			{!!proverb.origin && (
				<View style={styles.modalSection}>
					<View style={styles.sectionLabelRow}>
						<View style={[styles.sectionIconChip, { backgroundColor: COLORS.accentOrangeSoft }]}>
							<IconComponent type="materialIcons" name="auto-stories" size={scaledSize(15)} color={COLORS.accentFlame} />
						</View>
						<Text style={styles.modalLabel}>유래</Text>
					</View>
					<Text style={styles.modalText2}>{proverb.origin}</Text>
				</View>
			)}

			{/* 활용 팁 */}
			{!!proverb.usageTip && (
				<View style={styles.modalSection}>
					<View style={styles.sectionLabelRow}>
						<View style={[styles.sectionIconChip, { backgroundColor: COLORS.accentTealBg }]}>
							<IconComponent type="materialIcons" name="tips-and-updates" size={scaledSize(15)} color={COLORS.accentTeal} />
						</View>
						<Text style={styles.modalLabel}>활용 팁</Text>
					</View>
					<Text style={styles.modalText2}>{proverb.usageTip}</Text>
				</View>
			)}
		</View>
	);
};

export default ProverbDetailContent;

const styles = themedStyles(() => StyleSheet.create({
	titleWrap: {
		alignItems: 'center',
		marginBottom: SPACING_H.md,
	},
	titleProverb: {
		fontSize: FONT_SIZES.xl,
		fontWeight: '700',
		color: COLORS.textStrong,
		textAlign: 'center',
		lineHeight: scaledSize(27),
	},
	badgeRow: {
		flexDirection: 'row',
		gap: SPACING_W.sm,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: SPACING_H.lg,
		flexWrap: 'wrap',
	},
	levelBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: RADIUS.round,
		paddingVertical: SPACING_H.xs,
		paddingHorizontal: SPACING_W.md,
	},
	levelBadgeText: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textWhite,
		fontWeight: '700',
		marginLeft: SPACING_W.xs,
	},
	badge2: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
	},
	badgeText: {
		color: COLORS.textWhite,
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
	modalSection: {
		marginBottom: SPACING_H.md,
		backgroundColor: COLORS.background,
		paddingVertical: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	modalSectionPrimary: {
		backgroundColor: COLORS.secondaryBg,
		borderColor: COLORS.secondarySoft,
	},
	sectionLabelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	sectionIconChip: {
		width: scaleWidth(26),
		height: scaleWidth(26),
		borderRadius: RADIUS.sm,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: SPACING_W.sm,
	},
	modalLabel: {
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '700',
		color: COLORS.textStrong,
	},
	modalTextStrong: {
		fontSize: FONT_SIZES.lg,
		color: COLORS.textStrong,
		fontWeight: '700',
		lineHeight: scaledSize(25),
	},
	modalText2: {
		fontSize: FONT_SIZES.md,
		color: COLORS.text,
		lineHeight: scaledSize(23),
	},
	tagsWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: SPACING_W.sm,
		marginTop: SPACING_H.xs,
	},
	tagItem: {
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.warningBg,
	},
	tagText: {
		color: COLORS.warningDeep,
		fontSize: FONT_SIZES.sm,
		fontWeight: '700',
	},
}));
