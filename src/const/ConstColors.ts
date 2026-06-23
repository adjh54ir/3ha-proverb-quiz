/**
 * 앱 통합 컬러 시스템 (연한 그린 메인 + 연한 블루 서브 + 앰버 포인트)
 * -------------------------------------------------
 * 부드러운 그린을 주조색으로 두고, 블루는 한 톤 연한 보조 강조로,
 * 앰버/오렌지는 소량의 포인트 컬러로 사용해 가볍고 모던한 조화를 구성합니다.
 * 모든 화면/컴포넌트는 이 토큰을 사용합니다.
 * 새로운 색상이 필요하면 임의 hex 대신 여기에 토큰을 추가하세요.
 */
export const Colors = {
	/** 브랜드 (Primary - Soft Green) — 메인 액션/활성/정답 강조 */
	primary: '#22C55E', // 메인 액션, 활성 상태, 강조 (연한 그린)
	primaryDark: '#16A34A', // pressed, 강조 텍스트
	primaryDeep: '#15803D', // 진한 강조, 다크 배경 위 요소
	primaryLight: '#86EFAC', // 보조 강조, 아이콘
	primarySoft: '#DCFCE7', // 배지/칩 배경
	primaryBg: '#F0FDF4', // 섹션/카드 틴트 배경

	/** 보조 (Secondary - Light Blue) — 서브 강조/링크/정보 */
	secondary: '#60A5FA', // 보조 액션, 링크 (연한 블루)
	secondaryDark: '#3B82F6',
	secondaryLight: '#93C5FD',
	secondarySoft: '#DBEAFE',
	secondaryBg: '#EFF6FF',

	/** 포인트 (Accent - Amber) — 타이머/별점/하이라이트 등 소량 포인트 */
	accentAmber: '#F59E0B',
	accentAmberSoft: '#FEF3C7',
	accentOrange: '#F97316', // 연속 도전 등 에너지 표현

	/** 텍스트 (Slate) */
	text: '#334155', // 기본 본문/제목
	textStrong: '#1E293B', // 강한 제목
	textSecondary: '#64748B', // 보조 설명
	textMuted: '#94A3B8', // 비활성, placeholder
	textInverse: '#FFFFFF', // 컬러 배경 위 텍스트

	/** 배경/보더 */
	background: '#F8FAFC', // 화면 기본 배경
	surface: '#FFFFFF', // 카드, 모달
	surfaceAlt: '#F1F5F9', // 구분 영역
	border: '#E2E8F0', // 기본 보더
	borderStrong: '#CBD5E1', // 진한 보더, 비활성 버튼

	/** 시맨틱 */
	success: '#22C55E', // 정답/완료
	successSoft: '#DCFCE7',
	error: '#EF4444',
	errorDark: '#DC2626',
	errorSoft: '#FEE2E2',
	warning: '#F59E0B', // 별점, 하이라이트
	warningSoft: '#FEF3C7',

	/** 다크 모드 */
	darkBackground: '#0F172A',
	darkSurface: '#1E293B',
	darkBorder: '#334155',
	darkText: '#F1F5F9',
	darkTextSecondary: '#94A3B8',
} as const;

export type ColorToken = keyof typeof Colors;

export default Colors;
