import notifee, { AndroidImportance, RepeatFrequency, TriggerType } from '@notifee/react-native';
import DateUtils from '@/utils/DateUtils';

/**
 * 알림 채널 ID 는 버전을 붙여 관리한다.
 *
 * 안드로이드 채널은 **한 번 만들면 설정이 바뀌지 않는다** — 코드에서 vibration 을 꺼도
 * 이미 만들어진 채널은 계속 진동한다. 그래서 진동을 끌 때 ID 에 `-v2` 를 붙여 새로 만들고,
 * 진동이 켜진 구버전 채널은 아래 함수로 지운다.
 * 앞으로 채널 설정을 바꿀 때도 같은 방식으로 버전을 올려야 기존 사용자에게 반영된다.
 */
const LEGACY_VIBRATION_CHANNEL_IDS = ['quiz-reminder', 'immediate-notification', 'daily-notification', 'weekly-notification'];

/** 진동이 켜진 구버전 채널 삭제. 앱 시작 시 1회 호출한다(없거나 iOS 면 조용히 무시된다). */
const deleteLegacyVibrationChannels = async (): Promise<void> => {
    await Promise.all(LEGACY_VIBRATION_CHANNEL_IDS.map((id) => notifee.deleteChannel(id).catch(() => undefined)));
};

/** 오늘의 퀴즈 리마인더 — 고정 ID 라 재예약이 항상 기존 예약을 덮어쓴다. */
const DAILY_QUIZ_NOTIFICATION_ID = 'daily-quiz-reminder';

/**
 * 예약 시각이 '지금'과 너무 붙어 있으면 다음 주기로 넘기는 최소 여유(ms).
 *
 * notifee 는 trigger.timestamp 가 과거면 예약을 거부한다
 * ("'trigger.timestamp' date must be in the future." — validators/validateTrigger.ts).
 * 14:59:59.998 에 15시 알림을 재예약하면 timestamp 가 2ms 뒤가 되는데, 그 사이 JS 스레드가
 * 렌더 한 번만 물려도 검증 시점엔 이미 과거라 예약이 통째로 실패했다. 경계에서 터지지 않게
 * 1초 미만이면 그냥 내일로 넘긴다(어차피 그 1초 안에 울릴 알림은 의미가 없다).
 */
const MIN_TRIGGER_LEAD_MS = 1000;

/**
 * 다음 알림 시각(로컬 기준)을 계산합니다.
 *
 * - 기기의 로컬 시/분으로만 계산하므로 타임존 오프셋을 하드코딩할 필요가 없습니다.
 * - 지정 시각이 이미 지났으면(또는 1초 안쪽으로 임박했으면) 다음 날로 넘깁니다.
 *
 * @param hour 시 (0-23, 로컬)
 * @param minute 분 (0-59, 로컬)
 * @param from 기준 시각 (테스트용, 기본값 현재)
 * @returns epoch millis (항상 from 보다 미래)
 */
const getNextTriggerTimestamp = (hour: number, minute: number, from: Date = DateUtils.now()): number => {
    const next = new Date(from);
    next.setHours(hour, minute, 0, 0);

    if (next.getTime() - from.getTime() < MIN_TRIGGER_LEAD_MS) {
        next.setDate(next.getDate() + 1);
    }
    return next.getTime();
};

/** 알림 시각 저장값이 없거나 깨졌을 때 쓸 기본 시(로컬 15시). */
const DEFAULT_ALARM_HOUR = 15;

/**
 * 저장된 알림 시각 문자열에서 로컬 '시(hour)' 만 읽어 온다. (알림 시각 파싱의 유일한 출처)
 *
 * - 신규 포맷: 'HH:mm' — 로컬 시/분만 저장하므로 타임존·날짜가 섞이지 않는다.
 * - 구버전 포맷: ISO 절대시각 — 아직 마이그레이션되지 않은 사용자가 있어 하위 호환으로 남겨 둔다.
 *   기기 로컬 시로 환산해서 읽는다.
 *
 * ⚠️ 0-23 범위 검증이 핵심이다. 예전에는 정규식만 통과하면 그대로 썼는데, 깨진 저장값('99:00')이
 *    Date.setHours(99) 로 넘어가 알람이 4일 뒤로 밀렸다 — 사용자에겐 "지정한 시간이 멋대로 바뀐다"로 보였다.
 *
 * @returns 0-23, 읽을 수 없으면 null. 기본값 대체/예약 스킵 중 무엇을 할지는 호출부가 정한다.
 */
