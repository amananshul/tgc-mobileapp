import {useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {enableHostApi} from '../api/host.api';
import {useAppDispatch} from '../../../store/hooks';
import {updateUser} from '../../../store/slices/authSlice';

export function useEnableHost() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: enableHostApi,
    onSuccess: data => {
      dispatch(updateUser(data.user));

      queryClient.invalidateQueries({queryKey: ['me']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
      queryClient.invalidateQueries({queryKey: ['myTribes']});
      queryClient.invalidateQueries({queryKey: ['tribes']});

      Toast.show({
        type: 'success',
        text1: 'Host mode enabled',
        text2: 'You can now create tribes.',
        position: 'top',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || 'Could not enable host access.';
      Toast.show({
        type: 'error',
        text1: 'Enable host failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}
