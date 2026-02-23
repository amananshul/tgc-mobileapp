import {useMutation} from '@tanstack/react-query';
import {verifyOtpApi} from '../api/otp.api';

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({phone, otp}: {phone: string; otp: string}) =>
      verifyOtpApi(phone, otp),
  });
}
