import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {
  UpdateProfilePayload,
  UpdateProfileResponse,
  MeResponse,
} from '../../../types/auth';

export async function getMeApi(): Promise<MeResponse> {
  const {data} = await client.get<MeResponse>(ENDPOINTS.USERS_ME);
  return data;
}

export async function updateProfileApi(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> {
  const {data} = await client.patch<UpdateProfileResponse>(ENDPOINTS.PROFILE, payload);
  return data;
}
