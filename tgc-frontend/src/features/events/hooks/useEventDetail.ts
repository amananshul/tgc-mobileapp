import {useQuery} from '@tanstack/react-query';
import {getEventDetailApi} from '../api/events.api';

export function useEventDetail(slug: string) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: () => getEventDetailApi(slug),
    enabled: !!slug,
  });
}
