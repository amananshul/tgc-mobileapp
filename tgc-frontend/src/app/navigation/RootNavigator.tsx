import React, {useEffect} from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {useAppSelector, useAppDispatch} from '../../store/hooks';
import {clearCredentials, restoreSession} from '../../store/slices/authSlice';
import Loader from '../../components/ui/Loader';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import AppStack from './AppStack';
import {TGC_COLORS} from '../../theme/tgcTheme';
import {setAuthSessionExpiredHandler} from '../../services/http/authSessionBridge';
import {queryClient} from '../providers/QueryProvider';

const tgcTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: TGC_COLORS.coral,
    background: TGC_COLORS.bgPrimary,
    card: TGC_COLORS.bgPrimary,
    text: TGC_COLORS.textPrimary,
    border: TGC_COLORS.border,
    notification: TGC_COLORS.coral,
  },
};

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const {isAuthenticated, isRestoringSession, profile, onboardingCompleted} = useAppSelector(
    state => state.auth,
  );

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    setAuthSessionExpiredHandler(async () => {
      queryClient.clear();
      dispatch(clearCredentials());
    });
    return () => setAuthSessionExpiredHandler(null);
  }, [dispatch]);

  if (isRestoringSession) {
    return <Loader />;
  }

  return (
    <NavigationContainer theme={tgcTheme}>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !(onboardingCompleted || profile?.isOnboarded) ? (
        <OnboardingStack />
      ) : (
        <AppStack />
      )}
    </NavigationContainer>
  );
}
