import {useQuery} from '@tanstack/react-query';
import {getTribeDetailApi} from '../api/tribes.api';

export function useTribeDetail(slug: string) {
  return useQuery({
    queryKey: ['tribe', slug],
    queryFn: () => getTribeDetailApi(slug),
    enabled: !!slug,
  });
}
