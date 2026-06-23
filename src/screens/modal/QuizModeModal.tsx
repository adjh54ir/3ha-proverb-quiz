/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';

type QuizMode = 'meaning' | 'proverb' | 'blank' | 'example';

type Props = {
	book: MainDataType.ProverbBook | null;
	onClose: () => void;
	onSelect: (book: MainDataType.ProverbBook, mode: QuizMode) => void;
};

const MODES: { key: QuizMode; label: string; desc: string; icon: string; color: string; bg: string }[] = [
	{ key: 'meaning', label: '뜻 맞추기', desc: '속담을 보고 의미를 골라요', icon: 'lightbulb', color: '#3B82F6', bg: '#EFF6FF' },
	{ key: 'proverb', label: '속담 맞추기', desc: '의미를 보고 속담을 골라요', icon: 'menu-book', color: '#22C55E', bg: '#F0FDF4' },
	{ key: 'blank', label: '빈칸 채우기', desc: '속담의 빈칸을 채워요', icon: 'edit', color: '#F59E0B', bg: '#FFFBEB' },
	{ key: 'example', label: '예문 속담', desc: '예문에 어울리는 속담을 골라요', icon: 'forum', color: '#9333EA', bg: '#FAF5FF' },
];

const QuizModeModal = ({ book, onClose, onSelect }: Props) => {
	return (
		<Modal visible={!!book} transparent animationType="slide" onRequestClose={onClose}>
			<TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
				<TouchableOpacity activeOpacity={1} style={styles.sheet}>
					<View style={styles.handleBar} />
					<View style={styles.headerRow}>
						<Text style={styles.title} numberOfLines={1}>{book?.title ? `${book.title} 퀴즈` : '퀴즈 모드 선택'}</Text>
						<TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
							<IconComponent type="materialIcons" name="close" size={scaledSize(22)} color="#64748B" />
						</TouchableOpacity>
					</View>
					<Text style={styles.subtitle}>원하는 퀴즈 모드를 선택해주세요</Text>

					{MODES.map((m) => (
						<TouchableOpacity key={m.key} style={styles.modeItem} activeOpacity={0.85} onPress={() => book && onSelect(book, m.key)}>
							<View style={[styles.modeIcon, { backgroundColor: m.bg }]}>
								<IconComponent type="materialIcons" name={m.icon} size={scaledSize(20)} color={m.color} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.modeLabel}>{m.label}</Text>
								<Text style={styles.modeDesc}>{m.desc}</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(20)} color="#CBD5E1" />
						</TouchableOpacity>
					))}
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
};

export default QuizModeModal;

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	sheet: { backgroundColor: '#fff', borderTopLeftRadius: scaleWidth(24), borderTopRightRadius: scaleWidth(24), paddingHorizontal: scaleWidth(20), paddingTop: scaleHeight(10), paddingBottom: scaleHeight(30) },
	handleBar: { width: scaleWidth(40), height: scaleHeight(4), borderRadius: scaleWidth(2), backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: scaleHeight(14) },
	headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	title: { fontSize: scaledSize(18), fontWeight: '800', color: '#334155', flex: 1, marginRight: scaleWidth(10) },
	subtitle: { fontSize: scaledSize(13), color: '#94A3B8', marginTop: scaleHeight(4), marginBottom: scaleHeight(14) },
	modeItem: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), paddingVertical: scaleHeight(12), paddingHorizontal: scaleWidth(12), borderRadius: scaleWidth(14), borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', marginBottom: scaleHeight(10) },
	modeIcon: { width: scaleWidth(42), height: scaleWidth(42), borderRadius: scaleWidth(12), alignItems: 'center', justifyContent: 'center' },
	modeLabel: { fontSize: scaledSize(15), fontWeight: '700', color: '#334155' },
	modeDesc: { fontSize: scaledSize(12), color: '#94A3B8', marginTop: scaleHeight(2) },
});
