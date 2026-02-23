import React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {TGC_COLORS, TGC_RADIUS, TGC_SHADOWS, TGC_SPACING} from '../../theme/tgcTheme';

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  emphasized?: boolean;
}

export default function SurfaceCard({children, style, emphasized = false}: SurfaceCardProps) {
  return <View style={[styles.base, emphasized && styles.emphasized, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: TGC_COLORS.card,
    borderRadius: TGC_RADIUS.card,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    padding: TGC_SPACING.cardPadding,
    ...TGC_SHADOWS.card,
  },
  emphasized: {
    borderWidth: 2,
  },
});
