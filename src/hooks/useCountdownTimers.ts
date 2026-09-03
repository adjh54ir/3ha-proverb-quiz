import { useCallback, useRef } from 'react';

/**
 * 타임 챌린지 카운트다운 타이머(3·2·1 인터벌 + 시작 지연 타임아웃) refs 와 정리 함수.
 *
 * InitTimeChallengeScreen / TimeChanllengeScreen 이 같은 정리 코드를 각각 세 벌씩
 * (언마운트 / 재시작 / 취소) 들고 있었다. 정리 지점이 흩어져 있으면 카운트다운에 타이머를
 * 하나 더 붙일 때 한 곳만 고쳐지고 나머지에서 샌다.
 */
export const useCountdownTimers = () => {
	const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearCountdownTimers = useCallback(() => {
		if (countdownTimerRef.current) {
			clearInterval(countdownTimerRef.current);
			countdownTimerRef.current = null;
		}
		if (countdownTimeoutRef.current) {
			clearTimeout(countdownTimeoutRef.current);
			countdownTimeoutRef.current = null;
		}
	}, []);

	return { countdownTimerRef, countdownTimeoutRef, clearCountdownTimers };
};

export default useCountdownTimers;
