import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button from '../components/Button';
import StoreModal from '../components/StoreModal';
import { CATEGORIES } from '../data/cards';
import { useMonetization } from '../monetization/MonetizationContext';
import { colors, playerColors } from '../theme';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;

const MODES = [
  { id: 'tod', label: 'Truth or Dare', emoji: '💬⚡' },
  { id: 'nhie', label: 'Never Have I Ever', emoji: '🙈' },
];

export default function SetupScreen({ initial, onStart }) {
  const [players, setPlayers] = useState(initial.players);
  const [name, setName] = useState('');
  const [mode, setMode] = useState(initial.mode);
  const [category, setCategory] = useState(initial.category);
  const [store, setStore] = useState({ visible: false, focus: null });
  const { isUnlocked, minutesLeft, adsRemoved } = useMonetization();

  function chooseCategory(id) {
    if (isUnlocked(id)) setCategory(id);
    else setStore({ visible: true, focus: id });
  }

  function start() {
    // A temporary (ad) unlock may have expired while sitting on this screen.
    if (!isUnlocked(category)) return setStore({ visible: true, focus: category });
    onStart({ players, mode, category });
  }

  const trimmed = name.trim();
  const duplicate = players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const full = players.length >= MAX_PLAYERS;
  const canAdd = trimmed.length > 0 && !duplicate && !full;

  function addPlayer() {
    if (!canAdd) return;
    setPlayers((ps) => [...ps, { id: `${Date.now()}-${Math.random()}`, name: trimmed, score: 0 }]);
    setName('');
  }

  function removePlayer(id) {
    setPlayers((ps) => ps.filter((p) => p.id !== id));
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable
            onPress={() => setStore({ visible: true, focus: null })}
            style={styles.storeBtn}
            accessibilityRole="button"
            accessibilityLabel="Open store"
          >
            <Text style={styles.storeText}>{adsRemoved ? '⭐ Store' : '⭐ Store · Remove ads'}</Text>
          </Pressable>
        </View>
        <Text style={styles.logo}>🍾</Text>
        <Text style={styles.title}>Spin & Reveal</Text>
        <Text style={styles.subtitle}>Spin the bottle, then pick a card.</Text>

        <Text style={styles.section}>Players ({players.length}/{MAX_PLAYERS})</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={addPlayer}
            placeholder={full ? 'Max players reached' : 'Add a player name'}
            placeholderTextColor={colors.muted}
            editable={!full}
            maxLength={16}
            returnKeyType="done"
            blurOnSubmit={false}
            style={styles.input}
          />
          <Button title="Add" onPress={addPlayer} disabled={!canAdd} style={styles.addBtn} />
        </View>
        {duplicate && trimmed.length > 0 && (
          <Text style={styles.warn}>That name is already in the game.</Text>
        )}

        <View style={styles.chips}>
          {players.map((p, i) => (
            <View key={p.id} style={[styles.chip, { borderColor: playerColors[i % playerColors.length] }]}>
              <Text style={styles.chipText}>{p.name}</Text>
              <Pressable
                onPress={() => removePlayer(p.id)}
                hitSlop={10}
                accessibilityLabel={`Remove ${p.name}`}
              >
                <Text style={styles.chipX}>✕</Text>
              </Pressable>
            </View>
          ))}
          {players.length === 0 && <Text style={styles.empty}>Add at least {MIN_PLAYERS} players.</Text>}
        </View>

        <Text style={styles.section}>Game</Text>
        <View style={styles.segment}>
          {MODES.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMode(m.id)}
              style={[styles.segItem, mode === m.id && styles.segActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m.id }}
            >
              <Text style={styles.segEmoji}>{m.emoji}</Text>
              <Text style={[styles.segText, mode === m.id && styles.segTextActive]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Category</Text>
        {CATEGORIES.map((c) => {
          const unlocked = isUnlocked(c.id);
          const mins = c.premium ? minutesLeft(c.id) : null;
          return (
            <Pressable
              key={c.id}
              onPress={() => chooseCategory(c.id)}
              style={[styles.category, category === c.id && styles.categoryActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: category === c.id }}
              accessibilityHint={unlocked ? undefined : 'Locked. Opens unlock options.'}
            >
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.catTitleRow}>
                  <Text style={styles.catLabel}>{c.label}</Text>
                  {c.tag ? <Text style={styles.catTag}>{c.tag}</Text> : null}
                </View>
                <Text style={styles.catDesc}>{c.description}</Text>
                {mins != null && <Text style={styles.catTimer}>⏳ Unlocked for {mins} more min</Text>}
              </View>
              {unlocked ? (
                <View style={[styles.radio, category === c.id && styles.radioOn]} />
              ) : (
                <Text style={styles.lock}>🔒</Text>
              )}
            </Pressable>
          );
        })}

        <Button
          title={players.length < MIN_PLAYERS ? `Add ${MIN_PLAYERS - players.length} more player(s)` : 'Start game'}
          onPress={start}
          disabled={players.length < MIN_PLAYERS}
          style={styles.start}
        />
      </ScrollView>

      <StoreModal
        visible={store.visible}
        focusCategory={store.focus}
        onClose={() => setStore({ visible: false, focus: null })}
        onUnlocked={(id) => {
          setCategory(id);
          setStore({ visible: false, focus: null });
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end' },
  storeBtn: {
    borderWidth: 2,
    borderColor: colors.nhie,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  storeText: { color: colors.nhie, fontWeight: '800', fontSize: 13 },
  catTimer: { color: colors.nhie, fontSize: 12, marginTop: 4, fontWeight: '700' },
  lock: { fontSize: 20 },
  logo: { fontSize: 48, textAlign: 'center', marginTop: 8 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 4 },
  section: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 10,
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 16,
    minHeight: 50,
  },
  addBtn: { paddingHorizontal: 18 },
  warn: { color: colors.danger, marginTop: 6, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { color: colors.text, fontWeight: '600' },
  chipX: { color: colors.muted, fontSize: 14 },
  empty: { color: colors.muted, fontStyle: 'italic' },
  segment: { flexDirection: 'row', gap: 10 },
  segItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  segActive: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  segEmoji: { fontSize: 22 },
  segText: { color: colors.muted, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  segTextActive: { color: colors.text },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  categoryActive: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  catEmoji: { fontSize: 28 },
  catTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLabel: { color: colors.text, fontSize: 17, fontWeight: '800' },
  catTag: {
    color: colors.dare,
    fontSize: 11,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: colors.dare,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  catDesc: { color: colors.muted, fontSize: 13, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  start: { marginTop: 24 },
});
