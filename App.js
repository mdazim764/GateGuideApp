import React, { useEffect, useContext } from 'react';
import {
  StatusBar,
  Platform,
  LogBox,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, ThemeContext } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { testKeychain } from './src/utils/KeychainTest';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from './src/context/NotificationContext';
import { DataProvider } from './src/context/DataContext';
import messaging from '@react-native-firebase/messaging';
import crashlytics from '@react-native-firebase/crashlytics';

LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

// Add this function to handle Android permissions
const requestAndroidNotificationPermissions = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message:
          'GateGuide needs notification permission to send you study reminders and updates.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

// Add this function to your App.js
const requestNotificationPermissions = async () => {
  try {
    // For iOS
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        setTimeout(() => {
          Alert.alert(
            'Notifications Disabled',
            'To receive study reminders and updates, please enable notifications in your device settings.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ],
          );
        }, 1000);
      }
    }
    // For Android
    else if (Platform.OS === 'android') {
      try {
        await messaging().requestPermission();
      } catch (error) {
        console.log('Notification permission rejected:', error);
        setTimeout(() => {
          Alert.alert(
            'Notifications Disabled',
            'To receive study reminders and updates, please enable notifications in your device settings.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ],
          );
        }, 1000);
      }
    }
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
  }
};

const App = () => {
  // Request permissions when the app starts
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      try {
        // For iOS
        if (Platform.OS === 'ios') {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          if (!enabled) {
            setTimeout(() => {
              Alert.alert(
                'Notifications Disabled',
                'To receive study reminders and updates, please enable notifications in your device settings.',
                [
                  { text: 'Later', style: 'cancel' },
                  {
                    text: 'Settings',
                    onPress: () => Linking.openSettings(),
                  },
                ],
              );
            }, 1000);
          }
        }
        // For Android 13+ (API 33+)
        else if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await requestAndroidNotificationPermissions();
          if (!granted) {
            setTimeout(() => {
              Alert.alert(
                'Notifications Disabled',
                'To receive study reminders and updates, please enable notifications in your device settings.',
                [
                  { text: 'Later', style: 'cancel' },
                  {
                    text: 'Settings',
                    onPress: () => Linking.openSettings(),
                  },
                ],
              );
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    requestNotificationPermissions();
  }, []);

  // Rest of your App component remains unchanged
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
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppProvider>
              <NotificationProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </NotificationProvider>
            </AppProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
