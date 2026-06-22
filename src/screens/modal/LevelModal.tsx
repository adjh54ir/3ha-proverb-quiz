/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect, useMemo } from 'react';
import { View, Modal, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { LEVEL_DATA } from '@/const/ConstInfoData';

interface LevelModalProps {
	visible: boolean;
	totalScore: number;
	onClose: () => void;
}

const LevelModal: React.FC<LevelModalProps> = ({ visible, totalScore, onClose }) => {
	const levelScrollRef = useRef<ScrollView>(null);
	const cardHeightsRef = useRef<number[]>([]); // ✅ 각 카드의 높이 저장

	// 역순 정렬된 데이터
	const reversedLevelData = useMemo(() => [...LEVEL_DATA].reverse(), []);

	/**
	 * 위치에 맞게 스크롤 이동
	 */
	useEffect(() => {
		if (visible && levelScrollRef.current) {
			const currentLevelIndex = reversedLevelData.findIndex((item) => totalScore >= item.score && totalScore < item.next);

			if (currentLevelIndex !== -1) {
				// ✅ 더 긴 딜레이와 정확한 높이 계산
				setTimeout(() => {
					// 각 카드의 높이: 마스코트(160) + 패딩 + 텍스트 영역 + 마진
					// 현재 등급 카드는 배지가 있어서 더 높음
					const estimatedCardHeight = scaleHeight(280); // 예상 카드 높이
					const scrollY = currentLevelIndex * estimatedCardHeight;

					levelScrollRef.current?.scrollTo({
						y: scrollY,
						animated: true,
					});
				}, 300); // ✅ 딜레이를 300ms로 증가
			}
		}
	}, [visible, totalScore, reversedLevelData]);

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<View style={[styles.levelModal, { maxHeight: scaleHeight(600) }]}>
					<Text style={styles.levelModalTitle}>등급 안내</Text>

					<ScrollView
						ref={levelScrollRef}
						style={{ width: '100%' }}
						contentContainerStyle={{ paddingBottom: scaleHeight(12) }}
						showsVerticalScrollIndicator={false}>
						{reversedLevelData.map((item, index) => {
							const isCurrent = totalScore >= item.score && totalScore < item.next;
							return (
								<View
									key={item.label}
									style={[styles.levelCardBox, isCurrent && styles.levelCardBoxActive]}
									onLayout={(event) => {
										// ✅ 실제 높이를 측정하여 저장
										const { height } = event.nativeEvent.layout;
										cardHeightsRef.current[index] = height;
									}}>
									{isCurrent && (
										<View style={styles.levelBadge}>
											<Text style={styles.levelBadgeText}>🏆 현재 등급</Text>
										</View>
									)}
									<FastImage source={item.mascot} style={styles.levelMascot} resizeMode={FastImage.resizeMode.contain} />
									<Text style={styles.levelLabel}>{item.label}</Text>
									<Text style={styles.levelScore}>{item.score}점 이상</Text>
									{isCurrent && <Text style={styles.levelEncourage}>{item.encouragement}</Text>}
									<Text style={styles.levelDetailDescription}>{item.description}</Text>
								</View>
							);
						})}
					</ScrollView>

					<TouchableOpacity onPress={onClose} style={styles.modalConfirmButton}>
						<Text style={styles.modalConfirmText}>닫기</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};

export default LevelModal;

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	levelModal: {
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(20),
		paddingTop: scaleHeight(20),
		paddingBottom: scaleHeight(12),
		borderRadius: scaleWidth(16),
		width: '85%',
		alignItems: 'center',
	},
	levelModalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		marginBottom: scaleHeight(12),
		color: '#334155',
	},
	levelCardBox: {
		backgroundColor: '#fdfdfd',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(16),
		alignItems: 'center',
		marginBottom: scaleHeight(14),
		width: '100%',
		borderWidth: 1,
		borderColor: '#ececec',
	},
	levelCardBoxActive: {
		backgroundColor: '#eafaf1',
		borderColor: '#2ecc71',
		borderWidth: 2,
	},
	levelBadge: {
		backgroundColor: '#27ae60',
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(4),
		borderRadius: scaleWidth(12),
		marginBottom: scaleHeight(8),
	},
	levelBadgeText: {
		color: '#fff',
		fontSize: scaledSize(12),
		fontWeight: 'bold',
	},
	levelMascot: {
		width: scaleWidth(100),
		height: scaleWidth(100),
		borderRadius: scaleWidth(50),
		marginBottom: scaleHeight(10),
	},
	levelLabel: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(2),
	},
	levelScore: {
		fontSize: scaledSize(13),
		color: '#64748B',
	},
	levelEncourage: {
		fontSize: scaledSize(13),
		color: '#27ae60',
		marginTop: scaleHeight(6),
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	levelDetailDescription: {
		fontSize: scaledSize(12),
		color: '#64748B',
		textAlign: 'center',
		marginTop: scaleHeight(6),
		lineHeight: scaleHeight(18),
	},
	modalConfirmButton: {
		backgroundColor: '#27ae60',
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(20),
		borderRadius: scaleWidth(8),
		marginTop: scaleHeight(20),
		alignSelf: 'center',
	},
	modalConfirmText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: scaledSize(14),
		textAlign: 'center',
	},
});
