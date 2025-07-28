import React, { useContext } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, ThemeContext } from './src/theme/ThemeContext';

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

// Separate component to use the ThemeContext
const AppContent = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background}
      />
      <AppNavigator />
    </>
  );
};

export default App;
