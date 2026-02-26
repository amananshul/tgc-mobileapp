import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import StoreProvider from './src/app/providers/StoreProvider';
import QueryProvider from './src/app/providers/QueryProvider';
import RootNavigator from './src/app/navigation/RootNavigator';
import {TGC_COLORS} from './src/theme/tgcTheme';
import UIModeProvider from './src/features/ui-mode/UIModeProvider';

export default function App() {
  return (
    <StoreProvider>
      <QueryProvider>
        <UIModeProvider>
          <SafeAreaProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor={TGC_COLORS.bgPrimary}
              translucent={false}
              hidden={false}
            />
            <RootNavigator />
            <Toast />
          </SafeAreaProvider>
        </UIModeProvider>
      </QueryProvider>
    </StoreProvider>
  );
}
