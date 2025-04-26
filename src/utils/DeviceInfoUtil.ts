import { Alert, BackHandler, Platform } from "react-native";
import NetInfo, { NetInfoSubscription } from "@react-native-community/netinfo";
import DeviceInfo from "react-native-device-info";

/**
 * 현재 디바이스의 종류를 반환 받습니다.
 * macos, web, windows의 경우는 수행하지 않습니다.
 * @return {string} 플랫폼 종류
*/
const getPlatformType = () => {
    if (Platform.OS === "macos" || Platform.OS === "web" || Platform.OS == "windows") {
        Alert.alert("지원하지 않는 플랫폼입니다.");
    }
    return Platform.OS
}

/**
 * DeviceInfo의 DeviceType 값을 가져옵니다.
 * @returns {string}
 */
const getDeviceType = (): string => DeviceInfo.getDeviceType();

/**
 * DeviceInfo의 SystemName 값을 가져옵니다. 
 * @returns {string}
 */
const getSystemName = (): string => DeviceInfo.getSystemName();

/**
 * DeviceInfo의 SystemVersion 값을 가져옵니다.
 * @returns {string}
 */
const getSystemVersion = (): string => DeviceInfo.getSystemVersion();

/**
 * DeviceInfo의 UniqueId 값을 가져옵니다.
 * @returns {Promise<string>}
 */
const getUniqueId = async (): Promise<string> => await DeviceInfo.getUniqueId();

/**
 * DeviceInfo의 IpAddress 값을 가져옵니다.
 * @returns {string}
 */
const getIpAddress = async (): Promise<string> => {
    try {
        return await DeviceInfo.getIpAddress();
    } catch (error) {
        console.error("IP 주소를 가져오는데 실패했습니다:", error);
        return "";
    }
};

/**
 * 디바이스가 태블릿인지 확인합니다.
 * @returns {boolean}
 */
const isTablet = (): boolean => DeviceInfo.isTablet();

/**
 * 디바이스가 iPad인지 확인합니다.
 * @returns {boolean}
 */
const isIPad = (): boolean => DeviceInfo.getModel().substring(0, 4) === 'iPad';

export {
    getPlatformType,
    getDeviceType,
    getSystemName,
    getSystemVersion,
    getUniqueId,
    getIpAddress,
    isTablet,
    isIPad
};


