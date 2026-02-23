import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, type StyleProp, type ViewStyle} from 'react-native';
import StickyFooter from '../../../components/ui/StickyFooter';
import AppBackground from '../../../components/ui/AppBackground';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {TGC_COLORS, TGC_SPACING} from '../../../theme/tgcTheme';

interface OnboardingScaffoldProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
}

export default function OnboardingScaffold({
  step,
  title,
  subtitle,
  onBack,
  children,
  footer,
  bodyStyle,
}: OnboardingScaffoldProps) {
  const insets = useSafeAreaInsets();
  const percent = Math.round((step / 3) * 100);

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.header, {paddingTop: insets.top + 14}]}>
        <View style={styles.stepRow}>
          <Text style={styles.stepText}>Step {step} of 3</Text>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${(step / 3) * 100}%`}]} />
        </View>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, footer ? styles.bodyWithFooter : undefined, bodyStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>

      {footer ? <StickyFooter>{footer}</StickyFooter> : null}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    minHeight: 28,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  backText: {
    color: TGC_COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    color: TGC_COLORS.textSecondary,
    fontWeight: '800',
    fontSize: 16,
  },
  percentText: {
    color: TGC_COLORS.coral,
    fontWeight: '800',
    fontSize: 16,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#BBB8BE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#07071D',
  },
  body: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 24,
    paddingBottom: 38,
  },
  bodyWithFooter: {
    paddingBottom: 132,
  },
  title: {
    fontSize: 24,
    lineHeight: 36,
    color: TGC_COLORS.textPrimary,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: TGC_COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
});
