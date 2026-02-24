import {useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {createTribePostApi} from '../api/tribes.api';
import type {CreateTribePostPayload} from '../../../types/auth';

export function useCreateTribePost(tribeId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTribePostPayload) => {
      if (!tribeId) {
        throw new Error('Missing tribeId');
      }
      return createTribePostApi(tribeId, payload);
    },
    onSuccess: () => {
      if (tribeId) {
        queryClient.invalidateQueries({queryKey: ['tribePosts', tribeId]});
      }
      Toast.show({
        type: 'success',
        text1: 'Post shared',
        position: 'top',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || 'Could not create post. Try again.';
      Toast.show({
        type: 'error',
        text1: 'Post failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}
