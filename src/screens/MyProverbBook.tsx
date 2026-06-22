/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import CommonHeader from './common/CommonHeader';
import { moderateScale, scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { CONST_MAIN_DATA } from '@/const/ConstMainData';
import { Paths } from '@/navigation/conf/Paths';
import BottomHomeButton from './common/BottomHomeButton';
import BookFormModal from './modal/BookFormModal';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import QuizModeModal from './modal/QuizModeModal';
import AddProverbModal from './modal/AddProverbModal';
import SuccessToast from './common/SuccessToast';

const DEFAULT_COLOR = '#22C55E';
const DEFAULT_ICON = 'menu-book';

type SortType = 'latest' | 'name' | 'count';

const SORT_OPTIONS: { key: SortType; label: string }[] = [
	{ key: 'latest', label: '최신순' },
	{ key: 'name', label: '이름순' },
	{ key: 'count', label: '많은 순' },
];

const STORAGE_KEY = MainStorageKeyType.USER_PROVERB_BOOKS;

const MyProverbBook = () => {
	const navigation = useNavigation<any>();
	const ALL_PROVERBS = CONST_MAIN_DATA.PROVERB;
	const scrollViewRef = useRef<ScrollView>(null);
	const [showScrollTop, setShowScrollTop] = useState(false);

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
		}
	};

	const handleScroll = (event: any) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		setShowScrollTop(offsetY > 300);
	};

	const scrollToTop = () => {
		scrollViewRef.current?.scrollTo({ y: 0, animated: true });
	};

	const showToast = (message: string, subMessage?: string) => {
		setToast({ visible: true, message, subMessage });
	};

	const saveBooks = async (updated: MainDataType.ProverbBook[]) => {
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		setBooks(updated);
	};

	const ProverbLimitBanner = ({ folderCount }: { folderCount: number }) => (
		<View
			style={{
				marginHorizontal: scaleWidth(16),
				marginTop: scaleHeight(8),
				marginBottom: scaleHeight(16),
				borderWidth: 1.5,
				borderColor: '#F59E0B',
				backgroundColor: '#FEF3C7',
				borderRadius: scaleWidth(16),
				borderStyle: 'dashed',
				padding: scaleWidth(14),
				flexDirection: 'row',
				alignItems: 'center',
				gap: scaleWidth(10),
			}}>
			<Text style={{ fontSize: moderateScale(16), color: '#C2410C' }}>(°□°)</Text>
			<View style={{ flex: 1 }}>
				<Text style={{ fontSize: moderateScale(12), fontWeight: '700', color: '#C2410C', marginBottom: scaleHeight(2) }}>벌써 {folderCount}개나 만드셨네요!</Text>
				<Text style={{ fontSize: moderateScale(11), color: '#9A3412', lineHeight: moderateScale(16) }}>나만의 속담집을 더 만들어보세요 ✨</Text>
			</View>
		</View>
	);

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
			const newBook: MainDataType.ProverbBook = {
				id: Date.now().toString(),
				proverbIds: [],
				createdAt: new Date().toISOString(),
				...data,
			};
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

	const startQuiz = (book: MainDataType.ProverbBook, mode: 'meaning' | 'proverb' | 'blank' | 'example' | 'etc') => {
		const pool = ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id));
		setQuizModeModal(null);

		navigation.navigate(Paths.QUIZ, {
			questionPool: pool,
			title: book.title,
			mode: mode as 'meaning' | 'proverb' | 'blank' | 'example',
			selectedLevel: '전체',
			levelKey: '전체',
			isPracticeMode: true,
			practiceBookId: book.id,
		});
	};

	return (
		<>
			<SafeAreaView style={styles.main} edges={['top', 'bottom']}>
				<CommonHeader
					title="나만의 속담집"
					onBack={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME })}
					right={
						books.length > 0 ? (
							<View style={styles.headerCountBadge}>
								<Text style={styles.headerCountBadgeText}>{searchQuery ? `${filteredBooks.length}/${books.length}` : `${books.length}`}</Text>
							</View>
						) : null
					}
				/>

				{books.length > 0 && (
					<View style={styles.filterContainer}>
						<View style={styles.searchBox}>
							<IconComponent type="materialIcons" name="search" size={scaledSize(18)} color="#94A3B8" />
							<TextInput style={styles.searchInput} placeholder="속담집 검색..." placeholderTextColor="#94A3B8" value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" />
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

				<Animated.ScrollView
					ref={scrollViewRef}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					style={{ opacity: fadeAnim }}
					contentContainerStyle={styles.booksContainer}
					showsVerticalScrollIndicator={false}
					onScroll={handleScroll}
					scrollEventThrottle={16}>
					{books.length === 0 ? (
						<View style={styles.emptyView}>
							<IconComponent type="materialIcons" name="menu-book" size={scaledSize(56)} color="#E2E8F0" />
							<Text style={styles.emptyTitle}>아직 만든 속담집이 없습니다</Text>
							<Text style={styles.emptyDesc}>{'지금 만들기 버튼을 눌러서 추가해보세요!'}</Text>
							<TouchableOpacity style={styles.emptyBtn} onPress={() => setFormTarget(null)}>
								<Text style={styles.emptyBtnText}>지금 만들기</Text>
							</TouchableOpacity>
						</View>
					) : (
						<>
							{filteredBooks.length === 0 ? (
								<View style={styles.emptyView}>
									<IconComponent type="materialIcons" name="search-off" size={scaledSize(52)} color="#E2E8F0" />
									<Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
									<Text style={styles.emptyDesc}>{`'${searchQuery}'와 일치하는\n속담집이 없습니다.`}</Text>
									<TouchableOpacity style={styles.emptyBtn} onPress={() => setSearchQuery('')}>
										<Text style={styles.emptyBtnText}>검색 초기화</Text>
									</TouchableOpacity>
								</View>
							) : (
								<>
									{filteredBooks.map((book) => {
										const bookColor = book.color || DEFAULT_COLOR;
										const bookIcon = book.icon || DEFAULT_ICON;
										const proverbs = ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id));
										const preview = proverbs.slice(0, 4);
										return (
											<TouchableOpacity key={book.id} style={styles.bookCard} onPress={() => navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: book.id })}>
												<View style={styles.bookCardPreviewHeader}>
													<View style={[styles.bookCardIconWrap, { backgroundColor: bookColor, shadowColor: bookColor, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6 }]}>
														<IconComponent type="materialIcons" name={bookIcon} size={scaledSize(26)} color="#fff" />
													</View>
													<View style={{ flex: 1 }}>
														<View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(3), overflow: 'hidden' }}>
															<Text style={[styles.bookCardTitle, { color: '#334155', flexShrink: 1 }]} numberOfLines={1}>
																{book.title}
															</Text>
															<Text style={[styles.bookCardBadgeText, { color: '#94A3B8' }]} numberOfLines={1}>
																({book.proverbIds.length}개)
															</Text>
														</View>
														{!!book.description && (
															<Text style={styles.bookCardDesc} numberOfLines={1}>
																{book.description}
															</Text>
														)}
													</View>
													<TouchableOpacity
														style={styles.moreBtn}
														onPress={(e) => {
															e.stopPropagation();
															setActionSheet(book);
														}}
														hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
														<IconComponent type="materialIcons" name="more-vert" size={scaledSize(22)} color="#94A3B8" />
													</TouchableOpacity>
												</View>
												{proverbs.length > 0 ? (
													<View style={{ position: 'relative' }}>
														<View style={styles.previewRow}>
															{preview.slice(0, Math.min(4, preview.length)).map((p) => (
																<View key={p.id} style={styles.previewTag}>
																	<Text style={styles.previewTagText} numberOfLines={1}>
																		{p.proverb}
																	</Text>
																</View>
															))}
															{proverbs.length > 4 && (
																<View style={styles.previewTag}>
																	<Text style={styles.previewTagText}>+{proverbs.length - 4}</Text>
																</View>
															)}
														</View>
														<View style={styles.cardNavOverlay}>
															<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(20)} color="#DBEAFE" />
														</View>
													</View>
												) : (
													<View style={styles.emptyPreview}>
														<Text style={styles.emptyPreviewText}>탭해서 속담을 추가해보세요!</Text>
													</View>
												)}
												<TouchableOpacity
													style={[styles.quizBtn, book.proverbIds.length === 0 && styles.quizBtnDisabled]}
													disabled={book.proverbIds.length === 0}
													onPress={(e) => {
														e.stopPropagation();
														setQuizModeModal(book);
													}}>
													<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(16)} color="#fff" />
													<Text style={styles.quizBtnText}>퀴즈 시작</Text>
												</TouchableOpacity>
											</TouchableOpacity>
										);
									})}

									{books.length >= 3 && <ProverbLimitBanner folderCount={books.length} />}
								</>
							)}
						</>
					)}
				</Animated.ScrollView>
				<TouchableOpacity style={[styles.fab, showScrollTop && styles.fabScrollTop]} onPress={showScrollTop ? scrollToTop : () => setFormTarget(null)}>
					<IconComponent type="materialIcons" name={showScrollTop ? 'keyboard-arrow-up' : 'add'} size={scaledSize(28)} color="#fff" />
				</TouchableOpacity>
				<BottomHomeButton backgroundColor="#F1F5F9" />
			</SafeAreaView>

			<BookFormModal visible={formVisible} editTarget={formTarget ?? null} onClose={() => setFormTarget(undefined)} onSubmit={handleFormSubmit} />
			<SuccessToast visible={toast.visible} message={toast.message} subMessage={toast.subMessage} bottom={60} onHide={() => setToast((prev) => ({ ...prev, visible: false }))} />

			<QuizModeModal
				book={quizModeModal}
				onClose={() => setQuizModeModal(null)}
				onSelect={(book, mode) => {
					setQuizModeModal(null);
					startQuiz(book, mode);
				}}
			/>

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

			<Modal visible={!!actionSheet} transparent animationType="slide">
				<TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={() => setActionSheet(null)}>
					<TouchableOpacity activeOpacity={1} style={styles.actionSheet}>
						<View style={styles.actionSheetHandle} />

						<TouchableOpacity
							style={styles.actionItem}
							onPress={() => {
								setActionSheet(null);
								actionSheet && navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: actionSheet.id });
							}}>
							<View style={[styles.actionItemIcon, { backgroundColor: (actionSheet?.color || DEFAULT_COLOR) + '20' }]}>
								<IconComponent type="materialIcons" name={actionSheet?.icon || DEFAULT_ICON} size={scaledSize(18)} color={actionSheet?.color || DEFAULT_COLOR} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel} numberOfLines={1}>
									{actionSheet?.title}
								</Text>
								{!!actionSheet?.description && (
									<Text style={styles.actionItemDesc} numberOfLines={1}>
										{actionSheet.description}
									</Text>
								)}
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color="#E2E8F0" />
						</TouchableOpacity>

						<View style={styles.actionDivider} />

						<TouchableOpacity
							style={styles.actionItem}
							onPress={() => {
								setAddProverbModal(actionSheet);
								setActionSheet(null);
							}}>
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

						<TouchableOpacity
							style={styles.actionItem}
							onPress={() => {
								setFormTarget(actionSheet);
								setActionSheet(null);
							}}>
							<View style={[styles.actionItemIcon, { backgroundColor: '#EFF6FF' }]}>
								<IconComponent type="materialIcons" name="edit" size={scaledSize(18)} color="#22C55E" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel}>수정</Text>
								<Text style={styles.actionItemDesc}>속담집 이름, 색상, 아이콘 변경하기</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color="#E2E8F0" />
						</TouchableOpacity>

						<View style={styles.actionDivider} />

						<TouchableOpacity
							style={styles.actionItem}
							onPress={() => {
								setDeleteConfirm(actionSheet);
								setActionSheet(null);
							}}>
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

			{addProverbModal && (
				<AddProverbModal visible={!!addProverbModal} book={addProverbModal} onClose={() => setAddProverbModal(null)} onAdd={(ids) => addProverbModal && handleAddProverbs(addProverbModal, ids)} />
			)}
		</>
	);
};

