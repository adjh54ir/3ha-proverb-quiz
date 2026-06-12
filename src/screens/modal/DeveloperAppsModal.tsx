import React, { useState, useMemo } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	Image,
	StyleSheet,
	ScrollView,
	Platform,
	Alert,
	Linking,
	TextInput,
} from 'react-native';
import { moderateScale, scaleHeight, scaleWidth, scaledSize } from '@/utils';
import IconComponent from '../common/atomic/IconComponent';
import { COMMON_APPS_DATA } from '@/const/common/CommonAppsData';
import { CommonType } from '@/types/CommonType';
import PopInView from '@/components/animation/PopInView';

type CategoryFilter = 'all' | CommonType.AppCategory;

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
	{ key: 'all', label: '전체' },
	{ key: 'quiz', label: '퀴즈' },
	{ key: 'calculator', label: '계산기' },
	{ key: 'utility', label: '유틸리티' },
];

const CATEGORY_LABEL: Record<CommonType.AppCategory, string> = {
	quiz: '퀴즈',
	calculator: '계산기',
	utility: '유틸리티',
};

const CATEGORY_COLORS: Record<CommonType.AppCategory, { bg: string; text: string }> = {
	quiz: { bg: '#E6F1FB', text: '#2980b9' },
	calculator: { bg: '#EAF3DE', text: '#3B6D11' },
	utility: { bg: '#FAEEDA', text: '#854F0B' },
};

interface Props {
	visible: boolean;
	onClose: () => void;
}

