import { Platform } from 'react-native';
import analytics from '@react-native-firebase/analytics';
import DeviceInfo from 'react-native-device-info';
import DateUtils from '@/utils/DateUtils';

export type AdClickFormat = 'banner' | 'interstitial' | 'rewarded' | 'app_open';

/** 광고 클릭 로깅 — Firebase 로 보내는 유일한 이벤트. 실패해도 광고 흐름은 그대로 간다. */
export const logAdClick = async (format: AdClickFormat, adUnitId: string, extra: Record<string, string> = {}): Promise<void> => {
	try {
		const instanceId = await analytics().getAppInstanceId();
		await analytics().logEvent(`ad_${format}_clicked`, {
			ad_platform: 'admob',
			ad_format: format,
			ad_unit_id: adUnitId,
			app_name: DeviceInfo.getApplicationName(),
			app_version: DeviceInfo.getVersion(),
			build_number: DeviceInfo.getBuildNumber(),
			device_platform: Platform.OS,
			device_model: DeviceInfo.getModel(),
			device_brand: DeviceInfo.getBrand(),
			system_version: DeviceInfo.getSystemVersion(),
			app_instance_id: instanceId ?? '',
			timestamp: DateUtils.now().toISOString(),
			...extra,
		});
	} catch {
		// 로깅 실패는 무시 — 광고 표시와 무관
	}
};
