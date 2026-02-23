import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {TGC_COLORS} from '../../theme/tgcTheme';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function Loader({size = 'large', color = TGC_COLORS.coral}: LoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TGC_COLORS.bgPrimary,
  },
});
