import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/conf/Paths';
import { useIsFocused } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import ProverbDetailModal from './modal/ProverbDetailModal';
import FastImage from 'react-native-fast-image';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils/DementionUtils';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { useBlockBackHandler } from '@/hooks/useBlockBackHandler';

const STORAGE_KEY = MainStorageKeyType.USER_QUIZ_HISTORY;

const WrongReviewScreen = () => {
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const [loading, setLoading] = useState(true);
	const scrollViewRef = useRef<ScrollView>(null);
	const [wrongProverbIds, setWrongProverbIds] = useState<MainDataType.Proverb[]>([]);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [showGuideModal, setShowGuideModal] = useState(false);
	const [totalSolvedCount, setTotalSolvedCount] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [showWrongList, setShowWrongList] = useState(false);
	const [detailProverb, setDetailProverb] = useState<MainDataType.Proverb | null>(null);
	const [detailVisible, setDetailVisible] = useState(false);

	useBlockBackHandler(true); // 뒤로가기 모션 막기

	useEffect(() => {
		if (!isFocused) {
			return;
		}
		fetchWrongData();
	}, [isFocused]);

	const fetchWrongData = async () => {
		setLoading(true);
		try {
			const stored = await AsyncStorage.getItem(STORAGE_KEY);
			if (!stored) {
				setWrongProverbIds([]);
				return;
			}
			const parsed: MainDataType.UserQuizHistory = JSON.parse(stored);
			const wrongCca3List: number[] = parsed.wrongProverbId ?? [];
			const correctCca3List: number[] = parsed.correctProverbId ?? [];
			setTotalSolvedCount(wrongCca3List.length + correctCca3List.length);
			setCorrectCount(correctCca3List.length);

			const fullList = ProverbServices.selectProverbList();
			const result = fullList.filter((c) => wrongCca3List.includes(c.id));
			console.log('result : ', result);
			setWrongProverbIds(result);
		} catch (e) {
			console.error('오답 로딩 실패:', e);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * 스크롤을 움직일때 동작을 합니다. 하단으로 스크롤을 내릴때 아이콘 생성
	 * @param event
	 */
	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 100);
	};

	const startWrongReview = () => {
		const titleMap = {
			all: '전체 퀴즈',
			beginner: '초급 퀴즈',
			intermediate: '중급 퀴즈',
			advanced: '고급 퀴즈',
			expert: '특급 퀴즈',
		};

		if (wrongProverbIds.length === 0) {
			return;
		}

		// @ts-ignore
		navigation.push(Paths.QUIZ, {
			questionPool: wrongProverbIds,
			isWrongReview: true,
			title: '오답 복습',
			mode: 'meaning',
			selectedLevel: '전체',
			levelKey: 'all',
		});
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color="#22C55E" />
			</View>
		);
	}

	if (wrongProverbIds.length === 0) {
		return (
			<View style={styles.emptyWrap}>
				<View style={styles.emptyCard}>
					<FastImage
						source={require('@/assets/images/correct_mascote.png')}
						style={styles.emptyMascot}
						resizeMode="contain"
					/>
					<Text style={styles.emptyTitle}>틀린 문제가 없어요! 🎉</Text>
					<Text style={styles.emptyDesc}>
						아직 오답으로 기록된 속담이 없어요.{'\n'}
						퀴즈를 풀다가 틀린 문제가 생기면{'\n'}
						이곳에서 모아 다시 복습할 수 있어요.
					</Text>
				</View>
			</View>
		);
	}

	const accuracy = totalSolvedCount > 0 ? Math.round((correctCount / totalSolvedCount) * 100) : 0;

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#fff', marginTop: scaleHeight(-15) }} edges={['bottom']}>
			<ScrollView contentContainerStyle={styles.scrollContainer} ref={scrollViewRef} onScroll={handleScroll}>
				<View style={styles.activityCardBox}>
					{/* ✅ 컴팩트 통계 카드 */}
					<View style={styles.statsCard}>
						<View style={styles.statsItem}>
							<Text style={styles.statsValue}>{totalSolvedCount}</Text>
							<Text style={styles.statsLabel}>푼 문제</Text>
						</View>
						<View style={styles.statsDivider} />
						<View style={styles.statsItem}>
							<Text style={[styles.statsValue, { color: '#EF4444' }]}>{wrongProverbIds.length}</Text>
							<Text style={styles.statsLabel}>오답</Text>
						</View>
						<View style={styles.statsDivider} />
						<View style={styles.statsItem}>
							<Text style={[styles.statsValue, { color: '#16A34A' }]}>{accuracy}%</Text>
							<Text style={styles.statsLabel}>정답률</Text>
						</View>
					</View>

					{/* ✅ 격려 메시지 */}
					<Text style={styles.encourageText}>
						지금까지 <Text style={styles.encourageHighlight}>{totalSolvedCount}</Text>문제를 풀었고,{' '}
						<Text style={styles.encourageHighlight}>{wrongProverbIds.length}</Text>문제가 남았어요.{'\n'}한 번 더 도전해볼까요? 💪
					</Text>

					{/* ✅ 안내 */}
					<View style={styles.guideCard}>
						<Text style={styles.guideCardTitle}>📘 오답 복습이란?</Text>
						<Text style={styles.guideCardContent}>
							• 틀린 문제를 다시 풀고, <Text style={styles.guideHighlight}>정답</Text>을 맞히면 목록에서 자동으로 사라져요.{'\n'}•
							항상 <Text style={styles.guideHighlight}>뜻 맞추기</Text>로 출제되며, 정답 시 <Text style={styles.guideHighlight}>10점</Text>을
							받아요 🎯{'\n'}• 다시 틀려도 걱정 마세요. 반복하며 실력을 쌓을 수 있어요! 🔄
						</Text>
					</View>

					<TouchableOpacity style={styles.startButton} onPress={startWrongReview} activeOpacity={0.85}>
						<IconComponent type="MaterialIcons" name="refresh" size={scaledSize(18)} color="#fff" style={{ marginRight: scaleWidth(6) }} />
						<Text style={styles.buttonText}>오답 다시 풀기</Text>
					</TouchableOpacity>
				</View>

				{/* ✅ 펼치기/접기 */}
				<TouchableOpacity style={styles.toggleButton} onPress={() => setShowWrongList((prev) => !prev)} activeOpacity={0.8}>
					<View style={styles.toggleLeft}>
						<IconComponent type="MaterialIcons" name="format-list-bulleted" size={scaledSize(18)} color="#334155" />
						<Text style={styles.toggleButtonText}>오답 목록</Text>
						<View style={styles.toggleCountBadge}>
							<Text style={styles.toggleCountText}>{wrongProverbIds.length}</Text>
						</View>
					</View>
					<IconComponent
						type="MaterialIcons"
						name={showWrongList ? 'expand-less' : 'expand-more'}
						size={scaledSize(22)}
						color="#64748B"
					/>
				</TouchableOpacity>

				{showWrongList && (
					<View style={styles.reviewCardList}>
						{wrongProverbIds.map((proverb, idx) => (
							<TouchableOpacity
								key={proverb.id}
								style={[styles.reviewCard, { flexDirection: 'row', alignItems: 'center' }]}
								activeOpacity={0.8}
								onPress={() => {
									setDetailProverb(proverb);
									setDetailVisible(true);
								}}>
								<View style={{ flex: 1 }}>
									<View style={styles.reviewCardHeader}>
										<View style={styles.reviewIndexBadge}>
											<Text style={styles.reviewIndexText}>{idx + 1}</Text>
										</View>
										<Text style={styles.reviewProverbText}>
											{proverb.proverb}
										</Text>
									</View>
									<Text style={styles.reviewMeaningText}>{proverb.meaning}</Text>
								</View>
								<IconComponent type="MaterialIcons" name="chevron-right" size={scaledSize(22)} color="#CBD5E1" />
							</TouchableOpacity>
						))}
					</View>
				)}

				{/* {showWrongList && (
					<View style={{ paddingHorizontal: scaleWidth(12), width: '100%' }}>
						<View style={styles.reviewTable}>
							<View style={[styles.reviewRow, styles.reviewHeader]}>
								<Text style={[styles.reviewCell, styles.headerCell]}>오답 속담</Text>
								<Text style={[styles.reviewCell, styles.headerCell]}>정답</Text>
							</View>
							{wrongProverbIds.map((item) => (
								<View key={item.id} style={styles.reviewRow}>
									<Text style={styles.reviewCell}>
										{item.proverb}
									</Text>
									<Text style={styles.reviewCell}>{item.meaning}</Text>
								</View>
							))}
						</View>
					</View>
				)} */}
			</ScrollView>
			{/* 최하단에 위치할것!! */}
			{showScrollTop && (
				<TouchableOpacity
					style={styles.scrollTopButton}
					onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}>
					<IconComponent type="MaterialIcons" name="arrow-upward" size={scaledSize(24)} color="#fff" />
				</TouchableOpacity>
			)}

			<ProverbDetailModal visible={detailVisible} proverb={detailProverb} onClose={() => setDetailVisible(false)} />
		</SafeAreaView>
	);
};

