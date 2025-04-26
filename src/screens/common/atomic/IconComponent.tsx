// IconComponent.tsx
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
	| 'antDesign'
	| 'entypo'
	| 'evilIcons'
	| 'feather'
	| 'fontAwesome'
	| 'fontAwesome5'
	| 'fontAwesome6'
	| 'fontisto'
	| 'foundation'
	| 'ionicons'
	| 'materialCommunityIcons'
	| 'materialIcons'
	| 'octicons'
	| 'simpleLineIcons'
	| 'zocial';

interface IconProps {
	type: IconType;
	name: string;
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
const IconComponent: React.FC<IconProps> = ({ type, name, size = 24, color = 'black', style }) => {
	const getIcon = () => {
		switch (type) {
			case 'antDesign':
				return <AntDesign name={name} size={size} color={color} style={style} />;
			case 'entypo':
				return <Entypo name={name} size={size} color={color} style={style} />;
			case 'evilIcons':
				return <EvilIcons name={name} size={size} color={color} style={style} />;
			case 'feather':
				return <Feather name={name} size={size} color={color} style={style} />;
			case 'fontAwesome':
				return <FontAwesome name={name} size={size} color={color} style={style} />;
			case 'fontAwesome5':
				return <FontAwesome5 name={name} size={size} color={color} style={style} />;
			case 'fontAwesome6':
				return <FontAwesome6 name={name} size={size} color={color} style={style} />;
			case 'fontisto':
				return <Fontisto name={name} size={size} color={color} style={style} />;
			case 'foundation':
				return <Foundation name={name} size={size} color={color} style={style} />;
			case 'ionicons':
				return <Ionicons name={name} size={size} color={color} style={style} />;
			case 'materialCommunityIcons':
				return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
			case 'materialIcons':
				return <MaterialIcons name={name} size={size} color={color} style={style} />;
			case 'octicons':
				return <Octicons name={name} size={size} color={color} style={style} />;
			case 'simpleLineIcons':
				return <SimpleLineIcons name={name} size={size} color={color} style={style} />;
			case 'zocial':
				return <Zocial name={name} size={size} color={color} style={style} />;
			default:
				return null;
		}
	};

	return getIcon();
};

export default IconComponent;
