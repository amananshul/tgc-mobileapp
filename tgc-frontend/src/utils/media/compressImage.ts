import ImageResizer from 'react-native-image-resizer';
import type {PickedImageAsset} from './pickImage';

export type MediaUploadPurpose = 'profile' | 'tribe-cover' | 'tribe-post';

export interface CompressedImageAsset {
  uri: string;
  fileName: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  fileSize: number;
}

const MAX_FINAL_BYTES = 3 * 1024 * 1024;

const PURPOSE_CONFIG: Record<
  MediaUploadPurpose,
  {maxWidth: number; maxHeight: number; quality: number}
> = {
  profile: {maxWidth: 512, maxHeight: 512, quality: 75},
  'tribe-cover': {maxWidth: 1280, maxHeight: 720, quality: 75},
  'tribe-post': {maxWidth: 1280, maxHeight: 1280, quality: 75},
};

function ensureFileUri(uri: string) {
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  return `file://${uri}`;
}

function toJpegFileName(originalFileName: string) {
  const base = (originalFileName || `image-${Date.now()}`)
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\w.-]+/g, '-');
  return `${base || `image-${Date.now()}`}.jpg`;
}

async function resizeWithQuality(
  uri: string,
  config: {maxWidth: number; maxHeight: number; quality: number},
  fileName: string,
) {
  const resized = await ImageResizer.createResizedImage(
    uri,
    config.maxWidth,
    config.maxHeight,
    'JPEG',
    config.quality,
  );

  const resizedUri = ensureFileUri(resized.uri || resized.path);

  return {
    uri: resizedUri,
    fileName: resized.name || fileName,
    width: resized.width || config.maxWidth,
    height: resized.height || config.maxHeight,
    fileSize: resized.size || 0,
  };
}

export async function compressImage({
  image,
  purpose,
}: {
  image: PickedImageAsset;
  purpose: MediaUploadPurpose;
}): Promise<CompressedImageAsset> {
  const config = PURPOSE_CONFIG[purpose];
  const fileName = toJpegFileName(image.fileName);
  const sourceUri = ensureFileUri(image.uri);

  let result = await resizeWithQuality(sourceUri, config, fileName);

  if (result.fileSize > MAX_FINAL_BYTES) {
    result = await resizeWithQuality(
      result.uri,
      {...config, quality: 65},
      fileName,
    );
  }

  return {
    uri: result.uri,
    fileName,
    mimeType: 'image/jpeg',
    width: result.width,
    height: result.height,
    fileSize: result.fileSize,
  };
}

export const MEDIA_MAX_FINAL_BYTES = MAX_FINAL_BYTES;

