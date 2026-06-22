import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import IconComponent from './atomic/IconComponent';
import { scaledSize, scaleWidth, scaleHeight } from '@/utils/DementionUtils';

interface CommonHeaderProps {
	/** 가운데 표시할 제목 */
	title?: string;
	/** 제목 아래 보조 설명(선택) */
	subtitle?: string;
	/** 왼쪽 뒤로가기/닫기 버튼 핸들러 (없으면 좌측 자리만 확보) */
	onBack?: () => void;
	/** 왼쪽 아이콘 (기본: arrow-back) */
	backIcon?: string;
	/** 오른쪽 영역(액션 버튼 등) */
	right?: React.ReactNode;
	/** 하단 구분선 표시 여부 */
	border?: boolean;
	/** 제목 좌측 정렬(기본 가운데 정렬) */
	alignLeft?: boolean;
	style?: StyleProp<ViewStyle>;
}

/**
 * 화면 공통 헤더
 * - 좌(뒤로가기) · 중(제목) · 우(액션) 3분할로 제목이 항상 정중앙에 오도록 정렬을 보장합니다.
 */
const CommonHeader = ({ title, subtitle, onBack, backIcon = 'arrow-back', right, border = true, alignLeft = false, style }: CommonHeaderProps) => {
	return (
		<View style={[styles.container, border && styles.bordered, style]}>
			<View style={styles.side}>
				{onBack && (
					<TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.7}>
						<IconComponent type="materialIcons" name={backIcon} size={scaledSize(24)} color="#334155" />
					</TouchableOpacity>
				)}
			</View>

			<View style={[styles.center, alignLeft && styles.centerLeft]}>
				{!!title && (
					<Text style={[styles.title, alignLeft && styles.titleLeft]} numberOfLines={1}>
						{title}
					</Text>
				)}
				{!!subtitle && (
					<Text style={[styles.subtitle, alignLeft && styles.titleLeft]} numberOfLines={1}>
						{subtitle}
					</Text>
				)}
			</View>

			<View style={[styles.side, styles.sideRight]}>{right}</View>
		</View>
	);
};

export default CommonHeader;

const SIDE_WIDTH = scaleWidth(64);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingHorizontal: scaleWidth(20),
		paddingVertical: scaleHeight(12),
		minHeight: scaleWidth(52),
	},
	bordered: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
	side: { width: SIDE_WIDTH, justifyContent: 'center' },
	sideRight: { alignItems: 'flex-end' },
	backBtn: { width: scaleWidth(40), height: scaleWidth(40), alignItems: 'center', justifyContent: 'center', marginLeft: -scaleWidth(8) },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	centerLeft: { alignItems: 'flex-start' },
	title: { fontSize: scaledSize(18), fontWeight: '800', color: '#1E293B', textAlign: 'center' },
	titleLeft: { textAlign: 'left' },
	subtitle: { fontSize: scaledSize(12), fontWeight: '500', color: '#64748B', marginTop: scaleWidth(2), textAlign: 'center' },
});
