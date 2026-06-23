/* eslint-disable react-native/no-inline-styles */
// 속담 상세 인라인 컨텐츠 (오늘의 퀴즈 해설 / 상세 모달 공통 사용)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from './atomic/IconComponent';

/**
 * 속담 상세 본문(공용)
 * - ProverbDetailModal 과 오늘의 퀴즈 해설에서 공통으로 사용해 표시를 일치시킵니다.
 * - 헤더 밴드/즐겨찾기/닫기 등 컨테이너 요소는 호출하는 쪽에서 감쌉니다.
 */

const CATEGORY_COLOR: Record<string, string> = {
	'운/우연': '#16a085',
	인간관계: '#8e44ad',
	'세상 이치': '#f4a259',
	'근면/검소': '#e17055',
	'노력/성공': '#27ae60',
	'경계/조심': '#e74c3c',
	'욕심/탐욕': '#e84393',
	'배신/불신': '#2c3e50',
};

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

const LEVEL_COLOR: Record<number, string> = {
	1: '#74b9ff',
	2: '#3498db',
	3: '#2980b9',
	4: '#2c3e50',
};

const getLevelIcon = (level: number) => {
	switch (level) {
		case 1:
			return <IconComponent type="FontAwesome6" name="seedling" size={scaledSize(13)} color="#fff" />;
		case 2:
			return <IconComponent type="FontAwesome6" name="leaf" size={scaledSize(13)} color="#fff" />;
		case 3:
			return <IconComponent type="FontAwesome6" name="tree" size={scaledSize(13)} color="#fff" />;
		case 4:
			return <IconComponent type="FontAwesome6" name="trophy" size={scaledSize(13)} color="#fff" />;
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
				<View style={[styles.levelBadge, { backgroundColor: LEVEL_COLOR[proverb.level] || '#bdc3c7' }]}>
					{getLevelIcon(proverb.level)}
					<Text style={styles.levelBadgeText}>{proverb.levelName}</Text>
				</View>
				<View style={[styles.badge2, { backgroundColor: CATEGORY_COLOR[proverb.category] || '#bdc3c7' }]}>
					{categoryIcon && <IconComponent type={categoryIcon.type} name={categoryIcon.name} size={scaledSize(13)} color="#fff" />}
					<Text style={[styles.badgeText, { marginLeft: scaleWidth(4) }]}>{proverb.category}</Text>
				</View>
			</View>

			{/* 의미 (강조 카드) */}
			<View style={[styles.modalSection, styles.modalSectionPrimary]}>
				<View style={styles.sectionLabelRow}>
					<View style={[styles.sectionAccent, { backgroundColor: '#3B82F6' }]} />
					<Text style={styles.modalLabel}>의미</Text>
				</View>
				<Text style={styles.modalTextStrong}>{proverb.longMeaning || proverb.meaning}</Text>
			</View>

			{/* 예시 */}
			{examples.length > 0 && (
				<View style={styles.modalSection}>
					<View style={styles.sectionLabelRow}>
						<View style={[styles.sectionAccent, { backgroundColor: '#22C55E' }]} />
						<Text style={styles.modalLabel}>예시</Text>
					</View>
					{examples.map((ex, idx) => (
						<Text key={idx} style={[styles.modalText2, idx > 0 && { marginTop: scaleHeight(6) }]}>
							• {ex}
						</Text>
					))}
				</View>
			)}

			{/* 동의 속담 */}
			{sameProverbs.length > 0 && (
				<View style={styles.modalSection}>
					<View style={styles.sectionLabelRow}>
						<View style={[styles.sectionAccent, { backgroundColor: '#F59E0B' }]} />
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
						<View style={[styles.sectionAccent, { backgroundColor: '#F97316' }]} />
						<Text style={styles.modalLabel}>유래</Text>
					</View>
					<Text style={styles.modalText2}>{proverb.origin}</Text>
				</View>
			)}

			{/* 활용 팁 */}
			{!!proverb.usageTip && (
				<View style={styles.modalSection}>
					<View style={styles.sectionLabelRow}>
						<View style={[styles.sectionAccent, { backgroundColor: '#9333EA' }]} />
						<Text style={styles.modalLabel}>활용 팁</Text>
					</View>
					<Text style={styles.modalText2}>{proverb.usageTip}</Text>
				</View>
			)}
		</View>
	);
};

export default ProverbDetailContent;

const styles = StyleSheet.create({
	titleWrap: {
		alignItems: 'center',
		marginBottom: scaleHeight(14),
	},
	titleProverb: {
		fontSize: scaledSize(19),
		fontWeight: 'bold',
		color: '#1E293B',
		textAlign: 'center',
		lineHeight: scaleHeight(27),
	},
	badgeRow: {
		flexDirection: 'row',
		gap: scaleWidth(8),
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
		flexWrap: 'wrap',
	},
	levelBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: scaleWidth(16),
		paddingVertical: scaleHeight(5),
		paddingHorizontal: scaleWidth(12),
	},
	levelBadgeText: {
		fontSize: scaledSize(13),
		color: '#fff',
		fontWeight: '700',
		marginLeft: scaleWidth(6),
	},
	badge2: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(12),
		paddingVertical: scaleHeight(5),
		borderRadius: scaleWidth(16),
	},
	badgeText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: '700',
	},
	modalSection: {
		marginBottom: scaleHeight(12),
		backgroundColor: '#F8FAFC',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(14),
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: '#EEF2F7',
	},
	modalSectionPrimary: {
		backgroundColor: '#EFF6FF',
		borderColor: '#DBEAFE',
	},
	sectionLabelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(8),
	},
	sectionAccent: {
		width: scaleWidth(4),
		height: scaledSize(16),
		borderRadius: scaleWidth(2),
		marginRight: scaleWidth(8),
	},
	modalLabel: {
		fontSize: scaledSize(15),
		fontWeight: '800',
		color: '#1E293B',
	},
	modalTextStrong: {
		fontSize: scaledSize(16),
		color: '#1E293B',
		fontWeight: '700',
		lineHeight: scaleHeight(25),
	},
	modalText2: {
		fontSize: scaledSize(14),
		color: '#475569',
		lineHeight: scaleHeight(23),
	},
	tagsWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: scaleWidth(8),
		marginTop: scaleHeight(2),
	},
	tagItem: {
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(5),
		borderRadius: scaleWidth(14),
		backgroundColor: '#FEF3C7',
	},
	tagText: {
		color: '#B45309',
		fontSize: scaledSize(12),
		fontWeight: '700',
	},
});
