import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config/env';
import {setSupabaseSession, clearSupabaseSession} from '../services/http/tokenStore';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing env vars — fill in tgc-frontend/.env and restart Metro with --reset-cache');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,      // We manage secure storage manually via Keychain
    autoRefreshToken: true,     // Supabase refreshes in-memory token before expiry
    detectSessionInUrl: false,  // Not needed in React Native
  },
});

// Keep Keychain in sync whenever Supabase auto-refreshes the access token.
// This runs outside React so it fires regardless of component lifecycle.
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase][onAuthStateChange]', event, {
    hasSession: Boolean(session),
    userId: session?.user?.id,
    expiresAt: session?.expires_at,
  });

  if (session && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
    setSupabaseSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at ?? null,
      expires_in: session.expires_in ?? null,
      token_type: session.token_type ?? null,
      user: session.user ?? null,
    }).catch(err =>
      console.error('[Supabase][onAuthStateChange] Keychain write failed', err),
    );
  } else if (event === 'SIGNED_OUT') {
    clearSupabaseSession().catch(err =>
      console.error('[Supabase][onAuthStateChange] Keychain clear failed', err),
    );
  }
});
