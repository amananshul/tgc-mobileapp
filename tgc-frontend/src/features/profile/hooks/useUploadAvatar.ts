import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useAppDispatch} from '../../../store/hooks';
import {updateProfile} from '../../../store/slices/authSlice';
import {uploadAndAttachProfileAvatar} from '../../../services/mediaUpload.service';
import type {PickedImageAsset} from '../../../utils/media/pickImage';
import Toast from 'react-native-toast-message';

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (asset: PickedImageAsset) => uploadAndAttachProfileAvatar(asset),
    onSuccess: data => {
      dispatch(updateProfile(data.profile));
      queryClient.invalidateQueries({queryKey: ['me']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
      queryClient.invalidateQueries({queryKey: ['tribePosts']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || error?.message || 'Could not upload avatar.';
      Toast.show({
        type: 'error',
        text1: 'Avatar upload failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}
