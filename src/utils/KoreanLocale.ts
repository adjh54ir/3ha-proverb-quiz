/**
 * 한국어 로케일 설정 (부수효과 모듈)
 *
 * 홈과 '나의 활동' 이 각각 같은 설정을 하고 있었고, 홈 쪽에는 `moment/locale/ko`
 * import 가 빠져 있어 홈이 먼저 로드되면 `moment.locale('ko')` 가 조용히 무시됐다
 * (등록되지 않은 로케일이면 moment 는 기존 값을 유지한다).
 *
 * 날짜를 쓰는 화면에서 이 모듈만 import 하면 된다.
 */
import moment from 'moment';
import 'moment/locale/ko';
import { LocaleConfig } from 'react-native-calendars';

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

LocaleConfig.locales.kr = {
	monthNames: MONTHS,
	monthNamesShort: MONTHS,
	dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
	dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
};
LocaleConfig.defaultLocale = 'kr';

moment.locale('ko');

export {};
