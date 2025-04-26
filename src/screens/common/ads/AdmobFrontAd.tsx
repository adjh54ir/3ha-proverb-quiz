import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import {
  RewardedInterstitialAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

import {
  GOOGLE_ADMOV_IOS_REWARD_FRONT,
  GOOGLE_ADMOV_ANDROID_REWARD_FRONT,
} from "@env";

type AdUnitIdType = string;

const AD_UNIT_ID: AdUnitIdType = Platform.select({
  ios: __DEV__ ? TestIds.REWARDED_INTERSTITIAL : GOOGLE_ADMOV_IOS_REWARD_FRONT!,
  android: __DEV__
    ? TestIds.REWARDED_INTERSTITIAL
    : GOOGLE_ADMOV_ANDROID_REWARD_FRONT!,
}) as AdUnitIdType;

const rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(
  AD_UNIT_ID,
  {
    keywords: ["fashion", "clothing"],
  }
);

/**
 * [공통] 보상형 전면 광고
 * @returns
 */
const AdmobRewardFrontAd: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = rewardedInterstitial.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
      }
    );
    const unsubscribeEarned = rewardedInterstitial.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log("User earned reward of ", reward);
      }
    );

    // Start loading the rewarded interstitial ad straight away
    rewardedInterstitial.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  // No advert ready to show yet
  if (!loaded) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => rewardedInterstitial.show()}
    >
      <Text style={styles.buttonText}>보상형 광고 보기</Text>
    </TouchableOpacity>
  );
};

export default AdmobRewardFrontAd;

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
