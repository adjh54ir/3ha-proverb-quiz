import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { Paths } from '@/navigation/conf/Paths';
import IconComponent from '@/screens/common/atomic/IconComponent';
import { COLORS, FONT, RADIUS } from '@/theme/theme';

const BottomHomeButton = ({ marginBottom = 0 }: { marginBottom?: number }) => {
	const navigation = useNavigation<any>();

	const goHome = () => {
		navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
	};

	return (
		<View style={[styles.wrapper, { marginBottom }]}>
			<TouchableOpacity style={styles.button} onPress={goHome} activeOpacity={0.85}>
				<IconComponent type="MaterialIcons" name="home" size={16} color={COLORS.primary} />
				<Text style={styles.text}>홈으로 가기</Text>
			</TouchableOpacity>
		</View>
	);
};

export default BottomHomeButton;

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
	wrapper: {
		alignItems: 'center',

		paddingVertical: scaleHeight(10),
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: scaleWidth(6),

		borderWidth: 1,
		borderColor: COLORS.primary,
		borderRadius: scaleWidth(RADIUS.pill),

		paddingVertical: scaleHeight(11),
		paddingHorizontal: scaleWidth(28),

		backgroundColor: COLORS.bg,
	},
	text: {
		fontSize: scaledSize(FONT.sm),
		fontWeight: '700',
		color: COLORS.primary,
	},
});
