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

	if (!existing.has('study_1') && count >= 1) newBadges.push('study_1');
	if (!existing.has('study_10') && count >= 10) newBadges.push('study_10');
	if (!existing.has('study_50') && count >= 50) newBadges.push('study_50');
	if (!existing.has('study_100') && count >= 100) newBadges.push('study_100');
	if (!existing.has('study_200') && count >= 200) newBadges.push('study_200');
	if (!existing.has('study_300') && count >= 200) newBadges.push('study_300');
	if (!existing.has('study_400') && count >= 200) newBadges.push('study_400');

	// ✅ 전체 속담 학습 완료 시 부여
	if (!existing.has('study_all') && count >= total) {
		newBadges.push('study_all');
	}

	return newBadges;
};