export default WrongReviewScreen;

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#fff',
		paddingVertical: scaleHeight(28),
		paddingHorizontal: scaleWidth(24),
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		marginBottom: scaleHeight(16),
		width: '100%',
		alignItems: 'center',
	},
	title: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		textAlign: 'center',
		marginBottom: scaleHeight(10),
	},
	highlight: {
		color: '#EF4444',
		fontWeight: 'bold',
	},
	highlight2: {
		fontWeight: 'bold',
	},
	subText: {
		fontSize: scaledSize(15),
		color: '#64748B',
		textAlign: 'center',
	},
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F59E0B',
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(40),
		marginBottom: scaleHeight(6),
		borderRadius: scaleWidth(14),
		marginTop: scaleHeight(12),
		width: '100%',
	},
	buttonText: {
		color: '#fff',
		fontSize: scaledSize(15),
		fontWeight: '700',
		textAlign: 'center',
	},
	statsCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(16),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		paddingVertical: scaleHeight(16),
		paddingHorizontal: scaleWidth(8),
		width: '100%',
		marginBottom: scaleHeight(12),
	},
	encourageText: {
		fontSize: scaledSize(14),
		color: '#475569',
		textAlign: 'center',
		lineHeight: scaleHeight(21),
		fontWeight: '600',
		marginBottom: scaleHeight(12),
	},
	encourageHighlight: {
		color: '#EF4444',
		fontWeight: '800',
	},
	statsItem: {
		flex: 1,
		alignItems: 'center',
	},
	statsValue: {
		fontSize: scaledSize(20),
		fontWeight: '800',
		color: '#334155',
		marginBottom: scaleHeight(2),
	},
	statsLabel: {
		fontSize: scaledSize(12),
		color: '#94A3B8',
		fontWeight: '600',
	},
	statsDivider: {
		width: 1,
		height: scaleHeight(28),
		backgroundColor: '#E2E8F0',
	},
	toggleButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(16),
		borderRadius: scaleWidth(14),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		backgroundColor: '#fff',
		width: '100%',
	},
	toggleLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
	},
	toggleButtonText: {
		color: '#334155',
		fontSize: scaledSize(15),
		fontWeight: '700',
	},
	toggleCountBadge: {
		minWidth: scaleWidth(22),
		height: scaleWidth(22),
		borderRadius: scaleWidth(11),
		backgroundColor: '#FEE2E2',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: scaleWidth(6),
	},
	toggleCountText: {
		fontSize: scaledSize(12),
		fontWeight: '800',
		color: '#EF4444',
	},
	reviewCardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(8),
		marginBottom: scaleHeight(8),
	},
	reviewIndexBadge: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: scaleWidth(12),
		backgroundColor: '#F1F5F9',
		alignItems: 'center',
		justifyContent: 'center',
	},
	reviewIndexText: {
		fontSize: scaledSize(12),
		fontWeight: '800',
		color: '#64748B',
	},
	reviewTable: {
		marginTop: scaleHeight(24),
		width: '100%',
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: scaleWidth(12),
		backgroundColor: '#F8FAFC',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	reviewRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#F1F5F9',
	},
	reviewHeader: {
		backgroundColor: '#F1F5F9',
	},
	reviewCell: {
		flex: 1,
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(12),
		fontSize: scaledSize(15),
		color: '#334155',
	},
	headerCell: {
		fontWeight: 'bold',
		color: '#22C55E',
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	emptyText: {
		fontSize: scaledSize(16),
		color: '#64748B',
	},
	emptyWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F8FAFC',
		paddingHorizontal: scaleWidth(28),
	},
	emptyCard: {
		width: '100%',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: scaleWidth(20),
		borderWidth: 1,
		borderColor: '#E2E8F0',
		paddingVertical: scaleHeight(28),
		paddingHorizontal: scaleWidth(20),
	},
	emptyMascot: {
		width: scaleWidth(96),
		height: scaleWidth(96),
		marginBottom: scaleHeight(14),
	},
	emptyTitle: {
		fontSize: scaledSize(17),
		fontWeight: '800',
		color: '#1E293B',
		marginBottom: scaleHeight(10),
		textAlign: 'center',
	},
	emptyDesc: {
		fontSize: scaledSize(13.5),
		color: '#64748B',
		textAlign: 'center',
		lineHeight: scaleHeight(20),
	},
	scrollContainer: {
		paddingVertical: scaleHeight(40),
		paddingHorizontal: scaleWidth(12),
		paddingBottom: scaleWidth(12),
		alignItems: 'center',
		backgroundColor: '#F8FAFC',
	},
	activityCardBox: {
		backgroundColor: 'transparent',
		borderRadius: scaleWidth(16),
		padding: scaleWidth(4),
		marginBottom: scaleHeight(12),
		width: '100%',
		alignItems: 'center', // 내부 요소 정렬용
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		padding: scaleWidth(20),
	},
	modalContent: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(16),
		width: '100%',
		maxWidth: scaleWidth(320),
		alignItems: 'center',
	},
	modalTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(12),
	},
	modalText: {
		fontSize: scaledSize(15),
		color: '#64748B',
		textAlign: 'left',
	},
	modalButton: {
		marginTop: scaleHeight(20),
		paddingVertical: scaleHeight(10),
		paddingHorizontal: scaleWidth(24),
		backgroundColor: '#3B82F6',
		borderRadius: scaleWidth(8),
	},
	modalButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: scaledSize(15),
	},
	headerRow: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: scaleHeight(12),
	},
	headerTitle: {
		fontSize: scaledSize(18),
		fontWeight: 'bold',
		color: '#334155',
		marginRight: scaleWidth(5),
	},
	guideModal: {
		backgroundColor: '#fff',
		padding: scaleWidth(24),
		borderRadius: scaleWidth(20),
		width: '90%',
		maxWidth: scaleWidth(340),
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
	},
	guideHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: scaleHeight(16),
	},
	guideTitle: {
		fontSize: scaledSize(20),
		fontWeight: 'bold',
		color: '#334155',
		marginLeft: scaleWidth(8),
	},
	guideDescription: {
		fontSize: scaledSize(15),
		color: '#334155',
		textAlign: 'left',
		lineHeight: scaleHeight(22),
		marginBottom: scaleHeight(20),
	},
	guideHighlight: {
		fontWeight: 'bold',
		color: '#F97316',
	},
	guideConfirmButton: {
		backgroundColor: '#3B82F6',
		paddingVertical: scaleHeight(12),
		paddingHorizontal: scaleWidth(40),
		borderRadius: scaleWidth(30),
		width: '100%',
		alignItems: 'center',
	},
	guideConfirmText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: scaledSize(16),
	},
	guideDescriptionBox: {
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#F1F5F9',
		borderRadius: scaleWidth(12),
		padding: scaleWidth(16),
		width: '100%',
		marginBottom: scaleHeight(20),
	},
	mascotImage: {
		width: scaleWidth(120),
		height: scaleWidth(120),
		marginBottom: scaleHeight(10),
	},
	guideCard: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: scaleWidth(14),
		padding: scaleWidth(16),
		marginBottom: scaleHeight(20),
		width: '100%',
	},
	guideCardTitle: {
		fontSize: scaledSize(16),
		fontWeight: 'bold',
		color: '#334155',
		marginBottom: scaleHeight(12),
	},
	guideCardContent: {
		fontSize: scaledSize(13),
		color: '#334155',
		lineHeight: scaleHeight(20),
	},
	reviewCardList: {
		width: '100%',
		marginTop: scaleHeight(16),
	},
	reviewCard: {
		backgroundColor: '#fff',
		borderRadius: scaleWidth(14),
		paddingVertical: scaleHeight(14),
		paddingHorizontal: scaleWidth(16),
		marginBottom: scaleHeight(12),
		borderWidth: 1,
		borderColor: '#F1F5F9',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: scaleWidth(2),
	},
	reviewProverbText: {
		flex: 1,
		fontSize: scaledSize(15),
		fontWeight: 'bold',
		color: '#334155',
	},
	reviewMeaningText: {
		fontSize: scaledSize(14),
		color: '#64748B',
		lineHeight: scaleHeight(20),
	},
	scrollTopButton: {
		position: 'absolute',
		right: scaleWidth(32),
		bottom: scaleHeight(32),
		backgroundColor: '#3B82F6',
		width: scaleWidth(45),
		height: scaleWidth(45),
		borderRadius: scaleWidth(25),
		justifyContent: 'center',
		alignItems: 'center',
	},
});
