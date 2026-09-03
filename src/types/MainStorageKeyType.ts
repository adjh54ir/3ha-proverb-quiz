export enum MainStorageKeyType {
	TODAY_QUIZ_LIST = 'TodayQuizList',
	USER_STUDY_HISTORY = 'UserStudyHistory', // 학습
	TIME_CHALLENGE_HISTORY = 'TimeChallengeHistory', // 챌린지
	USER_QUIZ_HISTORY = 'UserQuizHistory', // 퀴즈
	SETTING_INFO = 'SettingInfo',
	TOWER_CHALLENGE_PROGRESS = 'TOWER_CHALLENGE_PROGRESS',
	FAVORITES_STORAGE_KEY= 'FAVORITES_STORAGE_KEY',
	USER_PROVERB_BOOKS = 'USER_PROVERB_BOOKS', // 나만의 속담집
	USER_PROVERB_PRACTICE_RECORDS = 'USER_PROVERB_PRACTICE_RECORDS', // 속담집 연습 기록
	DAILY_MISSION_CLAIMED = 'DAILY_MISSION_CLAIMED', // 일일 미션 보상 수령 날짜 목록
	LAST_SEEN_GRADE = 'LAST_SEEN_GRADE', // 마지막으로 확인한 점수 등급(레벨업 감지용)
	SOUND_ENABLED = 'SOUND_ENABLED', // 효과음(SFX) on/off
	SOUND_VOLUME = 'SOUND_VOLUME', // 효과음 볼륨 (0~1)
	BGM_ENABLED = 'BGM_ENABLED', // 배경음악(BGM) on/off
	BGM_VOLUME = 'BGM_VOLUME', // 배경음악 볼륨 (0~1)
	THEME_MODE = 'THEME_MODE', // 화이트/다크 모드 ('light' | 'dark', 시스템 설정 미반영)
	TEXT_SIZE_MODE = 'TEXT_SIZE_MODE', // 글자 크기 모드 ('default' | 'large')
	PENDING_NOTIFICATION_ROUTE = 'PENDING_NOTIFICATION_ROUTE', // 백그라운드에서 누른 알림의 이동 대상 화면
	AD_CLICK_GUARD = 'AD_CLICK_GUARD', // 하루 광고 클릭 수 (무효 트래픽 방지 가드)
}
