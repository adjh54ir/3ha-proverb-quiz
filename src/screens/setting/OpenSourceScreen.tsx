import React from 'react';
import { ScrollView, StyleSheet, Text, View, Linking, TouchableOpacity } from 'react-native';
import { scaleHeight, scaledSize } from '@/utils/DementionUtils';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, FONT_SIZES, RADIUS, SPACING_H, SPACING_W } from '@/const/common/Theme';
import FadeInView from '@/components/animation/FadeInView';

const openSourceData = [
	{ name: 'React Native', license: 'MIT', version: '0.78.0', url: 'https://github.com/facebook/react-native' },
	{ name: 'react', license: 'MIT', version: '19.0.0', url: 'https://github.com/facebook/react' },
	{
		name: 'react-native-vector-icons',
		license: 'MIT',
		version: '10.2.0',
		url: 'https://github.com/oblador/react-native-vector-icons',
	},
	{
		name: 'react-native-version-check',
		license: 'MIT',
		version: '3.4.7',
		url: 'https://github.com/kimxogus/react-native-version-check',
	},
	{
		name: '@react-navigation/native',
		license: 'MIT',
		version: '7.0.15',
		url: 'https://github.com/react-navigation/react-navigation',
	},
	{
		name: '@react-native-async-storage/async-storage',
		license: 'MIT',
		version: '2.1.2',
		url: 'https://github.com/react-native-async-storage/async-storage',
	},
	{ name: 'axios', license: 'MIT', version: '1.8.3', url: 'https://github.com/axios/axios' },
	{ name: 'react-redux', license: 'MIT', version: '9.2.0', url: 'https://github.com/reduxjs/react-redux' },
];

const OpenSourceScreen = () => {
	return (
		<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
			<View style={styles.wrapperBox}>
				{openSourceData.map((lib, index) => (
					// 앞쪽 6개까지만 stagger — 그 뒤는 동시에 등장
					<FadeInView key={index} delay={Math.min(index, 5) * 40} offsetY={10}>
						<View style={styles.card}>
							<View style={styles.cardHeader}>
								<Icon name="package" size={scaledSize(16)} color={COLORS.textStrong} style={styles.icon} />
								<Text style={styles.libName}>{lib.name}</Text>
							</View>

							<Text style={styles.license}>
								License: {lib.license} | Version: {lib.version}
							</Text>

							<TouchableOpacity
								onPress={() => Linking.openURL(lib.url)}
								style={styles.linkWrapper}
								activeOpacity={0.8}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
								<Icon name="external-link" size={scaledSize(14)} color={COLORS.secondaryDark} />
								<Text style={styles.linkText}>GitHub 보기</Text>
							</TouchableOpacity>
						</View>
					</FadeInView>
				))}

				<Text style={styles.footer}>🙏 오픈소스 커뮤니티에 감사드립니다.</Text>
			</View>
		</ScrollView>
	);
};

export default OpenSourceScreen;

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.lg,
		paddingBottom: scaleHeight(40),
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
});
