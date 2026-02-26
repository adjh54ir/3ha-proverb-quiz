import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { Paths } from '@/navigation/conf/Paths';
import IconComponent from '@/screens/common/atomic/IconComponent';

const BottomHomeButton = ({ marginBottom = 0 }: { marginBottom?: number }) => {
	const navigation = useNavigation<any>();

	const goHome = () => {
		navigation.replace(Paths.MAIN_TAB, { screen: Paths.HOME });
	};

	return (
		<View style={[styles.wrapper, { marginBottom }]}>
			<TouchableOpacity style={styles.button} onPress={goHome} activeOpacity={0.85}>
				<IconComponent type="MaterialIcons" name="home" size={14} color="#4b5563" />
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

		paddingVertical: scaleHeight(10),
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(6),

		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: scaleWidth(22),

		paddingVertical: scaleHeight(9),
		paddingHorizontal: scaleWidth(22),

		backgroundColor: '#ffffff',
	},
	text: {
		fontSize: scaledSize(12),
		fontWeight: '600',
		color: '#374151',
	},
});
