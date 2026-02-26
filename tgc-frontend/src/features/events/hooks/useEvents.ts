import {useQuery} from '@tanstack/react-query';
import {listEventsApi} from '../api/events.api';

export function useEvents(params?: {
  search?: string;
  category?: string;
  city?: string;
  tribeId?: string;
  dateFilter?: 'today' | 'weekend' | 'week' | 'all';
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => listEventsApi(params),
  });
}