const parseAlarmHour = (stored?: string | null): number | null => {
    if (!stored) {
        return null;
    }
    const hhmm = /^(\d{1,2}):(\d{2})$/.exec(stored);
    // 'HH:mm' 이 아니면 구버전 ISO 로 보고 로컬 시각으로 환산. 파싱 실패면 NaN → 아래 범위 검사에서 걸린다.
    const hour = hhmm ? Number(hhmm[1]) : new Date(stored).getHours();
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
};

/**
 * 오늘의 퀴즈 리마인더를 '저장된 로컬 시각' 기준으로 다시 예약한다.
 *
 * repeatFrequency 반복은 알림이 실제로 울린 시각을 기준으로 다음 회차를 잡기 때문에,
 * 기기가 Doze 상태라 알림이 늦게 울리면 그 지연이 매일 누적된다(= 지정한 시각이 계속 밀린다).
 * 그래서 앱이 뜰 때마다 저장된 시/분으로 절대 시각을 다시 계산해 재예약해 드리프트를 0 으로 되돌린다.
 *
 * @param hour 0-23 (기기 로컬 기준). 반드시 저장된 값을 넘길 것 — 현재 시각으로 재계산하지 않는다.
 * @param moveToScreen 알림 탭 시 이동할 라우트명
 * @returns 예약 성공 여부. 실패를 조용히 삼키면 화면이 "저장 완료" 토스트를 띄워
 *          사용자는 예약된 줄 알지만 알림은 오지 않는다. 호출부가 반드시 확인할 것.
 */
const scheduleDailyQuizReminder = async (hour: number, moveToScreen: string): Promise<boolean> => {
    try {
        const channelId = await notifee.createChannel({
            id: 'quiz-reminder-v2',
            name: '퀴즈 알림',
            importance: AndroidImportance.HIGH,
            // 이 앱은 진동 피드백을 쓰지 않는다. notifee 기본값이 true 라 반드시 꺼야 한다.
            vibration: false,
        });

        // 재예약 전 항상 기존 예약 취소 (중복 예약 방지)
        await notifee.cancelNotification(DAILY_QUIZ_NOTIFICATION_ID);

        // ⚠️ timestamp 는 위 await 들이 끝난 '직후'에 계산해야 한다. 위로 올려 미리 계산해 두면
        //    채널 생성·취소의 네이티브 왕복 시간만큼 값이 낡아, 정시 직전에 앱을 열었을 때
        //    notifee 검증에서 "must be in the future" 로 예약이 실패한다.
        const timestamp = getNextTriggerTimestamp(hour, 0);

        await notifee.createTriggerNotification(
            {
                id: DAILY_QUIZ_NOTIFICATION_ID,
                title: '속담 퀴즈가 도착했습니다. 🍀',
                body: '출석 체크도 하고 문제도 풀면서 속담 지식을 넓혀 보세요!',
                android: {
                    channelId,
                    pressAction: { id: 'default' },
                },
                data: { moveToScreen },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp,
                repeatFrequency: RepeatFrequency.DAILY,
            },
        );
        return true;
    } catch (error) {
        console.error('오늘의 퀴즈 리마인더 예약 실패:', error);
        return false;
    }
};

/**
 * 오늘의 퀴즈 리마인더 예약 취소
 *
 * 예약과 마찬가지로 여기서 throw 하면 이걸 await 하던 async 핸들러가 그 자리에서 끊긴다.
 * (설정 저장이 뒤에 남아 있으면 통째로 날아갔다) 실패는 로그만 남기고 성패를 돌려준다.
 */
const cancelDailyQuizReminder = async (): Promise<boolean> => {
    try {
        await notifee.cancelNotification(DAILY_QUIZ_NOTIFICATION_ID);
        return true;
    } catch (error) {
        console.error('오늘의 퀴즈 리마인더 취소 실패:', error);
        return false;
    }
};

export {
    DAILY_QUIZ_NOTIFICATION_ID,
    deleteLegacyVibrationChannels,
    DEFAULT_ALARM_HOUR,
    parseAlarmHour,
    scheduleDailyQuizReminder,
    cancelDailyQuizReminder,
    getNextTriggerTimestamp,
};
