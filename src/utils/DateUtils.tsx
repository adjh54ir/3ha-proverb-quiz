/** 날짜 포맷 타입 정의 */
type DateFormatType = 'type1' | 'type2' | 'type3' | 'type4' | 'type5';




class DateUtils {

    /**
     * 날짜 포맷팅 함수
     * @param date Date 객체
     * @param type 포맷 타입
     * @returns 포맷된 날짜 문자열
     * 
     * type1: YYYY-MM-DD HH:mm:ss
     * type2: YYYY.MM.DD HH:mm
     * type3: YYYY/MM/DD
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
            default:
                const _exhaustiveCheck: never = type;
                throw new Error('Invalid date format type');
        }
    };

    /**
     * 국가 별 날짜를 추출합니다.
     * @returns 
     */
    getLocalDateString = (): string => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        return formatter.format(new Date()); // 'YYYY-MM-DD' 형식으로 반환됨
    };

    /**
     * 파라미터로 전달 받은 국가 별로 날짜를 추출합니다.
     * @param inputDate 
     * @returns 
     */
    getLocalParamDateToString = (inputDate?: string | Date): string => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const targetDate = inputDate ? new Date(inputDate) : new Date();

        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        return formatter.format(targetDate); // YYYY-MM-DD
    };

}
export default new DateUtils();