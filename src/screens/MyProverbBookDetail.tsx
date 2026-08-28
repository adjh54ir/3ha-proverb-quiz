/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import IconComponent from './common/atomic/IconComponent';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import { Paths } from '@/navigation/conf/Paths';
import BottomHomeButton from './common/BottomHomeButton';
import AddProverbModal from './modal/AddProverbModal';
import QuizModeModal from './modal/QuizModeModal';
import ProverbDetailModal from './modal/ProverbDetailModal';
import ScrollTopButton, { SCROLL_TOP_THRESHOLD } from '@/screens/common/atomic/ScrollTopButton';
import { getCategoryColor, getLevelColor } from './common/CommonProverbModule';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '@/services/ProverbServices';
import { useToast } from '@/hooks/useToast';
import CharacterGuide, { useCharacterGuideOnce } from '@/screens/common/CharacterGuide';
import { withAlpha, ALPHA, readableTextOn } from '@/utils/ColorAlphaUtils';
import { AnimatedListItem } from '@/components/animation/FadeInView';
import ScreenHeader from '@/screens/common/ScreenHeader';
import { read, update } from '@/services/StorageService';
import { useModalSafePadding } from '@/hooks/useModalSafePadding';

// 함수로 둬야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const getDefaultColor = () => COLORS.primary;
const DEFAULT_ICON = 'menu-book';
const STORAGE_KEY = MainStorageKeyType.USER_PROVERB_BOOKS;
const PRACTICE_RECORD_KEY = MainStorageKeyType.USER_PROVERB_PRACTICE_RECORDS;

/**
 * FlatList 아이템 fade + slide-up 진입 애니메이션 래퍼
 */

