/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { matchesKeyword } from '@/utils/SearchUtils';
import { useModalHandoff } from '@/hooks/useModalHandoff';
import useReducedMotion from '@/hooks/useReducedMotion';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, Easing, Image, KeyboardAvoidingView, Keyboard, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { Paths } from '@/navigation/conf/Paths';
import BottomHomeButton from './common/BottomHomeButton';
import BookFormModal from './modal/BookFormModal';
import AddProverbModal from './modal/AddProverbModal';
import QuizModeModal from './modal/QuizModeModal';
import { useToast } from '@/hooks/useToast';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import DateUtils from '@/utils/DateUtils';
import CharacterGuide, { useCharacterGuideOnce } from '@/screens/common/CharacterGuide';
import { withAlpha, ALPHA, readableTextOn } from '@/utils/ColorAlphaUtils';
import { AnimatedListItem } from '@/components/animation/FadeInView';
import ScreenHeader from '@/screens/common/ScreenHeader';

// 액션시트가 아래에서 올라오는 거리. 시트 높이보다 크기만 하면 되므로 화면 높이를 쓴다(세로 고정 앱).
const SHEET_SLIDE_FROM = Dimensions.get('screen').height;
const SHEET_SLIDE_DURATION = 260;
import { read, write } from '@/services/StorageService';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';

// 함수로 둬야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const getDefaultColor = () => COLORS.primary;
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

