import { useEffect, useState } from 'react';
import { Button, StyleSheet, TouchableOpacity } from 'react-native';
import { RewardedAd, TestIds, RewardedAdEventType } from 'react-native-google-mobile-ads';

// 리워드 광고 인스턴스 생성
const rewardedAd = RewardedAd.createForAdRequest(TestIds.REWARDED, {
  requestNonPersonalizedAdsOnly: true,
  keywords: ['fashion', 'clothing'],
});

const AdmobRewardAd = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 광고 로드 이벤트 리스너
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });

    // 리워드 획득 이벤트 리스너
    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('User earned reward of ', reward);
        // 리워드 지급 로직 구현
      },
    );

    // 광고 로드 시작
    rewardedAd.load();

    // 컴포넌트 언마운트시 이벤트 리스너 제거
    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  // 광고 보여주기 함수
  const showAd = () => {
    if (loaded) {
      rewardedAd.show();
    } else {
      console.log('Ad not loaded yet');
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={showAd}
      disabled={!loaded}
    />
  );
};
export default AdmobRewardAd;

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1a73e8",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
