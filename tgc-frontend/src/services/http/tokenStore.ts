import * as Keychain from 'react-native-keychain';

const SUPABASE_SESSION_SERVICE = 'tgc_supabase_session';

export type StoredSupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
  expires_in?: number | null;
  token_type?: string | null;
  user?: unknown;
};

async function readSessionRecord(): Promise<StoredSupabaseSession | null> {
  try {
    const creds = await Keychain.getGenericPassword({service: SUPABASE_SESSION_SERVICE});
    if (!creds || typeof creds === 'boolean' || !creds.password) {
      return null;
    }
    return JSON.parse(creds.password) as StoredSupabaseSession;
  } catch {
    return null;
  }
}

export async function getSupabaseSession(): Promise<StoredSupabaseSession | null> {
  return readSessionRecord();
}

export async function setSupabaseSession(session: StoredSupabaseSession): Promise<void> {
  await Keychain.setGenericPassword('session', JSON.stringify(session), {
    service: SUPABASE_SESSION_SERVICE,
  });
}

export async function clearSupabaseSession(): Promise<void> {
  await Keychain.resetGenericPassword({service: SUPABASE_SESSION_SERVICE});
}

// Backward-compatible helpers used by existing code paths/interceptors.
export async function getAccessToken(): Promise<string | null> {
  const session = await readSessionRecord();
  return session?.access_token ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const session = await readSessionRecord();
  return session?.refresh_token ?? null;
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  const current = (await readSessionRecord()) ?? {};
  await setSupabaseSession({
    ...current,
    access_token: accessToken,
    refresh_token: refreshToken,
  } as StoredSupabaseSession);
}

export async function clearTokens(): Promise<void> {
  await clearSupabaseSession();
}
