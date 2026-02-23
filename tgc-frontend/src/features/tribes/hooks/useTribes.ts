import {useQuery} from '@tanstack/react-query';
import {listTribesApi} from '../api/tribes.api';

export function useTribes(params?: {
  search?: string;
  category?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['tribes', params],
    queryFn: () => listTribesApi(params),
  });
}
