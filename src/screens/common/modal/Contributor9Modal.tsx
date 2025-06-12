import React from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity, Linking, ScrollView, Platform } from 'react-native';
import { moderateScale, scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import IconComponent from '../atomic/IconComponent';

interface Props {
	visible: boolean;
	onClose: () => void;
}

/**
 * 개발자 팝업
 * Type1
 *
 *
		const [showDevInfo, setShowDevInfo] = useState(false);

	  <TouchableOpacity style={styles.hiddenDevTouchArea} onPress={() => setShowDevInfo(true)}>
		<Text style={styles.devText}>제작자 소개</Text>
	</TouchableOpacity>

	<Contributor9Modal visible={showDevModal} onClose={() => setShowDevInfo(false)} />


	hiddenDevTouchArea: {
		alignItems: 'center',
		marginTop: scaleHeight(10),
		marginBottom: scaleHeight(30),
		backgroundColor: 'transparent',
	},

	devText: {
		fontSize: scaledSize(12),
		color: '#999', // 흐릿한 회색
		textAlign: 'center',
	},

* Type2

	const [showDevModal, setShowDevModal] = useState(false);


	<TouchableOpacity style={styles.hiddenDevTouchArea} onPress={() => setShowDevModal(true)}>
		<Text style={styles.devText}>제작자 소개</Text>
	</TouchableOpacity>

	<Contributor9Modal visible={showDevModal} onClose={() => setShowDevModal(false)} />


	hiddenDevTouchArea: {
		alignSelf: 'center',
		width: scaleWidth(80),
		height: scaleWidth(30),
		borderRadius: scaleWidth(28), // 반지름도 줄임
		backgroundColor: '#F8F8F8', // 연한 회색 배경
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
		marginBottom: scaleHeight(30),
	},
	devText: {
		fontSize: scaledSize(13),
		color: '#999999', // 조금 더 진한 회색
		textAlign: 'center',
		fontWeight: '500',
	},
 *
 *
 * @param param0
 * @returns
 */

const Contributor9Modal = ({ visible, onClose }: Props) => {
	const handleOpenUrl = (url: string) => Linking.openURL(url);

	return (
		<Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.container}>
					<ScrollView contentContainerStyle={styles.scroll}>
						<View style={styles.profileSection}>
							<Image source={require('@/assets/images/developer.png')} style={styles.image} />
							<Text style={styles.name}>Contributor9</Text>
						</View>
						<View style={styles.rowItem}>
							<Text style={styles.labelText}>📱 개발자가 만든 앱 소개</Text>
							<TouchableOpacity
								style={styles.rightButton}
								activeOpacity={0.85}
								onPress={() => handleOpenUrl('https://adjh54.notion.site/1e816d47b05b80d08c29d5a039846dd6?pvs=4')}>
								<IconComponent type="materialIcons" name="apps" size={scaledSize(16)} color="#007AFF" />
								<Text style={styles.buttonText}>바로가기</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.rowItem}>
							<Text style={styles.labelText}>📝 개발자 블로그</Text>
							<TouchableOpacity style={styles.rightButton} activeOpacity={0.85} onPress={() => handleOpenUrl('https://adjh54.tistory.com/')}>
								<IconComponent type="materialIcons" name="language" size={scaledSize(16)} color="#007AFF" />
								<Text style={styles.buttonText}>방문하기</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.rowItem}>
							<Text style={styles.labelText}>💻 GitHub</Text>
							<TouchableOpacity style={styles.rightButton} activeOpacity={0.85} onPress={() => handleOpenUrl('https://github.com/adjh54ir')}>
								<IconComponent type="materialCommunityIcons" name="github" size={scaledSize(16)} color="#007AFF" />
								<Text style={styles.buttonText}>둘러보기</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.rowItem}>
							<Text style={styles.labelText}>📩 메일 문의</Text>
							<TouchableOpacity style={styles.rightButton} activeOpacity={0.85} onPress={() => handleOpenUrl('mailto:adjh54ir@gmail.com')}>
								<IconComponent type="materialIcons" name="email" size={scaledSize(16)} color="#007AFF" />
								<Text style={styles.buttonText}>보내기</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.footerText}>항상 더 좋은 앱을 만들기 위해 노력 중입니다. {'\n'}🙇‍♂️ 감사합니다! 🙇‍♂️</Text>

						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeText}>닫기</Text>
						</TouchableOpacity>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

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
		maxHeight: scaleHeight(680), // ✅ 기존 580 → 680 (또는 더 크게 조정 가능)
		backgroundColor: '#fff',
		borderRadius: moderateScale(16),
		paddingVertical: scaleHeight(24),
		paddingHorizontal: scaleWidth(20),
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 8,
	},
	scroll: {
		alignItems: 'center',
	},
	subtext: {
		fontSize: scaledSize(13),
		color: '#666',
		marginBottom: scaleHeight(20),
	},
	section: {
		fontSize: scaledSize(15),
		fontWeight: '600',
		alignSelf: 'flex-start',
		marginTop: scaleHeight(14),
		marginBottom: scaleHeight(20),
		color: '#444',
	},
	link: {
		fontSize: scaledSize(14),
		color: '#007AFF',
		alignSelf: 'flex-start',
		marginBottom: scaleHeight(10),
		textDecorationLine: 'underline',
	},
	closeButton: {
		marginTop: scaleHeight(24),
		backgroundColor: '#007AFF',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		borderRadius: moderateScale(12),
		alignSelf: 'center', // ✅ 중앙 정렬
		minWidth: scaleWidth(120), // ✅ 크기 제한
	},
	closeText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '600',
		textAlign: 'center',
	},
	linkButton: {
		backgroundColor: '#f0f4ff',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(16),
		borderRadius: moderateScale(10),
		marginBottom: scaleHeight(10),
		alignSelf: 'stretch',
	},
	linkButtonText: {
		color: '#007AFF',
		fontSize: scaledSize(14),
		fontWeight: '500',
		textAlign: 'center',
	},
	iconButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#f0f4ff',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(16),
		borderRadius: moderateScale(10),
		marginBottom: scaleHeight(10),
		alignSelf: 'center',
		minWidth: scaleWidth(220),
	},
	iconButtonText: {
		color: '#007AFF',
		fontSize: scaledSize(14),
		fontWeight: '500',
		marginLeft: scaleWidth(8),
	},
	icon: {
		marginRight: scaleWidth(4),
	},
	footerText: {
		fontSize: scaledSize(13),
		color: '#888',
		textAlign: 'center',
		marginTop: scaleHeight(16),
		lineHeight: scaleHeight(20),
	},
	inlineSection: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: scaleHeight(14),
		marginBottom: scaleHeight(20),
	},
	inlineButton: {
		marginLeft: scaleWidth(8),
	},
	inlineButtonText: {
		color: '#007AFF',
		fontSize: scaledSize(15),
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
	rowItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		paddingVertical: scaleHeight(10),
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
		marginBottom: scaleHeight(15),
	},
	labelText: {
		fontSize: scaledSize(15),
		color: '#333',
		fontWeight: '500',
	},
	rightButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f0f4ff',
		paddingVertical: scaleHeight(6),
		paddingHorizontal: scaleWidth(12),
		borderRadius: moderateScale(10),
	},
	buttonText: {
		color: '#007AFF',
		fontSize: scaledSize(14),
		fontWeight: '500',
		marginLeft: scaleWidth(6),
	},
	profileSection: {
		alignItems: 'center',
		marginBottom: scaleHeight(30),
	},
	image: {
		width: scaleWidth(100),
		height: scaleWidth(100),
		borderRadius: scaleWidth(50),
		borderWidth: 2,
		borderColor: '#eee',
		marginBottom: scaleHeight(8), // 기존보다 살짝 조정
	},
	name: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#222',
	},
	fixedCloseButton: {
		marginTop: scaleHeight(12),
		backgroundColor: '#007AFF',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(24),
		borderRadius: moderateScale(12),
		alignSelf: 'center',
		minWidth: scaleWidth(120),
		position: 'absolute',
		bottom: scaleHeight(20),
		zIndex: 10,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
});

export default Contributor9Modal;
