import {Image as CompressorImage} from 'react-native-compressor';
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

/** Compression targets per purpose */
const COMPRESSION_OPTIONS: Record<
  MediaUploadPurpose,
  {maxWidth: number; quality: number}
> = {
  profile:       {maxWidth: 600,  quality: 0.5},  // target ~40–80 KB
  'tribe-cover': {maxWidth: 1024, quality: 0.7},
  'event-cover': {maxWidth: 1024, quality: 0.7},
  'tribe-post':  {maxWidth: 800,  quality: 0.65},
};

/**
 * Compresses the picked image using react-native-compressor (New Architecture compatible).
 * Uses manual mode so quality + maxWidth are applied deterministically on both platforms.
 */
export async function compressImage({
  image,
  purpose,
}: {
  image: PickedImageAsset;
  purpose: MediaUploadPurpose;
}): Promise<CompressedImageAsset> {
  const {maxWidth, quality} = COMPRESSION_OPTIONS[purpose];

  const compressedUri = await CompressorImage.compress(
    ensureFileUri(image.uri),
    {
      compressionMethod: 'manual',
      maxWidth,
      quality,
      input: 'uri',
      output: 'jpg',
      returnableOutputType: 'uri',
    },
  );

  return {
    uri: compressedUri,
    fileName: toJpegFileName(image.fileName),
    mimeType: 'image/jpeg',
    width: image.width,
    height: image.height,
    fileSize: image.fileSize,
  };
}

export const MEDIA_MAX_FINAL_BYTES = MAX_FINAL_BYTES;