export default MyProverbBook;

const styles = StyleSheet.create({
	main: { flex: 1, backgroundColor: '#F1F5F9', marginTop: scaleHeight(-20) },
	headerCountBadge: { marginLeft: 'auto', backgroundColor: '#EFF6FF', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(3) },
	headerCountBadgeText: { fontSize: scaledSize(12), fontWeight: '700', color: '#2563EB' },
	filterContainer: {
		paddingHorizontal: scaleWidth(14),
		paddingTop: scaleHeight(16),
		paddingBottom: scaleHeight(16),
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#F1F5F9',
		borderRadius: scaleWidth(16),
		marginHorizontal: scaleWidth(12),
		marginTop: scaleHeight(8),
	},
	searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(9), gap: scaleWidth(8), borderWidth: 1, borderColor: '#F1F5F9' },
	searchInput: { flex: 1, fontSize: scaledSize(14), color: '#334155', padding: 0 },
	sortRow: { flexDirection: 'row', alignItems: 'center', marginTop: scaleHeight(10), gap: scaleWidth(6) },
	sortChip: { paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(5), borderRadius: scaleWidth(20), backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#F1F5F9' },
	sortChipActive: { backgroundColor: '#EFF6FF', borderColor: '#22C55E' },
	sortChipText: { fontSize: scaledSize(12), color: '#94A3B8', fontWeight: '600' },
	sortChipTextActive: { color: '#22C55E' },
	booksContainer: { flexGrow: 1, paddingHorizontal: scaleWidth(14), paddingTop: scaleHeight(12), paddingBottom: scaleHeight(100) },
	bookCard: { backgroundColor: '#fff', borderRadius: scaleWidth(16), borderWidth: 1, borderColor: '#E2E8F0', padding: scaleWidth(14), marginBottom: scaleHeight(14), shadowOpacity: 0.15, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
	quizBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scaleWidth(6), paddingVertical: scaleHeight(9), borderRadius: scaleWidth(10), marginTop: scaleHeight(10), backgroundColor: '#3B82F6' },
	bookCardBadgeText: { fontSize: scaledSize(12), fontWeight: '700' },
	previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(6), marginVertical: scaleHeight(12) },
	previewTag: { borderRadius: scaleWidth(8), paddingHorizontal: scaleWidth(8), paddingVertical: scaleHeight(3), borderWidth: 1, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', maxWidth: scaleWidth(150) },
	previewTagText: { fontSize: scaledSize(11), fontWeight: '600', color: '#475569' },
	emptyPreview: { paddingVertical: scaleHeight(10), marginVertical: scaleHeight(12), alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: scaleWidth(10), borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
	emptyPreviewText: { fontSize: scaledSize(12), color: '#94A3B8' },
	emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 0 },
	emptyTitle: { fontSize: scaledSize(16), fontWeight: '700', color: '#334155', marginTop: scaleHeight(16) },
	emptyDesc: { fontSize: scaledSize(13), color: '#94A3B8', textAlign: 'center', lineHeight: scaleHeight(20), marginTop: scaleHeight(8) },
	emptyBtn: { marginTop: scaleHeight(20), backgroundColor: '#3B82F6', paddingHorizontal: scaleWidth(24), paddingVertical: scaleHeight(12), borderRadius: scaleWidth(30) },
	emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: scaledSize(14) },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	confirmModal: { width: '80%', backgroundColor: '#fff', borderRadius: scaleWidth(18), padding: scaleWidth(24), alignItems: 'center' },
	confirmTitle: { fontSize: scaledSize(16), fontWeight: '700', color: '#334155', marginTop: scaleHeight(12) },
	confirmDesc: { fontSize: scaledSize(13), color: '#64748B', textAlign: 'center', lineHeight: scaleHeight(20), marginTop: scaleHeight(6), marginBottom: scaleHeight(20) },
	confirmBtnRow: { flexDirection: 'row', gap: scaleWidth(10), width: '100%' },
	confirmBtn: { flex: 1, paddingVertical: scaleHeight(12), borderRadius: scaleWidth(10), alignItems: 'center' },
	confirmBtnText: { fontWeight: '700', fontSize: scaledSize(14) },
	moreBtn: { padding: scaleWidth(4), marginLeft: scaleWidth(4) },
	actionSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	actionSheet: { backgroundColor: '#fff', borderTopLeftRadius: scaleWidth(20), borderTopRightRadius: scaleWidth(20), paddingHorizontal: scaleWidth(16), paddingBottom: scaleHeight(34), paddingTop: scaleHeight(8) },
	actionSheetHandle: { width: scaleWidth(36), height: scaleHeight(4), backgroundColor: '#E2E8F0', borderRadius: scaleWidth(2), alignSelf: 'center', marginBottom: scaleHeight(16) },
	actionItem: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), paddingVertical: scaleHeight(13), paddingHorizontal: scaleWidth(4) },
	actionItemIcon: { width: scaleWidth(36), height: scaleWidth(36), borderRadius: scaleWidth(10), justifyContent: 'center', alignItems: 'center' },
	actionItemLabel: { fontSize: scaledSize(15), fontWeight: '600', color: '#334155' },
	actionItemDesc: { fontSize: scaledSize(12), color: '#94A3B8', marginTop: scaleHeight(1) },
	actionDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: scaleHeight(4) },
	actionCancelBtn: { marginTop: scaleHeight(8), paddingVertical: scaleHeight(14), backgroundColor: '#F8FAFC', borderRadius: scaleWidth(12), alignItems: 'center' },
	actionCancelText: { fontSize: scaledSize(15), fontWeight: '600', color: '#64748B' },
	quizBtnDisabled: { backgroundColor: '#94A3B8' },
	quizBtnText: { fontSize: scaledSize(13), fontWeight: '700', color: '#fff' },
	bookCardPreviewHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: scaleHeight(12), marginBottom: scaleHeight(2), borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: scaleWidth(10) },
	bookCardIconWrap: { width: scaleWidth(44), height: scaleWidth(44), borderRadius: scaleWidth(12), justifyContent: 'center', alignItems: 'center' },
	bookCardTitle: { fontSize: scaledSize(15), fontWeight: '700', color: '#334155' },
	bookCardDesc: { fontSize: scaledSize(11), color: '#94A3B8', marginTop: scaleHeight(2) },
	cardNavOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, justifyContent: 'center', paddingRight: scaleWidth(4), paddingLeft: scaleWidth(16), backgroundColor: 'rgba(255, 255, 255, 0.9)', borderTopRightRadius: scaleWidth(8), borderBottomRightRadius: scaleWidth(8) },
	fab: { position: 'absolute', bottom: scaleHeight(28 + 70), right: scaleWidth(20), width: scaleWidth(50), height: scaleWidth(50), borderRadius: scaleWidth(25), backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#22C55E', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
	fabScrollTop: { backgroundColor: '#3B82F6', shadowColor: '#22C55E' },
});
