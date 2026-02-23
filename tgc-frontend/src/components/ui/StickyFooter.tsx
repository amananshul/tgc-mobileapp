import React from 'react';
import {View, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {TGC_COLORS, TGC_SPACING} from '../../theme/tgcTheme';

interface StickyFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function StickyFooter({children, style}: StickyFooterProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.footer,
        {paddingBottom: Math.max(insets.bottom, 10) + 8},
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: 'rgba(253, 252, 250, 0.98)',
    borderTopWidth: 1,
    borderTopColor: TGC_COLORS.border,
  },
});
