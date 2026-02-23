import {useMutation} from '@tanstack/react-query';
import {registerApi, RegisterPayload} from '../api/auth.api';
import {useAppDispatch} from '../../../store/hooks';
import {storeTokensAndDispatch} from '../../../store/slices/authSlice';

export function useRegister() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: async data => {
      try {
        console.log('[REGISTER] onSuccess — storing tokens...');
        await storeTokensAndDispatch(dispatch, data);
        console.log('[REGISTER] onSuccess — tokens stored, credentials set');
      } catch (err) {
        console.log('[REGISTER] onSuccess ERROR:', err);
        throw err; // re-throw so React Query sees it
      }
    },
  });
}
