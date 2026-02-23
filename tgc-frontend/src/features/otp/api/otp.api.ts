import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {OtpVerifyResponse, OtpResendResponse} from '../../../types/auth';

export async function verifyOtpApi(phone: string, otp: string): Promise<OtpVerifyResponse> {
  const {data} = await client.post<OtpVerifyResponse>(ENDPOINTS.AUTH_VERIFY_OTP, {phone, otp});
  return data;
}

export async function resendOtpApi(phone: string): Promise<OtpResendResponse> {
  const {data} = await client.post<OtpResendResponse>(ENDPOINTS.AUTH_RESEND_OTP, {phone});
  return data;
}
