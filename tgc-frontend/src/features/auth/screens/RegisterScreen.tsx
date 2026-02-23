import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Toast from 'react-native-toast-message';
import {useRegister} from '../hooks/useRegister';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import BrandWordmark from '../../../components/ui/BrandWordmark';
import {TGC_COLORS, TGC_SHADOWS, TGC_SPACING} from '../../../theme/tgcTheme';
import type {AuthStackParamList} from '../../../app/navigation/AuthStack';

const registerSchema = z.object({
  identifier: z.string().trim().min(1, 'Phone number or email is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

function generateTempPassword() {
  const seed = Math.random().toString(36).slice(2, 12);
  return `Tgc@${seed}`;
}

export default function RegisterScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {identifier: ''},
  });

  const register = useRegister();

  const onSubmit = (data: RegisterForm) => {
    const tempPassword = generateTempPassword();

    register.mutate(
      {
        identifier: data.identifier,
        password: tempPassword,
        confirmPassword: tempPassword,
      },
      {
        onSuccess: res => {
          if (res.message) {
            Toast.show({type: 'success', text1: 'Welcome to TGC', text2: res.message});
          }
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Registration failed. Try again.';
          Toast.show({type: 'error', text1: 'Error', text2: msg});
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBackground>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {paddingTop: insets.top + 34, paddingBottom: Math.max(insets.bottom, 12) + 20},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandWordmark subtitle="Where communities come alive" />

          <SurfaceCard style={styles.formCard}>
            <Controller
              control={control}
              name="identifier"
              render={({field: {onChange, onBlur, value}}) => (
                <Input
                  placeholder="Phone number or email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.identifier?.message}
                />
              )}
            />

            <Button
              title="Send OTP"
              onPress={handleSubmit(onSubmit)}
              loading={register.isPending}
              style={styles.submitBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continue with Twitter"
              onPress={() => {}}
              variant="outline"
              compact
            />
            <Button
              title="Continue with Google"
              onPress={() => {}}
              variant="outline"
              compact
              style={styles.socialBtn}
            />

            <Text style={styles.footer}>
              By continuing, you agree to our <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Already have an account? Sign in</Text>
            </TouchableOpacity>
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
  socialBtn: {
    marginTop: 12,
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
  link: {
    color: TGC_COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
});
