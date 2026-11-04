// ─────────────────────────────────────────────────────────────────────────────
// Monetisation settings. Replace the placeholders before a production release.
// See MONETIZATION.md for where each value comes from.
// ─────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

// Google's official sample ad units. These ALWAYS serve test ads and are safe
// to click. Release builds use your real unit IDs from AdMob → Apps → Ad units.
const GOOGLE_TEST_UNITS = {
  interstitial: Platform.select({
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  }),
  rewarded: Platform.select({
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
  }),
};

const PRODUCTION_UNITS = {
  interstitial: Platform.select({
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN', // TODO: your Android interstitial unit
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN', // TODO: your iOS interstitial unit
  }),
  rewarded: Platform.select({
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN', // TODO: your Android rewarded unit
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN', // TODO: your iOS rewarded unit
  }),
};

const hasRealUnits = !PRODUCTION_UNITS.interstitial.includes('XXXX');

// Dev builds always use test ads. Release builds use real units once filled in
// (falling back to test units, so an unfinished config never breaks the app).
export const AD_UNITS = __DEV__ || !hasRealUnits ? GOOGLE_TEST_UNITS : PRODUCTION_UNITS;

// RevenueCat public SDK keys (RevenueCat dashboard → Project → API keys).
export const REVENUECAT_API_KEY = Platform.select({
  android: 'goog_REPLACE_WITH_YOUR_KEY', // TODO
  ios: 'appl_REPLACE_WITH_YOUR_KEY', // TODO
});
export const HAS_REVENUECAT_KEY = !REVENUECAT_API_KEY.includes('REPLACE');

// Show one interstitial after every N completed turns (never mid-turn).
export const INTERSTITIAL_EVERY_N_TURNS = 5;
// No interstitial in the first N seconds after a game starts.
export const INTERSTITIAL_GRACE_SECONDS = 60;
// How long a rewarded ad unlocks a premium pack.
export const REWARD_UNLOCK_MINUTES = 60;

// RevenueCat entitlement identifiers (dashboard → Entitlements).
export const ENTITLEMENTS = {
  couples: 'couples',
  intense: 'intense',
  noAds: 'no_ads',
};

/**
 * Products shown in the store. `packageId` is the RevenueCat package identifier
 * in your "default" offering; `grants` are the entitlements it unlocks (configure
 * the same mapping in RevenueCat). `fallbackPrice` is only shown if the store
 * can't be reached — real prices always come from Google Play.
 */
export const PRODUCTS = [
  {
    packageId: 'unlock_all',
    title: 'Unlock Everything',
    emoji: '👑',
    description: 'Couples + Intense packs, all future packs, and no ads. Best value!',
    grants: [ENTITLEMENTS.couples, ENTITLEMENTS.intense, ENTITLEMENTS.noAds],
    fallbackPrice: '$4.99',
    highlight: true,
  },
  {
    packageId: 'couples_pack',
    title: 'Couples Pack',
    emoji: '💞',
    description: '54 sweet & flirty cards for partners.',
    grants: [ENTITLEMENTS.couples],
    fallbackPrice: '$1.99',
  },
  {
    packageId: 'intense_pack',
    title: 'Intense Pack',
    emoji: '🔥',
    description: '54 deep truths & bold dares.',
    grants: [ENTITLEMENTS.intense],
    fallbackPrice: '$1.99',
  },
  {
    packageId: 'remove_ads',
    title: 'Remove Ads',
    emoji: '🚫',
    description: 'Play forever without interruptions.',
    grants: [ENTITLEMENTS.noAds],
    fallbackPrice: '$2.99',
  },
];
