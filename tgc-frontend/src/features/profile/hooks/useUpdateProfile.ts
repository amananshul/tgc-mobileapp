import {useMutation, useQueryClient} from '@tanstack/react-query';
import {updateProfileApi} from '../api/profile.api';
import type {UpdateProfilePayload} from '../../../types/auth';
import {useAppDispatch} from '../../../store/hooks';
import {updateProfile, updateUser} from '../../../store/slices/authSlice';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfileApi(payload),
    onSuccess: data => {
      if (data.user) {
        dispatch(updateUser(data.user));
      }
      dispatch(updateProfile(data.profile));
      queryClient.invalidateQueries({queryKey: ['me']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
    },
  });
}
