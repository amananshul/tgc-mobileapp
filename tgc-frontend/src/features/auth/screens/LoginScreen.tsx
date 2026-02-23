import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { useLogin } from '../hooks/useLogin';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import BrandWordmark from '../../../components/ui/BrandWordmark';
import { TGC_COLORS, TGC_SHADOWS, TGC_SPACING } from '../../../theme/tgcTheme';
import type { AuthStackParamList } from '../../../app/navigation/AuthStack';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Phone number or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const login = useLogin();

  const onSubmit = (data: LoginForm) => {
    login.mutate(data, {
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          'Login failed. Check your credentials.';
        Toast.show({ type: 'error', text1: 'Error', text2: msg });
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppBackground>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + 34,
              paddingBottom: Math.max(insets.bottom, 12) + 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandWordmark subtitle="Where communities come alive" />

          <SurfaceCard style={styles.formCard}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Pick up right where your community left off.
            </Text>

            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone number or email"
                  placeholder="you@email.com or +91 9876543210"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.identifier?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Your password"
                  secureTextEntry
                  secureToggle
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={login.isPending}
              style={styles.btn}
            />

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Don't have an account? Create one</Text>
            </TouchableOpacity>
          </SurfaceCard>
        </ScrollView>
      </AppBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: TGC_COLORS.bgPrimary },
  container: {
    flexGrow: 1,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
  },
  formCard: {
    marginTop: 42,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: TGC_COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 16,
    color: TGC_COLORS.textSecondary,
  },
  btn: {
    marginTop: 8,
    borderRadius: 18,
    ...TGC_SHADOWS.cta,
  },
  link: {
    color: TGC_COLORS.coral,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
  },
});
