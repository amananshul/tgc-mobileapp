import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppShellScreen from '../../features/app/screens/AppShellScreen';
import ExploreTribesScreen from '../../features/tribes/screens/ExploreTribesScreen';
import TribeDetailScreen from '../../features/tribes/screens/TribeDetailScreen';
import CreateTribeScreen from '../../features/tribes/screens/CreateTribeScreen';
import ExploreEventsScreen from '../../features/events/screens/ExploreEventsScreen';
import EventDetailScreen from '../../features/events/screens/EventDetailScreen';
import CreateEventScreen from '../../features/events/screens/CreateEventScreen';
import MyPassScreen from '../../features/events/screens/MyPassScreen';
import { TGC_COLORS } from '../../theme/tgcTheme';

export type AppStackParamList = {
  AppShell: undefined;
  ExploreTribes: undefined;
  CreateTribe: undefined;
  TribeDetail: { slug: string };
  ExploreEvents: undefined;
  EventDetail: { slug: string };
  CreateEvent: undefined;
  MyPass: {
    passCode: string;
    eventTitle: string;
    eventStartAt: string;
    eventCity: string;
    eventSlug?: string;
  };
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
      <Stack.Screen name="CreateTribe" component={CreateTribeScreen} />
      <Stack.Screen name="TribeDetail" component={TribeDetailScreen} />
      <Stack.Screen name="ExploreEvents" component={ExploreEventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="MyPass" component={MyPassScreen} />
    </Stack.Navigator>
  );
}
