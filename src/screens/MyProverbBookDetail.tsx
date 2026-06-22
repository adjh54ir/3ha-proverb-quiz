/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import CommonHeader from './common/CommonHeader';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import { Paths } from '@/navigation/conf/Paths';
import BottomHomeButton from './common/BottomHomeButton';
import AddProverbModal from './modal/AddProverbModal';
import { getCategoryColor, getLevelColor } from './common/CommonProverbModule';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import QuizModeModal from './modal/QuizModeModal';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { getFavorites } from '@/utils/favoriteUtils';

type ViewMode = 'list' | 'card';

const STORAGE_KEY = MainStorageKeyType.USER_PROVERB_BOOKS;
const PRACTICE_RECORD_KEY = MainStorageKeyType.USER_PROVERB_PRACTICE_RECORDS;

const MyProverbBookDetail = () => {
	const listRef = useRef<FlatList>(null);
	const [practiceStatsExpanded, setPracticeStatsExpanded] = useState(true);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const { bookId } = route.params as { bookId: string };

	const ALL_PROVERBS = CONST_MAIN_DATA.PROVERB;

	const [book, setBook] = useState<MainDataType.ProverbBook | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>('card');
	const [addModalVisible, setAddModalVisible] = useState(false);

	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	const [practiceRecord, setPracticeRecord] = useState<MainDataType.ProverbBookPracticeRecord | null>(null);
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	const [quizModeModal, setQuizModeModal] = useState<MainDataType.ProverbBook | null>(null);

	const [, setFavoriteIds] = useState<number[]>([]);

	const [removeMode, setRemoveMode] = useState(false);
	const [selectedForRemove, setSelectedForRemove] = useState<Set<number>>(new Set());
	const [removeConfirmVisible, setRemoveConfirmVisible] = useState(false);

	useFocusEffect(
		useCallback(() => {
			const loadData = async () => {
				await loadBook();
				await loadPracticeRecord();
				await loadFavorites();
			};
			loadData();
		}, [bookId]),
	);

	const loadBook = async () => {
		const json = await AsyncStorage.getItem(STORAGE_KEY);
		if (json) {
			const books: MainDataType.ProverbBook[] = JSON.parse(json);
			const found = books.find((b) => b.id === bookId);
			if (found) {
				setBook(found);
				return found;
			}
		}
		return null;
	};

	const loadFavorites = async () => {
		const favorites = await getFavorites();
		setFavoriteIds(favorites);
	};

	const arraysEqual = (arr1: number[], arr2: number[]) => {
		if (arr1.length !== arr2.length) {
			return false;
		}
		const sorted1 = [...arr1].sort((a, b) => a - b);
		const sorted2 = [...arr2].sort((a, b) => a - b);
		return sorted1.every((val, idx) => val === sorted2[idx]);
	};

	const loadPracticeRecord = async () => {
		try {
			const json = await AsyncStorage.getItem(PRACTICE_RECORD_KEY);
			if (json) {
				const records: MainDataType.ProverbBookPracticeRecord[] = JSON.parse(json);
				const found = records.find((r) => r.bookId === bookId);
				if (found) {
					const bookJson = await AsyncStorage.getItem(STORAGE_KEY);
					if (bookJson) {
						const books: MainDataType.ProverbBook[] = JSON.parse(bookJson);
						const currentBook = books.find((b) => b.id === bookId);
						if (currentBook && arraysEqual(found.proverbIds, currentBook.proverbIds)) {
							setPracticeRecord(found);
						} else {
							setPracticeRecord(null);
						}
					}
				}
			}
		} catch (error) {
			console.error('연습 기록 로드 실패:', error);
		}
	};

	const resetPracticeRecord = async () => {
		try {
			const json = await AsyncStorage.getItem(PRACTICE_RECORD_KEY);
			if (json) {
				const records: MainDataType.ProverbBookPracticeRecord[] = JSON.parse(json);
				const filtered = records.filter((r) => r.bookId !== bookId);
				await AsyncStorage.setItem(PRACTICE_RECORD_KEY, JSON.stringify(filtered));
			}
			setPracticeRecord(null);
			setShowResetConfirm(false);
		} catch (error) {
			console.error('연습 기록 초기화 실패:', error);
		}
	};

	const saveBook = async (updated: MainDataType.ProverbBook) => {
		const json = await AsyncStorage.getItem(STORAGE_KEY);
		const books: MainDataType.ProverbBook[] = json ? JSON.parse(json) : [];
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books.map((b) => (b.id === updated.id ? updated : b))));
		setBook(updated);
	};

	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 300);
	};

	const scrollToTop = () => {
		listRef.current?.scrollToOffset({ offset: 0, animated: true });
	};

	const openAddModal = () => setAddModalVisible(true);

	const handleAddProverbs = async (ids: number[]) => {
		if (!book) {
			return;
		}
		const updated = { ...book, proverbIds: [...new Set([...book.proverbIds, ...ids])] };
		await saveBook(updated);
		await resetPracticeRecordSilent();
		setAddModalVisible(false);
	};

	const enterRemoveMode = () => {
		setRemoveMode(true);
		setSelectedForRemove(new Set());
	};

	const exitRemoveMode = () => {
		setRemoveMode(false);
		setSelectedForRemove(new Set());
	};

	const toggleRemoveSelect = (id: number) => {
		setSelectedForRemove((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (!book) {
			return;
		}
		if (selectedForRemove.size === book.proverbIds.length) {
			setSelectedForRemove(new Set());
		} else {
			setSelectedForRemove(new Set(book.proverbIds));
		}
	};

	const handleRemoveSelected = async () => {
		if (!book || selectedForRemove.size === 0) {
			return;
		}
		const updated = { ...book, proverbIds: book.proverbIds.filter((id) => !selectedForRemove.has(id)) };
		await saveBook(updated);
		await resetPracticeRecordSilent();
		setRemoveConfirmVisible(false);
		exitRemoveMode();
	};

	const resetPracticeRecordSilent = async () => {
		try {
			const json = await AsyncStorage.getItem(PRACTICE_RECORD_KEY);
			if (json) {
				const records: MainDataType.ProverbBookPracticeRecord[] = JSON.parse(json);
				const filtered = records.filter((r) => r.bookId !== bookId);
				await AsyncStorage.setItem(PRACTICE_RECORD_KEY, JSON.stringify(filtered));
			}
			setPracticeRecord(null);
		} catch (error) {
			console.error('연습 기록 초기화 실패:', error);
		}
	};

	const startQuiz = (mode: 'meaning' | 'proverb' | 'blank' | 'example' | 'etc') => {
		if (!book) {
			return;
		}
		const pool = ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id));
		setQuizModeModal(null);

		navigation.navigate(Paths.QUIZ, {
			questionPool: pool,
			title: book.title,
			mode: mode as 'meaning' | 'proverb' | 'blank' | 'example',
			selectedLevel: '전체',
			levelKey: '전체',
			isPracticeMode: true,
			practiceBookId: bookId,
		});
	};

	const proverbs = useMemo(() => ALL_PROVERBS.filter((p) => book?.proverbIds.includes(p.id)), [book]);

	const allSelected = selectedForRemove.size === proverbs.length && proverbs.length > 0;

	if (!book) {
		return null;
	}

	const renderCard = (item: MainDataType.Proverb) => {
		const isSelected = selectedForRemove.has(item.id);
		return (
			<TouchableOpacity
				key={item.id}
				style={[styles.cardItem, removeMode && isSelected && styles.cardItemSelected]}
				onPress={() => {
					if (removeMode) {
						toggleRemoveSelect(item.id);
					} else {
						setSelectedProverb(item);
						setShowDetailModal(true);
					}
				}}
				activeOpacity={removeMode ? 0.75 : 0.8}>
				{removeMode && (
					<View style={[styles.checkCircle, isSelected && styles.checkCircleActive, { marginBottom: scaleHeight(8) }]}>
						{isSelected && <IconComponent type="materialIcons" name="check" size={scaledSize(14)} color="#fff" />}
					</View>
				)}
				<View style={styles.cardTop}>
					<View style={[styles.levelDot, { backgroundColor: getLevelColor(item.level) }]} />
					<View style={[styles.catTag, { backgroundColor: getCategoryColor(item.category) }]}>
						<Text style={styles.catTagText}>{item.category}</Text>
					</View>
				</View>
				<Text style={styles.cardHangul} numberOfLines={2}>
					{item.proverb}
				</Text>
				<Text style={styles.cardMeaning} numberOfLines={2}>
					{item.meaning}
				</Text>
				{!removeMode && (
					<View style={styles.cardBottomIcon}>
						<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color="#94A3B8" />
					</View>
				)}
			</TouchableOpacity>
		);
	};

	const renderRow = ({ item }: { item: MainDataType.Proverb }) => {
		const isSelected = selectedForRemove.has(item.id);
		return (
			<TouchableOpacity
				style={[styles.proverbRow, removeMode && isSelected && styles.proverbRowSelected]}
				onPress={() => {
					if (removeMode) {
						toggleRemoveSelect(item.id);
					} else {
						setSelectedProverb(item);
						setShowDetailModal(true);
					}
				}}
				activeOpacity={removeMode ? 0.75 : 0.8}>
				{removeMode ? (
					<View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>{isSelected && <IconComponent type="materialIcons" name="check" size={scaledSize(13)} color="#fff" />}</View>
				) : (
					<View style={[styles.levelDot, { backgroundColor: getLevelColor(item.level) }]} />
				)}
				<View style={{ flex: 1 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6), flexWrap: 'wrap' }}>
						<Text style={styles.proverbHangul}>{item.proverb}</Text>
						<View style={[styles.catTag, { backgroundColor: getCategoryColor(item.category) }]}>
							<Text style={styles.catTagText}>{item.category}</Text>
						</View>
					</View>
					<Text style={styles.proverbMeaning} numberOfLines={2}>
						{item.meaning}
					</Text>
				</View>
				{!removeMode && <IconComponent type="materialIcons" name="chevron-right" size={scaledSize(20)} color="#94A3B8" />}
			</TouchableOpacity>
		);
	};

	return (
		<>
			<SafeAreaView style={styles.main} edges={['top', 'bottom']}>
				<View style={[styles.header, { backgroundColor: book.color + '08' }]}>
					<CommonHeader
						title={removeMode ? '항목 삭제' : '속담집'}
						backIcon={removeMode ? 'close' : 'arrow-back'}
						border={false}
						style={{ backgroundColor: 'transparent' }}
						onBack={removeMode ? exitRemoveMode : () => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME })}
						right={
							!removeMode ? (
								proverbs.length > 0 ? (
									<TouchableOpacity style={styles.headerIconBtn} onPress={enterRemoveMode}>
										<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(20)} color="#EF4444" />
									</TouchableOpacity>
								) : null
							) : (
								<TouchableOpacity style={styles.headerIconBtn} onPress={toggleSelectAll}>
									<IconComponent type="materialIcons" name={allSelected ? 'check-box' : 'check-box-outline-blank'} size={scaledSize(20)} color={allSelected ? '#EF4444' : '#334155'} />
								</TouchableOpacity>
							)
						}
					/>

					{!removeMode && (
						<View style={styles.bookInfoRow}>
							<View style={[styles.bookIconWrap, { backgroundColor: book.color }]}>
								<IconComponent type="materialIcons" name={book.icon} size={scaledSize(24)} color="#fff" />
							</View>
							<View style={styles.headerTitleBlock}>
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6), overflow: 'hidden' }}>
									<Text numberOfLines={1} style={[styles.bookTitle, { flexShrink: 1 }]}>
										{book.title}
									</Text>
								</View>
								{!!book.description && (
									<Text style={styles.bookDesc} numberOfLines={1}>
										{book.description}
									</Text>
								)}
								<View style={styles.bookMeta}>
									<IconComponent type="materialIcons" name="category" size={scaledSize(14)} color="#64748B" />
									<Text style={styles.metaText}>{new Set(proverbs.map((p) => p.category)).size}개 카테고리</Text>
								</View>
							</View>
						</View>
					)}

					{!removeMode ? (
						<>
							{proverbs.length > 0 && (
								<View style={styles.viewModeRow}>
									<View style={styles.segmentedControl}>
										<TouchableOpacity style={[styles.segment, viewMode === 'list' && styles.segmentActive]} onPress={() => setViewMode('list')} activeOpacity={0.85}>
											<IconComponent type="materialIcons" name="view-list" size={scaledSize(16)} color={viewMode === 'list' ? '#3B82F6' : '#64748B'} />
											<Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>리스트</Text>
										</TouchableOpacity>
										<TouchableOpacity style={[styles.segment, viewMode === 'card' && styles.segmentActive]} onPress={() => setViewMode('card')} activeOpacity={0.85}>
											<IconComponent type="materialIcons" name="grid-view" size={scaledSize(16)} color={viewMode === 'card' ? '#3B82F6' : '#64748B'} />
											<Text style={[styles.segmentText, viewMode === 'card' && styles.segmentTextActive]}>앨범</Text>
										</TouchableOpacity>
									</View>
									<TouchableOpacity style={styles.quizStartBtn} onPress={() => setQuizModeModal(book)} activeOpacity={0.85}>
										<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(18)} color="#fff" />
										<Text style={styles.headerQuizBtnText}>퀴즈 시작</Text>
									</TouchableOpacity>
								</View>
							)}

							{practiceRecord?.attempts && practiceRecord.attempts.length > 0 && (
								<View style={styles.practiceStatsCard}>
									<TouchableOpacity style={[styles.practiceStatsHeader, !practiceStatsExpanded && { marginBottom: 0 }]} onPress={() => setPracticeStatsExpanded((v) => !v)} activeOpacity={0.7}>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6) }}>
											<IconComponent type="materialIcons" name="school" size={scaledSize(18)} color="#22C55E" />
											<Text style={styles.practiceStatsTitle}>연습 기록 ({practiceRecord.attempts.length}회)</Text>
										</View>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8) }}>
											{practiceStatsExpanded && (
												<TouchableOpacity onPress={() => setShowResetConfirm(true)} style={styles.resetBtn}>
													<IconComponent type="materialIcons" name="refresh" size={scaledSize(16)} color="#EF4444" />
													<Text style={styles.resetBtnText}>초기화</Text>
												</TouchableOpacity>
											)}
											<IconComponent type="materialIcons" name={practiceStatsExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={scaledSize(20)} color="#94A3B8" />
										</View>
									</TouchableOpacity>

									{practiceStatsExpanded && (
										<>
											<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attemptsScroll}>
												{practiceRecord.attempts.map((attempt, index) => {
													const date = new Date(attempt.timestamp);
													const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
													const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
													return (
														<View key={attempt.timestamp} style={styles.attemptCard}>
															<View style={styles.attemptHeader}>
																<Text style={styles.attemptIndex}>#{practiceRecord.attempts.length - index}회차</Text>
																<View style={styles.attemptDateWrap}>
																	<Text style={styles.attemptDate}>{dateStr}</Text>
																	<Text style={styles.attemptTime}>{timeStr}</Text>
																</View>
															</View>
															<View style={styles.attemptAccuracyWrap}>
																<Text style={[styles.attemptAccuracy, { color: attempt.accuracy >= 80 ? '#22C55E' : attempt.accuracy >= 60 ? '#F59E0B' : '#EF4444' }]}>{attempt.accuracy}%</Text>
															</View>
															<View style={styles.attemptStatsRow}>
																<View style={styles.attemptStatItem}>
																	<IconComponent type="materialIcons" name="check-circle" size={scaledSize(14)} color="#22C55E" />
																	<Text style={[styles.attemptStatText, { color: '#22C55E' }]}>{attempt.correctCount}</Text>
																</View>
																<View style={styles.attemptStatItem}>
																	<IconComponent type="materialIcons" name="cancel" size={scaledSize(14)} color="#EF4444" />
																	<Text style={[styles.attemptStatText, { color: '#EF4444' }]}>{attempt.wrongCount}</Text>
																</View>
															</View>
														</View>
													);
												})}
											</ScrollView>
											<Text style={styles.practiceStatsNotice}>* 속담을 추가/삭제하면 기록이 초기화됩니다</Text>
										</>
									)}
								</View>
							)}
						</>
					) : (
						<View style={styles.removeHeader}>
							<Text style={styles.removeHeaderText}>
								<Text style={styles.removeHeaderCount}>{selectedForRemove.size}개</Text> 선택됨
							</Text>
						</View>
					)}
				</View>

				{viewMode === 'list' ? (
					<FlatList
						ref={listRef}
						key="list"
						data={proverbs}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={[styles.listContent, proverbs.length === 0 && { flexGrow: 1 }]}
						showsVerticalScrollIndicator={false}
						renderItem={renderRow}
						ListEmptyComponent={<EmptyView onAdd={() => setAddModalVisible(true)} color={book.color} />}
						onScroll={handleScroll}
						scrollEventThrottle={16}
					/>
				) : (
					<FlatList
						ref={listRef}
						key="card"
						data={proverbs}
						keyExtractor={(item) => String(item.id)}
						numColumns={2}
						contentContainerStyle={[styles.listContent, proverbs.length === 0 && { flexGrow: 1 }]}
						columnWrapperStyle={{ gap: scaleWidth(12) }}
						showsVerticalScrollIndicator={false}
						renderItem={({ item }) => renderCard(item)}
						ListEmptyComponent={<EmptyView onAdd={() => setAddModalVisible(true)} color={book.color} />}
						onScroll={handleScroll}
						scrollEventThrottle={16}
					/>
				)}

				{!removeMode && (
					<TouchableOpacity style={[styles.fab, { backgroundColor: showScrollTop ? '#22C55E' : book.color }]} onPress={showScrollTop ? scrollToTop : openAddModal} activeOpacity={0.85}>
						<IconComponent type="materialIcons" name={showScrollTop ? 'keyboard-arrow-up' : 'add'} size={scaledSize(28)} color="#fff" />
					</TouchableOpacity>
				)}

				{removeMode && (
					<View style={styles.removeBar}>
						<Text style={styles.removeBarText}>
							<Text style={styles.removeBarCount}>{selectedForRemove.size}</Text>개 선택
						</Text>
						<TouchableOpacity style={[styles.removeBarBtn, selectedForRemove.size === 0 && styles.removeBarBtnDisabled]} disabled={selectedForRemove.size === 0} onPress={() => setRemoveConfirmVisible(true)}>
							<IconComponent type="materialIcons" name="delete" size={scaledSize(18)} color="#fff" />
							<Text style={styles.removeBarBtnText}>제거하기</Text>
						</TouchableOpacity>
					</View>
				)}
				<BottomHomeButton />
			</SafeAreaView>

			<ProverbDetailModal visible={showDetailModal} proverb={selectedProverb} onClose={() => setShowDetailModal(false)} onFavoriteChange={() => loadFavorites()} />

			<QuizModeModal book={quizModeModal} onClose={() => setQuizModeModal(null)} onSelect={(_, mode) => startQuiz(mode)} />

			<Modal visible={removeConfirmVisible} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.confirmModal}>
						<View style={styles.confirmIconWrap}>
							<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(32)} color="#EF4444" />
						</View>
						<Text style={styles.confirmTitle}>{selectedForRemove.size}개 속담을 제거할까요?</Text>
						<Text style={styles.confirmDesc}>속담집에서만 제거되며{'\n'}데이터는 유지됩니다.</Text>
						<View style={styles.confirmBtnRow}>
							<TouchableOpacity
								style={[styles.confirmBtn, { backgroundColor: '#F8FAFC' }]}
								onPress={() => {
									setRemoveConfirmVisible(false);
									if (!removeMode) {
										setSelectedForRemove(new Set());
									}
								}}>
								<Text style={[styles.confirmBtnText, { color: '#334155' }]}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]} onPress={handleRemoveSelected}>
								<Text style={[styles.confirmBtnText, { color: '#fff' }]}>제거</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<Modal visible={showResetConfirm} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.confirmModal}>
						<View style={styles.confirmIconWrap}>
							<IconComponent type="materialIcons" name="refresh" size={scaledSize(32)} color="#EF4444" />
						</View>
						<Text style={styles.confirmTitle}>연습 기록을 초기화할까요?</Text>
						<Text style={styles.confirmDesc}>모든 연습 모드 기록이 삭제됩니다.{'\n'}이 작업은 되돌릴 수 없습니다.</Text>
						<View style={styles.confirmBtnRow}>
							<TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#F8FAFC' }]} onPress={() => setShowResetConfirm(false)}>
								<Text style={[styles.confirmBtnText, { color: '#334155' }]}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]} onPress={resetPracticeRecord}>
								<Text style={[styles.confirmBtnText, { color: '#fff' }]}>초기화</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<AddProverbModal visible={addModalVisible} book={book} onClose={() => setAddModalVisible(false)} onAdd={handleAddProverbs} />
		</>
	);
};

