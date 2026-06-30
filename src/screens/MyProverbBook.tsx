/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { Paths } from '@/navigation/conf/Paths';
import BottomHomeButton from './common/BottomHomeButton';
import BookFormModal from './modal/BookFormModal';
import AddProverbModal from './modal/AddProverbModal';
import QuizModeModal from './modal/QuizModeModal';
import FavoriteToast from './common/FavoriteToast';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';

const DEFAULT_COLOR = '#22C55E';
const DEFAULT_ICON = 'menu-book';
const STORAGE_KEY = MainStorageKeyType.USER_PROVERB_BOOKS;

type SortType = 'latest' | 'name' | 'count';
const SORT_OPTIONS: { key: SortType; label: string }[] = [
	{ key: 'latest', label: '최신순' },
	{ key: 'name', label: '이름순' },
	{ key: 'count', label: '많은 순' },
];

const MyProverbBook = () => {
	const navigation = useNavigation<any>();
	const ALL_PROVERBS = ProverbServices.selectProverbList();

	const [books, setBooks] = useState<MainDataType.ProverbBook[]>([]);
	const [actionSheet, setActionSheet] = useState<MainDataType.ProverbBook | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortType, setSortType] = useState<SortType>('latest');
	const [formTarget, setFormTarget] = useState<MainDataType.ProverbBook | null | undefined>(undefined);
	const formVisible = formTarget !== undefined;
	const [deleteConfirm, setDeleteConfirm] = useState<MainDataType.ProverbBook | null>(null);
	const [quizModeModal, setQuizModeModal] = useState<MainDataType.ProverbBook | null>(null);
	const [addProverbModal, setAddProverbModal] = useState<MainDataType.ProverbBook | null>(null);
	const [toast, setToast] = useState<{ visible: boolean; message: string; subMessage?: string }>({ visible: false, message: '' });

	const fadeAnim = useRef(new Animated.Value(1)).current;

	useFocusEffect(
		useCallback(() => {
			loadBooks();
			setToast({ visible: false, message: '' });
			fadeAnim.setValue(0);
			const fade = Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true });
			fade.start();
			return () => fade.stop();
		}, []),
	);

	const loadBooks = async () => {
		const json = await AsyncStorage.getItem(STORAGE_KEY);
		if (json) {
			const parsed: MainDataType.ProverbBook[] = JSON.parse(json).map((b: MainDataType.ProverbBook) => ({
				...b,
				color: b.color || DEFAULT_COLOR,
				icon: b.icon || DEFAULT_ICON,
			}));
			setBooks(parsed);
		} else {
			setBooks([]);
		}
	};

	const showToast = (message: string, subMessage?: string) => setToast({ visible: true, message, subMessage });

	const saveBooks = async (updated: MainDataType.ProverbBook[]) => {
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		setBooks(updated);
	};

	const filteredBooks = useMemo(() => {
		let result = [...books];
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			result = result.filter((b) => b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
		}
		switch (sortType) {
			case 'latest':
				result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				break;
			case 'name':
				result.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
				break;
			case 'count':
				result.sort((a, b) => b.proverbIds.length - a.proverbIds.length);
				break;
		}
		return result;
	}, [books, searchQuery, sortType]);

	const handleFormSubmit = async (data: { title: string; description: string; color: string; icon: string }) => {
		if (formTarget) {
			await saveBooks(books.map((b) => (b.id === formTarget.id ? { ...b, ...data } : b)));
			setFormTarget(undefined);
			showToast('속담집 수정', '속담집이 수정되었습니다.');
		} else {
			const newBook: MainDataType.ProverbBook = { id: Date.now().toString(), proverbIds: [], createdAt: new Date().toISOString(), ...data };
			await saveBooks([...books, newBook]);
			setFormTarget(undefined);
			showToast('속담집 생성', '속담집이 생성되었습니다.');
		}
	};

	const handleAddProverbs = async (book: MainDataType.ProverbBook, ids: number[]) => {
		const updatedBook = { ...book, proverbIds: [...new Set([...book.proverbIds, ...ids])] };
		await saveBooks(books.map((b) => (b.id === book.id ? updatedBook : b)));
		setAddProverbModal(null);
		showToast('속담 추가 완료', `${ids.length}개의 속담이 추가되었습니다.`);
	};

	const handleDeleteBook = async (book: MainDataType.ProverbBook) => {
		await saveBooks(books.filter((b) => b.id !== book.id));
		setDeleteConfirm(null);
		showToast('속담집이 삭제되었습니다', book.title);
	};

	const startQuiz = (book: MainDataType.ProverbBook, mode: 'meaning' | 'proverb' | 'blank' | 'example') => {
		const pool = ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id));
		setQuizModeModal(null);
		navigation.navigate(Paths.QUIZ, {
			questionPool: pool,
			title: book.title,
			mode,
			selectedLevel: '전체',
			levelKey: 'all',
			isWrongReview: true,
		});
	};

	return (
		<>
			<SafeAreaView style={styles.main} edges={['top', 'bottom']}>
				{/* 헤더 */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
						<IconComponent type="materialIcons" name="arrow-back" size={scaledSize(22)} color="#334155" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>나만의 속담집</Text>
					{books.length > 0 ? (
						<View style={styles.headerCountBadge}>
							<Text style={styles.headerCountBadgeText}>{searchQuery ? `${filteredBooks.length}/${books.length}` : `${books.length}`}</Text>
						</View>
					) : (
						<View style={{ width: scaleWidth(22) }} />
					)}
				</View>

				{books.length > 0 && (
					<View style={styles.filterContainer}>
						<View style={styles.searchBox}>
							<IconComponent type="materialIcons" name="search" size={scaledSize(18)} color="#94A3B8" />
							<TextInput style={styles.searchInput} placeholder="속담집 검색..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" />
							{!!searchQuery && (
								<TouchableOpacity onPress={() => setSearchQuery('')}>
									<IconComponent type="materialIcons" name="cancel" size={scaledSize(16)} color="#94A3B8" />
								</TouchableOpacity>
							)}
						</View>
						<View style={styles.sortRow}>
							{SORT_OPTIONS.map((opt) => (
								<TouchableOpacity key={opt.key} style={[styles.sortChip, sortType === opt.key && styles.sortChipActive]} onPress={() => setSortType(opt.key)}>
									<Text style={[styles.sortChipText, sortType === opt.key && styles.sortChipTextActive]}>{opt.label}</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				)}

				<Animated.ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ opacity: fadeAnim }} contentContainerStyle={styles.booksContainer} showsVerticalScrollIndicator={false}>
					{books.length === 0 ? (
						<View style={styles.emptyView}>
							<IconComponent type="materialIcons" name="menu-book" size={scaledSize(56)} color="#E2E8F0" />
							<Text style={styles.emptyTitle}>아직 만든 속담집이 없습니다</Text>
							<Text style={styles.emptyDesc}>지금 만들기 버튼을 눌러서 추가해보세요!</Text>
							<TouchableOpacity style={styles.emptyBtn} onPress={() => setFormTarget(null)}>
								<Text style={styles.emptyBtnText}>지금 만들기</Text>
							</TouchableOpacity>
						</View>
					) : filteredBooks.length === 0 ? (
						<View style={styles.emptyView}>
							<IconComponent type="materialIcons" name="search-off" size={scaledSize(52)} color="#E2E8F0" />
							<Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
							<Text style={styles.emptyDesc}>{`'${searchQuery}'와 일치하는\n속담집이 없습니다.`}</Text>
							<TouchableOpacity style={styles.emptyBtn} onPress={() => setSearchQuery('')}>
								<Text style={styles.emptyBtnText}>검색 초기화</Text>
							</TouchableOpacity>
						</View>
					) : (
						filteredBooks.map((book) => {
							const bookColor = book.color || DEFAULT_COLOR;
							const bookIcon = book.icon || DEFAULT_ICON;
							const proverbs = ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id));
							const preview = proverbs.slice(0, 4);
							return (
								<TouchableOpacity key={book.id} style={styles.bookCard} activeOpacity={0.9} onPress={() => navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: book.id })}>
									<View style={styles.bookCardPreviewHeader}>
										<View style={[styles.bookCardIconWrap, { backgroundColor: bookColor, shadowColor: bookColor, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6 }]}>
											<IconComponent type="materialIcons" name={bookIcon} size={scaledSize(26)} color="#fff" />
										</View>
										<View style={{ flex: 1 }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(3), overflow: 'hidden' }}>
												<Text style={[styles.bookCardTitle, { color: '#334155', flexShrink: 1 }]} numberOfLines={1}>{book.title}</Text>
												<Text style={[styles.bookCardBadgeText, { color: '#94A3B8' }]} numberOfLines={1}>({book.proverbIds.length}개)</Text>
											</View>
											{!!book.description && <Text style={styles.bookCardDesc} numberOfLines={1}>{book.description}</Text>}
										</View>
										<TouchableOpacity style={styles.moreBtn} onPress={(e) => { e.stopPropagation(); setActionSheet(book); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
											<IconComponent type="materialIcons" name="more-vert" size={scaledSize(22)} color="#94A3B8" />
										</TouchableOpacity>
									</View>
									{proverbs.length > 0 ? (
										<View style={styles.previewRow}>
											{preview.map((p) => (
												<View key={p.id} style={styles.previewTag}>
													<Text style={styles.previewTagText} numberOfLines={1}>{p.proverb}</Text>
												</View>
											))}
											{proverbs.length > 4 && (
												<View style={styles.previewTag}>
													<Text style={styles.previewTagText}>+{proverbs.length - 4}</Text>
												</View>
											)}
										</View>
									) : (
										<View style={styles.emptyPreview}>
											<Text style={styles.emptyPreviewText}>탭해서 속담을 추가해보세요!</Text>
										</View>
									)}
									<TouchableOpacity style={[styles.quizBtn, book.proverbIds.length === 0 && styles.quizBtnDisabled]} disabled={book.proverbIds.length === 0} onPress={(e) => { e.stopPropagation(); setQuizModeModal(book); }}>
										<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(16)} color="#fff" />
										<Text style={styles.quizBtnText}>퀴즈 시작</Text>
									</TouchableOpacity>
								</TouchableOpacity>
							);
						})
					)}
				</Animated.ScrollView>

				<TouchableOpacity style={styles.fab} onPress={() => setFormTarget(null)}>
					<IconComponent type="materialIcons" name="add" size={scaledSize(28)} color="#fff" />
				</TouchableOpacity>
				<BottomHomeButton backgroundColor="#F1F5F9" skipConfirm />
			</SafeAreaView>

			{/* 생성/편집 모달 */}
			<BookFormModal visible={formVisible} editTarget={formTarget ?? null} onClose={() => setFormTarget(undefined)} onSubmit={handleFormSubmit} />

			{/* 속담 추가 모달 */}
			<AddProverbModal visible={!!addProverbModal} book={addProverbModal} onClose={() => setAddProverbModal(null)} onAdd={handleAddProverbs} />

			{/* 퀴즈 모드 선택 */}
			<QuizModeModal book={quizModeModal} onClose={() => setQuizModeModal(null)} onSelect={(b, mode) => startQuiz(b, mode)} />

			<FavoriteToast visible={toast.visible} message={toast.message} subMessage={toast.subMessage} bottom={scaleHeight(60)} onHide={() => setToast((prev) => ({ ...prev, visible: false }))} />

			{/* 삭제 확인 */}
			<Modal visible={!!deleteConfirm} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.confirmModal}>
						<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(40)} color="#EF4444" />
						<Text style={styles.confirmTitle}>속담집을 삭제할까요?</Text>
						<Text style={styles.confirmDesc}>
							<Text style={{ fontWeight: '700' }}>{deleteConfirm?.title}</Text>을 삭제하면{'\n'}복구할 수 없어요.
						</Text>
						<View style={styles.confirmBtnRow}>
							<TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setDeleteConfirm(null)}>
								<Text style={[styles.confirmBtnText, { color: '#334155' }]}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]} onPress={() => deleteConfirm && handleDeleteBook(deleteConfirm)}>
								<Text style={[styles.confirmBtnText, { color: '#fff' }]}>삭제</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* 액션시트 */}
			<Modal visible={!!actionSheet} transparent animationType="slide">
				<TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={() => setActionSheet(null)}>
					<TouchableOpacity activeOpacity={1} style={styles.actionSheet}>
						<View style={styles.actionSheetHandle} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); b && navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: b.id }); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: (actionSheet?.color || DEFAULT_COLOR) + '20' }]}>
								<IconComponent type="materialIcons" name={actionSheet?.icon || DEFAULT_ICON} size={scaledSize(18)} color={actionSheet?.color || DEFAULT_COLOR} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel} numberOfLines={1}>{actionSheet?.title}</Text>
								{!!actionSheet?.description && <Text style={styles.actionItemDesc} numberOfLines={1}>{actionSheet.description}</Text>}
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color="#E2E8F0" />
						</TouchableOpacity>
						<View style={styles.actionDivider} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); setAddProverbModal(b); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: '#EFF6FF' }]}>
								<IconComponent type="materialIcons" name="add-circle-outline" size={scaledSize(18)} color="#22C55E" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel}>속담 추가</Text>
								<Text style={styles.actionItemDesc}>속담집에 속담 추가하기</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color="#E2E8F0" />
						</TouchableOpacity>
						<View style={styles.actionDivider} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); setFormTarget(b); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: '#EFF6FF' }]}>
								<IconComponent type="materialIcons" name="edit" size={scaledSize(18)} color="#22C55E" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel}>수정</Text>
								<Text style={styles.actionItemDesc}>이름, 색상, 아이콘 변경하기</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color="#E2E8F0" />
						</TouchableOpacity>
						<View style={styles.actionDivider} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); setDeleteConfirm(b); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: '#FEF2F2' }]}>
								<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(18)} color="#EF4444" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={[styles.actionItemLabel, { color: '#EF4444' }]}>삭제</Text>
								<Text style={styles.actionItemDesc}>속담집을 영구적으로 삭제</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color="#E2E8F0" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionCancelBtn} onPress={() => setActionSheet(null)}>
							<Text style={styles.actionCancelText}>취소</Text>
						</TouchableOpacity>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</>
	);
};

