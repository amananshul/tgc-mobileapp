import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import type {UserData, ProfileData} from '../../types/auth';
import {getAccessToken, setTokens, clearTokens} from '../../services/http/tokenStore';
import client from '../../services/http/client';
import {ENDPOINTS} from '../../services/http/endpoints';
import type {MeResponse} from '../../types/auth';

interface AuthState {
  user: UserData | null;
  profile: ProfileData | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isRestoringSession: true,
};

// Thunk: restore session from Keychain on app boot
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, {rejectWithValue}) => {
    const token = await getAccessToken();
    if (!token) {
      return rejectWithValue('No token');
    }

    try {
      const {data} = await client.get<MeResponse>(ENDPOINTS.USERS_ME);
      return data;
    } catch {
      await clearTokens();
      return rejectWithValue('Session expired');
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
    },
    clearCredentials(state) {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.isRestoringSession = false;
    },
    updateUser(state, action: PayloadAction<UserData>) {
      state.user = action.payload;
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
      })
      .addCase(restoreSession.rejected, state => {
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.isRestoringSession = false;
      });
  },
});

export const {setCredentials, clearCredentials, updateUser, updateProfile} =
  authSlice.actions;
export default authSlice.reducer;

// Helpers for use outside of components
export async function storeTokensAndDispatch(
  dispatch: any,
  data: {accessToken: string; refreshToken: string; user: UserData; profile: ProfileData},
) {
  await setTokens(data.accessToken, data.refreshToken);
  dispatch(setCredentials({user: data.user, profile: data.profile}));
}

export async function logoutAndClear(dispatch: any) {
  await clearTokens();
  dispatch(clearCredentials());
}
