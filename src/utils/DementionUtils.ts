import { Dimensions } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// resolution changes as per design
export const designWidth = 375;
export const designHeight = 812;

/**
 * 화면 비율을 그대로 곱하면 태블릿에서 카드·글자·간격이 두 배 이상 커져
 * 한 화면에 보여야 할 정보량이 지나치게 줄어든다. 화면 구조는 넓어지되,
 * 개별 UI 요소는 휴대폰 대비 적정 범위까지만 커지도록 상한을 둔다.
 */
const MAX_WIDTH_SCALE = 1.4;
const MAX_HEIGHT_SCALE = 1.3;
const MAX_FONT_SCALE = 1.25;

const widthScale = Math.min(screenWidth / designWidth, MAX_WIDTH_SCALE);
const heightScale = Math.min(screenHeight / designHeight, MAX_HEIGHT_SCALE);
const fontScale = Math.min(Math.min(screenWidth / designWidth, screenHeight / designHeight), MAX_FONT_SCALE);

const scaleWidth = (val: number) => {
    return val * widthScale;
};

const scaleHeight = (val: number) => {
    return val * heightScale;
};

const moderateScale = (size: number, factor = 1) =>
    size + (scaleWidth(size) - size) * factor;

const scaledSize = (size: number) => Math.ceil(size * fontScale);

export {
    moderateScale,
    scaledSize,
    scaleHeight,
    scaleWidth,
    screenHeight,
    screenWidth,
};
