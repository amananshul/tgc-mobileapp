import React, {useState} from 'react';
import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import OnboardingScaffold from '../components/OnboardingScaffold';
import Button from '../../../components/ui/Button';
import {INTENT_OPTIONS} from '../constants';
import {TGC_COLORS} from '../../../theme/tgcTheme';
import type {OnboardingStackParamList} from '../../../app/navigation/OnboardingStack';
import {useAppSelector} from '../../../store/hooks';
import {useUpdateProfile} from '../../profile/hooks/useUpdateProfile';
import type {ProfileIntent} from '../../../types/auth';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Intent'>;
};

export default function IntentScreen({navigation}: Props) {
  const profile = useAppSelector(state => state.auth.profile);
  const initialIntent = (profile?.intent as Exclude<ProfileIntent, null>) || undefined;
  const [intent, setIntent] = useState<Exclude<ProfileIntent, null> | undefined>(initialIntent);
  const updateProfile = useUpdateProfile();
  const selectedOption = INTENT_OPTIONS.find(option => option.id === intent);

  const handleNext = () => {
    if (!intent) {
      Toast.show({type: 'error', text1: 'Choose one path', text2: 'Select Learn, Earn, or Entertain to continue.'});
      return;
    }

    updateProfile.mutate(
      {intent},
      {
        onSuccess: () => navigation.navigate('Identity'),
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Could not save your intent.';
          Toast.show({type: 'error', text1: 'Error', text2: msg});
        },
      },
    );
  };

  return (
    <OnboardingScaffold
      step={1}
      title="How do you want to grow inside TGC?"
      footer={(
        <Button
          title="Next"
          onPress={handleNext}
          loading={updateProfile.isPending}
          style={[
            styles.cta,
            selectedOption?.accent === 'mint'
              ? styles.ctaMint
              : selectedOption?.accent === 'coral'
                ? styles.ctaCoral
                : styles.ctaLavender,
          ]}
        />
      )}>
      <View style={styles.cardsWrap}>
        {INTENT_OPTIONS.map(option => {
          const selected = option.id === intent;
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
            <TouchableOpacity
              key={option.id}
              onPress={() => setIntent(option.id)}
              activeOpacity={0.9}
              style={[
                styles.card,
                selected && selectedCardStyle,
              ]}>
              <View style={[styles.iconBubble, iconBubbleStyle]}>
                <Text style={styles.iconText}>{option.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  cardsWrap: {
    gap: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: TGC_COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    padding: 20,
    minHeight: 124,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#C1BAB0',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },
  cardSelectedMint: {
    borderWidth: 2,
    borderColor: TGC_COLORS.mint,
    shadowColor: TGC_COLORS.mint,
  },
  cardSelectedCoral: {
    borderWidth: 2,
    borderColor: TGC_COLORS.coral,
    shadowColor: TGC_COLORS.coral,
  },
  cardSelectedLavender: {
    borderWidth: 2,
    borderColor: TGC_COLORS.lavender,
    shadowColor: TGC_COLORS.lavender,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconBubbleMint: {
    backgroundColor: 'rgba(125,211,192,0.15)',
  },
  iconBubbleCoral: {
    backgroundColor: 'rgba(255,139,123,0.15)',
  },
  iconBubbleLavender: {
    backgroundColor: 'rgba(200,182,255,0.2)',
  },
  iconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDescription: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    borderRadius: 20,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },
  ctaMint: {
    shadowColor: TGC_COLORS.mint,
  },
  ctaCoral: {
    shadowColor: TGC_COLORS.coral,
  },
  ctaLavender: {
    shadowColor: TGC_COLORS.lavender,
  },
});
