/** 날짜 포맷 타입 정의 */
type DateFormatType = 'type1' | 'type2' | 'type3' | 'type4' | 'type5' | 'type6';

/** 'YYYY-MM-DD' 형태인지 판별 — 이 형태는 이미 '로컬 날짜' 라 UTC 파싱을 태우면 안 된다. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

class DateUtils {

    /**
     * 기기가 위치한 타임존(IANA 문자열)을 반환합니다. 예) 'Asia/Seoul'
     * 시간 계산의 단일 기준점이므로 앱 어디서든 이 값을 쓴다.
     */
    getTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

    /**
     * '지금'을 가져오는 앱 공통 진입점.
     *
     * Date 는 내부적으로 UTC epoch 이고 getHours()/getDate() 같은 접근자는
     * 기기 타임존을 따르므로, 기기 타임존 = 사용자 타임존인 한 new Date() 와 동일하다.
     * 그럼에도 이 함수를 쓰는 이유는 두 가지다.
     *  1) 시간 계산의 기준점을 한 곳으로 모아, 테스트/디버깅 때 여기만 바꾸면 되게 한다.
     *  2) `new Date()` 산재로 인해 타임존 의도가 드러나지 않는 것을 막는다.
     */
    now = (): Date => new Date();

    /** 현재 시각의 epoch millis. Date.now() 대체용. */
    nowTime = (): number => Date.now();

    /**
     * 날짜 포맷팅 함수
     * @param date Date 객체
     * @param type 포맷 타입
     * @returns 포맷된 날짜 문자열
     *
     * type1: YYYY-MM-DD HH:mm:ss
     * type2: YYYY.MM.DD HH:mm
     * type3: YYYY/MM/DD
     * type4: YYYY -MM -DD
     * type5: HH:mm
     * type6: YY.MM.DD
     */
    formatDate = (date: Date, type: DateFormatType): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        switch (type) {
            case 'type1':
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            case 'type2':
                return `${year}.${month}.${day} ${hours}:${minutes}`;
            case 'type3':
                return `${year}/${month}/${day}`;
            case 'type4':
                return `${year} -${month} -${day}`;
            case 'type5':
                return `${hours}:${minutes}`;
            case 'type6':
                return `${String(year).slice(-2)}.${month}.${day}`;
            default:
                const _exhaustiveCheck: never = type;
                throw new Error('Invalid date format type');
        }
    };

    /**
     * 국가 별 날짜를 추출합니다.
     * @returns
     */
    getLocalDateString = (date: Date = this.now()): string => {
        const timeZone = this.getTimeZone();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(date); // 'YYYY-MM-DD'
    };

    /**
     * 저장된 날짜 값(ISO 타임스탬프 또는 'YYYY-MM-DD')을 로컬 날짜 키로 변환합니다.
     * - 'YYYY-MM-DD' 는 이미 로컬 날짜 키이므로 그대로 반환합니다.
     *   (new Date('YYYY-MM-DD') 는 UTC 자정으로 파싱되어 UTC- 지역에서 하루 밀립니다)
     * - ISO 타임스탬프는 로컬 기준 날짜로 환산합니다.
     *   (quizDate.slice(0, 10) 은 UTC 날짜라 KST 오전 9시 이전 항목이 어제로 잡힙니다)
     */
    toLocalDateKey = (value?: string | Date | null): string => {
        if (!value) {
            return '';
        }
        if (typeof value === 'string' && DATE_ONLY.test(value)) {
            return value;
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? '' : this.getLocalDateString(parsed);
    };

    /**
     * 저장된 날짜 값을 '로컬 시간축의 Date' 로 되돌립니다.
     * 화면에서 월/일/요일을 뽑아 쓰려면 문자열 키가 아니라 Date 가 필요합니다.
     *
     * ⚠️ `new Date('2026-09-03')` 은 **UTC 자정**으로 파싱된다. 그대로 getDate() 를 부르면
     *    UTC- 지역(미주 등)에서 하루 전으로 나온다. 날짜만 있는 문자열은 반드시
     *    연/월/일을 쪼개 `new Date(y, m-1, d)` 로 만들어야 로컬 자정이 된다.
     *
     * @param value ISO 타임스탬프 또는 'YYYY-MM-DD'
     * @returns 파싱 실패 시 null
     */
    toLocalDate = (value?: string | Date | null): Date | null => {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }
        const dateOnly = DATE_ONLY.exec(value);
        if (dateOnly) {
            return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    /**
     * 저장된 날짜 값의 정렬용 epoch millis. 날짜만 있는 값은 로컬 자정으로 환산합니다.
     * (ISO 와 'YYYY-MM-DD' 가 섞여 저장돼도 같은 기준으로 정렬된다)
     */
    toLocalTime = (value?: string | Date | null): number => this.toLocalDate(value)?.getTime() ?? 0;

    /**
     * 저장된 날짜 값(ISO / 'YYYY-MM-DD' / Date)을 바로 포맷 문자열로 바꿉니다.
     * 화면에서 `moment(value).format(...)` 을 대체하는 진입점.
     * @param fallback 파싱 실패 시 돌려줄 값
     */
    formatLocal = (value: string | Date | null | undefined, type: DateFormatType, fallback = ''): string => {
        const date = this.toLocalDate(value);
        return date ? this.formatDate(date, type) : fallback;
    };

}
export default new DateUtils();
