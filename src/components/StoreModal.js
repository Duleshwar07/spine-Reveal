import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from './Button';
import { CATEGORIES } from '../data/cards';
import { PRODUCTS, REWARD_UNLOCK_MINUTES } from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';
import { colors } from '../theme';

/**
 * The in-app store. When opened for a locked category (`focusCategory`), it
 * leads with "unlock this pack" options: buy it, or watch a rewarded ad.
 */
export default function StoreModal({ visible, focusCategory, onClose, onUnlocked }) {
  const m = useMonetization();
  const [busy, setBusy] = useState(null); // packageId | 'ad' | 'restore'

  const focus = CATEGORIES.find((c) => c.id === focusCategory);
  const focusProduct = focus ? PRODUCTS.find((p) => p.grants.length === 1 && p.grants[0] === focus.entitlement) : null;

  const owns = (product) => product.grants.every((g) => m.entitlements.has(g));
  const price = (product) =>
    m.packages[product.packageId]?.priceString ?? (__DEV__ ? product.fallbackPrice : '—');

  async function handleBuy(product) {
    setBusy(product.packageId);
    const res = await m.purchase(product.packageId);
    setBusy(null);
    if (res.ok) {
      Alert.alert('Thank you! 🎉', `${product.title} is unlocked${res.simulated ? ' (simulated in development)' : ''}.`);
      if (focus && product.grants.includes(focus.entitlement)) onUnlocked?.(focus.id);
    } else if (!res.cancelled) {
      Alert.alert('Purchase failed', res.error);
    }
  }

  async function handleWatchAd() {
    setBusy('ad');
    const earned = await m.unlockWithAd(focus.id);
    setBusy(null);
    if (earned) onUnlocked?.(focus.id);
    else Alert.alert('No reward', 'Watch the whole ad to unlock the pack. Please try again.');
  }

  async function handleRestore() {
    setBusy('restore');
    const res = await m.restorePurchases();
    setBusy(null);
    Alert.alert(res.ok ? 'Purchases restored' : 'Restore failed', res.ok ? 'Everything you bought is unlocked again.' : res.error);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{focus ? `Unlock ${focus.label}` : '⭐ Store'}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close store">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {focus && focusProduct && (
            <View style={styles.focusCard}>
              <Text style={styles.focusEmoji}>{focus.emoji}</Text>
              <Text style={styles.focusTitle}>{focus.label} Pack</Text>
              <Text style={styles.focusDesc}>{focus.description}</Text>
              <Button
                title={busy === focusProduct.packageId ? 'Processing…' : `Buy forever · ${price(focusProduct)}`}
                onPress={() => handleBuy(focusProduct)}
                disabled={!!busy}
                style={styles.fullBtn}
              />
              <Button
                title={
                  busy === 'ad'
                    ? 'Loading ad…'
                    : m.rewardedReady
                      ? `🎬 Watch an ad · free for ${REWARD_UNLOCK_MINUTES} min`
                      : 'Ad not available yet'
                }
                variant="outline"
                onPress={handleWatchAd}
                disabled={!!busy || !m.rewardedReady}
                style={styles.fullBtn}
              />
            </View>
          )}

          <Text style={styles.section}>{focus ? 'Or get more' : 'Packs & upgrades'}</Text>
          {PRODUCTS.filter((p) => p !== focusProduct).map((p) => {
            const owned = owns(p);
            return (
              <View key={p.packageId} style={[styles.product, p.highlight && styles.productHighlight]}>
                {p.highlight && <Text style={styles.best}>BEST VALUE</Text>}
                <Text style={styles.pEmoji}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pTitle}>{p.title}</Text>
                  <Text style={styles.pDesc}>{p.description}</Text>
                </View>
                {owned ? (
                  <Text style={styles.owned}>✓ Owned</Text>
                ) : (
                  <Pressable
                    onPress={() => handleBuy(p)}
                    disabled={!!busy}
                    style={({ pressed }) => [styles.priceBtn, pressed && { opacity: 0.8 }, busy && { opacity: 0.5 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Buy ${p.title}`}
                  >
                    {busy === p.packageId ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.priceText}>{price(p)}</Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}

          <Pressable onPress={handleRestore} disabled={!!busy} style={styles.link}>
            <Text style={styles.linkText}>{busy === 'restore' ? 'Restoring…' : 'Restore purchases'}</Text>
          </Pressable>
          {m.privacyRequired && (
            <Pressable onPress={m.showPrivacyOptions} style={styles.link}>
              <Text style={styles.linkText}>Ad privacy settings</Text>
            </Pressable>
          )}
          <Text style={styles.fine}>
            One-time purchases, no subscriptions. Payment is charged to your Google Play account.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  close: { color: colors.muted, fontSize: 22 },
  body: { padding: 20, paddingBottom: 40 },
  focusCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 20,
    alignItems: 'center',
  },
  focusEmoji: { fontSize: 48 },
  focusTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 6 },
  focusDesc: { color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  fullBtn: { alignSelf: 'stretch', marginTop: 10 },
  section: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
  },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  productHighlight: { borderColor: colors.nhie },
  best: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: colors.nhie,
    color: '#14112B',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  pEmoji: { fontSize: 28 },
  pTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  pDesc: { color: colors.muted, fontSize: 13, marginTop: 2 },
  priceBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 76,
    alignItems: 'center',
  },
  priceText: { color: '#fff', fontWeight: '900' },
  owned: { color: colors.success, fontWeight: '800' },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: colors.accent, fontWeight: '700' },
  fine: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
