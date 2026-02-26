import client from './http/client';
import { ENDPOINTS } from './http/endpoints';
import { updateProfileApi } from '../features/profile/api/profile.api';
import { updateTribeApi } from '../features/tribes/api/tribes.api';
import { compressImage } from '../utils/media/compressImage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { MediaUploadPurpose } from '../utils/media/compressImage';
import type { PickedImageAsset } from '../utils/media/pickImage';
import type { UpdateProfileResponse, TribeDetailResponse } from '../types/auth';

interface PresignUploadParams {
  purpose: MediaUploadPurpose;
  fileName: string;
  mimeType: string;
  tribeId?: string;
  fileSize?: number;
}

interface PresignUploadResponse {
  uploadUrl: string;
  path: string;
}

export async function presignUpload(
  params: PresignUploadParams,
): Promise<PresignUploadResponse> {
  console.log('[presignUpload] Request params:', params);
  const { data } = await client.post<PresignUploadResponse>(
    ENDPOINTS.UPLOADS_PRESIGN,
    params,
  );
  console.log('[presignUpload] Response:', data);
  return data;
}

export async function putFileToSignedUrl({
  uploadUrl,
  fileUri,
  mimeType,
}: {
  uploadUrl: string;
  fileUri: string;
  mimeType: string;
}): Promise<void> {
  console.log('[putFileToSignedUrl] Starting upload...');
  console.log('[putFileToSignedUrl] Upload URL:', uploadUrl);
  console.log('[putFileToSignedUrl] File URI:', fileUri);
  console.log('[putFileToSignedUrl] MIME type:', mimeType);

  try {
    // Normalize file path for react-native-blob-util
    let filePath = fileUri;
    if (filePath.startsWith('file://')) {
      filePath = filePath.substring(7);
    }

    console.log('[putFileToSignedUrl] Normalized file path:', filePath);

    const response = await ReactNativeBlobUtil.fetch(
      'PUT',
      uploadUrl,
      {
        'Content-Type': mimeType,
      },
      ReactNativeBlobUtil.wrap(filePath),
    );

    console.log('[putFileToSignedUrl] Response status:', response.info().status);
    console.log('[putFileToSignedUrl] Response info:', response.info());

    const status = response.info().status;
    if (status < 200 || status >= 300) {
      const errorText = await response.text();
      console.error('[putFileToSignedUrl] Upload failed:', errorText);
      throw new Error(errorText || `Upload failed with status ${status}`);
    }

    console.log('[putFileToSignedUrl] Upload successful!');
  } catch (error: any) {
    console.error('[putFileToSignedUrl] Upload error:', error);
    throw new Error(error.message || 'Upload failed');
  }
}

async function uploadMediaObject({
  purpose,
  image,
  tribeId,
}: {
  purpose: MediaUploadPurpose;
  image: PickedImageAsset;
  tribeId?: string;
}): Promise<{ path: string }> {
  const compressed = await compressImage({ image, purpose });
  const { uploadUrl, path } = await presignUpload({
    purpose,
    fileName: compressed.fileName,
    mimeType: compressed.mimeType,
    tribeId,
    fileSize: compressed.fileSize || undefined,
  });

  await putFileToSignedUrl({
    uploadUrl,
    fileUri: compressed.uri,
    mimeType: compressed.mimeType,
  });

  return { path };
}

export async function uploadAndAttachProfileAvatar(
  image: PickedImageAsset,
): Promise<UpdateProfileResponse> {
  const { path } = await uploadMediaObject({
    purpose: 'profile',
    image,
  });

  console.log('[uploadAndAttachProfileAvatar] Updating profile with path:', path);
  return updateProfileApi({ avatarPath: path });
}

export async function uploadAndAttachTribeCover(
  tribeId: string,
  image: PickedImageAsset,
): Promise<TribeDetailResponse> {
  const { path } = await uploadMediaObject({
    purpose: 'tribe-cover',
    image,
    tribeId,
  });

  return updateTribeApi(tribeId, { coverImagePath: path });
}

export async function uploadAndAttachTribePostImage(
  tribeId: string,
  image: PickedImageAsset,
): Promise<string> {
  const { path } = await uploadMediaObject({
    purpose: 'tribe-post',
    image,
    tribeId,
  });
  return path;
}
