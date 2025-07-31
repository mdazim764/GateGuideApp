import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AppProvider } from './src/context/AppContext'; // <-- Make sure this exists
import AppNavigator from './src/navigation/AppNavigator';

const App = () => (
  <ThemeProvider>
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  </ThemeProvider>
);

export default App;
