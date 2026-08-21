import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from '@/screens/common/atomic/AppModal';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import { HIT_SLOP, COLORS, FONT_SIZES, RADIUS, SPACING_W, SPACING_H, themedStyles } from '@/const/common/Theme';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';
import { BOOK_COLORS, BOOK_ICONS } from '../common/CommonProverbModule';

type PickerProps = {
	selectedColor: string;
	selectedIcon: string;
	onColorChange: (c: string) => void;
	onIconChange: (i: string) => void;
};

// 함수로 둬야 모듈 로드 시점 팔레트로 굳지 않고 다크모드를 따라간다.
const getDefaultColor = (): string => COLORS.primary;
const DEFAULT_ICON = 'menu-book';

type Props = {
	visible: boolean;
	editTarget?: MainDataType.ProverbBook | null;
	onClose: () => void;
	onSubmit: (data: { title: string; description: string; color: string; icon: string }) => void;
};

const ColorIconPicker = ({ selectedColor, selectedIcon, onColorChange, onIconChange }: PickerProps) => {
	const colorRows = [BOOK_COLORS.slice(0, BOOK_COLORS.length / 2), BOOK_COLORS.slice(BOOK_COLORS.length / 2)];
	const iconRows = [BOOK_ICONS.slice(0, BOOK_ICONS.length / 2), BOOK_ICONS.slice(BOOK_ICONS.length / 2)];

	return (
		<View style={pickerStyles.container}>
			<Text style={pickerStyles.sectionLabel}>아이콘 선택</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={pickerStyles.scrollArea}>
				<View>
					{iconRows.map((row, ri) => (
						<View key={ri} style={pickerStyles.row}>
							{row.map((icon) => (
								<TouchableOpacity
									key={icon}
									style={[pickerStyles.iconDot, selectedIcon === icon && [pickerStyles.iconDotSelected, { borderColor: selectedColor, backgroundColor: selectedColor + '15' }]]}
									activeOpacity={0.8}
									onPress={() => onIconChange(icon)}>
									<IconComponent type="materialIcons" name={icon} size={scaledSize(20)} color={selectedIcon === icon ? selectedColor : COLORS.textLight} />
								</TouchableOpacity>
							))}
						</View>
					))}
				</View>
			</ScrollView>
			<Text style={pickerStyles.sectionLabel}>색상 선택</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={pickerStyles.scrollArea}>
				<View>
					{colorRows.map((row, ri) => (
						<View key={ri} style={pickerStyles.row}>
							{row.map((color) => (
								<TouchableOpacity
									key={color}
									style={[pickerStyles.colorDot, { backgroundColor: color }, selectedColor === color && pickerStyles.colorDotSelected]}
									activeOpacity={0.8}
									onPress={() => onColorChange(color)}>
									{selectedColor === color && <IconComponent type="materialIcons" name="check" size={scaledSize(14)} color={COLORS.textWhite} />}
								</TouchableOpacity>
							))}
						</View>
					))}
				</View>
			</ScrollView>
		</View>
	);
};

const pickerStyles = themedStyles(() => StyleSheet.create({
	container: { width: '100%', marginTop: SPACING_H.md },
	preview: { flexDirection: 'row', alignItems: 'center', gap: SPACING_W.md, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING_W.md, paddingVertical: SPACING_H.md, marginBottom: SPACING_H.md },
	previewIcon: { width: scaleWidth(44), height: scaleWidth(44), borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
	previewLabel: { fontSize: FONT_SIZES.mdPlus, fontWeight: '700' },
	sectionLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING_H.sm, marginTop: SPACING_H.xs },
	scrollArea: { marginBottom: SPACING_H.xs },
	row: { flexDirection: 'row', marginBottom: SPACING_H.sm },
	colorDot: { width: scaleWidth(30), height: scaleWidth(30), borderRadius: scaleWidth(30) / 2, marginRight: SPACING_W.sm, justifyContent: 'center', alignItems: 'center' },
	colorDotSelected: { borderWidth: 2.5, borderColor: COLORS.surface, },
	iconDot: { width: scaleWidth(38), height: scaleWidth(38), borderRadius: RADIUS.md, marginRight: SPACING_W.sm, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
	iconDotSelected: { borderWidth: 1.5 },
	previewDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: SPACING_H.xs },
}));

