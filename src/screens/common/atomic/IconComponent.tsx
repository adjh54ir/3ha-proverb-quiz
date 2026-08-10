// IconComponent.tsx
import { scaledSize } from '@/utils';
import React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Zocial from 'react-native-vector-icons/Zocial';
import { StyleProp, TextStyle } from 'react-native/types';

export type IconType =
	| 'antdesign'
	| 'entypo'
	| 'evilicons'
	| 'feather'
	| 'fontawesome'
	| 'fontawesome5'
	| 'fontawesome6'
	| 'fontisto'
	| 'foundation'
	| 'ionicons'
	| 'materialcommunityicons'
	| 'materialicons'
	| 'octicons'
	| 'simplelineicons'
	| 'zocial';

interface IconProps {
	type: string;
	name: string;
	/** 최종 렌더 크기(px). 호출부에서 scaledSize() 로 감싸 전달한다. */
	size?: number;
	color?: string;
	style?: StyleProp<TextStyle>;
}
/**
 * react-native-vector-icons 를 활용할 수 있는 컴포넌트
 * 아이콘 링크 : https://oblador.github.io/react-native-vector-icons/
 *
 *  호출 예시
 const MyComponent = () => {
  return (
	<IconComponent
	  type="materialIcons"
	  name="home"
	  size={24}
	  color="#000000"
	/>
  );
};
 * @param param0
 * @returns
 */
const IconComponent: React.FC<IconProps> = ({ type, name, size = scaledSize(24), color = 'black', style }) => {
	const normalizedType = type.toLowerCase(); // 소문자 변환

	const iconMap: Record<IconType, any> = {
		antdesign: AntDesign,
		entypo: Entypo,
		evilicons: EvilIcons,
		feather: Feather,
		fontawesome: FontAwesome,
		fontawesome5: FontAwesome5,
		fontawesome6: FontAwesome6,
		fontisto: Fontisto,
		foundation: Foundation,
		ionicons: Ionicons,
		materialcommunityicons: MaterialCommunityIcons,
		materialicons: MaterialIcons,
		octicons: Octicons,
		simplelineicons: SimpleLineIcons,
		zocial: Zocial,
	};

	const Icon = iconMap[normalizedType as IconType];

	if (!Icon) {
		console.warn(`[IconComponent] '${type}'는 지원되지 않는 아이콘 타입입니다.`);
		return null;
	}

	// size 는 이미 스케일이 적용된 최종값으로 취급한다.
	// 여기서 다시 scaleWidth() 를 걸면 호출부의 scaledSize() 와 겹쳐 이중 스케일이 된다.
	return <Icon name={name} size={size} color={color} style={style} />;
};

export default IconComponent;
