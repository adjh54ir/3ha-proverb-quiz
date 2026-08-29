// IconComponent.tsx
import { scaledSize } from '@/utils';
import { COLORS } from '@/const/common/Theme';
import React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StyleProp, TextStyle } from 'react-native/types';

/**
 * 실제로 쓰는 패밀리만 남긴다. 안 쓰는 패밀리를 import 해 두면 그 글리프 맵이 통째로
 * 번들에 들어간다(패밀리당 수십 KB). 새 패밀리가 필요하면 여기에 한 줄씩 되살린다.
 */
export type IconType =
	| 'antdesign'
	| 'feather'
	| 'fontawesome'
	| 'fontawesome5'
	| 'fontawesome6'
	| 'materialcommunityicons'
	| 'materialicons';

/** 지원 패밀리 → 컴포넌트. 렌더마다 새로 만들지 않도록 모듈 스코프에 둔다. */
const ICON_MAP: Record<IconType, React.ComponentType<any>> = {
	antdesign: AntDesign,
	feather: Feather,
	fontawesome: FontAwesome,
	fontawesome5: FontAwesome5,
	fontawesome6: FontAwesome6,
	materialcommunityicons: MaterialCommunityIcons,
	materialicons: MaterialIcons,
};

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
// color 기본값을 'black' 으로 두면 다크모드에서 아이콘이 배경에 묻힌다 → 테마 본문색을 기본으로.
const IconComponent: React.FC<IconProps> = ({ type, name, size = scaledSize(24), color = COLORS.text, style }) => {
	const Icon = ICON_MAP[type.toLowerCase() as IconType];

	if (!Icon) {
		console.warn(`[IconComponent] '${type}'는 지원되지 않는 아이콘 타입입니다.`);
		return null;
	}

	// size 는 이미 스케일이 적용된 최종값으로 취급한다.
	// 여기서 다시 scaleWidth() 를 걸면 호출부의 scaledSize() 와 겹쳐 이중 스케일이 된다.
	return <Icon name={name} size={size} color={color} style={style} />;
};

export default IconComponent;
