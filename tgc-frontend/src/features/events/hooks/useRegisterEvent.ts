import {useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {registerEventApi} from '../api/events.api';

export function useRegisterEvent(slug?: string, tribeSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => registerEventApi(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['events']});
      queryClient.invalidateQueries({queryKey: ['myEvents']});
      queryClient.invalidateQueries({queryKey: ['dashboard']});
      if (slug) {
        queryClient.invalidateQueries({queryKey: ['event', slug]});
      }
      if (tribeSlug) {
        queryClient.invalidateQueries({queryKey: ['tribe', tribeSlug]});
      }
      Toast.show({
        type: 'success',
        text1: "You're registered!",
        text2: 'Check My Passes for your pass code.',
        position: 'top',
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not register.';
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: msg,
        position: 'top',
      });
    },
  });
}
