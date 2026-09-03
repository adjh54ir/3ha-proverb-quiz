import fs from 'fs';
import path from 'path';

/**
 * 퀴즈 문제 로드 가드 회귀 테스트.
 *
 * 답을 고르면 handleSelect 가 600ms 뒤에 `setShowResultModal(true)` 와 `setIsAnswerLocked(false)`
 * 를 같은 배치에서 호출한다. 문제 로드 effect 의 deps 에 `isAnswerLocked` 가 들어 있으면 바로
 * 그 순간 effect 가 다시 돌아, 해설 모달이 열려 있는데도 뒤에서 새 문제를 로드했다.
 *   - 모달에 보이는 정답/해설/즐겨찾기가 다음 문제 것으로 바뀐다
 *   - setupQuestion 이 40초 타이머를 모달 뒤에서 다시 돌려 자동 오답(handleSelect(''))까지 된다
 *   - 마지막 문제면 완료 팝업이 해설 모달과 같은 틱에 떠서 이전 모달이 깜빡인다
 *
 * 화면 전체를 렌더하는 하네스가 없어 소스를 훑어 확인한다(navigationLayout.test.ts 와 같은 방식).
 * deps 배열은 한 줄이라 정규식으로 충분하고, 되살아나는 경로가 정확히 그 한 줄이다.
 */
const source = fs.readFileSync(path.join(__dirname, '..', 'src/screens/QuizScreen.tsx'), 'utf8');

/** 문제 로드 effect 의 deps 배열 (`}, [ ... ]);` 중 quizHistory 로 시작하는 것) */
const loadEffectDeps = /\}, \[quizHistory[^\]]*\]\);/.exec(source)?.[0] ?? '';

test('문제 로드 effect 를 찾았다', () => {
	expect(loadEffectDeps).not.toBe('');
});

test('isAnswerLocked 는 deps 가 아니라 가드로만 쓴다', () => {
	// deps 에 있으면 해설 모달이 뜨는 순간 effect 가 다시 돌아 새 문제를 로드한다.
	expect(loadEffectDeps).not.toContain('isAnswerLocked');
	// 그래도 가드로는 남아 있어야 한다.
	expect(source).toContain('if (isAnswerLocked) return;');
});

test('모달이 열려 있으면 문제를 로드하지 않는다', () => {
	expect(source).toContain('if (isAnyModalOpen) return;');
	// 시작 모달 하나만 보던 예전 조건으로 되돌아가면 나머지 팝업 뒤에서 다시 로드된다.
	expect(source).toMatch(/const isAnyModalOpen =[\s\S]{0,240}?showResultModal/);
	expect(source).toMatch(/const isAnyModalOpen =[\s\S]{0,240}?showCompletionModal/);
});

test('이미 문제가 올라와 있으면 새로 뽑지 않는다', () => {
	// 두 번째 문제부터는 '다음' 버튼 흐름(handleNextQuestion)만 로드해야 한다.
	expect(source).toContain('if (question) return;');
});

test('모달이 떠 있는 동안에는 남은 시간을 깎지 않는다', () => {
	// 인터벌 콜백은 만들어진 시점의 클로저라 state 를 못 본다 → ref 로 읽어야 한다.
	expect(source).toContain('isAnyModalOpenRef.current = isAnyModalOpen;');
	// setupQuestion / startTimer 두 인터벌 모두 가드가 있어야 한다.
	expect(source.match(/if \(isAnyModalOpenRef\.current\) \{/g) ?? []).toHaveLength(2);
});
