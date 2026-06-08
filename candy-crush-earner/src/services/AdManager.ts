import mobileAds, { InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../constants/Config';

class AdManager {
  private interstitial: InterstitialAd | null = null;
  private rewarded: RewardedAd | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) {return;}

    try {
      // 1. Initialize the SDK
      const adapterStatuses = await mobileAds().initialize();
      console.log('AdMob Initialized:', adapterStatuses);

      // 2. Create Ad Instances
      // Use TestIds.REWARDED and TestIds.INTERSTITIAL for development if live ads don't load
      const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : AD_UNIT_IDS.INTERSTITIAL;
      const rewardedId = __DEV__ ? TestIds.REWARDED : AD_UNIT_IDS.REWARDED;

      this.interstitial = InterstitialAd.createForAdRequest(interstitialId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.rewarded = RewardedAd.createForAdRequest(rewardedId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.setupListeners();
      
      // 3. Load initial ads
      this.loadInterstitial();
      this.loadRewarded();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('AdMob initialization failed:', error);
    }
  }

  private setupListeners() {
    // Interstitial Listeners
    this.interstitial?.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial Ad Loaded');
    });
    this.interstitial?.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('Interstitial Ad Error:', error);
    });
    this.interstitial?.addAdEventListener(AdEventType.CLOSED, () => {
      this.loadInterstitial();
    });

    // Rewarded Listeners
    this.rewarded?.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded Ad Loaded');
    });
    this.rewarded?.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      console.warn('Rewarded Ad Error:', error);
    });
    this.rewarded?.addAdEventListener(AdEventType.CLOSED, () => {
      this.loadRewarded();
    });
  }

  loadInterstitial() {
    try {
      this.interstitial?.load();
    } catch (e) {
      console.warn('Interstitial load failed', e);
    }
  }

  loadRewarded() {
    try {
      this.rewarded?.load();
    } catch (e) {
      console.warn('Rewarded load failed', e);
    }
  }

  showInterstitial() {
    if (this.interstitial?.loaded) {
      this.interstitial.show();
    } else {
      console.log('Interstitial not loaded, attempting reload');
      this.loadInterstitial();
    }
  }

  showRewarded(onReward: () => void, onError?: () => void) {
    if (this.rewarded?.loaded) {
      const unsubscribe = this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('User earned reward of ', reward);
        onReward();
        unsubscribe();
      });
      this.rewarded.show().catch(err => {
        console.error('Show rewarded failed', err);
        onError?.();
      });
    } else {
      console.log('Rewarded ad not loaded yet, triggering load');
      this.loadRewarded();
      // Inform user or show a toast
      onError?.();
    }
  }
}

export default new AdManager();
