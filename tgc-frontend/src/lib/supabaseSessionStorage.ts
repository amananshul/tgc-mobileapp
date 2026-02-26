/**
 * Thin facade over tokenStore so the rest of the app can call
 * getSession / setSession / clearSession without importing from services/.
 */
import {
  getSupabaseSession,
  setSupabaseSession,
  clearSupabaseSession,
  type StoredSupabaseSession,
} from '../services/http/tokenStore';
import type {Session} from '@supabase/supabase-js';

export type {StoredSupabaseSession};

export async function getSession(): Promise<StoredSupabaseSession | null> {
  const session = await getSupabaseSession();
  console.log('[SessionStorage] getSession', {hasSession: Boolean(session)});
  return session;
}

export async function setSession(
  session: Pick<Session, 'access_token' | 'refresh_token'> & {
    expires_at?: number | null;
    expires_in?: number | null;
    token_type?: string | null;
    user?: unknown;
  },
): Promise<void> {
  console.log('[SessionStorage] setSession', {
    expiresAt: session.expires_at,
    tokenType: session.token_type,
  });
  await setSupabaseSession(session as StoredSupabaseSession);
}

export async function clearSession(): Promise<void> {
  console.log('[SessionStorage] clearSession');
  await clearSupabaseSession();
}
