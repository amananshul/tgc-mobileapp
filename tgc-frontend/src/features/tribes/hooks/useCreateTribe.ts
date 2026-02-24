import {useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {createTribeApi} from '../api/tribes.api';
import type {CreateTribePayload} from '../../../types/auth';

export function useCreateTribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTribePayload) => createTribeApi(payload),
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: ['tribes']});
      queryClient.invalidateQueries({queryKey: ['myTribes']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
      queryClient.invalidateQueries({queryKey: ['me']});

      Toast.show({
        type: 'success',
        text1: 'Tribe created',
        text2: data.tribe.name,
        position: 'top',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || 'Could not create tribe. Try again.';
      Toast.show({
        type: 'error',
        text1: 'Create tribe failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}
