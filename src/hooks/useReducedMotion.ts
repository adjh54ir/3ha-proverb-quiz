import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** OS의 '애니메이션 줄이기' 설정을 실시간으로 반영한다. */
export const useReducedMotion = (): boolean => {
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		let mounted = true;
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			if (mounted) {
				setReducedMotion(enabled);
			}
		});
		const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
		return () => {
			mounted = false;
			subscription.remove();
		};
	}, []);

	return reducedMotion;
};

export default useReducedMotion;
