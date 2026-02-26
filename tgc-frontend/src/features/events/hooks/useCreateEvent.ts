import {useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {createEventApi} from '../api/events.api';
import type {CreateEventPayload} from '../../../types/auth';

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEventApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['events']});
      queryClient.invalidateQueries({queryKey: ['myEvents']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
      Toast.show({
        type: 'success',
        text1: 'Event created!',
        text2: 'Your event is now live.',
        position: 'top',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to create event',
        text2: err?.response?.data?.message || 'Please try again.',
        position: 'top',
      });
    },
  });
}
