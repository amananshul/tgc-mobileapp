import {useMutation} from '@tanstack/react-query';
import {resendOtpApi} from '../api/otp.api';

export function useResendOtp() {
  return useMutation({
    mutationFn: (phone: string) => resendOtpApi(phone),
  });
}
