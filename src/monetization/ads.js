// Thin wrapper around react-native-google-mobile-ads.
//
// The native ads module is not part of Expo Go, so it is loaded lazily inside
// try/catch. In Expo Go every function here is a safe no-op (and rewarded ads
// are simulated in development so the unlock flow can still be tested).
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AD_UNITS } from './config';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let lib = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    lib = require('react-native-google-mobile-ads');
  } catch {
    lib = null; // native module missing: ads unavailable
  }
}

export const adsSupported = !!lib;

let initialized = false;
let interstitial = null;
let interstitialLoaded = false;
let rewarded = null;
let rewardedLoaded = false;
let privacyOptionsRequired = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

/** Subscribe to ad readiness changes (e.g. rewarded ad finished loading). */
export function subscribeAds(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function loadInterstitial() {
  if (!lib || !initialized) return;
  const { InterstitialAd, AdEventType } = lib;
  interstitial?.removeAllListeners();
  interstitialLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial);
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    setTimeout(loadInterstitial, 60_000); // retry later; no-fill is normal
  });
  interstitial.load();
}

function loadRewarded() {
  if (!lib || !initialized) return;
  const { RewardedAd, RewardedAdEventType, AdEventType } = lib;
  rewarded?.removeAllListeners();
  rewardedLoaded = false;
  notify();
  rewarded = RewardedAd.createForAdRequest(AD_UNITS.rewarded);
  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
    notify();
  });
  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
    notify();
    setTimeout(loadRewarded, 60_000);
  });
  rewarded.load();
}

/**
 * Gathers GDPR/UMP consent (shows Google's consent form only where required),
 * then initialises the SDK and preloads ads. Call once on app start.
 */
export async function initAds() {
  if (!lib || initialized) return;
  const { default: mobileAds, AdsConsent, MaxAdContentRating, AdsConsentPrivacyOptionsRequirementStatus } = lib;
  try {
    const info = await AdsConsent.gatherConsent();
    privacyOptionsRequired =
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    if (!info.canRequestAds) return;

    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.T, // keep ads teen-appropriate
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    initialized = true;
    loadInterstitial();
    loadRewarded();
    notify();
  } catch (e) {
    if (__DEV__) console.warn('[ads] init failed', e);
  }
}

/** Shows an interstitial if one is ready. Resolves when it closes (or immediately). */
export function showInterstitial() {
  return new Promise((resolve) => {
    if (!lib || !interstitial || !interstitialLoaded) return resolve(false);
    const { AdEventType } = lib;
    const offClose = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      offClose();
      loadInterstitial();
      resolve(true);
    });
    interstitialLoaded = false;
    interstitial.show().catch(() => {
      offClose();
      loadInterstitial();
      resolve(false);
    });
  });
}

export function isRewardedReady() {
  return adsSupported ? rewardedLoaded : __DEV__;
}

/**
 * Shows a rewarded ad. Resolves `true` only if the user watched long enough to
 * earn the reward. In Expo Go during development, the ad is simulated.
 */
export function showRewarded() {
  if (!lib) return Promise.resolve(__DEV__);
  return new Promise((resolve) => {
    if (!rewarded || !rewardedLoaded) return resolve(false);
    const { AdEventType, RewardedAdEventType } = lib;
    let earned = false;
    const offEarn = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const offClose = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      offEarn();
      offClose();
      loadRewarded();
      resolve(earned);
    });
    rewardedLoaded = false;
    notify();
    rewarded.show().catch(() => {
      offEarn();
      offClose();
      loadRewarded();
      resolve(false);
    });
  });
}

/** True when the user is in a region (e.g. EEA/UK) that must be able to change consent. */
export function isPrivacyOptionsRequired() {
  return privacyOptionsRequired;
}

export async function showPrivacyOptions() {
  if (!lib) return;
  try {
    await lib.AdsConsent.showPrivacyOptionsForm();
  } catch (e) {
    if (__DEV__) console.warn('[ads] privacy form failed', e);
  }
}
