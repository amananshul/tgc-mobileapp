import {launchImageLibrary} from 'react-native-image-picker';

export interface PickedImageAsset {
  uri: string;
  fileName: string;
  type: string;
  width: number;
  height: number;
  fileSize: number;
}

/** Hard limit after picker compression (before app-level resizer runs) */
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB

function fallbackFileName(uri: string) {
  const lastPart = uri.split('/').pop() || `image-${Date.now()}.jpg`;
  return lastPart.split('?')[0] || `image-${Date.now()}.jpg`;
}

/**
 * react-native-image-picker on Android sometimes returns fileSize = 0 or
 * undefined even after compression.  As a fallback, fetch the local URI as a
 * blob to get the real byte count.  If the fetch itself fails (rare edge case)
 * we return 0 so the image is still accepted rather than silently erroring.
 */
async function resolveFileSize(uri: string, reportedSize: number): Promise<number> {
  if (reportedSize > 0) {
    return reportedSize; // library gave us a reliable number — use it
  }
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return 0; // can't determine — let the upload attempt proceed
  }
}

/**
 * Opens the device image library and returns a compressed image asset.
 *
 * Compression strategy (applied by react-native-image-picker):
 *   quality: 0.72  → ~72 % JPEG quality
 *   maxWidth/maxHeight: 1280 × 720  → aspect-ratio-preserved resize
 *
 * A typical phone photo (8 MB, 4032×3024) after these settings
 * compresses to roughly 180–350 KB — usually well under the 1 MB pre-check.
 *
 * Throws a user-readable Error if the resolved size exceeds the 1 MB pre-check.
 */
export async function pickImageFromDevice(): Promise<PickedImageAsset | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeBase64: false,
    quality: 0.72 as any,   // JPEG compression
    maxWidth: 1280,  // caps resolution; aspect ratio is preserved by the library
    maxHeight: 720,
  });

  if (result.didCancel) {
    return null;
  }

  if (result.errorCode || result.errorMessage) {
    throw new Error(result.errorMessage || 'Could not open image library');
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    throw new Error('No image selected');
  }

  // On Android the library may report fileSize = 0 after compression.
  // resolveFileSize fetches the blob to get the real byte count.
  const fileSize = await resolveFileSize(asset.uri, asset.fileSize ?? 0);

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Image is too large (${Math.round(fileSize / 1024)} KB). ` +
        'Please choose a smaller photo or crop it first. Max allowed: 1 MB.',
    );
  }

  return {
    uri: asset.uri,
    fileName: asset.fileName || fallbackFileName(asset.uri),
    type: asset.type || 'image/jpeg',
    width: asset.width || 0,
    height: asset.height || 0,
    fileSize,
  };
}
