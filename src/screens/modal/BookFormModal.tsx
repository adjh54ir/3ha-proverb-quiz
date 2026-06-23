import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { moderateScale, scaledSize, scaleHeight, scaleWidth } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';
import { BOOK_COLORS, BOOK_ICONS } from '../common/CommonProverbModule';

type PickerProps = {
	selectedColor: string;
	selectedIcon: string;
	onColorChange: (c: string) => void;
	onIconChange: (i: string) => void;
};

const DEFAULT_COLOR = '#22C55E';
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
									onPress={() => onIconChange(icon)}>
									<IconComponent type="materialIcons" name={icon} size={scaledSize(20)} color={selectedIcon === icon ? selectedColor : '#94A3B8'} />
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
									onPress={() => onColorChange(color)}>
									{selectedColor === color && <IconComponent type="materialIcons" name="check" size={scaledSize(14)} color="#fff" />}
								</TouchableOpacity>
							))}
						</View>
					))}
				</View>
			</ScrollView>
		</View>
	);
};

const pickerStyles = StyleSheet.create({
	container: { width: '100%', marginTop: scaleHeight(14) },
	preview: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(10), borderWidth: 1, borderRadius: scaleWidth(12), padding: scaleWidth(12), marginBottom: scaleHeight(12) },
	previewIcon: { width: scaleWidth(44), height: scaleWidth(44), borderRadius: scaleWidth(12), justifyContent: 'center', alignItems: 'center' },
	previewLabel: { fontSize: scaledSize(15), fontWeight: '700' },
	sectionLabel: { fontSize: scaledSize(12), fontWeight: '600', color: '#64748B', marginBottom: scaleHeight(8), marginTop: scaleHeight(4) },
	scrollArea: { marginBottom: scaleHeight(6) },
	row: { flexDirection: 'row', marginBottom: scaleHeight(7) },
	colorDot: { width: scaleWidth(30), height: scaleWidth(30), borderRadius: scaleWidth(15), marginRight: scaleWidth(7), justifyContent: 'center', alignItems: 'center' },
	colorDotSelected: { borderWidth: 2.5, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3 },
	iconDot: { width: scaleWidth(38), height: scaleWidth(38), borderRadius: scaleWidth(10), marginRight: scaleWidth(7), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
	iconDotSelected: { borderWidth: 1.5 },
	previewDesc: { fontSize: scaledSize(11), color: '#94A3B8', marginTop: scaleHeight(2) },
});

const BookFormModal = ({ visible, editTarget, onClose, onSubmit }: Props) => {
	const isEdit = !!editTarget;

	const [title, setTitle] = useState('');
	const [desc, setDesc] = useState('');
	const [color, setColor] = useState(DEFAULT_COLOR);
	const [icon, setIcon] = useState(DEFAULT_ICON);

	useEffect(() => {
		if (visible) {
			setTitle(editTarget?.title ?? '');
			setDesc(editTarget?.description ?? '');
			setColor(editTarget?.color ?? DEFAULT_COLOR);
			setIcon(editTarget?.icon ?? DEFAULT_ICON);
		}
	}, [visible, editTarget]);

	const handleSubmit = () => {
		if (!title.trim()) {
			return;
		}
		onSubmit({ title: title.trim(), description: desc.trim(), color, icon });
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.overlay}>
				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
					<View style={styles.modal}>
						<TouchableOpacity style={styles.closeIcon} onPress={onClose}>
							<IconComponent type="materialIcons" name="close" size={scaledSize(22)} color="#64748B" />
						</TouchableOpacity>

						<Text style={styles.modalTitle}>{isEdit ? '속담집 편집' : '새 속담집 만들기'}</Text>
						{!isEdit && <Text style={styles.modalSubtitle}>이름을 정하고, 속담집에서 속담을 추가해봐요</Text>}

						<View style={[pickerStyles.preview, { backgroundColor: color + '20', borderColor: color + '40', width: '100%', marginTop: scaleHeight(12) }]}>
							<View style={[pickerStyles.previewIcon, { backgroundColor: color }]}>
								<IconComponent type="materialIcons" name={icon} size={scaledSize(26)} color="#fff" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={[pickerStyles.previewLabel, { color }]} numberOfLines={1}>{title.trim() || '속담집 이름'}</Text>
								{desc.trim() ? <Text style={pickerStyles.previewDesc} numberOfLines={1}>{desc.trim()}</Text> : null}
							</View>
						</View>

						<Text style={styles.fieldLabel}>이름</Text>
						<View style={[styles.inputWrap, { marginTop: scaleHeight(4) }]}>
							<TextInput style={styles.input} placeholder="속담집 이름 *" placeholderTextColor="#94A3B8" value={title} onChangeText={setTitle} maxLength={20} autoFocus={!isEdit} />
						</View>

						<Text style={styles.fieldLabel}>설명</Text>
						<View style={[styles.inputWrap, { marginTop: scaleHeight(4) }]}>
							<TextInput style={styles.input} placeholder="설명 (선택)" placeholderTextColor="#94A3B8" value={desc} onChangeText={setDesc} maxLength={40} />
						</View>

						<ColorIconPicker selectedColor={color} selectedIcon={icon} onColorChange={setColor} onIconChange={setIcon} />

						<TouchableOpacity
							style={[styles.submitBtn, { backgroundColor: '#3B82F6', marginTop: scaleHeight(16) }, !title.trim() && styles.submitBtnDisabled]}
							onPress={handleSubmit}
							disabled={!title.trim()}>
							<Text style={styles.submitBtnText}>{isEdit ? '저장' : '생성'}</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</View>
		</Modal>
	);
};

export default BookFormModal;

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: scaleHeight(20), width: '100%' },
	modal: { width: '88%', backgroundColor: '#fff', borderRadius: scaleWidth(20), padding: scaleWidth(24) },
	closeIcon: { position: 'absolute', top: scaleHeight(12), right: scaleWidth(12), zIndex: 2, padding: scaleWidth(4) },
	modalTitle: { fontSize: scaledSize(18), fontWeight: '700', color: '#334155' },
	modalSubtitle: { fontSize: scaledSize(12), color: '#94A3B8', textAlign: 'left', marginTop: scaleHeight(6) },
	inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(12), marginBottom: scaleHeight(14), backgroundColor: '#fff' },
	input: { flex: 1, paddingVertical: scaleHeight(12), fontSize: moderateScale(13), color: '#334155' },
	submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: scaleHeight(14), borderRadius: scaleWidth(14), gap: scaleWidth(8) },
	submitBtnDisabled: { backgroundColor: '#94A3B8' },
	submitBtnText: { color: '#fff', fontWeight: '700', fontSize: scaledSize(15) },
	fieldLabel: { fontSize: scaledSize(12), fontWeight: '600', color: '#64748B', marginBottom: scaleHeight(0), marginTop: scaleHeight(4) },
});
