/**
 * 빈칸 모드 출제 대상 회귀 테스트
 *
 * 빈칸 모드는 정답 어절을 전부 가린다(같은 어절이 두 번 나오는 속담에서 정답이 노출되던 버그 수정).
 * 그래서 "서로 다른 어절이 1개뿐"인 속담은 문제가 통째로 '(____)' 가 되어 풀 수 없다.
 * 이 판정을 랜덤 출제 / 오답 복습 / 진행률이 모두 공유해야 분모와 실제 출제 문항 수가 어긋나지 않는다.
 */
import { isQuizzable } from '../src/screens/QuizScreen';
import ProverbServices from '../src/services/ProverbServices';
import { MainDataType } from '../src/types/MainDataType';

const asProverb = (proverb: string) => ({ proverb }) as MainDataType.Proverb;

test('빈칸 모드는 서로 다른 어절이 2개 미만인 속담을 뺀다', () => {
	expect(isQuizzable(asProverb('화무십일홍이라'), 'blank')).toBe(false);
	expect(isQuizzable(asProverb('가는 가는'), 'blank')).toBe(false);
	expect(isQuizzable(asProverb('가는 말이 고와야 오는 말이 곱다'), 'blank')).toBe(true);
});

test('다른 모드는 전부 출제한다', () => {
	expect(isQuizzable(asProverb('화무십일홍이라'), 'meaning')).toBe(true);
	expect(isQuizzable(asProverb('화무십일홍이라'), 'proverb')).toBe(true);
});

test('통과한 속담은 어떤 어절을 가려도 보이는 어절이 남는다', () => {
	const blankPool = ProverbServices.selectProverbList().filter((p) => isQuizzable(p, 'blank'));
	expect(blankPool.length).toBeGreaterThan(0);

	const broken = blankPool.filter((p) => {
		const words = p.proverb.split(' ').filter(Boolean);
		// 가릴 후보는 2글자 이상 어절(pickBlankWord 기준), 없으면 가장 긴 어절
		const candidates = words.filter((w) => w.length > 1);
		const pickable = candidates.length > 0 ? candidates : words;
		return pickable.some((blank) => words.every((w) => w === blank));
	});
	expect(broken).toEqual([]);
});
