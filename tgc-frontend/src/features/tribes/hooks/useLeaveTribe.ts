import {useMutation, useQueryClient} from '@tanstack/react-query';
import {leaveTribeApi} from '../api/tribes.api';
import Toast from 'react-native-toast-message';

export function useLeaveTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tribeId: string) => leaveTribeApi(tribeId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tribes']});
      queryClient.invalidateQueries({queryKey: ['myTribes']});
      queryClient.invalidateQueries({queryKey: ['tribe']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});

      Toast.show({
        type: 'info',
        text1: 'Left tribe',
        position: 'top',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        'Could not leave tribe. Try again.';
      Toast.show({
        type: 'error',
        text1: 'Leave failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}