const DeveloperAppsModal = ({ visible, onClose }: Props) => {
	const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
	const [searchQuery, setSearchQuery] = useState('');

	const filteredApps = useMemo(() => {
		return COMMON_APPS_DATA.Apps.filter((app) => {
			const categoryMatch = selectedCategory === 'all' || app.category === selectedCategory;
			const q = searchQuery.trim().toLowerCase();
			const textMatch = !q || app.title.toLowerCase().includes(q) || app.desc.toLowerCase().includes(q);
			return categoryMatch && textMatch;
		});
	}, [selectedCategory, searchQuery]);

	const getDownloadUrl = (app: CommonType.AppItem) => {
		const primary = Platform.OS === 'android' ? app.android : app.ios;
		const fallback = Platform.OS === 'android' ? app.ios : app.android;
		return primary || fallback || null;
	};

	const newAppIds = useMemo(
		() =>
			new Set(
				[...COMMON_APPS_DATA.Apps]
					.sort((a, b) => b.id - a.id)
					.slice(0, 2)
					.map((app) => app.id),
			),
		[],
	);
	const onDownloadApp = async (app: CommonType.AppItem) => {
		const url = getDownloadUrl(app);
		if (!url) {
			Alert.alert('Coming Soon!', '아직 스토어 링크가 준비되지 않았습니다.');
			return;
		}
		try {
			const supported = await Linking.canOpenURL(url);
			if (!supported) {
				Alert.alert('오류', '링크를 열 수 없습니다.');
				return;
			}
			Linking.openURL(url);
		} catch {
			Alert.alert('오류', '링크를 여는 중 문제가 발생했습니다.');
		}
	};

	const handleClose = () => {
		setSelectedCategory('all');
		setSearchQuery('');
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
			<View style={styles.overlay}>
				<PopInView visible={visible} style={styles.container}>
					{/* 헤더 */}
					<View style={styles.header}>
						<View style={styles.headerTop}>
							<Text style={styles.titleText}>📱 제작자의 다른 앱</Text>
							<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
								<Text style={styles.closeText}>✕</Text>
							</TouchableOpacity>
						</View>

						{/* 검색 */}
						<View style={styles.searchBox}>
							<IconComponent type="Feather" name="search" size={scaledSize(14)} color="#95a5a6" style={styles.searchIcon} />
							<TextInput
								style={styles.searchInput}
								placeholder="앱 검색..."
								placeholderTextColor="#bdc3c7"
								value={searchQuery}
								onChangeText={setSearchQuery}
							/>
						</View>

						{/* 카테고리 필터 */}
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
							{CATEGORY_TABS.map((tab) => (
								<TouchableOpacity
									key={tab.key}
									style={[styles.tabButton, selectedCategory === tab.key && styles.tabButtonActive]}
									onPress={() => setSelectedCategory(tab.key)}>
									<Text style={[styles.tabButtonText, selectedCategory === tab.key && styles.tabButtonTextActive]}>
										{tab.label}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>

					<View style={styles.divider} />

					{/* 카운트 */}
					<Text style={styles.countLabel}>{filteredApps.length}개 앱</Text>

					{/* 리스트 */}
					<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
						{filteredApps.length === 0 ? (
							<View style={styles.emptyState}>
								<Text style={styles.emptyText}>검색 결과가 없습니다</Text>
							</View>
						) : (
							filteredApps.map((app) => {
								const catColor = CATEGORY_COLORS[app.category];
								return (
									<View key={app.id} style={styles.appCard}>
										<View style={{ position: 'relative' }}>
											<Image source={app.icon} style={styles.image} resizeMode="cover" />

											{newAppIds.has(app.id) && (
												<View style={styles.newBadge}>
													<Text style={styles.newBadgeText}>NEW</Text>
												</View>
											)}
										</View>
										<View style={styles.appInfo}>
											<Text style={styles.appTitle} numberOfLines={1}>
												{app.title}
											</Text>
											<Text style={styles.appDesc} numberOfLines={2}>
												{app.desc}
											</Text>
											<View style={styles.appFooter}>
												<View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
													<Text style={[styles.categoryBadgeText, { color: catColor.text }]}>{CATEGORY_LABEL[app.category]}</Text>
												</View>
												<TouchableOpacity style={styles.downloadButton} onPress={() => onDownloadApp(app)}>
													<IconComponent type="Feather" name="download" size={scaledSize(12)} color="#2980b9" />
													<Text style={styles.downloadText}>다운로드</Text>
												</TouchableOpacity>
											</View>
										</View>
									</View>
								);
							})
						)}
					</ScrollView>
				</PopInView>
			</View>
		</Modal>
	);
};

export default DeveloperAppsModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: scaleWidth(20),
	},
	container: {
		width: '100%',
		maxHeight: scaleHeight(660),
		backgroundColor: '#ffffff',
		borderRadius: moderateScale(20),
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOpacity: 0.12,
		shadowOffset: { width: 0, height: scaleHeight(8) },
		shadowRadius: 20,
	},
	header: {
		paddingTop: scaleHeight(20),
		paddingHorizontal: scaleWidth(20),
	},
	headerTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: scaleHeight(14),
	},
	titleText: {
		fontSize: scaledSize(16),
		fontWeight: '600',
		color: '#2c3e50',
	},
	closeButton: {
		width: scaleWidth(28),
		height: scaleWidth(28),
		borderRadius: scaleWidth(12),
		borderWidth: 0.5,
		borderColor: '#e0e0e0',
		alignItems: 'center',
		justifyContent: 'center',
	},
	closeText: {
		fontSize: scaledSize(13),
		color: '#95a5a6',
		fontWeight: '500',
	},
	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f8f9fa',
		borderRadius: moderateScale(10),
		paddingHorizontal: scaleWidth(10),
		marginBottom: scaleHeight(12),
		height: scaleHeight(38),
	},
	searchIcon: {
		marginRight: scaleWidth(6),
	},
	searchInput: {
		flex: 1,
		fontSize: scaledSize(13),
		color: '#2c3e50',
		paddingVertical: 0,
	},
	tabsContainer: {
		flexDirection: 'row',
		gap: scaleWidth(6),
		paddingBottom: scaleHeight(14),
	},
	tabButton: {
		paddingHorizontal: scaleWidth(14),
		paddingVertical: scaleHeight(6),
		borderRadius: scaleWidth(100),
		borderWidth: 0.5,
		borderColor: '#e0e0e0',
		backgroundColor: 'transparent',
	},
	tabButtonActive: {
		backgroundColor: '#E6F1FB',
		borderColor: 'transparent',
	},
	tabButtonText: {
		fontSize: scaledSize(12),
		color: '#95a5a6',
		fontWeight: '400',
	},
	tabButtonTextActive: {
		color: '#2980b9',
		fontWeight: '600',
	},
	divider: {
		height: 0.5,
		backgroundColor: '#ecf0f1',
	},
	countLabel: {
		fontSize: scaledSize(12),
		color: '#95a5a6',
		paddingHorizontal: scaleWidth(16),
		paddingTop: scaleHeight(10),
		paddingBottom: scaleHeight(4),
	},
	scroll: {
		padding: scaleWidth(12),
		paddingBottom: scaleHeight(20),
	},
	appCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: scaleWidth(12),
		padding: scaleWidth(12),
		borderRadius: moderateScale(14),
		borderWidth: 0.5,
		borderColor: '#ecf0f1',
		backgroundColor: '#ffffff',
		marginBottom: scaleHeight(8),
	},
	image: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		borderRadius: scaleWidth(12),
		flexShrink: 0,
	},
	appInfo: {
		flex: 1,
		minWidth: 0,
	},
	appTitle: {
		fontSize: scaledSize(14),
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: scaleHeight(3),
	},
	appDesc: {
		fontSize: scaledSize(12),
		color: '#95a5a6',
		lineHeight: scaleHeight(18),
		marginBottom: scaleHeight(8),
	},
	appFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	categoryBadge: {
		paddingHorizontal: scaleWidth(8),
		paddingVertical: scaleHeight(3),
		borderRadius: scaleWidth(100),
	},
	categoryBadgeText: {
		fontSize: scaledSize(11),
		fontWeight: '500',
	},
	downloadButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: scaleWidth(4),
		paddingHorizontal: scaleWidth(10),
		paddingVertical: scaleHeight(5),
		borderRadius: moderateScale(8),
		borderWidth: 0.5,
		borderColor: '#2980b9',
	},
	downloadText: {
		fontSize: scaledSize(12),
		color: '#2980b9',
		fontWeight: '500',
	},
	emptyState: {
		paddingVertical: scaleHeight(40),
		alignItems: 'center',
	},
	emptyText: {
		fontSize: scaledSize(13),
		color: '#bdc3c7',
	},
	imageWrapper: {
		width: scaleWidth(52),
		height: scaleWidth(52),
		flexShrink: 0,
		overflow: 'hidden',
		borderRadius: scaleWidth(12),
	},
	newBadge: {
		position: 'absolute',
		top: -scaleWidth(4),
		left: -scaleWidth(4),
		backgroundColor: '#e74c3c',
		borderRadius: scaleWidth(4),
		paddingHorizontal: scaleWidth(4),
		paddingVertical: scaleHeight(2),
		zIndex: 1,
	},
	newBadgeText: {
		color: '#ffffff',
		fontSize: scaledSize(8),
		fontWeight: '800',
		letterSpacing: 0.5,
	},
});
