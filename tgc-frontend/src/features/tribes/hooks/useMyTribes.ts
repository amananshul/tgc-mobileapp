import {useQuery} from '@tanstack/react-query';
import {getMyTribesApi} from '../api/tribes.api';

export function useMyTribes() {
  return useQuery({
    queryKey: ['myTribes'],
    queryFn: getMyTribesApi,
  });
}
