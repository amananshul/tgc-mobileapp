import {useMutation} from '@tanstack/react-query';
import {loginApi, LoginPayload} from '../api/auth.api';
import {useAppDispatch} from '../../../store/hooks';
import {storeTokensAndDispatch} from '../../../store/slices/authSlice';

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: async data => {
      await storeTokensAndDispatch(dispatch, data);
    },
  });
}
