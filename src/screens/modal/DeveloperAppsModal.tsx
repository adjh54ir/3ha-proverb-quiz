import React from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	Image,
	StyleSheet,
	ScrollView,
	Platform,
	Alert,
	Linking,
} from 'react-native';
import { moderateScale, scaleHeight, scaleWidth, scaledSize } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';
import { CommonType } from '@/types/CommonType';
import { COMMON_APPS_DATA } from '@/const/common/CommonAppsData';

interface Props {
	visible: boolean;
	onClose: () => void;
}

const DeveloperAppsModal = ({ visible, onClose }: Props) => {
	const getDownloadUrl = (app: CommonType.AppItem) => {
		const primary = Platform.OS === 'android' ? app.android : app.ios;
		const fallback = Platform.OS === 'android' ? app.ios : app.android;
		return primary || fallback || null;
	};

	const onDownloadApp = async (app: CommonType.AppItem) => {
		const url = getDownloadUrl(app);
		if (!url) {
			Alert.alert('Comming Soon..!', '아직 스토어 링크가 준비되지 않았습니다.');
			return;
		}
		try {
			const supported = await Linking.canOpenURL(url);
			if (!supported) {
				Alert.alert('오류', '링크를 열 수 없습니다.');
				return;
			}
			Linking.openURL(url);
		} catch {
			Alert.alert('오류', '링크를 여는 중 문제가 발생했습니다.');
		}
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.container}>
					{/* 헤더 */}
					<View style={styles.headerRow}>
						<View style={{ flex: 1, alignItems: 'center' }}>
							<Text style={styles.titleText}>📱 제작자의 다른 앱</Text>
						</View>
						<TouchableOpacity style={styles.closeButton} onPress={onClose}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>
					</View>

					{/* 리스트 */}
					<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
						{COMMON_APPS_DATA.Apps.map((app) => (
							<View key={app.id} style={styles.appCard}>
								{/* 아이콘 */}
								<Image source={app.icon} style={styles.image} resizeMode="contain" />

								{/* 텍스트 */}
								<Text style={styles.appTitle}>{app.title}</Text>
								<Text style={styles.appDesc} numberOfLines={2}>
									{app.desc}
								</Text>

								{/* 다운로드 버튼 */}
								<TouchableOpacity style={styles.downloadButton} onPress={() => onDownloadApp(app)}>
									<IconComponent type="MaterialCommunityIcons" name="download" size={scaledSize(18)} color="#fff" />
									<Text style={styles.buttonText}>다운로드</Text>
								</TouchableOpacity>
							</View>
						))}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

export default DeveloperAppsModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(20),
	},
	container: {
		width: '100%',
		maxHeight: scaleHeight(680),
		backgroundColor: '#fff',
		borderRadius: moderateScale(16),
		paddingVertical: scaleHeight(24),
		paddingHorizontal: scaleWidth(20),
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 8,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(12),
	},
	titleText: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#1a1a1a',
		textAlign: 'left',
		flexShrink: 1,
	},
	closeButton: {
		padding: scaleWidth(6),
	},
	closeText: {
		fontSize: scaledSize(22),
		color: '#555',
		fontWeight: 'bold',
	},
	textArea: {
		flex: 1,
		marginBottom: scaleHeight(8),
	},
	buttonRow: {
		flexDirection: 'row',
		marginTop: scaleHeight(10),
		width: '100%',
		justifyContent: 'center',
	},
	scroll: {
		paddingVertical: scaleHeight(8),
		paddingBottom: scaleHeight(20),
	},

	appCard: {
		width: '100%',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 16,
		paddingVertical: scaleHeight(20),
		paddingHorizontal: scaleWidth(16),
		marginBottom: scaleHeight(16),
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 3 },
		shadowRadius: 6,
	},

	image: {
		width: scaleWidth(72),
		height: scaleWidth(72),
		borderRadius: 16,
		marginBottom: scaleHeight(12),
	},

	appTitle: {
		fontSize: scaledSize(17),
		fontWeight: '600',
		color: '#222',
		marginBottom: scaleHeight(6),
		textAlign: 'center',
	},

	appDesc: {
		fontSize: scaledSize(13),
		color: '#666',
		textAlign: 'center',
		marginBottom: scaleHeight(14),
		lineHeight: scaleHeight(18),
	},

	downloadButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '90%',
		paddingVertical: scaleHeight(12),
		borderRadius: 10,
		backgroundColor: '#0D96F6',
	},

	buttonText: {
		color: '#fff',
		fontWeight: '600',
		marginLeft: scaleWidth(6),
		fontSize: scaledSize(14),
	},
});
