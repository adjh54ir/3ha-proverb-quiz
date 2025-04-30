import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useCallback } from 'react';

/**
 * 뒤로가기(BackHandler)를 차단하는 커스텀 훅
 * @param condition - true일 때만 뒤로가기를 막음
 */
export const useBlockBackHandler = (condition: boolean = true) => {
    useFocusEffect(
        useCallback(() => {
            if (!condition) return;

            const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);

            return () => {
                subscription.remove(); // ✅ 이렇게 remove() 호출
            };
        }, [condition])
    );
};