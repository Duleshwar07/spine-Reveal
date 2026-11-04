import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Button from '../components/Button';
import CardPicker from '../components/CardPicker';
import FlipCard from '../components/FlipCard';
import SpinCircle from '../components/SpinCircle';
import { CATEGORIES, getCards } from '../data/cards';
import { useMonetization } from '../monetization/MonetizationContext';
import { colors, TYPE_META } from '../theme';
import { createDeck, randomIndex } from '../utils/deck';

// Phases of a single turn: spin the bottle -> choose a card -> reveal it.
const PHASE = { SPIN: 'spin', SPINNING: 'spinning', CHOOSE: 'choose', REVEAL: 'reveal' };

export default function GameScreen({ settings, onExit, onPlayersChange }) {
  const { mode, category } = settings;
  const [players, setPlayers] = useState(settings.players);
  const [phase, setPhase] = useState(PHASE.SPIN);
  const [selected, setSelected] = useState(null);
  const [card, setCard] = useState(null); // { type, text, key }

  const { width } = useWindowDimensions();
  const circleSize = Math.min(width - 32, 380);

  const rotation = useRef(new Animated.Value(0)).current;
  const angle = useRef(0);
  const drawCount = useRef(0);

  // One deck per card type, so each type cycles through all prompts before repeating.
  const decks = useMemo(
    () => ({
      truth: createDeck(getCards(category, 'truth')),
      dare: createDeck(getCards(category, 'dare')),
      nhie: createDeck(getCards(category, 'nhie')),
    }),
    [category],
  );

  const categoryMeta = CATEGORIES.find((c) => c.id === category);
  const isTod = mode === 'tod';

  const { onGameStart, onTurnFinished } = useMonetization();
  useEffect(() => onGameStart(), [onGameStart]);

  // Android hardware back button returns to Setup instead of closing the app.
  const playersRef = useRef(players);
  playersRef.current = players;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onExit(playersRef.current);
      return true;
    });
    return () => sub.remove();
  }, [onExit]);

  // Stop any running spin if the screen unmounts mid-animation.
  useEffect(() => () => rotation.stopAnimation(), [rotation]);

  const spin = useCallback(() => {
    if (phase !== PHASE.SPIN) return;
    const n = players.length;
    const target = randomIndex(n, selected ?? -1);
    const slice = 360 / n;
    const jitter = (Math.random() - 0.5) * slice * 0.5; // land inside the player's slice
    const base = Math.floor(angle.current / 360) * 360;
    const turns = 4 + Math.floor(Math.random() * 3);
    const final = base + turns * 360 + target * slice + jitter;

    setSelected(null);
    setPhase(PHASE.SPINNING);
    Animated.timing(rotation, {
      toValue: final,
      duration: 3000 + Math.random() * 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      angle.current = final;
      setSelected(target);
      setPhase(PHASE.CHOOSE);
    });
  }, [phase, players.length, selected, rotation]);

  const pick = useCallback(
    (type) => {
      drawCount.current += 1;
      setCard({ type, text: decks[type].draw(), key: drawCount.current });
      setPhase(PHASE.REVEAL);
    },
    [decks],
  );

  function finishTurn(completed) {
    if (completed && isTod && selected != null) {
      const next = players.map((p, i) => (i === selected ? { ...p, score: p.score + 1 } : p));
      setPlayers(next);
      onPlayersChange(next);
    }
    setCard(null);
    setPhase(PHASE.SPIN);
    // Ads only ever appear here, between turns — never during a spin or a card.
    onTurnFinished();
  }

  const player = selected != null ? players[selected] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => onExit(players)} hitSlop={10} accessibilityRole="button">
          <Text style={styles.back}>‹ Setup</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {isTod ? 'Truth or Dare' : 'Never Have I Ever'} · {categoryMeta?.emoji} {categoryMeta?.label}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {phase === PHASE.REVEAL && card ? (
          <View style={styles.center}>
            <FlipCard
              key={card.key}
              type={card.type}
              text={card.text}
              playerName={isTod ? player?.name : `${player?.name} reads`}
              width={Math.min(width - 40, 340)}
              height={360}
            />
            <View style={styles.actions}>
              {isTod ? (
                <>
                  <Button title="✓ Done" color={colors.success} onPress={() => finishTurn(true)} style={styles.flex} />
                  <Button title="Skip" variant="outline" onPress={() => finishTurn(false)} style={styles.flex} />
                </>
              ) : (
                <Button title="Next spin" color={TYPE_META.nhie.color} onPress={() => finishTurn(false)} style={styles.flex} />
              )}
            </View>
            <Pressable onPress={() => pick(card.type)} hitSlop={8}>
              <Text style={styles.swap}>↻ Swap for another {TYPE_META[card.type].label} card</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            <SpinCircle
              players={players}
              size={circleSize}
              rotation={rotation}
              selected={selected}
              onSpin={spin}
              disabled={phase !== PHASE.SPIN}
              showScores={isTod}
            />

            <View style={styles.below}>
              {phase === PHASE.CHOOSE && player ? (
                <CardPicker mode={mode} width={width - 40} playerName={player.name} onPick={pick} />
              ) : (
                <>
                  <Text style={styles.hint}>
                    {phase === PHASE.SPINNING ? 'Spinning…' : 'Tap the bottle or the button to spin'}
                  </Text>
                  <Button
                    title={phase === PHASE.SPINNING ? 'Spinning…' : '🍾 Spin the bottle'}
                    onPress={spin}
                    disabled={phase !== PHASE.SPIN}
                    style={styles.spinBtn}
                  />
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.accent, fontSize: 17, fontWeight: '700' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
  body: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  center: { alignItems: 'center' },
  below: { marginTop: 24, width: '100%', alignItems: 'center' },
  hint: { color: colors.muted, marginBottom: 14 },
  spinBtn: { alignSelf: 'stretch' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, alignSelf: 'stretch' },
  flex: { flex: 1 },
  swap: { color: colors.muted, marginTop: 18, fontSize: 14 },
});
