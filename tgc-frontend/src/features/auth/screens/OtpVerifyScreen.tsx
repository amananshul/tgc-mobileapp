import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {useMutation} from '@tanstack/react-query';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import Button from '../../../components/ui/Button';
import {TGC_COLORS, TGC_SHADOWS, TGC_SPACING} from '../../../theme/tgcTheme';
import type {AuthStackParamList} from '../../../app/navigation/AuthStack';
import {sendEmailOtp, verifyEmailOtp} from '../api/supabaseAuth.api';
import {storeSupabaseSessionAndDispatch} from '../../../store/slices/authSlice';
import {useAppDispatch} from '../../../store/hooks';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OtpVerify'>;
  route: RouteProp<AuthStackParamList, 'OtpVerify'>;
};

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

export default function OtpVerifyScreen({navigation, route}: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const identifier = route.params.identifier;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const masked = useMemo(() => {
    const [name = '', domain = ''] = identifier.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }, [identifier]);

  const resendOtp = useMutation({
    mutationFn: () => sendEmailOtp(identifier),
    onSuccess: () => {
      setSecondsLeft(RESEND_SECONDS);
      Toast.show({type: 'success', text1: 'Code resent', position: 'top'});
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Resend failed',
        text2: err?.message || 'Try again',
        position: 'top',
      });
    },
  });

  const verify = useMutation({
    mutationFn: (token: string) => verifyEmailOtp(identifier, token),
    onSuccess: async session => {
      try {
        await storeSupabaseSessionAndDispatch(dispatch, session);
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Login failed',
          text2: err?.response?.data?.message || err?.message || 'Could not fetch your profile.',
          position: 'top',
        });
      }
    },
    onError: (err: any) => {
      const msg =
        err?.message?.toLowerCase().includes('expired') ||
        err?.message?.toLowerCase().includes('invalid')
          ? 'Code is invalid or expired — request a new one.'
          : err?.message || 'Please check the code and try again.';
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: msg,
        position: 'top',
      });
    },
  });

  const handleVerify = () => {
    const token = code.replace(/\D+/g, '');
    if (token.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Enter the full code',
        text2: 'Use the one-time code we sent you.',
        position: 'top',
      });
      return;
    }
    verify.mutate(token);
  };

  const digits = Array.from({length: OTP_LENGTH}, (_, i) => code[i] ?? '');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBackground>
        <View
          style={[
            styles.container,
            {paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 12) + 16},
          ]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <SurfaceCard style={styles.card}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the {OTP_LENGTH}-digit code sent to {masked}
            </Text>

            <TouchableOpacity activeOpacity={0.9} onPress={() => inputRef.current?.focus()}>
              <View style={styles.otpRow}>
                {digits.map((digit, index) => (
                  <View key={index} style={styles.otpCell}>
                    <Text style={styles.otpDigit}>{digit || ' '}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={value => setCode(value.replace(/\D+/g, '').slice(0, OTP_LENGTH))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              style={styles.hiddenInput}
              maxLength={OTP_LENGTH}
              onSubmitEditing={handleVerify}
            />

            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              loading={verify.isPending}
              style={styles.submitBtn}
            />

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't get a code?</Text>
              <TouchableOpacity
                onPress={() => resendOtp.mutate()}
                disabled={secondsLeft > 0 || resendOtp.isPending}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.resendAction,
                    (secondsLeft > 0 || resendOtp.isPending) && styles.resendActionDisabled,
                  ]}>
                  {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </SurfaceCard>
        </View>
      </AppBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: TGC_COLORS.bgPrimary},
  container: {
    flex: 1,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
  },
  backBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  backText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: TGC_COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  otpRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpCell: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: TGC_COLORS.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  submitBtn: {
    marginTop: 18,
    borderRadius: 18,
    ...TGC_SHADOWS.cta,
  },
  resendRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: TGC_COLORS.textTertiary,
    fontSize: 13,
  },
  resendAction: {
    marginTop: 6,
    color: TGC_COLORS.coral,
    fontSize: 14,
    fontWeight: '700',
  },
  resendActionDisabled: {
    color: TGC_COLORS.textTertiary,
  },
});
