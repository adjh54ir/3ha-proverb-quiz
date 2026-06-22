import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scaledSize, scaleHeight, scaleWidth } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';
import { MainDataType } from '@/types/MainDataType';
import { QUIZ_MODE, QuizMode } from '../common/CommonProverbModule';
import AdmobFrontAd from '../common/ads/AdmobFrontAd';

const DEFAULT_COLOR = '#22C55E';

type Props = {
	book: MainDataType.ProverbBook | null;
	onClose: () => void;
	onSelect: (book: MainDataType.ProverbBook, mode: QuizMode) => void;
};

const QuizModeModal = ({ book, onClose, onSelect }: Props) => {
	const [showAd, setShowAd] = useState(false);
	const [pendingBook, setPendingBook] = useState<MainDataType.ProverbBook | null>(null);
	const [pendingMode, setPendingMode] = useState<QuizMode | null>(null);

	const handleModeSelect = (selectedBook: MainDataType.ProverbBook, mode: QuizMode) => {
		setPendingBook(selectedBook);
		setPendingMode(mode);
		setShowAd(true);
	};

	const handleAdClosed = () => {
		setShowAd(false);
		if (pendingBook && pendingMode) {
			onSelect(pendingBook, pendingMode);
			setPendingBook(null);
			setPendingMode(null);
		}
	};

	return (
		<Modal visible={!!book} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<View style={styles.modeModal}>
					<View style={styles.modeModalHeader}>
						<View style={styles.headerSpacer} />
						<Text style={styles.modeModalTitle}>퀴즈 모드 선택</Text>
						<TouchableOpacity style={styles.modalCloseIcon} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
							<IconComponent type="materialIcons" name="close" size={scaledSize(22)} color="#64748B" />
						</TouchableOpacity>
					</View>
					<Text style={[styles.bookTitle, { color: book?.color || DEFAULT_COLOR }]}>{book?.title}</Text>
					<Text style={styles.modeModalDesc}>속담집으로 퀴즈를 풀어보세요!</Text>
					{QUIZ_MODE.filter(({ mode }) => mode !== 'etc').map(({ mode, icon, label, desc, color, type }) => (
						<TouchableOpacity key={mode} style={[styles.modeCard, { borderColor: color }]} onPress={() => book && handleModeSelect(book, mode)}>
							<View style={[styles.modeIconWrap, { backgroundColor: color }]}>
								<IconComponent type={type} name={icon} size={scaledSize(22)} color="#fff" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.modeLabel}>{label}</Text>
								<Text style={styles.modeDesc}>{desc}</Text>
							</View>
							<IconComponent type="materialIcons" name="chevron-right" size={scaledSize(22)} color={color} />
						</TouchableOpacity>
					))}
				</View>

				{showAd && <AdmobFrontAd onAdClosed={handleAdClosed} />}
			</View>
		</Modal>
	);
};

export default QuizModeModal;

const styles = StyleSheet.create({
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	modalCloseIcon: { padding: scaleWidth(4) },
	headerSpacer: { width: scaleWidth(30) },
	modeModal: { width: '88%', backgroundColor: '#fff', borderRadius: scaleWidth(18), padding: scaleWidth(20) },
	modeModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scaleHeight(8) },
	modeModalTitle: { flex: 1, fontSize: scaledSize(16), fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
	bookTitle: { fontSize: scaledSize(22), fontWeight: '800', textAlign: 'center', marginBottom: scaleHeight(6) },
	modeModalDesc: { fontSize: scaledSize(13), color: '#64748B', textAlign: 'center', marginBottom: scaleHeight(18) },
	modeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: scaleWidth(14), padding: scaleWidth(14), marginBottom: scaleHeight(10), gap: scaleWidth(12) },
	modeIconWrap: { width: scaleWidth(44), height: scaleWidth(44), borderRadius: scaleWidth(12), justifyContent: 'center', alignItems: 'center' },
	modeLabel: { fontSize: scaledSize(15), fontWeight: '700', color: '#334155' },
	modeDesc: { fontSize: scaledSize(12), color: '#94A3B8', marginTop: scaleHeight(2) },
});
