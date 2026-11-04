import { memo, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/**
 * A bottle drawn with plain Views. The neck points "up" at 0deg, and
 * `rotation` (an Animated value in degrees) spins it clockwise.
 * The spin runs entirely on the native thread (useNativeDriver), so this
 * component never re-renders while the bottle is turning.
 */
function Bottle({ rotation, size = 130 }) {
  const rotate = useMemo(
    () => rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
    [rotation],
  );
  const s = size / 130;

  return (
    <Animated.View
      style={[styles.wrap, { width: size * 0.45, height: size, transform: [{ rotate }] }]}
    >
      <View style={[styles.cap, { width: 20 * s, height: 10 * s, borderRadius: 3 * s }]} />
      <View style={[styles.neck, { width: 16 * s, height: 34 * s }]} />
      <View
        style={[
          styles.shoulder,
          { width: 40 * s, height: 14 * s, borderTopLeftRadius: 18 * s, borderTopRightRadius: 18 * s },
        ]}
      />
      <View
        style={[
          styles.body,
          { width: 48 * s, height: 72 * s, borderBottomLeftRadius: 14 * s, borderBottomRightRadius: 14 * s },
        ]}
      >
        <View style={[styles.label, { height: 22 * s, marginTop: 18 * s }]} />
        <View style={[styles.shine, { width: 6 * s, height: 46 * s, left: 8 * s, top: 8 * s }]} />
      </View>
    </Animated.View>
  );
}

export default memo(Bottle);

const glass = '#2FBF71';

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cap: { backgroundColor: '#FFC145' },
  neck: { backgroundColor: glass },
  shoulder: { backgroundColor: glass },
  body: { backgroundColor: glass, overflow: 'hidden' },
  label: { backgroundColor: '#F5F3FF', opacity: 0.9 },
  shine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 4 },
});
