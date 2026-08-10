import notifee, { AndroidImportance, AndroidVisibility, AuthorizationStatus, RepeatFrequency, TriggerType } from "@notifee/react-native";

/** 반복 알림은 고정 ID 를 써야 재예약 시 취소/덮어쓰기가 된다. */
const DAILY_NOTIFICATION_ID = 'daily-notification';
const WEEKLY_NOTIFICATION_ID = 'weekly-notification';

/**
 * 다음 알림 시각(로컬 기준)을 계산합니다.
 *
 * - 기기의 로컬 시/분으로만 계산하므로 타임존 오프셋을 하드코딩할 필요가 없습니다.
 * - 지정 시각이 이미 지났으면 정확히 다음 주기(하루 / 일주일)로 넘깁니다.
 *
 * @param hour 시 (0-23, 로컬)
 * @param minute 분 (0-59, 로컬)
 * @param dayOfWeek 요일 (0-6, 일요일=0). 생략하면 매일 기준
 * @param from 기준 시각 (테스트용, 기본값 현재)
 * @returns epoch millis (항상 from 보다 미래)
 */
const getNextTriggerTimestamp = (hour: number, minute: number, dayOfWeek?: number, from: Date = new Date()): number => {
    const next = new Date(from);
    next.setHours(hour, minute, 0, 0);

    if (dayOfWeek === undefined) {
        if (next.getTime() <= from.getTime()) {
            next.setDate(next.getDate() + 1);
        }
        return next.getTime();
    }

    // 대상 요일까지 남은 일수. 당일이지만 시각이 이미 지났으면 정확히 7일 뒤.
    let daysUntilTarget = (dayOfWeek - next.getDay() + 7) % 7;
    if (daysUntilTarget === 0 && next.getTime() <= from.getTime()) {
        daysUntilTarget = 7;
    }
    next.setDate(next.getDate() + daysUntilTarget);
    return next.getTime();
};

/**
 * 알림 권한 요청
 * @returns 권한 상태 (boolean)
 */
const RequestNotificationPermission = async (): Promise<boolean> => {
    try {
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    } catch (error) {
        console.error('Failed to request notification permission:', error);
        return false;
    }
};

/**
 * 즉시 푸시메시지 전송
 * @param title 
 * @param body 
 */
const DirectNotification = async (title: string, body: string) => {
    try {
        const channelId = await notifee.createChannel({
            id: 'immediate-notification',
            name: 'Immediate Notifications',
            importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
            title,
            body,
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
                smallIcon: 'ic_launcher',
                visibility: AndroidVisibility.PUBLIC,
            },
            ios: {
                sound: 'default',
                critical: true,
            },
        });
    } catch (error) {
        console.error('Failed to send immediate notification:', error);
    }
}

/**
 * 매일 반복 푸시 메시지 전송
 * @param title 제목
 * @param body 내용
 * @param hour 시간 (0-23)
 * @param minute 분 (0-59)
 */
const TriggerDailyNotification = async (
    title: string,
    body: string,
    hour: number,
    minute: number,
) => {
    try {
        const channelId = await notifee.createChannel({
            id: 'daily-notification',
            name: 'Daily Notifications',
            importance: AndroidImportance.HIGH,
        });

        // 같은 ID 로 재예약해야 중복 예약이 쌓이지 않는다.
        await notifee.cancelNotification(DAILY_NOTIFICATION_ID);

        await notifee.createTriggerNotification(
            {
                id: DAILY_NOTIFICATION_ID,
                title,
                body,
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    pressAction: {
                        id: 'default',
                    },
                    smallIcon: 'ic_launcher',
                    visibility: AndroidVisibility.PUBLIC,
                },
                ios: {
                    sound: 'default',
                    critical: true,
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: getNextTriggerTimestamp(hour, minute),
                repeatFrequency: RepeatFrequency.DAILY,
            }
        );
    } catch (error) {
        console.error('Failed to schedule daily notification:', error);
    }
}

/**
 * 주간 반복 푸시 메시지 전송
 * @param title 제목
 * @param body 내용
 * @param hour 시간 (0-23)
 * @param minute 분 (0-59)
 * @param dayOfWeek 요일 (0-6, 일요일부터 시작)
 */
const TriggerWeeklyNotification = async (
    title: string,
    body: string,
    hour: number,
    minute: number,
    dayOfWeek: number,
) => {
    try {
        const channelId = await notifee.createChannel({
            id: 'weekly-notification',
            name: 'Weekly Notifications',
            importance: AndroidImportance.HIGH,
        });

        // 같은 ID 로 재예약해야 중복 예약이 쌓이지 않는다.
        await notifee.cancelNotification(WEEKLY_NOTIFICATION_ID);

        await notifee.createTriggerNotification(
            {
                id: WEEKLY_NOTIFICATION_ID,
                title,
                body,
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    pressAction: {
                        id: 'default',
                    },
                    smallIcon: 'ic_launcher',
                    visibility: AndroidVisibility.PUBLIC,
                },
                ios: {
                    sound: 'default',
                    critical: true,
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: getNextTriggerTimestamp(hour, minute, dayOfWeek),
                repeatFrequency: RepeatFrequency.WEEKLY,
            }
        );
    } catch (error) {
        console.error('Failed to schedule weekly notification:', error);
    }
}

export {
    getNextTriggerTimestamp,
    RequestNotificationPermission,
    DirectNotification,
    TriggerDailyNotification,
    TriggerWeeklyNotification
}