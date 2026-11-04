import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Bottle from './Bottle';
import { colors, playerColors } from '../theme';

/**
 * Players sit evenly around a circle, measured clockwise from the top.
 * Player i is at angle i * 360 / n, which is exactly where the bottle
 * points when its rotation (mod 360) equals that angle.
 */
function SpinCircle({ players, size, rotation, selected, onSpin, disabled, showScores }) {
  const n = players.length;
  const avatar = n > 8 ? 42 : 52;
  const boxW = avatar + 30;
  const radius = size / 2 - boxW / 2;

  // Seat positions only change when the player count or screen size changes.
  const seats = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const theta = (i * 2 * Math.PI) / n;
        return { cx: size / 2 + radius * Math.sin(theta), cy: size / 2 - radius * Math.cos(theta) };
      }),
    [n, size, radius],
  );

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.ring,
          { width: radius * 2, height: radius * 2, borderRadius: radius, left: size / 2 - radius, top: size / 2 - radius },
        ]}
      />

      {players.map((p, i) => {
        const { cx, cy } = seats[i];
        const isSel = selected === i;
        const color = playerColors[i % playerColors.length];
        return (
          <View
            key={p.id}
            style={[styles.player, { width: boxW, left: cx - boxW / 2, top: cy - avatar / 2 }]}
          >
            <View
              style={[
                styles.avatar,
                {
                  width: avatar,
                  height: avatar,
                  borderRadius: avatar / 2,
                  backgroundColor: color,
                  borderColor: isSel ? colors.text : 'transparent',
                  transform: [{ scale: isSel ? 1.15 : 1 }],
                },
              ]}
            >
              <Text style={[styles.initial, { fontSize: avatar * 0.42 }]}>
                {p.name.charAt(0).toUpperCase()}
              </Text>
              {showScores && p.score > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{p.score}</Text>
                </View>
              )}
            </View>
            <Text numberOfLines={1} style={[styles.name, isSel && styles.nameSel]}>
              {p.name}
            </Text>
          </View>
        );
      })}

      <Pressable
        onPress={onSpin}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Spin the bottle"
        style={[styles.center, { left: size / 2 - 70, top: size / 2 - 70 }]}
      >
        <Bottle rotation={rotation} size={Math.min(130, size * 0.36)} />
      </Pressable>
    </View>
  );
}

export default memo(SpinCircle);

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  player: { position: 'absolute', alignItems: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  initial: { color: '#14112B', fontWeight: '800' },
  name: { color: colors.muted, fontSize: 12, marginTop: 4, maxWidth: '100%' },
  nameSel: { color: colors.text, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#14112B', fontSize: 11, fontWeight: '800' },
  center: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
