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
} from 'react-native';
import Button from '../../../components/ui/Button';
import {TGC_COLORS, TGC_RADIUS, TGC_SPACING} from '../../../theme/tgcTheme';
import type {CreateTribePostPayload} from '../../../types/auth';

interface CreatePostModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTribePostPayload) => Promise<void> | void;
}

export default function CreatePostModal({
  visible,
  loading = false,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!visible) {
      setContent('');
      setImageUrl('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    await onSubmit({
      content: trimmedContent,
      imageUrl: imageUrl.trim() || undefined,
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

          <Text style={styles.label}>Image URL (optional)</Text>
          <TextInput
            style={styles.urlInput}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={TGC_COLORS.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
          />

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
              disabled={!content.trim()}
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
  urlInput: {
    minHeight: 50,
    borderRadius: TGC_RADIUS.input,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.bgSecondary,
    color: TGC_COLORS.textPrimary,
    paddingHorizontal: 14,
    fontSize: 14,
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
