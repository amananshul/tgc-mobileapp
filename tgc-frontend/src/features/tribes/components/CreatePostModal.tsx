import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Button from '../../../components/ui/Button';
import {TGC_COLORS, TGC_RADIUS, TGC_SPACING} from '../../../theme/tgcTheme';
import type {CreateTribePostPayload} from '../../../types/auth';
import {pickImageFromDevice} from '../../../utils/media/pickImage';
import {uploadAndAttachTribePostImage} from '../../../services/mediaUpload.service';

interface CreatePostModalProps {
  visible: boolean;
  tribeId: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTribePostPayload) => Promise<void> | void;
}

export default function CreatePostModal({
  visible,
  tribeId,
  loading = false,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imagePath, setImagePath] = useState<string | undefined>(undefined);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!visible) {
      setContent('');
      setImagePath(undefined);
      setImagePreviewUri(null);
      setIsUploadingImage(false);
    }
  }, [visible]);

  const handleAttachImage = async () => {
    try {
      const pickedImage = await pickImageFromDevice();
      if (!pickedImage) return;

      setIsUploadingImage(true);
      const uploadedPath = await uploadAndAttachTribePostImage(tribeId, pickedImage);
      setImagePath(uploadedPath);
      setImagePreviewUri(pickedImage.uri);

      Toast.show({
        type: 'success',
        text1: 'Image attached',
        position: 'top',
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not upload image. Try again.';
      Toast.show({
        type: 'error',
        text1: 'Image upload failed',
        text2: msg,
        position: 'top',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isUploadingImage) {
      return;
    }

    await onSubmit({
      content: trimmedContent,
      imagePath,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Create Post</Text>
          <Text style={styles.subtitle}>
            Share an update with tribe members.
          </Text>

          <Text style={styles.label}>Content</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="What’s happening in your tribe?"
            placeholderTextColor={TGC_COLORS.textTertiary}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          <Text style={styles.label}>Image (optional)</Text>
          <View style={styles.mediaCard}>
            {imagePreviewUri ? (
              <Image
                source={{uri: imagePreviewUri}}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewPlaceholderText}>
                  Attach a photo from your device
                </Text>
              </View>
            )}

            <View style={styles.mediaActionsRow}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handleAttachImage}
                activeOpacity={0.75}
                disabled={isUploadingImage}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={TGC_COLORS.textPrimary} />
                ) : (
                  <Text style={styles.attachBtnText}>
                    {imagePath ? 'Replace Photo' : 'Attach Photo'}
                  </Text>
                )}
              </TouchableOpacity>

              {imagePath ? (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    setImagePath(undefined);
                    setImagePreviewUri(null);
                  }}
                  activeOpacity={0.75}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              compact
              style={styles.actionBtn}
            />
            <Button
              title="Post"
              onPress={handleSubmit}
              loading={loading}
              disabled={!content.trim() || isUploadingImage}
              compact
              style={styles.actionBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45,42,38,0.28)',
  },
  sheet: {
    backgroundColor: TGC_COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 10,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.border,
    marginBottom: 12,
  },
  title: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  label: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  contentInput: {
    minHeight: 120,
    borderRadius: TGC_RADIUS.input,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.bgSecondary,
    color: TGC_COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  mediaCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.bgSecondary,
    padding: 10,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: TGC_COLORS.border,
  },
  previewPlaceholder: {
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  previewPlaceholderText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  mediaActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  attachBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(125,211,192,0.18)',
    borderWidth: 1,
    borderColor: TGC_COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  attachBtnText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  removeBtn: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,139,123,0.12)',
    borderWidth: 1,
    borderColor: TGC_COLORS.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  removeBtnText: {
    color: TGC_COLORS.coral,
    fontSize: 13,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
  },
});

