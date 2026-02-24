import {launchImageLibrary} from 'react-native-image-picker';

export interface PickedImageAsset {
  uri: string;
  fileName: string;
  type: string;
  width: number;
  height: number;
  fileSize: number;
}

function fallbackFileName(uri: string) {
  const lastPart = uri.split('/').pop() || `image-${Date.now()}.jpg`;
  return lastPart.split('?')[0] || `image-${Date.now()}.jpg`;
}

export async function pickImageFromDevice(): Promise<PickedImageAsset | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeBase64: false,
    quality: 1,
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

  return {
    uri: asset.uri,
    fileName: asset.fileName || fallbackFileName(asset.uri),
    type: asset.type || 'image/jpeg',
    width: asset.width || 0,
    height: asset.height || 0,
    fileSize: asset.fileSize || 0,
  };
}

