import React, {useRef, useState} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Modal,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import OnboardingScaffold from '../components/OnboardingScaffold';
import Button from '../../../components/ui/Button';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import {INTEREST_OPTIONS, SKILL_OPTIONS} from '../constants';
import {TGC_COLORS} from '../../../theme/tgcTheme';
import type {OnboardingStackParamList} from '../../../app/navigation/OnboardingStack';
import {useAppSelector} from '../../../store/hooks';
import {useSaveOnboarding} from '../../profile/hooks/useSaveOnboarding';
import type {GrowthIntent} from '../../../types/auth';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SkillsInterests'>;
};

const MAX_SELECTIONS = 5;
const {height: SCREEN_H} = Dimensions.get('window');
const CONFETTI_COLORS = ['#FF8B7B', '#7DD3C0', '#C8B6FF', '#FFD166', '#FFBE0B', '#FF6B9D'];
const CONFETTI_COUNT = 20;

export default function SkillsInterestsScreen({navigation}: Props) {
  const profile = useAppSelector(state => state.auth.profile);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [error, setError] = useState('');
  const [celebrating, setCelebrating] = useState(false);

  const completeOnboarding = useSaveOnboarding();

  // ── Chip animations ──
  const chipScales = useRef<Record<string, Animated.Value>>({}).current;
  const getChipScale = (key: string) => {
    if (!chipScales[key]) {chipScales[key] = new Animated.Value(1);}
    return chipScales[key];
  };
  const pulseChip = (key: string) => {
    const v = getChipScale(key);
    Animated.sequence([
      Animated.timing(v, {toValue: 1.04, duration: 90, useNativeDriver: true}),
      Animated.timing(v, {toValue: 1, duration: 90, useNativeDriver: true}),
    ]).start();
  };

  // ── Celebration animation values ──
  const overlayFade   = useRef(new Animated.Value(0)).current;
  const cardScale     = useRef(new Animated.Value(0.72)).current;
  const cardFade      = useRef(new Animated.Value(0)).current;
  const spinAnim      = useRef(new Animated.Value(0)).current;
  const emojiRowScale = useRef(new Animated.Value(0.5)).current;
  const emojiRowFade  = useRef(new Animated.Value(0)).current;
  const subtitleFade  = useRef(new Animated.Value(0)).current;
  const karmaScale    = useRef(new Animated.Value(0.3)).current;
  const karmaFade     = useRef(new Animated.Value(0)).current;
  const ctaSlide      = useRef(new Animated.Value(22)).current;
  const ctaFade       = useRef(new Animated.Value(0)).current;

  // ── Confetti (created once) ──
  const confetti = useRef(
    Array.from({length: CONFETTI_COUNT}, (_, i) => ({
      left: ((i * 4.8) % 85) + 5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + (i % 4) * 2.5,
      isRect: i % 3 !== 0,
      delay: (i * 55) % 560,
      duration: 1600 + (i % 5) * 220,
      ty:   new Animated.Value(-30),
      fade: new Animated.Value(1),
      rot:  new Animated.Value(0),
    }))
  ).current;

  const spinInterp = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const overlayOpacity = overlayFade.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.58],
  });

  // ── Chip toggle ──
  const toggleItem = (
    values: string[],
    setValues: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    bucket: 'interests' | 'skills',
  ) => {
    pulseChip(`${bucket}:${value}`);
    if (values.includes(value)) {setValues(values.filter(item => item !== value)); return;}
    if (values.length >= MAX_SELECTIONS) {
      Toast.show({type: 'info', text1: `Max ${MAX_SELECTIONS} ${bucket}`, text2: `Remove one to add ${value}.`, position: 'top'});
      return;
    }
    setValues([...values, value]);
  };

  // ── Celebration sequence ──
  const runCelebration = () => {
    // Reset all values
    overlayFade.setValue(0); cardScale.setValue(0.72); cardFade.setValue(0);
    spinAnim.setValue(0); emojiRowScale.setValue(0.5); emojiRowFade.setValue(0);
    subtitleFade.setValue(0); karmaScale.setValue(0.3); karmaFade.setValue(0);
    ctaSlide.setValue(22); ctaFade.setValue(0);
    confetti.forEach(p => { p.ty.setValue(-30); p.fade.setValue(1); p.rot.setValue(0); });

    setCelebrating(true);

    // Confetti burst
    confetti.forEach(p => {
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.ty, {toValue: SCREEN_H * 0.72, duration: p.duration, easing: Easing.in(Easing.quad), useNativeDriver: true}),
          Animated.timing(p.fade, {toValue: 0, duration: p.duration * 0.82, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
          Animated.timing(p.rot, {toValue: 1, duration: p.duration, easing: Easing.linear, useNativeDriver: true}),
        ]),
      ]).start();
    });

    // Sparkle spin loop
    Animated.loop(
      Animated.timing(spinAnim, {toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true})
    ).start();

    // Overlay + card spring entrance
    Animated.parallel([
      Animated.timing(overlayFade, {toValue: 1, duration: 240, useNativeDriver: true}),
      Animated.spring(cardScale, {toValue: 1, tension: 180, friction: 7, useNativeDriver: true}),
      Animated.timing(cardFade, {toValue: 1, duration: 220, useNativeDriver: true}),
    ]).start();

    // Emoji row — 200ms stagger
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(emojiRowScale, {toValue: 1, tension: 200, friction: 6, useNativeDriver: true}),
        Animated.timing(emojiRowFade, {toValue: 1, duration: 260, useNativeDriver: true}),
      ]),
    ]).start();

    // Subtitle — 380ms
    Animated.sequence([
      Animated.delay(380),
      Animated.timing(subtitleFade, {toValue: 1, duration: 280, useNativeDriver: true}),
    ]).start();

    // Karma badge — 560ms, spring pop
    Animated.sequence([
      Animated.delay(560),
      Animated.parallel([
        Animated.spring(karmaScale, {toValue: 1, tension: 240, friction: 5, useNativeDriver: true}),
        Animated.timing(karmaFade, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]),
    ]).start();

    // CTA — 760ms, slide up
    Animated.sequence([
      Animated.delay(760),
      Animated.parallel([
        Animated.timing(ctaSlide, {toValue: 0, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(ctaFade, {toValue: 1, duration: 300, useNativeDriver: true}),
      ]),
    ]).start();
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(overlayFade, {toValue: 0, duration: 240, useNativeDriver: true}),
      Animated.timing(cardFade, {toValue: 0, duration: 200, useNativeDriver: true}),
    ]).start(() => setCelebrating(false));
  };

  // ── Submit ──
  const handleSubmit = () => {
    if (!profile) {setError('Profile data is missing. Please go back and try again.'); return;}
    if (!interests.length || !skills.length) {setError('Select at least one interest and one skill to continue.'); return;}
    if (!profile.avatarPath || !profile.username || !profile.fullName || !profile.city) {
      setError('Complete your identity step before finishing onboarding.'); return;
    }
    if (!(profile.shortBio || profile.bio)) {setError('Add a short bio before finishing onboarding.'); return;}

    const avatarPath = profile.avatarPath!;
    const username = profile.username!;
    const fullName = profile.fullName!;
    const city = profile.city!;

    setError('');
    runCelebration();

    setTimeout(() => {
      completeOnboarding.mutate(
        {
          growthIntent: ((profile.growthIntent?.length
            ? profile.growthIntent
            : profile.intent ? [profile.intent] : []) as GrowthIntent[]),
          avatarPath, username, fullName, city,
          shortBio: profile.shortBio || profile.bio || '',
          interests, skills,
        },
        {
          onSuccess: () => {
            Toast.show({type: 'success', text1: 'Welcome to TGC', text2: 'Your profile is ready.', position: 'top'});
          },
          onError: (err: any) => {
            setCelebrating(false);
            const msg = err?.response?.data?.message || 'Could not complete onboarding.';
            Toast.show({type: 'error', text1: 'Error', text2: msg});
          },
        },
      );
    }, 650);
  };

  return (
    <>
    <OnboardingScaffold
      step={3}
      onBack={() => navigation.goBack()}
      title="What are you into right now?"
      subtitle="Pick up to 5 interests and 5 skills. These shape your feed and community matches."
      footer={(
        <Button title="Start My Journey" onPress={handleSubmit} loading={completeOnboarding.isPending} style={styles.cta} />
      )}>
      <SurfaceCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <Text style={styles.sectionMeta}>{interests.length}/{MAX_SELECTIONS}</Text>
        </View>
        <View style={styles.chipsWrap}>
          {INTEREST_OPTIONS.map(item => {
            const selected = interests.includes(item);
            return (
              <Animated.View key={item} style={{transform: [{scale: getChipScale(`interests:${item}`)}]}}>
                <TouchableOpacity
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleItem(interests, setInterests, item, 'interests')}
                  activeOpacity={0.85}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        <View style={[styles.sectionHeader, styles.skillsHeader]}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.sectionMeta}>{skills.length}/{MAX_SELECTIONS}</Text>
        </View>
        <View style={styles.chipsWrap}>
          {SKILL_OPTIONS.map(item => {
            const selected = skills.includes(item);
            return (
              <Animated.View key={item} style={{transform: [{scale: getChipScale(`skills:${item}`)}]}}>
                <TouchableOpacity
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleItem(skills, setSkills, item, 'skills')}
                  activeOpacity={0.85}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </SurfaceCard>

    </OnboardingScaffold>

      {/* ── Celebration overlay (Modal = covers full screen + status bar on Android) ── */}
      <Modal visible={celebrating} transparent animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.overlay, {opacity: overlayOpacity}]}>
          {/* Confetti */}
          {confetti.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left: `${p.left}%` as any,
                width: p.size,
                height: p.isRect ? p.size * 1.8 : p.size,
                borderRadius: p.isRect ? 2 : p.size / 2,
                backgroundColor: p.color,
                opacity: p.fade,
                transform: [
                  {translateY: p.ty},
                  {rotate: p.rot.interpolate({inputRange: [0, 1], outputRange: ['0deg', '540deg']})},
                ],
              }}
            />
          ))}

          {/* Card */}
          <Animated.View style={[styles.celebrationCard, {opacity: cardFade, transform: [{scale: cardScale}]}]}>
            {/* Background depth circles */}
            <View style={[styles.bgCircle, styles.bgCircleTopRight]} />
            <View style={[styles.bgCircle, styles.bgCircleBottomLeft]} />

            {/* Rotating sparkle with glow */}
            <View style={styles.sparkleWrap}>
              <View style={styles.sparkleGlow} />
              <Animated.Text style={[styles.sparkleIcon, {transform: [{rotate: spinInterp}]}]}>✨</Animated.Text>
            </View>

            {/* Emoji burst row */}
            <Animated.View style={[styles.emojiRow, {opacity: emojiRowFade, transform: [{scale: emojiRowScale}]}]}>
              {['🎊', '🎉', '🚀', '🎊'].map((e, idx) => (
                <Text key={idx} style={styles.emojiItem}>{e}</Text>
              ))}
            </Animated.View>

            {/* Title */}
            <Text style={styles.celebTitle}>Welcome to TGC</Text>

            {/* Subtitle */}
            <Animated.Text style={[styles.celebSubtitle, {opacity: subtitleFade}]}>
              Your journey starts now ✨
            </Animated.Text>

            {/* Divider */}
            <Animated.View style={[styles.divider, {opacity: subtitleFade}]} />

            {/* Karma badge */}
            <Animated.View style={[styles.karmaBadge, {opacity: karmaFade, transform: [{scale: karmaScale}]}]}>
              <Text style={styles.karmaEmoji}>⭐</Text>
              <View>
                <Text style={styles.karmaValue}>+100 Karma Earned</Text>
                <Text style={styles.karmaLabel}>Welcome bonus</Text>
              </View>
            </Animated.View>

            {/* CTA */}
            <Animated.View style={[styles.ctaWrap, {opacity: ctaFade, transform: [{translateY: ctaSlide}]}]}>
              <TouchableOpacity style={styles.ctaBtn} onPress={handleDismiss} activeOpacity={0.85}>
                <Text style={styles.ctaBtnText}>Let's Go!  🚀</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Skills/Interests ──
  card: {paddingHorizontal: 20, paddingVertical: 20},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  sectionTitle: {color: TGC_COLORS.textPrimary, fontSize: 18, fontWeight: '800'},
  sectionMeta: {color: TGC_COLORS.textTertiary, fontSize: 12, fontWeight: '700'},
  skillsHeader: {marginTop: 18},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  chip: {
    minHeight: 44, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 999, borderWidth: 2, borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.white, justifyContent: 'center',
  },
  chipSelected: {
    borderColor: TGC_COLORS.mint, backgroundColor: '#EEF9F6',
    shadowColor: TGC_COLORS.mint, shadowOpacity: 0.2,
    shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 1,
  },
  chipText: {color: TGC_COLORS.textSecondary, fontSize: 14, fontWeight: '600'},
  chipTextSelected: {color: TGC_COLORS.textPrimary, fontWeight: '700'},
  error: {marginTop: 14, color: '#D14A4A', fontSize: 13, fontWeight: '600'},
  cta: {borderRadius: 20},

  // ── Overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 42, 38, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Celebration card ──
  celebrationCard: {
    width: '88%',
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 28,
    backgroundColor: TGC_COLORS.white,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: TGC_COLORS.coral,
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 14},
    elevation: 12,
  },

  // Background decoration circles
  bgCircle: {position: 'absolute', borderRadius: 9999},
  bgCircleTopRight: {
    width: 180, height: 180,
    top: -60, right: -50,
    backgroundColor: 'rgba(200,182,255,0.1)',
  },
  bgCircleBottomLeft: {
    width: 140, height: 140,
    bottom: -40, left: -40,
    backgroundColor: 'rgba(125,211,192,0.1)',
  },

  // Sparkle
  sparkleWrap: {alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  sparkleGlow: {
    position: 'absolute',
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,209,102,0.22)',
  },
  sparkleIcon: {fontSize: 34},

  // Emoji row
  emojiRow: {flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 2},
  emojiItem: {fontSize: 28},

  // Text hierarchy
  celebTitle: {
    marginTop: 14,
    color: TGC_COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  celebSubtitle: {
    marginTop: 8,
    color: TGC_COLORS.coral,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Divider
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: TGC_COLORS.border,
    marginVertical: 22,
  },

  // Karma badge
  karmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF9F6',
    borderWidth: 1.5,
    borderColor: TGC_COLORS.mint,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: '100%',
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  karmaEmoji: {fontSize: 26},
  karmaValue: {
    color: TGC_COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  karmaLabel: {
    color: TGC_COLORS.mint,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },

  // CTA
  ctaWrap: {width: '100%', marginTop: 22},
  ctaBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TGC_COLORS.coral,
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
