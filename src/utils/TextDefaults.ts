/**
 * 전역 Text / TextInput 기본 스타일 (부수효과 모듈)
 *
 * 이 앱의 폰트는 scaledSize() 기반 디자인 토큰(FONT_SIZES)으로 확대되어 쓰이는데,
 * fontSize 를 지정하지 않은 <Text> 는 RN 기본값 14(스케일 미적용)로 렌더되어
 * 주변 텍스트 대비 유독 작아 보인다. 그래서 기본 fontSize 를 FONT_SIZES.md 로 맞춘다.
 * 색 역시 지정하지 않으면 검정이라 다크모드에서 안 보이므로 테마 본문색을 기본값으로 넣는다.
 *
 * React 19 에서 Text.defaultProps 는 동작하지 않으므로,
 * RN 의 Text/TextInput 이 React.forwardRef(...) 객체라는 점을 이용해 render 를 감싼다.
 *
 * index.js 최상단에서 App 보다 먼저 import 할 것.
 */
import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { COLORS, FONT_SIZES, getTextSizeFactor, getTextSizeMode, getThemeMode, TEXT_SIZE_MAX_MULTIPLIER, themedValue } from '@/const/common/Theme';

/** <Text> 안에 중첩된 <Text> 인지 여부를 알려주는 RN 내부 컨텍스트 (public export 없음) */
// @ts-ignore - RN 내부 모듈이라 타입 선언(.d.ts)이 없다.
const TextAncestorContext = require('react-native/Libraries/Text/TextAncestor') as React.Context<boolean>;

/**
 * OS 글꼴 확대 상한. 접근성은 유지하되 레이아웃이 깨질 만큼의 과확대만 막는다.
 * 설정의 '글자 크게'를 켜면 상한이 더 풀린다(TEXT_SIZE_MAX_MULTIPLIER).
 */
const maxFontSizeMultiplier = () => TEXT_SIZE_MAX_MULTIPLIER[getTextSizeMode()];

/**
 * 기본 텍스트 스타일.
 * - fontSize: 미지정 <Text> 가 RN 기본값 14(스케일 미적용)로 작아지는 문제 방지.
 * - color: 미지정 <Text> 는 RN 기본이 검정이라 다크모드에서 배경에 묻힌다 → 테마 본문색 사용.
 * - includeFontPadding: Android 는 글꼴 위/아래에 서로 다른 여백을 자동으로 붙인다.
 *   그래서 `flexDirection: 'row' + alignItems: 'center'` 로 아이콘과 텍스트를 나란히 두면
 *   텍스트만 아래로 밀려 중앙이 어긋난다(iOS 는 이 여백이 없어 정상). 전역으로 꺼서
 *   아이콘 박스와 텍스트 박스의 세로 중앙이 실제로 일치하게 만든다.
 *   react-native-vector-icons 도 내부적으로 <Text> 라 같은 기본값을 함께 받는다.
 * themedValue 로 감싸 모드별로 캐싱한다(모듈 로드 시점 값으로 굳지 않는다).
 */
const defaultTextStyle = themedValue(() => ({ fontSize: FONT_SIZES.md, color: COLORS.text, includeFontPadding: false }));

/**
 * '글자 크게' 모드에서 lineHeight 를 함께 키운다.
 *
 * FONT_SIZES 토큰은 배율(TEXT_SIZE_FACTOR)을 이미 품고 있지만, 화면의 lineHeight 는
 * scaledSize()/scaleHeight() 로 직접 계산한 값이라 배율이 빠진다. 그대로 두면 글자만
 * 커지고 줄 간격은 그대로라 줄이 서로 겹치거나 아래가 잘린다.
 *
 * 기본 모드에서는 아무것도 하지 않는다(플래튼 비용 0). 모드를 켠 사용자만 비용을 낸다.
 */
const withScaledLineHeight = (style: any): any => {
	if (getTextSizeMode() === 'default' || !style) {
		return style;
	}
	const flat = StyleSheet.flatten(style);
	if (!flat || typeof flat.lineHeight !== 'number') {
		return style;
	}
	return { ...flat, lineHeight: flat.lineHeight * getTextSizeFactor() };
};

// forwardRef 객체의 render 는 타입상 노출되지 않아 any 캐스팅이 필요하다.
const TextAny = Text as any;
const TextInputAny = TextInput as any;

const baseTextRender = TextAny.render;
TextAny.render = function patchedTextRender(props: any, ref: any) {
	// 중첩 <Text> 는 부모의 fontSize 를 상속받아야 하므로 기본값을 주입하지 않는다.
	// (넣으면 <Text style={badge}><Text>x</Text></Text> 같은 곳이 전부 14 로 튄다)
	const isNested = React.useContext(TextAncestorContext);
	return baseTextRender.call(
		this,
		{
			maxFontSizeMultiplier: maxFontSizeMultiplier(),
			...props,
			// 기본 스타일을 배열 앞쪽에 두어 호출부 style 이 항상 덮어쓰게 한다.
			style: isNested ? withScaledLineHeight(props.style) : [defaultTextStyle, withScaledLineHeight(props.style)],
		},
		ref,
	);
};

const baseTextInputRender = TextInputAny.render;
TextInputAny.render = function patchedTextInputRender(props: any, ref: any) {
	return baseTextInputRender.call(
		this,
		{
			maxFontSizeMultiplier: maxFontSizeMultiplier(),
			// iOS 키보드 외형도 앱 테마를 따라간다(다크에서 흰 키보드가 튀는 문제).
			keyboardAppearance: getThemeMode() === 'dark' ? 'dark' : 'light',
			...props,
			style: [defaultTextStyle, withScaledLineHeight(props.style)],
		},
		ref,
	);
};

export {};
