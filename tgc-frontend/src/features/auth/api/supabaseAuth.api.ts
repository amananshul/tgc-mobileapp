/**
 * Email-only OTP auth service.
 * All auth calls go through the singleton supabase client in src/lib/supabase.ts.
 */
import {supabase} from '../../../lib/supabase';
import type {Session} from '@supabase/supabase-js';

function maskEmail(email: string) {
  const [name = '', domain = ''] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
}

// ─── Send OTP ──────────────────────────────────────────────────────────────

export async function sendEmailOtp(email: string): Promise<void> {
  const masked = maskEmail(email);
  console.log('[supabaseAuth] sendEmailOtp →', {email: masked});

  const {error} = await supabase.auth.signInWithOtp({
    email,
    options: {shouldCreateUser: true},
  });

  if (error) {
    console.error('[supabaseAuth] sendEmailOtp FAILED', {
      message: error.message,
      status: (error as any)?.status,
      name: error.name,
      fullError: error,
    });
    throw error;
  }

  console.log('[supabaseAuth] sendEmailOtp SUCCESS', {email: masked});
}

// ─── Verify OTP ────────────────────────────────────────────────────────────

export async function verifyEmailOtp(email: string, token: string): Promise<Session> {
  const masked = maskEmail(email);
  console.log('[supabaseAuth] verifyEmailOtp →', {email: masked, tokenLength: token.length});

  const {data, error} = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error || !data.session) {
    console.error('[supabaseAuth] verifyEmailOtp FAILED', {
      message: error?.message,
      status: (error as any)?.status,
      name: error?.name,
      hasSession: Boolean(data?.session),
      fullError: error,
    });
    throw error ?? new Error('OTP verification failed — no session returned');
  }

  console.log('[supabaseAuth] verifyEmailOtp SUCCESS', {
    email: masked,
    userId: data.session.user?.id,
    expiresAt: data.session.expires_at,
  });
  return data.session;
}

// ─── Session helpers ───────────────────────────────────────────────────────

export async function getEmailAuthSession(): Promise<Session | null> {
  const {data, error} = await supabase.auth.getSession();
  if (error) {
    console.error('[supabaseAuth] getSession FAILED', {message: error.message});
    throw error;
  }
  console.log('[supabaseAuth] getSession', {hasSession: Boolean(data.session)});
  return data.session ?? null;
}

export async function signOutEmailAuth(): Promise<void> {
  console.log('[supabaseAuth] signOut →');
  const {error} = await supabase.auth.signOut();
  if (error) {
    console.error('[supabaseAuth] signOut FAILED', {message: error.message});
  } else {
    console.log('[supabaseAuth] signOut SUCCESS');
  }
}
