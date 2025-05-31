import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Linking, TouchableOpacity } from 'react-native';
import { scaleHeight, scaleWidth, scaledSize } from '@/utils/DementionUtils';
import Icon from 'react-native-vector-icons/Feather';

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
		<ScrollView contentContainerStyle={styles.content}>
			<View style={styles.wrapperBox}>
				{openSourceData.map((lib, index) => (
					<View key={index} style={styles.card}>
						<View style={styles.cardHeader}>
							<Icon name="package" size={16} color="#2c3e50" style={styles.icon} />
							<Text style={styles.libName}>{lib.name}</Text>
						</View>

						<Text style={styles.license}>
							License: {lib.license} | Version: {lib.version}
						</Text>

						<TouchableOpacity onPress={() => Linking.openURL(lib.url)} style={styles.linkWrapper}>
							<Icon name="external-link" size={14} color="#2980b9" />
							<Text style={styles.linkText}>GitHub 보기</Text>
						</TouchableOpacity>
					</View>
				))}

				<Text style={styles.footer}>🙏 오픈소스 커뮤니티에 감사드립니다.</Text>
			</View>
		</ScrollView>
	);
};

export default OpenSourceScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	content: {
		padding: scaleWidth(15),
		paddingBottom: scaleHeight(15),
	},
	title: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(20),
		textAlign: 'center',
	},
	card: {
		backgroundColor: '#f9f9f9',
		borderRadius: scaleWidth(10),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(16),
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(6),
	},
	icon: {
		marginRight: scaleWidth(6),
	},
	libName: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		color: '#34495e',
	},
	license: {
		fontSize: scaledSize(13),
		color: '#7f8c8d',
		marginBottom: scaleHeight(8),
	},
	linkWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	linkText: {
		fontSize: scaledSize(13),
		color: '#2980b9',
		marginLeft: 4,
		textDecorationLine: 'underline',
	},
	footer: {
		marginTop: scaleHeight(24),
		fontSize: scaledSize(13),
		color: '#95a5a6',
		textAlign: 'center',
	},
	wrapperBox: {
		backgroundColor: '#f4f5f7',
		borderWidth: 1,
		borderColor: '#dcdde1',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
	},
});
