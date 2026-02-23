import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {AuthResponse} from '../../../types/auth';

export interface RegisterPayload {
  identifier: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const {data} = await client.post<AuthResponse>(ENDPOINTS.AUTH_REGISTER, payload);
  return data;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const {data} = await client.post<AuthResponse>(ENDPOINTS.AUTH_LOGIN, payload);
  return data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await client.post(ENDPOINTS.AUTH_LOGOUT, {refreshToken});
}
