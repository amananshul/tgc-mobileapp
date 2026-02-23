import React from 'react';
import {View, StyleSheet, type ViewStyle, type StyleProp} from 'react-native';

interface SoftGradientProps {
  colors: readonly [string, string];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  intensity?: number;
}

export default function SoftGradient({
  colors,
  style,
  children,
  intensity = 0.72,
}: SoftGradientProps) {
  return (
    <View style={[styles.base, {backgroundColor: colors[0]}, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            backgroundColor: colors[1],
            opacity: intensity,
          },
        ]}
      />
      <View pointerEvents="none" style={styles.glow} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    transform: [{translateX: 70}, {translateY: -20}, {scaleX: 1.35}, {scaleY: 1.2}],
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    left: -80,
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
  },
});
