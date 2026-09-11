import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SCROLL_TOP_THRESHOLD } from '@/screens/common/atomic/ScrollTopButton';

/**
 * 긴 목록에서 "맨 위로" 플로팅 버튼을 붙이기 위한 공통 훅.
 *
 * 화면마다 ① 표시 여부 state ② onScroll 에서 임계값 비교 ③ 스크롤 최상단 이동을
 * 똑같이 복붙하고 있었는데, ③ 의 호출 방법이 컨테이너마다 달라서(아래 참고) 화면별로
 * 제각각 구현돼 있었다. 분기를 여기 한 곳에 두고 호출부는 `scrollToTop()` 만 쓴다.
 *
 * ```tsx
 * const { scrollRef, onScroll, showScrollTop, scrollToTop } = useScrollTop<FlatList>();
 * <FlatList ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} ... />
 * <ScrollTopButton visible={showScrollTop} onPress={scrollToTop} />
 * ```
 */
export const useScrollTop = <T,>() => {
	const scrollRef = useRef<T>(null);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		setShowScrollTop(event.nativeEvent.contentOffset.y > SCROLL_TOP_THRESHOLD);
	}, []);

	/**
	 * 컨테이너 종류별로 최상단 이동 방법이 다르다.
	 *  - FlatList(VirtualizedList) : scrollToOffset
	 *  - ScrollView               : scrollTo
	 *  - SectionList              : 위 둘이 없고 getScrollResponder() 로 내부 ScrollView 를 꺼내야 한다
	 */
	const scrollToTop = useCallback((animated: boolean = true) => {
		const node = scrollRef.current as any;
		if (!node) {
			return;
		}
		if (typeof node.scrollToOffset === 'function') {
			node.scrollToOffset({ offset: 0, animated });
		} else if (typeof node.scrollTo === 'function') {
			node.scrollTo({ x: 0, y: 0, animated });
		} else {
			node.getScrollResponder?.()?.scrollTo({ x: 0, y: 0, animated });
		}
	}, []);

	return { scrollRef, showScrollTop, setShowScrollTop, onScroll, scrollToTop };
};

export default useScrollTop;