export default MyProverbBook;

const styles = StyleSheet.create({
	main: { flex: 1, backgroundColor: '#F8FAFC' },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scaleWidth(16), paddingVertical: scaleHeight(12), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
	headerTitle: { fontSize: scaledSize(18), fontWeight: '800', color: '#334155' },
	headerCountBadge: { minWidth: scaleWidth(22), paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(3), borderRadius: scaleWidth(12), backgroundColor: '#EFF6FF', alignItems: 'center' },
	headerCountBadgeText: { fontSize: scaledSize(12), fontWeight: '700', color: '#3B82F6' },
	filterContainer: { paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(12), backgroundColor: '#F8FAFC' },
	searchBox: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8), backgroundColor: '#fff', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(12), height: scaleHeight(42), borderWidth: 1, borderColor: '#E2E8F0' },
	searchInput: { flex: 1, fontSize: scaledSize(14), color: '#334155', paddingVertical: 0 },
	sortRow: { flexDirection: 'row', gap: scaleWidth(8), marginTop: scaleHeight(10), marginBottom: scaleHeight(4) },
	sortChip: { paddingHorizontal: scaleWidth(14), paddingVertical: scaleHeight(6), borderRadius: scaleWidth(20), backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
	sortChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
	sortChipText: { fontSize: scaledSize(12), fontWeight: '600', color: '#64748B' },
	sortChipTextActive: { color: '#fff' },
	booksContainer: { padding: scaleWidth(16), paddingBottom: scaleHeight(120), flexGrow: 1 },
	emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: scaleHeight(80) },
	emptyTitle: { fontSize: scaledSize(16), fontWeight: '700', color: '#334155', marginTop: scaleHeight(14), marginBottom: scaleHeight(6) },
	emptyDesc: { fontSize: scaledSize(13), color: '#94A3B8', textAlign: 'center', lineHeight: scaleHeight(20) },
	emptyBtn: { marginTop: scaleHeight(20), paddingHorizontal: scaleWidth(24), paddingVertical: scaleHeight(12), borderRadius: scaleWidth(12), backgroundColor: '#3B82F6' },
	emptyBtnText: { color: '#fff', fontSize: scaledSize(14), fontWeight: '700' },
	bookCard: { backgroundColor: '#fff', borderRadius: scaleWidth(18), padding: scaleWidth(16), marginBottom: scaleHeight(14), borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: scaleHeight(2) }, shadowOpacity: 0.05, shadowRadius: scaleWidth(8) },
	bookCardPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12) },
	bookCardIconWrap: { width: scaleWidth(48), height: scaleWidth(48), borderRadius: scaleWidth(14), alignItems: 'center', justifyContent: 'center' },
	bookCardTitle: { fontSize: scaledSize(16), fontWeight: '800' },
	bookCardBadgeText: { fontSize: scaledSize(12), fontWeight: '600' },
	bookCardDesc: { fontSize: scaledSize(12), color: '#94A3B8', marginTop: scaleHeight(3) },
	moreBtn: { padding: scaleWidth(2) },
	previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(6), marginTop: scaleHeight(12) },
	previewTag: { maxWidth: '46%', backgroundColor: '#F1F5F9', borderRadius: scaleWidth(8), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(5) },
	previewTagText: { fontSize: scaledSize(12), color: '#475569', fontWeight: '600' },
	emptyPreview: { marginTop: scaleHeight(12), paddingVertical: scaleHeight(14), borderRadius: scaleWidth(10), backgroundColor: '#F8FAFC', borderWidth: 1, borderStyle: 'dashed', borderColor: '#E2E8F0', alignItems: 'center' },
	emptyPreviewText: { fontSize: scaledSize(12), color: '#94A3B8' },
	quizBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(6), marginTop: scaleHeight(14), paddingVertical: scaleHeight(11), borderRadius: scaleWidth(12), backgroundColor: '#22C55E' },
	quizBtnDisabled: { backgroundColor: '#CBD5E1' },
	quizBtnText: { color: '#fff', fontSize: scaledSize(14), fontWeight: '700' },
	fab: { position: 'absolute', right: scaleWidth(20), bottom: scaleHeight(90), width: scaleWidth(56), height: scaleWidth(56), borderRadius: scaleWidth(28), backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: scaleHeight(4) }, shadowOpacity: 0.35, shadowRadius: scaleWidth(8) },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scaleWidth(32) },
	confirmModal: { width: '100%', backgroundColor: '#fff', borderRadius: scaleWidth(20), padding: scaleWidth(24), alignItems: 'center' },
	confirmTitle: { fontSize: scaledSize(17), fontWeight: '800', color: '#334155', marginTop: scaleHeight(12), marginBottom: scaleHeight(8) },
	confirmDesc: { fontSize: scaledSize(14), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(21), marginBottom: scaleHeight(20) },
	confirmBtnRow: { flexDirection: 'row', width: '100%', gap: scaleWidth(10) },
	confirmBtn: { flex: 1, height: scaleHeight(46), borderRadius: scaleWidth(12), justifyContent: 'center', alignItems: 'center' },
	confirmBtnText: { fontSize: scaledSize(14), fontWeight: '700' },
	actionSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	actionSheet: { backgroundColor: '#fff', borderTopLeftRadius: scaleWidth(24), borderTopRightRadius: scaleWidth(24), paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(10), paddingBottom: scaleHeight(24) },
	actionSheetHandle: { width: scaleWidth(40), height: scaleHeight(4), borderRadius: scaleWidth(2), backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: scaleHeight(14) },
	actionItem: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), paddingVertical: scaleHeight(12) },
	actionItemIcon: { width: scaleWidth(38), height: scaleWidth(38), borderRadius: scaleWidth(11), alignItems: 'center', justifyContent: 'center' },
	actionItemLabel: { fontSize: scaledSize(15), fontWeight: '700', color: '#334155' },
	actionItemDesc: { fontSize: scaledSize(12), color: '#94A3B8', marginTop: scaleHeight(2) },
	actionDivider: { height: 1, backgroundColor: '#F1F5F9' },
	actionCancelBtn: { marginTop: scaleHeight(10), paddingVertical: scaleHeight(14), borderRadius: scaleWidth(12), backgroundColor: '#F1F5F9', alignItems: 'center' },
	actionCancelText: { fontSize: scaledSize(15), fontWeight: '700', color: '#64748B' },
});
