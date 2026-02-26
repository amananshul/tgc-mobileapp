import {useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {deleteEventApi} from '../api/events.api';

export function useDeleteEvent(eventSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteEventApi(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['events']});
      queryClient.invalidateQueries({queryKey: ['myEvents']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
      if (eventSlug) {
        queryClient.invalidateQueries({queryKey: ['event', eventSlug]});
      }

      Toast.show({
        type: 'success',
        text1: 'Event deleted',
        position: 'top',
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not delete event.';
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}

