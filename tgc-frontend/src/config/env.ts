// Using localhost for both platforms.
// For Android emulator, run: adb reverse tcp:3000 tcp:3000
export const BASE_URL = 'http://localhost:3000';

// These are injected at Metro build time from .env via react-native-dotenv.
// See .env.example for the list of required keys.
import {
  SUPABASE_URL as _SUPABASE_URL,
  SUPABASE_ANON_KEY as _SUPABASE_ANON_KEY,
  GOOGLE_WEB_CLIENT_ID as _GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID as _GOOGLE_IOS_CLIENT_ID,
} from '@env';

export const SUPABASE_URL: string = _SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY: string = _SUPABASE_ANON_KEY ?? '';
export const GOOGLE_WEB_CLIENT_ID: string = _GOOGLE_WEB_CLIENT_ID ?? '';
export const GOOGLE_IOS_CLIENT_ID: string = _GOOGLE_IOS_CLIENT_ID ?? '';

function maskValue(value: string) {
  if (!value) {
    return '(missing)';
  }
  if (value.length <= 10) {
    return `${value.slice(0, 2)}***`;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function getFrontendAuthEnvDebugSnapshot() {
  return {
    hasSupabaseUrl: Boolean(SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(SUPABASE_ANON_KEY),
    hasGoogleWebClientId: Boolean(GOOGLE_WEB_CLIENT_ID),
    hasGoogleIosClientId: Boolean(GOOGLE_IOS_CLIENT_ID),
    supabaseUrl: maskValue(SUPABASE_URL),
    supabaseAnonKey: maskValue(SUPABASE_ANON_KEY),
    googleWebClientId: maskValue(GOOGLE_WEB_CLIENT_ID),
    googleIosClientId: maskValue(GOOGLE_IOS_CLIENT_ID),
  };
}

export function assertFrontendSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const snapshot = getFrontendAuthEnvDebugSnapshot();
    console.error('[AuthConfig] Missing frontend Supabase config', snapshot);
    throw new Error(
      'Missing frontend Supabase config. SUPABASE_URL/SUPABASE_ANON_KEY are empty. Fill in tgc-frontend/.env and restart Metro with --reset-cache.',
    );
  }
}
