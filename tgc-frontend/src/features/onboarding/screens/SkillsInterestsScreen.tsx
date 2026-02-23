import React, {useRef, useState} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
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
import {useUpdateProfile} from '../../profile/hooks/useUpdateProfile';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SkillsInterests'>;
};

export default function SkillsInterestsScreen({navigation}: Props) {
  const profile = useAppSelector(state => state.auth.profile);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [error, setError] = useState('');
  const [celebrating, setCelebrating] = useState(false);

  const updateProfile = useUpdateProfile();

  const scale = useRef(new Animated.Value(0.84)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const toggleItem = (
    values: string[],
    setValues: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setValues(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  const runCelebration = () => {
    setCelebrating(true);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = () => {
    if (!interests.length || !skills.length) {
      setError('Select at least one interest and one skill to continue.');
      return;
    }

    setError('');
    runCelebration();

    setTimeout(() => {
      updateProfile.mutate(
        {
          interests,
          skills,
        },
        {
          onError: (err: any) => {
            setCelebrating(false);
            scale.setValue(0.84);
            opacity.setValue(0);
            const msg = err?.response?.data?.message || 'Could not complete onboarding.';
            Toast.show({type: 'error', text1: 'Error', text2: msg});
          },
        },
      );
    }, 900);
  };

  return (
    <OnboardingScaffold
      step={3}
      onBack={() => navigation.goBack()}
      title="What are you good at or curious about?"
      footer={(
        <Button
          title="Start My Journey"
          onPress={handleSubmit}
          loading={updateProfile.isPending}
          style={styles.cta}
        />
      )}>
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.chipsWrap}>
          {INTEREST_OPTIONS.map(item => {
            const selected = interests.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleItem(interests, setInterests, item)}
                activeOpacity={0.85}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, styles.skillsTitle]}>Skills</Text>
        <View style={styles.chipsWrap}>
          {SKILL_OPTIONS.map(item => {
            const selected = skills.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleItem(skills, setSkills, item)}
                activeOpacity={0.85}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </SurfaceCard>

      {celebrating ? (
        <View style={styles.celebrationOverlay}>
          <Animated.View
            style={[
              styles.celebrationCard,
              {
                opacity,
                transform: [{scale}],
              },
            ]}>
            <Text style={styles.celebrationIcon}>🎉</Text>
            <Text style={styles.celebrationTitle}>Welcome to TGC</Text>
            <Text style={styles.celebrationMessage}>Let’s build something together.</Text>
          </Animated.View>
        </View>
      ) : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  skillsTitle: {
    marginTop: 18,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.white,
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: TGC_COLORS.mint,
    backgroundColor: 'rgba(125, 211, 192, 0.18)',
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  chipText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: TGC_COLORS.textPrimary,
  },
  error: {
    marginTop: 14,
    color: '#D14A4A',
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    borderRadius: 20,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 42, 38, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCard: {
    width: '84%',
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 24,
    backgroundColor: TGC_COLORS.white,
    alignItems: 'center',
    shadowColor: TGC_COLORS.coral,
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 4,
  },
  celebrationIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  celebrationTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  celebrationMessage: {
    marginTop: 8,
    color: TGC_COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});