const MyProverbBookDetail = () => {
	const modalSafePadding = useModalSafePadding();
	// 안내 정책: 화면에 처음 들어갈 때 1회 자동 노출. 다시 보려면 설정 > 화면 안내.
	const listRef = useRef<FlatList<MainDataType.Proverb>>(null);
	const guide = useCharacterGuideOnce('myProverbBookDetail');
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

	const { showToast, ToastView } = useToast(scaleHeight(90)); // 하단 빼기 바 위로 띄운다

	// 삭제 모드
	const [removeMode, setRemoveMode] = useState(false);
	const [selectedForRemove, setSelectedForRemove] = useState<Set<number>>(new Set());
	const [removeConfirmVisible, setRemoveConfirmVisible] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadBook();
			loadPracticeRecord();
			// 다시 들어올 때는 편집(빼기) 모드와 열려 있던 팝업을 초기화한다
			setRemoveMode(false);
			setSelectedForRemove(new Set());
			setRemoveConfirmVisible(false);
			setAddModalVisible(false);
			setQuizModeModal(null);
			setShowDetailModal(false);
			listRef.current?.scrollToOffset({ offset: 0, animated: false });
		}, [bookId]),
	);

	const loadBook = async () => {
		const books = await read<MainDataType.ProverbBook[]>(STORAGE_KEY, []);
		setBook(books.find((b) => b.id === bookId) ?? null);
	};

	const loadPracticeRecord = async () => {
		const records = await read<MainDataType.ProverbBookPracticeRecord[]>(PRACTICE_RECORD_KEY, []);
		setPracticeRecord(records.find((r) => r.bookId === bookId) ?? null);
	};

	const saveBook = async (updated: MainDataType.ProverbBook) => {
		// 목록 전체를 다시 쓰므로, 읽고 쓰는 사이 다른 저장이 끼어들지 않도록 update 를 쓴다
		await update<MainDataType.ProverbBook[]>(STORAGE_KEY, [], (books) =>
			books.map((b) => (b.id === updated.id ? updated : b)),
		);
		setBook(updated);
	};

	const proverbs = useMemo(() => (book ? ALL_PROVERBS.filter((p) => book.proverbIds.includes(p.id)) : []), [book]);

	const handleAddProverbs = async (target: MainDataType.ProverbBook, ids: number[]) => {
		const before = target.proverbIds.length;
		const updated = { ...target, proverbIds: [...new Set([...target.proverbIds, ...ids])] };
		await saveBook(updated);
		setAddModalVisible(false);
		const added = updated.proverbIds.length - before;
		showToast('속담 추가 완료', added > 0 ? `${added}개를 이 속담집에 담았습니다.` : '이미 담겨 있는 속담입니다.');
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
		const removedCount = selectedForRemove.size;
		const updated = { ...book, proverbIds: book.proverbIds.filter((id) => !selectedForRemove.has(id)) };
		await saveBook(updated);
		setRemoveConfirmVisible(false);
		setRemoveMode(false);
		setSelectedForRemove(new Set());
		showToast('속담 빼기 완료', `${removedCount}개를 이 속담집에서 제거했습니다.`);
	};

	const startQuiz = (target: MainDataType.ProverbBook, mode: 'meaning' | 'proverb' | 'blank' | 'example') => {
		const pool = ALL_PROVERBS.filter((p) => target.proverbIds.includes(p.id));
		setQuizModeModal(null);
		navigation.navigate(Paths.QUIZ, { questionPool: pool, title: target.title, mode, selectedLevel: '전체', levelKey: 'all', isWrongReview: true });
	};

	const bookColor = book?.color || getDefaultColor();
	const lastAttempt = practiceRecord?.attempts?.[0];

	const renderItem = ({ item, index }: { item: MainDataType.Proverb; index: number }) => {
		const isSelected = selectedForRemove.has(item.id);
		return (
			<AnimatedListItem index={index}>
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
							<View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
								{isSelected && <IconComponent type="materialIcons" name="check" size={scaledSize(12)} color={COLORS.textWhite} />}
							</View>
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
			</AnimatedListItem>
		);
	};

	return (
		<>
			<SafeAreaView style={styles.main} edges={['top', 'bottom']}>
				<ScreenHeader
					title={book?.title ?? '속담집'}
					onBack={() => navigation.goBack()}
					right={
						<>
							{proverbs.length > 0 && (
								<TouchableOpacity
									onPress={() => {
										setRemoveMode((v) => !v);
										setSelectedForRemove(new Set());
									}}
									hitSlop={HIT_SLOP}>
									<Text style={[styles.headerAction, removeMode && styles.headerActionActive]}>{removeMode ? '취소' : '편집'}</Text>
								</TouchableOpacity>
							)}
						</>
					}
				/>

				{/* 요약 카드 */}
				<View style={[styles.summaryCard, { borderColor: withAlpha(bookColor, ALPHA.border) }]}>
					<View style={[styles.summaryIcon, { backgroundColor: bookColor }]}>
						<IconComponent type="materialIcons" name={book?.icon || DEFAULT_ICON} size={scaledSize(24)} color={readableTextOn(bookColor)} />
					</View>
					<View style={{ flex: 1 }}>
						{!!book?.description && <Text style={styles.summaryDesc} numberOfLines={1}>{book.description}</Text>}
						<Text style={styles.summaryCount}>총 <Text style={{ color: bookColor, fontWeight: '700' }}>{proverbs.length}</Text>개의 속담</Text>
						{lastAttempt && (
							<Text style={styles.summaryRecord}>최근 정답률 {lastAttempt.accuracy}% · {lastAttempt.correctCount}/{lastAttempt.correctCount + lastAttempt.wrongCount}</Text>
						)}
					</View>
					<Image source={require('@/assets/images/screen-heroes/proverb-book-detail.png')} style={styles.summaryHeroImage} resizeMode="contain" />
				</View>

				{/* 액션 버튼 */}
				<View style={styles.actionRow}>
					<TouchableOpacity style={[styles.actionBtn, styles.actionBtnAdd]} onPress={() => setAddModalVisible(true)}>
						<IconComponent type="materialIcons" name="add" size={scaledSize(18)} color={COLORS.secondary} />
						<Text style={[styles.actionBtnText, { color: COLORS.secondary }]}>속담 추가</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.actionBtn, { backgroundColor: proverbs.length === 0 ? COLORS.surfaceAlt : COLORS.primary }]}
						disabled={proverbs.length === 0}
						onPress={() => book && setQuizModeModal(book)}>
						<IconComponent type="materialIcons" name="play-arrow" size={scaledSize(18)} color={proverbs.length === 0 ? COLORS.textLight : COLORS.textWhite} />
						<Text style={[styles.actionBtnText, { color: proverbs.length === 0 ? COLORS.textLight : COLORS.textWhite }]}>퀴즈 시작</Text>
					</TouchableOpacity>
				</View>

				<FlatList
					ref={listRef}
					data={proverbs}
					onScroll={(event) => setShowScrollTop(event.nativeEvent.contentOffset.y > SCROLL_TOP_THRESHOLD)}
					scrollEventThrottle={16}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderItem}
					contentContainerStyle={[styles.listContent, removeMode && styles.listContentWithBar]}
					ListEmptyComponent={() => (
						<View style={styles.emptyView}>
							<Image source={require('@/assets/images/feature-states/empty-proverb-book.png')} style={styles.emptyImage} resizeMode="contain" />
							<Text style={styles.emptyTitle}>아직 담은 속담이 없습니다</Text>
							<Text style={styles.emptyDesc}>속담 추가 버튼을 눌러 채워보세요!</Text>
						</View>
					)}
				/>

				<ScrollTopButton
					visible={showScrollTop}
					onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
				/>

				{removeMode && (
					<View style={styles.removeBar}>
						<TouchableOpacity
							style={[styles.removeBtn, selectedForRemove.size === 0 && styles.removeBtnDisabled]}
							disabled={selectedForRemove.size === 0}
							onPress={() => setRemoveConfirmVisible(true)}>
							<IconComponent type="materialIcons" name="delete-outline" size={scaledSize(16)} color={COLORS.textWhite} />
							<Text style={styles.removeBtnText}>{selectedForRemove.size > 0 ? `${selectedForRemove.size}개 빼기` : '속담을 선택해주세요'}</Text>
						</TouchableOpacity>
					</View>
				)}
				{!removeMode && <BottomHomeButton backgroundColor={COLORS.surfaceAlt} skipConfirm />}
			</SafeAreaView>

			<AddProverbModal visible={addModalVisible} book={book} onClose={() => setAddModalVisible(false)} onAdd={handleAddProverbs} />
			<QuizModeModal book={quizModeModal} onClose={() => setQuizModeModal(null)} onSelect={(b, mode) => startQuiz(b, mode)} />
			<ProverbDetailModal visible={showDetailModal && !!selectedProverb} proverb={selectedProverb} onClose={() => setShowDetailModal(false)} />

			<Modal visible={removeConfirmVisible} transparent animationType="fade" onRequestClose={() => setRemoveConfirmVisible(false)}>
				<View style={[styles.modalOverlay, modalSafePadding]}>
					<View style={styles.confirmModal}>
						<IconComponent type="materialIcons" name="remove-circle-outline" size={scaledSize(40)} color={COLORS.danger} />
						<Text style={styles.confirmTitle}>선택한 속담을 빼시겠습니까?</Text>
						<Text style={styles.confirmDesc}>선택한 {selectedForRemove.size}개의 속담을{'\n'}이 속담집에서 제거합니다.</Text>
						<View style={styles.confirmBtnRow}>
							<TouchableOpacity style={[styles.confirmBtn, styles.confirmBtnCancel]} onPress={() => setRemoveConfirmVisible(false)}>
								<Text style={[styles.confirmBtnText, { color: COLORS.text }]}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.confirmBtn, styles.confirmBtnDelete]} onPress={handleRemoveConfirm}>
								<Text style={[styles.confirmBtnText, { color: COLORS.textWhite }]}>빼기</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<ToastView />
			<CharacterGuide
				visible={guide.visible}
				onClose={guide.close}
				lines={[
					'이 속담집에 담아둔 속담을 모아 보는 화면입니다.',
					'속담을 누르면 뜻과 예문을 자세히 볼 수 있습니다.',
					'편집을 누르면 담아둔 속담을 골라 뺄 수 있습니다!',
				]}
				title="속담집 상세, 이렇게 씁니다"
			/>
		</>
	);
};

