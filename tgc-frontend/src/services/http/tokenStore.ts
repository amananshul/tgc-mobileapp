import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_SERVICE = 'tgc_access_token';
const REFRESH_TOKEN_SERVICE = 'tgc_refresh_token';

export async function getAccessToken(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({service: ACCESS_TOKEN_SERVICE});
    return creds ? creds.password : null;
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({service: REFRESH_TOKEN_SERVICE});
    return creds ? creds.password : null;
  } catch {
    return null;
  }
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Keychain.setGenericPassword('token', accessToken, {service: ACCESS_TOKEN_SERVICE});
  await Keychain.setGenericPassword('token', refreshToken, {service: REFRESH_TOKEN_SERVICE});
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({service: ACCESS_TOKEN_SERVICE});
  await Keychain.resetGenericPassword({service: REFRESH_TOKEN_SERVICE});
}
