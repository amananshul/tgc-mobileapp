import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {
  UpdateProfilePayload,
  UpdateProfileResponse,
  MeResponse,
  ProfileData,
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

export interface UploadAvatarPayload {
  sourceUrl?: string;
  imageData?: string;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  profile: ProfileData;
}

export async function uploadAvatarApi(
  payload: UploadAvatarPayload,
): Promise<UploadAvatarResponse> {
  const {data} = await client.post<UploadAvatarResponse>(ENDPOINTS.UPLOAD_AVATAR, payload);
  return data;
}
