import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CardBack } from './FlipCard';
import { colors } from '../theme';

/**
 * Face-down cards for the chosen player to pick from.
 * Truth or Dare: one Truth card and one Dare card.
 * Never Have I Ever: three fanned cards; any of them draws a prompt.
 */
export default function CardPicker({ mode, width, playerName, onPick }) {
  if (mode === 'tod') {
    const w = Math.min(160, (width - 16) / 2);
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{playerName}, pick a card</Text>
        <View style={styles.row}>
          {['truth', 'dare'].map((type) => (
            <Pressable
              key={type}
              onPress={() => onPick(type)}
              accessibilityRole="button"
              accessibilityLabel={`Pick ${type}`}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <CardBack type={type} width={w} height={w * 1.35} small />
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  const w = Math.min(120, (width - 40) / 3);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{playerName}, pick a card to read aloud</Text>
      <View style={styles.row}>
        {[-10, 0, 10].map((deg, i) => (
          <Pressable
            key={deg}
            onPress={() => onPick('nhie')}
            accessibilityRole="button"
            accessibilityLabel={`Pick card ${i + 1}`}
            style={({ pressed }) => [
              styles.card,
              { transform: [{ rotate: `${deg}deg` }, { translateY: deg === 0 ? -10 : 0 }] },
              pressed && styles.pressed,
            ]}
          >
            <CardBack type="nhie" width={w} height={w * 1.4} small />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  card: {},
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
