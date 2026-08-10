import React from 'react';
import FavoriteToast from './common/FavoriteToast';

interface Props {
	visible: boolean;
	message?: string;
	subMessage?: string;
	onHide: () => void;
}

/**
 * 성공 토스트.
 * ponytail: FavoriteToast 와 애니메이션/스타일이 완전히 동일했다. 중복 구현 대신 위임한다.
 * (QuizResultModal 이 FavoriteToast 로 갈아타면 이 파일은 지워도 된다.)
 */
const SuccessToast = ({ visible, message = '즐겨찾기 추가', subMessage = '속담 사전에서 확인 할 수 있습니다.', onHide }: Props) => (
	<FavoriteToast visible={visible} message={message} subMessage={subMessage} onHide={onHide} />
);

export default SuccessToast;
