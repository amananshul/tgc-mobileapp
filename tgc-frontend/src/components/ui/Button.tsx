import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import SoftGradient from './SoftGradient';
import {TGC_COLORS, TGC_GRADIENTS, TGC_RADIUS} from '../../theme/tgcTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  compact?: boolean;
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  compact = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        variant !== 'primary' && styles.flatBase,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.86}>
      {variant === 'primary' && (
        <View style={StyleSheet.absoluteFill}>
          <SoftGradient colors={TGC_GRADIENTS.cta} style={styles.primaryFill} intensity={0.76} />
        </View>
      )}

      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? TGC_COLORS.white : TGC_COLORS.coral}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' && styles.primaryText,
            variant === 'outline' && styles.outlineText,
            variant === 'ghost' && styles.ghostText,
            textStyle,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: TGC_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  regular: {
    minHeight: 56,
  },
  compact: {
    minHeight: 48,
  },
  flatBase: {
    backgroundColor: TGC_COLORS.white,
  },
  primaryFill: {
    flex: 1,
    borderRadius: TGC_RADIUS.button,
  },
  outline: {
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: TGC_COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryText: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  outlineText: {
    color: TGC_COLORS.textPrimary,
  },
  ghostText: {
    color: TGC_COLORS.coral,
  },
});
