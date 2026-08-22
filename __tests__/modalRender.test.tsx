import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BookFormModal from '@/screens/modal/BookFormModal';
import ProverbDetailModal from '@/screens/modal/ProverbDetailModal';
import QuizHintModal from '@/screens/modal/QuizHintModal';
import CmmDelConfirmModal from '@/screens/common/modal/CmmDelConfirmModal';
import { MainDataType } from '@/types/MainDataType';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';

/**
 * 팝업 렌더 스모크 테스트.
 *
 * 모달들이 공통 등장 애니메이션 훅으로 옮겨 가면서, 화면 고유의 useEffect
 * (폼 초기화 / 즐겨찾기 상태 로드 등)까지 함께 지워져도 타입 검사로는 잡히지 않았다.
 * "열면 실제로 그 내용이 보이는지" 를 여기서 붙잡는다.
 */

/** 렌더 트리 전체에서 화면에 보이는 문자열을 모은다. */
const textsOf = (tree: ReactTestRenderer): string[] =>
	tree.root.findAllByType(Text).flatMap((node) => {
		const collect = (child: unknown): string[] => {
			if (typeof child === 'string') {
				return [child];
			}
			if (Array.isArray(child)) {
				return child.flatMap(collect);
			}
			return [];
		};
		return collect(node.props.children);
	});

const renderModal = async (element: React.ReactElement): Promise<ReactTestRenderer> => {
	let tree!: ReactTestRenderer;
	await act(async () => {
		tree = create(element);
	});
	await act(async () => {
		await Promise.resolve();
	});
	return tree;
};

const PROVERB: MainDataType.Proverb = {
	id: 1,
	proverb: '가는 말이 고와야 오는 말이 곱다',
	meaning: '내가 잘해야 남도 잘해 준다',
	longMeaning: '남에게 말을 좋게 해야 남도 좋게 한다는 뜻',
	category: '인간관계',
	level: 1,
	levelName: '초급',
	sameProverb: ['말 한마디에 천 냥 빚도 갚는다'],
	example: ['친구에게 먼저 웃어 주니 친구도 웃어 주었다.'],
	usageTip: '상대에게 말을 조심히 할 때 씁니다.',
} as MainDataType.Proverb;

beforeEach(async () => {
	await AsyncStorage.clear();
	jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('BookFormModal', () => {
	it('편집 모드로 열면 기존 속담집 값이 입력창에 채워진다', async () => {
		const editTarget = {
			id: 'book-1',
			title: '내가 좋아하는 속담',
			description: '자주 보는 것들',
			color: '#22C55E',
			icon: 'menu-book',
			proverbIds: [1],
			createdAt: '2026-01-01',
		} as unknown as MainDataType.ProverbBook;

		const tree = await renderModal(
			<BookFormModal visible editTarget={editTarget} onClose={jest.fn()} onSubmit={jest.fn()} />,
		);

		// 폼 초기화 effect 가 없으면 미리보기에 '속담집 이름' 플레이스홀더가 남는다
		expect(textsOf(tree)).toContain('내가 좋아하는 속담');
		expect(textsOf(tree)).toContain('속담집 편집');
	});

	it('새로 만들기로 열면 빈 폼과 안내 문구가 보인다', async () => {
		const tree = await renderModal(<BookFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} />);
		expect(textsOf(tree)).toContain('새 속담집 만들기');
	});
});

describe('ProverbDetailModal', () => {
	/** 즐겨찾기 별 아이콘이 채워져 있는지 (state 가 UI 에 반영됐는지) */
	const starIsFilled = (tree: ReactTestRenderer): boolean =>
		tree.root.findAll((n) => n.props?.name === 'star' && n.props?.solid !== undefined)[0].props.solid === true;

	it('속담 내용이 보이고, 저장된 즐겨찾기 상태를 읽어 별을 채운다', async () => {
		// 즐겨찾기는 { id, addedAt } 형태로 저장된다
		await AsyncStorage.setItem(
			MainStorageKeyType.FAVORITES_STORAGE_KEY,
			JSON.stringify([{ id: PROVERB.id, addedAt: 1 }]),
		);

		const tree = await renderModal(<ProverbDetailModal visible proverb={PROVERB} onClose={jest.fn()} />);

		expect(textsOf(tree)).toContain(PROVERB.proverb);
		// 즐겨찾기 로드 effect 가 없으면 항상 빈 별로 남는다
		expect(starIsFilled(tree)).toBe(true);
	});

	it('즐겨찾기가 아니면 빈 별로 보인다', async () => {
		const tree = await renderModal(<ProverbDetailModal visible proverb={PROVERB} onClose={jest.fn()} />);
		expect(starIsFilled(tree)).toBe(false);
	});
});

describe('QuizHintModal', () => {
	it('문제의 동의 속담과 예문을 힌트로 보여준다', async () => {
		const tree = await renderModal(<QuizHintModal visible question={PROVERB} mode="meaning" onClose={jest.fn()} />);

		const texts = textsOf(tree);
		expect(texts).toContain('힌트');
		expect(texts).toContain(PROVERB.sameProverb[0]);
		expect(texts).toContain(PROVERB.usageTip);
	});
});

describe('CmmDelConfirmModal', () => {
	it('삭제를 누르면 onConfirm 이, 취소를 누르면 onCancel 이 호출된다', async () => {
		const onConfirm = jest.fn();
		const onCancel = jest.fn();
		const tree = await renderModal(
			<CmmDelConfirmModal visible summary="정말 삭제하시겠습니까?" onConfirm={onConfirm} onCancel={onCancel} />,
		);

		expect(textsOf(tree)).toContain('정말 삭제하시겠습니까?');

		// 버튼 안의 라벨로 눌러야 할 버튼을 찾는다
		const press = (label: string) => {
			const button = tree.root
				.findAll((node) => typeof node.type !== 'string' && node.props?.onPress !== undefined)
				.find((node) => node.findAllByType(Text).some((t) => t.props.children === label));
			expect(button).toBeDefined();
			act(() => button!.props.onPress());
		};

		press('삭제');
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onCancel).not.toHaveBeenCalled();

		press('취소');
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
