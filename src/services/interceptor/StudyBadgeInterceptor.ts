import { MainDataType } from '@/types/MainDataType';
import ProverbServices from '../ProverbServices';

/**
 * 학습 기반 뱃지 인터셉터
 */
export const StudyBadgeInterceptor = (study: MainDataType.UserStudyHistory): string[] => {
	const newBadges: string[] = [];

	const count = study.studyProverbes.length;
	const existing = new Set(study.badges ?? []);
	const total = ProverbServices.selectProverbList().length;

	// 누적 학습 수 마일스톤 (데이터 증가에 맞춰 3,000까지 확장)
	const studyThresholds = [1, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 2500, 3000];
	studyThresholds.forEach((n) => {
		const id = `study_${n}`;
		if (!existing.has(id) && count >= n) newBadges.push(id);
	});

	// ✅ 전체 속담 학습 완료 시 부여
	if (!existing.has('study_all') && total > 0 && count >= total) {
		newBadges.push('study_all');
	}

	return newBadges;
};
