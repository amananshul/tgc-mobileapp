import {useQuery} from '@tanstack/react-query';
import {getMyEventsApi} from '../api/events.api';

export function useMyEvents() {
  return useQuery({
    queryKey: ['myEvents'],
    queryFn: getMyEventsApi,
  });
}
