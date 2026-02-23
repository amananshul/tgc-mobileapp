import {useMutation, useQueryClient} from '@tanstack/react-query';
import {joinTribeApi} from '../api/tribes.api';
import Toast from 'react-native-toast-message';

export function useJoinTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tribeId: string) => joinTribeApi(tribeId),
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: ['tribes']});
      queryClient.invalidateQueries({queryKey: ['myTribes']});
      queryClient.invalidateQueries({queryKey: ['tribe']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});

      Toast.show({
        type: 'success',
        text1: `Joined ${data.tribe.name}!`,
        text2: '+20 karma points earned',
        position: 'top',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || 'Could not join tribe. Try again.';
      Toast.show({
        type: 'error',
        text1: 'Join failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}
