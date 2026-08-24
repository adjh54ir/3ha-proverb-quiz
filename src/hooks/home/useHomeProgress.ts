import { useCallback, useState } from 'react';
import { MainStorageKeyType } from '@/types/MainStorageKeyType';
import { TowerProgress } from '@/const/ConstTowerData';
import { getLevelByScore } from '@/const/ConstInfoData';
import { LevelUpInfo } from '@/screens/modal/LevelUpModal';
import QuizHistoryService from '@/services/QuizHistoryService';
import { read, write } from '@/services/StorageService';

/** 홈이 그리는 진행도 묶음 */
export interface HomeProgress {
	totalScore: number;
	badgeIds: string[];
	unlockedRewards: number[];
}

const EMPTY: HomeProgress = { totalScore: 0, badgeIds: [], unlockedRewards: [] };

/**
 * 홈 상단(점수·등급·뱃지·타워 보상)에 필요한 값을 읽어 온다.
 *
 * 로드 상태를 함께 돌려주므로, 화면은 "0점"과 "아직 못 읽음"을 구분해 그릴 수 있다.
 * (예전에는 읽기에 실패해도 조용히 0점으로 보여서 사용자가 기록이 날아간 줄 알았다)
 */
export const useHomeProgress = () => {
	const [progress, setProgress] = useState<HomeProgress>(EMPTY);
	const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
	/** 등급이 올라갔을 때 채워지는 축하 모달 데이터 */
	const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null);

	/** 마지막으로 확인한 등급과 비교해 상승했으면 축하 데이터를 만든다. */
	const detectLevelUp = useCallback(async (score: number) => {
		const current = getLevelByScore(score);
		const stored = await read<number | null>(MainStorageKeyType.LAST_SEEN_GRADE, null);

		if (stored != null && current.score > stored) {
			setLevelUp({
				label: current.label,
				mascot: current.mascot,
				encouragement: current.encouragement,
				description: current.description,
				score: current.score,
			});
		}
		if (stored == null || current.score !== stored) {
			await write(MainStorageKeyType.LAST_SEEN_GRADE, current.score);
		}
	}, []);

	const refresh = useCallback(async () => {
		setStatus('loading');
		try {
			const [quiz, studyBadges, tower] = await Promise.all([
				QuizHistoryService.getQuizHistoryOrEmpty(),
				read<{ badges?: string[] }>(MainStorageKeyType.USER_STUDY_HISTORY, {}).then((v) => v.badges ?? []),
				read<TowerProgress | null>(MainStorageKeyType.TOWER_CHALLENGE_PROGRESS, null),
			]);

			setProgress({
				totalScore: quiz.totalScore ?? 0,
				badgeIds: [...new Set([...(quiz.badges ?? []), ...studyBadges, ...(tower?.badges ?? [])])],
				unlockedRewards: tower?.unlockedRewards ?? [],
			});
			await detectLevelUp(quiz.totalScore ?? 0);
			setStatus('ready');
		} catch (error) {
			console.warn('홈 진행도 로드 실패', error);
			setStatus('error');
		}
	}, [detectLevelUp]);

	/** 보너스 점수를 화면에 즉시 반영한다(스토리지 정합성은 다음 refresh 가 맞춘다). */
	const addScoreLocally = useCallback((delta: number) => {
		setProgress((prev) => ({ ...prev, totalScore: prev.totalScore + delta }));
	}, []);

	return { progress, status, levelUp, clearLevelUp: () => setLevelUp(null), refresh, addScoreLocally };
};
