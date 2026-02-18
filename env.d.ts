/**
 * 파일은 타입스크립트가 타입을 찾지 못할 경우 참고하는 파일입니다.
 * 보통 전역에서 d.ts로 선언합니다. 아래 코드에서 보듯이 svg,png,ttf 등을 타입스크립트에서 사용하기 위해 모듈 타입을 선언해주는 것입니다.
 */
declare module '*.svg' {
	import { SvgProps } from 'react-native-svg';
	const content: React.FC<SvgProps>;
	export default content;
}

declare module '*.json' {
	const content: any;
	export default content;
}

declare module '*.png' {
	const content: any;
	export default content;
}

declare module '*.db' {
	const content: any;
	export default content;
}

declare module '*.mp3' {
	const content: any;
	export default content;
}

declare module '*.aac' {
	const content: any;
	export default content;
}

declare module '*.onnx' {
	const content: any;
	export default content;
}

declare module '*.ort' {
	const content: any;
	export default content;
}

declare module '@env' {
	// 앱 모드
	export const REACT_NATIVE_APP_MODE: string;

	export const IAP_REMOVE_AD_KEY: string;

	// 광고 단위의 아이디 : 배너 광고
	export const GOOGLE_ADMOV_ANDROID_BANNER: string;
	export const GOOGLE_ADMOV_IOS_BANNER: string;

	// 광고 단위의 아이디 : 전면 광고
	export const GOOGLE_ADMOV_ANDROID_FRONT: string;
	export const GOOGLE_ADMOV_IOS_FRONT: string;

	// 전면 광고의 발생 퍼센트 조절
	export const GOOGLE_ADMOV_FRONT_PERCENT: number;

	// 광고 단위의 아이디 : 보상형 전면 광고
	export const GOOGLE_ADMOV_ANDROID_REWARD_FRONT: string;
	export const GOOGLE_ADMOV_IOS_REWARD_FRONT: string;

	// 광고 단위의 아이디 : 리워드
	export const GOOGLE_ADMOV_ANDROID_REWARD: string;
	export const GOOGLE_ADMOV_IOS_REWARD: string;

	// 광고 단위의 아이디 : 네이티브 고급 광고
	export const GOOGLE_ADMOV_ANDROID_NATIVE_ADVANCED: string;
	export const GOOGLE_ADMOV_IOS_NATIVE_ADVANCED: string;

	// 광고 단위의 아이디 : 앱 열기
	export const GOOGLE_ADMOV_ANDROID_OPEN_APP: string;
	export const GOOGLE_ADMOV_IOS_OPEN_APP: string;

	export const GOOGLE_PLAY_STORE_URL: string;
	export const APP_STORE_URL: string;
}
}
