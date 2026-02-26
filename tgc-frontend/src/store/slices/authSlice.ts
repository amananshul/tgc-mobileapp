import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import type {ProfileData, UserData, MeResponse} from '../../types/auth';
import client from '../../services/http/client';
import {ENDPOINTS} from '../../services/http/endpoints';
import {
  clearSupabaseSession,
  getSupabaseSession,
  setSupabaseSession,
  type StoredSupabaseSession,
} from '../../services/http/tokenStore';
import {setSession as setSupabaseSessionInClient, signOut as supabaseSignOut} from '../../features/auth/api/auth.supabase';

interface AuthState {
  user: UserData | null;
  profile: ProfileData | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  onboardingCompleted: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isRestoringSession: true,
  onboardingCompleted: false,
};

function sessionToStored(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
  expires_in?: number | null;
  token_type?: string | null;
  user?: unknown;
}): StoredSupabaseSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? null,
    expires_in: session.expires_in ?? null,
    token_type: session.token_type ?? null,
    user: session.user ?? null,
  };
}

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, {rejectWithValue}) => {
    console.log('[restoreSession] Reading session from Keychain...');
    const stored = await getSupabaseSession();

    if (!stored?.access_token || !stored?.refresh_token) {
      console.log('[restoreSession] No stored session → going to AuthStack');
      return rejectWithValue('No session');
    }

    console.log('[restoreSession] Found stored session', {
      expiresAt: stored.expires_at,
      hasAccessToken: Boolean(stored.access_token),
      hasRefreshToken: Boolean(stored.refresh_token),
    });

    try {
      console.log('[restoreSession] Calling setSession on Supabase client...');
      const restoredSession = await setSupabaseSessionInClient({
        access_token: stored.access_token,
        refresh_token: stored.refresh_token,
      });
      console.log('[restoreSession] Supabase setSession OK', {
        expiresAt: restoredSession.expires_at,
        userId: restoredSession.user?.id,
      });

      await setSupabaseSession(sessionToStored(restoredSession));

      console.log('[restoreSession] Fetching /users/me from backend...');
      const {data} = await client.get<MeResponse>(ENDPOINTS.USERS_ME);
      console.log('[restoreSession] SUCCESS — user restored', {
        userId: data.user?.id,
        onboardingCompleted: data.user?.onboardingCompleted,
      });
      return data;
    } catch (err: any) {
      console.error('[restoreSession] FAILED — clearing session', {
        message: err?.message,
        status: err?.response?.status,
        fullError: err,
      });
      await clearSupabaseSession();
      return rejectWithValue('Session restore failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{user: UserData; profile: ProfileData}>,
    ) {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.isAuthenticated = true;
      state.isRestoringSession = false;
      state.onboardingCompleted = Boolean(action.payload.user.onboardingCompleted);
    },
    clearCredentials(state) {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.isRestoringSession = false;
      state.onboardingCompleted = false;
    },
    updateUser(state, action: PayloadAction<UserData>) {
      state.user = action.payload;
      state.onboardingCompleted = Boolean(action.payload.onboardingCompleted);
    },
    updateProfile(state, action: PayloadAction<ProfileData>) {
      state.profile = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restoreSession.pending, state => {
        state.isRestoringSession = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.isRestoringSession = false;
        state.onboardingCompleted = Boolean(action.payload.user.onboardingCompleted);
      })
      .addCase(restoreSession.rejected, state => {
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.isRestoringSession = false;
        state.onboardingCompleted = false;
      });
  },
});

export const {setCredentials, clearCredentials, updateUser, updateProfile} = authSlice.actions;
export default authSlice.reducer;

export async function storeSupabaseSessionAndDispatch(
  dispatch: any,
  session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number | null;
    expires_in?: number | null;
    token_type?: string | null;
    user?: unknown;
  },
) {
  console.log('[storeSession] Persisting session to Keychain...');
  await setSupabaseSession(sessionToStored(session));

  console.log('[storeSession] Hydrating Supabase in-memory client...');
  await setSupabaseSessionInClient({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  console.log('[storeSession] Fetching /users/me from backend...');
  const {data} = await client.get<MeResponse>(ENDPOINTS.USERS_ME);

  console.log('[storeSession] SUCCESS — dispatching credentials', {
    userId: data.user?.id,
    onboardingCompleted: data.user?.onboardingCompleted,
  });
  dispatch(setCredentials({user: data.user, profile: data.profile}));
  return data;
}

// Backward-compatible alias used by old password auth hooks (now unused).
export async function storeTokensAndDispatch(
  dispatch: any,
  data: {accessToken: string; refreshToken: string; user: UserData; profile: ProfileData},
) {
  await setSupabaseSession({
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
  });
  dispatch(setCredentials({user: data.user, profile: data.profile}));
}

export async function logoutAndClear(dispatch: any) {
  try {
    await supabaseSignOut();
  } catch {
    // continue clearing local state even if network sign-out fails
  }
  await clearSupabaseSession();
  dispatch(clearCredentials());
}
