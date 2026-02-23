import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TGC_COLORS} from '../../theme/tgcTheme';

interface BrandWordmarkProps {
  subtitle?: string;
}

export default function BrandWordmark({subtitle}: BrandWordmarkProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.word}>TGC</Text>
        <Text style={styles.slashes}>{'//'}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  word: {
    color: TGC_COLORS.textPrimary,
    fontSize: 64,
    lineHeight: 70,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  slashes: {
    color: TGC_COLORS.coral,
    fontSize: 64,
    lineHeight: 70,
    fontWeight: '900',
    marginLeft: 2,
  },
  subtitle: {
    marginTop: 4,
    color: TGC_COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
