import React, {useMemo, useRef, useState} from 'react';
import {Text, View, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import OnboardingScaffold from '../components/OnboardingScaffold';
import Button from '../../../components/ui/Button';
import {INTENT_OPTIONS} from '../constants';
import {TGC_COLORS} from '../../../theme/tgcTheme';
import type {OnboardingStackParamList} from '../../../app/navigation/OnboardingStack';
import {useAppSelector} from '../../../store/hooks';
import {useUpdateProfile} from '../../profile/hooks/useUpdateProfile';
import type {GrowthIntent, ProfileIntent} from '../../../types/auth';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Intent'>;
};

function deriveLegacyIntent(intents: GrowthIntent[]): Exclude<ProfileIntent, null> | undefined {
  const match = intents.find(v => v === 'LEARN' || v === 'EARN' || v === 'ENTERTAIN');
  return match as Exclude<ProfileIntent, null> | undefined;
}

export default function IntentScreen({navigation}: Props) {
  const profile = useAppSelector(state => state.auth.profile);
  const initialIntents =
    profile?.growthIntent?.length
      ? profile.growthIntent
      : profile?.intent
        ? [profile.intent]
        : [];

  const [intents, setIntents] = useState<GrowthIntent[]>(initialIntents);
  const updateProfile = useUpdateProfile();
  const scalesRef = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(INTENT_OPTIONS.map(option => [option.id, new Animated.Value(1)])),
  );

  const selectedCount = intents.length;
  const selectedAccent = useMemo(() => {
    const first = INTENT_OPTIONS.find(option => intents.includes(option.id));
    return first?.accent ?? 'coral';
  }, [intents]);

  const animateTap = (id: string) => {
    const scale = scalesRef.current[id];
    if (!scale) {
      return;
    }
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.04,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleIntent = (id: GrowthIntent) => {
    animateTap(id);
    setIntents(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (!intents.length) {
      Toast.show({
        type: 'error',
        text1: 'Pick at least one goal',
        text2: 'Select how you want to grow inside TGC.',
      });
      return;
    }

    updateProfile.mutate(
      {
        growthIntent: intents,
        intent: deriveLegacyIntent(intents),
      },
      {
        onSuccess: () => navigation.navigate('Identity'),
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Could not save your growth goals.';
          Toast.show({type: 'error', text1: 'Error', text2: msg});
        },
      },
    );
  };

  return (
    <OnboardingScaffold
      step={1}
      title="How do you want to grow inside TGC?"
      subtitle="Pick one or more. You can update this later."
      footer={
        <Button
          title={selectedCount ? `Next (${selectedCount})` : 'Next'}
          onPress={handleNext}
          loading={updateProfile.isPending}
          style={[
            styles.cta,
            selectedAccent === 'mint'
              ? styles.ctaMint
              : selectedAccent === 'lavender'
                ? styles.ctaLavender
                : styles.ctaCoral,
          ]}
        />
      }>
      <View style={styles.cardsWrap}>
        {INTENT_OPTIONS.map(option => {
          const selected = intents.includes(option.id);
          const selectedCardStyle =
            option.accent === 'mint'
              ? styles.cardSelectedMint
              : option.accent === 'coral'
                ? styles.cardSelectedCoral
                : styles.cardSelectedLavender;
          const iconBubbleStyle =
            option.accent === 'mint'
              ? styles.iconBubbleMint
              : option.accent === 'coral'
                ? styles.iconBubbleCoral
                : styles.iconBubbleLavender;

          return (
            <Animated.View
              key={option.id}
              style={{transform: [{scale: scalesRef.current[option.id]}]}}>
              <TouchableOpacity
                onPress={() => toggleIntent(option.id)}
                activeOpacity={0.9}
                style={[styles.card, selected && selectedCardStyle]}>
                <View style={[styles.iconBubble, iconBubbleStyle]}>
                  <Text style={styles.iconText}>{option.icon}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  cardsWrap: {
    gap: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: TGC_COLORS.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: TGC_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#C1BAB0',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 1,
  },
  cardSelectedMint: {
    borderWidth: 2,
    borderColor: TGC_COLORS.mint,
    backgroundColor: '#EEF9F6',
  },
  cardSelectedCoral: {
    borderWidth: 2,
    borderColor: TGC_COLORS.coral,
    backgroundColor: '#FFF1EF',
  },
  cardSelectedLavender: {
    borderWidth: 2,
    borderColor: TGC_COLORS.lavender,
    backgroundColor: '#F3EFFF',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleMint: {},
  iconBubbleCoral: {},
  iconBubbleLavender: {},
  iconText: {fontSize: 22},
  cardContent: {flex: 1},
  cardTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardDescription: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    borderRadius: 20,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },
  ctaMint: {shadowColor: TGC_COLORS.mint},
  ctaCoral: {shadowColor: TGC_COLORS.coral},
  ctaLavender: {shadowColor: TGC_COLORS.lavender},
});
