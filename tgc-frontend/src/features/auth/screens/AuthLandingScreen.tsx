import React, {useState} from 'react';
import {Text, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import {useMutation} from '@tanstack/react-query';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import BrandWordmark from '../../../components/ui/BrandWordmark';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import {TGC_COLORS, TGC_SHADOWS, TGC_SPACING} from '../../../theme/tgcTheme';
import type {AuthStackParamList} from '../../../app/navigation/AuthStack';
import {sendEmailOtp} from '../api/supabaseAuth.api';
import {signInWithGoogle} from '../api/auth.supabase';
import {storeSupabaseSessionAndDispatch} from '../../../store/slices/authSlice';
import {useAppDispatch} from '../../../store/hooks';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'AuthLanding'>;
};

export default function AuthLandingScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');

  const sendOtp = useMutation({
    mutationFn: (value: string) => sendEmailOtp(value),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'OTP sent',
        text2: 'Check your email for the 6-digit code.',
        position: 'top',
      });
      navigation.navigate('OtpVerify', {identifier: email.trim().toLowerCase()});
    },
    onError: (err: any) => {
      console.error('[AuthLanding] sendEmailOtp error', {
        message: err?.message,
        status: err?.status,
        name: err?.name,
      });
      const msg =
        err?.message?.includes('rate limit') || err?.message?.includes('too many')
          ? 'Too many requests — wait a moment and try again.'
          : err?.message || 'Could not send OTP. Please try again.';
      Toast.show({type: 'error', text1: 'Send OTP failed', text2: msg, position: 'top'});
    },
  });

  const googleAuth = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: async session => {
      try {
        await storeSupabaseSessionAndDispatch(dispatch, session);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Could not finish sign-in';
        Toast.show({type: 'error', text1: 'Login failed', text2: msg, position: 'top'});
      }
    },
    onError: (err: any) => {
      console.error('[AuthLanding] google sign-in error', {
        message: err?.message,
        code: err?.code,
        fullError: err,
      });
      const msg = err?.message || 'Google sign-in failed';
      Toast.show({type: 'error', text1: 'Google sign-in failed', text2: msg, position: 'top'});
    },
  });

  const handleSendOtp = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Toast.show({
        type: 'error',
        text1: 'Enter your email',
        text2: 'A valid email address is required to continue.',
        position: 'top',
      });
      return;
    }
    sendOtp.mutate(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBackground>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 12) + 20},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandWordmark subtitle="Where communities come alive" />

          <SurfaceCard style={styles.formCard}>
            <Input
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              containerStyle={styles.inputWrap}
            />

            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={sendOtp.isPending}
              style={styles.submitBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continue with Google"
              onPress={() => requestAnimationFrame(() => googleAuth.mutate())}
              variant="outline"
              compact
              loading={googleAuth.isPending}
            />

            <Text style={styles.footer}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </SurfaceCard>
        </ScrollView>
      </AppBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: TGC_COLORS.bgPrimary},
  container: {
    flexGrow: 1,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
  },
  formCard: {
    marginTop: 38,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputWrap: {
    marginBottom: 22,
  },
  submitBtn: {
    borderRadius: 18,
    ...TGC_SHADOWS.cta,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: TGC_COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: TGC_COLORS.textTertiary,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 20,
    color: TGC_COLORS.textTertiary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  footerLink: {
    color: TGC_COLORS.coral,
    fontWeight: '700',
  },
});
