import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import AdmobBannerAd from '../ads/AdmobBannerAd';
import AdmobFrontAd from '../ads/AdmobFrontAd';
import AdmobRewardAd from '../ads/AdmobRewardAd';
import AdmobRewardFrontAd from '../ads/AdmobRewardFrontAd';
import AdmobNativeAd from '../ads/AdmobNativeAd';
import AdmobAppOpenAd from '../ads/AdmobAppOpenAd';

const AdvertisementScreens = () => {
	const [isShowBannerAd, setIsShowBannerAd] = useState(false);
	const [isShowFrontAd, setIsShowFrontAd] = useState(false);
	const [isShowRewardAd, setIsShowRewardAd] = useState(false);
	const [isShowRewardFrontAd, setIsShowRewardFrontAd] = useState(false);
	const [isShowNativeAd, setIsShowNativeAd] = useState(false);
	const [isShowAppOpenAd, setIsShowAppOpenAd] = useState(false);

	return (
		<ScrollView style={styles.container}>
			<View style={styles.section}>
				<Text style={styles.title}>배너 광고</Text>
				<Text style={styles.description}>
					- 앱 레이아웃의 일부를 차지하는 직사각형 광고가 게재됩니다. 이 광고는 일정 기간 후 자동으로 새로고침됩니다. 즉
					사용자가 앱에서 같은 화면에 머물러 있어도 정기적으로 새 광고가 게재됩니다. 또한 가장 구현하기 간단한 광고
					형식이기도 합니다.
				</Text>
				<AdmobBannerAd />
			</View>

			<View style={styles.section}>
				<Text style={styles.title}>전면 광고</Text>
				<Text style={styles.description}>
					- 앱에서 페이지 전체를 채우는 광고입니다. 게임 앱의 레벨 완료 후와 같이 앱 인터페이스에서 자연스럽게 멈추거나
					전환하는 시점에 전면 광고를 게재하세요.
				</Text>
				<TouchableOpacity style={styles.button} onPress={() => setIsShowFrontAd(true)}>
					<Text style={styles.buttonText}>전면 광고 보기</Text>
				</TouchableOpacity>
				{isShowFrontAd && <AdmobFrontAd />}
			</View>

			<View style={styles.section}>
				<Text style={styles.title}>리워드 광고</Text>
				<Text style={styles.description}>
					- 사용자가 광고를 시청한 후 보상을 받을 수 있는 광고입니다. 게임 내 아이템이나 포인트 등을 보상으로 제공할 수
					있습니다.
				</Text>
				<AdmobRewardAd />
			</View>

			<View style={styles.section}>
				<Text style={styles.title}>보상형 전면 광고</Text>
				<Text style={styles.description}>
					- 전면 광고와 보상형 광고의 특성을 결합한 형태입니다. 전체 화면 광고를 시청한 후 보상을 받을 수 있습니다.
				</Text>
				<AdmobRewardFrontAd />
			</View>

			<View style={styles.section}>
				<Text style={styles.title}>네이티브 고급 광고</Text>
				<Text style={styles.description}>
					- 앱의 네이티브 UI 요소와 비슷한 형태로 표시되는 맞춤 광고입니다. 앱의 디자인과 자연스럽게 어울리도록
					커스터마이징할 수 있습니다.
				</Text>
				<TouchableOpacity style={styles.button} onPress={() => setIsShowNativeAd(true)}>
					<Text style={styles.buttonText}>네이티브 광고 보기</Text>
				</TouchableOpacity>
				{isShowNativeAd && <AdmobNativeAd />}
			</View>

			<View style={styles.section}>
				<Text style={styles.title}>앱 열기 광고</Text>
				<Text style={styles.description}>
					- 앱이 시작될 때 표시되는 광고입니다. 사용자가 앱을 실행할 때 처음으로 보게 되는 광고 형식입니다.
				</Text>
				<TouchableOpacity style={styles.button} onPress={() => setIsShowAppOpenAd(true)}>
					<Text style={styles.buttonText}>앱 열기 광고 보기</Text>
				</TouchableOpacity>
				{isShowAppOpenAd && <AdmobAppOpenAd />}
			</View>
		</ScrollView>
	);
};

export default AdvertisementScreens;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
		padding: 20,
	},
	section: {
		marginBottom: 30,
		backgroundColor: '#f8f9fa',
		padding: 15,
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#1a73e8',
		marginBottom: 15,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		color: '#333',
		marginBottom: 10,
	},
	button: {
		backgroundColor: '#1a73e8',
		padding: 10,
		borderRadius: 5,
		alignItems: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
