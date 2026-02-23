import {useQuery} from '@tanstack/react-query';
import {getMeApi} from '../api/profile.api';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMeApi,
    enabled,
  });
}
