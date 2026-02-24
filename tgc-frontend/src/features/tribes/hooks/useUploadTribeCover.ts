import { useMutation } from '@tanstack/react-query';
import type { PickedImageAsset } from '../../../utils/media/pickImage';
import { presignUpload, putFileToSignedUrl } from '../../../services/mediaUpload.service';
import { compressImage } from '../../../utils/media/compressImage';
import Toast from 'react-native-toast-message';

export function useUploadTribeCover() {
    return useMutation({
        mutationFn: async ({
            image,
            tribeId,
        }: {
            image: PickedImageAsset;
            tribeId: string;
        }) => {
            const compressed = await compressImage({ image, purpose: 'tribe-cover' });
            const { uploadUrl, path } = await presignUpload({
                purpose: 'tribe-cover',
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
        },
        onError: (error: any) => {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Could not upload cover.';
            Toast.show({
                type: 'error',
                text1: 'Cover upload failed',
                text2: msg,
                position: 'top',
            });
        },
    });
}
