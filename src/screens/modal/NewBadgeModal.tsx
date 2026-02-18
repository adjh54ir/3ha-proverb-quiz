/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import ConfettiCannon from 'react-native-confetti-cannon';
import { scaleWidth, scaleHeight, scaledSize } from '@/utils/DementionUtils';
import { MainDataType } from '@/types/MainDataType';
import IconComponent from '../common/atomic/IconComponent';

const { width: screenWidth } = Dimensions.get('window');

interface BadgeModalProps {
	visible: boolean;
	badges: MainDataType.UserBadge[];
	onConfirm: () => void;
}

const NewBadgeModal: React.FC<BadgeModalProps> = ({ visible, badges, onConfirm }) => {
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const confettiKey = useRef(0);

	useEffect(() => {
		if (visible) {
			confettiKey.current = Math.random();
			scaleAnim.setValue(0);
			fadeAnim.setValue(0);
			Animated.parallel([
				Animated.spring(scaleAnim, {
					toValue: 1,
					useNativeDriver: true,
					bounciness: 14,
				}),
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible]);

	const handleConfirm = () => {
		Animated.timing(scaleAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			onConfirm();
		});
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<ConfettiCannon key={confettiKey.current} count={100} origin={{ x: screenWidth / 2, y: 0 }} fadeOut autoStart explosionSpeed={350} />

				<Animated.View style={[styles.badgeModal, { transform: [{ scale: scaleAnim }] }]}>
					<Text style={styles.badgeModalTitle}>🎉 새로운 뱃지를 획득했어요!</Text>
					<ScrollView style={{ maxHeight: scaleHeight(400), width: '100%' }} contentContainerStyle={{ paddingHorizontal: scaleHeight(12) }}>
						{badges.map((badge, index) => (
							<View key={index} style={[styles.badgeCard, styles.badgeCardActive]}>
								{badge.mascotImage ? (
									<>
										<View style={styles.mascotImageWrapper}>
											<FastImage source={badge.mascotImage} style={styles.mascotImageImproved} resizeMode={FastImage.resizeMode.contain} />
											<View style={styles.badgeTextCenteredWrap}>
												<Text style={styles.badgeNameCentered}>{badge.name}</Text>
												<Text style={styles.badgeDescriptionCentered}>{badge.description}</Text>
											</View>
										</View>
									</>
								) : (
									<View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
										<View style={[styles.iconBox, styles.iconBoxActive]}>
											<IconComponent type={badge.iconType} name={badge.icon} size={20} color={'#27ae60'} />
										</View>
										<View style={styles.badgeTextWrap}>
											<Text style={[styles.badgeName, styles.badgeTitleActive]}>{badge.name}</Text>
											<Text style={[styles.badgeDescription, styles.badgeDescActive]}>{badge.description}</Text>
										</View>
									</View>
								)}
							</View>
						))}
					</ScrollView>
					<TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirm}>
						<Text style={styles.modalConfirmText}>확인</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: scaleHeight(40),
	},
	badgeModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(20),
		borderRadius: scaleWidth(20),
		width: '85%',
		maxHeight: '80%',
		alignItems: 'center',
	},
	badgeModalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: scaleHeight(16),
		textAlign: 'center',
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#f9f9f9',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(12),
		marginBottom: scaleHeight(10),
		borderWidth: 1,
		borderColor: '#ddd',
		width: '100%',
	},
	badgeCardActive: {
		borderColor: '#27ae60',
		backgroundColor: '#f0fbf4',
	},
	iconBox: {
		width: scaleWidth(32),
		height: scaleWidth(32),
		borderRadius: scaleWidth(16),
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: scaleWidth(12),
	},
	iconBoxActive: {
		backgroundColor: '#d0f0dc',
	},
	badgeTitleActive: {
		color: '#27ae60',
	},
	badgeDescActive: {
		color: '#2d8659',
	},
	badgeName: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#27ae60',
		marginBottom: scaleHeight(2),
	},
	badgeTextWrap: {
		flexShrink: 1,
		flexGrow: 1,
		minWidth: 0,
		maxWidth: '85%',
	},
	badgeDescription: {
		fontSize: scaledSize(14),
		color: '#7f8c8d',
		lineHeight: scaleHeight(20),
		flexShrink: 1,
		flexWrap: 'wrap',
		width: '100%',
	},
	mascotImageWrapper: {
		width: '100%',
		alignItems: 'center',
		marginBottom: scaleHeight(12),
	},
	mascotImageImproved: {
		width: scaleWidth(80),
		height: scaleWidth(80),
		borderRadius: scaleWidth(40),
		backgroundColor: '#fff',
		borderWidth: 2,
		borderColor: '#27ae60',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	badgeTextCenteredWrap: {
		alignItems: 'center',
		marginTop: scaleHeight(4),
		paddingHorizontal: scaleWidth(8),
	},
	badgeNameCentered: {
		fontSize: scaledSize(17),
		fontWeight: 'bold',
		color: '#27ae60',
		textAlign: 'center',
		marginBottom: scaleHeight(4),
	},
	badgeDescriptionCentered: {
		fontSize: scaledSize(14),
		color: '#2d8659',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	modalConfirmButton: {
		backgroundColor: '#2980b9',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(24),
		borderRadius: scaleWidth(30),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	modalConfirmText: {
		color: '#fff',
		fontSize: scaledSize(16),
		fontWeight: '600',
	},
});

export default NewBadgeModal;
