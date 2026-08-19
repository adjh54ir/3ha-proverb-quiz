/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Animated, Image, KeyboardAvoidingView, Keyboard, Platform, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, HERO } from '@/const/common/Theme';
import { Paths } from '@/navigation/conf/Paths';
import BottomHomeButton from './common/BottomHomeButton';
import BookFormModal from './modal/BookFormModal';
import AddProverbModal from './modal/AddProverbModal';
import QuizModeModal from './modal/QuizModeModal';
import FavoriteToast from './common/FavoriteToast';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import DateUtils from '@/utils/DateUtils';

const DEFAULT_COLOR = COLORS.primary;
const DEFAULT_ICON = 'menu-book';
const STORAGE_KEY = MainStorageKeyType.USER_PROVERB_BOOKS;

type SortType = 'latest' | 'name' | 'count';
const SORT_OPTIONS: { key: SortType; label: string }[] = [
	{ key: 'latest', label: '최신순' },
	{ key: 'name', label: '이름순' },
	{ key: 'count', label: '많은 순' },
];

/**
 * 리스트 아이템 fade + slide-up 진입 애니메이션 래퍼
 */
const AnimatedListItem = React.memo(({ children, index }: { children: React.ReactNode; index: number }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(scaleHeight(12))).current;

	useEffect(() => {
		// 처음 6개만 stagger, 이후는 즉시 표시 (스크롤 성능 보호)
		const delay = index < 6 ? index * 40 : 0;
		const anim = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay, useNativeDriver: true }),
			Animated.timing(translateY, { toValue: 0, duration: 250, delay, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, []);

	return <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>{children}</Animated.View>;
});

