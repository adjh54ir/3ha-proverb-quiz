import React from 'react';
import { ScrollView, StyleSheet, Text, View, Linking, TouchableOpacity } from 'react-native';
import { scaleHeight, scaledSize } from '@/utils/DementionUtils';
import Icon from 'react-native-vector-icons/Feather';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W, themedStyles } from '@/const/common/Theme';
import FadeInView from '@/components/animation/FadeInView';
import { OPEN_SOURCE_LIBS } from '@/const/common/OpenSourceData';


const OpenSourceScreen = () => {
	return (
		<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
			<View style={styles.wrapperBox}>
				<Text style={styles.summary}>이 앱은 아래 {OPEN_SOURCE_LIBS.length}개의 오픈소스를 사용합니다.</Text>
				{OPEN_SOURCE_LIBS.map((lib, index) => (
					// 앞쪽 6개까지만 stagger — 그 뒤는 동시에 등장
					<FadeInView key={lib.name} delay={Math.min(index, 5) * 40} offsetY={10}>
						<View style={styles.card}>
							<View style={styles.cardHeader}>
								<Icon name="package" size={scaledSize(16)} color={COLORS.textStrong} style={styles.icon} />
								<Text style={styles.libName} numberOfLines={1} ellipsizeMode="tail">
									{lib.name}
								</Text>
							</View>

							<Text style={styles.license}>
								License: {lib.license} | Version: {lib.version}
							</Text>

							{!!lib.url && (
							<TouchableOpacity
								onPress={() => Linking.openURL(lib.url)}
								style={styles.linkWrapper}
								activeOpacity={0.8}
								hitSlop={HIT_SLOP}>
								<Icon name="external-link" size={scaledSize(14)} color={COLORS.secondaryDark} />
								<Text style={styles.linkText}>GitHub 보기</Text>
							</TouchableOpacity>
							)}
						</View>
					</FadeInView>
				))}

				<Text style={styles.footer}>🙏 오픈소스 커뮤니티에 감사드립니다.</Text>
			</View>
		</ScrollView>
	);
};

export default OpenSourceScreen;

const styles = themedStyles(() => StyleSheet.create({
	content: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.lg,
		paddingBottom: SPACING_H.xxxxl,
		backgroundColor: COLORS.surface,
	},
	card: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING_H.sm,
	},
	icon: {
		marginRight: SPACING_W.sm,
	},
	libName: {
		flexShrink: 1,
		fontSize: FONT_SIZES.mdPlus,
		fontWeight: '600',
		color: COLORS.textStrong,
	},
	license: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.sm,
	},
	linkWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	linkText: {
		fontSize: FONT_SIZES.smPlus,
		fontWeight: '500',
		color: COLORS.secondaryDark,
		marginLeft: SPACING_W.xs,
		textDecorationLine: 'underline',
	},
	summary: {
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textSecondary,
		marginBottom: SPACING_H.md,
	},
	footer: {
		marginTop: SPACING_H.xl,
		fontSize: FONT_SIZES.smPlus,
		color: COLORS.textLight,
		textAlign: 'center',
	},
	wrapperBox: {
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.lg,
	},
}));
