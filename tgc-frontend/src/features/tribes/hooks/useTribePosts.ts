import {useQuery} from '@tanstack/react-query';
import {listTribePostsApi} from '../api/tribes.api';

export function useTribePosts(tribeId?: string, enabled = true) {
  return useQuery({
    queryKey: ['tribePosts', tribeId],
    queryFn: () => listTribePostsApi(tribeId!),
    enabled: enabled && !!tribeId,
  });
}
