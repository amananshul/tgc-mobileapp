import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {BASE_URL} from '../../config/env';
import {refreshSession as refreshSupabaseSession} from '../../features/auth/api/auth.supabase';
import {
  clearSupabaseSession,
  getAccessToken,
  setSupabaseSession,
} from './tokenStore';
import {notifyAuthSessionExpired} from './authSessionBridge';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {'Content-Type': 'application/json'},
  timeout: 15000,
});

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({resolve, reject}) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(token as string);
  });
  failedQueue = [];
}

client.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {_retry?: boolean};

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({resolve, reject});
      }).then(token => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return client(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const session = await refreshSupabaseSession();
      await setSupabaseSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at ?? null,
        expires_in: session.expires_in ?? null,
        token_type: session.token_type ?? null,
        user: session.user ?? null,
      });

      processQueue(null, session.access_token);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
      }
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearSupabaseSession();
      await notifyAuthSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
