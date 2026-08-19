import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { Paths } from '@/navigation/conf/Paths';
import IconComponent from '@/screens/common/atomic/IconComponent';

import { SPACING_W, SPACING_H } from '@/const/common/Theme';
const BottomHomeButton = ({ marginBottom = 0 }: { marginBottom?: number }) => {
	const navigation = useNavigation<any>();

	const goHome = () => {
		navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
	};

	return (
		<View style={[styles.wrapper, { marginBottom }]}>
			<TouchableOpacity style={styles.button} onPress={goHome} activeOpacity={0.85}>
				<IconComponent type="MaterialIcons" name="home" size={scaledSize(14)} color="#4b5563" />
				<Text style={styles.text}>HOME</Text>
			</TouchableOpacity>
		</View>
	);
};

export default BottomHomeButton;

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
	wrapper: {
		alignItems: 'center',

		paddingVertical: SPACING_H.smPlus,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: SPACING_W.xsPlus,

		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: scaleWidth(20),

		paddingVertical: SPACING_H.sm,
		paddingHorizontal: SPACING_W.xxl,

		backgroundColor: '#ffffff',
	},
	text: {
		fontSize: scaledSize(12),
		fontWeight: '600',
		color: '#2c3e50',
	},
});