export default MyProverbBookDetail;

const styles = themedStyles(() => StyleSheet.create({
	main: { flex: 1, backgroundColor: COLORS.background },
	headerAction: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.secondary },
	headerActionActive: { color: COLORS.textSecondary },
	summaryCard: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.md,
		marginHorizontal: SPACING_W.lg,
		marginTop: SPACING_H.md,
		marginBottom: SPACING_H.md,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		borderWidth: 1,
	},
	summaryIcon: {
		width: scaleWidth(48),
		height: scaleWidth(48),
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	summaryHeroImage: { width: scaleWidth(86), height: scaleHeight(72), marginLeft: SPACING_W.sm },
	summaryDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginBottom: SPACING_H.xs },
	summaryCount: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '600' },
	summaryRecord: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING_H.xs },
	actionRow: { flexDirection: 'row', columnGap: SPACING_W.md, paddingHorizontal: SPACING_W.lg, marginBottom: SPACING_H.md },
	actionBtnAdd: { backgroundColor: COLORS.secondaryBg },
	actionBtn: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		height: scaleHeight(46),
		borderRadius: RADIUS.md,
	},
	actionBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700' },
	listContent: { paddingHorizontal: SPACING_W.lg, paddingTop: SPACING_H.xs, paddingBottom: SPACING_H.xxxxl, flexGrow: 1 },
	// 편집 모드에서만 하단 삭제 바(absolute)가 뜨므로 그때만 그만큼 더 비운다.
	listContentWithBar: { paddingBottom: scaleHeight(100) },
	itemCard: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: SPACING_W.md,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		paddingHorizontal: SPACING_W.lg,
		paddingVertical: SPACING_H.md,
		marginBottom: SPACING_H.md,
		borderWidth: 1,
		borderColor: COLORS.surfaceAlt,
	},
	itemCardSelected: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerBg },
	itemIndexWrap: { width: scaleWidth(24), alignItems: 'center' },
	itemIndex: { fontSize: FONT_SIZES.smPlus, fontWeight: '700', color: COLORS.textLight },
	checkbox: {
		width: scaleWidth(24),
		height: scaleWidth(24),
		borderRadius: RADIUS.sm,
		borderWidth: 2,
		borderColor: COLORS.borderDark,
		backgroundColor: COLORS.surface,
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxChecked: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
	itemProverb: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700', color: COLORS.textStrong },
	itemMeaning: { fontSize: FONT_SIZES.smPlus, color: COLORS.textSecondary, marginTop: SPACING_H.xs },
	itemBadges: { rowGap: SPACING_H.xs, alignItems: 'flex-end' },
	miniBadge: { paddingHorizontal: SPACING_W.sm, paddingVertical: SPACING_H.xs, borderRadius: RADIUS.round },
	miniBadgeText: { color: COLORS.textWhite, fontSize: FONT_SIZES.xxs, fontWeight: '700' },
	emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING_W.xl, paddingTop: SPACING_H.xxxxl },
	emptyImage: { width: scaleWidth(164), height: scaleWidth(164) },
	emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textStrong, marginTop: SPACING_H.md, marginBottom: SPACING_H.sm },
	emptyDesc: { fontSize: FONT_SIZES.smPlus, color: COLORS.textLight, textAlign: 'center', lineHeight: scaledSize(20) },
	removeBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: COLORS.surface,
		// 화면 좌우/아래에 붙는 바라 위쪽 구분선만 있으면 된다.
		// (borderWidth 는 네 변을 모두 그려 좌우·아래에 선이 비쳤다)
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
		paddingHorizontal: SPACING_W.lg,
		paddingTop: SPACING_H.md,
		paddingBottom: SPACING_H.xl,
	},
	removeBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		columnGap: SPACING_W.sm,
		height: scaleHeight(52),
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.danger,
	},
	removeBtnDisabled: { backgroundColor: COLORS.borderDark },
	removeBtnText: { color: COLORS.textWhite, fontSize: FONT_SIZES.lg, fontWeight: '700' },
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
}));
