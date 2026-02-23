import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppShellScreen from '../../features/app/screens/AppShellScreen';
import ExploreTribesScreen from '../../features/tribes/screens/ExploreTribesScreen';
import TribeDetailScreen from '../../features/tribes/screens/TribeDetailScreen';
import { TGC_COLORS } from '../../theme/tgcTheme';

export type AppStackParamList = {
  AppShell: undefined;
  ExploreTribes: undefined;
  TribeDetail: { slug: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: TGC_COLORS.bgPrimary },
      }}
    >
      <Stack.Screen name="AppShell" component={AppShellScreen} />
      <Stack.Screen name="ExploreTribes" component={ExploreTribesScreen} />
      <Stack.Screen name="TribeDetail" component={TribeDetailScreen} />
    </Stack.Navigator>
  );
}
