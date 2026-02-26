import type {PickedImageAsset} from './pickImage';

export type MediaUploadPurpose = 'profile' | 'tribe-cover' | 'tribe-post' | 'event-cover';

export interface CompressedImageAsset {
  uri: string;
  fileName: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  fileSize: number;
}

const MAX_FINAL_BYTES = 3 * 1024 * 1024;

function toJpegFileName(originalFileName: string) {
  const base = (originalFileName || `image-${Date.now()}`)
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\w.-]+/g, '-');
  return `${base || `image-${Date.now()}`}.jpg`;
}

function ensureFileUri(uri: string) {
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  return `file://${uri}`;
}

/**
 * react-native-image-picker already compresses images (quality 0.72, max 1280×720)
 * producing ~200–400 KB per photo. We use that output directly to avoid requiring
 * a separate native resize module (which has new-architecture compatibility issues).
 */
export async function compressImage({
  image,
}: {
  image: PickedImageAsset;
  purpose: MediaUploadPurpose;
}): Promise<CompressedImageAsset> {
  return {
    uri: ensureFileUri(image.uri),
    fileName: toJpegFileName(image.fileName),
    mimeType: 'image/jpeg',
    width: image.width,
    height: image.height,
    fileSize: image.fileSize,
  };
}

export const MEDIA_MAX_FINAL_BYTES = MAX_FINAL_BYTES;
