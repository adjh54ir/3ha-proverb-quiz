import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const CapitalListScreen = () => {
	const [loading, setLoading] = useState<boolean>(true);

	return (
		<>
			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator size='large' color='#0000ff' />
					<Text>속담 정보를 불러오는 중입니다...</Text>
				</View>
			) : null}
		</>
	);
};
export default CapitalListScreen;

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
