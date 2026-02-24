import React, {useMemo, useState} from 'react';
import {Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import OnboardingScaffold from '../components/OnboardingScaffold';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import {TGC_COLORS} from '../../../theme/tgcTheme';
import type {OnboardingStackParamList} from '../../../app/navigation/OnboardingStack';
import {useAppSelector} from '../../../store/hooks';
import {useUpdateProfile} from '../../profile/hooks/useUpdateProfile';
import {useUploadAvatar} from '../../profile/hooks/useUploadAvatar';
import {pickImageFromDevice} from '../../../utils/media/pickImage';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Identity'>;
};

export default function IdentityScreen({navigation}: Props) {
  const profile = useAppSelector(state => state.auth.profile);
  const [avatarPath, setAvatarPath] = useState(profile?.avatarPath ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const bioRemaining = 120 - bio.length;

  const initials = useMemo(() => {
    const source = fullName || username || 'TGC';
    return source
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [fullName, username]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!avatarPath.trim()) {
      nextErrors.avatar = 'Profile avatar is required';
    }
    if (!username.trim() || username.trim().length < 3) {
      nextErrors.username = 'Username must be at least 3 characters';
    }
    if (!fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }
    if (!city.trim()) {
      nextErrors.city = 'City is required';
    }
    if (!bio.trim()) {
      nextErrors.bio = 'Tell people a little about you';
    } else if (bio.length > 120) {
      nextErrors.bio = 'Bio must be 120 characters or fewer';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    updateProfile.mutate(
      {
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        city: city.trim(),
        bio: bio.trim(),
      },
      {
        onSuccess: () => navigation.navigate('SkillsInterests'),
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Could not save identity details.';
          Toast.show({type: 'error', text1: 'Error', text2: msg});
        },
      },
    );
  };

  const handleUploadAvatar = async () => {
    try {
      const pickedImage = await pickImageFromDevice();
      if (!pickedImage) return;

      uploadAvatar.mutate(pickedImage, {
      onSuccess: data => {
          setAvatarPath(data.profile.avatarPath ?? '');
          setAvatarUrl(data.profile.avatarUrl ?? '');
          setErrors(prev => {
            const next = {...prev};
            delete next.avatar;
            return next;
          });
        Toast.show({
          type: 'success',
          text1: 'Avatar uploaded',
          text2: 'Your profile photo is ready.',
        });
      },
      });
    } catch (err: any) {
      const msg = err?.message || 'Could not open image picker.';
      Toast.show({type: 'error', text1: 'Error', text2: msg});
    }
  };

  return (
    <OnboardingScaffold
      step={2}
      onBack={() => navigation.goBack()}
      title="Build your community identity"
      footer={(
        <Button
          title="Next"
          onPress={handleNext}
          loading={updateProfile.isPending}
          style={styles.cta}
        />
      )}>
      <SurfaceCard style={styles.identityCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleUploadAvatar}
          style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{uri: avatarUrl}} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.microcopy}>Faces build trust in communities.</Text>
        {errors.avatar ? <Text style={styles.avatarError}>{errors.avatar}</Text> : null}

        <TouchableOpacity
          onPress={handleUploadAvatar}
          style={styles.avatarAction}
          activeOpacity={0.85}
          disabled={uploadAvatar.isPending}>
          <Text style={styles.avatarActionText}>
            {uploadAvatar.isPending
              ? 'Uploading...'
              : avatarPath
                ? 'Change Avatar'
                : 'Choose Avatar Photo'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.uploadHint}>
          Pick a photo from your device. We compress it before upload to save data.
        </Text>

        <Input
          label="Username"
          placeholder="e.g. alex.builds"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          error={errors.username}
        />

        <Input
          label="Full Name"
          placeholder="Your full name"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
        />

        <Input
          label="City"
          placeholder="e.g. Mumbai"
          value={city}
          onChangeText={setCity}
          error={errors.city}
        />

        <Input
          label="Short Bio"
          placeholder="What do you enjoy building with others?"
          value={bio}
          onChangeText={setBio}
          maxLength={120}
          multiline
          error={errors.bio}
          containerStyle={styles.bioInputWrap}
        />
        <Text style={[styles.counter, bioRemaining < 0 && styles.counterError]}>
          {bio.length}/120
        </Text>
      </SurfaceCard>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: TGC_COLORS.lavender,
    borderStyle: 'dashed',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F4FF',
    overflow: 'hidden',
    marginBottom: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 38,
    fontWeight: '800',
    color: TGC_COLORS.textPrimary,
  },
  microcopy: {
    textAlign: 'center',
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  avatarAction: {
    alignSelf: 'center',
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: TGC_COLORS.bgSecondary,
  },
  avatarActionText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  avatarError: {
    textAlign: 'center',
    color: '#D14A4A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  uploadBtn: {
    marginTop: 2,
    marginBottom: 8,
  },
  uploadHint: {
    marginBottom: 10,
    color: TGC_COLORS.textTertiary,
    fontSize: 12,
    lineHeight: 16,
  },
  bioInputWrap: {
    marginBottom: 2,
  },
  counter: {
    textAlign: 'right',
    fontSize: 12,
    color: TGC_COLORS.textTertiary,
    marginBottom: 4,
  },
  counterError: {
    color: '#D14A4A',
  },
  cta: {
    borderRadius: 20,
  },
});
