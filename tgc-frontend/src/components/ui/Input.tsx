import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import {TGC_COLORS, TGC_RADIUS} from '../../theme/tgcTheme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  containerStyle?: ViewStyle;
  accentColor?: string;
}

export default function Input({
  label,
  error,
  secureToggle = false,
  containerStyle,
  secureTextEntry,
  accentColor = TGC_COLORS.coral,
  onBlur,
  onFocus,
  ...rest
}: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          focused && {
            borderColor: accentColor,
            shadowColor: accentColor,
          },
          error && styles.inputError,
        ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={TGC_COLORS.textTertiary}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} style={styles.toggle}>
            <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 7,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TGC_COLORS.white,
    borderRadius: TGC_RADIUS.input,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    minHeight: 56,
    shadowColor: 'transparent',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  inputError: {
    borderColor: '#E75A5A',
  },
  input: {
    flex: 1,
    color: TGC_COLORS.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  toggle: {
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    color: TGC_COLORS.coral,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: '#D14A4A',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
