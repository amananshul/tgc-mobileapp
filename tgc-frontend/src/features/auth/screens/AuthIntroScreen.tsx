import React, {useMemo, useState} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AppBackground from '../../../components/ui/AppBackground';
import StickyFooter from '../../../components/ui/StickyFooter';
import Button from '../../../components/ui/Button';
import SoftGradient from '../../../components/ui/SoftGradient';
import {TGC_COLORS, TGC_GRADIENTS, TGC_SPACING} from '../../../theme/tgcTheme';
import type {AuthStackParamList} from '../../../app/navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Intro'>;
};

const SLIDES = [
  {
    id: 'learn',
    title: 'Learn Skills, Earn Gigs',
    accent: 'Build Community',
    body:
      'Discover new skills from passionate instructors, find exciting gigs, and connect with like-minded people in your area.',
    icon: '🎓',
    gradient: TGC_GRADIENTS.mint,
  },
  {
    id: 'host',
    title: 'Host Events, Discover Peers',
    accent: 'Get Karma Points',
    body:
      'Create meaningful events, meet amazing people who share your interests, and earn karma points for every positive contribution you make.',
    icon: '📅',
    gradient: TGC_GRADIENTS.lavender,
  },
  {
    id: 'grow',
    title: 'Grow with Purpose',
    accent: "Let's Gig Together",
    body:
      'Build your reputation, unlock new opportunities, and become part of a community that values growth, collaboration, and social impact.',
    icon: '📈',
    gradient: TGC_GRADIENTS.cta,
  },
] as const;

export default function AuthIntroScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const progressArray = useMemo(() => SLIDES.map((_, i) => i <= index), [index]);

  const goToLogin = () => {
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (isLast) {
      goToLogin();
      return;
    }
    setIndex(i => i + 1);
  };

  const handleBack = () => {
    if (index === 0) return;
    setIndex(i => i - 1);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBackground>
        <View style={[styles.container, {paddingTop: insets.top + 14}]}>
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.navBtn, index === 0 && styles.navBtnHidden]}
              disabled={index === 0}
              activeOpacity={0.8}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.stepText}>{index + 1} of {SLIDES.length}</Text>

            <TouchableOpacity onPress={goToLogin} style={styles.skipBtn} activeOpacity={0.85}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            {progressArray.map((filled, i) => (
              <View key={i} style={styles.progressTrack}>
                <View style={[styles.progressFill, filled && styles.progressFillActive]} />
              </View>
            ))}
          </View>

          <View style={styles.centerSection}>
            <SoftGradient colors={slide.gradient} style={styles.iconWrap} intensity={0.62}>
              <View style={styles.iconInner}>
                <Text style={styles.iconText}>{slide.icon}</Text>
              </View>
            </SoftGradient>

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.accent}>{slide.accent}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        </View>

        <StickyFooter>
          <Button
            title={isLast ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            style={styles.cta}
          />
        </StickyFooter>
      </AppBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgPrimary,
  },
  container: {
    flex: 1,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingBottom: 128,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  navBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navBtnHidden: {
    opacity: 0,
  },
  navBtnText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 28,
    marginTop: -3,
    fontWeight: '600',
  },
  stepText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '800',
  },
  skipBtn: {
    minHeight: 44,
    minWidth: 52,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  progressRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D7D4DA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#D7D4DA',
  },
  progressFillActive: {
    backgroundColor: '#17152A',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 34,
  },
  iconWrap: {
    width: 152,
    height: 152,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TGC_COLORS.coral,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  iconInner: {
    width: 116,
    height: 116,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    marginTop: 30,
    color: TGC_COLORS.textPrimary,
    textAlign: 'center',
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  accent: {
    marginTop: 10,
    color: TGC_COLORS.coral,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  body: {
    marginTop: 16,
    color: TGC_COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 344,
  },
  cta: {
    borderRadius: 20,
  },
});
