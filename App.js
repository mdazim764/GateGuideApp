import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { testKeychain } from './src/utils/KeychainTest';

const App = () => {
  useEffect(() => {
    if (__DEV__) {
      // Only run in development
      testKeychain().then(result => {
        console.log('Keychain test result:', result ? 'SUCCESS' : 'FAILED');
      });
    }
  }, []);

  return (
    <NavigationContainer>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <StatusBar backgroundColor="#6a51ae" barStyle="light-content" />
            <AppNavigator />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
};

export default App;
