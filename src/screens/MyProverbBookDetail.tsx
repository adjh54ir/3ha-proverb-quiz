/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { Paths } from '@/navigation/conf/Paths';
import BottomHomeButton from './common/BottomHomeButton';
import AddProverbModal from './modal/AddProverbModal';
import QuizModeModal from './modal/QuizModeModal';
import ProverbDetailModal from './modal/ProverbDetailModal';
import { getCategoryColor, getLevelColor } from './common/CommonProverbModule';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';

const DEFAULT_COLOR = '#22C55E';
const DEFAULT_ICON = 'menu-book';
const STORAGE_KEY = MainStorageKeyType.USER_PROVERB_BOOKS;
const PRACTICE_RECORD_KEY = MainStorageKeyType.USER_PROVERB_PRACTICE_RECORDS;

const MyProverbBookDetail = () => {
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const { bookId } = route.params as { bookId: string };

	const ALL_PROVERBS = ProverbServices.selectProverbList();

	const [book, setBook] = useState<MainDataType.ProverbBook | null>(null);
	const [addModalVisible, setAddModalVisible] = useState(false);
	const [quizModeModal, setQuizModeModal] = useState<MainDataType.ProverbBook | null>(null);
	const [selectedProverb, setSelectedProverb] = useState<MainDataType.Proverb | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [practiceRecord, setPracticeRecord] = useState<MainDataType.ProverbBookPracticeRecord | null>(null);

	// 삭제 모드
	const [removeMode, setRemoveMode] = useState(false);
	const [selectedForRemove, setSelectedForRemove] = useState<Set<number>>(new Set());
	const [removeConfirmVisible, setRemoveConfirmVisible] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadBook();
			loadPracticeRecord();
		}, [bookId]),
	);

	const loadBook = async () => {
		const json = await AsyncStorage.getItem(STORAGE_KEY);
		if (json) {
			const books: MainDataType.ProverbBook[] = JSON.parse(json);
			const found = books.find((b) => b.id === bookId);
			setBook(found ?? null);
		}
	};

	const loadPracticeRecord = async () => {
		const json = await AsyncStorage.getItem(PRACTICE_RECORD_KEY);
		if (json) {
			const records: MainDataType.ProverbBookPracticeRecord[] = JSON.parse(json);
			setPracticeRecord(records.find((r) => r.bookId === bookId) ?? null);
		}
	};

	const saveBook = async (updated: MainDataType.ProverbBook) => {
		const json = await AsyncStorage.getItem(STORAGE_KEY);
		const books: MainDataType.ProverbBook[] = json ? JSON.parse(json) : [];
		const next = books.map((b) => (b.id === updated.id ? updated : b));
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		setBook(updated);
	};

	const proverbs = useMemo(() => (book ? ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id)) : []), [book]);

	const handleAddProverbs = async (target: MainDataType.ProverbBook, ids: number[]) => {
		const updated = { ...target, proverbIds: [...new Set([...target.proverbIds, ...ids])] };
		await saveBook(updated);
		setAddModalVisible(false);
	};

	const toggleRemove = (id: number) => {
		setSelectedForRemove((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const handleRemoveConfirm = async () => {
		if (!book) return;
		const updated = { ...book, proverbIds: book.proverbIds.filter((id) => !selectedForRemove.has(id)) };
		await saveBook(updated);
		setRemoveConfirmVisible(false);
		setRemoveMode(false);
		setSelectedForRemove(new Set());
	};

	const startQuiz = (target: MainDataType.ProverbBook, mode: 'meaning' | 'proverb' | 'blank' | 'example') => {
		const pool = ALL_PROVERBS.filter((p) => target.proverbIds.includes(p.id));
		setQuizModeModal(null);
		navigation.navigate(Paths.QUIZ, { questionPool: pool, title: target.title, mode, selectedLevel: '전체', levelKey: 'all', isWrongReview: true });
	};

	const bookColor = book?.color || DEFAULT_COLOR;
	const lastAttempt = practiceRecord?.attempts?.[0];

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const isSelected = selectedForRemove.has(item.id);
		return (
			<TouchableOpacity
				style={[styles.itemCard, removeMode && isSelected && styles.itemCardSelected]}
				activeOpacity={0.8}
				onPress={() => {
					if (removeMode) {
						toggleRemove(item.id);
					} else {
						setSelectedProverb(item);
						setShowDetailModal(true);
					}
				}}>
				<View style={styles.itemIndexWrap}>
					{removeMode ? (
						<View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>{isSelected && <IconComponent type="materialIcons" name="check" size={scaledSize(12)} color="#fff" />}</View>
					) : (
						<Text style={styles.itemIndex}>{index + 1}</Text>
					)}
				</View>
				<View style={{ flex: 1 }}>
					<Text style={styles.itemProverb} numberOfLines={1}>{item.proverb}</Text>
					<Text style={styles.itemMeaning} numberOfLines={1}>{item.longMeaning || item.meaning}</Text>
				</View>
				<View style={styles.itemBadges}>
					<View style={[styles.miniBadge, { backgroundColor: getLevelColor(item.levelName) }]}>
						<Text style={styles.miniBadgeText}>{item.levelName}</Text>
					</View>
					<View style={[styles.miniBadge, { backgroundColor: getCategoryColor(item.category) }]}>
						<Text style={styles.miniBadgeText}>{item.category}</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<>
			<SafeAreaView style={styles.main} edges={['top', 'bottom']}>
				{/* 헤더 */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
						<IconComponent type="materialIcons" name="arrow-back" size={scaledSize(22)} color="#334155" />
					</TouchableOpacity>
					<Text style={styles.headerTitle} numberOfLines={1}>{book?.title ?? '속담집'}</Text>
					{proverbs.length > 0 ? (
						<TouchableOpacity onPress={() => { setRemoveMode((v) => !v); setSelectedForRemove(new Set()); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
							<Text style={[styles.headerAction, removeMode && { color: '#64748B' }]}>{removeMode ? '취소' : '편집'}</Text>
						</TouchableOpacity>
					) : (
						<View style={{ width: scaleWidth(28) }} />
					)}
				</View>

				{/* 요약 카드 */}
				<View style={[styles.summaryCard, { borderColor: bookColor + '40' }]}>
					<View style={[styles.summaryIcon, { backgroundColor: bookColor }]}>
						<IconComponent type="materialIcons" name={book?.icon || DEFAULT_ICON} size={scaledSize(24)} color="#fff" />
					</View>
					<View style={{ flex: 1 }}>
						{!!book?.description && <Text style={styles.summaryDesc} numberOfLines={1}>{book.description}</Text>}
						<Text style={styles.summaryCount}>총 <Text style={{ color: bookColor, fontWeight: '800' }}>{proverbs.length}</Text>개의 속담</Text>
						{lastAttempt && (
							<Text style={styles.summaryRecord}>최근 정답률 {lastAttempt.accuracy}% · {lastAttempt.correctCount}/{lastAttempt.correctCount + lastAttempt.wrongCount}</Text>
						)}
					</View>
				</View>

				{/* 액션 버튼 */}
				<View style={styles.actionRow}>
					<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]} onPress={() => setAddModalVisible(true)}>
						<IconComponent type="materialIcons" name="add" size={scaledSize(18)} color="#3B82F6" />
						<Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>속담 추가</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.actionBtn, { backgroundColor: proverbs.length === 0 ? '#F1F5F9' : '#22C55E' }]}
						disabled={proverbs.length === 0}
						onPress={() => book && setQuizModeModal(book)}>
						<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(18)} color={proverbs.length === 0 ? '#94A3B8' : '#fff'} />
						<Text style={[styles.actionBtnText, { color: proverbs.length === 0 ? '#94A3B8' : '#fff' }]}>퀴즈 시작</Text>
					</TouchableOpacity>
				</View>

				<FlatList
					data={proverbs}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
					ListEmptyComponent={() => (
						<View style={styles.emptyView}>
							<IconComponent type="materialIcons" name="menu-book" size={scaledSize(52)} color="#E2E8F0" />
							<Text style={styles.emptyTitle}>아직 담은 속담이 없어요</Text>
							<Text style={styles.emptyDesc}>속담 추가 버튼을 눌러 채워보세요!</Text>
						</View>
					)}
				/>

				{removeMode && (
					<View style={styles.removeBar}>
						<TouchableOpacity
							style={[styles.removeBtn, selectedForRemove.size === 0 && styles.removeBtnDisabled]}
							disabled={selectedForRemove.size === 0}
							onPress={() => setRemoveConfirmVisible(true)}>
							<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(16)} color="#fff" />
							<Text style={styles.removeBtnText}>{selectedForRemove.size > 0 ? `${selectedForRemove.size}개 빼기` : '속담을 선택해주세요'}</Text>
						</TouchableOpacity>
					</View>
				)}
				{!removeMode && <BottomHomeButton backgroundColor="#F1F5F9" />}
			</SafeAreaView>

			<AddProverbModal visible={addModalVisible} book={book} onClose={() => setAddModalVisible(false)} onAdd={handleAddProverbs} />
			<QuizModeModal book={quizModeModal} onClose={() => setQuizModeModal(null)} onSelect={(b, mode) => startQuiz(b, mode)} />
			<ProverbDetailModal visible={showDetailModal} proverb={selectedProverb} onClose={() => setShowDetailModal(false)} />

			<Modal visible={removeConfirmVisible} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.confirmModal}>
						<IconComponent type="materialIcons" name="remove-circle-outline" size={scaledSize(40)} color="#EF4444" />
						<Text style={styles.confirmTitle}>선택한 속담을 뺄까요?</Text>
						<Text style={styles.confirmDesc}>선택한 {selectedForRemove.size}개의 속담을{'\n'}이 속담집에서 제거합니다.</Text>
						<View style={styles.confirmBtnRow}>
							<TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setRemoveConfirmVisible(false)}>
								<Text style={[styles.confirmBtnText, { color: '#334155' }]}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]} onPress={handleRemoveConfirm}>
								<Text style={[styles.confirmBtnText, { color: '#fff' }]}>빼기</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
};

