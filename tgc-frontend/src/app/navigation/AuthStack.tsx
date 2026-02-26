import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthLandingScreen from '../../features/auth/screens/AuthLandingScreen';
import OtpVerifyScreen from '../../features/auth/screens/OtpVerifyScreen';
import {TGC_COLORS} from '../../theme/tgcTheme';

export type AuthStackParamList = {
  AuthLanding: undefined;
  OtpVerify: {identifier: string};
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="AuthLanding"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: TGC_COLORS.bgPrimary},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="AuthLanding" component={AuthLandingScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
    </Stack.Navigator>
  );
}