const BookFormModal = ({ visible, editTarget, onClose, onSubmit }: Props) => {
	const isEdit = !!editTarget;

	const [title, setTitle] = useState('');
	const [desc, setDesc] = useState('');
	const [color, setColor] = useState(getDefaultColor());
	const [icon, setIcon] = useState(DEFAULT_ICON);
	const [focusedField, setFocusedField] = useState<'title' | 'desc' | null>(null);

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	useEffect(() => {
		if (visible) {
			setTitle(editTarget?.title ?? '');
			setDesc(editTarget?.description ?? '');
			setColor(editTarget?.color ?? getDefaultColor());
			setIcon(editTarget?.icon ?? DEFAULT_ICON);
			setFocusedField(null);
		}
	}, [visible, editTarget]);

	useEffect(() => {
		if (!visible) {
			fadeAnim.setValue(0);
			scaleAnim.setValue(0.95);
			return;
		}
		const anim = Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
			Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
		]);
		anim.start();
		return () => anim.stop();
	}, [visible, fadeAnim, scaleAnim]);

	const handleSubmit = () => {
		if (!title.trim()) {
			return;
		}
		onSubmit({ title: title.trim(), description: desc.trim(), color, icon });
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
				{/* 카드 밖(딤 영역)을 누르면 키보드를 닫는다 */}
				<Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
					<Animated.View style={[styles.modal, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
						<TouchableOpacity style={styles.closeIcon} onPress={onClose} activeOpacity={0.7} hitSlop={HIT_SLOP}>
							<IconComponent type="materialIcons" name="close" size={scaledSize(22)} color={COLORS.textSecondary} />
						</TouchableOpacity>

						<Text style={styles.modalTitle}>{isEdit ? '속담집 편집' : '새 속담집 만들기'}</Text>
						{!isEdit && <Image source={require('@/assets/images/home-actions/action-my-book.png')} style={styles.headerImage} resizeMode="contain" />}
						{!isEdit && <Text style={styles.modalSubtitle}>이름을 정하고, 속담집에 속담을 추가해 보세요</Text>}

						<View style={[pickerStyles.preview, { backgroundColor: color + '20', borderColor: color + '40', width: '100%', marginTop: SPACING_H.md }]}>
							<View style={[pickerStyles.previewIcon, { backgroundColor: color }]}>
								<IconComponent type="materialIcons" name={icon} size={scaledSize(26)} color={COLORS.textWhite} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={[pickerStyles.previewLabel, { color }]} numberOfLines={1}>{title.trim() || '속담집 이름'}</Text>
								{desc.trim() ? <Text style={pickerStyles.previewDesc} numberOfLines={1}>{desc.trim()}</Text> : null}
							</View>
						</View>

						<Text style={styles.fieldLabel}>이름</Text>
						<View style={[styles.inputWrap, focusedField === 'title' && styles.inputWrapFocused]}>
							<TextInput
								style={styles.input}
								placeholder="속담집 이름 *"
								placeholderTextColor={COLORS.textLight}
								value={title}
								onChangeText={setTitle}
								onFocus={() => setFocusedField('title')}
								onBlur={() => setFocusedField(null)}
								maxLength={20}
								autoFocus={!isEdit}
							/>
						</View>

						<Text style={styles.fieldLabel}>설명</Text>
						<View style={[styles.inputWrap, focusedField === 'desc' && styles.inputWrapFocused]}>
							<TextInput
								style={styles.input}
								placeholder="설명 (선택)"
								placeholderTextColor={COLORS.textLight}
								value={desc}
								onChangeText={setDesc}
								onFocus={() => setFocusedField('desc')}
								onBlur={() => setFocusedField(null)}
								maxLength={40}
							/>
						</View>

						<ColorIconPicker selectedColor={color} selectedIcon={icon} onColorChange={setColor} onIconChange={setIcon} />

						<TouchableOpacity
							style={[styles.submitBtn, !title.trim() && styles.submitBtnDisabled]}
							onPress={handleSubmit}
							activeOpacity={0.85}
							disabled={!title.trim()}>
							<Text style={styles.submitBtnText}>{isEdit ? '저장' : '생성'}</Text>
						</TouchableOpacity>
					</Animated.View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Modal>
	);
};

export default BookFormModal;

const styles = themedStyles(() => StyleSheet.create({
	headerImage: { width: scaleWidth(72), height: scaleWidth(72), alignSelf: 'center', marginTop: SPACING_H.sm },
	overlay: { flex: 1, backgroundColor: COLORS.dim, justifyContent: 'center', alignItems: 'center' },
	scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING_H.xl, width: '100%' },
	modal: { width: '88%', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, paddingHorizontal: SPACING_W.lg, paddingVertical: SPACING_H.xl },
	closeIcon: { position: 'absolute', top: SPACING_H.md, right: SPACING_W.md, zIndex: 2, padding: SPACING_W.xs },
	modalTitle: { fontSize: FONT_SIZES.heading, fontWeight: '700', color: COLORS.textStrong },
	modalSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'left', marginTop: SPACING_H.xs },
	inputWrap: { flexDirection: 'row', alignItems: 'center', height: scaleHeight(48), borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING_W.md, marginTop: SPACING_H.xs, marginBottom: SPACING_H.md, backgroundColor: COLORS.surface },
	inputWrapFocused: { borderColor: COLORS.primary },
	input: { flex: 1, paddingVertical: 0, fontSize: FONT_SIZES.md, color: COLORS.text },
	submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: scaleHeight(48), marginTop: SPACING_H.lg, borderRadius: RADIUS.md, gap: SPACING_W.sm, backgroundColor: COLORS.primary },
	submitBtnDisabled: { backgroundColor: COLORS.borderDark },
	submitBtnText: { color: COLORS.textWhite, fontWeight: '700', fontSize: FONT_SIZES.lg },
	fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING_H.xs },
}));
