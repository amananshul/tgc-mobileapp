import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {useVerifyOtp} from '../hooks/useVerifyOtp';
import {useResendOtp} from '../hooks/useResendOtp';
import Button from '../../../components/ui/Button';

type LegacyOtpStackParamList = {
  OTP: {phone: string};
  Intent: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<LegacyOtpStackParamList, 'OTP'>;
  route: RouteProp<LegacyOtpStackParamList, 'OTP'>;
};

export default function OTPScreen({navigation, route}: Props) {
  const {phone} = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const verify = useVerifyOtp();
  const resend = useResendOtp();

  const handleChange = (val: string, idx: number) => {
    const next = [...otp];
    next[idx] = val.replace(/[^0-9]/g, '').slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      Toast.show({type: 'error', text1: 'Invalid OTP', text2: 'Please enter the 6-digit OTP.'});
      return;
    }
    verify.mutate(
      {phone, otp: code},
      {
        onSuccess: () => {
          Toast.show({type: 'success', text1: 'Verified!', text2: 'Your phone number is verified.'});
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Verification failed.';
          Toast.show({type: 'error', text1: 'Error', text2: msg});
        },
      },
    );
  };

  const handleResend = () => {
    resend.mutate(phone, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'OTP Resent',
          text2: `A new OTP has been sent to ${phone}. Test OTP: 123456`,
        });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || 'Failed to resend OTP.';
        Toast.show({type: 'error', text1: 'Error', text2: msg});
      },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>{'← Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verify Phone</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit OTP sent to{'\n'}
        <Text style={styles.phone}>{phone}</Text>
      </Text>
      <Text style={styles.testNote}>Test mode OTP: 123456</Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={el => { inputs.current[i] = el; }}
            style={[styles.otpBox, digit && styles.otpBoxFilled]}
            value={digit}
            onChangeText={val => handleChange(val, i)}
            onKeyPress={({nativeEvent}) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <Button
        title="Verify OTP"
        onPress={handleVerify}
        loading={verify.isPending}
        style={styles.verifyBtn}
      />

      <TouchableOpacity onPress={handleResend} disabled={resend.isPending}>
        <Text style={styles.link}>
          {resend.isPending ? 'Resending...' : "Didn't get it? Resend OTP"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Intent')}
        style={styles.skipBtn}>
        <Text style={styles.skipText}>{'Skip for now →'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0F0F1A', padding: 24, paddingTop: 60},
  back: {marginBottom: 32},
  backText: {color: '#6C63FF', fontSize: 15},
  title: {fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8},
  subtitle: {fontSize: 14, color: '#aaa', lineHeight: 22, marginBottom: 6},
  phone: {color: '#fff', fontWeight: '600'},
  testNote: {
    color: '#6C63FF',
    fontSize: 12,
    backgroundColor: '#1E1E2E',
    padding: 8,
    borderRadius: 8,
    marginBottom: 32,
    marginTop: 8,
  },
  otpRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32},
  otpBox: {
    width: 46,
    height: 54,
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E2E3E',
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpBoxFilled: {borderColor: '#6C63FF'},
  verifyBtn: {marginBottom: 20},
  link: {color: '#6C63FF', textAlign: 'center', fontSize: 14, marginBottom: 20},
  skipBtn: {marginTop: 8},
  skipText: {color: '#555', textAlign: 'center', fontSize: 13},
});
