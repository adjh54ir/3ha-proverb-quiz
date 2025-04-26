import notifee, { AndroidImportance, AndroidVisibility, AuthorizationStatus, RepeatFrequency, TriggerType } from "@notifee/react-native";

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

        const now = new Date();
        const targetDate = new Date();
        targetDate.setHours(hour, minute, 0, 0);

        if (targetDate < now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        await notifee.createTriggerNotification(
            {
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
                timestamp: targetDate.getTime(),
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

        const now = new Date();
        const targetDate = new Date();
        targetDate.setHours(hour, minute, 0, 0);

        if (targetDate < now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const currentDay = targetDate.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
        targetDate.setDate(targetDate.getDate() + daysUntilTarget);

        await notifee.createTriggerNotification(
            {
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
                timestamp: targetDate.getTime(),
                repeatFrequency: RepeatFrequency.WEEKLY,
            }
        );
    } catch (error) {
        console.error('Failed to schedule weekly notification:', error);
    }
}

export {
    RequestNotificationPermission,
    DirectNotification,
    TriggerDailyNotification,
    TriggerWeeklyNotification
}