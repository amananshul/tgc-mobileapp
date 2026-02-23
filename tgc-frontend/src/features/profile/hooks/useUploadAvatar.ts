import {useMutation, useQueryClient} from '@tanstack/react-query';
import {uploadAvatarApi} from '../api/profile.api';
import {useAppDispatch} from '../../../store/hooks';
import {updateProfile} from '../../../store/slices/authSlice';

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: uploadAvatarApi,
    onSuccess: data => {
      dispatch(updateProfile(data.profile));
      queryClient.invalidateQueries({queryKey: ['me']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}