const MyProverbBook = () => {
	const modalSafePadding = useModalSafePadding();
	// 안내 정책: 화면에 처음 들어갈 때 1회 자동 노출. 다시 보려면 설정 > 화면 안내.
	const guide = useCharacterGuideOnce('myProverbBook');
	// 모달 → 모달 전환 시 이전 모달 깜빡임 방지
	const handoff = useModalHandoff();
	const navigation = useNavigation<any>();
	const insets = useSafeAreaInsets();
	const ALL_PROVERBS = ProverbServices.selectProverbList();

	const [books, setBooks] = useState<MainDataType.ProverbBook[]>([]);
	const [actionSheet, setActionSheet] = useState<MainDataType.ProverbBook | null>(null);

	// 액션시트 등장 모션.
	// animationType="slide" 는 딤까지 함께 밀어 올려 전환 내내 화면 위쪽이 딤 없이 비친다.
	// 그래서 모달은 animationType="fade" 로 딤을 화면 전체에 고르게 깔고, 시트만 여기서 올린다.
	const reducedMotion = useReducedMotion();
	const sheetSlide = useRef(new Animated.Value(SHEET_SLIDE_FROM)).current;

	useEffect(() => {
		// 닫힐 때 값을 되돌려 둬야 다음에 열릴 때 첫 프레임이 화면 밖에서 시작한다(잔상 방지).
		sheetSlide.setValue(SHEET_SLIDE_FROM);
		if (!actionSheet) {
			return;
		}
		const anim = Animated.timing(sheetSlide, {
			toValue: 0,
			duration: reducedMotion ? 0 : SHEET_SLIDE_DURATION,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		});
		anim.start();
		return () => anim.stop();
	}, [actionSheet, sheetSlide, reducedMotion]);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortType, setSortType] = useState<SortType>('latest');
	const [formTarget, setFormTarget] = useState<MainDataType.ProverbBook | null | undefined>(undefined);
	const formVisible = formTarget !== undefined;
	const [deleteConfirm, setDeleteConfirm] = useState<MainDataType.ProverbBook | null>(null);
	const [quizModeModal, setQuizModeModal] = useState<MainDataType.ProverbBook | null>(null);
	const [addProverbModal, setAddProverbModal] = useState<MainDataType.ProverbBook | null>(null);
	// 주요 CRUD 피드백은 공통 토스트 훅으로 통일한다(하단 고정 버튼을 피해 조금 띄운다).
	const { showToast, hideToast, ToastView } = useToast(scaleHeight(60));

	const fadeAnim = useRef(new Animated.Value(1)).current;
	const scrollRef = useRef<ScrollView>(null);

	useFocusEffect(
		useCallback(() => {
			loadBooks();
			hideToast();
			// 다시 들어올 때는 검색어/정렬/열려 있던 팝업을 초기화하고 맨 위에서 시작한다
			setSearchQuery('');
			setSortType('latest');
			setActionSheet(null);
			setFormTarget(undefined);
			setDeleteConfirm(null);
			setQuizModeModal(null);
			setAddProverbModal(null);
			Keyboard.dismiss();
			scrollRef.current?.scrollTo({ y: 0, animated: false });
			fadeAnim.setValue(0);
			const fade = Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true });
			fade.start();
			return () => fade.stop();
		}, []),
	);

	const loadBooks = async () => {
		const stored = await read<MainDataType.ProverbBook[]>(STORAGE_KEY, []);
		// 색/아이콘이 없던 예전 데이터는 기본값으로 채운다
		setBooks(stored.map((b) => ({ ...b, color: b.color || getDefaultColor(), icon: b.icon || DEFAULT_ICON })));
	};

	const saveBooks = async (updated: MainDataType.ProverbBook[]) => {
		await write(STORAGE_KEY, updated);
		setBooks(updated);
	};

	const filteredBooks = useMemo(() => {
		let result = [...books];
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			// 초성 검색 지원
			result = result.filter((b) => matchesKeyword(q, b.title, b.description));
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
				<ScreenHeader
					title="나만의 속담집"
					onBack={() => navigation.navigate(Paths.MAIN_TAB, { screen: Paths.HOME })}
					countLabel={books.length > 0 ? (searchQuery ? `${filteredBooks.length}/${books.length}` : `${books.length}`) : undefined}
				/>

				{books.length > 0 && (
					<View style={styles.filterContainer}>
						<View style={styles.searchBox}>
							<IconComponent type="materialIcons" name="search" size={scaledSize(18)} color={COLORS.textLight} />
							<TextInput style={styles.searchInput} placeholder="속담집 이름 또는 초성 검색" placeholderTextColor={COLORS.textLight} value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" />
							{!!searchQuery && (
								<TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={HIT_SLOP}>
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

				<Animated.ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ opacity: fadeAnim }} contentContainerStyle={[styles.booksContainer, filteredBooks.length === 0 && styles.booksContainerEmpty]} showsVerticalScrollIndicator={false}>
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
							<Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
							<Text style={styles.emptyDesc}>{`"${searchQuery}"와 일치하는\n속담집이 없습니다.`}</Text>
							<TouchableOpacity style={styles.emptyBtn} onPress={() => setSearchQuery('')}>
								<Text style={styles.emptyBtnText}>검색 초기화</Text>
							</TouchableOpacity>
						</View>
					) : (
						filteredBooks.map((book, index) => {
							const bookColor = book.color || getDefaultColor();
							const bookIcon = book.icon || DEFAULT_ICON;
							const proverbs = ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id));
							const preview = proverbs.slice(0, 4);
							return (
								<AnimatedListItem key={book.id} index={index}>
								<TouchableOpacity style={styles.bookCard} activeOpacity={0.8} onPress={() => navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: book.id })}>
									<View style={styles.bookCardPreviewHeader}>
										<View style={[styles.bookCardIconWrap, { backgroundColor: bookColor, }]}>
											<IconComponent type="materialIcons" name={bookIcon} size={scaledSize(26)} color={readableTextOn(bookColor)} />
										</View>
										<View style={{ flex: 1 }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', columnGap: SPACING_W.xs, overflow: 'hidden' }}>
												<Text style={[styles.bookCardTitle, { flexShrink: 1 }]} numberOfLines={1}>{book.title}</Text>
												<Text style={styles.bookCardBadgeText} numberOfLines={1}>({book.proverbIds.length}개)</Text>
											</View>
											{!!book.description && <Text style={styles.bookCardDesc} numberOfLines={1}>{book.description}</Text>}
										</View>
										<TouchableOpacity style={styles.moreBtn} onPress={(e) => { e.stopPropagation(); setActionSheet(book); }} hitSlop={HIT_SLOP}>
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

			<ToastView />

			{/* 삭제 확인 */}
			<Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
				<View style={[styles.modalOverlay, modalSafePadding]}>
					<View style={styles.confirmModal}>
						<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(40)} color={COLORS.danger} />
						<Text style={styles.confirmTitle}>속담집을 삭제하시겠습니까?</Text>
						<Text style={styles.confirmDesc}>
							<Text style={{ fontWeight: '700' }}>{deleteConfirm?.title}</Text>을 삭제하면{'\n'}복구할 수 없습니다.
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
			<Modal visible={!!actionSheet} transparent animationType="fade" onRequestClose={() => setActionSheet(null)}>
				<TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={() => setActionSheet(null)}>
					<Animated.View style={{ transform: [{ translateY: sheetSlide }] }}>
					<TouchableOpacity activeOpacity={1} style={[styles.actionSheet, { paddingBottom: Math.max(insets.bottom, SPACING_H.xxl) }]}>
						<View style={styles.actionSheetHandle} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; handoff(() => setActionSheet(null), () => b && navigation.navigate(Paths.MY_PROVERB_BOOK_DETAIL, { bookId: b.id })); }}>
							<View style={[styles.actionItemIcon, { backgroundColor: withAlpha(actionSheet?.color || getDefaultColor(), ALPHA.soft) }]}>
								<IconComponent type="materialIcons" name={actionSheet?.icon || DEFAULT_ICON} size={scaledSize(18)} color={actionSheet?.color || getDefaultColor()} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.actionItemLabel} numberOfLines={1}>{actionSheet?.title}</Text>
								{!!actionSheet?.description && <Text style={styles.actionItemDesc} numberOfLines={1}>{actionSheet.description}</Text>}
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(18)} color={COLORS.border} />
						</TouchableOpacity>
						<View style={styles.actionDivider} />
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; handoff(() => setActionSheet(null), () => setAddProverbModal(b)); }}>
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
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; handoff(() => setActionSheet(null), () => setFormTarget(b)); }}>
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
						<TouchableOpacity style={styles.actionItem} onPress={() => { const b = actionSheet; handoff(() => setActionSheet(null), () => setDeleteConfirm(b)); }}>
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
					</Animated.View>
				</TouchableOpacity>
			</Modal>
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'마음에 드는 속담을 주제별로 묶어 보관하는 곳입니다.',
					'속담집을 만들고, 원하는 속담을 담아둘 수 있습니다.',
					'속담집을 누르면 담아둔 속담을 모아서 볼 수 있습니다!',
				]}
				title="나만의 속담집, 이렇게 씁니다"
			/>
		</>
	);
};

export default MyProverbBook;

const styles = themedStyles(() => StyleSheet.create({
	keyboardWrap: { flex: 1 },
	main: { flex: 1, backgroundColor: COLORS.background },
	filterContainer: { paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.md, backgroundColor: COLORS.background },
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
	// 위아래 여백(하단은 FAB 회피용)은 카드가 있을 때만 필요하다. 비었을 때 두면 중앙 정렬이 위로 밀린다.
	booksContainerEmpty: { paddingTop: 0, paddingBottom: 0 },
	// 빈 영역 전체를 채우고 그 정중앙에 놓인다. 위쪽 여백을 따로 주면 그만큼 아래로 밀린다.
	emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING_W.xl },
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
}));
