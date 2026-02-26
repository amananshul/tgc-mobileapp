import {useMutation, useQueryClient} from '@tanstack/react-query';
import {saveOnboardingApi} from '../api/profile.api';
import type {SaveOnboardingPayload} from '../../../types/auth';
import {useAppDispatch} from '../../../store/hooks';
import {updateProfile, updateUser} from '../../../store/slices/authSlice';

export function useSaveOnboarding() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: SaveOnboardingPayload) => saveOnboardingApi(payload),
    onSuccess: data => {
      dispatch(updateUser(data.user));
      dispatch(updateProfile(data.profile));
      queryClient.invalidateQueries({queryKey: ['me']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
      queryClient.invalidateQueries({queryKey: ['events']});
      queryClient.invalidateQueries({queryKey: ['myEvents']});
      queryClient.invalidateQueries({queryKey: ['tribes']});
      queryClient.invalidateQueries({queryKey: ['myTribes']});
    },
  });
}
