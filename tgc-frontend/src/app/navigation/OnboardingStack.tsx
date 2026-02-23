import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import IntentScreen from '../../features/onboarding/screens/IntentScreen';
import IdentityScreen from '../../features/onboarding/screens/IdentityScreen';
import SkillsInterestsScreen from '../../features/onboarding/screens/SkillsInterestsScreen';
import {TGC_COLORS} from '../../theme/tgcTheme';

export type OnboardingStackParamList = {
  Intent: undefined;
  Identity: undefined;
  SkillsInterests: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="Intent"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: TGC_COLORS.bgPrimary},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Intent" component={IntentScreen} />
      <Stack.Screen name="Identity" component={IdentityScreen} />
      <Stack.Screen name="SkillsInterests" component={SkillsInterestsScreen} />
    </Stack.Navigator>
  );
}