export default MyProverbBookDetail;

const styles = StyleSheet.create({
	main: { flex: 1, backgroundColor: '#F8FAFC' },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scaleWidth(16), paddingVertical: scaleHeight(12), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: scaleWidth(10) },
	headerTitle: { flex: 1, fontSize: scaledSize(18), fontWeight: '800', color: '#334155', textAlign: 'center' },
	headerAction: { fontSize: scaledSize(14), fontWeight: '700', color: '#3B82F6' },
	summaryCard: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), margin: scaleWidth(16), marginBottom: scaleHeight(8), padding: scaleWidth(14), backgroundColor: '#fff', borderRadius: scaleWidth(16), borderWidth: 1 },
	summaryIcon: { width: scaleWidth(46), height: scaleWidth(46), borderRadius: scaleWidth(13), alignItems: 'center', justifyContent: 'center' },
	summaryDesc: { fontSize: scaledSize(12), color: '#94A3B8', marginBottom: scaleHeight(2) },
	summaryCount: { fontSize: scaledSize(14), color: '#334155', fontWeight: '600' },
	summaryRecord: { fontSize: scaledSize(12), color: '#64748B', marginTop: scaleHeight(3) },
	actionRow: { flexDirection: 'row', gap: scaleWidth(10), paddingHorizontal: scaleWidth(16), marginBottom: scaleHeight(8) },
	actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(6), height: scaleHeight(44), borderRadius: scaleWidth(12) },
	actionBtnText: { fontSize: scaledSize(14), fontWeight: '700' },
	listContent: { paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(4), paddingBottom: scaleHeight(100), flexGrow: 1 },
	itemCard: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), backgroundColor: '#fff', borderRadius: scaleWidth(14), paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(14), marginBottom: scaleHeight(10), borderWidth: 1, borderColor: '#F1F5F9' },
	itemCardSelected: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
	itemIndexWrap: { width: scaleWidth(24), alignItems: 'center' },
	itemIndex: { fontSize: scaledSize(13), fontWeight: '700', color: '#94A3B8' },
	checkbox: { width: scaleWidth(22), height: scaleWidth(22), borderRadius: scaleWidth(6), borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
	checkboxChecked: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
	itemProverb: { fontSize: scaledSize(15), fontWeight: '700', color: '#1E293B' },
	itemMeaning: { fontSize: scaledSize(12.5), color: '#64748B', marginTop: scaleHeight(3) },
	itemBadges: { gap: scaleHeight(4), alignItems: 'flex-end' },
	miniBadge: { paddingHorizontal: scaleWidth(7), paddingVertical: scaleHeight(2), borderRadius: scaleWidth(8) },
	miniBadgeText: { color: '#fff', fontSize: scaledSize(9), fontWeight: '700' },
	emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: scaleHeight(80) },
	emptyTitle: { fontSize: scaledSize(16), fontWeight: '700', color: '#334155', marginTop: scaleHeight(12), marginBottom: scaleHeight(6) },
	emptyDesc: { fontSize: scaledSize(13), color: '#94A3B8', textAlign: 'center' },
	removeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(12), paddingBottom: scaleHeight(20), borderTopWidth: 1, borderTopColor: '#F1F5F9' },
	removeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(8), height: scaleHeight(50), borderRadius: scaleWidth(12), backgroundColor: '#EF4444' },
	removeBtnDisabled: { backgroundColor: '#CBD5E1' },
	removeBtnText: { color: '#fff', fontSize: scaledSize(15), fontWeight: '700' },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scaleWidth(32) },
	confirmModal: { width: '100%', backgroundColor: '#fff', borderRadius: scaleWidth(20), padding: scaleWidth(24), alignItems: 'center' },
	confirmTitle: { fontSize: scaledSize(17), fontWeight: '800', color: '#334155', marginTop: scaleHeight(12), marginBottom: scaleHeight(8) },
	confirmDesc: { fontSize: scaledSize(14), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(21), marginBottom: scaleHeight(20) },
	confirmBtnRow: { flexDirection: 'row', width: '100%', gap: scaleWidth(10) },
	confirmBtn: { flex: 1, height: scaleHeight(46), borderRadius: scaleWidth(12), justifyContent: 'center', alignItems: 'center' },
	confirmBtnText: { fontSize: scaledSize(14), fontWeight: '700' },
});