const MyProverbBook = () => {
	const navigation = useNavigation<any>();
	const insets = useSafeAreaInsets();
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
			const newBook: MainDataType.ProverbBook = { id: DateUtils.nowTime().toString(), proverbIds: [], createdAt: DateUtils.now().toISOString(), ...data };
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
				<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
				{/* 검색창 밖을 누르면 키보드가 닫힌다 */}
				<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
				<View style={styles.keyboardWrap}>
				{/* 헤더 */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
						<IconComponent type="materialIcons" name="arrow-back" size={scaledSize(22)} color={COLORS.text} />
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
						<View style={styles.libraryHero}>
							<View style={styles.libraryHeroCopy}>
								<Text style={styles.libraryHeroTitle}>나만의 지혜 책장을 채워보세요</Text>
								<Text style={styles.libraryHeroDescription}>마음에 드는 속담을 주제별로 모을 수 있어요.</Text>
							</View>
							<Image source={require('@/assets/images/screen-heroes/proverb-library.png')} style={styles.libraryHeroImage} resizeMode="contain" />
						</View>
						<View style={styles.searchBox}>
							<IconComponent type="materialIcons" name="search" size={scaledSize(18)} color={COLORS.textLight} />
							<TextInput style={styles.searchInput} placeholder="속담집 검색..." placeholderTextColor={COLORS.textLight} value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" />
							{!!searchQuery && (
								<TouchableOpacity onPress={() => setSearchQuery('')}>
									<IconComponent type="materialIcons" name="cancel" size={scaledSize(16)} color={COLORS.textLight} />
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
							<Image source={require('@/assets/images/screen-heroes/library-shelf.png')} style={styles.emptyShelfImage} resizeMode="contain" />
							<Text style={styles.emptyTitle}>아직 만든 속담집이 없습니다</Text>
							<Text style={styles.emptyDesc}>지금 만들기 버튼을 눌러서 추가해보세요!</Text>
							<TouchableOpacity style={styles.emptyBtn} onPress={() => setFormTarget(null)}>
								<Text style={styles.emptyBtnText}>지금 만들기</Text>
							</TouchableOpacity>
						</View>
					) : filteredBooks.length === 0 ? (
						<View style={styles.emptyView}>
							<Image source={require('@/assets/images/feature-states/empty-search.png')} style={styles.emptyImage} resizeMode="contain" />
							<Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
							<Text style={styles.emptyDesc}>{`'${searchQuery}'와 일치하는\n속담집이 없습니다.`}</Text>
							<TouchableOpacity style={styles.emptyBtn} onPress={() => setSearchQuery('')}>
								<Text style={styles.emptyBtnText}>검색 초기화</Text>
							</TouchableOpacity>
						</View>
					) : (
						filteredBooks.map((book, index) => {
							const bookColor = book.color || DEFAULT_COLOR;
							const bookIcon = book.icon || DEFAULT_ICON;
							const proverbs = ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id));
							const preview = proverbs.slice(0, 4);
							return (
								<AnimatedListItem key={book.id} index={index}>
								<TouchableOpacity style={styles.bookCard} activeOpacity={0.8} onPress={() => navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: book.id })}>
									<View style={styles.bookCardPreviewHeader}>
										<View style={[styles.bookCardIconWrap, { backgroundColor: bookColor, }]}>
											<IconComponent type="materialIcons" name={bookIcon} size={scaledSize(26)} color={COLORS.textWhite} />
										</View>
										<View style={{ flex: 1 }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.xs, overflow: 'hidden' }}>
												<Text style={[styles.bookCardTitle, { flexShrink: 1 }]} numberOfLines={1}>{book.title}</Text>
												<Text style={styles.bookCardBadgeText} numberOfLines={1}>({book.proverbIds.length}개)</Text>
											</View>
											{!!book.description && <Text style={styles.bookCardDesc} numberOfLines={1}>{book.description}</Text>}
										</View>
										<TouchableOpacity style={styles.moreBtn} onPress={(e) => { e.stopPropagation(); setActionSheet(book); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
											<IconComponent type="materialIcons" name="more-vert" size={scaledSize(22)} color={COLORS.textLight} />
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
										<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(16)} color={COLORS.textWhite} />
										<Text style={styles.quizBtnText}>퀴즈 시작</Text>
									</TouchableOpacity>
								</TouchableOpacity>
								</AnimatedListItem>
							);
						})
					)}
				</Animated.ScrollView>

				<TouchableOpacity style={styles.fab} onPress={() => setFormTarget(null)}>
					<IconComponent type="materialIcons" name="add" size={scaledSize(28)} color={COLORS.textWhite} />
				</TouchableOpacity>
				<BottomHomeButton backgroundColor={COLORS.surfaceAlt} skipConfirm />
				</View>
				</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
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
						<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(40)} color={COLORS.danger} />
						<Text style={styles.confirmTitle}>속담집을 삭제할까요?</Text>
						<Text style={styles.confirmDesc}>
							<Text style={{ fontWeight: '700' }}>{deleteConfirm?.title}</Text>을 삭제하면{'\n'}복구할 수 없어요.
						</Text>
						<View style={styles.confirmBtnRow}>
							<TouchableOpacity style={[styles.confirmBtn, styles.confirmBtnCancel]} onPress={() => setDeleteConfirm(null)}>
								<Text style={[styles.confirmBtnText, { color: COLORS.text }]}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.confirmBtn, styles.confirmBtnDelete]} onPress={() => deleteConfirm && handleDeleteBook(deleteConfirm)}>
								<Text style={[styles.confirmBtnText, { color: COLORS.textWhite }]}>삭제</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* 액션시트 */}
			<Modal visible={!!actionSheet} transparent animationType="slide">
				<TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={() => setActionSheet(null)}>
					<TouchableOpacity activeOpacity={1} style={[styles.actionSheet, { paddingBottom: Math.max(insets.bottom, SPACING_H.xxl) }]}>
						<View style={styles.actionSheetHandle} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); b && navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: b.id }); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: (actionSheet?.color || DEFAULT_COLOR) + '20' }]}>
								<IconComponent type="materialIcons" name={actionSheet?.icon || DEFAULT_ICON} size={scaledSize(18)} color={actionSheet?.color || DEFAULT_COLOR} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel} numberOfLines={1}>{actionSheet?.title}</Text>
								{!!actionSheet?.description && <Text style={styles.actionItemDesc} numberOfLines={1}>{actionSheet.description}</Text>}
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color={COLORS.border} />
						</TouchableOpacity>
						<View style={styles.actionDivider} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); setAddProverbModal(b); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: COLORS.primaryBg }]}>
								<IconComponent type="materialIcons" name="add-circle-outline" size={scaledSize(18)} color={COLORS.primary} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel}>속담 추가</Text>
								<Text style={styles.actionItemDesc}>속담집에 속담 추가하기</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color={COLORS.border} />
						</TouchableOpacity>
						<View style={styles.actionDivider} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); setFormTarget(b); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: COLORS.primaryBg }]}>
								<IconComponent type="materialIcons" name="edit" size={scaledSize(18)} color={COLORS.primary} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel}>수정</Text>
								<Text style={styles.actionItemDesc}>이름, 색상, 아이콘 변경하기</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color={COLORS.border} />
						</TouchableOpacity>
						<View style={styles.actionDivider} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; setActionSheet(null); setDeleteConfirm(b); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: COLORS.dangerBg }]}>
								<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(18)} color={COLORS.danger} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={[styles.actionItemLabel, { color: COLORS.danger }]}>삭제</Text>
								<Text style={styles.actionItemDesc}>속담집을 영구적으로 삭제</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color={COLORS.border} />
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
	keyboardWrap: { flex: 1 },
	main: { flex: 1, backgroundColor: COLORS.background },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		backgroundColor: COLORS.surface,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.surfaceAlt,
	},
	headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textStrong },
	headerCountBadge: {
		minWidth: scaleWidth(24),
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.secondaryBg,
		alignItems: 'center',
	},
	headerCountBadgeText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.secondary },
	filterContainer: { paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, backgroundColor: COLORS.background },
	libraryHero: {
		minHeight: scaleHeight(112),
		marginBottom: SPACING_H.md,
		paddingLeft: SPACING_W.lg,
		backgroundColor: HERO.bg,
		borderTopWidth: 3,
		borderTopColor: HERO.accent,
		borderRadius: RADIUS.lg,
		flexDirection: 'row',
		alignItems: 'center',
		overflow: 'hidden',
	},
	libraryHeroCopy: { flex: 1, paddingVertical: SPACING_H.lg, zIndex: 1 },
	libraryHeroTitle: { fontSize: FONT_SIZES.lg, lineHeight: scaledSize(22), fontWeight: '800', color: HERO.title, marginBottom: SPACING_H.xs },
	libraryHeroDescription: { fontSize: FONT_SIZES.sm, lineHeight: scaledSize(18), color: HERO.description },
	libraryHeroImage: { width: scaleWidth(136), height: scaleHeight(108), marginRight: scaleWidth(-6) },
	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.sm,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING_W.md,
		height: scaleHeight(44),
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: 0 },
	sortRow: { flexDirection: 'row', columnGap: SPACING_W.sm, marginTop: SPACING_H.md },
	sortChip: {
		paddingHorizontal: SPACING_W.md,
		paddingVertical: SPACING_H.sm,
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	sortChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
	sortChipText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
	sortChipTextActive: { color: COLORS.textWhite },
	booksContainer: { paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, paddingBottom: scaleHeight(120), flexGrow: 1 },
	emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING_W.xl, paddingTop: SPACING_H.xxxxl },
	emptyImage: { width: scaleWidth(176), height: scaleWidth(176) },
	emptyShelfImage: { width: scaleWidth(220), height: scaleHeight(140) },
	emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong, marginTop: SPACING_H.md, marginBottom: SPACING_H.sm },
	emptyDesc: { fontSize: FONT_SIZES.smPlus, color: COLORS.textLight, textAlign: 'center', lineHeight: scaledSize(20) },
	emptyBtn: {
		marginTop: SPACING_H.xl,
		paddingHorizontal: SPACING_W.xxl,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.secondary,
	},
	emptyBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.md, fontWeight: '700' },
	bookCard: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.surfaceAlt,
	},
	bookCardPreviewHeader: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.md },
	bookCardIconWrap: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	bookCardTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong },
	bookCardBadgeText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textLight },
	bookCardDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginTop: SPACING_H.xs },
	moreBtn: { padding: SPACING_W.xs },
	previewRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING_W.xs, rowGap: SPACING_H.xs, marginTop: SPACING_H.md },
	previewTag: {
		maxWidth: '46%',
		backgroundColor: COLORS.surfaceAlt,
		borderRadius: RADIUS.sm,
		paddingHorizontal: SPACING_W.sm,
		paddingVertical: SPACING_H.xs,
	},
	previewTagText: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '600' },
	emptyPreview: {
		marginTop: SPACING_H.md,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.background,
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: COLORS.border,
		alignItems: 'center',
	},
	emptyPreviewText: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },
	quizBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		marginTop: SPACING_H.md,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
	},
	quizBtnDisabled: { backgroundColor: COLORS.borderDark },
	quizBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.md, fontWeight: '700' },
	fab: {
		position: 'absolute',
		right: SPACING_W.xl,
		bottom: scaleHeight(90),
		width: scaleWidth(56),
		height: scaleWidth(56),
		borderRadius: scaleWidth(56) / 2,
		backgroundColor: COLORS.secondary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: COLORS.dim,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING_W.xxxl,
	},
	confirmModal: {
		width: '100%',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.xl,
		paddingVertical: SPACING_H.xxl,
		alignItems: 'center',
	},
	confirmTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textStrong, marginTop: SPACING_H.md, marginBottom: SPACING_H.sm },
	confirmDesc: {
		fontSize: FONT_SIZES.md,
		color: COLORS.textSecondary,
		textAlign: 'center',
		lineHeight: scaledSize(21),
		marginBottom: SPACING_H.xl,
	},
	confirmBtnRow: { flexDirection: 'row', width: '100%', columnGap: SPACING_W.md },
	confirmBtn: { flex: 1, height: scaleHeight(48), borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
	confirmBtnCancel: { backgroundColor: COLORS.surfaceAlt },
	confirmBtnDelete: { backgroundColor: COLORS.danger },
	confirmBtnText: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700' },
	actionSheetOverlay: { flex: 1, backgroundColor: COLORS.dim, justifyContent: 'flex-end' },
	actionSheet: {
		backgroundColor: COLORS.surface,
		borderTopLeftRadius: RADIUS.xl,
		borderTopRightRadius: RADIUS.xl,
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.md,
		// paddingBottom 은 useSafeAreaInsets 로 런타임 주입 (하단 시스템 네비게이션 바 회피)
	},
	actionSheetHandle: {
		width: scaleWidth(40),
		height: scaleHeight(4),
		borderRadius: RADIUS.round,
		backgroundColor: COLORS.border,
		alignSelf: 'center',
		marginBottom: SPACING_H.md,
	},
	actionItem: { flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.md, paddingVertical: SPACING_H.md },
	actionItemIcon: {
		width: scaleWidth(40),
		height: scaleWidth(40),
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionItemLabel: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.textStrong },
	actionItemDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginTop: SPACING_H.xs },
	actionDivider: { height: 1, backgroundColor: COLORS.surfaceAlt },
	actionCancelBtn: {
		marginTop: SPACING_H.md,
		paddingVertical: SPACING_H.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.surfaceAlt,
		alignItems: 'center',
	},
	actionCancelText: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.textSecondary },
});
