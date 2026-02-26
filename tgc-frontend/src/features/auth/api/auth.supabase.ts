import type {Session} from '@supabase/supabase-js';
import {
  GoogleSignin,
  statusCodes as googleStatusCodes,
} from '@react-native-google-signin/google-signin';
import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../../../config/env';
import {getSupabaseClient} from '../../../services/supabase/client';

function isPhoneIdentifier(value: string) {
  const trimmed = value.trim();
  return /^\+?[0-9][0-9\s-]{6,}$/.test(trimmed) && !trimmed.includes('@');
}

function normalizeIdentifier(value: string) {
  return value.trim();
}

let googleConfigured = false;

function ensureGoogleConfigured() {
  if (googleConfigured) {
    return;
  }

  console.log('[Auth][Google] Configuring Google Sign-In', {
    hasWebClientId: Boolean(GOOGLE_WEB_CLIENT_ID),
    hasIosClientId: Boolean(GOOGLE_IOS_CLIENT_ID),
    webClientIdPreview: GOOGLE_WEB_CLIENT_ID
      ? `${GOOGLE_WEB_CLIENT_ID.slice(0, 12)}...`
      : '(missing)',
    iosClientIdPreview: GOOGLE_IOS_CLIENT_ID
      ? `${GOOGLE_IOS_CLIENT_ID.slice(0, 12)}...`
      : '(missing)',
  });

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export type OtpIdentifier = {
  type: 'email' | 'phone';
  value: string;
};

export function parseOtpIdentifier(identifier: string): OtpIdentifier {
  const value = normalizeIdentifier(identifier);
  return isPhoneIdentifier(value)
    ? {type: 'phone', value}
    : {type: 'email', value: value.toLowerCase()};
}

export async function signInWithOtp(identifier: string): Promise<{message: string}> {
  const parsed = parseOtpIdentifier(identifier);
  console.log('[Auth][OTP] signInWithOtp start', {
    identifierType: parsed.type,
    identifierPreview:
      parsed.type === 'email'
        ? `${parsed.value.slice(0, 2)}***`
        : `${parsed.value.slice(0, 4)}***`,
  });
  const supabase = getSupabaseClient();

  const payload =
    parsed.type === 'phone'
      ? {phone: parsed.value}
      : {email: parsed.value, options: {shouldCreateUser: true}};

  const {error} = await supabase.auth.signInWithOtp(payload as any);
  if (error) {
    console.error('[Auth][OTP] signInWithOtp error', {
      message: error.message,
      status: (error as any)?.status,
      code: (error as any)?.code,
      name: (error as any)?.name,
      fullError: error,
    });
    throw error;
  }

  console.log('[Auth][OTP] signInWithOtp success', {identifierType: parsed.type});

  return {
    message:
      parsed.type === 'phone'
        ? 'OTP sent to your phone'
        : 'OTP sent to your email',
  };
}

export async function verifyOtp(
  identifier: string,
  token: string,
): Promise<Session> {
  const parsed = parseOtpIdentifier(identifier);
  console.log('[Auth][OTP] verifyOtp start', {
    identifierType: parsed.type,
    tokenLength: token.length,
  });
  const supabase = getSupabaseClient();

  const verifyPayload =
    parsed.type === 'phone'
      ? {
          phone: parsed.value,
          token,
          type: 'sms' as const,
        }
      : {
          email: parsed.value,
          token,
          type: 'email' as const,
        };

  const {data, error} = await supabase.auth.verifyOtp(verifyPayload as any);
  if (error || !data.session) {
    console.error('[Auth][OTP] verifyOtp error', {
      message: error?.message,
      status: (error as any)?.status,
      code: (error as any)?.code,
      hasSession: Boolean(data?.session),
      fullError: error,
    });
    throw error ?? new Error('Could not verify OTP');
  }

  console.log('[Auth][OTP] verifyOtp success', {
    hasUser: Boolean(data.session.user),
    expiresAt: data.session.expires_at,
  });
  return data.session;
}

export async function signInWithGoogle(): Promise<Session> {
  try {
    ensureGoogleConfigured();
    console.log('[Auth][Google] launching signIn()');

    const result = await GoogleSignin.signIn();
    console.log('[Auth][Google] signIn() raw result', {
      keys: result ? Object.keys(result as any) : [],
      hasData: Boolean((result as any)?.data),
      result: result as any,
    });

    const idToken = (result as any)?.data?.idToken ?? (result as any)?.idToken;

    if (!idToken) {
      console.error('[Auth][Google] Missing idToken in sign-in result', result as any);
      throw new Error('Google sign-in did not return an idToken');
    }

    console.log('[Auth][Google] idToken received', {
      tokenLength: String(idToken).length,
      tokenPrefix: String(idToken).slice(0, 12),
    });

    const supabase = getSupabaseClient();
    const {data, error} = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error || !data.session) {
      console.error('[Auth][Google] Supabase signInWithIdToken error', {
        message: error?.message,
        status: (error as any)?.status,
        code: (error as any)?.code,
        fullError: error,
        data,
      });
      throw error ?? new Error('Supabase Google sign-in failed');
    }

    console.log('[Auth][Google] Supabase signInWithIdToken success', {
      userId: data.session.user?.id,
      expiresAt: data.session.expires_at,
    });
    return data.session;
  } catch (err: any) {
    console.error('[Auth][Google] signIn failed', {
      message: err?.message,
      code: err?.code,
      statusCode: err?.statusCode,
      nativeErrorCode: err?.nativeErrorCode,
      details: err?.details,
      stack: err?.stack,
      knownGoogleStatusCodes: googleStatusCodes,
      fullError: err,
    });
    throw err;
  }
}

export async function setSession(session: Pick<Session, 'access_token' | 'refresh_token'>) {
  const supabase = getSupabaseClient();
  const {data, error} = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error || !data.session) {
    console.error('[Auth][Session] setSession error', {
      message: error?.message,
      status: (error as any)?.status,
      code: (error as any)?.code,
      fullError: error,
    });
    throw error ?? new Error('Could not restore session');
  }
  console.log('[Auth][Session] setSession success', {expiresAt: data.session.expires_at});
  return data.session;
}

export async function refreshSession(): Promise<Session> {
  const supabase = getSupabaseClient();
  const {data, error} = await supabase.auth.refreshSession();
  if (error || !data.session) {
    console.error('[Auth][Session] refreshSession error', {
      message: error?.message,
      status: (error as any)?.status,
      code: (error as any)?.code,
      fullError: error,
    });
    throw error ?? new Error('Could not refresh session');
  }
  console.log('[Auth][Session] refreshSession success', {expiresAt: data.session.expires_at});
  return data.session;
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  const {data, error} = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session ?? null;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  try {
    await GoogleSignin.signOut();
  } catch {
    // no-op if user signed in via OTP or Google SDK is not active
  }
}
