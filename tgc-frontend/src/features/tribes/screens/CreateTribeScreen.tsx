import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Upload} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import AppBackground from '../../../components/ui/AppBackground';
import SoftGradient from '../../../components/ui/SoftGradient';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import {useAppSelector} from '../../../store/hooks';
import {useCreateTribe} from '../hooks/useCreateTribe';
import {useUploadTribeCover} from '../hooks/useUploadTribeCover';
import {pickImageFromDevice} from '../../../utils/media/pickImage';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_RADIUS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type {AppStackParamList} from '../../../app/navigation/AppStack';

export default function CreateTribeScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAppSelector(state => state.auth.user);
  const createTribe = useCreateTribe();
  const uploadCover = useUploadTribeCover();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [coverImage, setCoverImage] = useState<{uri: string} | null>(null);
  const [coverPath, setCoverPath] = useState<string | null>(null);

  const canCreate = user?.role === 'HOST' || user?.role === 'ADMIN';

  const handlePickCover = async () => {
    try {
      const image = await pickImageFromDevice();
      if (!image) return;
      setCoverImage({uri: image.uri});
      
      // Upload immediately
      const result = await uploadCover.mutateAsync({
        image,
        tribeId: 'temp', // Will be replaced by backend
      });
      setCoverPath(result.path);
      Toast.show({
        type: 'success',
        text1: 'Cover uploaded',
        position: 'top',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Cover upload failed',
        text2: err?.message || 'Could not upload cover',
        position: 'top',
      });
    }
  };

  const handleSubmit = async () => {
    if (!canCreate || !name.trim()) {
      return;
    }

    const result = await createTribe.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      coverImagePath: coverPath || undefined,
      category: category.trim() || 'general',
      visibility,
    });

    navigation.replace('TribeDetail', {slug: result.tribe.slug});
  };

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <SoftGradient
          colors={TGC_GRADIENTS.lavender}
          style={[styles.header, {paddingTop: insets.top + 12}]}
          intensity={0.56}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}>
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Tribe</Text>
            <View style={styles.backBtn} />
          </View>
          <Text style={styles.headerSubtitle}>
            Build a community and start sharing updates with members.
          </Text>
        </SoftGradient>

        {!canCreate ? (
          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>Host access required</Text>
            <Text style={styles.cardText}>
              Enable Host mode from your Profile to create tribes.
            </Text>
            <Button
              title="Back to Profile"
              onPress={() => navigation.goBack()}
              style={styles.submitBtn}
            />
          </SurfaceCard>
        ) : (
          <SurfaceCard style={styles.card}>
            <Text style={styles.sectionLabel}>Cover Image (optional)</Text>
            <TouchableOpacity
              style={styles.coverUpload}
              onPress={handlePickCover}
              disabled={uploadCover.isPending}
              activeOpacity={0.7}>
              {coverImage ? (
                <Image
                  source={coverImage}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Upload size={32} color={TGC_COLORS.lavender} />
                  <Text style={styles.coverPlaceholderText}>
                    {uploadCover.isPending ? 'Uploading...' : 'Tap to upload cover'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Input
              label="Name"
              placeholder="e.g. Indie Filmmakers"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              accentColor={TGC_COLORS.lavender}
            />

            <Input
              label="Description (optional)"
              placeholder="What is this tribe about?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accentColor={TGC_COLORS.lavender}
            />

            <Input
              label="Category"
              placeholder="general"
              value={category}
              onChangeText={setCategory}
              autoCapitalize="none"
              accentColor={TGC_COLORS.lavender}
            />

            <Text style={styles.visibilityLabel}>Visibility</Text>
            <View style={styles.visibilityRow}>
              {(['PUBLIC', 'PRIVATE'] as const).map(option => {
                const active = visibility === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.visibilityPill,
                      active && styles.visibilityPillActive,
                    ]}
                    onPress={() => setVisibility(option)}
                    activeOpacity={0.75}>
                    <Text
                      style={[
                        styles.visibilityText,
                        active && styles.visibilityTextActive,
                      ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Create Tribe"
              onPress={handleSubmit}
              loading={createTribe.isPending}
              disabled={!name.trim()}
              style={styles.submitBtn}
            />
          </SurfaceCard>
        )}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 22,
    shadowColor: TGC_COLORS.lavender,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    marginTop: 16,
    marginHorizontal: TGC_SPACING.pageHorizontal,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  cardText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  sectionLabel: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  coverUpload: {
    width: '100%',
    height: 160,
    borderRadius: TGC_RADIUS.card,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    borderStyle: 'dashed',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TGC_COLORS.bgSecondary,
  },
  coverPlaceholderText: {
    marginTop: 8,
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  visibilityLabel: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 7,
    fontWeight: '600',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityPill: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityPillActive: {
    borderColor: TGC_COLORS.lavender,
    backgroundColor: 'rgba(200,182,255,0.18)',
  },
  visibilityText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  visibilityTextActive: {
    color: TGC_COLORS.lavender,
  },
  submitBtn: {
    marginTop: 14,
  },
});
