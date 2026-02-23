import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthIntroScreen from '../../features/auth/screens/AuthIntroScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import {TGC_COLORS} from '../../theme/tgcTheme';

export type AuthStackParamList = {
  Intro: undefined;
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Intro"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: TGC_COLORS.bgPrimary},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Intro" component={AuthIntroScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
