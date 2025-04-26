import { SupportedLanguages } from '@/hooks/language/schema';
import { useI18n } from '@/hooks/language/useI18n';
import React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';

const LanguageScreen = () => {
	const { t } = useTranslation();
	const { toggleLanguage, changeLanguage } = useI18n();

	const languageButtons = [
		{ code: SupportedLanguages.KR_KR, label: '한국어' },
		{ code: SupportedLanguages.EN_EN, label: 'English' },
		{ code: SupportedLanguages.FR_FR, label: 'Français' },
	];

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>{t('screen_example.title')}</Text>
				<Text style={styles.description}>{t('screen_example.description')}</Text>

				<View style={styles.languageButtonGroup}>
					{languageButtons.map((lang) => (
						<TouchableOpacity
							key={lang.code}
							style={styles.languageButton}
							onPress={() => changeLanguage(lang.code)}
							testID={`change-language-button-${lang.code}`}>
							<FontAwesome6Icon name='language' size={24} color='#FFFFFF' />
							<Text style={styles.buttonText}>{lang.label}</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			<TouchableOpacity style={styles.languageButton} onPress={toggleLanguage} testID='change-language-button'>
				<FontAwesome6Icon name='language' size={24} color='#FFFFFF' />
			</TouchableOpacity>
		</View>
	);
};
export default LanguageScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		padding: 20,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#333333',
		marginBottom: 16,
	},
	description: {
		fontSize: 16,
		color: '#666666',
		textAlign: 'center',
		lineHeight: 24,
	},
	languageButtonGroup: {
		flexDirection: 'row',
		marginTop: 20,
		gap: 12,
	},
	languageButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FF3B30',
		padding: 16,
		borderRadius: 12,
		gap: 8,
		minWidth: 80,
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
});
