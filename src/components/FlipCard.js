import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, TYPE_META } from '../theme';

/** The face-down back of a card. Reused by CardPicker. */
export const CardBack = memo(function CardBack({ type, width, height, small = false }) {
  const meta = TYPE_META[type];
  return (
    <View style={[styles.face, styles.backFace, { width, height, borderColor: meta.color }]}>
      <Text style={{ fontSize: small ? 34 : 56 }}>{meta.emoji}</Text>
      <Text style={[styles.backLabel, { color: meta.color, fontSize: small ? 16 : 22 }]}>
        {meta.label}
      </Text>
    </View>
  );
});

/**
 * Shows a card that flips from face-down to face-up whenever `text` changes.
 * Opacity is switched at the halfway point as well as using backfaceVisibility,
 * so the flip looks right on Android too.
 */
export default function FlipCard({ type, text, playerName, width = 300, height = 360 }) {
  const flip = useRef(new Animated.Value(0)).current;
  const meta = TYPE_META[type];

  useEffect(() => {
    flip.setValue(0);
    const anim = Animated.spring(flip, {
      toValue: 1,
      friction: 8,
      tension: 18,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [text, flip]);

  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });

  return (
    <View style={{ width, height }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
        ]}
      >
        <CardBack type={type} width={width} height={height} />
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
        ]}
      >
        <View style={[styles.face, styles.frontFace, { width, height, borderColor: meta.color }]}>
          <View style={[styles.pill, { backgroundColor: meta.color }]}>
            <Text style={styles.pillText}>
              {meta.emoji} {meta.label}
            </Text>
          </View>
          {playerName ? <Text style={styles.forPlayer}>for {playerName}</Text> : null}
          <Text style={styles.prompt}>
            {type === 'nhie' ? `Never have I ever ${text}` : text}
          </Text>
          {type === 'nhie' && (
            <Text style={styles.hint}>Anyone who HAS done it — raise your hand!</Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backfaceVisibility: 'hidden',
  },
  backFace: { backgroundColor: colors.surfaceAlt },
  backLabel: { fontWeight: '800', marginTop: 10, textAlign: 'center' },
  frontFace: { backgroundColor: colors.surface },
  pill: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { color: '#14112B', fontWeight: '800', fontSize: 14 },
  forPlayer: { position: 'absolute', top: 58, color: colors.muted, fontSize: 14 },
  prompt: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: { position: 'absolute', bottom: 20, color: colors.muted, fontSize: 13, textAlign: 'center' },
});
