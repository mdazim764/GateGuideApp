import React, { useEffect, useContext } from 'react';
import { StatusBar, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, ThemeContext } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { testKeychain } from './src/utils/KeychainTest';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from './src/context/NotificationContext'; // Add this import

LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

const App = () => {
  // const { theme } = useContext(ThemeContext);
  useEffect(() => {
    if (__DEV__) {
      // Only run in development
      testKeychain().then(result => {
        console.log('Keychain test result:', result ? 'SUCCESS' : 'FAILED');
      });
    }
    if (Platform.OS === 'android') {
      if (parseInt(Platform.Version.toString(), 10) >= 33) {
        // Android 13+ (API 33+) including Android 15
        StatusBar.setBackgroundColor('#BB86FC'); // Light blue for better contrast
        StatusBar.setBarStyle('light-content');
        StatusBar.setTranslucent(true); // Make translucent on newer Android
      } else {
        // Older Android versions
        StatusBar.setBackgroundColor('#0284c7'); // Match header color
        StatusBar.setBarStyle('light-content');
        StatusBar.setTranslucent(false); // Solid status bar on older Android
      }
    }
  }, []);

  // Determine which edges to include based on Android version
  const safeAreaEdges =
    Platform.OS === 'android' && parseInt(Platform.Version.toString(), 10) >= 33
      ? ['left', 'right', 'bottom'] // For newer Android, exclude 'top'
      : ['left', 'right', 'bottom', 'top']; // For older Android, include 'top'

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <NotificationProvider>
                {/* Add this wrapper */}
                <StatusBar barStyle="dark-content" />
                <AppNavigator />
              </NotificationProvider>
              {/* End wrapper */}
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
