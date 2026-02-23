import React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import SoftGradient from './SoftGradient';
import {TGC_COLORS} from '../../theme/tgcTheme';

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function AppBackground({children, style}: AppBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      <SoftGradient
        colors={[TGC_COLORS.bgPrimary, TGC_COLORS.bgTertiary]}
        style={StyleSheet.absoluteFill}
        intensity={0.64}
      />
      <View pointerEvents="none" style={styles.wash} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgPrimary,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TGC_COLORS.bgSecondary,
    opacity: 0.56,
  },
});
