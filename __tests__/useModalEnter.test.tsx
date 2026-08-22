import React from 'react';
import { Animated, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useModalEnter, useModalEnterExit, MODAL_ENTER_DURATION } from '@/hooks/useModalEnter';

/** Animated.Value 의 현재 값을 읽는다(테스트 전용 내부 필드). */
const valueOf = (animated: any): number => (animated as any).__getValue();

const Probe = ({ visible }: { visible: boolean }) => {
	const style = useModalEnter(visible);
	probeStyle = style;
	return <Animated.View style={style}><Text>card</Text></Animated.View>;
};

let probeStyle: ReturnType<typeof useModalEnter>;

describe('useModalEnter', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
	});
	afterEach(() => jest.useRealTimers());

	it('닫힌 상태에서는 투명하고 살짝 작다 (첫 프레임 잔상 방지)', () => {
		act(() => {
			create(<Probe visible={false} />);
		});
		expect(valueOf(probeStyle.opacity)).toBe(0);
		expect(valueOf(probeStyle.transform[0].scale)).toBe(0.95);
	});

	// useNativeDriver 로 돌아가는 값은 JS 쪽 __getValue() 가 갱신되지 않으므로,
	// "열릴 때 정해진 시간·목표값으로 애니메이션이 걸리는지" 를 대신 확인한다.
	it('열리면 두 값 모두 공통 등장 시간으로 목표값까지 애니메이션된다', () => {
		const timing = jest.spyOn(Animated, 'timing');
		act(() => {
			create(<Probe visible={true} />);
		});

		const configs = timing.mock.calls.map(([, config]) => config as any);
		expect(configs).toHaveLength(2);
		configs.forEach((config) => {
			expect(config.toValue).toBe(1);
			expect(config.duration).toBe(MODAL_ENTER_DURATION);
			expect(config.useNativeDriver).toBe(true);
		});
		timing.mockRestore();
	});

	it('다시 닫으면 값이 되돌아가 다음에 열 때 처음부터 재생된다', () => {
		let tree: ReturnType<typeof create>;
		act(() => {
			tree = create(<Probe visible={true} />);
		});
		act(() => {
			jest.advanceTimersByTime(MODAL_ENTER_DURATION + 50);
		});
		act(() => {
			tree!.update(<Probe visible={false} />);
		});
		expect(valueOf(probeStyle.opacity)).toBe(0);
		expect(valueOf(probeStyle.transform[0].scale)).toBe(0.95);
	});
});

describe('useModalEnterExit', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('runExit 은 카드를 되감은 뒤에 콜백을 부른다', () => {
		const onDone = jest.fn();
		let exit: (cb: () => void) => void;

		const ExitProbe = ({ visible }: { visible: boolean }) => {
			const { style, runExit } = useModalEnterExit(visible);
			exit = runExit;
			return <Animated.View style={style}><Text>card</Text></Animated.View>;
		};

		act(() => {
			create(<ExitProbe visible={true} />);
		});
		act(() => {
			jest.advanceTimersByTime(MODAL_ENTER_DURATION + 50);
		});

		act(() => {
			exit!(onDone);
		});
		// 되감기가 끝나기 전에는 아직 부모에게 알리지 않는다
		expect(onDone).not.toHaveBeenCalled();

		act(() => {
			jest.advanceTimersByTime(500);
		});
		expect(onDone).toHaveBeenCalledTimes(1);
	});
});
