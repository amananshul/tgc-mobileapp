import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {BASE_URL} from '../../config/env';
import {ENDPOINTS} from './endpoints';
import {getAccessToken, getRefreshToken, setTokens, clearTokens} from './tokenStore';
import type {RefreshResponse} from '../../types/auth';

console.log('[HTTP] Axios client baseURL:', BASE_URL);

const client = axios.create({
  baseURL: BASE_URL,
  headers: {'Content-Type': 'application/json'},
  timeout: 15000,
});

// ─── Request Interceptor: attach access token ────────────────────────────────
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log('[HTTP] Request:', config.method?.toUpperCase(), config.url);
    try {
      const token = await getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.log('[HTTP] Keychain read error (non-fatal):', err);
    }
    return config;
  },
  error => {
    console.log('[HTTP] Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// ─── Response Interceptor: auto-refresh on 401 (single-flight) ───────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({resolve, reject}) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

client.interceptors.response.use(
  response => {
    console.log('[HTTP] Response:', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    console.log('[HTTP] Response error:', error.message, error.config?.url, 'status:', error.response?.status);
    const originalRequest = error.config as InternalAxiosRequestConfig & {_retry?: boolean};

    // Only attempt refresh on 401, not on refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === ENDPOINTS.AUTH_REFRESH
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
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
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const {data} = await axios.post<RefreshResponse>(
        `${BASE_URL}${ENDPOINTS.AUTH_REFRESH}`,
        {refreshToken},
      );

      await setTokens(data.accessToken, data.refreshToken);

      processQueue(null, data.accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      // The Redux store listener will detect cleared tokens and redirect to login
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
