import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '../data/cards';
import {
  initAds,
  isPrivacyOptionsRequired,
  isRewardedReady,
  showInterstitial,
  showPrivacyOptions,
  showRewarded,
  subscribeAds,
} from './ads';
import { ENTITLEMENTS, INTERSTITIAL_EVERY_N_TURNS, INTERSTITIAL_GRACE_SECONDS, REWARD_UNLOCK_MINUTES } from './config';
import { buy, initPurchases, loadPackages, restore } from './purchases';

const MonetizationContext = createContext(null);

export function MonetizationProvider({ children }) {
  const [entitlements, setEntitlements] = useState(() => new Set());
  const [packages, setPackages] = useState({});
  const [tempUnlocks, setTempUnlocks] = useState({}); // { categoryId: expiryMs }
  const [rewardedReady, setRewardedReady] = useState(isRewardedReady());
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [now, setNow] = useState(Date.now());

  const turns = useRef(0);
  const gameStartedAt = useRef(0);

  // Start up: purchases first (so paying users never see an ad), then ads.
  useEffect(() => {
    let alive = true;
    (async () => {
      const owned = await initPurchases((ents) => alive && setEntitlements(ents));
      if (!alive) return;
      setEntitlements(owned);
      loadPackages().then((p) => alive && setPackages(p));
      await initAds();
      if (alive) setPrivacyRequired(isPrivacyOptionsRequired());
    })();
    const unsub = subscribeAds(() => setRewardedReady(isRewardedReady()));
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // Tick once a minute so temporary unlocks expire on screen.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const adsRemoved = entitlements.has(ENTITLEMENTS.noAds);

  const isUnlocked = useCallback(
    (categoryId) => {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      if (!cat?.premium) return true;
      return entitlements.has(cat.entitlement) || (tempUnlocks[categoryId] ?? 0) > now;
    },
    [entitlements, tempUnlocks, now],
  );

  const minutesLeft = useCallback(
    (categoryId) => {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      if (cat && entitlements.has(cat.entitlement)) return null; // owned forever
      const ms = (tempUnlocks[categoryId] ?? 0) - now;
      return ms > 0 ? Math.ceil(ms / 60_000) : null;
    },
    [entitlements, tempUnlocks, now],
  );

  const unlockWithAd = useCallback(async (categoryId) => {
    const earned = await showRewarded();
    if (earned) {
      const t = Date.now();
      setNow(t);
      setTempUnlocks((u) => ({ ...u, [categoryId]: t + REWARD_UNLOCK_MINUTES * 60_000 }));
    }
    return earned;
  }, []);

  const purchase = useCallback(
    async (packageId) => {
      const res = await buy(packageId, packages);
      if (res.ok) setEntitlements((prev) => new Set([...prev, ...res.entitlements]));
      return res;
    },
    [packages],
  );

  const restorePurchases = useCallback(async () => {
    const res = await restore();
    if (res.ok) setEntitlements(res.entitlements);
    return res;
  }, []);

  const onGameStart = useCallback(() => {
    turns.current = 0;
    gameStartedAt.current = Date.now();
  }, []);

  /** Call after every finished turn. Shows an interstitial every N turns. */
  const onTurnFinished = useCallback(async () => {
    turns.current += 1;
    if (adsRemoved) return;
    const graceOver = Date.now() - gameStartedAt.current > INTERSTITIAL_GRACE_SECONDS * 1000;
    if (graceOver && turns.current % INTERSTITIAL_EVERY_N_TURNS === 0) {
      await showInterstitial();
    }
  }, [adsRemoved]);

  const value = useMemo(
    () => ({
      entitlements,
      packages,
      adsRemoved,
      rewardedReady,
      privacyRequired,
      isUnlocked,
      minutesLeft,
      unlockWithAd,
      purchase,
      restorePurchases,
      onGameStart,
      onTurnFinished,
      showPrivacyOptions,
    }),
    [
      entitlements, packages, adsRemoved, rewardedReady, privacyRequired, isUnlocked, minutesLeft,
      unlockWithAd, purchase, restorePurchases, onGameStart, onTurnFinished,
    ],
  );

  return <MonetizationContext.Provider value={value}>{children}</MonetizationContext.Provider>;
}

export function useMonetization() {
  const ctx = useContext(MonetizationContext);
  if (!ctx) throw new Error('useMonetization must be used inside <MonetizationProvider>');
  return ctx;
}