const EmptyView = ({ onAdd, color = '#22C55E' }: { onAdd?: () => void; color?: string }) => (
	<View style={styles.emptyView}>
		<View style={styles.emptyIconWrap}>
			<IconComponent type="materialIcons" name="auto-stories" size={scaledSize(48)} color="#94A3B8" />
		</View>
		<Text style={styles.emptyTitle}>아직 추가된 속담이 없습니다.</Text>
		<Text style={styles.emptyDesc}>아래 버튼을 눌러 속담을 추가해보세요!</Text>
		{onAdd && (
			<TouchableOpacity style={[styles.emptyAddBtn, { backgroundColor: color }]} onPress={onAdd} activeOpacity={0.85}>
				<IconComponent type="materialIcons" name="add" size={scaledSize(18)} color="#fff" />
				<Text style={styles.emptyAddBtnText}>속담 추가</Text>
			</TouchableOpacity>
		)}
	</View>
);

export default MyProverbBookDetail;

const styles = StyleSheet.create({
	main: { flex: 1, backgroundColor: '#F8FAFC' },
	header: { marginTop: scaleHeight(10), paddingHorizontal: scaleWidth(20), paddingTop: scaleHeight(8), paddingBottom: scaleHeight(14), borderBottomLeftRadius: scaleWidth(24), borderBottomRightRadius: scaleWidth(24) },
	bookInfoRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), marginBottom: scaleHeight(12) },
	headerTitleBlock: { flex: 1 },
	headerIconBtn: { padding: scaleWidth(8), borderRadius: scaleWidth(10), backgroundColor: 'rgba(255,255,255,0.9)' },
	bookIconWrap: { width: scaleWidth(48), height: scaleWidth(48), borderRadius: scaleWidth(14), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
	bookTitle: { fontSize: scaledSize(17), fontWeight: '800', color: '#334155', marginBottom: scaleHeight(3), flexShrink: 1 },
	bookDesc: { fontSize: scaledSize(12), color: '#64748B', marginBottom: scaleHeight(6), flexShrink: 1 },
	bookMeta: { flexDirection: 'row', gap: scaleWidth(10) },
	metaText: { fontSize: scaledSize(11), color: '#64748B', fontWeight: '600' },
	removeHeader: { paddingVertical: scaleHeight(4) },
	removeHeaderText: { fontSize: scaledSize(16), color: '#64748B' },
	removeHeaderCount: { fontWeight: '800', color: '#EF4444', fontSize: scaledSize(18) },
	fab: { position: 'absolute', right: scaleWidth(20), bottom: scaleHeight(90), width: scaleWidth(50), height: scaleWidth(50), borderRadius: scaleWidth(25), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
	listContent: { paddingHorizontal: scaleWidth(20), paddingBottom: scaleHeight(80), paddingTop: scaleHeight(8) },
	proverbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: scaleHeight(14), paddingHorizontal: scaleWidth(14), borderRadius: scaleWidth(14), marginBottom: scaleHeight(10), backgroundColor: '#fff', gap: scaleWidth(12), shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3 },
	proverbRowSelected: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#EF4444' },
	proverbHangul: { fontSize: scaledSize(15), fontWeight: '700', color: '#334155', flexShrink: 1 },
	proverbMeaning: { fontSize: scaledSize(12), color: '#64748B', marginTop: scaleHeight(4) },
	levelDot: { width: scaleWidth(10), height: scaleWidth(10), borderRadius: scaleWidth(5) },
	cardItem: { flex: 1, backgroundColor: '#fff', borderRadius: scaleWidth(16), padding: scaleWidth(14), marginBottom: scaleHeight(12), shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
	cardItemSelected: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#EF4444' },
	cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scaleHeight(10) },
	cardHangul: { fontSize: scaledSize(15), fontWeight: '800', color: '#334155', marginBottom: scaleHeight(4), lineHeight: scaleHeight(22) },
	cardMeaning: { fontSize: scaledSize(12), color: '#64748B', lineHeight: scaleHeight(18), marginTop: scaleHeight(6), paddingRight: scaleWidth(24) },
	catTag: { paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(3), borderRadius: scaleWidth(8) },
	catTagText: { fontSize: scaledSize(10), color: '#fff', fontWeight: '700' },
	emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: scaleHeight(80) },
	emptyIconWrap: { width: scaleWidth(96), height: scaleWidth(96), borderRadius: scaleWidth(48), backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: scaleHeight(16) },
	emptyTitle: { fontSize: scaledSize(16), fontWeight: '700', color: '#334155', marginBottom: scaleHeight(6) },
	emptyDesc: { fontSize: scaledSize(13), color: '#94A3B8' },
	emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6), marginTop: scaleHeight(18), paddingVertical: scaleHeight(11), paddingHorizontal: scaleWidth(22), borderRadius: scaleWidth(24) },
	emptyAddBtnText: { color: '#fff', fontSize: scaledSize(14), fontWeight: '800' },
	viewModeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: scaleHeight(12) },
	segmentedControl: { flexDirection: 'row', backgroundColor: '#EEF2F7', borderRadius: scaleWidth(12), padding: scaleWidth(3) },
	segment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(5), paddingVertical: scaleHeight(7), paddingHorizontal: scaleWidth(14), borderRadius: scaleWidth(9) },
	segmentActive: { backgroundColor: '#FFFFFF', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
	segmentText: { fontSize: scaledSize(13), fontWeight: '700', color: '#64748B' },
	segmentTextActive: { color: '#3B82F6' },
	quizStartBtn: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4), paddingHorizontal: scaleWidth(14), paddingVertical: scaleHeight(9), borderRadius: scaleWidth(12), backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
	removeBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scaleWidth(20), paddingVertical: scaleHeight(14), backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
	removeBarText: { fontSize: scaledSize(15), color: '#64748B' },
	removeBarCount: { fontWeight: '800', color: '#EF4444', fontSize: scaledSize(16) },
	removeBarBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: scaleWidth(20), paddingVertical: scaleHeight(11), borderRadius: scaleWidth(12), gap: scaleWidth(6), shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
	removeBarBtnDisabled: { backgroundColor: '#94A3B8' },
	removeBarBtnText: { color: '#fff', fontWeight: '700', fontSize: scaledSize(14) },
	checkCircle: { width: scaleWidth(24), height: scaleWidth(24), borderRadius: scaleWidth(12), borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
	checkCircleActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	confirmModal: { width: '84%', backgroundColor: '#fff', borderRadius: scaleWidth(20), padding: scaleWidth(28), alignItems: 'center' },
	confirmIconWrap: { width: scaleWidth(72), height: scaleWidth(72), borderRadius: scaleWidth(36), backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: scaleHeight(8) },
	confirmTitle: { fontSize: scaledSize(17), fontWeight: '800', color: '#334155', marginTop: scaleHeight(12), marginBottom: scaleHeight(8), textAlign: 'center' },
	confirmDesc: { fontSize: scaledSize(14), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(21), marginBottom: scaleHeight(24) },
	confirmBtnRow: { flexDirection: 'row', gap: scaleWidth(10), width: '100%' },
	confirmBtn: { flex: 1, paddingVertical: scaleHeight(14), borderRadius: scaleWidth(12), alignItems: 'center' },
	confirmBtnText: { fontWeight: '700', fontSize: scaledSize(15) },
	headerQuizBtnText: { fontSize: scaledSize(13), fontWeight: '700', color: '#fff' },
	cardBottomIcon: { position: 'absolute', right: scaleWidth(14), bottom: scaleHeight(14) },
	practiceStatsCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: scaleWidth(14), padding: scaleWidth(14), marginTop: scaleHeight(10), borderWidth: 1, borderColor: '#EFF6FF', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
	practiceStatsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scaleHeight(10) },
	practiceStatsTitle: { fontSize: scaledSize(14), fontWeight: '700', color: '#334155' },
	resetBtn: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4), paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(4), backgroundColor: '#FEF2F2', borderRadius: scaleWidth(8) },
	resetBtnText: { fontSize: scaledSize(11), fontWeight: '600', color: '#EF4444' },
	practiceStatsNotice: { fontSize: scaledSize(10), color: '#94A3B8', marginTop: scaleHeight(8), textAlign: 'center' },
	attemptsScroll: { gap: scaleWidth(10), paddingVertical: scaleHeight(4) },
	attemptCard: { width: scaleWidth(110), backgroundColor: '#F8FAFC', borderRadius: scaleWidth(12), padding: scaleWidth(12), borderWidth: 1, borderColor: '#E2E8F0' },
	attemptHeader: { marginBottom: scaleHeight(8) },
	attemptIndex: { fontSize: scaledSize(11), fontWeight: '700', color: '#334155', marginBottom: scaleHeight(3) },
	attemptDateWrap: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4) },
	attemptDate: { fontSize: scaledSize(10), color: '#64748B', fontWeight: '600' },
	attemptTime: { fontSize: scaledSize(9), color: '#94A3B8' },
	attemptAccuracyWrap: { alignItems: 'center', paddingVertical: scaleHeight(8) },
	attemptAccuracy: { fontSize: scaledSize(24), fontWeight: '800' },
	attemptStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: scaleHeight(8), borderTopWidth: 1, borderTopColor: '#E2E8F0' },
	attemptStatItem: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4) },
	attemptStatText: { fontSize: scaledSize(13), fontWeight: '700' },
});
